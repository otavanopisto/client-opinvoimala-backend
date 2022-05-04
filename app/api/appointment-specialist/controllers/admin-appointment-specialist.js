"use strict";

const { sanitizeSpecialist } = require("../../../utils/sanitizers");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const userId = ctx.state.user.id;

    const entities = await strapi
      .query("appointment-specialist")
      .find({ created_by: userId }, ["specialist_role"]);

    return Promise.all(
      entities.map(async (entity) => await sanitizeSpecialist(entity))
    );
  },
};
