
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
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
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    dedupeKey: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Retrieve notifications in newest-first order
notificationSchema.index({
  user: 1,
  createdAt: -1,
});

// Prevent duplicate spending alerts for the same user
notificationSchema.index(
  { user: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      dedupeKey: { $type: "string" },
    },
  }
);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;
