"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEvent } = require("../../../utils/sanitizers");

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.events.search(ctx.query);
    } else {
      entities = await strapi.services.events.find({
        ...ctx.query,
        _limit: -1,
      });
    }

    return entities.map(sanitizeEvent);
  },
};
