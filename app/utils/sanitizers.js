const { sanitizeEntity } = require("strapi-utils");

const sanitizePageForNavigation = (page) => {
  if (!page) return null;
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    is_public: !page.users_permissions_roles?.length,
  };
};

const sanitizeLink = (link) => {
  if (!link) return null;
  return {
    ...link,
    page: sanitizePageForNavigation(link.page),
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

module.exports = {
  sanitizePageForNavigation,
  sanitizeLink,
  sanitizeCard,
  sanitizeFrontPage,
  sanitizeSettings,
  sanitizeNavigation,
};
