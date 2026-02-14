const geoip = require("geoip-lite"); // optional; returns approximate city/country
const sendEmail = require("../utils/sendEmail");

const APP_NAME = process.env.APP_NAME || "Ainchopaincho";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@example.com";

function getClientIp(req) {
  const fwd = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = fwd || req.ip || "";
  return ip.replace("::ffff:", "") || "Unknown";
}

function getGeo(ip) {
  try {
    const loc = geoip.lookup(ip);
    if (!loc) return { city: "", country: "" };
    return { city: loc.city || "", country: loc.country || "" };
  } catch {
    return { city: "", country: "" };
  }
}

function fmtDate(d = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function conversationLink(conversationId) {
  return `${CLIENT_URL}/chat?c=${encodeURIComponent(conversationId)}`;
}

async function sendNewMessageNotification({ receiver, sender, message, conversation }) {
  if (!receiver?.email) return;
  if (receiver.notifications && receiver.notifications.newMessageEmail === false) return;

  const isProduct = message.type === "product";
  const preview = isProduct
    ? `Interested in borrowing: ${message?.product?.name || "your product"}`
    : (message.text || "").slice(0, 160);

  const subject = `New message from ${sender?.fullName || sender?.username || "a user"}`;
  const link = conversationLink(conversation._id);

  await sendEmail(receiver.email, subject, "newMessage", {
    appName: APP_NAME,
    receiverName: receiver.fullName || receiver.username || "there",
    senderName: sender.fullName || sender.username || "A user",
    preview,
    link,
    product: isProduct
      ? {
        name: message?.product?.name || "",
        price: message?.product?.borrowPrice || "",
        imageUrl: message?.product?.imageUrl || "",
        location: message?.product?.location || "",
      }
      : null,
  });
}

async function sendLoginAlert({ user, req }) {
  if (!user?.email) return;
  if (user.notifications && user.notifications.loginAlertEmail === false) return;

  const ip = getClientIp(req);
  const { city, country } = getGeo(ip);
  const ua = (req.headers["user-agent"] || "").slice(0, 300);
  const when = fmtDate(new Date());

  await sendEmail(user.email, `New login to your ${APP_NAME} account`, "loginAlert", {
    appName: APP_NAME,
    username: user.username,
    fullName: user.fullName || user.username,
    time: when,
    ip,
    location: [city, country].filter(Boolean).join(", "),
    userAgent: ua,
    manageLink: `${CLIENT_URL}/settings/security`,
  });
}

async function sendTwoFactorChanged({ user, enabled, method }) {
  if (!user?.email) return;
  if (user.notifications && user.notifications.twoFactorEmail === false) return;

  const subject = `Two-factor authentication ${enabled ? "enabled" : "disabled"}`;
  await sendEmail(user.email, subject, "twoFactorChanged", {
    appName: APP_NAME,
    fullName: user.fullName || user.username,
    status: enabled ? "enabled" : "disabled",
    method: method || "email",
    manageLink: `${CLIENT_URL}/settings/security`,
  });
}

async function sendPasswordChanged({ user, req }) {
  if (!user?.email) return;
  if (user.notifications && user.notifications.securityEmail === false) return;

  const ip = getClientIp(req);
  const { city, country } = getGeo(ip);
  const ua = (req.headers["user-agent"] || "").slice(0, 300);
  const when = fmtDate(new Date());

  await sendEmail(user.email, `Your ${APP_NAME} password was changed`, "passwordChanged", {
    appName: APP_NAME,
    fullName: user.fullName || user.username,
    time: when,
    ip,
    location: [city, country].filter(Boolean).join(", "),
    userAgent: ua,
    supportEmail: SUPPORT_EMAIL,
  });
}

async function sendSessionsRevoked({ user }) {
  if (!user?.email) return;
  if (user.notifications && user.notifications.securityEmail === false) return;

  await sendEmail(user.email, `Your ${APP_NAME} sessions were revoked`, "sessionsRevoked", {
    appName: APP_NAME,
    fullName: user.fullName || user.username,
    manageLink: `${CLIENT_URL}/settings`,
  });
}

module.exports = {
  sendNewMessageNotification,
  sendLoginAlert,
  sendTwoFactorChanged,
  sendPasswordChanged,
  sendSessionsRevoked,
};