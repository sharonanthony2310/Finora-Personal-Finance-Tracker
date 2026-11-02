import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    savedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    targetDate: {
      type: Date,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Emergency Fund",
        "Travel",
        "Education",
        "Shopping",
        "Vehicle",
        "Other",
      ],
      default: "Other",
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ user: 1, createdAt: -1 });

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;