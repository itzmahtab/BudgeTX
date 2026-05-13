"use server";

import { ReactElement } from "react";

interface SendEmailParams {
  to: string;
  subject: string;
  react: ReactElement;
}

export async function sendEmail(_params: SendEmailParams): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("Email would be sent:", _params.subject, "to:", _params.to);
    return;
  }
  throw new Error("Email provider not configured");
}
