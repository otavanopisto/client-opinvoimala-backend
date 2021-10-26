"use strict";

const { sanitizeNavigation } = require("../../../utils/sanitizers");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const entity = await strapi.services.navigation.find();
    return sanitizeNavigation(entity);
  },
};
