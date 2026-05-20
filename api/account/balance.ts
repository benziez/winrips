export const runtime = "edge";

export default async function handler(request: Request): Promise<Response> {
  try {
    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId")?.trim();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId query parameter is required." }), {
        status: 400,
      });
    }

    const { getUserBalance } = await import("../_lib/balancesStoreEdge.js");
    const balance = await getUserBalance(userId);

    return new Response(JSON.stringify(balance), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as { message?: string; stack?: string };
    return new Response(
      JSON.stringify({ error: err.message ?? String(e), stack: err.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
