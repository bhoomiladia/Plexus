import mongoose, { Schema, model, models } from "mongoose";

const ApplicationSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    roleId: { type: String, required: true }, // References the _id inside Project.roles
    userId: { type: String, required: true }, // session.user.id
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED", "REMOVED"], 
      default: "PENDING" 
    },
    message: { type: String }, // Optional cover letter/note
  },
  { timestamps: true } 
);

const Application = models.Application || model("Application", ApplicationSchema);

export default Application;