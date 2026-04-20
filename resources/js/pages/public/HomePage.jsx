import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { websiteApi } from "../../api/website";

const PRESIDENT_HISTORY = [
  {
    id: 1,
    period: "2024 - Aujourd hui",
    name: "A renseigner",
    note: "President actuel de l association.",
  },
  {
    id: 2,
    period: "2022 - 2024",
    name: "A renseigner",
    note: "Mandat precedent.",
  },
  {
    id: 3,
    period: "2020 - 2022",
    name: "A renseigner",
    note: "Mandat precedent.",
  },
  {
    id: 4,
    period: "2018 - 2020",
    name: "A renseigner",
    note: "Mandat precedent.",
  },
];

const CURRENT_OFFICE_MEMBERS = [
  {
    id: 1,
    name: "A renseigner",
    role: "President",
    phone: "+261 00 000 00",
    email: "presidence@aeutna.local",
    isPresident: true,
  },
  {
    id: 2,
    name: "A renseigner",
    role: "Vice-president",
    phone: "+261 00 000 00",
    email: "vicepresidence@aeutna.local",
  },
  {
    id: 3,
    name: "A renseigner",
    role: "Secretaire general",
    phone: "+261 00 000 00",
    email: "secretariat@aeutna.local",
  },
  {
    id: 4,
    name: "A renseigner",
    role: "Tresorier",
    phone: "+261 00 000 00",
    email: "tresorerie@aeutna.local",
  },
  {
    id: 5,
    name: "A renseigner",
    role: "Commissaire aux comptes",
    phone: "+261 00 000 00",
    email: "controle@aeutna.local",
  },
];

