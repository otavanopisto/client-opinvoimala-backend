module.exports = ({ env }) => ({
  email: {
    provider: "nodemailer",
    providerOptions: {
      host: env("SMTP_HOST"),
      port: env("SMTP_PORT"),
      auth: {
        user: env("SMTP_USERNAME"),
        pass: env("SMTP_PASSWORD"),
      },
    },
    settings: {
      defaultFrom: "no-reply@opinvoimala.fi",
      defaultReplyTo: "no-reply@opinvoimala.fi",
    },
    meilisearch: {
      config: {
        host: env("MEILI_HOST"),
        apiKey: env("MEILI_MASTER_KEY"),
      },
    },
  },
});
