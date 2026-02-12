const express = require("express");
const router = express.Router();

const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/authMiddleware");
const { requireVerifiedUser } = require("../middlewares/verifiedUserMiddleware");

const {
  listProductRequests,
  getProductRequestById,
  createProductRequest,
  myProductRequests,
  updateProductRequest,
  deleteProductRequest,
  closeProductRequest,
} = require("../controllers/productRequestController");

// PUBLIC
router.get("/", asyncHandler(listProductRequests));
router.get("/:id", asyncHandler(getProductRequestById));

// VERIFIED
router.get("/mine/list", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(myProductRequests));
router.post("/", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(createProductRequest));
router.put("/:id", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(updateProductRequest));
router.delete("/:id", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(deleteProductRequest));
router.patch("/:id/close", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(closeProductRequest));

module.exports = router;