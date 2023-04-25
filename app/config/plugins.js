module.exports = ({ env }) => ({
  email: {
    provider: "mailgun",
    providerOptions: {
      apiKey: env("MAILGUN_API_KEY"),
      domain: env("MAILGUN_DOMAIN"),
      host: env("MAILGUN_URL", "api.eu.mailgun.net"),
    },
    settings: {
      defaultFrom: env("SMTP_FROM", "no-reply@opinvoimala.fi"),
      defaultReplyTo: env("SMTP_FROM", "no-reply@opinvoimala.fi"),
    },
  },
});
