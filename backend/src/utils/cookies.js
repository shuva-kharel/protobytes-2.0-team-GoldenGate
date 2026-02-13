// utils/cookies.js
function resolveCookieDomain() {
  const raw = (process.env.COOKIE_DOMAIN || "").trim();
  if (!raw) return undefined;
  const lowered = raw.toLowerCase();
  if (lowered === "localhost" || lowered === "127.0.0.1" || lowered === "::1") {
    return undefined;
  }
  return raw;
}

function setAuthCookies(res, accessToken, refreshToken) {
  const domain = resolveCookieDomain();
  const common = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    domain,
  };

  res.cookie("access_token", accessToken, {
    ...common,
    maxAge: 1000 * 60 * 15, // 15 minutes
    path: "/",
  });

  // Limit refresh token usage to its route path
  res.cookie("refresh_token", refreshToken, {
    ...common,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/api/auth/refresh",
  });
}

function clearAuthCookies(res) {
  const domain = resolveCookieDomain();
  const common = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    domain,
  };
  res.clearCookie("access_token", { ...common, path: "/" });
  res.clearCookie("refresh_token", { ...common, path: "/api/auth/refresh" });
}

module.exports = { setAuthCookies, clearAuthCookies, resolveCookieDomain };
