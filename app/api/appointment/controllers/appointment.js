"use strict";

const { sanitizeEntity } = require("strapi-utils");
const { DateTime } = require("luxon");
const {
  notifySpecialist,
  notifyUser,
} = require("../../../emails/appointment/appointment-emails");
const { createEmailTransporter } = require("../../../utils/email");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const CANCEL_BEFORE_HOURS = 24;

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const ERROR = {
  UNAUTHORIZED: {
    id: "unauthorized",
    message: "Appointment not found",
  },
  MAKE_APPOINTMENT: {
    REQUEST_BODY: {
      PROVIDE: {
        id: "appointment.request_body.provide",
        message: "Provide name and valid email address",
      },
    },
    NOT_FOUND: {
      id: "appointment.make.not_found",
      message: "Appointment not found",
    },
    NOT_AVAILABLE: {
      id: "appointment.make.not_available",
      message: "Appointment not available",
    },
    FAIL: {
      id: "appointment.make.failed",
      message: "Book appointment failed",
    },
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

const errorResponse = (ctx, errors) => {
  return ctx.badRequest(null, [{ messages: errors }]);
};

const timeFromNow = (isoDate, unit = "hours") => {
  const now = DateTime.local();
  const date = DateTime.fromISO(isoDate);
  const diff = date.diff(now, [unit]);

  return diff.toObject()[unit];
};

const getRole = async (id) => {
  if (!id) return null;
  return await strapi.services["specialist-role"].findOne({ id });
};

const sanitizeSpecialist = async (specialist) => {
  if (!specialist) return null;

  const { id, name, specialist_role } = specialist;

  const role_id = specialist_role?.id
    ? specialist_role.id
    : Number(specialist_role);

  const role = specialist_role?.role ? specialist_role : await getRole(role_id);

  return { id, name, role: role?.role, role_id: role?.id };
};

const sanitizeAppointment = async (appointment) => {
  const { appointment_specialist } = appointment;
  const entity = {
    ...appointment,
    appointment_specialist: await sanitizeSpecialist(appointment_specialist),
  };

  return sanitizeEntity(entity, { model: strapi.models.appointment });
};

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.appointment.search(ctx.query);
    } else {
      entities = await strapi
        .query("appointment")
        .find(ctx.query, [
          "appointment_specialist",
          "appointment_specialist.specialist_role",
        ]);
    }

    return Promise.all(
      entities.map(
        async (appointment) => await sanitizeAppointment(appointment)
      )
    );
  },

  async makeAppointment(ctx) {
    const { id } = ctx.params;
    const ctxUser = ctx.state.user;

    // User's name & email are _ONLY_ to be used in a confirmation emails
    // send to the user & specialist who is hosting the meeting.
    // Do not store these in DB or sent to anywhere else.
    const { name, email } = ctx.request.body;
    const isEmail = emailRegExp.test(email);

    const appointmentService = strapi.services.appointment;
    const userService = strapi.plugins["users-permissions"].services.user;

    const user = await userService.fetch({ id: ctxUser.id }, ["appointments"]);
    const appointment = await appointmentService.findOne({ id }, [
      "appointment_specialist",
    ]);

    if (!name || !email || !isEmail) {
      return errorResponse(ctx, [ERROR.MAKE_APPOINTMENT.REQUEST_BODY.PROVIDE]);
    }
    if (!user) {
      return errorResponse(ctx, [ERROR.UNAUTHORIZED]);
    }
    if (!appointment) {
      return errorResponse(ctx, [ERROR.MAKE_APPOINTMENT.NOT_FOUND]);
    }
    if (appointment.status !== "available" || !!appointment.user) {
      return errorResponse(ctx, [ERROR.MAKE_APPOINTMENT.NOT_AVAILABLE]);
    }

    const body = { status: "booked", user: user.id };
    const entity = await strapi.services.appointment.update({ id }, body);

    if (entity.user.id === user.id && entity.status === "booked") {
      const sanitizedEntity = await sanitizeAppointment(entity);

      try {
        const userEmail = notifyUser.appointmentConfirmationEmail(
          appointment,
          email
        );

        const specialistEmail = notifySpecialist.appointmentConfirmationEmail(
          appointment,
          name,
          email
        );

        const transporter = createEmailTransporter();

        // Send confirmation to the user
        await transporter.sendMail(userEmail);

        // Send confirmation to specialist
        await transporter.sendMail(specialistEmail);
      } catch (err) {
        return ctx.send({
          data: sanitizedEntity,
          message: "Success, but notification email(s) couldn't be sent",
        });
      }

      return ctx.send({
        data: sanitizedEntity,
      });
    } else {
      return errorResponse(ctx, [ERROR.MAKE_APPOINTMENT.FAIL]);
    }
  },

  async cancel(ctx) {
    const { id } = ctx.params;
    const ctxUser = ctx.state.user;

    const appointmentService = strapi.services.appointment;
    const userService = strapi.plugins["users-permissions"].services.user;

    const user = await userService.fetch({ id: ctxUser.id }, ["appointments"]);
    const appointment = await appointmentService.findOne({ id }, [
      "appointment_specialist",
    ]);

    if (!user) {
      return errorResponse(ctx, [ERROR.UNAUTHORIZED]);
    }

    const userAppointmentIds = user.appointments.map(({ id }) => id);

    if (!userAppointmentIds.includes(Number(id))) {
      return errorResponse(ctx, [ERROR.CANCEL.NOT_FOUND]);
    }

    if (timeFromNow(appointment.start_time) < CANCEL_BEFORE_HOURS) {
      return errorResponse(ctx, [ERROR.CANCEL.TOO_LATE]);
    }

    const body = { status: "available", user: null };
    const entity = await strapi.services.appointment.update({ id }, body);

    if (entity.user === null && entity.status === "available") {
      try {
        const email = notifySpecialist.appointmentCancelledEmail(appointment);
        await createEmailTransporter().sendMail(email);
      } catch (err) {
        return ctx.send({
          ok: true,
          message: "Notification email to specialist couldn't be sent",
        });
      }

      return ctx.send({ ok: true });
    } else {
      return errorResponse(ctx, [ERROR.CANCEL.FAIL]);
    }
  },
};
