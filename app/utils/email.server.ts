import { type AppLoadContext } from "@remix-run/cloudflare";
import nodemailer from "nodemailer";
import { google } from "googleapis";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async (context: AppLoadContext, options: EmailOptions) => {
  if (!context.cloudflare || !context.cloudflare.env) {
    throw new Error("Cloudflare context or environment variables are missing.");
  }

  const env = context.cloudflare.env;
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_REDIRECT_URI,
    EMAIL_USER,
  } = env;

  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REFRESH_TOKEN ||
    !EMAIL_USER
  ) {
    const missing = [];
    if (!GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
    if (!GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
    if (!GOOGLE_REFRESH_TOKEN) missing.push("GOOGLE_REFRESH_TOKEN");
    if (!EMAIL_USER) missing.push("EMAIL_USER");
    
    console.error(`Missing email configuration environment variables: ${missing.join(", ")}`);
    throw new Error(`Email service not configured. Missing: ${missing.join(", ")}`);
  }

  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground"
  );

  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: EMAIL_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token as string,
      },
    });

    const info = await transporter.sendMail({
      from: `"ZanTag Support" <${EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
