import React from "react";
import { Link } from "react-router-dom";

const DEFAULT_PHOTO = "/images/avatar.png";

const MANDATES = [
  {
    id: 7,
    period: "2024 - Aujourd hui",
    note: "Mandat actuel.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissaire: { name: "A renseigner", photo: DEFAULT_PHOTO },
    tresorier: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 6,
    period: "2022 - 2024",
    note: "Mandat precedent a completer.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissaire: { name: "A renseigner", photo: DEFAULT_PHOTO },
    tresorier: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 5,
    period: "2020 - 2022",
    note: "Mandat precedent a completer.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissaire: { name: "A renseigner", photo: DEFAULT_PHOTO },
    tresorier: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 4,
    period: "2018 - 2020",
    note: "Mandat precedent a completer.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissaire: { name: "A renseigner", photo: DEFAULT_PHOTO },
    tresorier: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 8,
    period: "2016 - 2018",
    note: "Mandat precedent a completer.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissaire: { name: "A renseigner", photo: DEFAULT_PHOTO },
    tresorier: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 3,
    period: "2014 - 2016",
    note: "Mandat precedent a completer.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissaire: { name: "A renseigner", photo: DEFAULT_PHOTO },
    tresorier: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 2,
    period: "2012 - 2014",
    note: "Mandat precedent a completer.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissaire: { name: "A renseigner", photo: DEFAULT_PHOTO },
    tresorier: { name: "A renseigner", photo: DEFAULT_PHOTO },
  },
  {
    id: 1,
    period: "2010 - 2012",
    note: "Mandat precedent a completer.",
    president: { name: "A renseigner", photo: DEFAULT_PHOTO },
    commissaire: { name: "A renseigner", photo: DEFAULT_PHOTO },
    tresorier: { name: "A renseigner", photo: DEFAULT_PHOTO },
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

function RolePersonCard({ icon, label, person, accent }) {
  return (
    <div className="p-3 rounded-4 h-100" style={{ background: "rgba(255,255,255,0.58)", border: "1px solid var(--line)" }}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <img
          src={person.photo || DEFAULT_PHOTO}
          alt={person.name}
          className="rounded-circle object-fit-cover border flex-shrink-0"
          style={{ width: 64, height: 64 }}
        />
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{ width: 42, height: 42, background: accent, color: "var(--accent-strong)" }}
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
    <article
      className="card border-0 shadow-sm h-100"
      style={{
        background: isCurrent
          ? "linear-gradient(145deg, rgba(194,65,12,0.12), rgba(255,247,235,0.98))"
          : "var(--panel)",
      }}
    >
      <div className="card-body p-4 p-lg-5">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div>
            <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.12em", color: "var(--warm)" }}>
              Mandat
            </div>
            <h3 className="h3 fw-bold mb-0">{mandate.period}</h3>
          </div>
          {isCurrent ? <span className="badge text-bg-warning rounded-pill px-3 py-2">Actuel</span> : null}
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <RolePersonCard icon="bi-person-badge-fill" label="President" person={mandate.president} accent="rgba(194,65,12,0.14)" />
          </div>
          <div className="col-md-4">
            <RolePersonCard icon="bi-shield-check" label="Commissaire aux comptes" person={mandate.commissaire} accent="rgba(37,99,235,0.14)" />
          </div>
          <div className="col-md-4">
            <RolePersonCard icon="bi-cash-coin" label="Tresorier" person={mandate.tresorier} accent="rgba(22,163,74,0.14)" />
          </div>
        </div>

        <p className="text-secondary mb-0">{mandate.note}</p>
      </div>
    </article>
  );
}

export default function AboutPage() {
  return (
    <div>
      <section className="py-5 py-lg-6">
        <div className="container">
          <div className="rounded-5 overflow-hidden shadow-lg p-4 p-lg-5" style={{ background: "linear-gradient(135deg, rgba(17,94,89,0.96), rgba(194,65,12,0.86))" }}>
            <div className="row g-4 align-items-center">
              <div className="col text-white">
                <div className="text-uppercase small fw-bold mb-3" style={{ letterSpacing: "0.14em" }}>A propos</div>
                <h1 className="display-4 fw-bold mb-3">Présentation et memoire de l AEUTNA</h1>
                <p className="lead text-white-50 mb-0">
                  Cette page présente l'association, sa mission et un historique statique classe du plus recent vers l'ancien.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-5 pb-lg-6">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <SectionTitle
                eyebrow="Association"
                title="Qui sommes-nous ?"
                text="L AEUTNA, Association des Etudiants d'Université de Tananarive Natifs d'Antalaha, rassemble les membres autour de l entraide, de la transmission et de la valorisation de la communaute."
              />
            </div>
            <div className="col-lg-6">
              <div className="p-4 p-lg-5 rounded-5 shadow-sm h-100" style={{ background: "var(--panel)" }}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="p-3 rounded-4 h-100" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-semibold mb-2">Mission</div>
                      <div className="text-secondary small">Renforcer les liens, soutenir les parcours et encourager la participation associative.</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 rounded-4 h-100" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-semibold mb-2">Vision</div>
                      <div className="text-secondary small">Construire une communaute unie, active et fiere de son histoire.</div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 rounded-4" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-semibold mb-2">Valeurs</div>
                      <div className="text-secondary">
                        Solidarite, responsabilite, memoire institutionnelle, engagement communautaire et valorisation de chaque generation.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-5 pb-lg-6">
        <div className="container">
          <SectionTitle
            eyebrow="Historique"
            title="Responsables classes du plus recent au plus ancien"
            text="Chaque mandat presente le president, le commissaire aux comptes et le tresorier, avec leurs photos."
          />
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
