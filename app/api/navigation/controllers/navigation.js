"use strict";

const { sanitizeNavigation } = require("../../../utils/sanitizers");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const entity = await strapi.services.navigation.find(ctx.query, [
      "items.links.page.users_permissions_roles",
    ]);

    return sanitizeNavigation(entity);
  },
};
