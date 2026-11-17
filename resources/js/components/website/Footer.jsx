import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Accueil" },
  { to: "/#apropos", label: "A propos" },
  { to: "/activities", label: "Actualites" },
  { to: "/gallery", label: "Galeries" },
  { to: "/bureau", label: "Bureau" },
  { to: "/#contact", label: "Contact" },
];

const socialLinks = [
  { href: "mailto:ramananathumingthierry@gmail.com", label: "Email", icon: "bi-envelope" },
  { href: "https://wa.me/261327563770", label: "WhatsApp", icon: "bi-whatsapp" },
  { href: "https://facebook.com/aeutna", label: "Facebook", icon: "bi-facebook" },
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
      <footer className="public-footer mt-0">
        <div className="container">
          <div className="public-footer-bar aeutna-footer-grid">
            <div className="public-footer-brand">
              <img src="/images/logo_aeutna.jpg" alt="AEUTNA" className="public-footer-logo" />
              <div>
                <div className="fw-bold">AEUTNA</div>
                <div className="public-footer-subtitle">L’union fait notre force. Ensemble, cultivons la solidarité, l’ambition et l’engagement pour un avenir meilleur.</div>
              </div>
            </div>

            <nav className="public-footer-links" aria-label="Navigation secondaire">
              <strong className="footer-column-title">Navigation</strong>
              {navLinks.slice(0, 4).map((item) => (
                <Link key={item.to} to={item.to} className="public-footer-link">
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="public-footer-member-links">
              <strong className="footer-column-title">Espace membre</strong>
              <Link to="/devenir-membre" className="public-footer-link">Adhésion en ligne</Link>
              <Link to="/cotisations" className="public-footer-link">Payer une cotisation</Link>
              <Link to="/#contact" className="public-footer-link">Nous contacter</Link>
              <Link to="/login" className="public-footer-link">Connexion</Link>
            </div>
            <div className="public-footer-socials">
              {socialLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="public-footer-social"
                  aria-label={item.label}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  <i className={`bi ${item.icon}`} />
                </a>
              ))}
            </div>
          </div>

          <div className="public-footer-bottom">
            <span>&copy; {currentYear} AEUTNA. Tous droits réservés.</span>
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
