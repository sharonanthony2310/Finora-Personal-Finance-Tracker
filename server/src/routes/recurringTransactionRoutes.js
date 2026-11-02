
import express from "express";
import mongoose from "mongoose";

import RecurringTransaction from "../models/RecurringTransaction.js";
import Transaction from "../models/Transaction.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

const validFrequencies = ["daily", "weekly", "monthly", "yearly"];
const validTypes = ["income", "expense"];

// Calculate the next occurrence of a recurring transaction
const getNextDueDate = (date, frequency) => {
  const nextDate = new Date(date);

  if (frequency === "daily") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  }

  if (frequency === "weekly") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 7);
  }

  if (frequency === "monthly") {
    const originalDay = nextDate.getUTCDate();

    nextDate.setUTCDate(1);
    nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);

    const lastDay = new Date(
      Date.UTC(
        nextDate.getUTCFullYear(),
        nextDate.getUTCMonth() + 1,
        0
      )
    ).getUTCDate();

    nextDate.setUTCDate(Math.min(originalDay, lastDay));
  }

  if (frequency === "yearly") {
    const originalMonth = nextDate.getUTCMonth();
    const originalDay = nextDate.getUTCDate();

    nextDate.setUTCDate(1);
    nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
    nextDate.setUTCMonth(originalMonth);

    const lastDay = new Date(
      Date.UTC(
        nextDate.getUTCFullYear(),
        originalMonth + 1,
        0
      )
    ).getUTCDate();

    nextDate.setUTCDate(Math.min(originalDay, lastDay));
  }

  return nextDate;
};

// Validate recurring transaction input
const validateRecurringData = (data) => {
  const {
    title,
    amount,
    type,
    category,
    frequency,
    startDate,
    endDate,
  } = data;

  if (
    !title ||
    !category ||
    amount === undefined ||
    !type ||
    !frequency ||
    !startDate
  ) {
    return "Please provide all required fields.";
  }

  if (
    typeof title !== "string" ||
    title.trim().length === 0 ||
    title.trim().length > 100
  ) {
    return "Title must contain between 1 and 100 characters.";
  }

  if (
    typeof category !== "string" ||
    category.trim().length === 0
  ) {
    return "Please provide a valid category.";
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return "Amount must be greater than zero.";
  }

  if (!validTypes.includes(type)) {
    return "Transaction type must be income or expense.";
  }

  if (!validFrequencies.includes(frequency)) {
    return "Please select a valid frequency.";
  }

  if (Number.isNaN(Date.parse(startDate))) {
    return "Please provide a valid start date.";
  }

  if (
    endDate &&
    (
      Number.isNaN(Date.parse(endDate)) ||
      new Date(endDate) < new Date(startDate)
    )
  ) {
    return "End date must be valid and cannot be before the start date.";
  }

  return null;
};

// Get all recurring schedules
router.get("/", protect, async (req, res) => {
  try {
    const schedules = await RecurringTransaction.find({
      user: req.userId,
    }).sort({ nextDueDate: 1 });

    res.status(200).json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error("Fetch recurring schedules error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch recurring transactions.",
    });
  }
});

// Create a recurring schedule
router.post("/", protect, async (req, res) => {
  try {
    const validationError = validateRecurringData(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      title,
      amount,
      type,
      category,
      notes,
      frequency,
      startDate,
      endDate,
    } = req.body;

    const schedule = await RecurringTransaction.create({
      user: req.userId,
      title: title.trim(),
      amount: Number(amount),
      type,
      category: category.trim(),
      notes: notes || "",
      frequency,
      startDate,
      nextDueDate: startDate,
      endDate: endDate || null,
    });

    res.status(201).json({
      success: true,
      message: "Recurring transaction created successfully.",
      schedule,
    });
  } catch (error) {
    console.error("Create recurring schedule error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create recurring transaction.",
    });
  }
});

// Update a recurring schedule
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    const schedule = await RecurringTransaction.findOne({
      _id: id,
      user: req.userId,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found.",
      });
    }

    const {
      title,
      amount,
      type,
      category,
      notes,
      frequency,
      startDate,
      endDate,
    } = req.body;

    const updatedData = {
      title: title ?? schedule.title,
      amount: amount ?? schedule.amount,
      type: type ?? schedule.type,
      category: category ?? schedule.category,
      notes: notes ?? schedule.notes,
      frequency: frequency ?? schedule.frequency,
      startDate: startDate ?? schedule.startDate,
      endDate: endDate !== undefined ? endDate : schedule.endDate,
    };

    const validationError = validateRecurringData(updatedData);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    schedule.title = updatedData.title.trim();
    schedule.amount = Number(updatedData.amount);
    schedule.type = updatedData.type;
    schedule.category = updatedData.category.trim();
    schedule.notes = updatedData.notes || "";
    schedule.frequency = updatedData.frequency;

    if (startDate !== undefined) {
      schedule.startDate = startDate;
      schedule.nextDueDate = startDate;
      schedule.lastGeneratedDate = null;
    }

    schedule.endDate = updatedData.endDate || null;

    await schedule.save();

    res.status(200).json({
      success: true,
      message: "Recurring transaction updated successfully.",
      schedule,
    });
  } catch (error) {
    console.error("Update recurring schedule error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to update recurring transaction.",
    });
  }
});

// Pause or resume a recurring schedule
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const schedule = await RecurringTransaction.findOneAndUpdate(
      {
        _id: id,
        user: req.userId,
      },
      {
        isActive,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: isActive
        ? "Recurring transaction resumed."
        : "Recurring transaction paused.",
      schedule,
    });
  } catch (error) {
    console.error("Change recurring status error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to change recurring transaction status.",
    });
  }
});

// Generate transactions for schedules that are due
router.post("/process-due", protect, async (req, res) => {
  try {
    const now = new Date();

    const schedules = await RecurringTransaction.find({
      user: req.userId,
      isActive: true,
      nextDueDate: { $lte: now },
    });

    let generatedCount = 0;

    for (const schedule of schedules) {
      let dueDate = new Date(schedule.nextDueDate);
      let latestGeneratedDate = null;

      while (
        dueDate <= now &&
        (!schedule.endDate || dueDate <= schedule.endDate)
      ) {
        // Create a transaction using the scheduled due date
        await Transaction.create({
          user: schedule.user,
          title: schedule.title,
          amount: schedule.amount,
          type: schedule.type,
          category: schedule.category,
          date: dueDate,
          notes: schedule.notes,
        });

        latestGeneratedDate = new Date(dueDate);
        generatedCount++;

        dueDate = getNextDueDate(dueDate, schedule.frequency);
      }

      schedule.lastGeneratedDate = latestGeneratedDate;

      if (
        schedule.endDate &&
        dueDate > schedule.endDate
      ) {
        schedule.isActive = false;
      }

      schedule.nextDueDate = dueDate;

      await schedule.save();
    }

    res.status(200).json({
      success: true,
      message: "Due recurring transactions processed.",
      generatedCount,
    });
  } catch (error) {
    console.error("Process recurring transactions error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to process due transactions.",
    });
  }
});

// Delete a recurring schedule
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    const schedule = await RecurringTransaction.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Recurring transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Delete recurring schedule error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to delete recurring transaction.",
    });
  }
});

export default router;
