const mongoose = require("mongoose");
const crypto = require("crypto");
const moment = require("moment-timezone");

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    ref: "User",
    required: true,
  },
  expires: { type: Date },
  created: { type: Date, default: Date.now },
});

refreshTokenSchema.statics = {
  generate(user) {
    let userId = user._id;
    let userEmail = user.email;
    let token = this.randomToken();
    let local = moment().format("YYYY-MM-DD HH:mm:ss");
    let expiresTime = moment(local)
      .add(process.env.JWT_REFRESH_EXPIRATION, "days")
      .format("YYYY-MM-DD HH:mm:ss");
    let expires = moment.utc(expiresTime).toDate();
    let tokenObject = new RefreshToken({
      token,
      userId,
      userEmail,
      expires,
    });
    tokenObject.save();

    return tokenObject;
  },
  randomToken() {
    return crypto.randomBytes(40).toString("hex");
  },
};

// Định nghĩa RefreshToken để có thể dùng constuctor trong static
const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
module.exports = RefreshToken;
