const express = require("express");
const router = express.Router();

const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/authMiddleware");
const uploadProfile = require("../middlewares/uploadProfileMemory");

const {
  updateProfile,
  getPublicProfileById,
  getPublicProfileByUsername,
  updateNotificationPrefs,
  getNotificationPrefs,
} = require("../controllers/userController");

router.get("/username/:username", asyncHandler(getPublicProfileByUsername));
router.get("/id/:id", asyncHandler(getPublicProfileById));

router.post(
  "/update-profile",
  asyncHandler(protect),
  uploadProfile.single("profilePicture"),
  asyncHandler(updateProfile)
);

// ✅ Use destructured handlers + asyncHandler
router.get("/me/notifications", asyncHandler(protect), asyncHandler(getNotificationPrefs));
router.patch("/me/notifications", asyncHandler(protect), asyncHandler(updateNotificationPrefs));

module.exports = router;