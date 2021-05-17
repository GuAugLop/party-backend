const route = require("express").Router();
const { compressImage, deleteImage } = require("../config/image");
const userModel = require("../dbconfig/Schemas/user");
const authMiddleware = require("../middlewares/auth");
const path = require("path");

route.use(authMiddleware);

route.get("/users", async (req, res) => {
  try {
    const { username } = req.body;
    const page = req.query.page || 1;
    const limit = 10;

    const salt = (page - 1) * limit;

    const users = await userModel
      .find({
        username: { $regex: username, $options: "i" },
      })
      .skip(salt)
      .limit(limit);

    res.send({ users });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      err: "internal_error",
      msg: "Houve um erro ao processar a requisição.",
    });
  }
});

route.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).populate("posts");
    res.send({ user });
  } catch (err) {
    res.status(500).send({
      err: "internal_error",
      msg: "Houve um erro ao processar a requisição.",
    });
  }
});

route.post("/avatar", async (req, res) => {
  try {
    const email = req.user.email;
    const nowProfile = req.user.thumb.split("/").slice(-1).pop();
    if (!email) {
      return res
        .status(401)
        .send({ err: "invalid_token", msg: "Token inválido." });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .send({ err: "user_not_found", msg: "Usuário não encontrado." });
    }

    var newPath = await compressImage(req, res);
    user.thumb = newPath;
    const newUser = await user.save();
    if (nowProfile) {
      deleteImage(
        path.resolve(__dirname, "..", "tmp", "imgs") + `\\${nowProfile}`
      );
    }
    return res.status(200).send({ user: newUser });
  } catch (err) {
    if (newPath) {
      deleteImage(newPath);
    }
    res.status(500).send({
      err: "internal_error",
      msg: "Houve um erro ao processar a requisição.",
    });
  }
});

route.delete("/avatar", async (req, res) => {
  try {
    const { _id } = req.user;
    const user = await userModel.findById(_id);
    const nowProfile = req.user.thumb.split("/").slice(-1).pop();

    if (!user) {
      return res
        .status(404)
        .send({ err: "user_not_found", msg: "Usuário não encontrado." });
    }

    if (nowProfile) {
      deleteImage(
        path.resolve(__dirname, "..", "tmp", "imgs") + `\\${nowProfile}`
      );
    }

    user.thumb = "";
    await user.save();
    return res.send({ user });
  } catch (err) {}
});

module.exports = route;
