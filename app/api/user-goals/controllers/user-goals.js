"use strict";
const { DateTime } = require("luxon");
const { sanitizeEntity } = require("strapi-utils");
const { sanitizeImage } = require("../../../utils/sanitizers");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const DEFAULT_VISIBLE_GOALS = 4;

const sanitizeGoal = (entity) => {
  delete entity.user;
  return sanitizeEntity(entity, { model: strapi.models["user-goals"] });
};

const sortGoals =
  ({ groupByDone = false } = {}) =>
  (a, b) => {
    let primarySort = 0;
    if (groupByDone) {
      primarySort = a.done && !b.done ? 1 : b.done && !a.done ? -1 : 0;
    }

    const date1 = DateTime.fromJSDate(a.created_at);
    const date2 = DateTime.fromJSDate(b.created_at);
    const secondarySort = date1.diff(date2).toObject().milliseconds * -1;

    return primarySort || secondarySort;
  };

const goalsMetaData = async () => {
  return await strapi.services["goals"].find();
};

module.exports = {
  async find(ctx) {
    const user = ctx.state.user.id;

    const userGoals = await strapi.services["user-goals"].find({ user });
    const doneGoals = userGoals.filter(({ done }) => done);

    const { title, text, image, max_goals } = await goalsMetaData();

    return {
      title: title,
      info_text: text,
      image: sanitizeImage(image),
      done_total: doneGoals.length ?? 0,
      goals: userGoals
        .sort(sortGoals({ groupByDone: true }))
        .slice(0, max_goals ?? DEFAULT_VISIBLE_GOALS)
        .map(sanitizeGoal)
        .sort(sortGoals()),
    };
  },

  async create(ctx) {
    const user = ctx.state.user.id;

    const userGoals = await strapi.services["user-goals"].find({ user });

    const { max_goals } = goalsMetaData();

    const openGoals = userGoals.filter(({ done }) => !done);
    if (openGoals.length >= (max_goals ?? DEFAULT_VISIBLE_GOALS)) {
      // Too many open goals!
      return ctx.badRequest("user_goals.error.too_many_goals");
    }

    const goal = {
      ...ctx.request.body,
      user,
    };

    const entity = await strapi.services["user-goals"].create(goal);

    return sanitizeGoal(entity);
  },

  async update(ctx) {
    const user = ctx.state.user.id;
    const { id } = ctx.params;

    const goal = await strapi.services["user-goals"].findOne({ id, user });

    if (goal.done) {
      // Cannot edit goals that are marked as "done"
      return ctx.badRequest("user_goals.error.cannot_edit");
    }

    const patch = {
      description: ctx.request.body.description,
    };

    const entity = await strapi.services["user-goals"].update(
      { id: goal.id },
      patch
    );

    return sanitizeGoal(entity);
  },

  async markDone(ctx) {
    const user = ctx.state.user.id;
    const { id } = ctx.params;

    const entity = await strapi.services["user-goals"].update(
      { id, user },
      { done: true }
    );

    return sanitizeGoal(entity);
  },

  async delete(ctx) {
    const user = ctx.state.user.id;
    const { id } = ctx.params;

    const goal = await strapi.services["user-goals"].findOne({ id, user });

    if (!goal) {
      return ctx.badRequest("user_goals.error.not_found");
    }

    if (goal.done) {
      return ctx.badRequest("user_goals.error.cannot_delete");
    }

    await strapi.services["user-goals"].delete({ id: goal.id });

    return sanitizeGoal(goal);
  },
};
