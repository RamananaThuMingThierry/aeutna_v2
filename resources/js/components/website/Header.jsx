import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/activities", label: "Actualités" },
  { to: "/gallery", label: "Galeries" },
  { to: "/bureau", label: "Bureau" },
  { to: "/historique", label: "Historique" },
  { to: "/#contact", label: "Contact" }
];

function NavButtons({ mobile = false, onNavigate }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) => mobile
            ? `btn w-100 text-start rounded-4 px-3 py-3 ${isActive ? "btn-dark" : "btn-outline-secondary"}`
            : `aeutna-nav-link ${isActive ? "is-active" : ""}`}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuVisible(true);
      return undefined;
    }

    if (!mobileMenuVisible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setMobileMenuVisible(false);
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [mobileMenuOpen, mobileMenuVisible]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  return (
    <header
      className="position-sticky top-0 z-3 border-bottom"
      style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.96)" }}
    >
      <div className="container py-2 d-flex align-items-center justify-content-between gap-3 aeutna-header-inner">
        <Link to="/" className="text-decoration-none text-dark d-flex align-items-center gap-3 aeutna-brand">
          <img
            src="/images/logo_aeutna.jpg"
            alt="AEUTNA"
            className="rounded-3 object-fit-cover border-0"
            style={{ width: 54, height: 54 }}
          />
          <span className="d-none d-sm-grid aeutna-brand-copy">
            <strong>AEUTNA</strong>
          </span>
        </Link>

        <nav className="d-none d-lg-flex align-items-center gap-1 flex-wrap justify-content-center aeutna-main-nav">
          <NavButtons />
        </nav>

        <div className="d-none d-lg-flex align-items-center gap-2">
          <span className="aeutna-open-badge"><i /> Adhésion ouverte</span>
          <Link to="/?payment=1#cotisations" className="btn btn-sm rounded-pill px-3 aeutna-join-button">
            Payer ma cotisation <i className="bi bi-arrow-up-right" />
          </Link>
        </div>

        <button
          className={`btn btn-outline-dark d-lg-none rounded-2 public-nav-toggle ${mobileMenuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={mobileMenuOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((current) => !current)}
          style={{ width: 44, height: 44 }}
        >
          <i className={`bi ${mobileMenuOpen ? "bi-x-lg" : "bi-list"} fs-5`} />
        </button>
      </div>

      {mobileMenuVisible ? (
        <>
          <div className="container d-lg-none pb-3 public-mobile-menu-wrap">
            <div
              className={`rounded-2 shadow-sm p-3 d-grid gap-2 public-mobile-menu ${mobileMenuOpen ? "is-open" : "is-closing"}`}
              style={{
                background: "rgba(255,255,255,0.98)",
                border: "1px solid rgba(29,26,22,0.08)",
              }}
            >
              <NavButtons mobile onNavigate={() => setMobileMenuOpen(false)} />

              <div className="border-top pt-3 mt-2 d-grid gap-2">
                <span className="aeutna-open-badge justify-content-center"><i /> Adhésion ouverte</span>
                <Link to="/login" className="btn btn-outline-dark rounded-4 py-3" onClick={() => setMobileMenuOpen(false)}>
                  Connexion
                </Link>
                <Link to="/?payment=1#cotisations" className="btn btn-warning rounded-4 py-3" onClick={() => setMobileMenuOpen(false)}>
                  Payer ma cotisation
                </Link>
              </div>
            </div>
          </div>

          <div
            className={`d-lg-none position-fixed top-0 start-0 w-100 h-100 public-mobile-backdrop ${mobileMenuOpen ? "is-open" : "is-closing"}`}
            style={{ zIndex: -1 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        </>
      ) : null}
    </header>
  );
}