function resolveImageUrl(imagePath) {
  if (!imagePath) return "/images/avatar.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("/")) {
    return imagePath;
  }
  return `/${imagePath.replace(/^\/+/, "")}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
}

function HeroCarousel({ slides = [] }) {
  const items = slides.length ? slides : [{ id: "fallback", title: "AEUTNA", subtitle: "Communaute, solidarite et avenir", image_url: null }];

  return (
    <div id="homeHeroCarousel" className="carousel slide carousel-fade">
      <div className="carousel-inner rounded-5 overflow-hidden shadow-lg">
        {items.map((slide, index) => (
          <div key={slide.id ?? index} className={`carousel-item ${index === 0 ? "active" : ""}`}>
            <div className="position-relative" style={{ minHeight: "68vh" }}>
              <img
                src={resolveImageUrl(slide.image_url)}
                alt={slide.title || "Slide"}
                className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
              />
              <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{ background: "linear-gradient(115deg, rgba(19,16,12,0.72) 12%, rgba(19,16,12,0.18) 58%, rgba(15,118,110,0.35) 100%)" }}
              />
              <div className="position-relative h-100 d-flex align-items-end">
                <div className="container py-5 py-lg-6">
                  <div className="row">
                    <div className="col-lg-8">
                      <span className="badge rounded-pill text-bg-warning px-3 py-2 mb-3">Association et reseau</span>
                      <h1 className="display-3 fw-bold text-white mb-3">{slide.title || "AEUTNA"}</h1>
                      <p className="lead text-white-50 mb-4">{slide.subtitle || "Association des Etudiants Universitaire Tananarivo Natif d'Antalaha."}</p>
                      <div className="d-flex flex-wrap gap-2">
                        <a href="#activities" className="btn btn-warning btn-lg rounded-pill px-4">Voir les activites</a>
                        <a href="#history" className="btn btn-outline-light btn-lg rounded-pill px-4">Voir l histoire</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 ? (
        <>
          <button className="carousel-control-prev" type="button" data-bs-target="#homeHeroCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Precedent</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#homeHeroCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Suivant</span>
          </button>
        </>
      ) : null}
    </div>
  );
}

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="mb-4 mb-lg-5">
      {eyebrow ? <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.14em", color: "var(--warm)" }}>{eyebrow}</div> : null}
      <h2 className="display-6 fw-bold mb-3">{title}</h2>
      {text ? <p className="text-secondary fs-5 mb-0">{text}</p> : null}
    </div>
  );
}

function PresidentHistoryCard({ entry, index }) {
  return (
    <article
      className="card border-0 shadow-sm h-100"
      style={{
        background: index === 0 ? "linear-gradient(145deg, rgba(15,118,110,0.12), rgba(255,247,235,0.96))" : "var(--panel)",
      }}
    >
      <div className="card-body p-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <span
            className={`badge rounded-pill px-3 py-2 ${index === 0 ? "text-bg-warning" : ""}`}
            style={index === 0 ? {} : { background: "rgba(15,118,110,0.12)", color: "var(--accent-strong)" }}
          >
            {index === 0 ? "Le plus recent" : "Archive"}
          </span>
          <div className="small text-secondary">{entry.period}</div>
        </div>
        <h3 className="h4 fw-bold mb-2">{entry.name}</h3>
        <div className="text-uppercase small fw-semibold mb-3" style={{ letterSpacing: "0.08em", color: "var(--warm)" }}>
          President de l association
        </div>
        <p className="text-secondary mb-0">{entry.note}</p>
      </div>
    </article>
  );
}

function OfficeMemberCard({ member }) {
  return (
    <article
      className="card border-0 shadow-sm h-100"
      style={{
        background: member.isPresident
          ? "linear-gradient(145deg, rgba(194,65,12,0.12), rgba(255,247,235,0.98))"
          : "var(--panel)",
      }}
    >
      <div className="card-body p-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div>
            <h3 className="h5 fw-bold mb-1">{member.name}</h3>
            <div className="text-secondary">{member.role}</div>
          </div>
          {member.isPresident ? <span className="badge text-bg-warning rounded-pill px-3 py-2">President actuel</span> : null}
        </div>

        <div className="d-flex flex-column gap-3">
          <div className="p-3 rounded-4" style={{ background: "rgba(255,255,255,0.58)", border: "1px solid var(--line)" }}>
            <div className="small text-uppercase fw-semibold text-secondary mb-1">Telephone</div>
            <a href={`tel:${member.phone}`} className="text-decoration-none fw-semibold" style={{ color: "var(--page-ink)" }}>
              {member.phone}
            </a>
          </div>
          <div className="p-3 rounded-4" style={{ background: "rgba(255,255,255,0.58)", border: "1px solid var(--line)" }}>
            <div className="small text-uppercase fw-semibold text-secondary mb-1">Email</div>
            <a href={`mailto:${member.email}`} className="text-decoration-none fw-semibold" style={{ color: "var(--page-ink)" }}>
              {member.email}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await websiteApi.home();
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Impossible de charger la page d accueil.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const activities = useMemo(() => data?.activities || [], [data]);
  const gallery = useMemo(() => data?.gallery || [], [data]);

  if (loading) {
    return <div className="container py-5">Chargement...</div>;
  }

  if (error) {
    return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div>
      <HeroCarousel slides={data?.slides || []} />

      <section id="about" className="py-5 py-lg-6">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <SectionTitle
                eyebrow="A propos"
                title={data?.about?.title || "AEUTNA"}
                text={data?.about?.summary || "Association estudiantine et universitaire."}
              />
            </div>
            <div className="col-lg-6">
              <div className="p-4 p-lg-5 rounded-5 shadow-sm h-100" style={{ background: "var(--panel)" }}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="p-3 rounded-4 h-100" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-bold fs-4 mb-1">{activities.length}</div>
                      <div className="text-secondary small">Activites recentes</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 rounded-4 h-100" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-bold fs-4 mb-1">{gallery.length}</div>
                      <div className="text-secondary small">Images en galerie</div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 rounded-4" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-semibold mb-2">Mission</div>
                      <div className="text-secondary">
                        Renforcer les liens entre etudiants et universitaires, soutenir les initiatives locales et faire vivre la memoire de l association.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="activities" className="py-5 py-lg-6">
        <div className="container">
          <SectionTitle
            eyebrow="Activites"
            title="Dernieres activites"
            text="Les actions recentes mises en avant sur la page d accueil."
          />
          <div className="row g-4">
            {activities.map((activity) => (
              <div key={activity.id} className="col-lg-4">
                <article className="card border-0 shadow-sm h-100 overflow-hidden" style={{ background: "var(--panel)" }}>
                  <img
                    src={resolveImageUrl(activity.images?.find((image) => image.is_cover)?.image_path || activity.images?.[0]?.image_path)}
                    alt={activity.title}
                    className="w-100 object-fit-cover"
                    style={{ height: 220 }}
                  />
                  <div className="card-body p-4">
                    <div className="small text-uppercase fw-bold mb-2" style={{ color: "var(--accent-strong)", letterSpacing: "0.08em" }}>{activity.location || "Activite"}</div>
                    <h3 className="h5 fw-bold">{activity.title}</h3>
                    <div className="small text-secondary mb-3">{formatDate(activity.starts_at)}</div>
                    <p className="text-secondary mb-0">{activity.description || "Aucune description disponible."}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="py-5 py-lg-6">
        <div className="container">
          <SectionTitle
            eyebrow="Galerie"
            title="Moments et souvenirs"
            text="Une selection d images provenant des activites publiees."
          />
          <div className="row g-3">
            {gallery.map((image, index) => (
              <div key={image.id} className={index % 5 === 0 ? "col-md-6 col-lg-4" : "col-md-6 col-lg-2"}>
                <div className="rounded-5 overflow-hidden shadow-sm h-100 position-relative">
                  <img
                    src={resolveImageUrl(image.image_path)}
                    alt={image.activity_title || "Galerie"}
                    className="w-100 h-100 object-fit-cover"
                    style={{ minHeight: 220 }}
                  />
                  <div className="position-absolute bottom-0 start-0 end-0 p-3 text-white" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.66))" }}>
                    <div className="small fw-semibold">{image.activity_title || "AEUTNA"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="history" className="py-5 py-lg-6">
        <div className="container">
          <SectionTitle
            eyebrow="Historique"
            title="Historique des presidents"
            text="Presentation statique des presidents de l association, du plus recent vers les mandats precedents."
          />
          <div className="row g-4">
            {PRESIDENT_HISTORY.map((entry, index) => (
              <div key={entry.id} className="col-lg-6">
                <PresidentHistoryCard entry={entry} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="office" className="py-5 py-lg-6">
        <div className="container">
          <SectionTitle
            eyebrow="Bureau actuel"
            title="Membres du bureau et president actuel"
            text="Chaque membre du bureau est affiche avec sa fonction et ses contacts directs."
          />
          <div className="row g-4">
            {CURRENT_OFFICE_MEMBERS.map((member) => (
              <div key={member.id} className="col-md-6 col-xl-4">
                <OfficeMemberCard member={member} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contacts" className="py-5 py-lg-6">
        <div className="container">
          <div className="rounded-5 shadow-sm overflow-hidden" style={{ background: "linear-gradient(135deg, #115e59, #0f766e 45%, #c2410c 100%)" }}>
            <div className="row g-0">
              <div className="col-lg-7 p-4 p-lg-5 text-white">
                <SectionTitle eyebrow="Contacts" title="Restons en lien" text="Contacte l association pour toute information, collaboration ou actualite." />
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="small text-uppercase text-white-50">Email</div>
                    <div>{data?.contacts?.email}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-uppercase text-white-50">Telephone</div>
                    <div>{data?.contacts?.phone}</div>
                  </div>
                  <div className="col-md-4">
                    <div className="small text-uppercase text-white-50">Adresse</div>
                    <div>{data?.contacts?.address}</div>
                  </div>
                </div>
              </div>
              <div className="col-lg-5 p-4 p-lg-5 d-flex align-items-center">
                <div className="rounded-5 p-4 w-100" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.16)" }}>
                  <div className="fw-bold fs-5 mb-2 text-white">Explorer davantage</div>
                  <p className="text-white-50">Navigue vers les rubriques principales du site public.</p>
                  <div className="d-flex flex-wrap gap-2">
                    <Link to="/about" className="btn btn-light rounded-pill">A propos</Link>
                    <Link to="/gallery" className="btn btn-outline-light rounded-pill">Galerie</Link>
                    <Link to="/activities" className="btn btn-outline-light rounded-pill">Activites</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
