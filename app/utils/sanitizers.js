const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const { isPublic } = require("./auth");

const sanitizeLinkTarget = (target) => {
  if (!target || _.isEmpty(target)) return null;
  return {
    id: target.id,
    title: target.title,
    slug: target.slug,
    is_public: isPublic(target.users_permissions_roles),
  };
};

const sanitizeLink = (link) => {
  if (!link || _.isEmpty(link)) return null;
  return {
    ...link,
    page: sanitizeLinkTarget(link.page),
    test: sanitizeLinkTarget(link.test),
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

const sanitizePage = (page) => {
  if (!page || _.isEmpty(page)) return null;

  delete page.users_permissions_roles;
  const _page = {
    ...page,
    link_list: sanitizeLinkList(page.link_list),
  };
  return sanitizeEntity(_page, { model: strapi.models.page });
};

const sanitizeTest = (test) => {
  if (!test || _.isEmpty(test)) return null;

  delete test.roles;
  return sanitizeEntity(test, { model: strapi.models.test });
};

module.exports = {
  sanitizeLinkTarget,
  sanitizeLink,
  sanitizeCard,
  sanitizeFrontPage,
  sanitizeSettings,
  sanitizeNavigation,
  sanitizePage,
  sanitizeTest,
};
