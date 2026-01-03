import mongoose, { Schema, model, models } from "mongoose";

const CertificateSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    taskTitle: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    projectName: { type: String },
    certificateId: { type: String, required: true, unique: true },
    certificateHash: { type: String, required: true }, // SHA-256 hash stored on blockchain
    imageUrl: { type: String }, // Generated certificate image URL
    totalTasksCompleted: { type: Number, default: 1 },
    role: { type: String, default: "Contributor" },
    issuedAt: { type: Date, default: Date.now },
    // Blockchain data
    blockchain: {
      network: { type: String, default: "solana-devnet" },
      transactionSignature: { type: String },
      mintAddress: { type: String },
      metadataUri: { type: String },
      explorerUrl: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "minted", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

CertificateSchema.index({ certificateId: 1 });
CertificateSchema.index({ userId: 1, taskId: 1 });
CertificateSchema.index({ "blockchain.transactionSignature": 1 });

const Certificate = models.Certificate || model("Certificate", CertificateSchema);

export default Certificate;
