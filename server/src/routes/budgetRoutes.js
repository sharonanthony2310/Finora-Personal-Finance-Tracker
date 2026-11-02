
import express from "express";
import mongoose from "mongoose";

import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

import protect from "../middleware/authMiddleware.js";
import checkSpendingAlerts from "../utils/checkSpendingAlerts.js";

const router = express.Router();

// Helper: validate budget details
const validateBudget = (category, amount, month, year) => {
  if (
    !category ||
    typeof category !== "string" ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0 ||
    !Number.isInteger(Number(month)) ||
    Number(month) < 1 ||
    Number(month) > 12 ||
    !Number.isInteger(Number(year)) ||
    Number(year) < 2000
  ) {
    return false;
  }

  return true;
};

// GET all budgets for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const budgets = await Budget.find({
      user: req.userId,
    }).sort({ year: -1, month: -1, category: 1 });

    res.status(200).json({
      success: true,
      budgets,
    });
  } catch (error) {
    console.error("Fetch budgets error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch budgets.",
    });
  }
});

// CREATE a budget
router.post("/", protect, async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    if (!validateBudget(category, amount, month, year)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid budget details.",
      });
    }

    const budget = await Budget.create({
      user: req.userId,
      category: category.trim(),
      amount: Number(amount),
      month: Number(month),
      year: Number(year),
    });

    // Recalculate spending alerts for this budget month
    try {
      await checkSpendingAlerts(
        req.userId,
        new Date(budget.year, budget.month - 1, 1)
      );
    } catch (alertError) {
      console.error(
        "Budget spending alert error:",
        alertError.message
      );
    }

    res.status(201).json({
      success: true,
      message: "Budget created successfully.",
      budget,
    });
  } catch (error) {
    // Handle duplicate category/month/year budget
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget already exists for this category and month.",
      });
    }

    console.error("Create budget error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create budget.",
    });
  }
});

// UPDATE a budget
router.put("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID.",
      });
    }

    const { category, amount, month, year } = req.body;

    if (!validateBudget(category, amount, month, year)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid budget details.",
      });
    }

    const existingBudget = await Budget.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!existingBudget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    const previousBudget = {
      category: existingBudget.category,
      month: existingBudget.month,
      year: existingBudget.year,
    };

    const budget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId,
      },
      {
        category: category.trim(),
        amount: Number(amount),
        month: Number(month),
        year: Number(year),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Remove alerts belonging to the old budget details
    const oldKeys = [
      `budget-${previousBudget.year}-${previousBudget.month}-${previousBudget.category}-80`,
      `budget-${previousBudget.year}-${previousBudget.month}-${previousBudget.category}-100`,
    ];

    const newKeys = [
      `budget-${budget.year}-${budget.month}-${budget.category}-80`,
      `budget-${budget.year}-${budget.month}-${budget.category}-100`,
    ];

    const keysToRemove = oldKeys.filter(
      (key) => !newKeys.includes(key)
    );

    if (keysToRemove.length > 0) {
      await Notification.deleteMany({
        user: req.userId,
        dedupeKey: { $in: keysToRemove },
      });
    }

    // Recalculate alerts for both old and new budget months
    const dates = [
      new Date(previousBudget.year, previousBudget.month - 1, 1),
      new Date(budget.year, budget.month - 1, 1),
    ];

    for (const date of dates) {
      try {
        await checkSpendingAlerts(req.userId, date);
      } catch (alertError) {
        console.error(
          "Budget alert recalculation error:",
          alertError.message
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Budget updated successfully.",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget already exists for this category and month.",
      });
    }

    console.error("Update budget error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to update budget.",
    });
  }
});

// DELETE a budget
router.delete("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID.",
      });
    }

    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found.",
      });
    }

    // Remove notifications associated with this budget
    await Notification.deleteMany({
      user: req.userId,
      dedupeKey: {
        $in: [
          `budget-${budget.year}-${budget.month}-${budget.category}-80`,
          `budget-${budget.year}-${budget.month}-${budget.category}-100`,
        ],
      },
    });

    res.status(200).json({
      success: true,
      message: "Budget deleted successfully.",
    });
  } catch (error) {
    console.error("Delete budget error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to delete budget.",
    });
  }
});

// GET budget summary for a selected month and year
router.get("/summary", protect, async (req, res) => {
  try {
    const currentDate = new Date();

    const month = Number(
      req.query.month || currentDate.getMonth() + 1
    );

    const year = Number(
      req.query.year || currentDate.getFullYear()
    );

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year.",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const budgets = await Budget.find({
      user: req.userId,
      month,
      year,
    });

    const transactions = await Transaction.find({
      user: req.userId,
      type: "expense",
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const summary = budgets.map((budget) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.category === budget.category
        )
        .reduce(
          (total, transaction) => total + transaction.amount,
          0
        );

      const remaining = budget.amount - spent;

      const percentage =
        (spent / budget.amount) * 100;

      return {
        _id: budget._id,
        category: budget.category,
        amount: budget.amount,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
      };
    });

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Budget summary error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to generate budget summary.",
    });
  }
});

export default router;
