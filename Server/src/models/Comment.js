import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Comment must belong to a task"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment must have an author"],
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
  },
  { timestamps: true }
);

// --- Indexes ---
// Comments are always fetched "for this task, oldest first" — compound
// index matches that exact query + sort combo.
commentSchema.index({ task: 1, createdAt: 1 });

export const Comment = mongoose.model("Comment", commentSchema);
