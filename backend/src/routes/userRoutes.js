const express = require("express");
const router = express.Router();

const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/authMiddleware");
const uploadProfile = require("../middlewares/uploadProfileMemory");
const { updateProfile } = require("../controllers/userController");

router.post(
  "/update-profile",
  asyncHandler(protect),
  uploadProfile.single("profilePicture"), // ✅ required for device upload
  asyncHandler(updateProfile)
);

module.exports = router;