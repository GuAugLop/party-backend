require("dotenv").config();
const mongoose = require("../index");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  thumb: {
    type: String,
    default: "",
  },
  forgot: {
    type: String,
    default: null,
    select: false,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function () {
  try {
    if (this.password) {
      const hash = await bcrypt.hashSync(this.password, 10);
      this.password = hash;
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = userModel = mongoose.model("users", userSchema);
