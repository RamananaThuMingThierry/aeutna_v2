import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Accueil", icon: "bi-house-door" },
  { to: "/about", label: "À propos", icon: "bi-info-circle" },
  { to: "/activities", label: "Actualités", icon: "bi-calendar-event" },
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
    title: "Téléphone",
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
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 320);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <footer className="public-footer mt-4 pt-2 pt-lg-4 position-relative">
        <div className="public-footer-shell p-3 p-lg-4 overflow-hidden position-relative">
          <span className="public-footer-orb public-footer-orb-one" />
          <span className="public-footer-orb public-footer-orb-two" />

          <div className="container position-relative">
            <div className="row g-3 g-xl-4 align-items-stretch mb-4">
              <div className="col-12 col-lg-5">
                <div className="public-footer-panel h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <img
                        src="/images/logo_aeutna.jpg"
                        alt="AEUTNA"
                        className="rounded-2 object-fit-cover border border-light-subtle shadow-sm"
                        style={{ width: 62, height: 62 }}
                      />
                                   </div>

                    <p className="public-footer-copy mb-4">
                     Association des Étudiants d’Université de Tananarive natifs d’Antalaha. Le site valorise les actualités, la mémoire associative et les solidarités entre membres.
                    </p>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 justify-content-center mb-3">
                      <Link to="/devenir-membre" className="btn btn-warning btn-sm rounded-2 px-3">
                        Devenir membre
                      </Link>
                      <Link to="/activities" className="btn btn-outline-light btn-sm rounded-2 px-3">
                        Explorer les actualités
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="public-footer-panel h-100">
                  <div className="small text-uppercase fw-semibold public-footer-kicker mb-3">Navigation</div>
                  <div className="public-footer-nav-grid">
                    {navLinks.map((item) => (
                      <Link key={item.to} to={item.to} className="public-footer-nav-link text-decoration-none">
                        <span className="public-footer-nav-icon">
                          <i className={`bi ${item.icon}`} />
                        </span>
                        <span>{item.label}</span>
                        <i className="bi bi-arrow-up-right public-footer-nav-arrow" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <div className="public-footer-panel h-100 d-flex flex-column">
                  <div className="small text-uppercase fw-semibold public-footer-kicker mb-3">Contacts</div>
                  <div className="d-grid gap-2 mb-3">
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
                        <span className="public-footer-contact-body">
                          <span className="d-block small text-uppercase public-footer-contact-label">{item.title}</span>
                          <span className="d-block text-white fw-medium public-footer-contact-value" style={item.title === "Email" ? { wordBreak: "break-all", fontSize: "0.95rem" } : undefined}>{item.value}</span>
                        </span>
                      </a>
                    ))}
                  </div>

                  <div className="public-footer-quote mt-auto">
                    <div className="public-footer-quote-mark">"</div>
                    <p className="mb-2 text-warning fw-medium">
                      Hianatra mba ahiratra, aza adino ny hoavin ny tananantsika.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="public-footer-bottom pt-3 pb-2 px-1">
              <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-2 text-center text-md-start">
                <div className="public-footer-meta">&copy; {currentYear} AEUTNA</div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <button
        type="button"
        className={`public-scrolltop ${showScrollTop ? "is-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Remonter en haut"
      >
        <span className="public-scrolltop-pulse" />
        <span className="public-scrolltop-core">
          <i className="bi bi-arrow-up-short" />
        </span>
      </button>
    </>
  );
}



