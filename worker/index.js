const MAX_REQUEST_BYTES = 64 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  },
});

const textField = (form, name) => {
  const value = form.get(name);
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";
};

const suppressMentions = value => value
  .replaceAll("@", "@\u200B")
  .replaceAll("<@", "<@\u200B");

const messageFields = message => {
  const safe = suppressMentions(message);
  const chunks = [];
  for (let offset = 0; offset < safe.length; offset += 1000) chunks.push(safe.slice(offset, offset + 1000));
  return chunks.map((value, index) => ({
    name: chunks.length === 1 ? "Message" : `Message (${index + 1}/${chunks.length})`,
    value,
    inline: false,
  }));
};

async function verifyTurnstile(token, secret, remoteIp) {
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  return response.json();
}

const expectedTurnstileHostnames = value => new Set(
  String(value || "").split(",").map(hostname => hostname.trim().toLowerCase()).filter(Boolean),
);

async function notifyDiscord(webhookUrl, submission) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "blake.pm contact form",
      allowed_mentions: { parse: [], users: [], roles: [], replied_user: false },
      embeds: [{
        title: "New Website Contact",
        color: 0x55B6A4,
        fields: [
          { name: "Name", value: suppressMentions(submission.name), inline: true },
          { name: "Email", value: suppressMentions(submission.email), inline: true },
          ...messageFields(submission.message),
          { name: "Submitted", value: submission.createdAt, inline: false },
          { name: "Submission ID", value: submission.id, inline: false },
        ],
        timestamp: submission.createdAt,
      }],
    }),
  });
  if (!response.ok) throw new Error(`Discord returned HTTP ${response.status}`);
}

async function handleContact(request, env) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) return json({ ok: false, message: "The message is too large." }, 413);
  if (!env.CONTACTS_DB || !env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_HOSTNAMES) {
    console.error("Contact form bindings are incomplete.");
    return json({ ok: false, message: "Messages are temporarily unavailable. Please try again later." }, 503);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, message: "Please check the form and try again." }, 400);
  }

  // A filled honeypot is accepted silently so automated clients receive no useful signal.
  if (textField(form, "website")) return json({ ok: true, message: "Your message was received." }, 202);

  const name = textField(form, "name").replace(/\s+/g, " ");
  const email = textField(form, "email").toLowerCase();
  const message = textField(form, "message");
  const turnstileToken = textField(form, "cf-turnstile-response");
  if (!name || name.length > 120 || !EMAIL_PATTERN.test(email) || email.length > 254 || message.length < 10 || message.length > 5000 || !turnstileToken || turnstileToken.length > 2048) {
    return json({ ok: false, message: "Please check the form and try again." }, 400);
  }

  let verification = null;
  try {
    verification = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, request.headers.get("CF-Connecting-IP"));
  } catch (error) {
    console.error("Turnstile verification request failed.", { error: error instanceof Error ? error.message : "Unknown error" });
  }
  const allowedHostnames = expectedTurnstileHostnames(env.TURNSTILE_HOSTNAMES);
  const verified = verification?.success === true
    && verification.action === "contact"
    && allowedHostnames.has(String(verification.hostname || "").toLowerCase());
  if (!verified) return json({ ok: false, message: "Verification failed. Please try again." }, 400);

  const submission = {
    id: crypto.randomUUID(),
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
  };

  try {
    await env.CONTACTS_DB.prepare(`
      INSERT INTO contact_submissions (id, name, email, message, created_at, notification_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(submission.id, submission.name, submission.email, submission.message, submission.createdAt).run();
  } catch (error) {
    console.error("Contact submission could not be stored.", { submissionId: submission.id, error: error instanceof Error ? error.message : "Unknown error" });
    return json({ ok: false, message: "Your message could not be saved. Please try again later." }, 500);
  }

  let notificationStatus = "failed";
  try {
    if (!env.DISCORD_WEBHOOK_URL) throw new Error("DISCORD_WEBHOOK_URL is not configured");
    await notifyDiscord(env.DISCORD_WEBHOOK_URL, submission);
    notificationStatus = "sent";
  } catch (error) {
    console.error("Discord notification failed after contact submission was stored.", { submissionId: submission.id, error: error instanceof Error ? error.message : "Unknown error" });
  }

  try {
    await env.CONTACTS_DB.prepare("UPDATE contact_submissions SET notification_status = ? WHERE id = ?")
      .bind(notificationStatus, submission.id)
      .run();
  } catch (error) {
    console.error("Contact notification status could not be updated.", { submissionId: submission.id, notificationStatus, error: error instanceof Error ? error.message : "Unknown error" });
  }

  return json({ ok: true, message: "Your message was received." }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return json({ ok: false, message: "Method not allowed." }, 405);
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
