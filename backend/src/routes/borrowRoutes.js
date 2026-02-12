const express = require("express");
const router = express.Router();

const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/authMiddleware");
const { requireVerifiedUser } = require("../middlewares/verifiedUserMiddleware");

const {
  listMyRequests,
  listRequestsForOwner,
  approveBorrowRequest,
  rejectBorrowRequest,
  cancelBorrowRequest,
  completeBorrow,
} = require("../controllers/borrowController");

router.get("/mine", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(listMyRequests));
router.get("/owner", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(listRequestsForOwner));

router.patch("/:requestId/approve", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(approveBorrowRequest));
router.patch("/:requestId/reject", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(rejectBorrowRequest));

router.patch("/:requestId/cancel", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(cancelBorrowRequest));
router.patch("/:requestId/complete", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(completeBorrow));

module.exports = router;