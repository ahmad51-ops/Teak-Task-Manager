import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must have a recipient"],
    },
    type: {
      type: String,
      enum: {
        values: [
          "task_assigned",
          "task_status_changed",
          "task_updated",
          "comment_added",
          "project_invite",
          "project_updated",
          "due_date_reminder",
        ],
        message: "{VALUE} is not a valid notification type",
      },
      required: [true, "Notification type is required"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    // Optional context links — not every notification touches both.
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// --- Indexes ---
// The bell-icon query: "this user's unread notifications, newest first."
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
