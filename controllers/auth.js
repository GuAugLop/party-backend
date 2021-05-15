const express = require("express");
const userModel = require("../dbconfig/Schemas/user");
const postModel = require("../dbconfig/Schemas/post");
const route = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("../config/jwt");
const sendMail = require("../config/mail");

const regex = {
  email: {
    reg: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  },
  username: {
    reg: /[a-zA-Z.]/g,
  },
};
//Register
route.post("/register", async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username.trim() || !name.trim() || !email.trim() || !password.trim()) {
      return res
        .status(400)
        .send({ err: "missing_data", msg: "Dados necessários faltando." });
    }

    if (!regex.email.reg.test(email)) {
      return res
        .status(400)
        .send({ err: "invalid_email", msg: "Email inválido." });
    }
    if (!regex.username.reg.test(username)) {
      return res.status(400).send({
        err: "invalid_username",
        msg: "Nome de usuário deve conter apenas letras e .",
      });
    }

    if (username.length < 4 || password.length < 4) {
      return res.status(400).send({
        err: "small_data",
        msg: "Nome de usuário e senha devem conter quatro caracteres ou mais.",
      });
    }
    if (username.length > 15) {
      return res.status(422).send({
        err: "username_very_long",
        msg: "Nome de usuário muito longo.",
      });
    }

    //Find User
    let find;
    find = await userModel.findOne({ email });
    if (find) {
      return res
        .status(401)
        .send({ err: "email_in_use", msg: "Email já está em uso." });
    }

    find = await userModel.findOne({ username });
    if (find) {
      return res
        .status(401)
        .send({ err: "username_in_use", msg: "Username já está em uso." });
    }

    //Create User
    const user = await userModel.create({ username, name, email, password });
    user.password = undefined;
    user.forgot = undefined;
    user.posts = undefined;
    const token = await jwt.sign({ data: { _id: user._id } });
    if (!token) {
      return res
        .status(400)
        .send({ err: "failed_generate_token", msg: "Falha ao gerar o token." });
    }

    return res.status(200).send({ token, data: user });
  } catch (err) {
    return res.status(500).send({
      err: "external_error",
      msg: "Houve um erro ao tentar processar a requisição. Tente novamente mais tarde.",
    });
  }
});

//Login
route.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    //Find User
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(404)
        .send({ err: "user_not_found", msg: "Usuário não encontrado." });
    }

    //Compare password
    const compare = bcrypt.compareSync(password, user.password);
    if (!compare) {
      return res
        .status(401)
        .send({ err: "invalid_password", msg: "Email ou senha incorretos." });
    }

    user.password = undefined;
    user.posts = undefined;

    //Generate Token
    const token = await jwt.sign({ data: { _id: user._id } });
    if (!token) {
      return res
        .status(400)
        .send({ err: "failed_generate_token", msg: "Falha ao gerar o token." });
    }
    //Send Token and Data
    return res.status(200).send({ token, data: user });
  } catch (err) {
    res.status(500).send({
      err: "external_error",
      msg: "Houve um erro ao tentar processar a requisição. Tente novamente mais tarde.",
    });
  }
});

route.post("/forgot", async (req, res) => {
  const { email, url } = req.body;
  console.log({ email, url });
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .send({ err: "user_not_found", msg: "Usuário não encontrado." });
    }

    const token = await jwt.sign({ email });

    user.set("forgot", token);
    await user.save();

    await sendMail.resetPass(email, url, token);
    res.status(200).send();
  } catch (err) {
    console.log(err);
    res.status(500).send({
      err: "external_error",
      msg: "Houve um erro ao tentar processar a requisição. Tente novamente mais tarde.",
    });
  }
});

route.post("/reset-pass", async (req, res) => {
  try {
    const { password, token } = req.body;

    const { email } = await jwt.verify(token);
    if (!email) {
      return res
        .status(401)
        .send({ err: "Invalid_token", msg: "Token Inválido" });
    }

    const user = await userModel.findOne({ email }).select("+forgot");
    if (!user) {
      return res
        .status(404)
        .send({ err: "user_not_found", msg: "Usuário não encontrado." });
    }

    if (user.forgot !== token) {
      return res
        .status(401)
        .send({ err: "Invalid_token", msg: "Token Inválido" });
    }

    user.password = password;
    user.forgot = null;
    user.save();
    res.send();
  } catch (err) {
    return res.status(500).send({
      err: "external_error",
      msg: "Houve um erro ao tentar processar a requisição. Tente novamente mais tarde.",
    });
  }
});

module.exports = route;
