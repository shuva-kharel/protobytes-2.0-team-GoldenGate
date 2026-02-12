const express = require("express");
const router = express.Router();
const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/authMiddleware");
const uploadKyc = require("../middlewares/uploadKycMemory");

const { submitKyc, getMyKyc } = require("../controllers/kycController");

router.post(
  "/submit",
  asyncHandler(protect),
  uploadKyc.fields([
    { name: "governmentIdImage", maxCount: 1 },
    { name: "selfieImage", maxCount: 1 },
  ]),
  asyncHandler(submitKyc)
);

router.get("/me", asyncHandler(protect), asyncHandler(getMyKyc));

module.exports = router;