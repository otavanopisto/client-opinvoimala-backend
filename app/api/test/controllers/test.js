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

const toSimpleOption = ({ id, label }) => ({ id, label });

const getPointOptions = (template, question) =>
  question.point_options.length
    ? question.point_options
    : template.options.point_options;

const getSuitabilityOptions = (template, question) =>
  question.suitability_options.length
    ? question.suitability_options
    : template.options.suitability_options;

const getOptions = (template, question, outcome_type) => {
  const options =
    outcome_type === "suitability_of_answers"
      ? getSuitabilityOptions(template, question)
      : getPointOptions(template, question);

  return options.map(toSimpleOption);
};

const composeQuestion = (template, outcome_type) => (question) => {
  const composedQuestion = {
    ...question,
    options: getOptions(template, question, outcome_type),
    answer_type: question.answer_type?.type
      ? question.answer_type.type
      : template.options.answer_type.type,
  };

  delete composedQuestion.point_options;
  delete composedQuestion.suitability_options;

  return composedQuestion;
};

const composeTest = async (test) => {
  const template = await getTestTemplate(test.template);

  const outcome_type =
    !test.outcome_type || test.outcome_type === "from_template"
      ? template.outcome_type
      : test.outcome_type;

  const questions = test.questions.map(composeQuestion(template, outcome_type));

  delete test.template;
  delete test.outcomes;
  delete test.outcome_type;
  delete test.affects_user_profile;

  return { ...test, questions };
};

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
      allowedEntities.map(async (entity) =>
        sanitizeTest(await composeTest(entity))
      )
    );
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    const test = await strapi.services.test.findOne({ id }, POPULATE);

    const roles = test.roles;
    if (isPublic(roles) || isUserAllowed(user, roles)) {
      return sanitizeTest(await composeTest(test));
    }

    return errorResponse(ctx, [], "forbidden");
  },
};
