"use strict";
const { DateTime } = require("luxon");
const { sanitizeAppointment } = require("../../../utils/sanitizers");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const userId = ctx.state.user.id;

    const date_threshold = DateTime.local()
      .minus({ days: 1 })
      .startOf("day")
      .toISO();

    const entities = await strapi
      .query("appointment")
      .find({ created_by: userId, start_time_gte: date_threshold }, [
        "appointment_specialist",
        "appointment_specialist.specialist_role",
      ]);

    return Promise.all(
      entities.map(
        async (appointment) => await sanitizeAppointment(appointment)
      )
    );
  },

  async create(ctx) {
    const userId = ctx.state.user.id;

    const payload = {
      ...ctx.request.body,
      created_by: userId,
      updated_by: userId,
    };

    const entity = await strapi.query("appointment").create(payload);
    return sanitizeAppointment(entity);
  },

  async edit(ctx) {
    const userId = ctx.state.user.id;
    const { id } = ctx.params;

    const payload = {
      ...ctx.request.body,
      updated_by: userId,
    };

    const query = { id, created_by: userId };
    const entity = await strapi.query("appointment").update(query, payload);
    return sanitizeAppointment(entity);
  },

  async cancel(ctx) {
    const { id } = ctx.params;
    const userId = ctx.state.user.id;

    const entity = await strapi
      .query("appointment")
      .update({ id, created_by: userId }, { status: "cancelled" });

    if (entity.id === Number(id)) {
      ctx.send({ ok: true });
    } else {
      ctx.send({ ok: false });
    }
  },
};
