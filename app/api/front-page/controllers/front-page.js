"use strict";

const { sanitizeFrontPage } = require("../../../utils/sanitizers");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const entity = await strapi.services["front-page"].find(ctx.query, [
      "image",
      "details_image",
      "cards.link.page.users_permissions_roles",
      "cards.link.test.users_permissions_roles",
    ]);

    return sanitizeFrontPage(entity);
  },
};
