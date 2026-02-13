const express = require("express");
const router = express.Router();

const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/authMiddleware");
const uploadProfile = require("../middlewares/uploadProfileMemory");
const {
  updateProfile,
  getPublicProfileById,
  getPublicProfileByUsername,
} = require("../controllers/userController");

router.get("/username/:username", asyncHandler(getPublicProfileByUsername));
router.get("/id/:id", asyncHandler(getPublicProfileById));

router.post(
  "/update-profile",
  asyncHandler(protect),
  uploadProfile.single("profilePicture"), // ✅ required for device upload
  asyncHandler(updateProfile)
);

module.exports = router;
