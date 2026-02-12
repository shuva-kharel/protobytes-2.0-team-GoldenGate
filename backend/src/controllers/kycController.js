const Kyc = require("../models/Kyc");
const logger = require("../utils/logger");
const cloudinary = require("../config/cloudinary");
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");

const submitKyc = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const {
      fullName,
      dob,
      address,
      country,
      phone,
      category,
      governmentIdNumber,
    } = req.body;

    const idFile = req.files?.governmentIdImage?.[0];
    const selfieFile = req.files?.selfieImage?.[0];

    if (!idFile || !selfieFile) {
      return res.status(400).json({ message: "Government ID image and selfie image are required" });
    }

    // If KYC exists and not rejected → block duplicate submissions
    const existing = await Kyc.findOne({ user: userId });
    if (existing && existing.status !== "rejected") {
      return res.status(400).json({ message: "KYC already submitted and under review" });
    }

    // If resubmission: delete old cloudinary images to avoid storage leaks
    if (existing?.governmentIdImage?.publicId) {
      await cloudinary.uploader.destroy(existing.governmentIdImage.publicId);
    }
    if (existing?.selfieImage?.publicId) {
      await cloudinary.uploader.destroy(existing.selfieImage.publicId);
    }

    // Upload both images to Cloudinary
    const folder = `${process.env.CLOUDINARY_FOLDER || "protobytes/kyc"}/${userId}`;

    const idUpload = await uploadBufferToCloudinary(idFile.buffer, {
      folder,
      resource_type: "image",
      // ✅ For KYC, consider authenticated/private assets:
      // type: "authenticated"
    });

    const selfieUpload = await uploadBufferToCloudinary(selfieFile.buffer, {
      folder,
      resource_type: "image",
      // type: "authenticated"
    });

    const payload = {
      user: userId,
      fullName,
      dob,
      address,
      country,
      phone,
      category,
      governmentIdNumber,
      governmentIdImage: { url: idUpload.secure_url, publicId: idUpload.public_id },
      selfieImage: { url: selfieUpload.secure_url, publicId: selfieUpload.public_id },
      status: "pending",
      reviewedBy: null,
      rejectionReason: "",
    };

    const kyc = existing
      ? await Kyc.findOneAndUpdate({ user: userId }, payload, { new: true })
      : await Kyc.create(payload);

    logger.info("KYC submitted", { userId, category });

    res.json({ message: "KYC submitted successfully", kyc });
  } catch (err) {
    logger.error("KYC submit failed", { error: err.message });
    next(err);
  }
};

const getMyKyc = async (req, res, next) => {
  try {
    const kyc = await Kyc.findOne({ user: req.user._id });
    res.json({ kyc });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitKyc, getMyKyc };