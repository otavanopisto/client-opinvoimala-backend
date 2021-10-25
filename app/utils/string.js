const slugify = require("slugify");

const createSlug = (text) => {
  if (!text?.length) return;
  return slugify(text, { lower: true, locale: "fi" });
};

module.exports = {
  createSlug,
};
