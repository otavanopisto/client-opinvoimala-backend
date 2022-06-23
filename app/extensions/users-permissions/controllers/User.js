"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const {
  getAverageStars,
  getSummaryDetails,
} = require("../../../api/test/utils");
const {
  sanitizeImage,
  sanitizeOutcomes,
  sanitizeLink,
} = require("../../../utils/sanitizers");
const { composeLink } = require("../../../utils/links");
const { shuffleArray } = require("../../../utils/array");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
  });

const sanitizeAppointment = (appointment) =>
  sanitizeEntity(appointment, {
    model: strapi.query("appointment").model,
  });

const ME_POPULATE = ["role", "tags"];

module.exports = {
  /**
   * Retrieve authenticated user.
   * @return {Object|Array}
   */
  async me(ctx) {
    const id = ctx.state.user.id;
    const userService = strapi.plugins["users-permissions"].services.user;

    const user = await userService.fetch({ id }, ME_POPULATE);

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    ctx.body = sanitizeUser(user);
  },

  /**
   * Update user's tags
   * @return {Object|Array}
   */
  async updateTags(ctx) {
    const userId = ctx.state.user.id;
    const { tags } = ctx.request.body;

    const userService = strapi.plugins["users-permissions"].services.user;

    await userService.edit({ id: userId }, { tags });

    const user = await userService.fetch({ id: userId }, ME_POPULATE);

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    ctx.body = sanitizeUser(user);
  },

  /**
   * Retrieves interesting content based on user's tag preferences
   * @return {Object|Array}
   */
  async interests(ctx) {
    const userId = ctx.state.user.id;

    const userService = strapi.plugins["users-permissions"].services.user;
    const tagsService = strapi.services.tags;

    const user = await userService.fetch({ id: userId }, [
      ...ME_POPULATE,
      "completed_tests",
    ]);

    if (!user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const completedTestIds = user.completed_tests?.map(
      ({ test, test_snapshot }) => test ?? test_snapshot.id
    );

    const tagsIds = user.tags.map(({ id }) => id);

    const tags = await tagsService.find({ id_in: tagsIds, _limit: -1 }, [
      "pages.tags",
      "tests.tags",
    ]);

    const uniquePages = {};
    const uniqueTests = {};
    tags.forEach(({ pages, tests }) => {
      pages.forEach((page) => {
        const { id, slug, title, lead, tags } = page;
        uniquePages[id] = {
          id,
          slug,
          title,
          description: lead,
          tags: tags.map(({ name }) => name),
          type: "page",
          link: sanitizeLink(composeLink("page")(page)),
        };
      });
      tests.forEach((test) => {
        const { id, slug, name, description, tags, type } = test;
        // Include only tests that the user has not yet completed
        if (!completedTestIds.includes(id)) {
          uniqueTests[id] = {
            id,
            slug,
            title: name,
            description,
            tags: tags.map(({ name }) => name),
            type,
            link: sanitizeLink(composeLink("test")(test)),
          };
        }
      });
    });

    const pages = Object.keys(uniquePages).map((key) => uniquePages[key]);
    const tests = Object.keys(uniqueTests).map((key) => uniqueTests[key]);

    const interests = [...pages, ...tests];

    ctx.body = shuffleArray(interests);
  },

  async changePassword(ctx) {
    const ctxUser = ctx.state.user;

    const params = _.assign({}, ctx.request.body);

    const { currentPassword, newPassword, newPasswordConfirm } = params;

    if (currentPassword && newPassword && newPassword === newPasswordConfirm) {
      const userService = strapi.plugins["users-permissions"].services.user;

      const user = await userService.fetch({ id: ctxUser.id }, ME_POPULATE);

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
      await userService.edit({ id: user.id }, updateData);
      const updatedUser = await userService.fetch({ id: user.id }, ME_POPULATE);

      return ctx.send(sanitizeUser(updatedUser));
    }

    return ctx.badRequest("User.change_password.new_password.no_match");
  },

  async deleteAccount(ctx) {
    const userId = ctx.state.user.id;

    const userService = strapi.plugins["users-permissions"].services.user;
    const completedTestsService = strapi.services["completed-tests"];
    const appointmentService = strapi.services.appointment;

    // Remove completed tests related to the user
    const userTests = await completedTestsService.find({
      user: userId,
      _limit: -1,
    });
    if (userTests?.length) {
      Promise.all(
        userTests.map(async (test) => {
          return await completedTestsService.delete({ id: test.id });
        })
      );
    }

    // Handle existing appointments related to user
    const userAppointments = await appointmentService.find({
      user: userId,
      _limit: -1,
    });
    if (userAppointments?.length) {
      Promise.all(
        userAppointments.map(async (appointment) => {
          return await appointmentService.update(
            { id: appointment.id },
            { status: "available", user: null }
          );
          // Nice to have: Send an email to the specialist to tell his/her appointment was "cancelled"
        })
      );
    }

    // Finally, delete user
    const data = await userService.remove({ id: userId });

    if (data?.id === userId) {
      return {
        message: "Account deleted successfully",
      };
    }

    return ctx.badRequest("User.delete_account.fail");
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
      ctx.body = await sanitizeOutcomes(completed_test.outcomes);
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

    const affectsProfile = (test) => {
      // Test has to exist and also be published in order to affect user's profile
      return !!test?.affects_user_profile && !!test?.published_at;
    };

    const test_categories = await strapi.services["test-category"].find({
      _limit: -1,
    });
    const profile_tests = user.completed_tests.filter(({ test }) =>
      affectsProfile(test)
    );
    const outcomes = profile_tests.map((test) => test.outcomes);

    const stars = getAverageStars(outcomes);
    const { summary_text, details_text, show_summary } =
      await getSummaryDetails(stars);

    const categories = test_categories
      .filter(({ show_in_profile }) => !!show_in_profile)
      .map(({ id, label, order, image, test_category_link, tests }) => {
        const completed_tests = profile_tests.filter(belongsTo(id));

        return {
          id,
          label,
          order,
          image: sanitizeImage(image),
          test_category_link,
          stars: show_summary
            ? getAverageStars(completed_tests.map((test) => test.outcomes))
            : null,
          completed_tests: completed_tests.length,
          total_tests: tests.filter(affectsProfile).length,
        };
      })
      .sort((a, b) => a.order - b.order);

    ctx.body = {
      stars: show_summary ? stars : null,
      summary_text,
      details_text,
      completed_tests: _.sum(categories.map((c) => c.completed_tests)),
      categories,
    };
  },
};
