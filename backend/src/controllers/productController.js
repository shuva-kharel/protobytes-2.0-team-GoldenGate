const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");
const logger = require("../utils/logger");

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
      description,
    } = req.body;

    if (!name || !category || !borrowPrice || !location) {
      return res.status(400).json({ message: "name, category, borrowPrice, location are required" });
    }

    const product = new Product({
      name,
      category,
      price: Number(price || 0),
      borrowPrice: Number(borrowPrice),
      location,
      productAge: productAge || "",
      description: description || "",
      uploadedBy: {
        user: req.user._id,
        username: req.user.username,
      },
      status: "available",
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

    logger.info("Product created", { productId: product._id, userId: req.user._id });

    res.status(201).json({ message: "Product created", product });
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

    const fields = ["name", "category", "price", "borrowPrice", "location", "productAge", "description", "status"];
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

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};