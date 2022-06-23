"use strict";

const { sanitizeSettings } = require("../../../utils/sanitizers");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const entity = await strapi.services.settings.find(
      { ...ctx.query, _limit: -1 },
      ["logo", "links.page.users_permissions_roles", "logos"]
    );

    const tags = await strapi.services.tags.find({ _limit: -1 }, []);

    return sanitizeSettings({ ...entity, tags: tags ?? [] });
  },
};
