const express = require("express");
const {
  register,
  confirm,
  getAllUser,
  loginUser,
  refreshToken,
  load,
  getUserById,
  getCurrentUser,
  logOut,
  updateInfo,
  updatePassword,
  forgetPassword,
  resetPassword,
} = require("../controllers/user.controller");

const router = express.Router();

const { authorize, protect } = require("../middlewares/auth");
// validaiton req
const {
  createUserValidation,
  updateUserValidation,
  updatePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validate,
} = require("../validator/user.validation");

// get token from cookie
router.route("/current").get(protect, getCurrentUser);

router.route("/register").post(createUserValidation(), validate, register);
// confirm email register
router.route("/confirm/:token").post(confirm);

router.route("/getAll").get(protect, authorize("user"), getAllUser);
router.route("/login").post(loginUser);
// refresh token, update cookie
router.route("/refresh").post(protect, refreshToken);
router.route("/logout").post(protect, logOut);
// update infor
router
  .route("/updateInfo")
  .post(updateUserValidation(), validate, protect, updateInfo);
// update password, update cookie
router
  .route("/updatePassword")
  .post(updatePasswordValidation(), validate, protect, updatePassword);
router.route("/forgotPassword").post(forgotPasswordValidation(), validate, forgetPassword);
router.route("/resetPassword").post(resetPasswordValidation(), validate, resetPassword);
// attach param to req
router.param("userId", load);
router.route("/getInfo/:userId").get(getUserById);

module.exports = router;
