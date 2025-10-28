const defaultData = require('../defaultData');

function sanitizeString(value, fallback = '') {
  const str = typeof value === 'string' ? value.trim() : '';
  if (str.length === 0) {
    return fallback;
  }
  return str;
}

function sanitizeStringArray(values, fallback = []) {
  if (!Array.isArray(values)) {
    return fallback;
  }
  const cleaned = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);
  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeListGroups(groups, fallback = []) {
  if (!Array.isArray(groups)) {
    return fallback;
  }

  const cleaned = groups
    .map((group) => {
      if (!group || typeof group !== 'object') return null;
      const title = sanitizeString(group.title, '');
      const items = sanitizeStringArray(group.items, []);
      if (!title && items.length === 0) return null;
      return {
        title: title || 'Untitled',
        items,
      };
    })
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeEducation(entries, fallback = []) {
  if (!Array.isArray(entries)) {
    return fallback;
  }

  const cleaned = entries
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const title = sanitizeString(entry.title, '');
      const subtitle = sanitizeString(entry.subtitle, '');
      if (!title && !subtitle) return null;
      return {
        title: title || 'Untitled',
        subtitle,
      };
    })
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeSocialLinks(links, fallback = []) {
  if (!Array.isArray(links)) {
    return fallback;
  }

  const cleaned = links
    .map((link) => {
      if (!link || typeof link !== 'object') return null;
      const type = sanitizeString(link.type, '');
      const label = sanitizeString(link.label, '');
      const url = sanitizeString(link.url, '');
      const description = sanitizeString(link.description, '');
      if (!type || !label || !url) return null;
      return {
        type,
        label,
        url,
        description,
      };
    })
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeAboutContent(payload) {
  const fallback = defaultData.about;
  return {
    heroTitle: sanitizeString(payload.heroTitle, fallback.heroTitle),
    heroParagraphs: sanitizeStringArray(payload.heroParagraphs, fallback.heroParagraphs),
    heroImage: sanitizeString(payload.heroImage, fallback.heroImage),
    skills: sanitizeListGroups(payload.skills, fallback.skills),
    tools: sanitizeListGroups(payload.tools, fallback.tools),
    workExperience: sanitizeEducation(payload.workExperience, fallback.workExperience),
    education: sanitizeEducation(payload.education, fallback.education),
  };
}

function sanitizeContactContent(payload) {
  const fallback = defaultData.contact;
  const email = payload.email && typeof payload.email === 'object' ? payload.email : {};
  const phone = payload.phone && typeof payload.phone === 'object' ? payload.phone : {};

  return {
    title: sanitizeString(payload.title, fallback.title),
    subtitle: sanitizeString(payload.subtitle, fallback.subtitle),
    connectHeading: sanitizeString(payload.connectHeading, fallback.connectHeading),
    connectDescription: sanitizeString(payload.connectDescription, fallback.connectDescription),
    email: {
      label: sanitizeString(email.label, fallback.email.label),
      address: sanitizeString(email.address, fallback.email.address),
    },
    phone: {
      label: sanitizeString(phone.label, fallback.phone.label),
      number: sanitizeString(phone.number, fallback.phone.number),
    },
    socials: sanitizeSocialLinks(payload.socials, fallback.socials),
  };
}

module.exports = {
  sanitizeString,
  sanitizeStringArray,
  sanitizeListGroups,
  sanitizeEducation,
  sanitizeSocialLinks,
  sanitizeAboutContent,
  sanitizeContactContent,
};
