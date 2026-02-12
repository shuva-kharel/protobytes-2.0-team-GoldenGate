// src/controllers/userController.js
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");
const logger = require("../utils/logger");

// POST /api/user/update-profile  (multipart/form-data)
// fields: username, fullName, bio
// file: profilePicture
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { username, fullName, bio } = req.body;

    // Unique username check
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing) return res.status(400).json({ message: "Username already taken" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Upload profile picture if provided
    if (req.file) {
      // delete old pic
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
        url: upload.secure_url,
        publicId: upload.public_id,
      };
    }

    if (username) user.username = username;
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    logger.info("Profile updated", { userId });

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName || "",
        bio: user.bio || "",
        profilePicture: user.profilePicture?.url || "",
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateProfile };