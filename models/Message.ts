import mongoose, { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    senderId: { type: String, required: true }, // session.user.id
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    content: { type: String, required: true },
    readBy: [{ type: String }], // Array of user IDs who have read the message
  },
  { timestamps: true }
);

// Index for faster queries
MessageSchema.index({ projectId: 1, createdAt: -1 });

const Message = models.Message || model("Message", MessageSchema);

export default Message;
