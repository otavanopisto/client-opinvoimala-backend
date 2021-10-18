"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const getNameAndRole = async (data) => {
  const specialist_role = await strapi
    .query("specialist-role")
    .findOne({ id: data.specialist_role }, []);

  return `${specialist_role.role} ${data.name}`;
};

const getSpecialistEmail = async (data) => {
  const creator = await strapi
    .query("user", "admin")
    .findOne({ id: data.updated_by ?? data.created_by });

  return creator?.email;
};

module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      if (!data.email) data.email = await getSpecialistEmail(data);
      data.name_and_role = await getNameAndRole(data);
    },

    beforeUpdate: async (params, data) => {
      if (!data.email) data.email = await getSpecialistEmail(data);
      data.name_and_role = await getNameAndRole(data);
    },
  },
};
