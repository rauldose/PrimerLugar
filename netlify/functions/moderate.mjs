import { getStore } from "@netlify/blobs";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}

function getToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-admin-token") || "";
}

function authorize(request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  return getToken(request) === expected;
}

async function getList(store, key) {
  const data = await store.get(key, { type: "json" });
  return Array.isArray(data) ? data : [];
}

async function setList(store, key, value) {
  await store.setJSON(key, value);
}

export default async (request) => {
  if (!authorize(request)) {
    return json(401, { error: "Unauthorized. Set ADMIN_TOKEN in Netlify and use it in the admin page." });
  }

  const store = getStore("primer-lugar-phrases");

  if (request.method === "GET") {
    const pending = await getList(store, "pending");
    const approved = await getList(store, "approved");
    return json(200, { pending, approved });
  }

  if (request.method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "Invalid JSON body." });
    }

    const { id, action } = body;
    if (!id || !["approve", "reject", "deleteApproved"].includes(action)) {
      return json(400, { error: "Expected id and action: approve, reject, or deleteApproved." });
    }

    let pending = await getList(store, "pending");
    let approved = await getList(store, "approved");

    if (action === "approve") {
      const item = pending.find((x) => x.id === id);
      if (!item) return json(404, { error: "Pending phrase not found." });

      pending = pending.filter((x) => x.id !== id);
      approved.unshift({ ...item, approvedAt: new Date().toISOString() });
      await setList(store, "pending", pending);
      await setList(store, "approved", approved.slice(0, 500));
      return json(200, { ok: true, pending, approved });
    }

    if (action === "reject") {
      pending = pending.filter((x) => x.id !== id);
      await setList(store, "pending", pending);
      return json(200, { ok: true, pending, approved });
    }

    if (action === "deleteApproved") {
      approved = approved.filter((x) => x.id !== id);
      await setList(store, "approved", approved);
      return json(200, { ok: true, pending, approved });
    }
  }

  return json(405, { error: "Method not allowed." });
};

export const config = {
  path: "/api/moderate"
};
