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
  listProductsForReview,
  approveProduct,
  rejectProduct,
  listUsers,
  sendUserResetLink,
  reports,
  settingsSummary,
} = require("../controllers/adminController");

router.use(asyncHandler(protect));
router.use(asyncHandler(requireRole("admin")));

router.get("/kyc", asyncHandler(listKyc));
router.get("/stats", asyncHandler(stats));

router.patch("/kyc/:id/approve", asyncHandler(approveKyc));
router.patch("/kyc/:id/reject", asyncHandler(rejectKyc));
router.get("/kyc/:id/images", asyncHandler(getKycImagesSigned));
router.get("/products", asyncHandler(listProductsForReview));
router.patch("/products/:id/approve", asyncHandler(approveProduct));
router.patch("/products/:id/reject", asyncHandler(rejectProduct));
router.get("/users", asyncHandler(listUsers));
router.post("/users/:id/send-reset", asyncHandler(sendUserResetLink));
router.get("/reports", asyncHandler(reports));
router.get("/settings", asyncHandler(settingsSummary));

module.exports = router;
