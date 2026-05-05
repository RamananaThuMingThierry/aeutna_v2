import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/about", label: "À propos" },
  { to: "/activities", label: "Actualités" },
  { to: "/gallery", label: "Galeries" },
  { to: "/bureau", label: "Les membres du bureau actifs" },
  { to: "/contacts", label: "Contacts" }
];

function NavButtons({ mobile = false, onNavigate }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            mobile
              ? `btn w-100 text-start rounded-4 px-3 py-3 ${isActive ? "btn-dark" : "btn-outline-secondary"}`
              : `btn btn-sm rounded-pill px-3 ${isActive ? "btn-dark" : "btn-outline-secondary border-0"}`
          }
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
      style={{ backdropFilter: "blur(20px)", background: "rgba(255,247,235,0.92)" }}
    >
      <div className="container py-3 d-flex align-items-center justify-content-between gap-3">
        <Link to="/" className="text-decoration-none text-dark d-flex align-items-center gap-3">
          <img
            src="/images/logo_aeutna.jpg"
            alt="AEUTNA"
            className="rounded-2 object-fit-cover border"
            style={{ width: 52, height: 52 }}
          />
        </Link>

        <nav className="d-none d-lg-flex align-items-center gap-2 flex-wrap justify-content-center">
          <NavButtons />
        </nav>

        <div className="d-none d-lg-flex align-items-center gap-2">
          <Link to="/login" className="btn btn-outline-dark btn-sm rounded-pill px-3">
            Connexion
          </Link>
          <Link to="/register" className="btn btn-warning btn-sm rounded-pill px-3">
            Inscription
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
                <Link to="/login" className="btn btn-outline-dark rounded-4 py-3" onClick={() => setMobileMenuOpen(false)}>
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-warning rounded-4 py-3" onClick={() => setMobileMenuOpen(false)}>
                  Inscription
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
