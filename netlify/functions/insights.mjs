import { getStore } from "@netlify/blobs";
import { incrementInsight } from "./_insights.mjs";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

const allowedEvents = new Set([
  "views",
  "generates",
  "copies",
  "downloads",
  "shares",
  "phraseSelections"
]);

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

export default async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  if (!allowedEvents.has(body.event)) {
    return json(400, { error: "Unsupported insight event." });
  }

  const store = getStore("primer-lugar-phrases");
  await incrementInsight(store, body.event);

  return json(202, { ok: true });
};

export const config = {
  path: "/api/insights"
};
