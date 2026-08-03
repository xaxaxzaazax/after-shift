import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const allowedOrigins = new Set([
  "https://xaxaxzaazax.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:4173",
]);
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": origin || "https://xaxaxzaazax.github.io",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function imageSize(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  if (origin && !allowedOrigins.has(origin)) return new Response("Origin not allowed", { status: 403 });
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers });

  const authorization = req.headers.get("Authorization");
  if (!authorization) return jsonResponse({ error: "Missing authorization" }, 401, headers);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) return jsonResponse({ error: "Report scanning is not configured" }, 503, headers);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return jsonResponse({ error: "Invalid session" }, 401, headers);

  let body: { image?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400, headers);
  }

  if (typeof body.image !== "string") return jsonResponse({ error: "An image is required" }, 400, headers);
  const match = body.image.match(/^data:(image\/(?:jpeg|png|webp));base64,[A-Za-z0-9+/=]+$/);
  if (!match || !allowedImageTypes.has(match[1])) return jsonResponse({ error: "Use a JPEG, PNG, or WebP image" }, 400, headers);
  if (imageSize(body.image) > maxImageBytes) return jsonResponse({ error: "The image is too large" }, 413, headers);

  const { data: allowed, error: rateLimitError } = await userClient.rpc("claim_tip_report_scan");
  if (rateLimitError) return jsonResponse({ error: "Could not verify the scan limit" }, 500, headers);
  if (!allowed) return jsonResponse({ error: "Daily scan limit reached. Try again tomorrow." }, 429, headers);

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_VISION_MODEL") || "gpt-4.1-mini",
      max_output_tokens: 700,
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: "Extract shift totals from restaurant checkout, tip-out, server, bartender, or end-of-day reports. Never guess. Distinguish gross tips from take-home/net tips and distinguish tip-out paid from tips received. Use null when a field is absent or ambiguous. Dates must be YYYY-MM-DD. Amounts are non-negative numbers without currency symbols. Add a short warning for ambiguity, poor image quality, or calculations that do not reconcile.",
          }],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Read this report and return the shift fields." },
            { type: "input_image", image_url: body.image, detail: "high" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "tip_report_fields",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              shiftDate: { anyOf: [{ type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, { type: "null" }] },
              sales: { anyOf: [{ type: "number", minimum: 0, maximum: 9999999999.99 }, { type: "null" }] },
              tips: { anyOf: [{ type: "number", minimum: 0, maximum: 9999999999.99 }, { type: "null" }] },
              tipOut: { anyOf: [{ type: "number", minimum: 0, maximum: 9999999999.99 }, { type: "null" }] },
              hours: { anyOf: [{ type: "number", exclusiveMinimum: 0, maximum: 24 }, { type: "null" }] },
              restaurantName: { anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }] },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              warnings: { type: "array", items: { type: "string", maxLength: 200 }, maxItems: 5 },
            },
            required: ["shiftDate", "sales", "tips", "tipOut", "hours", "restaurantName", "confidence", "warnings"],
          },
        },
      },
    }),
  });

  if (!openAiResponse.ok) {
    console.error("OpenAI report scan failed", openAiResponse.status, await openAiResponse.text());
    return jsonResponse({ error: "The report could not be scanned right now" }, 502, headers);
  }

  const result = await openAiResponse.json();
  const outputText = typeof result.output_text === "string"
    ? result.output_text
    : result.output?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? [])
      .find((item: { type?: string; text?: string }) => item.type === "output_text")?.text;
  if (typeof outputText !== "string") return jsonResponse({ error: "No readable fields were found" }, 422, headers);

  try {
    return jsonResponse({ fields: JSON.parse(outputText) }, 200, headers);
  } catch {
    return jsonResponse({ error: "The scanned fields were not valid" }, 502, headers);
  }
});
