const Kyc = require("../models/Kyc");
const User = require("../models/User");
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

module.exports = { listKyc, approveKyc, rejectKyc, stats };