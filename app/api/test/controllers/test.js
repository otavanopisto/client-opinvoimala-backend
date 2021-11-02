"use strict";

const _ = require("lodash");
const { sanitizeTest } = require("../../../utils/sanitizers");
const { isPublic, isUserAllowed } = require("../../../utils/auth");

const POPULATE = ["roles", "categories.image"];

const errorResponse = (ctx, errors, type) => {
  switch (type) {
    case "forbidden":
      return ctx.forbidden();
    default:
      return ctx.badRequest(null, [{ messages: errors }]);
  }
};

const getTestTemplate = async (id) => {
  const templateService = strapi.services["test-templates"];
  return await templateService.findOne({ id }, ["options"]);
};

const composeSimpleTest = (test) => ({
  id: test.id,
  name: test.name,
  slug: test.slug,
  type: test.type,
  description: test.description,
  is_public: isPublic(test.roles),
  categories: test.categories.map((category) => ({
    id: category.id,
    label: category.label,
  })),
  published_at: test.published_at,
  updated_at: test.updated_at,
});

const sortTests = (a, b) => {
  return b.published_at.localeCompare(a.published_at);
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
      entities = await strapi.services.test.search(ctx.query);
    } else {
      entities = await strapi.services.test.find(ctx.query, POPULATE);
    }

    // Complete entity is needed only when fetching just one test with either slug or id.
    if (!ctx.query.slug && !ctx.query.id) {
      // No slug or id -> return list of all entities, but strip them first.
      return entities.map(composeSimpleTest).sort(sortTests);
    }

    const allowedEntities = entities.filter((entity) => {
      return isPublic(entity.roles) || isUserAllowed(user, entity.roles);
    });

    if (entities.length && !allowedEntities.length) {
      return errorResponse(ctx, [], "forbidden");
    }

    return Promise.all(
      allowedEntities.map(async (entity) => ({
        ...entity,
        template: await getTestTemplate(entity.template),
      }))
    );
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    const test = await strapi.services.test.findOne({ id }, POPULATE);

    const roles = test.roles;
    if (isPublic(roles) || isUserAllowed(user, roles)) {
      return sanitizeTest({
        ...test,
        template: await getTestTemplate(test.template),
      });
    }

    return errorResponse(ctx, [], "forbidden");
  },
};
