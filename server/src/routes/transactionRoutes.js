
import express from "express";
import mongoose from "mongoose";

import Transaction from "../models/Transaction.js";
import protect from "../middleware/authMiddleware.js";
import checkSpendingAlerts from "../utils/checkSpendingAlerts.js";

const router = express.Router();

// Helper: run spending checks without failing the transaction operation
const refreshSpendingAlerts = async (userId, dates = []) => {
  const uniqueDates = [
    ...new Map(
      dates
        .filter(Boolean)
        .map((date) => {
          const parsedDate = new Date(date);

          return [
            `${parsedDate.getFullYear()}-${parsedDate.getMonth()}`,
            parsedDate,
          ];
        })
    ).values(),
  ];

  for (const date of uniqueDates) {
    try {
      await checkSpendingAlerts(userId, date);
    } catch (error) {
      console.error("Spending alert update failed:", error.message);
    }
  }
};

// GET all transactions for the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.userId,
    }).sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch transactions.",
    });
  }
});

// CREATE a transaction
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      date,
      notes,
    } = req.body;

    if (
      !title ||
      !category ||
      !["income", "expense"].includes(type) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details.",
      });
    }

    const transaction = await Transaction.create({
      user: req.userId,
      title,
      amount: Number(amount),
      type,
      category,
      date: date || new Date(),
      notes: notes || "",
    });

    await refreshSpendingAlerts(
      req.userId,
      [transaction.date]
    );

    res.status(201).json({
      success: true,
      message: "Transaction created successfully.",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to create transaction.",
    });
  }
});

// UPDATE a transaction
router.put("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const {
      title,
      amount,
      type,
      category,
      date,
      notes,
    } = req.body;

    if (
      !title ||
      !category ||
      !["income", "expense"].includes(type) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details.",
      });
    }

    const existingTransaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    const previousDate = existingTransaction.date;

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId,
      },
      {
        title,
        amount: Number(amount),
        type,
        category,
        date: date || existingTransaction.date,
        notes: notes || "",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await refreshSpendingAlerts(
      req.userId,
      [previousDate, transaction.date]
    );

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully.",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update transaction.",
    });
  }
});

// DELETE a transaction
router.delete("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    await refreshSpendingAlerts(
      req.userId,
      [transaction.date]
    );

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete transaction.",
    });
  }
});

export default router;
