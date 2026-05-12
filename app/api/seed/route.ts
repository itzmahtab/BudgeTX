import { seedTransactions } from "@/actions/seed";

export async function GET() {
    const result = await seedTransactions();
    if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: result.success }), { status: 200 });
}