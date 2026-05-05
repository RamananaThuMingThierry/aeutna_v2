import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import SEO from "../components/seo/SEO";

const menuSections = [
  {
    title: "Suivi",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill" },
    ],
  },
  {
    title: "Pilotage",
    items: [
      { to: "/admin/axes", label: "Axes", icon: "bi-diagram-3-fill" },
      { to: "/admin/functions", label: "Fonctions", icon: "bi-briefcase-fill" },
      { to: "/admin/education-levels", label: "Niveaux", icon: "bi-mortarboard-fill" },
      { to: "/admin/gallery", label: "Galeries", icon: "bi-images" },
      { to: "/admin/sliders", label: "Sliders", icon: "bi-aspect-ratio-fill" },
      { to: "/admin/activities", label: "Actualites", icon: "bi-calendar2-event-fill" },
    ],
  },
  {
    title: "Vie Associative",
    items: [
      { to: "/admin/members", label: "Membres", icon: "bi-person-vcard-fill" },
      { to: "/admin/member-applications", label: "Candidatures", icon: "bi-person-plus-fill" },
      { to: "/admin/membership-cards", label: "Cartes membres", icon: "bi-person-badge-fill" },
    ],
  },
  {
    title: "Finances",
    items: [
      { to: "/admin/annual-fees", label: "Cotisations annuelles", icon: "bi-calendar-event-fill" },
      { to: "/admin/fee-payments", label: "Paiements de cotisation", icon: "bi-cash-coin" },
      { to: "/admin/donations", label: "Donations", icon: "bi-gift-fill" },
      { to: "/admin/cash-categories", label: "Categories de caisse", icon: "bi-tags-fill" },
      { to: "/admin/cash-transactions", label: "Transactions de caisse", icon: "bi-wallet2" },
    ],
  },
  {
    title: "Logistique",
    items: [
      { to: "/admin/materials", label: "Materiels", icon: "bi-box-seam-fill" },
      { to: "/admin/material-loans", label: "Prets de materiels", icon: "bi-arrow-left-right" },
      { to: "/admin/material-maintenances", label: "Maintenances", icon: "bi-tools" },
      { to: "/admin/material-movements", label: "Mouvements", icon: "bi-arrow-repeat" },
      { to: "/admin/suppliers", label: "Fournisseurs", icon: "bi-truck" },
    ],
  },
  {
    title: "Communication",
    items: [
      { to: "/admin/bulk-messages", label: "Messages en masse", icon: "bi-chat-dots-fill" },
      { to: "/admin/contacts", label: "Contacts", icon: "bi-envelope-fill" },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/admin/reports", label: "Rapports", icon: "bi-journal-text" },
      { to: "/admin/users", label: "Utilisateurs", icon: "bi-people-fill" },
      { to: "/admin/activity-logs", label: "Journaux d'activite", icon: "bi-clock-history" },
    ],
  },
];

