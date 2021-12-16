"use strict";

const { sanitizeSettings } = require("../../../utils/sanitizers");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const entity = await strapi.services.settings.find(ctx.query, [
      "logo",
      "links.page.users_permissions_roles",
      "logos",
    ]);
    return sanitizeSettings(entity);
  },
};
