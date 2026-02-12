const crypto = require("crypto");

function deviceMiddleware(req, res, next) {
  // Device id cookie: created once and persists
  let deviceId = req.cookies?.device_id;

  if (!deviceId) {
    deviceId = crypto.randomUUID();

    res.cookie("device_id", deviceId, {
      httpOnly: false, // if you want extra security, set true; then frontend cannot read it
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }

  req.deviceId = deviceId;
  next();
}

module.exports = deviceMiddleware;