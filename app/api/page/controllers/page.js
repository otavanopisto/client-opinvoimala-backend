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

const composeSimplePage = (page) => ({
  id: page.id,
  title: page.title,
  slug: page.slug,
  is_public: isPublic(page.users_permissions_roles),
});

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

    // Complete entity is needed only when fetching just one page with either slug or id.
    if (!ctx.query.slug && !ctx.query.id) {
      // No slug or id -> return list of all entities, but strip them first.
      return entities.map(composeSimplePage);
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
