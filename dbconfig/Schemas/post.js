require("dotenv").config();
const mongoose = require("../index");
const Schema = mongoose.Schema;
const URL_APPLICATION = process.env.URL_APPLICATION;

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

postSchema.pre("save", async function () {
  try {
    const fileName = this.thumb.split("/");
    const newURL = fileName.slice(-1).pop();
    this.thumb = await `${URL_APPLICATION}/tmp/imgs/${newURL}`;
    console.log(this.thumb);
  } catch (err) {}
});

module.exports = postModel = mongoose.model("posts", postSchema);
