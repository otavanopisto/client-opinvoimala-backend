const nodemailer = require("nodemailer");

const getEmailFrom = () => {
  const from = process.env.SMTP_FROM;
  return `Opinvoimala <${from}>`;
};

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secureConnection: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });
};

module.exports = {
  getEmailFrom,
  createEmailTransporter,
};
