"use strict";

const { has, prop, pick, concat } = require("lodash/fp");
const { PUBLISHED_AT_ATTRIBUTE } =
  require("strapi-utils").contentTypes.constants;

const { getService } = require("strapi-plugin-content-manager/utils");

// Restricted users should see only their own data for restricted fields.
const isRestricted = (user, targetField) => {
  const userRoles = user.roles.map(({ code }) => code);
  const restrictedFields = ["appointment_specialist", "user"];
  const isRestrictedRole = userRoles.includes("strapi-author");
  const isRestrictedField = restrictedFields.includes(targetField);

  return isRestrictedRole && isRestrictedField;
};

module.exports = {
  async find(ctx) {
    const { user } = ctx.state;
    const { model, targetField } = ctx.params;
    const { _component, ...query } = ctx.request.query;
    const { idsToOmit } = ctx.request.body;

    if (!targetField) {
      return ctx.badRequest();
    }

    const modelDef = _component
      ? strapi.db.getModel(_component)
      : strapi.db.getModel(model);

    if (!modelDef) {
      return ctx.notFound("model.notFound");
    }

    const attr = modelDef.attributes[targetField];
    if (!attr) {
      return ctx.badRequest("targetField.invalid");
    }

    const target = strapi.db.getModelByAssoc(attr);

    if (!target) {
      return ctx.notFound("target.notFound");
    }

    if (idsToOmit && Array.isArray(idsToOmit)) {
      query._where = query._where || {};
      query._where.id_nin = concat(query._where.id_nin || [], idsToOmit);
    }

    if (isRestricted(user, targetField)) {
      query.created_by = `${user.id}`;
    }

    const entityManager = getService("entity-manager");

    let entities = [];

    if (has("_q", ctx.request.query)) {
      entities = await entityManager.search(query, target.uid);
    } else {
      entities = await entityManager.find(query, target.uid);
    }

    if (!entities) {
      return ctx.notFound();
    }

    const modelConfig = _component
      ? await getService("components").findConfiguration(modelDef)
      : await getService("content-types").findConfiguration(modelDef);

    const field =
      prop(`metadatas.${targetField}.edit.mainField`, modelConfig) || "id";
    const pickFields = [field, "id", target.primaryKey, PUBLISHED_AT_ATTRIBUTE];

    ctx.body = entities.map(pick(pickFields));
  },
};
