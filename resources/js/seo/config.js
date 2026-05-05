export const SITE_SEO = {
  siteName: "AEUTNA",
  defaultTitle: "AEUTNA | Association des Etudiants de l'Universite de Tananarive Natifs d'Antalaha",
  titleSeparator: " | ",
  defaultDescription:
    "AEUTNA rassemble les etudiants natifs d'Antalaha a l'Universite de Tananarive autour de l'entraide, des actualites associatives, de la memoire collective et de la vie communautaire.",
  defaultKeywords:
    "AEUTNA, etudiants Antalaha, Universite de Tananarive, association etudiante, actualites AEUTNA, galerie AEUTNA, bureau AEUTNA",
  defaultImage: "/images/logo_aeutna.jpg",
  defaultImageAlt: "Logo de l'association AEUTNA",
  locale: "fr_FR",
  lang: "fr",
  twitterCard: "summary_large_image",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  themeColor: "#115e59",
  author: "AEUTNA",
  organization: {
    legalName: "Association des Etudiants de l'Universite de Tananarive Natifs d'Antalaha",
    shortName: "AEUTNA",
    email: "ramananathumingthierry@gmail.com",
    telephone: "+261327563770",
    addressLocality: "Antalaha",
    addressCountry: "MG",
    sameAs: ["https://facebook.com/aeutna"],
  },
};

export const SEO_PAGES = {
  home: {
    title: "Accueil",
    description:
      "Decouvrez AEUTNA, l'association des etudiants natifs d'Antalaha a l'Universite de Tananarive, ses actualites, sa galerie et ses actions communautaires.",
    keywords: "AEUTNA accueil, association etudiante Antalaha, Universite de Tananarive, actualites etudiantes",
    path: "/",
    breadcrumb: "Accueil",
    schemaType: "WebSite",
  },
  about: {
    title: "A propos",
    description:
      "Presentation de l'AEUTNA, de sa mission, de ses valeurs et de l'historique de ses responsables et mandats.",
    keywords: "AEUTNA a propos, mission AEUTNA, valeurs AEUTNA, historique association etudiante",
    path: "/about",
    breadcrumb: "A propos",
    schemaType: "AboutPage",
  },
  activities: {
    title: "Actualites",
    description:
      "Consultez les actualites, evenements et actions publiques de l'AEUTNA.",
    keywords: "actualites AEUTNA, evenements etudiants Antalaha, activites association etudiante",
    path: "/activities",
    breadcrumb: "Actualites",
    schemaType: "CollectionPage",
  },
  gallery: {
    title: "Galeries",
    description:
      "Parcourez les albums et souvenirs photo publics de l'AEUTNA.",
    keywords: "galerie AEUTNA, photos association etudiante, albums AEUTNA",
    path: "/gallery",
    breadcrumb: "Galerie",
    schemaType: "CollectionPage",
  },
  bureau: {
    title: "Bureau",
    description:
      "Consultez les membres actifs du bureau de l'AEUTNA et les principaux responsables de l'association.",
    keywords: "bureau AEUTNA, responsables AEUTNA, membres bureau association etudiante",
    path: "/bureau",
    breadcrumb: "Bureau",
    schemaType: "AboutPage",
  },
  contacts: {
    title: "Contacts",
    description:
      "Contactez l'AEUTNA par email, WhatsApp ou Facebook, ou envoyez un message via le formulaire public.",
    keywords: "contact AEUTNA, email AEUTNA, WhatsApp AEUTNA, formulaire contact association",
    path: "/contacts",
    breadcrumb: "Contacts",
    schemaType: "ContactPage",
  },
  becomeMember: {
    title: "Devenir membre",
    description:
      "Rejoignez l'AEUTNA en soumettant votre demande d'adhesion et les informations necessaires au traitement de votre dossier.",
    keywords: "adhesion AEUTNA, devenir membre AEUTNA, association etudiante Antalaha",
    path: "/devenir-membre",
    breadcrumb: "Devenir membre",
    schemaType: "WebPage",
  },
  login: {
    title: "Connexion",
    description: "Connexion a l'espace membre et administration AEUTNA.",
    path: "/login",
    noindex: true,
    breadcrumb: "Connexion",
  },
  register: {
    title: "Inscription",
    description: "Creation de compte pour acceder a l'espace membre AEUTNA.",
    path: "/register",
    noindex: true,
    breadcrumb: "Inscription",
  },
  forgotPassword: {
    title: "Mot de passe oublie",
    description: "Demandez un code pour reinitialiser votre mot de passe AEUTNA.",
    path: "/forgot-password",
    noindex: true,
    breadcrumb: "Mot de passe oublie",
  },
  verifyCode: {
    title: "Verification du code",
    description: "Verification du code de reinitialisation du mot de passe AEUTNA.",
    path: "/verify-code",
    noindex: true,
    breadcrumb: "Verification du code",
  },
  resetPassword: {
    title: "Reinitialiser le mot de passe",
    description: "Choisissez un nouveau mot de passe pour votre compte AEUTNA.",
    path: "/reset-password",
    noindex: true,
    breadcrumb: "Reinitialiser le mot de passe",
  },
  account: {
    title: "Espace membre",
    description: "Espace membre prive AEUTNA.",
    noindex: true,
  },
  admin: {
    title: "Administration",
    description: "Interface d'administration privee AEUTNA.",
    noindex: true,
  },
};

export const PATH_TO_SEO_PAGE = {
  "/": "home",
  "/about": "about",
  "/activities": "activities",
  "/gallery": "gallery",
  "/bureau": "bureau",
  "/contacts": "contacts",
  "/devenir-membre": "becomeMember",
  "/login": "login",
  "/register": "register",
  "/forgot-password": "forgotPassword",
  "/verify-code": "verifyCode",
  "/reset-password": "resetPassword",
};
