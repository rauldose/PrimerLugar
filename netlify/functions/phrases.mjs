import { getStore } from "@netlify/blobs";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

function cleanPhrase(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

function isValidPhrase(phrase) {
  if (phrase.length < 4 || phrase.length > 120) return false;
  if (/https?:\/\//i.test(phrase)) return false;
  if (/[<>]/.test(phrase)) return false;
  return true;
}

async function getList(store, key) {
  const data = await store.get(key, { type: "json" });
  return Array.isArray(data) ? data : [];
}

async function setList(store, key, value) {
  await store.setJSON(key, value);
}

export default async (request) => {
  const store = getStore("primer-lugar-phrases");

  if (request.method === "GET") {
    const approved = await getList(store, "approved");
    return json(200, {
      approved: approved
        .filter((x) => x && x.phrase)
        .sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt))
        .slice(0, 200)
    });
  }

  if (request.method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "Invalid JSON body." });
    }

    const phrase = cleanPhrase(body.phrase);
    if (!isValidPhrase(phrase)) {
      return json(400, { error: "La frase debe tener 4-120 caracteres y no puede incluir links ni HTML." });
    }

    const pending = await getList(store, "pending");
    const approved = await getList(store, "approved");
    const lower = phrase.toLowerCase();

    if (
      pending.some((x) => x.phrase?.toLowerCase() === lower) ||
      approved.some((x) => x.phrase?.toLowerCase() === lower)
    ) {
      return json(409, { error: "Esta frase ya existe o ya está pendiente." });
    }

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      phrase,
      createdAt: new Date().toISOString()
    };

    pending.unshift(item);
    await setList(store, "pending", pending.slice(0, 500));

    return json(201, { ok: true, item });
  }

  return json(405, { error: "Method not allowed." });
};

export const config = {
  path: "/api/phrases"
};
