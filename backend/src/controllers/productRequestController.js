const ProductRequest = require("../models/ProductRequest");
const logger = require("../utils/logger");

// PUBLIC: GET /api/product-requests
const listProductRequests = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 50);

    const q = (req.query.q || "").trim();
    const category = (req.query.category || "").trim();
    const location = (req.query.location || "").trim();

    const filter = { status: "open" };
    if (q) filter.title = { $regex: q, $options: "i" };
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: "i" };

    const [items, total] = await Promise.all([
      ProductRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ProductRequest.countDocuments(filter),
    ]);

    res.json({ page, limit, total, totalPages: Math.ceil(total / limit), items });
  } catch (err) {
    next(err);
  }
};

// PUBLIC: GET /api/product-requests/:id
const getProductRequestById = async (req, res, next) => {
  try {
    const doc = await ProductRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Request not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// VERIFIED: POST /api/product-requests
const createProductRequest = async (req, res, next) => {
  try {
    const { title, category, location, maxBorrowPrice, neededFrom, neededTo, description } = req.body;

    if (!title || !category || !location) {
      return res.status(400).json({ message: "title, category, location are required" });
    }

    const doc = await ProductRequest.create({
      title,
      category,
      location,
      maxBorrowPrice: Number(maxBorrowPrice || 0),
      neededFrom: neededFrom ? new Date(neededFrom) : null,
      neededTo: neededTo ? new Date(neededTo) : null,
      description: description || "",
      createdBy: { user: req.user._id, username: req.user.username },
      status: "open",
    });

    logger.info("Product request created", { requestId: doc._id, userId: req.user._id });

    res.status(201).json({ message: "Product request created", request: doc });
  } catch (err) {
    next(err);
  }
};

// VERIFIED: GET /api/product-requests/mine
const myProductRequests = async (req, res, next) => {
  try {
    const items = await ProductRequest.find({ "createdBy.user": req.user._id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

// VERIFIED: PUT /api/product-requests/:id
const updateProductRequest = async (req, res, next) => {
  try {
    const doc = await ProductRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Request not found" });

    if (doc.createdBy.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own request" });
    }

    if (doc.status === "closed") {
      return res.status(400).json({ message: "Closed request cannot be edited" });
    }

    const fields = ["title", "category", "location", "maxBorrowPrice", "neededFrom", "neededTo", "description"];
    for (const f of fields) {
      if (req.body[f] !== undefined) doc[f] = req.body[f];
    }

    await doc.save();
    res.json({ message: "Request updated", request: doc });
  } catch (err) {
    next(err);
  }
};

// VERIFIED: DELETE /api/product-requests/:id
const deleteProductRequest = async (req, res, next) => {
  try {
    const doc = await ProductRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Request not found" });

    if (doc.createdBy.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own request" });
    }

    await doc.deleteOne();
    res.json({ message: "Request deleted" });
  } catch (err) {
    next(err);
  }
};

// VERIFIED: PATCH /api/product-requests/:id/close
const closeProductRequest = async (req, res, next) => {
  try {
    const doc = await ProductRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Request not found" });

    if (doc.createdBy.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only close your own request" });
    }

    doc.status = "closed";
    await doc.save();

    res.json({ message: "Request closed", request: doc });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProductRequests,
  getProductRequestById,
  createProductRequest,
  myProductRequests,
  updateProductRequest,
  deleteProductRequest,
  closeProductRequest,
};