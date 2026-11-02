 import express from "express";
import mongoose from "mongoose";
import Goal from "../models/Goal.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all goals belonging to the logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      goals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch savings goals.",
    });
  }
});

// Create a new savings goal
router.post("/", protect, async (req, res) => {
  try {
    const {
      name,
      description,
      targetAmount,
      targetDate,
      category,
    } = req.body;

    if (!name || !targetAmount || !targetDate) {
      return res.status(400).json({
        success: false,
        message: "Name, target amount and target date are required.",
      });
    }

    if (
      !Number.isFinite(Number(targetAmount)) ||
      Number(targetAmount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Target amount must be greater than zero.",
      });
    }

    if (Number.isNaN(Date.parse(targetDate))) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid target date.",
      });
    }

    const goal = await Goal.create({
      user: req.userId,
      name,
      description,
      targetAmount: Number(targetAmount),
      targetDate,
      category,
    });

    res.status(201).json({
      success: true,
      message: "Savings goal created successfully.",
      goal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to create savings goal.",
    });
  }
});

// Update a savings goal
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID.",
      });
    }

    const goal = await Goal.findOne({
      _id: id,
      user: req.userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found.",
      });
    }

    const {
      name,
      description,
      targetAmount,
      targetDate,
      category,
    } = req.body;

    if (targetAmount !== undefined) {
      const amount = Number(targetAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Target amount must be greater than zero.",
        });
      }

      if (amount < goal.savedAmount) {
        return res.status(400).json({
          success: false,
          message: "Target amount cannot be lower than the amount already saved.",
        });
      }

      goal.targetAmount = amount;
    }

    if (name !== undefined) goal.name = name;
    if (description !== undefined) goal.description = description;
    if (category !== undefined) goal.category = category;

    if (targetDate !== undefined) {
      if (Number.isNaN(Date.parse(targetDate))) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid target date.",
        });
      }

      goal.targetDate = targetDate;
    }

    goal.status =
      goal.savedAmount >= goal.targetAmount
        ? "completed"
        : "active";

    await goal.save();

    res.status(200).json({
      success: true,
      message: "Savings goal updated successfully.",
      goal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update savings goal.",
    });
  }
});

// Add money to a savings goal
router.post("/:id/contribute", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const amount = Number(req.body.amount);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID.",
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Contribution must be greater than zero.",
      });
    }

    const goal = await Goal.findOne({
      _id: id,
      user: req.userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found.",
      });
    }

    goal.savedAmount += amount;

    if (goal.savedAmount >= goal.targetAmount) {
      goal.status = "completed";
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: "Contribution added successfully.",
      goal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to add contribution.",
    });
  }
});

// Delete a savings goal
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID.",
      });
    }

    const goal = await Goal.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Savings goal deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete savings goal.",
    });
  }
});

export default router;