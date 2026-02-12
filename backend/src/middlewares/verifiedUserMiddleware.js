const Kyc = require("../models/Kyc");

const requireVerifiedUser = async (req, res, next) => {
  try {
    if (!req.user?.isEmailVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify email first." });
    }

    const kyc = await Kyc.findOne({ user: req.user._id });
    if (!kyc || kyc.status !== "approved") {
      return res.status(403).json({ message: "KYC not approved. Complete KYC to continue." });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireVerifiedUser };