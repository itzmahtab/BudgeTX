import React from "react";

interface EmailData {
  stats?: {
    totalExpenses: number;
    totalIncome: number;
    byCategory: Record<string, number>;
    transactionCount: number;
  };
  month?: string;
  insights?: string[];
  percentageUsed?: number;
  budgetAmount?: string;
  totalExpenses?: string;
  accountName?: string;
}

interface EmailTemplateProps {
  userName: string;
  type: "monthly-report" | "budget-alert";
  data: EmailData;
}

export default function EmailTemplate({
  userName,
  type,
  data,
}: EmailTemplateProps) {
  if (type === "monthly-report") {
    return React.createElement(
      "div",
      null,
      React.createElement("h1", null, `Hi ${userName},`),
      React.createElement("p", null, `Here is your monthly report for ${data.month}.`),
      React.createElement("p", null, `Income: $${data.stats?.totalIncome}`),
      React.createElement("p", null, `Expenses: $${data.stats?.totalExpenses}`)
    );
  }

  return React.createElement(
    "div",
    null,
    React.createElement("h1", null, `Hi ${userName},`),
    React.createElement("p", null, `Budget alert for ${data.accountName}!`),
    React.createElement("p", null, `You've used ${data.percentageUsed?.toFixed(0)}% of your budget.`)
  );
}
