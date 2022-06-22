const { filterContentByTags } = require("./tags");

const composeLink = (type) => (content) => {
  const baseLink = {
    id: `auto-generated-link-to-${type}-${content.id}`,
    label: null,
    title: null,
    page: null,
    test: null,
    external: null,
    internal: null,
    type,
  };

  switch (type) {
    case "page":
      return {
        ...baseLink,
        label: content.title,
        page: content,
      };
    case "test":
      return {
        ...baseLink,
        label: content.name,
        test: content,
      };
    default:
      return baseLink;
  }
};

/**
 * Generates link list based on tags
 */
const generateLinkList = async ({
  entityId = 0,
  pageTags = [],
  testTags = [],
}) => {
  let pages = [];
  let tests = [];

  if (pageTags.length) {
    const allPages = await strapi.services.page.find({ id_nin: [entityId] });
    const pageTagIds = pageTags.map(({ id }) => id);
    pages = filterContentByTags(allPages, pageTagIds);
  }

  if (testTags.length) {
    const allTests = await strapi.services.test.find({ id_nin: [entityId] });
    const testTagIds = testTags.map(({ id }) => id);
    tests = filterContentByTags(allTests, testTagIds);
  }

  return [...pages.map(composeLink("page")), ...tests.map(composeLink("test"))];
};

module.exports = {
  composeLink,
  generateLinkList,
};
