export default function DashboardPage() {
  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">Dashboard</h3>
          <p className="text-secondary mb-0">
            Vue d&apos;ensemble du tableau de bord d&apos;administration.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-dark">
            <i className="bi bi-download me-2" />
            Exporter
          </button>
          <button type="button" className="btn btn-dark">
            <i className="bi bi-plus-lg me-2" />
            Nouvelle action
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-secondary mb-2">Adherents actifs</div>
              <div className="display-6 fw-semibold">128</div>
              <div className="small text-success mt-2">
                <i className="bi bi-arrow-up-right me-1" />
                +12 ce mois-ci
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-secondary mb-2">Activites planifiees</div>
              <div className="display-6 fw-semibold">09</div>
              <div className="small text-secondary mt-2">Calendrier a connecter au backend</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-secondary mb-2">Messages en attente</div>
              <div className="display-6 fw-semibold">17</div>
              <div className="small text-warning mt-2">
                <i className="bi bi-exclamation-circle me-1" />
                Quelques reponses a traiter
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-secondary mb-2">Journal d&apos;activite</div>
              <div className="display-6 fw-semibold">254</div>
              <div className="small text-secondary mt-2">Base utile pour le suivi de la plateforme</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h4 className="h5 mb-1">Activite recente</h4>
                  <p className="text-secondary small mb-0">
                    Zone reservee aux derniers evenements systeme.
                  </p>
                </div>
                <span className="badge text-bg-light border text-dark">A brancher</span>
              </div>

              <div className="list-group list-group-flush">
                <div className="list-group-item px-0 py-3">
                  <div className="fw-semibold">Connexion administrateur</div>
                  <div className="small text-secondary">
                    Exemple de carte d&apos;activite pour la future integration.
                  </div>
                </div>
                <div className="list-group-item px-0 py-3">
                  <div className="fw-semibold">Creation d&apos;un utilisateur</div>
                  <div className="small text-secondary">
                    Le dashboard pourra afficher les derniers logs importants ici.
                  </div>
                </div>
                <div className="list-group-item px-0 py-3">
                  <div className="fw-semibold">Mise a jour des roles</div>
                  <div className="small text-secondary">
                    Section prete pour etre connectee a l&apos;API des activity logs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h4 className="h5 mb-3">Raccourcis</h4>
              <div className="d-grid gap-2">
                <button type="button" className="btn btn-outline-dark text-start">
                  <i className="bi bi-people me-2" />
                  Gerer les utilisateurs
                </button>
                <button type="button" className="btn btn-outline-dark text-start">
                  <i className="bi bi-tags me-2" />
                  Gerer les categories
                </button>
                <button type="button" className="btn btn-outline-dark text-start">
                  <i className="bi bi-clock-history me-2" />
                  Voir les activity logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
