const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token, refresh;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
    // Set token from cookie
  } else if (req.cookies.token) {
    token = req.cookies.token;
    refresh= req.cookies.refresh;
  }
  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    req.refresh = refresh;
    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

exports.me = async function (req, res) {
  if (req.headers && req.headers.authorization) {
    let authorization = req.headers.authorization.split(" ")[1],
      decoded;
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch (e) {
      return res.status(401).send("unauthorized");
    }
    var userId = decoded.id;
    // Fetch the user by id
    User.findOne({ _id: userId }).then(function (user) {
      // Do something with the user
      return res.send(200);
    });
  }
  return res.send(500);
};
