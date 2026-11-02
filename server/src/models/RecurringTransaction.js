
import mongoose from "mongoose";

const recurringTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    nextDueDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastGeneratedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

recurringTransactionSchema.index({
  user: 1,
  nextDueDate: 1,
  isActive: 1,
});

const RecurringTransaction = mongoose.model(
  "RecurringTransaction",
  recurringTransactionSchema
);

export default RecurringTransaction;
