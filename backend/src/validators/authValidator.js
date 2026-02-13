const { body, validationResult } = require("express-validator");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map(e => e.msg).join(", ");
    return res.status(400).json({ message: msg });
  }
  next();
}


exports.registerValidator = [
  body("username").isString().trim().isLength({ min: 3 }).withMessage("Username min 3 chars"),
  body("fullName").isString().trim().isLength({ min: 3 }).withMessage("Full name must be at least 3 characters"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isStrongPassword({ minLength: 8 }).withMessage("Password must be strong (min 8 chars, upper/lower/number/symbol)"),
  handleValidation,
];


exports.loginValidator = [
  body("login")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Login (email or username) is required")
    .custom((value) => {
      const v = value.trim();

      // If it looks like an email -> validate as email
      if (v.includes("@")) {
        // simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(v)) throw new Error("Valid email required");
        return true;
      }

      // Otherwise validate username
      // You can adjust these rules
      if (v.length < 3) throw new Error("Username must be at least 3 characters");
      if (!/^[a-zA-Z0-9_]+$/.test(v)) throw new Error("Username can contain only letters, numbers, underscore");
      return true;
    }),

  body("password")
    .isString()
    .notEmpty()
    .withMessage("Password is required"),

  handleValidation,
];


exports.emailOnlyValidator = [
  body("email").isEmail().withMessage("Valid email required"),
  handleValidation,
];

exports.verifyOtpValidator = [
  body("email").isEmail().withMessage("Valid email required"),
  body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  handleValidation,
];

exports.verify2FAValidator = [
  body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  handleValidation,
];

exports.forgotValidator = [
  body("email").isEmail().withMessage("Valid email required"),
  handleValidation,
];

exports.resetValidator = [
  body("token").isString().notEmpty().withMessage("Reset token required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isStrongPassword({ minLength: 8 }).withMessage("Strong password required"),
  handleValidation,
];

exports.updatePasswordValidator = [
  body("currentPassword")
    .isString()
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isStrongPassword({ minLength: 8 })
    .withMessage("New password must be strong (min 8 chars, upper/lower/number/symbol)"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const msg = errors.array().map((e) => e.msg).join(", ");
      return res.status(400).json({ message: msg });
    }
    next();
  },
];
