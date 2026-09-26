export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: false, message: "Media record not found." }, { status: 404 });
}

export async function POST() {
  return Response.json({ ok: false, message: "This endpoint does not accept uploads." }, { status: 405 });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}
