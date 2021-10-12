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

module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      data.name_and_role = await getNameAndRole(data);
    },

    beforeUpdate: async (params, data) => {
      data.name_and_role = await getNameAndRole(data);
    },
  },
};
