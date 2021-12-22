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
      key: env("AWS_ACCESS_KEY_ID"),
      secret: env("AWS_SECRET_ACCESS_KEY"),
      amazon: env("AWS_SERVICE_ENDPOINT", "https://email-smtp.eu-west-1.amazonaws.com"),
    },
    settings: {
      defaultFrom: "noreply@opinvoimala.fi",
      defaultReplyTo: "noreply@opinvoimala.fi",
    },
  },
});
