import mongoose, { Schema, model, models } from "mongoose";

const RoleSchema = new Schema({
  roleName: { type: String, required: true },
  mandatorySkills: [{ type: String }], // Used for the dashboard matching
  optionalSkills: [{ type: String }],
  needed: { type: Number, default: 1 },
  filled: { type: Number, default: 0 },
});

const AuthorizedPersonnelSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
});

const ProjectSchema = new Schema(
  {
    ownerId: { type: String, required: true }, // Ties to session.user.id
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["OPEN", "COMPLETED"], 
      default: "OPEN" 
    },
    roles: [RoleSchema],
    githubLink: { type: String },
    demoLink: { type: String },
    authorizedPersonnel: [AuthorizedPersonnelSchema], // Users with direct access
  },
  { timestamps: true }
);

// This ensures we don't redefine the model during hot reloads in Next.js
const Project = models.Project || model("Project", ProjectSchema);

export default Project;