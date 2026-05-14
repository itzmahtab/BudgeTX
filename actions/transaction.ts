"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

// ======================
// Gemini Configuration
// ======================

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(apiKey);

// ======================
// Types
// ======================

type TransactionData = {
  type: "EXPENSE" | "INCOME";
  amount: number;
  description?: string;
  date: Date;
  category: string;
  accountId: string;
  isRecurring?: boolean;
  recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
};

type SerializableAmount = {
  amount: {
    toNumber: () => number;
  };
  [key: string]: any;
};

// ======================
// Helpers
// ======================

const serializeAmount = <T extends { amount: { toNumber: () => number } }>(
  obj: T
): Omit<T, "amount"> & { amount: number } => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// ======================
// Create Transaction
// ======================

export async function createTransaction(data: TransactionData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // ArcJet Request
    const req = await request();

    // Rate Limiting
    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;

        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    // Find User
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Find Account
    const account = await db.account.findFirst({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate Balance
    const balanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const newBalance =
      account.balance.toNumber() + balanceChange;

    // Transaction + Balance Update
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(
                  data.date,
                  data.recurringInterval
                )
              : null,
        },
      });

      await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          balance: newBalance,
        },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return {
      success: true,
      data: serializeAmount(transaction),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Failed to create transaction");
  }
}

// ======================
// Get Single Transaction
// ======================

export async function getTransaction(id: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transaction = await db.transaction.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return serializeAmount(transaction);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Failed to fetch transaction");
  }
}

// ======================
// Update Transaction
// ======================

export async function updateTransaction(
  id: string,
  data: TransactionData
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Original Transaction
    const originalTransaction =
      await db.transaction.findFirst({
        where: {
          id,
          userId: user.id,
        },
        include: {
          account: true,
        },
      });

    if (!originalTransaction) {
      throw new Error("Transaction not found");
    }

    // Old Balance Change
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    // New Balance Change
    const newBalanceChange =
      data.type === "EXPENSE"
        ? -data.amount
        : data.amount;

    // Net Change
    const netBalanceChange =
      newBalanceChange - oldBalanceChange;

    // Update Transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring &&
            data.recurringInterval
              ? calculateNextRecurringDate(
                  data.date,
                  data.recurringInterval
                )
              : null,
        },
      });

      // Update Balance
      await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return {
      success: true,
      data: serializeAmount(transaction),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Failed to update transaction");
  }
}

// ======================
// Get User Transactions
// ======================

export async function getUserTransactions(
  query: Record<string, any> = {}
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions =
      await db.transaction.findMany({
        where: {
          userId: user.id,
          ...query,
        },
        include: {
          account: true,
        },
        orderBy: {
          date: "desc",
        },
      });

    return {
      success: true,
      data: transactions,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Failed to fetch transactions");
  }
}

// ======================
// Scan Receipt
// ======================

export async function scanReceipt(file: File) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // File -> ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // ArrayBuffer -> Base64
    const base64String =
      Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:

      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of:
        housing,
        transportation,
        groceries,
        utilities,
        entertainment,
        food,
        shopping,
        healthcare,
        education,
        personal,
        travel,
        insurance,
        gifts,
        bills,
        other-expense
      )

      Only respond with valid JSON in this exact format:

      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If it is not a receipt, return an empty object.
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;

    const text = response.text();

    const cleanedText = text
      .replace(/```(?:json)?\n?/g, "")
      .trim();

    try {
      const data = JSON.parse(cleanedText);

      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error(
        "Error parsing Gemini response:",
        parseError
      );

      throw new Error(
        "Invalid response format from Gemini"
      );
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);

    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Failed to scan receipt");
  }
}

// ======================
// Calculate Next Recurring Date
// ======================

function calculateNextRecurringDate(
  startDate: Date,
  interval:
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "YEARLY"
) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;

    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;

    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;

    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}