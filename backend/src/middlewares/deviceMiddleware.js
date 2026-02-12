// src/middlewares/deviceMiddleware.js
const crypto = require("crypto");

module.exports = function deviceMiddleware(req, res, next) {
  // Read device_id from cookies
  let deviceId = req.cookies?.device_id;

  // If missing, create a stable device ID and store in cookie
  if (!deviceId) {
    deviceId = crypto.randomUUID();

    res.cookie("device_id", deviceId, {
      httpOnly: false, // set true if you never need to read it in frontend
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
      path: "/",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }

  // Attach to request so controllers can use it
  req.deviceId = deviceId;
  next();
};
