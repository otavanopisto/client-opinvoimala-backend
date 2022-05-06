const { DateTime } = require("luxon");
const finnishholidays = require("finnish-holidays-js");

const LOCALE = "fi-FI";
const TIMEZONE = "Europe/Helsinki";

// interface DateOptions {
//   format?: string;
//   timezone?: string;
//   locale?: string;
// }

const localizedDate = (
  isoDate,
  { timezone = TIMEZONE, locale = LOCALE } = {}
) => {
  return DateTime.fromISO(isoDate).setZone(timezone).setLocale(locale);
};

const today = () => {
  const nowISO = DateTime.now().toISO();
  return localizedDate(nowISO);
};

const isFutureDate = (isoDate, options = {}) => {
  return today() < localizedDate(isoDate, options);
};

const isPastDate = (isoDate, options = {}) => {
  return today() >= localizedDate(isoDate, options);
};

const isSameDay = (isoDate1, isoDate2, options = {}) => {
  const date1 = localizedDate(isoDate1, options);
  const date2 = localizedDate(isoDate2, options);
  return date1.startOf("day").toMillis() === date2.startOf("day").toMillis();
};

const mergeDateAndTime = (isoDate, isoTime) => {
  const date = localizedDate(isoDate);
  const time = localizedDate(isoTime);

  return time
    .set({
      year: date.year,
      month: date.month,
      day: date.day,
    })
    .toISO();
};

const isWeekend = (dateTime) => dateTime.weekday >= 6;

const isHoliday = (dateTime) => {
  const holidays = finnishholidays.month(dateTime.month, dateTime.year);
  return !!holidays.find(({ day }) => day === dateTime.day);
};

module.exports = {
  localizedDate,
  today,
  isFutureDate,
  isPastDate,
  isSameDay,
  mergeDateAndTime,
  isWeekend,
  isHoliday,
};
