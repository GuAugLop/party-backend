const jwt = require("../config/jwt");
const userModel = require("../dbconfig/Schemas/user");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .send({ err: "No_Token_Provider", msg: "Token não encontrado." });
    }

    const decoded = await jwt.verify(token);

    if (!decoded) {
      return res
        .status(401)
        .send({ err: "Invalid_Token", msg: "Token Inválido" });
    }
    const user = await userModel.findById(decoded.data._id);
    if (!user) {
      return res
        .status(401)
        .send({ err: "Invalid_Token", msg: "Token Inválido" });
    }

    req.user = user;
    next();
  } catch (err) {
    res
      .status(500)
      .send({ err: "internal_error", msg: "Falha ao processar a requisição." });
  }
};
