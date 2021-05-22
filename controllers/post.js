const route = require("express").Router();
const multer = require("multer");
const { compressImage, deleteImage } = require("../config/image");
const postModel = require("../dbconfig/Schemas/post");
const commentModel = require("../dbconfig/Schemas/comment");
const authMiddleware = require("../middlewares/auth");
const userModel = require("../dbconfig/Schemas/user");
const path = require("path");

route.use(authMiddleware);

route.get("/posts", async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 8;
  const salt = (page - 1) * limit;

  try {
    const posts = await postModel
      .find()
      .populate([{ path: "user" }])
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(salt);
    res.send({ posts });
  } catch (err) {
    res.status(400).send({
      err: "internal_error",
      msg: "houve um erro ao processar a requisição.",
    });
  }
});

route.get("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postModel
      .findById(id)
      .populate([{ path: "comments", populate: "user" }, { path: "user" }]);

    if (!post)
      return res
        .status(404)
        .send({ err: "post_not_found", msg: "Publicação não encontrada." });
    res.send({ post });
  } catch (err) {
    res.status(400).send({
      err: "internal_error",
      msg: "houve um erro ao processar a requisição.",
    });
  }
});

route.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postModel.findById(id);

    if (!post)
      return res
        .status(404)
        .send({ err: "post_not_found", msg: "Publicação não encontrada." });

    if (String(post.user) !== String(req.user._id))
      return res
        .status(401)
        .send({ err: "not_allowed", msg: "Ação não permitida." });

    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .send({ err: "user_not_found", msg: "Usuário não encontrado." });
    }

    await post.remove();
    const nowThumb = post.thumb.split("/").slice(-1).pop();
    if (nowThumb) {
      deleteImage(
        path.resolve(__dirname, "..", "tmps", "imgs") + `\\${nowThumb}`
      );
    }
    const userPosts = user.posts.filter(
      (item) => String(item) !== String(post._id)
    );
    user.posts = userPosts;
    user.save();
    res.send();
  } catch (err) {
    console.log(err);
    res.status(500).send({
      err: "internal_error",
      msg: "Houve um erro ao processar a requisição.",
    });
  }
});

route.post("/posts", async (req, res) => {
  try {
    const { body } = req.body;
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res
        .status(401)
        .send({ err: "Invalid Token", msg: "Token inválido" });
    }

    var newPath = await compressImage(req, res);

    const post = await postModel.create({
      thumb: newPath,
      body,
      user: req.user._id,
    });

    user.posts.push(post._id);
    await user.save();

    return res.send({ post });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      err: "internal_error",
      msg: "Houve um erro ao processar a requisição.",
    });
  }
});

route.get("/posts/comments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postModel
      .findById(id)
      .populate([{ path: "comments", populate: "user" }]);
    if (!post) {
      res
        .status(404)
        .send({ err: "post_not_found", msg: "Publicação não encontrada." });
    }

    res.send({ comments: post.comments });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      err: "internal_error",
      msg: "Houve um erro ao processar a requisição.",
    });
  }
});

route.post("/posts/comments/:postId", async (req, res) => {
  try {
    const { message } = req.body;
    const { _id } = req.user;
    const post = await postModel.findById(req.params.postId);
    if (!post) {
      res
        .status(404)
        .send({ err: "post_not_found", msg: "Publicação não encontrada." });
    }
    const comment = await commentModel.create({
      body: message,
      user: _id,
      post: req.params.postId,
    });
    post.comments.push(comment._id);
    await post.save();
    res.send();
  } catch (err) {
    res.status(500).send({
      err: "internal_error",
      msg: "Houve um erro ao processar a requisição.",
    });
  }
});

module.exports = route;
