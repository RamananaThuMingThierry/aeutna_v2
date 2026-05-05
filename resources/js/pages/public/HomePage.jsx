import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { websiteApi } from "../../api/website";

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
    <div className="carousel-inner overflow-hidden shadow-lg">
        {items.map((slide, index) => (
        <div
            key={slide.id ?? index}
            className={`carousel-item ${index === 0 ? "active" : ""}`}
        >
            <div className="position-relative" style={{ minHeight: "68vh" }}>
            <img
                src={resolveImageUrl(slide.image_url)}
                alt={slide.title || "Slide"}
                className="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
            />

            {/* Overlay */}
            <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                background:
                    "linear-gradient(115deg, rgba(19,16,12,0.72) 12%, rgba(19,16,12,0.18) 58%, rgba(15,118,110,0.35) 100%)",
                }}
            />

            {/* CONTENU CENTRÃ‰ */}
            <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center text-center">
                <div className="container py-5 py-lg-6">
                <div className="row justify-content-center">
                    <div className="col-lg-7 col-xl-6">


                    <h1 className="text-white mb-4 fw-bold" style={{ fontSize: "2rem" }}>Association des Etudiants de l'Universite de Tananarive Natifs d'Antalaha</h1>

                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                        <Link
                        to="/devenir-membre"
                        className="btn btn-warning btn-lg rounded-pill px-4"
                        >
                        Devenir membre
                        </Link>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            {/* FIN CONTENU */}
            </div>
        </div>
        ))}
    </div>

    {items.length > 1 ? (
        <>
        <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#homeHeroCarousel"
            data-bs-slide="prev"
        >
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">PrÃ©cÃ©dent</span>
        </button>

        <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#homeHeroCarousel"
            data-bs-slide="next"
        >
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
      <h2 className="fw-bold mb-3">{title}</h2>
      {text ? <p className="text-secondary fs-5 mb-0">{text}</p> : null}
    </div>
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
                eyebrow="A PROPOS"
                title={data?.about?.title || "AEUTNA"}
                text={data?.about?.summary || "Association des Etudiants d'Universite de Tananarive natifs d'Antalaha."}
              />
            </div>
            <div className="col-lg-6">
              <div className="p-4 p-lg-5 rounded-2 shadow-sm h-100" style={{ background: "var(--panel)" }}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="p-3 rounded-2 h-100" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-bold fs-4 mb-1">{activities.length}</div>
                      <div className="text-secondary small">ActualitÃ©s recentes</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 rounded-2 h-100" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-bold fs-4 mb-1">{gallery.length}</div>
                      <div className="text-secondary small">Images en galerie</div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 rounded-2" style={{ background: "var(--panel-strong)" }}>
                      <div className="fw-semibold mb-2">Mission</div>
                      <div className="text-secondary">
                        Renforcer les liens entre Ã©tudiants et universitaires, soutenir les initiatives locales et faire vivre la mÃ©moire de l'association.
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
            eyebrow="ActualitÃ©s"
            title="DerniÃ¨res actualitÃ©s"
            text="Les actions recentes, les annonces et les Ã©vÃ©nements mis en avant sur la page d'accueil."
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
                    <div className="small text-uppercase fw-bold mb-2" style={{ color: "var(--accent-strong)", letterSpacing: "0.08em" }}>{activity.location || "Actualite"}</div>
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
            eyebrow="Galeries"
            title="Moments et souvenirs"
            text="Une sÃ©lection d'images provenant des activitÃ©s publiÃ©es."
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
    </div>
  );
}


