const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
  sign: async (data) => {
    try {
      return jwt.sign(data, JWT_SECRET, { expiresIn: "4h" });
    } catch (err) {
      console.log(err);
      return false;
    }
  },
  verify: async (token) => {
    return jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return false;
      }
      return decoded;
    });
  },
};
