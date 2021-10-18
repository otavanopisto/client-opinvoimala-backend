"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

const STATUS = {
  AVAILABLE: "available",
  BOOKED: "booked",
  CANCELLED: "cancelled",
  HIDDEN: "hidden",
};

const getMeetingLink = async (data) => {
  const appointment_specialist = await strapi
    .query("appointment-specialist")
    .findOne({ id: data.appointment_specialist }, []);

  return appointment_specialist.meeting_link;
};

const deriveValidValues = async (data) => {
  if (!data.meeting_link) {
    // If meeting link is not set, find one from specialist's settings
    data.meeting_link = await getMeetingLink(data);
  }
  if (data.status === STATUS.AVAILABLE) {
    // Status was set to "available" -> Can't be assigned to any user
    data.user = null;
  }
};

module.exports = {
  lifecycles: {
    beforeCreate: async (data) => {
      await deriveValidValues(data);
    },

    beforeUpdate: async (params, data) => {
      await deriveValidValues(data);
    },
  },
};
