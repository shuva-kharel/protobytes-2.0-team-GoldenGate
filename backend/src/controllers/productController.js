const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");
const logger = require("../utils/logger");

const prohibitedKeywords = [
  "gun",
  "weapon",
  "pistol",
  "rifle",
  "drugs",
  "narcotic",
  "explosive",
  "fake id",
  "counterfeit",
];

function runProductPolicyCheck({ name = "", description = "" }) {
  const hay = `${name} ${description}`.toLowerCase();
  const matched = prohibitedKeywords.find((k) => hay.includes(k));
  if (matched) {
    return {
      status: "rejected",
      reason: `Blocked by policy keyword: ${matched}`,
    };
  }
  return { status: "pass", reason: "" };
}

// PUBLIC: GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 50);

    const q = (req.query.q || "").trim();
    const category = (req.query.category || "").trim();
    const location = (req.query.location || "").trim();

    const filter = { status: "available" };

    if (q) filter.name = { $regex: q, $options: "i" };
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: "i" };

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    next(err);
  }
};

// PUBLIC: GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// VERIFIED USER: POST /api/products (multipart/form-data)
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      price,
      borrowPrice,
      location,
      productAge,
      condition,
      description,
    } = req.body;

    if (!name || !category || !borrowPrice || !location) {
      return res.status(400).json({ message: "name, category, borrowPrice, location are required" });
    }

    const aiCheck = runProductPolicyCheck({
      name,
      description: description || "",
    });

    const product = new Product({
      name,
      category,
      price: Number(price || 0),
      borrowPrice: Number(borrowPrice),
      location,
      productAge: productAge || "",
      condition: condition || "",
      description: description || "",
      uploadedBy: {
        user: req.user._id,
        username: req.user.username,
      },
      status: aiCheck.status === "rejected" ? "rejected" : "pending_approval",
      moderation: {
        aiCheck,
        rejectionReason:
          aiCheck.status === "rejected"
            ? "Automatically rejected by policy screening"
            : "",
      },
    });

    // Upload image if included
    if (req.file) {
      const folder = `protobytes/products/${req.user._id}`;
      const upload = await uploadBufferToCloudinary(req.file.buffer, {
        folder,
        resource_type: "image",
      });

      product.image = { url: upload.secure_url, publicId: upload.public_id };
    }

    await product.save();

    logger.info("Product submitted", {
      productId: product._id,
      userId: req.user._id,
      aiStatus: aiCheck.status,
    });

    if (aiCheck.status === "rejected") {
      return res.status(201).json({
        message:
          "Product was auto-rejected by safety screening. Please edit and submit again.",
        product,
      });
    }

    res.status(201).json({
      message: "Product submitted for admin review.",
      product,
    });
  } catch (err) {
    next(err);
  }
};

// OWNER: PUT /api/products/:id (update own product)
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Only owner can update
    if (product.uploadedBy.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own product" });
    }

    const fields = [
      "name",
      "category",
      "price",
      "borrowPrice",
      "location",
      "productAge",
      "condition",
      "description",
      "status",
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    }

    // Update image if file exists
    if (req.file) {
      if (product.image?.publicId) {
        await cloudinary.uploader.destroy(product.image.publicId, { resource_type: "image" });
      }
      const folder = `protobytes/products/${req.user._id}`;
      const upload = await uploadBufferToCloudinary(req.file.buffer, {
        folder,
        resource_type: "image",
      });
      product.image = { url: upload.secure_url, publicId: upload.public_id };
    }

    const aiCheck = runProductPolicyCheck({
      name: product.name,
      description: product.description,
    });
    product.moderation = {
      ...(product.moderation || {}),
      aiCheck,
    };
    if (aiCheck.status === "rejected") {
      product.status = "rejected";
      product.moderation.rejectionReason =
        "Automatically rejected by policy screening";
    } else if (product.status !== "available" && product.status !== "borrowed") {
      // Edited products go back to moderation unless already actively borrowed/approved.
      product.status = "pending_approval";
      product.moderation.rejectionReason = "";
    }

    await product.save();

    res.json({ message: "Product updated", product });
  } catch (err) {
    next(err);
  }
};

// OWNER: DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.uploadedBy.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own product" });
    }

    if (product.image?.publicId) {
      await cloudinary.uploader.destroy(product.image.publicId, { resource_type: "image" });
    }

    await product.deleteOne();

    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};

const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      "uploadedBy.user": req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ items: products, total: products.length });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
};
