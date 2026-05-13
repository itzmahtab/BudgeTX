"use server";

import { Resend } from "resend";
import { ReactElement } from "react";

interface SendEmailParams {
  to: string;
  subject: string;
  react: ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — email not sent");
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "BudgetX <onboarding@resend.dev>",
    to,
    subject,
    react,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
