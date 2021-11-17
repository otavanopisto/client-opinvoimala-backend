"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const { getAverageStars, getSummaryText } = require("../../../api/test/utils");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

const sanitizeAppointment = (appointment) =>
  sanitizeEntity(appointment, {
    model: strapi.query("appointment").model,
  });

module.exports = {
  async changePassword(ctx) {
    const ctxUser = ctx.state.user;

    const params = _.assign({}, ctx.request.body);

    const { currentPassword, newPassword, newPasswordConfirm } = params;

    if (currentPassword && newPassword && newPassword === newPasswordConfirm) {
      const userService = strapi.plugins["users-permissions"].services.user;

      const user = await userService.fetch({ id: ctxUser.id }, ["role"]);

      if (!user) {
        return ctx.badRequest("User.change_password.user.not_exist");
      }

      const validPassword = await userService.validatePassword(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return ctx.badRequest("User.change_password.old_password.no_match");
      }

      // Note: New password will be hashed in userService's edit method below
      const updateData = { password: newPassword };
      const data = await userService.edit({ id: user.id }, updateData);

      return ctx.send(sanitizeUser(data));
    }

    return ctx.badRequest("User.change_password.new_password.no_match");
  },

  async getSpecialist(id) {
    const specialistService = strapi.services["appointment-specialist"];

    const specialist = await specialistService.findOne({ id });

    if (!specialist?.name && !specialist?.role) return null;

    return {
      id: specialist.id,
      name: specialist.name,
      role: specialist.specialist_role?.role,
      role_id: specialist.specialist_role?.id,
    };
  },

  /**
   * @return all appointments for authenticated user
   */
  async appointments(ctx) {
    const ctxUser = ctx.state.user;
    const userService = strapi.plugins["users-permissions"].services.user;

    const user = await userService.fetch({ id: ctxUser.id }, ["appointments"]);

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const appointments = await Promise.all(
      user.appointments?.map(async (appointment) => ({
        ...sanitizeAppointment(appointment),
        appointment_specialist: await this.getSpecialist(
          appointment.appointment_specialist
        ),
      }))
    );

    ctx.body = appointments ?? [];
  },

  async getTests(ctx) {
    const ctxUser = ctx.state.user;
    const userService = strapi.plugins["users-permissions"].services.user;

    const user = await userService.fetch({ id: ctxUser.id }, [
      "completed_tests.test.categories",
    ]);

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    ctx.body = user.completed_tests;
  },

  async findTestOutcome(ctx) {
    const { slug } = ctx.params;
    const ctxUser = ctx.state.user;
    const userService = strapi.plugins["users-permissions"].services.user;

    const user = await userService.fetch({ id: ctxUser.id }, [
      "completed_tests.test",
    ]);

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const completed_test = user.completed_tests.find(
      ({ test }) => test?.slug === slug
    );

    if (completed_test?.outcomes) {
      ctx.body = completed_test?.outcomes;
    }
  },

  async getTestsSummary(ctx) {
    const ctxUser = ctx.state.user;
    const userService = strapi.plugins["users-permissions"].services.user;

    const user = await userService.fetch({ id: ctxUser.id }, [
      "completed_tests.test.categories",
    ]);

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    // Checks if completed test belongs to a given category
    const belongsTo =
      (categoryId) =>
      ({ test }) => {
        const categoryIds = test?.categories?.map(({ id }) => id);
        return categoryIds?.includes(categoryId);
      };

    const test_categories = await strapi.services["test-category"].find();
    const outcomes = user.completed_tests.map((test) => test.outcomes);

    const stars = getAverageStars(outcomes);
    const { summary_text, details_text } = await getSummaryText(stars);

    ctx.body = {
      stars,
      summary_text,
      details_text,
      categories: test_categories.map(({ id, label, order, image, tests }) => {
        const completed_tests = user.completed_tests.filter(belongsTo(id));

        return {
          id,
          label,
          order,
          image,
          stars: getAverageStars(completed_tests.map((test) => test.outcomes)),
          completed_tests: completed_tests.length,
          total_tests: tests.length,
        };
      }),
    };
  },
};
