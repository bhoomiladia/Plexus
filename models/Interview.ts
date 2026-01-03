import mongoose, { Schema, model, models } from "mongoose";

const InterviewSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true },
    roleId: { type: String, required: true },
    roleName: { type: String, required: true },
    candidateId: { type: String, required: true },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    ownerId: { type: String, required: true },
    ownerName: { type: String },
    projectTitle: { type: String, required: true },
    projectDescription: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "EXPIRED", "CANCELLED"],
      default: "PENDING",
    },
    result: {
      type: String,
      enum: ["PASS", "FAIL", "PENDING"],
      default: "PENDING",
    },
    messages: [{
      role: { type: String, enum: ["user", "assistant", "system"] },
      content: { type: String },
      timestamp: { type: Date, default: Date.now },
    }],
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    duration: { type: Number }, // in seconds
    tabSwitches: { type: Number, default: 0 },
    aiVerdict: { type: String },
    ownerNotes: { type: String },
  },
  { timestamps: true }
);

// Index for efficient queries
InterviewSchema.index({ candidateId: 1, status: 1 });
InterviewSchema.index({ projectId: 1, status: 1 });

const Interview = models.Interview || model("Interview", InterviewSchema);

export default Interview;
