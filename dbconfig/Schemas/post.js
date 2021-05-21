require("dotenv").config();
const mongoose = require("../index");
const Schema = mongoose.Schema;

const postSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    require: true,
  },
  thumb: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comments",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = postModel = mongoose.model("posts", postSchema);
