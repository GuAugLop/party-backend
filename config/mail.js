require("dotenv").config();
const nodemailer = require("nodemailer");
const MAILER_USER = process.env.MAILER_USER;
const MAILER_PASS = process.env.MAILER_PASS;
const config = {
  host: "smtp-relay.sendinblue.com",
  port: 587,
  auth: {
    user: MAILER_USER,
    pass: MAILER_PASS,
  },
};

async function resetPass(to, url, token) {
  let transporter = nodemailer.createTransport(config);
  try {
    transporter.sendMail({
      from: "gulopes.augusto@gmail.com",
      to,
      subject: "Reset Password",
      text: "String",
      html: `<p>Use esse link para redefinir a sua senha: ${url}?token=${token}</p>`,
    });
    return true;
  } catch (err) {
    return false;
  }
}

const sendMail = {
  resetPass,
};

module.exports = sendMail;
