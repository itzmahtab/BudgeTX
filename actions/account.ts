"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Generic serializer for Prisma Decimal values
const serializeDecimal = (obj: any) => {
  const serialized = { ...obj };

  if (serialized.balance) {
    serialized.balance = serialized.balance.toNumber();
  }

  if (serialized.amount) {
    serialized.amount = serialized.amount.toNumber();
  }

  return serialized;
};

export async function getAccountWithTransactions(accountId: string) {
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

  const account = await db.account.findUnique({
    where: {
      id: accountId,
      userId: user.id,
    },
    include: {
      transactions: {
        orderBy: {
          date: "desc",
        },
      },
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  if (!account) {
    return null;
  }

  return {
    ...serializeDecimal(account),
    transactions: account.transactions.map((transaction) =>
      serializeDecimal(transaction)
    ),
  };
}

export async function bulkDeleteTransactions(
  transactionIds: string[]
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

    // Get transactions first
    const transactions = await db.transaction.findMany({
      where: {
        id: {
          in: transactionIds,
        },
        userId: user.id,
      },
    });

    // Track balance changes
    const accountBalanceChanges: Record<string, number> = {};

    transactions.forEach((transaction) => {
      const change =
        transaction.type === "EXPENSE"
          ? transaction.amount.toNumber()
          : -transaction.amount.toNumber();

      accountBalanceChanges[transaction.accountId] =
        (accountBalanceChanges[transaction.accountId] || 0) + change;
    });

    // Transaction
    await db.$transaction(async (tx) => {
      // Delete transactions
      await tx.transaction.deleteMany({
        where: {
          id: {
            in: transactionIds,
          },
          userId: user.id,
        },
      });

      // Update balances
      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: {
            id: accountId,
          },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    };
  }
}

export async function updateDefaultAccount(accountId: string) {
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

    // Remove old default
    await db.account.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set new default
    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: {
        isDefault: true,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: serializeDecimal(account),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong",
    };
  }
}