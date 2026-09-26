export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: false, message: "This media endpoint is not available for direct GET access." }, { status: 404 });
}

export async function POST() {
  return Response.json({ ok: false, message: "Admin media uploads are handled client-side for this app." }, { status: 405 });
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
