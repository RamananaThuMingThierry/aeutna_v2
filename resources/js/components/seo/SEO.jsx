import { useEffect } from "react";

import { SEO_PAGES, SITE_SEO } from "../../seo/config";

function getBaseUrl() {
  const metaAppUrl = document.querySelector('meta[name="app-url"]')?.getAttribute("content");
  return (metaAppUrl || window.location.origin).replace(/\/$/, "");
}

function toAbsoluteUrl(value) {
  if (!value) return `${getBaseUrl()}${SITE_SEO.defaultImage}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${getBaseUrl()}${value.startsWith("/") ? value : `/${value}`}`;
}

function normalizeCanonicalUrl(value) {
  const fallback = `${getBaseUrl()}${window.location.pathname}`;
  const rawValue = value || fallback;

  try {
    const url = new URL(rawValue, getBaseUrl());
    url.hash = "";
    url.search = "";
    return url.toString();
  } catch {
    return fallback;
  }
}

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function ensureLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function ensureScript(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("script");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function buildStructuredData({ finalCanonical, finalDescription, finalImage, finalTitle, pageConfig }) {
  const baseUrl = getBaseUrl();
  const pageName = pageConfig?.breadcrumb || finalTitle;
  const schemaType = pageConfig?.schemaType || "WebPage";

  const graph = [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: SITE_SEO.organization.legalName,
      alternateName: SITE_SEO.organization.shortName,
      url: `${baseUrl}/`,
      logo: {
        "@type": "ImageObject",
        url: finalImage,
      },
      image: finalImage,
      email: SITE_SEO.organization.email,
      telephone: SITE_SEO.organization.telephone,
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE_SEO.organization.addressLocality,
        addressCountry: SITE_SEO.organization.addressCountry,
      },
      sameAs: SITE_SEO.organization.sameAs,
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: `${baseUrl}/`,
      name: SITE_SEO.siteName,
      description: SITE_SEO.defaultDescription,
      inLanguage: SITE_SEO.lang,
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
    },
    {
      "@type": schemaType,
      "@id": `${finalCanonical}#webpage`,
      url: finalCanonical,
      name: finalTitle,
      description: finalDescription,
      inLanguage: SITE_SEO.lang,
      isPartOf: {
        "@id": `${baseUrl}/#website`,
      },
      about: {
        "@id": `${baseUrl}/#organization`,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: finalImage,
      },
    },
  ];

  if (pageConfig?.path && pageConfig.path !== "/") {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${finalCanonical}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil",
          item: `${baseUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: pageName,
          item: finalCanonical,
        },
      ],
    });
  }

  if (schemaType === "ContactPage") {
    graph.push({
      "@type": "ContactPoint",
      "@id": `${finalCanonical}#contact-point`,
      contactType: "customer support",
      email: SITE_SEO.organization.email,
      telephone: SITE_SEO.organization.telephone,
      availableLanguage: ["French"],
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export default function SEO({
  page,
  title,
  description,
  keywords,
  image,
  path,
  canonical,
  noindex,
  type = "website",
  lang,
}) {
  useEffect(() => {
    const pageConfig = page ? SEO_PAGES[page] || {} : {};
    const resolvedTitle = title || pageConfig.title || SITE_SEO.defaultTitle;
    const finalTitle = resolvedTitle === SITE_SEO.defaultTitle
      ? SITE_SEO.defaultTitle
      : `${resolvedTitle}${SITE_SEO.titleSeparator}${SITE_SEO.siteName}`;
    const finalDescription = description || pageConfig.description || SITE_SEO.defaultDescription;
    const finalKeywords = keywords || pageConfig.keywords || SITE_SEO.defaultKeywords;
    const resolvedPath = canonical || path || pageConfig.path || window.location.pathname;
    const finalCanonical = normalizeCanonicalUrl(resolvedPath);
    const finalImage = toAbsoluteUrl(image || pageConfig.image || SITE_SEO.defaultImage);
    const finalImageAlt = pageConfig.imageAlt || SITE_SEO.defaultImageAlt;
    const shouldNoindex = Boolean(noindex ?? pageConfig.noindex);
    const robots = shouldNoindex ? "noindex, nofollow" : SITE_SEO.robots;
    const htmlLang = lang || pageConfig.lang || SITE_SEO.lang;

    document.title = finalTitle;
    document.documentElement.lang = htmlLang;

    ensureMeta('meta[name="description"]', { name: "description", content: finalDescription });
    ensureMeta('meta[name="keywords"]', { name: "keywords", content: finalKeywords });
    ensureMeta('meta[name="robots"]', { name: "robots", content: robots });
    ensureMeta('meta[name="googlebot"]', { name: "googlebot", content: robots });
    ensureMeta('meta[name="author"]', { name: "author", content: SITE_SEO.author });
    ensureMeta('meta[name="application-name"]', { name: "application-name", content: SITE_SEO.siteName });
    ensureMeta('meta[name="apple-mobile-web-app-title"]', { name: "apple-mobile-web-app-title", content: SITE_SEO.siteName });
    ensureMeta('meta[name="theme-color"]', { name: "theme-color", content: SITE_SEO.themeColor });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
    ensureMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_SEO.siteName });
    ensureMeta('meta[property="og:locale"]', { property: "og:locale", content: SITE_SEO.locale });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: finalTitle });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: finalDescription });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: finalCanonical });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: finalImage });
    ensureMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: finalImageAlt });
    ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: SITE_SEO.twitterCard });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: finalTitle });
    ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: finalDescription });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: finalImage });
    ensureMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: finalImageAlt });
    ensureLink('link[rel="canonical"]', { rel: "canonical", href: finalCanonical });
    ensureLink('link[rel="alternate"][hreflang="fr"]', { rel: "alternate", hreflang: "fr", href: finalCanonical });
    ensureLink('link[rel="alternate"][hreflang="x-default"]', { rel: "alternate", hreflang: "x-default", href: finalCanonical });

    const structuredDataScript = ensureScript('script[data-seo-jsonld="primary"]', {
      type: "application/ld+json",
      "data-seo-jsonld": "primary",
    });

    structuredDataScript.textContent = shouldNoindex
      ? ""
      : JSON.stringify(buildStructuredData({
          finalCanonical,
          finalDescription,
          finalImage,
          finalTitle,
          pageConfig,
        }));
  }, [canonical, description, image, keywords, lang, noindex, page, path, title, type]);

  return null;
}
