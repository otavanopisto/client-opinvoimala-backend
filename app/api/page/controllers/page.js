"use strict";

const { sanitizePage } = require("../../../utils/sanitizers");
const { isPublic, isUserAllowed } = require("../../../utils/auth");

const POPULATE = [
  "users_permissions_roles",
  "link_list.links.page.users_permissions_roles",
];

const errorResponse = (ctx, errors, type) => {
  switch (type) {
    case "forbidden":
      return ctx.forbidden();
    default:
      return ctx.badRequest(null, [{ messages: errors }]);
  }
};

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const user = ctx.state.user;

    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.page.search(ctx.query);
    } else {
      entities = await strapi.services.page.find(ctx.query, POPULATE);
    }

    const allowedEntities = entities.filter((entity) => {
      const roles = entity.users_permissions_roles;
      return isPublic(roles) || isUserAllowed(user, roles);
    });

    if (entities.length && !allowedEntities.length) {
      return errorResponse(ctx, [], "forbidden");
    }

    return allowedEntities.map((entity) => sanitizePage(entity));
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    const page = await strapi.services.page.findOne({ id }, POPULATE);

    const roles = page.users_permissions_roles;
    if (isPublic(roles) || isUserAllowed(user, roles)) {
      return sanitizePage(page);
    }

    return errorResponse(ctx, [], "forbidden");
  },
};
