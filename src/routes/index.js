const express = require("express");
const errorHandler = require("../middlewares/errorHandler");
const ErrorResponse = require("../utils/errorResponse");

const userRoute = require("./user.routes");

const router = express.Router();

router.use("/user", userRoute);


router.use("*", (req, res, next) => {
  // throw new ErrorResponse("Bad Request", 401);
  throw new ErrorResponse("Bad Request", 401);
});

// declare after all route
router.use(errorHandler);

module.exports = router;
