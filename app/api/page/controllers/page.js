"use strict";

const { sanitizePage, sanitizeFeedback } = require("../../../utils/sanitizers");
const { isPublic, isUserAllowed } = require("../../../utils/auth");
const { updateLikes } = require("../../../utils/feedback");

const POPULATE = [
  "users_permissions_roles",
  "link_list.links.page.users_permissions_roles",
  "link_list.links.test.roles",
];

const errorResponse = (ctx, errors, type) => {
  switch (type) {
    case "forbidden":
      return ctx.forbidden();
    case "not_found":
      return ctx.notFound();
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

    return Promise.all(
      allowedEntities.map(async (entity) => await sanitizePage(entity))
    );
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

  async feedback(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const { type } = ctx.request.body;

    const page = await strapi.services.page.findOne({ id }, POPULATE);

    if (!page) return errorResponse(ctx, [], "not_found");

    if (page.feedback?.show_feedback) {
      const { likes, dislikes } = updateLikes(type, page.likes, page.dislikes);

      const roles = page.users_permissions_roles;
      if (isPublic(roles) || isUserAllowed(user, roles)) {
        const updatedPage = await strapi
          .query("page")
          .update({ id }, { likes, dislikes });

        return sanitizeFeedback(updatedPage.feedback, likes, dislikes);
      }
    }

    return errorResponse(ctx, [], "forbidden");
  },
};
