const { sanitizeEntity } = require("strapi-utils");
const { isPublic } = require("./auth");

const sanitizeLinkTarget = (target) => {
  if (!target) return null;
  return {
    id: target.id,
    title: target.title,
    slug: target.slug,
    is_public: isPublic(target.users_permissions_roles),
  };
};

const sanitizeLink = (link) => {
  if (!link) return null;
  return {
    ...link,
    page: sanitizeLinkTarget(link.page),
  };
};

const sanitizeLinkList = (linkList) => {
  if (!linkList) return null;
  return {
    ...linkList,
    links: linkList.links.map(sanitizeLink),
  };
};

const sanitizeCard = (card) => {
  if (!card) return null;
  return {
    ...card,
    link: sanitizeLink(card.link),
  };
};

const sanitizeFrontPage = (frontPage) => {
  if (!frontPage) return null;
  const _frontPage = {
    ...frontPage,
    cards: frontPage.cards.map(sanitizeCard),
  };
  return sanitizeEntity(_frontPage, { model: strapi.models["front-page"] });
};

const sanitizeSettings = (settings) => {
  if (!settings) return null;

  const _settings = {
    ...settings,
    links: settings.links.map(sanitizeLink),
  };

  return sanitizeEntity(_settings, { model: strapi.models.settings });
};

const sanitizeNavigation = (navigation) => {
  if (!navigation) return null;

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
  delete page.users_permissions_roles;
  const _page = {
    ...page,
    link_list: sanitizeLinkList(page.link_list),
  };
  return sanitizeEntity(_page, { model: strapi.models.page });
};

module.exports = {
  sanitizeLinkTarget,
  sanitizeLink,
  sanitizeCard,
  sanitizeFrontPage,
  sanitizeSettings,
  sanitizeNavigation,
  sanitizePage,
};
