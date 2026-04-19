import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { activitiesApi } from "../../api/activity";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function resolveImageUrl(imagePath) {
  if (!imagePath) return "/images/avatar.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("/")) {
    return imagePath;
  }
  return `/${imagePath.replace(/^\/+/, "")}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

function statusMeta(status) {
  const map = {
    draft: ["secondary", "Brouillon"],
    published: ["success", "Publiee"],
    cancelled: ["danger", "Annulee"],
    completed: ["primary", "Terminee"],
  };
  return map[status] || ["light", status || "-"];
}

function getCoverImage(activity) {
  return activity?.images?.find((image) => image?.is_cover) || activity?.images?.[0] || null;
}

function ActivityCardCarousel({ activity, rowId }) {
  const images = Array.isArray(activity?.images) && activity.images.length
    ? [...activity.images].sort((a, b) => {
        if (a.is_cover === b.is_cover) return a.id - b.id;
        return a.is_cover ? -1 : 1;
      })
    : [{ id: "fallback", image_path: null, is_cover: true }];

  const carouselId = `activity-carousel-${String(rowId).replace(/[^a-zA-Z0-9_-]/g, "")}`;

  if (images.length === 1) {
    return (
      <img
        src={resolveImageUrl(images[0]?.image_path)}
        alt={activity?.title || "Activity"}
        className="w-100 h-100 object-fit-cover"
        style={{ minHeight: 200 }}
      />
    );
  }

  return (
    <div id={carouselId} className="carousel slide h-100" data-bs-ride="carousel">
      <div className="carousel-inner h-100">
        {images.map((image, index) => (
          <div key={image.id ?? index} className={`carousel-item h-100 ${index === 0 ? "active" : ""}`}>
            <img
              src={resolveImageUrl(image?.image_path)}
              alt={`${activity?.title || "Activity"} ${index + 1}`}
              className="w-100 h-100 object-fit-cover"
              style={{ minHeight: 200 }}
            />
          </div>
        ))}
      </div>

      <button className="carousel-control-prev" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Precedent</span>
      </button>

      <button className="carousel-control-next" type="button" data-bs-target={`#${carouselId}`} data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Suivant</span>
      </button>

      <div className="carousel-indicators mb-2">
        {images.map((image, index) => (
          <button
            key={image.id ?? index}
            type="button"
            data-bs-target={`#${carouselId}`}
            data-bs-slide-to={index}
            className={index === 0 ? "active" : ""}
            aria-current={index === 0 ? "true" : undefined}
            aria-label={`Image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [globalError, setGlobalError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3500);
  }

  useEffect(() => {
    if (location.state?.flashMessage) {
      showToast("success", location.state.flashMessage);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item?.title, item?.location, item?.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [items, query]);

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const list = await activitiesApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les activites.";
      if (mode === "initial") setGlobalError(message);
      else showToast("danger", message);
    } finally {
      if (mode === "initial") setInitialLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load({ mode: "initial" });
  }, []);

  async function openShow(item) {
    try {
      const data = await activitiesApi.show(getRowId(item));
      setShowing(data?.activity || item);
    } catch {
      setShowing(item);
    }
    setShowOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await activitiesApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", "Activite supprimee.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1">Activites</h4>
          <div className="text-muted small">Gestion des activites et de leurs images</div>
        </div>
        <div className="d-flex flex-column flex-md-row gap-2">
          <input
            className="form-control"
            placeholder="Rechercher une activite"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>
            {initialLoading || refreshing ? "Rafraichissement..." : "Rafraichir"}
          </button>
          <button className="btn btn-sm btn-dark" onClick={() => navigate("/admin/activities/new")} disabled={initialLoading}>
            Nouvelle activite
          </button>
        </div>
      </div>

      {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

      <div className="row g-3">
        {initialLoading ? (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-muted">Chargement...</div>
            </div>
          </div>
        ) : filteredItems.length ? (
          filteredItems.map((item) => {
            const [variant, label] = statusMeta(item.status);
            const rowId = getRowId(item);

            return (
              <div key={rowId} className="col-lg-6">
                <div className="card border-0 shadow-sm h-100 overflow-hidden">
                  <div className="row g-0 h-100">
                    <div className="col-md-4 bg-body-tertiary">
                      <ActivityCardCarousel activity={item} rowId={rowId} />
                    </div>
                    <div className="col-md-8">
                      <div className="card-body h-100 d-flex flex-column">
                        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                          <div>
                            <h5 className="card-title mb-1">{item.title}</h5>
                            <div className="text-muted small">{item.location || "Lieu non renseigne"}</div>
                          </div>
                          <span className={`badge text-bg-${variant}`}>{label}</span>
                        </div>
                        <div className="small text-muted mb-2">Debut : {formatDateTime(item.starts_at)}</div>
                        <div className="small text-muted mb-3">Images : {item?.images?.length ?? 0}</div>
                        <p className="text-secondary mb-3" style={{ whiteSpace: "pre-wrap" }}>
                          {item.description || "Aucune description."}
                        </p>
                        <div className="mt-auto d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => void openShow(item)}>
                            Voir
                          </button>
                          <button className="btn btn-sm btn-outline-dark" onClick={() => navigate(`/admin/activities/${rowId}/edit`)}>
                            Modifier
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => { setDeleteTarget(item); setDeleteOpen(true); }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-muted">Aucune activite trouvee.</div>
            </div>
          </div>
        )}
      </div>

      {showOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail activite</h5>
                  <button type="button" className="btn-close" onClick={() => setShowOpen(false)} />
                </div>
                <div className="modal-body">
                  {showing ? (
                    <div className="row g-4">
                      <div className="col-lg-5">
                        <div className="border rounded-4 overflow-hidden" style={{ minHeight: 320 }}>
                          <img src={resolveImageUrl(getCoverImage(showing)?.image_path)} alt="Cover" className="w-100 h-100 object-fit-cover" />
                        </div>
                      </div>
                      <div className="col-lg-7">
                        <div className="mb-3"><div className="text-muted small">Titre</div><div className="fw-semibold">{showing.title || "-"}</div></div>
                        <div className="mb-3"><div className="text-muted small">Lieu</div><div>{showing.location || "-"}</div></div>
                        <div className="mb-3"><div className="text-muted small">Debut</div><div>{formatDateTime(showing.starts_at)}</div></div>
                        <div className="mb-3"><div className="text-muted small">Fin</div><div>{formatDateTime(showing.ends_at)}</div></div>
                        <div className="mb-3"><div className="text-muted small">Statut</div><div>{statusMeta(showing.status)[1]}</div></div>
                        <div><div className="text-muted small">Description</div><div style={{ whiteSpace: "pre-wrap" }}>{showing.description || "-"}</div></div>
                      </div>
                      <div className="col-12">
                        <div className="fw-semibold mb-3">Galerie</div>
                        <div className="row g-3">
                          {(showing.images || []).map((image) => (
                            <div key={image.id} className="col-md-4 col-xl-3">
                              <div className="border rounded-4 overflow-hidden">
                                <div style={{ height: 180 }}>
                                  <img src={resolveImageUrl(image.image_path)} alt="Activity" className="w-100 h-100 object-fit-cover" />
                                </div>
                                <div className="p-2 small">
                                  {image.is_cover ? <span className="badge text-bg-warning">Couverture</span> : <span className="text-muted">Image</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowOpen(false)}>Fermer</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setShowOpen(false)} />
        </>
      ) : null}

      {deleteOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmation</h5>
                  <button type="button" className="btn-close" onClick={() => !deleting && setDeleteOpen(false)} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">Supprimer l'activite <b>{deleteTarget?.title || "#"}</b> ?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => !deleting && setDeleteOpen(false)}>Annuler</button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? "Suppression..." : "Supprimer"}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => !deleting && setDeleteOpen(false)} />
        </>
      ) : null}

      {toast.open ? (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show text-bg-${toast.type} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((current) => ({ ...current, open: false }))} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
