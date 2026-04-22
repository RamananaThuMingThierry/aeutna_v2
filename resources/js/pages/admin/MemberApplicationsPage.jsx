import React, { useEffect, useMemo, useState } from "react";

import { memberApplicationsApi } from "../../api/member-application";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status) {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    case "needs_correction":
      return "warning";
    default:
      return "secondary";
  }
}

function formatAmount(value) {
  const amount = Number(value || 0);

  if (Number.isNaN(amount)) return value || "-";

  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  });
}

function statusLabel(status) {
  switch (status) {
    case "approved":
      return "Approuvee";
    case "rejected":
      return "Rejetee";
    case "needs_correction":
      return "A corriger";
    default:
      return "Soumise";
  }
}

export default function MemberApplicationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showing, setShowing] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewGlobalError, setReviewGlobalError] = useState("");
  const [reviewForm, setReviewForm] = useState({
    status: "approved",
    admin_comment: "",
  });

  async function load(mode = "initial") {
    if (mode === "initial") {
      setLoading(true);
      setError("");
    } else {
      setRefreshing(true);
    }

    try {
      const response = await memberApplicationsApi.list(selectedStatus === "all" ? {} : { status: selectedStatus });
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setItems(list);
    } catch (loadError) {
      const message = loadError?.response?.data?.message || "Impossible de charger les candidatures.";

      if (mode === "initial") {
        setError(message);
      } else {
        setReviewGlobalError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load("initial");
  }, [selectedStatus]);

  const stats = useMemo(
    () => ({
      total: items.length,
      submitted: items.filter((item) => item.status === "submitted").length,
      approved: items.filter((item) => item.status === "approved").length,
      rejected: items.filter((item) => item.status === "rejected").length,
    }),
    [items]
  );

  async function openShow(item) {
    setShowing(item);
    setShowLoading(true);

    try {
      const response = await memberApplicationsApi.show(item.encrypted_id);
      setShowing(response?.application || item);
    } catch {
      setShowing(item);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    setShowing(null);
    setShowLoading(false);
  }

  function openReview(item) {
    setReviewTarget(item);
    setReviewForm({
      status: item?.status === "submitted" ? "approved" : item?.status || "approved",
      admin_comment: item?.admin_comment || "",
    });
    setReviewErrors({});
    setReviewGlobalError("");
    setReviewOpen(true);
  }

  function closeReview() {
    if (reviewing) return;
    setReviewOpen(false);
    setReviewTarget(null);
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!reviewTarget || reviewing) return;

    setReviewing(true);
    setReviewErrors({});
    setReviewGlobalError("");

    try {
      const response = await memberApplicationsApi.review(reviewTarget.encrypted_id, reviewForm);
      const updated = response?.application;

      setItems((current) =>
        current.map((item) => (item.encrypted_id === reviewTarget.encrypted_id ? updated : item))
      );

      if (showing?.encrypted_id === reviewTarget.encrypted_id) {
        setShowing(updated);
      }

      setReviewOpen(false);
      setReviewTarget(null);
      await load("refresh");
    } catch (submitError) {
      const data = submitError?.response?.data;

      if (data?.errors) {
        const nextErrors = {};
        Object.entries(data.errors).forEach(([key, value]) => {
          nextErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        setReviewErrors(nextErrors);
      } else {
        setReviewGlobalError(data?.message || "Impossible de traiter cette candidature.");
      }
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1">Candidatures membres</h4>
          <div className="text-muted small">
            Les nouvelles inscriptions restent dans <code>member_applications</code> jusqu&apos;a validation par un administrateur.
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button type="button" className={`btn ${selectedStatus === "all" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setSelectedStatus("all")}>
            Toutes
          </button>
          <button type="button" className={`btn ${selectedStatus === "submitted" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setSelectedStatus("submitted")}>
            Soumises
          </button>
          <button type="button" className={`btn ${selectedStatus === "approved" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setSelectedStatus("approved")}>
            Approuvees
          </button>
          <button type="button" className={`btn ${selectedStatus === "needs_correction" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setSelectedStatus("needs_correction")}>
            A corriger
          </button>
          <button type="button" className={`btn ${selectedStatus === "rejected" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setSelectedStatus("rejected")}>
            Rejetees
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => void load("refresh")} disabled={loading || refreshing}>
            {refreshing ? "Rafraichissement..." : "Rafraichir"}
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="border rounded-4 p-3 bg-light-subtle h-100">
            <div className="small text-uppercase text-secondary fw-semibold mb-2">Total</div>
            <div className="display-6 fw-bold mb-0">{stats.total}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="border rounded-4 p-3 bg-light-subtle h-100">
            <div className="small text-uppercase text-secondary fw-semibold mb-2">Soumises</div>
            <div className="display-6 fw-bold mb-0">{stats.submitted}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="border rounded-4 p-3 bg-light-subtle h-100">
            <div className="small text-uppercase text-secondary fw-semibold mb-2">Approuvees</div>
            <div className="display-6 fw-bold mb-0">{stats.approved}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="border rounded-4 p-3 bg-light-subtle h-100">
            <div className="small text-uppercase text-secondary fw-semibold mb-2">Rejetees</div>
            <div className="display-6 fw-bold mb-0">{stats.rejected}</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading ? <div className="text-muted">Chargement...</div> : null}
          {error ? <div className="alert alert-danger py-2">{error}</div> : null}

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>Membre</th>
                  <th>Etudes</th>
                  <th>Paiement</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.encrypted_id}>
                    <td>
                      <div className="fw-semibold">{item.last_name} {item.first_name}</div>
                      <div className="small text-muted">{item.email || "-"}</div>
                      <div className="small text-muted">{item.phone || "-"}</div>
                    </td>
                    <td>
                      <div>{item.institution_name || "-"}</div>
                      <div className="small text-muted">{item.field_of_study || "-"}</div>
                    </td>
                    <td>
                      <div className="fw-semibold text-uppercase">{item.payment_method || "-"}</div>
                      <div className="small text-muted">{item.payment_reference || "-"}</div>
                    </td>
                    <td>
                      <span className={`badge text-bg-${statusBadge(item.status)}`}>{statusLabel(item.status)}</span>
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => void openShow(item)}>
                          <i className="bi bi-eye" />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => openReview(item)}>
                          <i className="bi bi-check2-square" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      Aucune candidature trouvee.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showing ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail de la candidature</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>
                <div className="modal-body">
                  {showLoading ? (
                    <div className="text-center py-4 text-secondary">Chargement...</div>
                  ) : (
                    <div className="row g-4">
                      <div className="col-lg-4">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">Identite</div>
                          <div className="mb-2"><span className="text-muted small">Nom complet</span><div className="fw-semibold">{showing.last_name} {showing.first_name}</div></div>
                          <div className="mb-2"><span className="text-muted small">Email</span><div className="fw-semibold">{showing.email || "-"}</div></div>
                          <div className="mb-2"><span className="text-muted small">Telephone</span><div className="fw-semibold">{showing.phone || "-"}</div></div>
                          <div className="mb-2"><span className="text-muted small">Ville</span><div className="fw-semibold">{showing.city || "-"}</div></div>
                          <div className="mb-2"><span className="text-muted small">Adresse</span><div className="fw-semibold">{showing.address || "-"}</div></div>
                          <div><span className="text-muted small">Facebook</span><div className="fw-semibold">{showing.facebook || "-"}</div></div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">Etudes</div>
                          <div className="mb-2"><span className="text-muted small">Etablissement</span><div className="fw-semibold">{showing.institution_name || "-"}</div></div>
                          <div className="mb-2"><span className="text-muted small">Filiere</span><div className="fw-semibold">{showing.field_of_study || "-"}</div></div>
                          <div className="mb-2"><span className="text-muted small">Axe</span><div className="fw-semibold">{showing.axis?.name || "-"}</div></div>
                          <div className="mb-2"><span className="text-muted small">Niveau</span><div className="fw-semibold">{showing.education_level?.name || "-"}</div></div>
                          <div><span className="text-muted small">Date de naissance</span><div className="fw-semibold">{formatDate(showing.birth_date)}</div></div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">Paiement et suivi</div>
                          <div className="mb-2"><span className="text-muted small">Methode</span><div className="fw-semibold text-uppercase">{showing.payment_method || "-"}</div></div>
                          <div className="mb-2"><span className="text-muted small">Reference</span><div className="fw-semibold">{showing.payment_reference || "-"}</div></div>
                          <div className="mb-2"><span className="text-muted small">Montant</span><div className="fw-semibold">{formatAmount(showing.payment_amount)}</div></div>
                          <div className="mb-2"><span className="text-muted small">Statut</span><div><span className={`badge text-bg-${statusBadge(showing.status)}`}>{statusLabel(showing.status)}</span></div></div>
                          <div className="mb-2"><span className="text-muted small">Traitee par</span><div className="fw-semibold">{showing.reviewer?.name || "-"}</div></div>
                          <div><span className="text-muted small">Commentaire admin</span><div className="fw-semibold" style={{ whiteSpace: "pre-line" }}>{showing.admin_comment || "-"}</div></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow}>Fermer</button>
                  <button type="button" className="btn btn-dark" onClick={() => openReview(showing)}>Traiter la candidature</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      ) : null}

      {reviewOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Traiter la candidature</h5>
                  <button type="button" className="btn-close" onClick={closeReview} />
                </div>
                <form onSubmit={submitReview}>
                  <div className="modal-body">
                    {reviewGlobalError ? <div className="alert alert-danger py-2">{reviewGlobalError}</div> : null}

                    <div className="rounded-4 border bg-light-subtle p-3 mb-3">
                      <div className="fw-semibold">{reviewTarget?.last_name} {reviewTarget?.first_name}</div>
                      <div className="small text-secondary">{reviewTarget?.email || "-"}</div>
                      <div className="small text-secondary">{reviewTarget?.payment_reference || "-"}</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Decision</label>
                      <select className={`form-select ${reviewErrors.status ? "is-invalid" : ""}`} value={reviewForm.status} onChange={(event) => setReviewForm((current) => ({ ...current, status: event.target.value }))}>
                        <option value="approved">Approuver</option>
                        <option value="needs_correction">Demander une correction</option>
                        <option value="rejected">Rejeter</option>
                      </select>
                      {reviewErrors.status ? <div className="text-danger small mt-1">{reviewErrors.status}</div> : null}
                    </div>

                    <div>
                      <label className="form-label">Commentaire admin</label>
                      <textarea rows="6" className={`form-control ${reviewErrors.admin_comment ? "is-invalid" : ""}`} value={reviewForm.admin_comment} onChange={(event) => setReviewForm((current) => ({ ...current, admin_comment: event.target.value }))} />
                      {reviewErrors.admin_comment ? <div className="text-danger small mt-1">{reviewErrors.admin_comment}</div> : null}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeReview} disabled={reviewing}>Annuler</button>
                    <button className="btn btn-dark" disabled={reviewing}>
                      {reviewing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Traitement...
                        </>
                      ) : (
                        "Valider"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeReview} />
        </>
      ) : null}
    </div>
  );
}
