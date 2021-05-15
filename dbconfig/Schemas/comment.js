const mongoose = require("../index");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    require: true,
  },
  body: {
    type: String,
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "posts",
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = commentsModel = mongoose.model("comments", commentSchema);
