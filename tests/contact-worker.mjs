import assert from "node:assert/strict";
import worker from "../worker/index.js";

const originalFetch = globalThis.fetch;

function makeDb({ failInsert = false } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...values) {
          calls.push({ sql: sql.replace(/\s+/g, " ").trim(), values });
          return {
            async run() {
              if (failInsert && sql.includes("INSERT")) throw new Error("D1 unavailable");
              return { success: true };
            },
          };
        },
      };
    },
  };
}

function request(fields = {}, headers = {}) {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    name: "Blake Test",
    email: "TEST@EXAMPLE.COM",
    message: "A useful test message.",
    "cf-turnstile-response": "test-token",
    ...fields,
  })) form.set(name, value);
  return new Request("https://blake.pm/api/contact", { method: "POST", body: form, headers });
}

async function run() {
  const env = db => ({
    CONTACTS_DB: db,
    TURNSTILE_SECRET_KEY: "test-secret",
    TURNSTILE_HOSTNAMES: "blake.pm,www.blake.pm",
    DISCORD_WEBHOOK_URL: "https://discord.example/webhook",
  });
  let discordPayload;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("siteverify")) return Response.json({ success: true, action: "contact", hostname: "blake.pm" });
    discordPayload = JSON.parse(options.body);
    return new Response(null, { status: 204 });
  };

  let db = makeDb();
  let response = await worker.fetch(request({ message: "Hello @everyone and <@123456789>." }), env(db));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).ok, true);
  assert.equal(db.calls.length, 2);
  assert.match(db.calls[0].sql, /^INSERT INTO contact_submissions/);
  assert.equal(db.calls[0].values[2], "test@example.com");
  assert.deepEqual(discordPayload.allowed_mentions, { parse: [], users: [], roles: [], replied_user: false });
  assert.equal(JSON.stringify(discordPayload).includes("@everyone"), false);
  assert.equal(db.calls[1].values[0], "sent");

  db = makeDb();
  globalThis.fetch = async url => {
    if (String(url).includes("siteverify")) return Response.json({ success: true, action: "contact", hostname: "blake.pm" });
    return new Response(null, { status: 500 });
  };
  response = await worker.fetch(request(), env(db));
  assert.equal(response.status, 201);
  assert.equal(db.calls[1].values[0], "failed");

  db = makeDb();
  globalThis.fetch = async () => Response.json({ success: false });
  response = await worker.fetch(request(), env(db));
  assert.equal(response.status, 400);
  assert.equal(db.calls.length, 0);

  db = makeDb();
  globalThis.fetch = async () => Response.json({ success: true, action: "login", hostname: "blake.pm" });
  response = await worker.fetch(request(), env(db));
  assert.equal(response.status, 400);
  assert.equal(db.calls.length, 0);

  db = makeDb();
  globalThis.fetch = async () => Response.json({ success: true, action: "contact", hostname: "attacker.example" });
  response = await worker.fetch(request(), env(db));
  assert.equal(response.status, 400);
  assert.equal(db.calls.length, 0);

  db = makeDb({ failInsert: true });
  globalThis.fetch = async url => String(url).includes("siteverify") ? Response.json({ success: true, action: "contact", hostname: "blake.pm" }) : new Response(null, { status: 204 });
  response = await worker.fetch(request(), env(db));
  assert.equal(response.status, 500);

  response = await worker.fetch(new Request("https://blake.pm/api/contact"), {});
  assert.equal(response.status, 405);

  console.log("Passed: validation, Turnstile action/hostname checks, parameterized D1 storage, Discord mention suppression, notification failure durability, D1 failure handling, and method rejection.");
}

try {
  await run();
} finally {
  globalThis.fetch = originalFetch;
}
