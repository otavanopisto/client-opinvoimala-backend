"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const entities = await strapi.services.tags.find(
      { ...ctx.query, _limit: -1 },
      []
    );

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.tags })
    );
  },
};
