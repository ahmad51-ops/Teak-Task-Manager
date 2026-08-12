import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Task must belong to a project"],
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must have a creator"],
    },
    status: {
      type: String,
      enum: {
        values: ["todo", "in-progress", "review", "done"],
        message: "{VALUE} is not a valid status",
      },
      default: "todo",
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "medium", "high", "urgent"],
        message: "{VALUE} is not a valid priority",
      },
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
        publicId: { type: String, required: true },
        resourceType: { type: String, default: "image" },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// --- Indexes ---
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ title: "text", description: "text" });
// Phase 16 added sort-by-dueDate; Phase 18 adds the index that sort
// actually needs — without it, sorting by dueDate on any collection of
// real size falls back to an in-memory sort instead of using an index.
taskSchema.index({ dueDate: 1 });

export const Task = mongoose.model("Task", taskSchema);
