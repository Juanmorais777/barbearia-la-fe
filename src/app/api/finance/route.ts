import { adminRoute, ok, readJson, searchParams } from "@/lib/api/handler";
import { transactionSchema } from "@/lib/validations/schemas";
import { createTransaction, financeSummary, listTransactions } from "@/services/finance.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return adminRoute(async () => {
    const params = searchParams(request);
    if (params.get("view") === "summary") {
      return ok(await financeSummary({ from: params.get("from"), to: params.get("to") }));
    }
    return ok({
      transactions: await listTransactions({
        from: params.get("from"),
        to: params.get("to"),
        type: params.get("type"),
        payment_method: params.get("payment_method"),
        category: params.get("category"),
      }),
    });
  });
}

export async function POST(request: Request) {
  return adminRoute(async (session) => {
    const input = transactionSchema.parse(await readJson(request));
    return ok({ transaction: await createTransaction(input, session.sub) }, 201);
  });
}
