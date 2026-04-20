import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-top mt-5" style={{ background: "rgba(255,247,235,0.88)" }}>
      <div className="container py-5">
        <div className="row g-4 align-items-start">
          <div className="col-lg-5">
            <div className="fw-bold mb-2">AEUTNA</div>
            <p className="text-secondary mb-0">
              Une plateforme associative pour partager les actions, la memoire institutionnelle et les activites de la communaute.
            </p>
          </div>
          <div className="col-lg-4">
            <div className="fw-semibold mb-2">Navigation</div>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/" className="btn btn-sm btn-outline-secondary rounded-pill">Accueil</Link>
              <Link to="/about" className="btn btn-sm btn-outline-secondary rounded-pill">A propos</Link>
              <Link to="/gallery" className="btn btn-sm btn-outline-secondary rounded-pill">Galerie</Link>
              <Link to="/activities" className="btn btn-sm btn-outline-secondary rounded-pill">Activites</Link>
              <Link to="/contacts" className="btn btn-sm btn-outline-secondary rounded-pill">Contacts</Link>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="fw-semibold mb-2">Contact</div>
            <div className="text-secondary small">Tanambao V, Antalaha</div>
            <div className="text-secondary small">contact@aeutna.local</div>
            <div className="text-secondary small">+261 00 000 00</div>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <a href="https://wa.me/2610000000" target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary rounded-pill">
                WhatsApp
              </a>
              <a href="https://facebook.com/aeutna" target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary rounded-pill">
                Facebook
              </a>
              <a href="mailto:contact@aeutna.local" className="btn btn-sm btn-outline-secondary rounded-pill">
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
