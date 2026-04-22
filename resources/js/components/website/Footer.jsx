import { Link } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Accueil", icon: "bi-house-door" },
  { to: "/about", label: "A propos", icon: "bi-info-circle" },
  { to: "/activities", label: "Actualites", icon: "bi-calendar-event" },
  { to: "/gallery", label: "Galeries", icon: "bi-images" },
  { to: "/bureau", label: "Bureau", icon: "bi-people" },
  { to: "/contacts", label: "Contacts", icon: "bi-chat-dots" },
];

const contactLinks = [
  {
    href: "mailto:ramananathumingthierry@gmail.com",
    icon: "bi-envelope-paper",
    title: "Email",
    value: "ramananathumingthierry@gmail.com",
    iconColor: "#f59e0b",
  },
  {
    href: "https://wa.me/261327563770",
    icon: "bi-telephone",
    title: "Telephone",
    value: "+261 32 75 637 70",
    iconColor: "#16a34a",
  },
  {
    href: "https://facebook.com/aeutna",
    icon: "bi-facebook",
    title: "Facebook",
    value: "AEUTNA",
    iconColor: "#2563eb",
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="public-footer mt-4 pt-2 pt-lg-4">
        <div className="public-footer-shell p-3 p-lg-4 overflow-hidden position-relative">

                <div className="container">

          <div className="row g-3 g-xl-4 position-relative mb-3">
            <div className="col-lg-5">
              <div className="d-flex align-items-center gap-3 mb-3">
                <img
                  src="/images/logo_aeutna.jpg"
                  alt="AEUTNA"
                  className="rounded-circle object-fit-cover border border-light-subtle shadow-sm"
                  style={{ width: 56, height: 56 }}
                />
                <div>
                  <div className="text-uppercase small fw-semibold public-footer-kicker">Association et reseau</div>
                  <div className="fw-bold text-white fs-5" style={{ letterSpacing: "0.08em" }}>
                    AEUTNA
                  </div>
                </div>
              </div>

              <h2 className="h4 text-white fw-bold mb-2">Une communaute etudiante reliee a Antalaha.</h2>
              <p className="public-footer-copy mb-3">
                Association des Etudiants d Universite de Tananarive natifs d Antalaha. Le site met en valeur les
                actualites, la memoire associative et les liens entre membres.
              </p>

              <div className="d-flex flex-wrap gap-2">
                <Link to="/devenir-membre" className="btn btn-warning btn-sm rounded-pill px-3">
                  Devenir membre
                </Link>
                <Link to="/activities" className="btn btn-outline-light btn-sm rounded-pill px-3">
                  Explorer les actualites
                </Link>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="public-footer-panel h-100">
                <div className="fw-semibold text-white mb-2">Navigation</div>
                <div className="public-footer-nav-grid">
                  {navLinks.map((item) => (
                    <Link key={item.to} to={item.to} className="public-footer-nav-link text-decoration-none">
                      <span className="public-footer-nav-icon">
                        <i className={`bi ${item.icon}`} />
                      </span>
                      <span>{item.label}</span>
                      <i className="bi bi-arrow-right-short public-footer-nav-arrow" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="h-100">
                <div className="fw-semibold text-white mb-2">Contact</div>
                <div className="d-grid gap-2">
                  {contactLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="public-footer-contact text-decoration-none"
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    >
                      <span className="public-footer-contact-icon" style={{ color: item.iconColor }}>
                        <i className={`bi ${item.icon}`} />
                      </span>
                      <span>
                        <span className="d-block small text-uppercase public-footer-contact-label">{item.title}</span>
                        <span className="d-block text-white fw-medium">{item.value}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
                </div>
            <div className="border-top pt-3 pb-2 px-1 text-center">
                <span className="text-warning">&quot;Hianatra mba ahiratra , aza adino ny hoavin'ny tananantsika&quot;</span>
            </div>
        </div>
    </footer>
  );
}
