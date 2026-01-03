import mongoose, { Schema, model, models } from "mongoose";

const ResponseSchema = new Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  author: { type: String, required: true },
  text: { type: String, required: true },
  isAI: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const IssueSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    responses: [ResponseSchema],
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    status: {
      type: String,
      enum: ["open", "resolved", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

// Index for efficient queries
IssueSchema.index({ userId: 1, status: 1, createdAt: -1 });
IssueSchema.index({ tags: 1 });
IssueSchema.index({ title: "text", content: "text" });

const Issue = models.Issue || model("Issue", IssueSchema);

export default Issue;
