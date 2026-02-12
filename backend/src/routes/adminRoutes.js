const express = require("express");
const router = express.Router();
const asyncHandler = require("../middlewares/asyncHandler");
const { protect, requireRole } = require("../middlewares/authMiddleware");

const {
  listKyc,
  stats,
  approveKyc,
  rejectKyc,
  getKycImagesSigned,
} = require("../controllers/adminController");

router.use(asyncHandler(protect));
router.use(asyncHandler(requireRole("admin")));

router.get("/kyc", asyncHandler(listKyc));
router.get("/stats", asyncHandler(stats));

router.patch("/kyc/:id/approve", asyncHandler(approveKyc));
router.patch("/kyc/:id/reject", asyncHandler(rejectKyc));
router.get("/kyc/:id/images", asyncHandler(getKycImagesSigned));

module.exports = router;