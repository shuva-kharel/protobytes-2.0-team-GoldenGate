const Kyc = require("../models/Kyc");
const User = require("../models/User");
const Product = require("../models/Product");
const Session = require("../models/Session");
const ProductRequest = require("../models/ProductRequest");
const BorrowRequest = require("../models/BorrowRequest");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const logger = require("../utils/logger");

const listKyc = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const data = await Kyc.find(filter)
      .populate("user", "username email role")
      .sort({ createdAt: -1 });

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

const approveKyc = async (req, res, next) => {
  try {
    const kyc = await Kyc.findByIdAndUpdate(
      req.params.id,
      { status: "approved", reviewedBy: req.user._id, rejectionReason: "" },
      { new: true }
    );

    if (!kyc) return res.status(404).json({ message: "KYC not found" });

    logger.info("KYC approved", { adminId: req.user._id, kycId: kyc._id });
    res.json({ message: "KYC approved", kyc });
  } catch (err) {
    next(err);
  }
};

const rejectKyc = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const kyc = await Kyc.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", reviewedBy: req.user._id, rejectionReason: reason || "Rejected" },
      { new: true }
    );

    if (!kyc) return res.status(404).json({ message: "KYC not found" });

    logger.info("KYC rejected", { adminId: req.user._id, kycId: kyc._id });
    res.json({ message: "KYC rejected", kyc });
  } catch (err) {
    next(err);
  }
};

const stats = async (req, res, next) => {
  try {
    const [totalUsers, verifiedUsers, pendingKyc, approvedToday, rejectedToday] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isEmailVerified: true }),
      Kyc.countDocuments({ status: "pending" }),
      Kyc.countDocuments({ status: "approved", updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Kyc.countDocuments({ status: "rejected", updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ]);

    res.json({ totalUsers, verifiedUsers, pendingKyc, approvedToday, rejectedToday });
  } catch (err) {
    next(err);
  }
};

const getKycImagesSigned = async (req, res, next) => {
  try {
    const kyc = await Kyc.findById(req.params.id).select(
      "governmentIdImage selfieImage"
    );
    if (!kyc) return res.status(404).json({ message: "KYC not found" });

    res.json({
      governmentIdImage: kyc.governmentIdImage?.url || "",
      selfieImage: kyc.selfieImage?.url || "",
    });
  } catch (err) {
    next(err);
  }
};

const listProductsForReview = async (req, res, next) => {
  try {
    const { status = "pending_approval", q = "" } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.name = { $regex: String(q).trim(), $options: "i" };

    const items = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

const approveProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.status = "available";
    product.moderation = {
      ...(product.moderation || {}),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      rejectionReason: "",
    };
    await product.save();

    logger.info("Product approved", { adminId: req.user._id, productId: product._id });
    res.json({ message: "Product approved", product });
  } catch (err) {
    next(err);
  }
};

const rejectProduct = async (req, res, next) => {
  try {
    const { reason = "Rejected by admin review" } = req.body || {};
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.status = "rejected";
    product.moderation = {
      ...(product.moderation || {}),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      rejectionReason: reason,
    };
    await product.save();

    logger.info("Product rejected", { adminId: req.user._id, productId: product._id });
    res.json({ message: "Product rejected", product });
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const q = (req.query.q || "").trim();
    const role = (req.query.role || "").trim();
    const emailVerified = req.query.emailVerified;

    const filter = {};
    if (role) filter.role = role;
    if (emailVerified === "true" || emailVerified === "false") {
      filter.isEmailVerified = emailVerified === "true";
    }
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("username fullName email role isEmailVerified createdAt twoFactor")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u._id);
    const kycRows = await Kyc.find({ user: { $in: userIds } }).select("user status").lean();
    const kycMap = new Map(kycRows.map((k) => [String(k.user), k.status]));

    const items = users.map((u) => ({
      ...u,
      kycStatus: kycMap.get(String(u._id)) || "not_submitted",
      twoFactor: {
        enabled: !!u.twoFactor?.enabled,
        method: u.twoFactor?.method || "email",
      },
    }));

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    next(err);
  }
};

const sendUserResetLink = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetTokenPlain = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetTokenPlain).digest("hex");

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password?token=${resetTokenPlain}&email=${encodeURIComponent(user.email)}`;

    await sendEmail(user.email, "Password reset support request", "resetPassword", {
      username: user.username,
      resetLink,
      title: "Password Reset Support",
    });

    logger.info("Admin sent password reset email", {
      adminId: req.user._id,
      userId: user._id,
      email: user.email,
    });

    res.json({ message: `Password reset link sent to ${user.email}` });
  } catch (err) {
    next(err);
  }
};

const reports = async (req, res, next) => {
  try {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      active2FAUsers,
      pendingKyc,
      pendingProducts,
      openRequests,
      activeSessions,
      borrowPending,
      newUsers24h,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ "twoFactor.enabled": true }),
      Kyc.countDocuments({ status: "pending" }),
      Product.countDocuments({ status: "pending_approval" }),
      ProductRequest.countDocuments({ status: "open" }),
      Session.countDocuments({ revokedAt: null }),
      BorrowRequest.countDocuments({ status: "pending" }),
      User.countDocuments({ createdAt: { $gte: since24h } }),
    ]);

    res.json({
      totalUsers,
      active2FAUsers,
      pendingKyc,
      pendingProducts,
      openRequests,
      activeSessions,
      borrowPending,
      newUsers24h,
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

const settingsSummary = async (req, res, next) => {
  try {
    res.json({
      appName: process.env.APP_NAME || "Protobytes",
      clientOrigin: process.env.CLIENT_ORIGIN || "",
      cookieSecure: process.env.COOKIE_SECURE === "true",
      mailFrom: process.env.MAIL_FROM || "",
      moderation: {
        productApprovalRequired: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listKyc,
  approveKyc,
  rejectKyc,
  stats,
  getKycImagesSigned,
  listProductsForReview,
  approveProduct,
  rejectProduct,
  listUsers,
  sendUserResetLink,
  reports,
  settingsSummary,
};
