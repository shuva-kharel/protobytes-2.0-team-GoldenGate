// utils/cookies.js
function setAuthCookies(res, accessToken, refreshToken) {
  const common = {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
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
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
}

module.exports = { setAuthCookies, clearAuthCookies };