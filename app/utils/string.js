const slugify = require("slugify");

const createSlug = (title) => {
  return slugify(title, { lower: true, locale: "fi" });
};

module.exports = {
  createSlug,
};
