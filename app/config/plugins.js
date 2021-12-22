module.exports = ({ env }) => ({
  upload: {
    provider: "google-cloud-storage",
    providerOptions: {
      serviceAccount: env("GOOGLE_CLOUD_STORAGE_ACCESS_KEY"),
      bucketName: env("GOOGLE_CLOUD_STORAGE_BUCKET_NAME"),
      baseUrl: `https://storage.googleapis.com/${env(
        "GOOGLE_CLOUD_STORAGE_BUCKET_NAME"
      )}`,
      basePath: "",
      publicFiles: true,
      uniform: false,
    },
  },
  email: {
    provider: "amazon-ses",
    providerOptions: {
      key: env("SMTP_USER"),
      secret: env("SMTP_PASSWORD"),
      amazon: env("SMTP_HOST", "https://email-smtp.eu-west-1.amazonaws.com"),
    },
    settings: {
      defaultFrom: env("SMTP_FROM", "no-reply@opinvoimala.fi"),
      defaultReplyTo: env("SMTP_FROM", "no-reply@opinvoimala.fi"),
    },
  },
});
