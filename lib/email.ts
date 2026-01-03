import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface AcceptanceEmailData {
  to: string;
  userName: string;
  projectTitle: string;
  roleName: string;
  projectId: string;
}

interface MemberAddedEmailData {
  to: string;
  projectTitle: string;
  roleName: string;
  projectId: string;
  ownerName: string;
}

export async function sendAcceptanceEmail(data: AcceptanceEmailData) {
  const { to, userName, projectTitle, roleName, projectId } = data;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "Project Platform"}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `🎉 You've been accepted to ${projectTitle}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8943ea 0%, #6b2fc7 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #8943ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Great news! Your application has been <strong>accepted</strong> for the project:</p>
              
              <h2 style="color: #8943ea;">${projectTitle}</h2>
              
              <p><strong>Role:</strong> ${roleName}</p>
              
              <p>You're now officially part of the team! Click the button below to view the project details and start collaborating:</p>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/projects/manage/${projectId}" class="button">
                  View Project
                </a>
              </div>
              
              <p>We're excited to have you on board. Let's build something amazing together!</p>
              
              <p>Best regards,<br>The Project Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Hi ${userName},

Congratulations! Your application has been accepted for the project: ${projectTitle}

Role: ${roleName}

You're now officially part of the team! Visit the project at:
${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/projects/manage/${projectId}

We're excited to have you on board. Let's build something amazing together!

Best regards,
The Project Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Acceptance email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending acceptance email:", error);
    return { success: false, error };
  }
}


export async function sendMemberAddedEmail(data: MemberAddedEmailData) {
  const { to, projectTitle, roleName, projectId, ownerName } = data;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "Project Platform"}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `🎉 You've been added to ${projectTitle}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8943ea 0%, #6b2fc7 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #8943ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .highlight { background: #8943ea10; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8943ea; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to the Team!</h1>
            </div>
            <div class="content">
              <p>Great news!</p>
              
              <p>You've been added as a team member to the project:</p>
              
              <div class="highlight">
                <h2 style="color: #8943ea; margin: 0 0 10px 0;">${projectTitle}</h2>
                <p style="margin: 0;"><strong>Your Role:</strong> ${roleName}</p>
                <p style="margin: 5px 0 0 0;"><strong>Added by:</strong> ${ownerName}</p>
              </div>
              
              <p>You're now officially part of the team! Click the button below to view the project details and start collaborating:</p>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/projects/manage/${projectId}" class="button">
                  View Project
                </a>
              </div>
              
              <p>We're excited to have you on board. Let's build something amazing together!</p>
              
              <p>Best regards,<br>The Project Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to the Team!

You've been added as a team member to the project: ${projectTitle}

Your Role: ${roleName}
Added by: ${ownerName}

You're now officially part of the team! Visit the project at:
${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/projects/manage/${projectId}

We're excited to have you on board. Let's build something amazing together!

Best regards,
The Project Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Member added email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending member added email:", error);
    return { success: false, error };
  }
}
