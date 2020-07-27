const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const moment = require("moment-timezone");
const ErrorResponse = require("../utils/errorResponse");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "plz add firstName "],
  },
  lastName: {
    type: String,
    required: [true, "plz add lastName "],
  },
  email: {
    type: String,
    required: [true, "plz add email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "plz add valid email",
    ],
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "plz add password"],
    minlength: 6,
    select: false,
  },
  resetPasswordToken: Number,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// method
//
UserSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "firstName",
      "lastName",
      // "picture",
      "createdAt",
      "role",
      "email",
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
  async passwordMatches(password) {
    return await bcrypt.compare(password, this.password);
  },
  token() {
    // const playload = {
    //   exp: moment().add(process.env.JWT_EXPIRATION_MINUTES, "minutes").unix(),
    //   iat: moment().unix(),
    //   sub: this._id,
    // };
    // return jwt.encode(playload, process.env.JWT_SECRET);
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });
  },
});

//
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  let salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//  static
//  Schema Statics được sử dụng để xử lý các tác vụ liên quan trực tiếp đến Model
//

UserSchema.statics = {
  // find user and generate token
  async generateToken(param, next) {
    let { email, password, refreshObject } = param;
    // email password empty
    if (!refreshObject) {
      if (!email || !password) {
        return next(new ErrorResponse("Provide an email and password", 400));
      }
    } else {
      if (!email) {
        return next(new ErrorResponse("Provide email for refresh", 400));
      }
    }
    // Check for user exist
    const userDB = await this.findOne({ email }).select("+password").exec();
    // user not exist
    if (!userDB) {
      return next(new ErrorResponse("Invalid credentials", 401));
    } else if (userDB) {
      // user exist
      // dont provide refresh token
      if (password) {
        // check password matching
        if (await userDB.passwordMatches(password))
          // return to controller
          return { userDB, accessToken: userDB.token() };
        // invalid login
        else return next(new ErrorResponse("Invalid credentials", 401));
      }
      // provide refresh token
      else if (refreshObject && refreshObject.userEmail === email) {
        // let local = moment().format("YYYY-MM-DD HH:mm:ss");
        // // check 10day after will be oudated?
        // let expiresTime = moment(local)
        //   .add(10, "day")
        //   .format("YYYY-MM-DD HH:mm:ss");
        // let expires = moment.utc(expiresTime).toDate();
        if (moment(refreshObject.expires).isBefore())
          return next(new ErrorResponse("Outdated refresh token", 404));
        else return { userDB, accessToken: userDB.token() };
      }
    }
    // else return next(new ErrorResponse("Incorrect refresh token", 404));
  },
  async getUser(id) {
    try {
      console.log("id", id);
      let user;
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await this.findById(id);
      }
      if (user) {
        return user;
      }
      throw new ErrorResponse("User dont exist", 404);
    } catch (error) {}
  },
};

module.exports = mongoose.model("User", UserSchema);
