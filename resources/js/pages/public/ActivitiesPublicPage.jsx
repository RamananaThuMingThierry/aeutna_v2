import React, { useEffect, useMemo, useState } from "react";

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

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatStatus(status) {
  if (status === "published") return "PubliÃ©e";
  if (status === "completed") return "TerminÃ©e";
  return status || "-";
}

function ActivityCard({ activity, onOpen }) {
  const coverImage =
    activity.images?.find((image) => image.is_cover)?.image_path || activity.images?.[0]?.image_path || "";

  return (
    <article className="card border-0 shadow-sm h-100 overflow-hidden" style={{ background: "var(--panel)" }}>
      <img
        src={resolveImageUrl(coverImage)}
        alt={activity.title}
        className="w-100 object-fit-cover"
        loading="lazy"
        decoding="async"
        style={{ height: 240 }}
      />
      <div className="card-body p-4 d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
          <span className={`badge ${activity.status === "completed" ? "text-bg-secondary" : "text-bg-success"}`}>
            {formatStatus(activity.status)}
          </span>
          <div className="small text-secondary">{formatDate(activity.starts_at)}</div>
        </div>
        <h2 className="h5 fw-bold mb-2">{activity.title}</h2>
        <div className="small text-uppercase fw-semibold mb-3" style={{ color: "var(--accent-strong)", letterSpacing: "0.08em" }}>
          {activity.location || "Lieu non renseigne"}
        </div>
        <p className="text-secondary flex-grow-1 mb-4">
          {activity.description?.length > 140 ? `${activity.description.slice(0, 140)}...` : (activity.description || "Aucune description disponible.")}
        </p>
        <button type="button" className="btn btn-dark d-block w-100 px-4" onClick={() => onOpen(activity)}>
          Voir le detail
        </button>
      </div>
    </article>
  );
}

function ActivityImagesCarousel({ activity }) {
  const images = Array.isArray(activity?.images) ? activity.images : [];
  const carouselId = `activityCarousel-${activity?.id || "preview"}`;

  if (images.length === 0) {
    return (
      <div className="rounded-4 overflow-hidden border" style={{ minHeight: 340 }}>
        <img
          src="/images/avatar.png"
          alt={activity?.title || "Activite"}
          className="w-100 h-100 object-fit-cover"
        />
      </div>
    );
  }

  return (
    <div id={carouselId} className="carousel slide">
      <div className="carousel-inner rounded-4 overflow-hidden border" style={{ minHeight: 340 }}>
        {images.map((image, index) => (
          <div key={image.id || index} className={`carousel-item ${index === 0 ? "active" : ""}`}>
            <div style={{ height: 340 }}>
              <img
                src={resolveImageUrl(image.image_path)}
                alt={image.caption || activity?.title || "Activite"}
                className="w-100 h-100 object-fit-cover"
              />
            </div>
            {image.caption ? (
              <div className="carousel-caption text-start rounded-4 px-3 py-2" style={{ background: "rgba(0,0,0,0.45)" }}>
                <div className="small">{image.caption}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <>
          <button className="carousel-control-prev" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true" />
            <span className="visually-hidden">Precedent</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true" />
            <span className="visually-hidden">Suivant</span>
          </button>
          <div className="carousel-indicators mb-0">
            {images.map((image, index) => (
              <button
                key={`indicator-${image.id || index}`}
                type="button"
                data-bs-target={`#${carouselId}`}
                data-bs-slide-to={index}
                className={index === 0 ? "active" : ""}
                aria-current={index === 0 ? "true" : undefined}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function ActivitiesPublicPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await websiteApi.activities();
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Impossible de charger les actualites.");
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

  if (loading) {
    return <div className="container py-5">Chargement...</div>;
  }

  if (error) {
    return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div>
      <section className="py-5 py-lg-6">
        <div className="container">
           <div className="text-center">
            <h1 className="h3">Les actualites publiques de l'association</h1>
            <p className="">
                Consultez ce que l'association fait, a fait ou prevoit de faire a travers ses publications et annonces.
            </p>
        </div>
          {activities.length === 0 ? (
            <div className="alert alert-secondary text-center">Aucune actualité ne correspond au filtre actuel.</div>
          ) : (
            <div className="row g-4">
              {activities.map((activity) => (
                <div key={activity.id} className="col-md-6 col-xl-4">
                  <ActivityCard activity={activity} onOpen={setSelectedActivity} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedActivity ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{selectedActivity.title}</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedActivity(null)} />
                </div>
                <div className="modal-body">
                  <div className="row g-4">
                    <div className="col-12">
                      <ActivityImagesCarousel activity={selectedActivity} />
                    </div>
                    <div className="col-12">
                      <div className="border rounded-4 p-4 h-100">
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <span className={`badge ${selectedActivity.status === "completed" ? "text-bg-secondary" : "text-bg-success"}`}>
                            {formatStatus(selectedActivity.status)}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="text-muted small">Lieu</div>
                          <div className="fw-semibold text-warning">{selectedActivity.location || "-"}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-muted small">Date de debut</div>
                          <div className="fw-semibold">{formatDate(selectedActivity.starts_at)}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-muted small">Date de fin</div>
                          <div className="fw-semibold">{formatDate(selectedActivity.ends_at)}</div>
                        </div>
                        <div>
                          <div className="text-muted small">Description</div>
                          <div style={{ whiteSpace: "pre-line" }}>{selectedActivity.description || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedActivity(null)}>
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setSelectedActivity(null)} />
        </>
      ) : null}
    </div>
  );
}


