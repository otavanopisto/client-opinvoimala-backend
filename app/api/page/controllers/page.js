"use strict";

const { sanitizeEntity } = require("strapi-utils");

const sanitizedPage = (page) => {
  delete page.users_permissions_roles;
  return sanitizeEntity(page, { model: strapi.models.page });
};

const errorResponse = (ctx, errors, type) => {
  switch (type) {
    case "forbidden":
      return ctx.forbidden();
    default:
      return ctx.badRequest(null, [{ messages: errors }]);
  }
};

const isPublicPage = (page) => {
  const roles = page.users_permissions_roles;
  const roleTypes = roles.map(({ type }) => type);

  return !roles.length || roleTypes.includes("public");
};

const isUserAllowed = (user, page) => {
  const roles = page.users_permissions_roles;
  const roleIds = roles.map(({ id }) => id);

  // Page is public if no roles are set
  if (!roles.length) return true;

  // No user or user has no role -> not allowed
  if (!user?.role) return false;

  // Allowed if user's role match to ones defined for the page
  return roleIds.includes(user.role.id);
};

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    const page = await strapi.services.page.findOne({ id });

    if (isPublicPage(page) || isUserAllowed(user, page)) {
      return sanitizedPage(page);
    }

    return errorResponse(ctx, [], "forbidden");
  },
};
