import { Link, NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/about", label: "A propos" },
  { to: "/gallery", label: "Galerie" },
  { to: "/activities", label: "Activites" },
  { to: "/contacts", label: "Contacts" },
];

export default function Header() {
  return (
    <header className="position-sticky top-0 z-3 border-bottom" style={{ backdropFilter: "blur(20px)", background: "rgba(255,247,235,0.88)" }}>
      <div className="container py-3 d-flex align-items-center justify-content-between gap-3">
        <Link to="/" className="text-decoration-none text-dark d-flex align-items-center gap-3">
          <img
            src="/images/logo_aeutna.jpg"
            alt="AEUTNA"
            className="rounded-circle object-fit-cover border"
            style={{ width: 52, height: 52 }}
          />
          <div>
            <div className="fw-bold" style={{ letterSpacing: "0.08em" }}>AEUTNA</div>
            <div className="small text-secondary">Association et solidarite etudiante</div>
          </div>
        </Link>

        <nav className="d-none d-lg-flex align-items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `btn btn-sm rounded-pill px-3 ${isActive ? "btn-dark" : "btn-outline-secondary border-0"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="d-flex align-items-center gap-2">
          <Link to="/login" className="btn btn-outline-dark btn-sm rounded-pill px-3">Connexion</Link>
          <Link to="/register" className="btn btn-warning btn-sm rounded-pill px-3">Inscription</Link>
        </div>
      </div>
    </header>
  );
}
