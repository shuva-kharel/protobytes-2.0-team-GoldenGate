const express = require("express");
const router = express.Router();

const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/authMiddleware");
const { requireVerifiedUser } = require("../middlewares/verifiedUserMiddleware");

const uploadProduct = require("../middlewares/uploadProductMemory");

const {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { requestBorrow } = require("../controllers/borrowController");

// PUBLIC
router.get("/", asyncHandler(getProducts));
router.get("/:id", asyncHandler(getProductById));

// VERIFIED USER
router.get("/mine/list", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(getMyProducts));

router.post(
  "/",
  asyncHandler(protect),
  asyncHandler(requireVerifiedUser),
  uploadProduct.single("productImage"),
  asyncHandler(createProduct)
);

router.put(
  "/:id",
  asyncHandler(protect),
  asyncHandler(requireVerifiedUser),
  uploadProduct.single("productImage"),
  asyncHandler(updateProduct)
);

router.delete("/:id", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(deleteProduct));

// VERIFIED: borrow request (pending only)
router.post("/:id/borrow", asyncHandler(protect), asyncHandler(requireVerifiedUser), asyncHandler(requestBorrow));

module.exports = router;