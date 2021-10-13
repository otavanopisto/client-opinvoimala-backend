"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const getMeetingLink = async (data) => {
  const appointment_specialist = await strapi
    .query("appointment-specialist")
    .findOne({ id: data.appointment_specialist }, []);

  return appointment_specialist.meeting_link;
};

module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      if (!data.meeting_link) {
        data.meeting_link = await getMeetingLink(data);
      }
    },

    beforeUpdate: async (params, data) => {
      if (!data.meeting_link) {
        data.meeting_link = await getMeetingLink(data);
      }
    },
  },
};
