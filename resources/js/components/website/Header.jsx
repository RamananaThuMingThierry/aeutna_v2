import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Accueil", icon: "bi-house-door" },
  { to: "/activities", label: "Actualités", icon: "bi-newspaper" },
  { to: "/gallery", label: "Galeries", icon: "bi-images" },
  { to: "/bureau", label: "Bureau", icon: "bi-people" },
  { to: "/historique", label: "Historique", icon: "bi-clock-history" },
  { to: "/#contact", label: "Contact", icon: "bi-chat-square-text" }
];

function NavItemContent({ item, mobile }) {
  if (!mobile) return item.label;

  return (
    <>
      <span className="public-mobile-nav-icon"><i className={`bi ${item.icon}`} aria-hidden="true" /></span>
      <span className="public-mobile-nav-label">{item.label}</span>
    </>
  );
}

function NavButtons({ mobile = false, onNavigate }) {
  const location = useLocation();

  return navItems.map((item) => {
    const isHashLink = item.to.includes("#");
    const [path, hash] = item.to.split("#");
    const isHashActive = isHashLink && location.pathname === path && location.hash === `#${hash}`;
    const linkClass = (isActive) => mobile
      ? `public-mobile-nav-link ${isActive ? "is-active" : ""}`
      : `aeutna-nav-link ${isActive ? "is-active" : ""}`;

    if (isHashLink) {
      return (
        <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClass(isHashActive)} aria-current={isHashActive ? "page" : undefined}>
          <NavItemContent item={item} mobile={mobile} />
        </Link>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/"}
        onClick={onNavigate}
        className={({ isActive }) => linkClass(isActive)}
      >
        <NavItemContent item={item} mobile={mobile} />
      </NavLink>
    );
  });
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);
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

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector("button, a[href]")?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !mobileMenuRef.current) return;

      const focusableItems = [...mobileMenuRef.current.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusableItems.length) {
        event.preventDefault();
        return;
      }

      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];
      const focusIsOutsideMenu = !mobileMenuRef.current.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === firstItem || focusIsOutsideMenu)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (document.activeElement === lastItem || focusIsOutsideMenu)) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    function handleResize() {
      if (window.innerWidth >= 992) setMobileMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = previousBodyOverflow;
      mobileToggleRef.current?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className="position-sticky top-0 z-3 border-bottom aeutna-site-header"
        style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.96)" }}
      >
        <div className="container py-2 d-flex align-items-center justify-content-between gap-3 aeutna-header-inner">
          <Link to="/" className="text-decoration-none text-dark d-flex align-items-center gap-2 aeutna-brand">
            <img
              src="/images/logo_aeutna.jpg"
              alt="AEUTNA"
              className="rounded-3 object-fit-cover border-0 aeutna-brand-logo"
            />
            <span className="d-grid aeutna-brand-copy">
              <strong>AEUTNA</strong>
            </span>
          </Link>

          <nav className="d-none d-lg-flex align-items-center gap-1 flex-wrap justify-content-center aeutna-main-nav" aria-label="Navigation principale">
            <NavButtons />
          </nav>

          <div className="d-none d-lg-flex align-items-center gap-2">
            <span className="aeutna-open-badge"><i /> Adhésion ouverte</span>
            <Link to="/?payment=1" className="btn btn-sm rounded-pill px-3 aeutna-join-button">
              Payer ma cotisation <i className="bi bi-arrow-up-right" />
            </Link>
          </div>

          <button
            ref={mobileToggleRef}
            className={`btn d-lg-none public-nav-toggle ${mobileMenuOpen ? "is-open" : ""}`}
            type="button"
            aria-label={mobileMenuOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="public-mobile-navigation"
            onClick={() => setMobileMenuOpen((current) => !current)}
            style={{ width: 44, height: 44 }}
          >
            <i className={`bi ${mobileMenuOpen ? "bi-x-lg" : "bi-list"} fs-5`} aria-hidden="true" />
          </button>
        </div>
      </header>

      {mobileMenuVisible ? (
        <div
          className={`public-mobile-overlay d-lg-none ${mobileMenuOpen ? "is-open" : "is-closing"}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            id="public-mobile-navigation"
            ref={mobileMenuRef}
            className={`public-mobile-menu ${mobileMenuOpen ? "is-open" : "is-closing"}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-mobile-navigation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="public-mobile-menu-top">
              <div className="public-mobile-menu-heading">
                <span>Navigation</span>
                <strong id="public-mobile-navigation-title">Explorez l’association</strong>
              </div>
              <button type="button" className="public-mobile-close" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer la navigation">
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </div>

            <nav className="public-mobile-nav-grid" aria-label="Navigation principale">
              <NavButtons mobile onNavigate={() => setMobileMenuOpen(false)} />
            </nav>

            <div className="public-mobile-menu-actions">
              <div className="public-mobile-menu-meta">
                <span className="aeutna-open-badge"><i /> Adhésion ouverte</span>
                <Link to="/login" className="public-mobile-login" onClick={() => setMobileMenuOpen(false)}>
                  <i className="bi bi-person-circle" aria-hidden="true" /> Connexion
                </Link>
              </div>
              <Link to="/?payment=1" className="public-mobile-payment" onClick={() => setMobileMenuOpen(false)}>
                <span><i className="bi bi-credit-card me-2" aria-hidden="true" /> Payer ma cotisation</span>
                <i className="bi bi-arrow-up-right" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
