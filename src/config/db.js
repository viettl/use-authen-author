const mongoose = require("mongoose");

module.exports = connectDB = async () => {
  const connection = await mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Successfully connecting database");
    })
    .catch((error) => {
      console.log(`Could not connect to the databse. Exit... \n${error}`);
      process.exit();
    });
};
