import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to BudgeTX</h1>
      <p className="text-lg text-muted-foreground mb-8">Track your expenses, set budgets, achieve financial goals.</p>
      <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
        <Button size="lg">Get Started</Button>
      </SignUpButton>
    </div>
  );
}
