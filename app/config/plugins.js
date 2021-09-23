module.exports = ({ env }) => ({
  upload: {
    provider: "google-cloud-storage",
    providerOptions: {
      serviceAccount: env("GOOGLE_CLOUD_STORAGE_ACCESS_KEY"),
      bucketName: env("GOOGLE_CLOUD_STORAGE_BUCKET_NAME"),
      baseUrl: `https://storage.googleapis.com/${env("GOOGLE_CLOUD_STORAGE_BUCKET_NAME")}`,
      basePath: "",
      publicFiles: true,
      uniform: false,
    },
  },
});
