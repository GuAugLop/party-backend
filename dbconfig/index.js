require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.DB_CONNECT, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

module.exports = mongoose;
