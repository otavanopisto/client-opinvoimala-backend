const { DateTime } = require("luxon");
const { getEmailFrom } = require("../../utils/email");

const formatDate = (isoDate) =>
  DateTime.fromISO(isoDate)
    .setZone("Europe/Helsinki")
    .setLocale("fi-FI")
    .toFormat("ccc f");

module.exports = {
  notifySpecialist: {
    appointmentConfirmationEmail: (appointment, name, email) => {
      const time = formatDate(appointment.start_time);

      const title = "Sinulle on tehty uusi ajanvaraus:";

      return {
        from: getEmailFrom(),
        to: appointment.appointment_specialist.email,
        subject: `Vahvistus varauksesta ${time}`,
        text: `
          ${title}
          
          Ajankohta: ${time}
          Opiskelija: ${name} (${email})
          Linkki: ${appointment.meeting_link}
          ${appointment.appointment_specialist.name_and_role}
          ID: ${appointment.id}
        `,
        html: `
          <strong>${title}</strong>
          <ul>
            <li>Ajankohta: ${time}</li>
            <li>Opiskelija: <b>${name}</b> (${email})</li>
            <li>Linkki ${appointment.meeting_link}</li>
            <li>${appointment.appointment_specialist.name_and_role}</li>
            <li>ID: ${appointment.id}</li>
          </ul>
        `,
      };
    },

    appointmentCancelledEmail: (appointment) => {
      const time = formatDate(appointment.start_time);
      const title =
        "Luomasi ajanvaraus on opiskelijan toimesta peruttu ja asetettu taas vapaasti varattavaksi.";

      return {
        from: getEmailFrom(),
        to: appointment.appointment_specialist.email,
        subject: `PERUUTETTU: Varaus ${time}`,
        text: `
          ${title}
  
          Ajankohta: ${time}
          ID: ${appointment.id}
        `,
        html: `
          <strong>${title}</strong>
          <ul>
            <li>Ajankohta: ${time}</li>
            <li>ID: ${appointment.id}</li>
          </ul>
        `,
      };
    },
  },

  notifyUser: {
    appointmentConfirmationEmail: (appointment, userEmail) => {
      const time = formatDate(appointment.start_time);

      const title = `Vahvistus varauksesta ${time}:`;

      return {
        from: getEmailFrom(),
        to: userEmail,
        subject: `Vahvistus varauksesta ${time}`,
        text: `
          ${title}
          
          Ajankohta: ${time}
          ${appointment.appointment_specialist.name_and_role}
          Linkki: ${appointment.meeting_link}
          ID: ${appointment.id}

          Varauksen voi perua Varaukset-sivulta 24 h ennen varauksen alkua
        `,
        html: `
          <strong>${title}</strong>
          <ul>
            <li>Ajankohta: ${time}</li>
            <li>${appointment.appointment_specialist.name_and_role}</li>
            <li>Linkki ${appointment.meeting_link}</li>
            <li>ID: ${appointment.id}</li>
          </ul>
          <p>Varauksen voi perua <a href="https://www.opinvoimala.fi/varaukset">Varaukset</a>-sivulta 24 h ennen varauksen alkua</p>
        `,
      };
    },
  },
};
