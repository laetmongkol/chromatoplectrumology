import { allTranslationsFor, requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const lang = new URL(request.url).searchParams.get("lang") ?? "en";
  const data = await allTranslationsFor(lang);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="translations-${lang.replace(/[^A-Za-z0-9-]/g, "")}.json"`,
    },
  });
}
