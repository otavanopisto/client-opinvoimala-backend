"use strict";

const { DateTime } = require("luxon");
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const CANCEL_BEFORE_HOURS = 24;

const ERROR = {
  UNAUTHORIZED: {
    id: "unauthorized",
    message: "Appointment not found",
  },
  CANCEL: {
    NOT_FOUND: {
      id: "appointment.cancel.not_found",
      message: "Appointment not found",
    },
    FAIL: {
      id: "appointment.cancel.failed",
      message: "Cancel appointment failed",
    },
    TOO_LATE: {
      id: "appointment.cancel.too_late",
      message: "Too close to appointment, cannot cancel anymore",
    },
  },
};

const timeFromNow = (isoDate, unit = "hours") => {
  const now = DateTime.local();
  const date = DateTime.fromISO(isoDate);
  const diff = date.diff(now, [unit]);

  return diff.toObject()[unit];
};

const getCancelEmail = (to) => {
  const subject = "PERUUTUS: Ajanvaraus peruttu";
  const message = `Luomasi ajanvaraus (ID=${appointment.id}, aika ${appointment.start_time}) on opiskelijan toimesta peruttu ja asetettu taas vapaasti varattavaksi.`;

  return {
    to,
    subject,
    text: message,
    html: message,
  };
};

module.exports = {
  async cancel(ctx) {
    const { id } = ctx.params;
    const ctxUser = ctx.state.user;

    const appointmentService = strapi.services.appointment;
    const userService = strapi.plugins["users-permissions"].services.user;
    const emailService = strapi.plugins["email"].services.email;

    const user = await userService.fetch({ id: ctxUser.id }, ["appointments"]);
    const appointment = await appointmentService.findOne({ id }, [
      "appointment_specialist",
    ]);

    if (!user) {
      return ctx.badRequest(null, [{ messages: [ERROR.UNAUTHORIZED] }]);
    }

    const userAppointmentIds = user.appointments.map(({ id }) => id);

    if (!userAppointmentIds.includes(Number(id))) {
      return ctx.badRequest(null, [{ messages: [ERROR.CANCEL.NOT_FOUND] }]);
    }

    if (timeFromNow(appointment.start_time) < CANCEL_BEFORE_HOURS) {
      return ctx.badRequest(null, [{ messages: [ERROR.CANCEL.TOO_LATE] }]);
    }

    const body = { status: "available", user: null };
    const entity = await strapi.services.appointment.update({ id }, body);

    if (entity.user === null && entity.status === "available") {
      try {
        const email = getCancelEmail(appointment.appointment_specialist.email);
        await emailService.send(email);
      } catch (err) {
        return ctx.send({
          ok: true,
          message: "Notification email to specialist couldn't be sent",
        });
      }

      return ctx.send({ ok: true });
    } else {
      return ctx.badRequest(null, [{ messages: [ERROR.CANCEL.FAIL] }]);
    }
  },
};
