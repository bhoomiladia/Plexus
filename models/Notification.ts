import mongoose, { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        "APPLICATION_ACCEPTED",
        "APPLICATION_REJECTED",
        "APPLICATION_SHORTLISTED",
        "NEW_APPLICATION",
        "MEMBER_ADDED",
        "MEMBER_REMOVED",
        "PROJECT_UPDATED",
        "NEW_MESSAGE",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // URL to navigate to
    read: { type: Boolean, default: false },
    metadata: {
      projectId: { type: Schema.Types.ObjectId, ref: "Project" },
      applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
      chatId: { type: Schema.Types.ObjectId, ref: "Chat" },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const Notification =
  models.Notification || model("Notification", NotificationSchema);

export default Notification;
