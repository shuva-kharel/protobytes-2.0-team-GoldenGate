const mongoose = require("mongoose");
const BorrowRequest = require("../models/BorrowRequest");
const Product = require("../models/Product");
const logger = require("../utils/logger");

// borrower creates request (does NOT mark product borrowed)
const requestBorrow = async (req, res, next) => {
  try {
    const { startDate, endDate, message } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ message: "startDate and endDate are required" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.status !== "available") return res.status(400).json({ message: "Product not available" });

    if (product.uploadedBy.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot borrow your own product" });
    }

    const existing = await BorrowRequest.findOne({
      product: product._id,
      borrower: req.user._id,
      status: "pending",
    });
    if (existing) return res.status(400).json({ message: "You already have a pending request for this product" });

    const reqDoc = await BorrowRequest.create({
      product: product._id,
      owner: product.uploadedBy.user,
      borrower: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      message: message || "",
      status: "pending",
    });

    logger.info("Borrow requested", { borrowRequestId: reqDoc._id, productId: product._id });
    res.status(201).json({ message: "Borrow request sent (pending).", request: reqDoc });
  } catch (err) {
    next(err);
  }
};

const listMyRequests = async (req, res, next) => {
  try {
    const requests = await BorrowRequest.find({ borrower: req.user._id })
      .populate("product", "name category location borrowPrice status image")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    next(err);
  }
};

const listRequestsForOwner = async (req, res, next) => {
  try {
    const requests = await BorrowRequest.find({ owner: req.user._id })
      .populate("product", "name category location borrowPrice status image")
      .populate("borrower", "username email")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    next(err);
  }
};

// owner approves -> marks product borrowed (transaction)
const approveBorrowRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const request = await BorrowRequest.findById(req.params.requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Borrow request not found" });
    }

    if (request.owner.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not allowed" });
    }

    if (request.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    const product = await Product.findById(request.product).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.status !== "available") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Product not available anymore" });
    }

    request.status = "approved";
    await request.save({ session });

    product.status = "borrowed";
    await product.save({ session });

    // auto reject other pending requests for same product
    await BorrowRequest.updateMany(
      { product: product._id, status: "pending", _id: { $ne: request._id } },
      { $set: { status: "rejected", rejectionReason: "Another request was approved" } },
      { session }
    );

    await session.commitTransaction();
    logger.info("Borrow approved", { requestId: request._id, productId: product._id });

    res.json({ message: "Approved. Product marked borrowed.", request });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

const rejectBorrowRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await BorrowRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Borrow request not found" });

    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (request.status !== "pending") return res.status(400).json({ message: `Request is already ${request.status}` });

    request.status = "rejected";
    request.rejectionReason = reason || "Rejected";
    await request.save();

    res.json({ message: "Request rejected", request });
  } catch (err) {
    next(err);
  }
};

// borrower cancels pending request
const cancelBorrowRequest = async (req, res, next) => {
  try {
    const request = await BorrowRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Borrow request not found" });

    if (request.borrower.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (request.status !== "pending") return res.status(400).json({ message: `Request is already ${request.status}` });

    request.status = "cancelled";
    await request.save();

    res.json({ message: "Request cancelled", request });
  } catch (err) {
    next(err);
  }
};

// owner marks borrow completed -> product becomes available again
const completeBorrow = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const request = await BorrowRequest.findById(req.params.requestId).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Borrow request not found" });
    }

    if (request.owner.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not allowed" });
    }

    if (request.status !== "approved") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Only approved borrow can be completed" });
    }

    const product = await Product.findById(request.product).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Product not found" });
    }

    request.status = "completed";
    await request.save({ session });

    product.status = "available";
    await product.save({ session });

    await session.commitTransaction();

    res.json({ message: "Borrow completed. Product available again.", request });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

module.exports = {
  requestBorrow,
  listMyRequests,
  listRequestsForOwner,
  approveBorrowRequest,
  rejectBorrowRequest,
  cancelBorrowRequest,
  completeBorrow,
};