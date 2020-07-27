const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const connectDB = require("./src/config/db");
const route = require("./src/routes/index");

const app = express();
dotenv.config({ path: "./src/config/config.env" });

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
connectDB();

app.use("/api", route);
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const PORT = process.env.PORT;

app.listen(
  PORT,
  console.log(`Server is running on ${process.env.NODE_ENV} Port ${PORT}`)
);

// handle promise reject
process.on("unhandledRejection", (err, promise) => {
  console.log(`unhandledRejection error ${err.message}`);
});
