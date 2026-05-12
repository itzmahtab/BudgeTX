"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

export function BudgetProgress({
  initialBudget,
  currentExpenses,
}: {
  initialBudget: any;
  currentExpenses: number;
}) {
  const percentUsed = useMemo(() => {
    if (!initialBudget || initialBudget === 0) return 0;
    const budget =
      typeof initialBudget === "object"
        ? parseFloat(initialBudget.toString())
        : initialBudget;
    return Math.min((currentExpenses / budget) * 100, 100);
  }, [initialBudget, currentExpenses]);

  const formattedBudget = useMemo(() => {
    if (!initialBudget) return "$0.00";
    const budget =
      typeof initialBudget === "object"
        ? parseFloat(initialBudget.toString())
        : initialBudget;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(budget);
  }, [initialBudget]);

  const formattedExpenses = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(currentExpenses);
  }, [currentExpenses]);

  if (!initialBudget) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget</CardTitle>
          <CardDescription>
            No budget set. Create a budget to track your spending.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>
          {formattedExpenses} of {formattedBudget} spent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={percentUsed} />
        <p className="text-xs text-muted-foreground text-right">
          {percentUsed.toFixed(1)}% used
        </p>
      </CardContent>
    </Card>
  );
}
