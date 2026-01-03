import Notification from "@/models/Notification";

interface CreateNotificationParams {
  userId: string;
  type:
    | "APPLICATION_ACCEPTED"
    | "APPLICATION_REJECTED"
    | "APPLICATION_SHORTLISTED"
    | "NEW_APPLICATION"
    | "MEMBER_ADDED"
    | "MEMBER_REMOVED"
    | "PROJECT_UPDATED"
    | "NEW_MESSAGE";
  title: string;
  message: string;
  link?: string;
  metadata?: {
    projectId?: string;
    applicationId?: string;
    chatId?: string;
  };
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await Notification.create(params);
    return { success: true, notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

// Helper functions for common notification types
export async function notifyApplicationAccepted(
  userId: string,
  projectTitle: string,
  roleName: string,
  projectId: string,
  applicationId: string
) {
  return createNotification({
    userId,
    type: "APPLICATION_ACCEPTED",
    title: "Application Accepted! 🎉",
    message: `Your application for ${roleName} in "${projectTitle}" has been accepted!`,
    link: `/dashboard/projects/manage/${projectId}`,
    metadata: { projectId, applicationId },
  });
}

export async function notifyApplicationRejected(
  userId: string,
  projectTitle: string,
  roleName: string,
  projectId: string,
  applicationId: string
) {
  return createNotification({
    userId,
    type: "APPLICATION_REJECTED",
    title: "Application Update",
    message: `Your application for ${roleName} in "${projectTitle}" was not accepted this time.`,
    link: `/dashboard/projects/${projectId}`,
    metadata: { projectId, applicationId },
  });
}

export async function notifyApplicationShortlisted(
  userId: string,
  projectTitle: string,
  roleName: string,
  projectId: string,
  applicationId: string
) {
  return createNotification({
    userId,
    type: "APPLICATION_SHORTLISTED",
    title: "You've Been Shortlisted! ⭐",
    message: `You've been shortlisted for ${roleName} in "${projectTitle}". The owner will review your application soon.`,
    link: `/dashboard/notifications`,
    metadata: { projectId, applicationId },
  });
}

export async function notifyNewApplication(
  ownerId: string,
  applicantName: string,
  projectTitle: string,
  roleName: string,
  projectId: string,
  applicationId: string
) {
  return createNotification({
    userId: ownerId,
    type: "NEW_APPLICATION",
    title: "New Application Received",
    message: `${applicantName} applied for ${roleName} in "${projectTitle}"`,
    link: `/dashboard/projects/manage/${projectId}`,
    metadata: { projectId, applicationId },
  });
}

export async function notifyMemberAdded(
  userId: string,
  projectTitle: string,
  roleName: string,
  projectId: string
) {
  return createNotification({
    userId,
    type: "MEMBER_ADDED",
    title: "Added to Project Team! 🎉",
    message: `You've been added as ${roleName} to "${projectTitle}"`,
    link: `/dashboard/projects/manage/${projectId}`,
    metadata: { projectId },
  });
}

export async function notifyMemberRemoved(
  userId: string,
  projectTitle: string,
  projectId: string
) {
  return createNotification({
    userId,
    type: "MEMBER_REMOVED",
    title: "Removed from Project",
    message: `You've been removed from "${projectTitle}"`,
    link: `/dashboard/projects`,
    metadata: { projectId },
  });
}

export async function notifyProjectUpdated(
  userId: string,
  projectTitle: string,
  projectId: string,
  updateDetails: string
) {
  return createNotification({
    userId,
    type: "PROJECT_UPDATED",
    title: "Project Updated",
    message: `"${projectTitle}" has been updated: ${updateDetails}`,
    link: `/dashboard/projects/manage/${projectId}`,
    metadata: { projectId },
  });
}

export async function notifyNewMessage(
  userId: string,
  senderName: string,
  projectTitle: string,
  projectId: string
) {
  return createNotification({
    userId,
    type: "NEW_MESSAGE",
    title: "New Message",
    message: `${senderName} sent a message in "${projectTitle}"`,
    link: `/dashboard/chat?projectId=${projectId}`,
    metadata: { projectId },
  });
}
