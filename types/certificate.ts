export interface Certificate {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  taskId: string;
  taskTitle: string;
  projectId?: string;
  projectName: string;
  certificateId: string;
  certificateHash: string;
  imageUrl?: string;
  totalTasksCompleted: number;
  role: string;
  issuedAt: string;
  blockchain: {
    network: string;
    transactionSignature?: string;
    mintAddress?: string;
    metadataUri?: string;
    explorerUrl?: string;
  };
  status: "pending" | "minted" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface CertificatePreviewData {
  _id: string;
  certificateId: string;
  certificateHash: string;
  userName: string;
  taskTitle: string;
  projectName: string;
  role: string;
  totalTasksCompleted: number;
  issuedAt: string;
  status: "pending" | "minted" | "failed";
  blockchain?: {
    network: string;
    transactionSignature?: string;
    explorerUrl?: string;
  };
}

export interface BlockchainResult {
  success: boolean;
  transactionSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export interface WalletInfo {
  configured: boolean;
  publicKey?: string;
  balance?: number;
  network?: string;
  explorerUrl?: string;
  message?: string;
  error?: string;
}
