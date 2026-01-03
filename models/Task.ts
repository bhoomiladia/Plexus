import mongoose, { Schema, model, models } from "mongoose";

const TaskSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "verified"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: { type: Date },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    assignedTo: { type: String }, // User email for team tasks
    assignedToName: { type: String }, // User name for display
    verifiedBy: { type: String }, // Name of person who verified
    verifiedAt: { type: Date }, // When task was verified
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Indexes for efficient queries
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ projectId: 1 });

const Task = models.Task || model("Task", TaskSchema);

export default Task;
