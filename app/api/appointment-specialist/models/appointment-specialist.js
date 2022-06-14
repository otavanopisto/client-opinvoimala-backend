"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const getNameAndRole = async (data) => {
  let specialist_role = { role: "" };
  if (data.specialist_role) {
    specialist_role = await strapi
      .query("specialist-role")
      .findOne({ id: data.specialist_role }, []);
  }

  return `${specialist_role.role} ${data.name}`;
};

const getCreator = async (data) => {
  return await strapi
    .query("user", "admin")
    .findOne({ id: data.updated_by ?? data.created_by });
};

const getSpecialistEmail = async (data) => {
  const creator = await getCreator(data);
  return creator?.email;
};

const getSpecialistName = async (data) => {
  const creator = await getCreator(data);
  return `${creator?.firstname} ${creator?.lastname}`;
};

module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      if (!data.email?.length) data.email = await getSpecialistEmail(data);
      if (!data.name?.length) data.name = await getSpecialistName(data);
      data.name_and_role = await getNameAndRole(data);
    },

    beforeUpdate: async (params, data) => {
      if (!data.email?.length) data.email = await getSpecialistEmail(data);
      if (!data.name?.length) data.name = await getSpecialistName(data);
      data.name_and_role = await getNameAndRole(data);
    },
  },
};
