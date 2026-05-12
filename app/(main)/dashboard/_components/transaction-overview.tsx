"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

export function DashboardOverview({
  accounts,
  transactions,
}: {
  accounts: any[];
  transactions: any[];
}) {
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc: { income: number; expense: number }, t: any) => {
        const amount = typeof t.amount === "object" ? parseFloat(t.amount.toString()) : t.amount;
        if (t.type === "INCOME") {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return accounts?.reduce((sum: number, account: any) => {
      const balance =
        typeof account.balance === "object"
          ? parseFloat(account.balance.toString())
          : account.balance;
      return sum + balance;
    }, 0) || 0;
  }, [accounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across {accounts?.length || 0} account{accounts?.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {formatCurrency(totals.income)}
          </div>
          <p className="text-xs text-muted-foreground">
            From recent transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {formatCurrency(totals.expense)}
          </div>
          <p className="text-xs text-muted-foreground">
            From recent transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
