"use strict";

const { DateTime } = require("luxon");
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

  async create(ctx) {
    const userId = ctx.state.user.id;

    const payload = {
      ...ctx.request.body,
      specialist_role: ctx.request.body.role_id,
      created_by: userId,
      updated_by: userId,
    };

    const entity = await strapi.query("appointment-specialist").create(payload);

    return await sanitizeSpecialist(entity);
  },

  async edit(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user.id;

    const payload = {
      ...ctx.request.body,
      specialist_role: ctx.request.body.role_id,
      updated_by: userId,
      updated_at: DateTime.local().toISO(),
    };

    const entity = await strapi
      .query("appointment-specialist")
      .update({ created_by: userId, id }, payload);

    return await sanitizeSpecialist(entity);
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user.id;

    const entity = await strapi
      .query("appointment-specialist")
      .delete({ id, created_by: userId });

    return await sanitizeSpecialist(entity);
  },
};
