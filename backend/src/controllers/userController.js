// src/controllers/userController.js
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");
const logger = require("../utils/logger");

function toPublicProfile(user) {
  return {
    _id: user._id,
    username: user.username,
    fullName: user.fullName || "",
    bio: user.bio || "",
    profilePicture:
      typeof user.profilePicture === "string"
        ? user.profilePicture
        : user.profilePicture?.url || "",
    joinedAt: user.createdAt,
  };
}

// POST /api/user/update-profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { username, fullName, bio } = req.body;

    // Check for unique username
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing)
        return res.status(400).json({ message: "Username already taken" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Upload profile picture if provided
    if (req.file) {
      // Delete old pic if exists
      if (user.profilePicture?.publicId) {
        await cloudinary.uploader.destroy(user.profilePicture.publicId, {
          resource_type: "image",
        });
      }

      const folder = process.env.CLOUDINARY_PROFILE_FOLDER || "protobytes/profile";
      const upload = await uploadBufferToCloudinary(req.file.buffer, {
        folder,
        resource_type: "image",
      });

      user.profilePicture = {
        url: upload.secure_url,   // Store URL for frontend
        publicId: upload.public_id,
      };
    }

    if (username) user.username = username;
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;

    await user.save();
    logger.info("Profile updated", { userId });

    // Send normalized user data
    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || "",
        bio: user.bio || "",
        profilePicture: user.profilePicture?.url || "", // always URL
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/user/id/:id
const getPublicProfileById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("username fullName bio profilePicture createdAt")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ profile: toPublicProfile(user) });
  } catch (err) {
    next(err);
  }
};

// GET /api/user/username/:username
const getPublicProfileByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("username fullName bio profilePicture createdAt")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ profile: toPublicProfile(user) });
  } catch (err) {
    next(err);
  }
};

const updateNotificationPrefs = async (req, res, next) => {
  try {
    const allowed = ["newMessageEmail", "loginAlertEmail", "twoFactorEmail", "securityEmail"];
    const patch = {};
    for (const key of allowed) {
      if (typeof req.body?.[key] === "boolean") patch[`notifications.${key}`] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: patch },
      { new: true, select: "notifications" }
    );
    res.json({ notifications: user.notifications });
  } catch (err) {
    next(err);
  }
};

const getNotificationPrefs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("notifications").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ notifications: user.notifications || {} });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateProfile,
  getPublicProfileById,
  getPublicProfileByUsername,
  updateNotificationPrefs,
  getNotificationPrefs,
};