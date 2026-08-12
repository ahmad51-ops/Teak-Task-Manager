import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [3, "Project name must be at least 3 characters"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project must have an owner"],
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: {
            values: ["owner", "admin", "member"],
            message: "{VALUE} is not a valid member role",
          },
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["active", "archived"],
        message: "{VALUE} is not a valid status",
      },
      default: "active",
    },
  },
  { timestamps: true }
);

// --- Indexes ---
projectSchema.index({ "members.user": 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ name: "text", description: "text" });
// Phase 16 added sort-by-name; same reasoning as Task.dueDate above.
projectSchema.index({ name: 1 });

export const Project = mongoose.model("Project", projectSchema);
