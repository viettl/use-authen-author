const { body, validationResult, check } = require("express-validator");

const createUserValidation = () => {
  return [
    body("email")
      .exists({ checkFalsy: true })
      .withMessage("Must have email")
      .bail()
      .isEmail()
      .withMessage("Email is invalid"),
    check("role")
      .exists({ checkFalsy: true })
      .withMessage("Must have role")
      .bail()
      .isIn(["user", "admin"])
      .withMessage("Role is invalid"),
    body("password")
      .exists({ checkFalsy: true })
      .withMessage("Must have password")
      .bail()
      .isLength({
        min: 6,
      })
      .withMessage("Password must be lager than 5"),
    body("firstName")
      .exists({ checkFalsy: true })
      .withMessage("Must have firstName")
      .bail()
      .isString()
      .withMessage("firstName is invalid"),
    body("lastName")
      .exists({ checkFalsy: true })
      .withMessage("Must have lastName")
      .bail()
      .isString()
      .withMessage("lastName is invalid"),
  ];
};

const updateUserValidation = () => {
  return [
    body("firstName")
      .exists({ checkFalsy: true })
      .withMessage("Must have firstName")
      .bail()
      .isString()
      .withMessage("firstName is invalid"),
    body("lastName")
      .exists({ checkFalsy: true })
      .withMessage("Must have lastName")
      .bail()
      .isString()
      .withMessage("lastName is invalid"),
  ];
};

const updatePasswordValidation = () => {
  return [
    body("currentPassword")
      .exists({ checkFalsy: true })
      .withMessage("Must have current password")
      .bail()
      .isLength({ min: 6 })
      .withMessage("Password must be lager than 5"),
    body("newPassword")
      .exists({ checkFalsy: true })
      .withMessage("Must have new password")
      .bail()
      .isLength({
        min: 6,
      })
      .withMessage("Password must be lager than 5"),
  ];
};

const forgotPasswordValidation = () => {
  return [
    body("email")
      .exists({ checkFalsy: true })
      .withMessage("Must have email")
      .bail()
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};

const resetPasswordValidation = () => {
  return [
    body("code")
      .exists({ checkFalsy: true })
      .withMessage("Must have code")
      .bail()
      .isNumeric()
      .withMessage("Code must be number"),
    body("email")
      .exists({ checkFalsy: true })
      .withMessage("Must have email")
      .bail()
      .isEmail()
      .withMessage("Email is invalid"),
    body("newPassword")
      .exists({
        checkFalsy: true,
      })
      .withMessage("Must have newPassword")
      .bail()
      .isLength({ min: 6 })
      .withMessage("Password must be larger than 5"),
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
  // status code 422: invalid input data
  return res.status(422).json({
    success: false,
    error: extractedErrors,
  });
};

module.exports = {
  createUserValidation,
  updateUserValidation,
  updatePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validate,
};
