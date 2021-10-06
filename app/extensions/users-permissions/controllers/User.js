"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query("user", "users-permissions").model,
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
        return ctx.badRequest("User does not exist");
      }

      const validPassword = await userService.validatePassword(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return ctx.badRequest("Old password does not match.");
      }

      // Note: New password will be hashed in userService's edit method below
      const updateData = { password: newPassword };
      const data = await userService.edit({ id: user.id }, updateData);

      return ctx.send(sanitizeUser(data));
    }

    return ctx.badRequest("New passwords do not match.");
  },
};
