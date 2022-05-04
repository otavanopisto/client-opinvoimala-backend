const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const { isPublic } = require("./auth");
const { generateLinkList } = require("./links");

const sanitizeImage = (image) => {
  if (!image || _.isEmpty(image)) return null;
  return {
    id: image.id,
    url: image.url,
    alternativeText: image.alternativeText,
    caption: image.caption,
  };
};

const sanitizeLinkTarget = (target, roles = []) => {
  if (!target || _.isEmpty(target)) return null;
  return {
    id: target.id,
    title: target.title,
    slug: target.slug,
    is_public: isPublic(roles),
  };
};

const sanitizeLink = (link) => {
  if (!link || _.isEmpty(link)) return null;
  return {
    ...link,
    page: sanitizeLinkTarget(link.page, link.page?.users_permissions_roles),
    test: sanitizeLinkTarget(link.test, link.test?.roles),
    // TODO: Just return one target/href/src/etc value based on link.type:
    // target: sanitizeLinkTarget(getLinkTarget(link))
    // page: null,
    // test: null,
    // internal: null,
    // external: null,
  };
};

const sanitizeLinkList = (linkList) => {
  if (!linkList || _.isEmpty(linkList)) return null;
  delete linkList.page_tags;
  delete linkList.test_tags;
  return {
    ...linkList,
    links: linkList.links.map(sanitizeLink),
  };
};

const sanitizeCard = (card) => {
  if (!card || _.isEmpty(card)) return null;
  return {
    ...card,
    link: sanitizeLink(card.link),
  };
};

const sanitizeFrontPage = (frontPage) => {
  if (!frontPage || _.isEmpty(frontPage)) return null;
  const _frontPage = {
    ...frontPage,
    cards: frontPage.cards.map(sanitizeCard),
  };
  return sanitizeEntity(_frontPage, { model: strapi.models["front-page"] });
};

const sanitizeSettings = (settings) => {
  if (!settings || _.isEmpty(settings)) return null;

  const _settings = {
    ...settings,
    links: settings.links.map(sanitizeLink),
  };

  return sanitizeEntity(_settings, { model: strapi.models.settings });
};

const sanitizeNavigation = (navigation) => {
  if (!navigation || _.isEmpty(navigation)) return null;

  const _navigation = {
    ...navigation,
    items: navigation.items.map((navItem) => ({
      ...navItem,
      links: navItem.links.map(sanitizeLink),
    })),
  };

  return sanitizeEntity(_navigation, { model: strapi.models.navigation });
};

const sanitizePage = async (page) => {
  if (!page || _.isEmpty(page)) return null;

  delete page.users_permissions_roles;

  const generated_link_list = await generateLinkList({
    entityId: page.id,
    pageTags: page.link_list?.page_tags,
    testTags: page.link_list?.test_tags,
  });

  const combined_link_list = [
    ...(page.link_list?.links ?? []),
    ...generated_link_list,
  ];

  const _page = {
    ...page,
    link_list: sanitizeLinkList({
      ...page.link_list,
      links: combined_link_list,
    }),
  };
  return sanitizeEntity(_page, { model: strapi.models.page });
};

const sanitizeTest = (test) => {
  if (!test || _.isEmpty(test)) return null;

  delete test.roles;
  return sanitizeEntity(test, { model: strapi.models.test });
};

const sanitizeOutcomes = async (testOutcomes) => {
  if (!testOutcomes || _.isEmpty(testOutcomes)) return null;

  const { link_list_page_tags, link_list_test_tags, ...outcomes } =
    testOutcomes;

  const generated_link_list = await generateLinkList({
    entityId: outcomes.id,
    pageTags: link_list_page_tags,
    testTags: link_list_test_tags,
  });

  const combined_link_list = [
    ...(outcomes.link_list ?? []),
    ...generated_link_list,
  ];

  return {
    ...outcomes,
    link_list: combined_link_list.map(sanitizeLink),
  };
};

const sanitizeEvent = (event) => {
  if (!event || _.isEmpty(event)) return null;

  const _event = {
    ...event,
    image: sanitizeImage(event.image),
    links: event.links.map(sanitizeLink),
  };
  return sanitizeEntity(_event, { model: strapi.models.events });
};

const getRole = async (id) => {
  if (!id) return null;
  return await strapi.services["specialist-role"].findOne({ id });
};

const sanitizeSpecialist = async (specialist) => {
  if (!specialist) return null;

  const { id, name, specialist_role } = specialist;

  const role_id = specialist_role?.id
    ? specialist_role.id
    : Number(specialist_role);

  const role = specialist_role?.role ? specialist_role : await getRole(role_id);

  return { id, name, role: role?.role, role_id: role?.id };
};

const sanitizeAppointment = async (appointment) => {
  const { appointment_specialist } = appointment;
  const entity = {
    ...appointment,
    appointment_specialist: await sanitizeSpecialist(appointment_specialist),
  };

  return sanitizeEntity(entity, { model: strapi.models.appointment });
};

module.exports = {
  sanitizeImage,
  sanitizeLinkTarget,
  sanitizeLink,
  sanitizeCard,
  sanitizeFrontPage,
  sanitizeSettings,
  sanitizeNavigation,
  sanitizePage,
  sanitizeTest,
  sanitizeOutcomes,
  sanitizeEvent,
  sanitizeSpecialist,
  sanitizeAppointment,
};
