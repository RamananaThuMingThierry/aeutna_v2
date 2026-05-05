import React, { useEffect, useState } from "react";

import { websiteApi } from "../../api/website";

const DEFAULT_PHOTO = "/images/avatar.png";

const MANDATES = [
  {
    id: 1,
    period: "2024 - Aujourd'hui",
    note: "Mandat actuel ou le plus recent.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    treasurer: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissioner: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 2,
    period: "2022 - 2024",
    note: "Mandat precedent de l'association.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    treasurer: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissioner: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 3,
    period: "2020 - 2022",
    note: "Mandat precedent de l'association.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    treasurer: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissioner: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 4,
    period: "2018 - 2020",
    note: "Mandat precedent de l'association.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    treasurer: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissioner: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
];

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mb-4 mb-lg-5">
      <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.14em", color: "var(--warm)" }}>
        {eyebrow}
      </div>
      <h2 className="display-6 fw-bold mb-3">{title}</h2>
      <p className="text-secondary fs-5 mb-0">{text}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

function RoleCard({ label, person, icon, accent }) {
  return (
    <div className="p-3 rounded-4 h-100" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <img src={person.photo} alt={person.name} className="rounded-circle object-fit-cover border" style={{ width: 64, height: 64 }} />
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{ width: 40, height: 40, background: accent, color: "var(--accent-strong)" }}
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>
      <div className="small text-uppercase fw-semibold text-secondary mb-1">{label}</div>
      <div className="fw-semibold">{person.name}</div>
    </div>
  );
}

function MandateCard({ mandate, isCurrent }) {
  return (
    <article className="card border-0 shadow-sm h-100" style={{ background: isCurrent ? "linear-gradient(145deg, rgba(194,65,12,0.12), rgba(255,247,235,0.98))" : "white" }}>
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div>
            <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.12em", color: "var(--warm)" }}>
              Mandat
            </div>
            <h3 className="h3 fw-bold mb-0">{mandate.period}</h3>
          </div>
          {isCurrent ? <span className="badge text-bg-warning rounded-pill px-3 py-2">Recent</span> : null}
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <RoleCard label="President" person={mandate.president} icon="bi-person-badge-fill" accent="rgba(194,65,12,0.14)" />
          </div>
          <div className="col-md-4">
            <RoleCard label="Tresorier" person={mandate.treasurer} icon="bi-cash-coin" accent="rgba(22,163,74,0.14)" />
          </div>
          <div className="col-md-4">
            <RoleCard label="Commissaire aux comptes" person={mandate.commissioner} icon="bi-shield-check" accent="rgba(37,99,235,0.14)" />
          </div>
        </div>

        <div className="text-secondary">{mandate.note}</div>
      </div>
    </article>
  );
}

export default function AboutPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState({ about: null, statute: null });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await websiteApi.about();
        if (!mounted) return;
        setPayload({
          about: data?.about || null,
          statute: data?.statute || null,
        });
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "Impossible de charger cette page.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const about = payload.about || {};
  const statute = payload.statute;

  return (
    <div>
      <section className="py-4">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <div className="mb-4 mb-lg-5">
                <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.14em", color: "var(--warm)" }}>Association</div>
                <h1 className="display-6 fw-bold mb-3">Qui sommes-nous ?</h1>
                <p className="text-secondary fs-5 mb-0">{about.summary || "L'AEUTNA rassemble les membres autour de l'entraide, de la transmission et de la valorisation de la communaute."}</p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="p-4 p-lg-5 rounded-2 shadow-sm h-100" style={{ background: "var(--panel)" }}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="p-3 rounded-2 h-100" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-semibold mb-2">Mission</div>
                      <div className="text-secondary small">{about.mission || "Renforcer les liens, soutenir les parcours et encourager la participation associative."}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 rounded-2 h-100" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-semibold mb-2">Vision</div>
                      <div className="text-secondary small">{about.vision || "Construire une communaute unie, active et fiere de son histoire."}</div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 rounded-4" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-semibold mb-2">Valeurs</div>
                      <div className="text-secondary">{about.values || "Solidarite, responsabilite, memoire institutionnelle, engagement communautaire et valorisation de chaque generation."}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-5">
        <div className="container">
          <SectionTitle eyebrow="Statuts" title="Articles publics de l'association" text="Les articles ci-dessous sont affiches uniquement lorsqu'un statut est publie en visibilite publique." />

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <div className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          ) : null}

          {error ? <div className="alert alert-danger">{error}</div> : null}

          {!loading && !error && !statute ? (
            <div className="alert alert-light border text-secondary mb-0">
              Aucun statut public n'est disponible pour le moment.
            </div>
          ) : null}

          {statute ? (
            <div className="d-grid gap-4">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4 p-lg-5">
                  <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-start">
                    <div>
                      <h3 className="h2 fw-bold mb-2">{statute.title}</h3>
                      <div className="text-secondary small">
                        Version {statute.version} • Validation : {formatDate(statute.validated_at)} • Effet : {formatDate(statute.effective_at)}
                      </div>
                    </div>

                    {statute.document?.file_url ? (
                      <a href={statute.document.file_url} className="btn btn-dark" target="_blank" rel="noreferrer" download>
                        <i className="bi bi-download me-2" />
                        Telecharger le document
                      </a>
                    ) : (
                      <div className="alert alert-warning mb-0 py-2 px-3 small">
                        <i className="bi bi-exclamation-triangle me-2" />
                        Aucun document PDF public n'est disponible pour le moment.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(statute.titles || []).map((title) => (
                <article key={title.id} className="card border-0 shadow-sm">
                  <div className="card-body p-4 p-lg-5">
                    <div className="mb-4">
                      <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.12em", color: "var(--warm)" }}>
                        Titre {title.number}
                      </div>
                      <h3 className="h3 fw-bold mb-0">{title.heading}</h3>
                    </div>

                    <div className="d-grid gap-3">
                      {(title.articles || []).map((article) => (
                        <div key={article.id} className="p-3 p-lg-4 rounded-4" style={{ background: "var(--panel)" }}>
                          <h4 className="h5 fw-semibold mb-3">
                            Article {article.article_number}{article.title ? ` - ${article.title}` : ""}
                          </h4>
                          <div className="text-secondary" style={{ whiteSpace: "pre-wrap" }}>
                            {article.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="pb-5 pb-lg-6">
        <div className="container">
          <SectionTitle eyebrow="Historique" title="Bureau par mandat" text="Cette section est geree manuellement avec des donnees statiques pour chaque mandat." />

          <div className="row g-4">
            {MANDATES.map((mandate, index) => (
              <div key={mandate.id} className="col-12">
                <MandateCard mandate={mandate} isCurrent={index === 0} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
