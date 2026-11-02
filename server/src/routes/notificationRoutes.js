
import express from "express";

import Notification from "../models/Notification.js";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all notifications for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      user: req.userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch notifications.",
    });
  }
});

// Generate spending alerts for the current month
router.post("/check-spending", protect, async (req, res) => {
  try {
    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Fetch this user's budgets for the current month
    const budgets = await Budget.find({
      user: req.userId,
      month,
      year,
    });

    // Fetch this user's expenses for the current month
    const transactions = await Transaction.find({
      user: req.userId,
      type: "expense",
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    let alertsCreated = 0;

    for (const budget of budgets) {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.category === budget.category
        )
        .reduce(
          (total, transaction) => total + transaction.amount,
          0
        );

      const percentage = (spent / budget.amount) * 100;

      const thresholds = [
        {
          limit: 80,
          type: "warning",
          title: "Budget Warning",
          message: `You have used ${Math.round(
            percentage
          )}% of your ${budget.category} budget. You have spent ₹${spent.toFixed(
            2
          )} out of ₹${budget.amount.toFixed(2)}.`,
        },
        {
          limit: 100,
          type: "danger",
          title: "Budget Limit Reached",
          message: `You have reached or exceeded your ${budget.category} budget. You have spent ₹${spent.toFixed(
            2
          )} against a budget of ₹${budget.amount.toFixed(2)}.`,
        },
      ];

      for (const threshold of thresholds) {
        if (percentage < threshold.limit) {
          continue;
        }

        const dedupeKey = `budget-${year}-${month}-${budget.category}-${threshold.limit}`;

        try {
          const result = await Notification.updateOne(
            {
              user: req.userId,
              dedupeKey,
            },
            {
              $setOnInsert: {
                user: req.userId,
                title: threshold.title,
                message: threshold.message,
                type: threshold.type,
                isRead: false,
                dedupeKey,
              },
            },
            {
              upsert: true,
            }
          );

          if (result.upsertedCount > 0) {
            alertsCreated++;
          }
        } catch (error) {
          // Ignore duplicate-key errors caused by simultaneous requests.
          if (error.code !== 11000) {
            throw error;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Spending alerts checked successfully.",
      alertsCreated,
    });
  } catch (error) {
    console.error("Spending alert error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to check spending alerts.",
    });
  }
});

// Mark all notifications as read
router.patch("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
});

// Mark one notification as read
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
});

// Delete one notification
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete notification.",
    });
  }
});

export default router;
