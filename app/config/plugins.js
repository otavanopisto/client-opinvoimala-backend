module.exports = ({ env }) => ({
  email: {
    provider: "amazon-ses",
    providerOptions: {
      key: env("SMTP_USER"),
      secret: env("SMTP_PASSWORD"),
      amazon: env("SMTP_HOST", "email-smtp.eu-west-1.amazonaws.com"),
    },
    settings: {
      defaultFrom: env("SMTP_FROM", "no-reply@opinvoimala.fi"),
      defaultReplyTo: env("SMTP_FROM", "no-reply@opinvoimala.fi"),
    },
  },
});
