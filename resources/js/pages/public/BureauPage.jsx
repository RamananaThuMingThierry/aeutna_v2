import React from "react";
import { Link } from "react-router-dom";

const DEFAULT_PHOTO = "/images/avatar.png";

const A2026_PHOTO_PRESIDENT = "/mandat/2026/president.jpeg";
const A2026_PHOTO_TREASURER = "/mandat/2026/treasurer.jpeg";
const A2026_PHOTO_COMMISSIONER = "/mandat/2026/commissioner.jpeg";


const LEADERS = [
  {
    id: 1,
    role: "Président",
    name: "RIZIKY Jeremie Luckaël",
    photo: A2026_PHOTO_PRESIDENT,
    accent: "rgba(194,65,12,0.14)",
    icon: "bi-person-badge-fill",
  },
  {
    id: 2,
    role: "Commissaire aux comptes",
    name: "BEZAFY DANIELLA",
    photo: A2026_PHOTO_COMMISSIONER,
    accent: "rgba(37,99,235,0.14)",
    icon: "bi-shield-check",
  },
  {
    id: 3,
    role: "Trésorier",
    name: "KARL MAX RAKOTOSIHANAKA Stany",
    photo: A2026_PHOTO_TREASURER,
    accent: "rgba(22,163,74,0.14)",
    icon: "bi-cash-coin",
  },
];

const OFFICE_MEMBERS = [
  { id: 1, name: "À renseigner", role: "Vice-président", photo: DEFAULT_PHOTO },
  { id: 2, name: "À renseigner", role: "Sécretaire géneral", photo: DEFAULT_PHOTO },
  { id: 3, name: "À renseigner", role: "Sécretaire adjoint", photo: DEFAULT_PHOTO },
  { id: 4, name: "À renseigner", role: "Trésorier adjoint", photo: DEFAULT_PHOTO },
  { id: 5, name: "À renseigner", role: "Charge de communication", photo: DEFAULT_PHOTO },
  { id: 6, name: "À renseigner", role: "Charge d'organisation", photo: DEFAULT_PHOTO },
];

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mb-4 mb-lg-5">
      <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.14em", color: "var(--warm)" }}>
        {eyebrow}
      </div>
      <h2 className="fw-bold mb-3">{title}</h2>
      <p className="text-secondary fs-5 mb-0">{text}</p>
    </div>
  );
}

function LeaderCard({ leader }) {
  return (
    <article className="card border-0 shadow-sm h-100" style={{ background: "var(--panel)" }}>
      <div className="card-body p-4 text-center">
        <div className="d-flex justify-content-center mb-3">
          <img
            src={leader.photo || DEFAULT_PHOTO}
            alt={leader.name}
            className="rounded-circle object-fit-cover border shadow-sm"
            loading="lazy"
            decoding="async"
            style={{ width: 96, height: 96 }}
          />
        </div>
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{ width: 44, height: 44, background: leader.accent, color: "var(--accent-strong)" }}
        >
          <i className={`bi ${leader.icon}`} />
        </div>
        <div className="small text-uppercase fw-semibold text-secondary mb-1">{leader.role}</div>
        <h3 className="h5 fw-bold mb-0">{leader.name}</h3>
      </div>
    </article>
  );
}

function OfficeMemberCard({ member }) {
  return (
    <article className="card border-0 shadow-sm h-100" style={{ background: "var(--panel)" }}>
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-3">
          <img
            src={member.photo || DEFAULT_PHOTO}
            alt={member.name}
            className="rounded-circle object-fit-cover border"
            loading="lazy"
            decoding="async"
            style={{ width: 64, height: 64 }}
          />
          <div>
            <div className="fw-bold mb-1">{member.name}</div>
            <div className="text-secondary">{member.role}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BureauPage() {
  return (
    <div>
      <section className="py-5 py-lg-6">
        <div className="container">
          <div className="rounded-2 overflow-hidden shadow-lg p-4 p-lg-5" style={{ background: "linear-gradient(135deg, rgba(17,94,89,0.96), rgba(194,65,12,0.86))" }}>
            <div className="row g-4 align-items-center">
              <div className="col-12 text-white">
                <h1 className="fw-bold mb-3">Les membres de bureau actifs</h1>
                <p className="lead text-white-50 mb-0">
                  Présentation statique des responsables actuels et des autres membres du bureau de l’AEUTNA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-5 pb-lg-6">
        <div className="container">
          <SectionTitle
            eyebrow="Responsables"
            title="Président, commissaire aux comptes et trésorier"
            text="Les postes principaux du bureau actuel sont présentés avec leurs photos."
          />
          <div className="row g-4">
            {LEADERS.map((leader) => (
              <div key={leader.id} className="col-md-6 col-xl-4">
                <LeaderCard leader={leader} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-5 pb-lg-6">
        <div className="container">
          <SectionTitle
            eyebrow="Membres"
            title="Autres membres du bureau"
            text="Liste des autres membres actifs du bureau avec leurs fonctions."
          />
          <div className="row g-4">
            {OFFICE_MEMBERS.map((member) => (
              <div key={member.id} className="col-md-6 col-xl-4">
                <OfficeMemberCard member={member} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
