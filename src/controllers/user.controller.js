const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const { omit } = require("lodash");
const moment = require("moment-timezone");
const sendEmail = require("../utils/sendMail");
const jwt = require("jsonwebtoken");

// Create user
// Access public
// POST api/user/register
exports.register = asyncHandler(async (req, res, next) => {
  const userData = omit(req.body);
  let user = await User.create(userData);
  let { userDB, accessToken } = await User.generateToken(req.body, next);
  let token = generateTokenResponse(userDB, accessToken);
  let url = `http://localhost:5000/api/user/confirm/${token.accessToken}`;
  await sendEmail({ email: user.email, subject: "confirm register", url: url });
  //  201 created success status
  res.status(201).json({
    success: true,
    messsage: "Check mail",
  });
});

exports.confirm = asyncHandler(async (req, res, next) => {
  let token = req.params.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  let user = await User.findById(decoded.id);
  if (user) {
    await User.findByIdAndUpdate(decoded.id, {
      $set: { confirmed: true },
    });
    res.status(200).json({
      success: true,
      user,
    });
  } else {
    return next(new ErrorResponse("Invalid URL", 404));
  }
});

// Get token from model, create cookie and send response
function generateTokenResponse(user, accessToken) {
  const refreshToken = RefreshToken.generate(user).token;
  // option for cookie
  // console.log("date", new Date(Date.now()));
  let local = moment().format("YYYY-MM-DD HH:mm:ss");
  let expiresTime = moment(local)
    .add(Number.parseInt(process.env.JWT_COOKIE_EXPIRE), "day")
    .format("YYYY-MM-DD HH:mm:ss");
  let expires = moment.utc(expiresTime).toDate();
  const options = {
    expires: expires,
    httpOnly: true,
  };
  return { accessToken, refreshToken, options };
}

exports.loginUser = asyncHandler(async (req, res, next) => {
  try {
    let { userDB, accessToken } = await User.generateToken(req.body, next);
    if ((userDB !== null || userDB != undefined) && userDB.confirmed === true) {
      let token = generateTokenResponse(userDB, accessToken);
      let transform = userDB.transform();
      return res
        .status(200)
        .cookie("token", token.accessToken, token.options)
        .cookie("refresh", token.refreshToken, token.options)
        .json({
          token: token.accessToken,
          refreshToken: token.refreshToken,
          user: transform,
        });
    } else {
      return next(new ErrorResponse("Invalid credential", 401));
    }
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Invalid credential", 401));
  }
});

// refresh token, new refreshtoken will replace old refreshtoken
// POST api/user/refresh
exports.refreshToken = asyncHandler(async (req, res, next) => {
  try {
    // let { email, refreshToken } = req.body;
    let email = req.user.email;
    let refreshToken = req.refresh;
    // remove refresh token cu
    let refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    });
    // invalid token
    // cannot find refreshToken in DB
    if (!refreshObject) {
      return next(new ErrorResponse("Invalid refreshtoken", 401));
    }
    // tao token moi
    let { userDB, accessToken } = await User.generateToken(
      {
        email,
        refreshObject,
      },
      next
    );
    let token = generateTokenResponse(userDB, accessToken);
    let transform = userDB.transform();
    return res
      .status(200)
      .cookie("token", token.accessToken, token.options)
      .cookie("refresh", token.refreshToken, token.options)
      .json({
        success: true,
        token: token.accessToken,
        refreshToken: token.refreshToken,
        user: transform,
      });
  } catch (error) {
    return next(error);
  }
});

//  * Load user and append to req.
exports.load = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.getUser(req.params.userId);
    req.locals = { user };
    return next();
  } catch (error) {
    return next(error);
  }
});

// Get all user exist
// access ...
// GET api/user/getall
exports.getAllUser = asyncHandler(async (req, res, next) => {
  let user = await User.find();
  return res.status(200).json({
    success: true,
    user,
  });
});

// get user though id
exports.getUserById = asyncHandler(async (req, res) => {
  res.status(200).json(req.locals.user);
});

// get user through token from cookie
exports.getCurrentUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user.id);
  return res.status(200).json({ success: true, user });
});

exports.updateInfo = asyncHandler(async (req, res, next) => {
  try {
    let fieldForUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    };
    let user = await User.findByIdAndUpdate(req.user.id, fieldForUpdate);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {}
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  let { currentPassword, newPassword } = req.body;
  let user = await User.findById(req.user.id).select("+password");
  // current password does not match
  if (!(await user.passwordMatches(currentPassword))) {
    return next(new ErrorResponse("Incorrect password", 401));
  }
  user.password = newPassword;
  await user.save();
  // relogin update token
  let { userDB, accessToken } = await User.generateToken(
    { email: req.user.email, password: newPassword },
    next
  );
  let token = generateTokenResponse(userDB, accessToken);
  let transform = userDB.transform();
  return res
    .status(200)
    .cookie("token", token.accessToken, token.options)
    .cookie("refresh", token.refreshToken, token.options)
    .json({
      success: true,
      token: token.accessToken,
      refreshToken: token.refreshToken,
      user: transform,
    });
});

exports.forgetPassword = asyncHandler(async (req, res, next) => {
  let user = await User.findOne({ email: req.body.email });
  // generate random number
  let min = 10000;
  let max = 99999;
  let randomNumber = Math.floor(Math.random() * (max - min + 1) + min);
  // expires time for random number
  let local = moment().format("YYYY-MM-DD HH:mm:ss");
  let expiresTime = moment(local)
    .add("10", "minute")
    .format("YYYY-MM-DD HH:mm:ss");
  let expires = moment.utc(expiresTime).toDate();
  if (!user) {
    return next(new ErrorResponse("Invalid email", 404));
  } else {
    // Check if previous token is in expires time
    if (
      moment(local).isBefore(
        moment.utc(user.resetPasswordExpire).format("YYYY-MM-DD HH:mm:ss")
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Email have just requested",
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          resetPasswordToken: randomNumber,
          resetPasswordExpire: expires,
        },
      });
      await sendEmail({
        email: user.email,
        subject: `Code for reset password ${randomNumber}`,
        url: "",
      });
      return res.status(200).json({
        success: true,
        message: "Check mail",
      });
    }
  }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  let code = req.body.code;
  let email = req.body.email;
  let newPassword = req.body.newPassword;
  let user = await User.findOne({ email });
  let local = moment().format("YYYY-MM-DD HH:mm:ss");
  if (!user) {
    return next(new ErrorResponse("Invalid email", 400));
  } else {
    if (user.resetPasswordExpire) {
      if (
        moment(local).isBefore(
          moment.utc(user.resetPasswordExpire).format("YYYY-MM-DD HH:mm:ss")
        )
      ) {
        let codeDB = await User.findOne({
          email: email,
          resetPasswordToken: code,
        });
        if (codeDB) {
          codeDB.password = newPassword;
          await codeDB.save();
          return res.status(200).json({
            success: true,
            message: "Password changed",
          });
        } else {
          return next(new ErrorResponse("Code Incorret"));
        }
      } else {
        return next(new ErrorResponse("Outdated code", 400));
      }
    } else {
      return next(new ErrorResponse("Email does not requested", 400));
    }
  }
});

exports.logOut = asyncHandler(async (req, res, next) => {
  let local = moment().format("YYYY-MM-DD HH:mm:ss");
  let expires = moment.utc(local).toDate();

  return res
    .status(200)
    .cookie("token", "none", {
      expires: expires,
      httpOnly: true,
    })
    .cookie("refresh", "none", {
      expires: expires,
      httpOnly: true,
    })
    .json({ success: true });
});