function SidebarContent({ currentUser, currentRoles, onLogout }) {
  return (
    <div className="d-flex h-100 flex-column">
      <div className="border-bottom p-4">
        <div className="d-flex align-items-center gap-3">
          <img
            src="/images/logo_aeutna.jpg"
            alt="Logo AEUTNA"
            className="rounded-circle object-fit-cover"
            style={{ width: "52px", height: "52px" }}
          />
          <div>
            <h1 className="h2 mb-1">AEUTNA</h1>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 flex-grow-1 overflow-auto">
        <div className="d-flex flex-column gap-4">
          {menuSections.map((section) => (
            <section key={section.title}>
              <div className="px-3 mb-2 text-uppercase text-secondary small fw-semibold">{section.title}</div>
              <div className="list-group list-group-flush">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `list-group-item list-group-item-action border-0 rounded-3 mb-1 d-flex align-items-center gap-3 ${
                        isActive ? "active shadow-sm" : "bg-transparent"
                      }`
                    }
                  >
                    <i className={`bi ${item.icon}`} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="border-top p-3">
        <div className="d-grid gap-2">
          <Link to="/admin/account/profile" className="btn btn-outline-dark d-flex justify-content-center align-items-center">
            <i className="bi bi-person-circle me-2" /> Mon compte
          </Link>
          <Link to="/" className="btn btn-light border d-flex justify-content-center align-items-center" target="_blank">
            <i className="bi bi-arrow-left me-2" /> Retour au site
          </Link>
          <button type="button" className="btn btn-dark d-flex justify-content-center align-items-center" onClick={onLogout}>
            <i className="bi bi-box-arrow-right fs-5 me-2" /> Se deconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const currentRoles = useMemo(() => {
    try {
      const value = JSON.parse(localStorage.getItem("roles") || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("roles");
    navigate("/login", { replace: true });
  }

  return (
    <>
      <SEO page="admin" />
      <div className="bg-body-tertiary min-vh-100">
        <div className="d-lg-none border-bottom bg-white sticky-top">
          <div className="container-fluid py-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <img
                src="/images/logo_aeutna.jpg"
                alt="Logo AEUTNA"
                className="rounded-circle object-fit-cover"
                style={{ width: "38px", height: "38px" }}
              />
              <div>
                <div className="fw-semibold">AEUTNA Admin</div>
                <div className="small text-secondary">Dashboard</div>
              </div>
            </div>

            <button
              className="btn btn-outline-dark"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#adminSidebar"
              aria-controls="adminSidebar"
            >
              <i className="bi bi-list fs-5" />
            </button>
          </div>
        </div>

        <div className="offcanvas offcanvas-start d-lg-none" tabIndex="-1" id="adminSidebar" aria-labelledby="adminSidebarLabel">
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title" id="adminSidebarLabel">Navigation admin</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
          </div>
          <div className="offcanvas-body p-0">
            <SidebarContent currentUser={currentUser} currentRoles={currentRoles} onLogout={() => setLogoutModalOpen(true)} />
          </div>
        </div>

        <div className="admin-shell">
          <aside className={`admin-sidebar-desktop d-none d-lg-block border-end bg-white ${sidebarCollapsed ? "is-collapsed" : ""}`}>
            <SidebarContent currentUser={currentUser} currentRoles={currentRoles} onLogout={() => setLogoutModalOpen(true)} />
          </aside>

          <div className={`admin-content ${sidebarCollapsed ? "is-expanded" : ""}`}>
            <nav className="navbar navbar-expand bg-white border-bottom px-3 px-lg-4 sticky-top">
              <div className="w-100 d-flex align-items-start align-items-lg-center justify-content-between gap-3 flex-wrap">
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                  <button
                    type="button"
                    className="btn btn-outline-dark d-none d-lg-inline-flex align-items-center gap-2"
                    onClick={() => setSidebarCollapsed((current) => !current)}
                    aria-expanded={!sidebarCollapsed}
                    aria-label={sidebarCollapsed ? "Ouvrir la barre laterale" : "Fermer la barre laterale"}
                  >
                    <i className={`bi ${sidebarCollapsed ? "bi-layout-sidebar-inset" : "bi-layout-sidebar"}`} />
                  </button>
                </div>

                <div className="d-flex align-items-center gap-3 ms-lg-auto">
                  <div className="text-end d-none d-md-inline">
                    <div className="fw-semibold small">{currentUser?.name || "Utilisateur"}</div>
                    <div className="text-secondary small">{currentUser?.email || ""}</div>
                  </div>
                </div>
              </div>
            </nav>

            <main className="p-3">
              <div className="container-fluid px-0">
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-3 p-md-4">
                    <Outlet />
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        {logoutModalOpen ? (
          <>
            <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirmation</h5>
                    <button type="button" className="btn-close" onClick={() => setLogoutModalOpen(false)} />
                  </div>

                  <div className="modal-body">
                    <p className="mb-0">Voulez-vous vraiment vous deconnecter de l'espace admin ?</p>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setLogoutModalOpen(false)}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={() => {
                        setLogoutModalOpen(false);
                        handleLogout();
                      }}
                    >
                      Se deconnecter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-backdrop fade show" onClick={() => setLogoutModalOpen(false)} />
          </>
        ) : null}
      </div>
    </>
  );
}
