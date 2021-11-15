"use strict";

const { sanitizeEntity } = require("strapi-utils");
const { isPublic } = require("../../../utils/auth");
const { sortTests, isTestCompletedByUser } = require("../../test/utils");

const POPULATE = ["tests.roles"];

const composeSimpleTest = (user) => async (test) => ({
  id: test.id,
  name: test.name,
  slug: test.slug,
  type: test.type,
  description: test.description,
  is_public: isPublic(test.roles),
  published_at: test.published_at,
  updated_at: test.updated_at,
  completed_by_user: await isTestCompletedByUser(test.id, user?.id),
});

const sortCategories = (a, b) => {
  const primary = a.order - b.order;
  const secondary = a.label.localeCompare(b.label);
  return primary || secondary;
};

// "image"

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const user = ctx.state.user;
    let entities;

    if (ctx.query._q) {
      entities = await strapi.services["test-category"].search(ctx.query);
    } else {
      entities = await strapi.services["test-category"].find(
        ctx.query,
        POPULATE
      );
    }

    return await Promise.all(
      entities.sort(sortCategories).map(async (entity) => ({
        ...sanitizeEntity(entity, { model: strapi.models["test-category"] }),
        tests: await Promise.all(
          entity.tests?.sort(sortTests).map(composeSimpleTest(user))
        ),
      }))
    );
  },
};
