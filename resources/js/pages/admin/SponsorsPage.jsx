import React, { useEffect, useMemo, useState } from "react";

import { sponsorsApi } from "../../api/sponsor";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "/images/avatar.png";
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("/")) return imageUrl;
  return `/${imageUrl.replace(/^\/+/, "")}`;
}

function phoneHref(value) {
  const number = String(value || "").replace(/[^\d+]/g, "");
  return /\d/.test(number) ? `tel:${number}` : "";
}

function SponsorPhone({ value, label, icon, fullName }) {
  if (!value) return null;

  const href = phoneHref(value);
  const content = (
    <>
      <i className={`bi ${icon} text-secondary`} aria-hidden="true" />
      <span className="small fw-semibold sponsor-phone-number">{value}</span>
      <span className="small text-secondary ms-auto">{label}</span>
    </>
  );

  if (!href) return <div className="d-flex align-items-center gap-2 text-secondary">{content}</div>;

  return (
    <a
      className="d-flex align-items-center gap-2 text-decoration-none sponsor-phone-link"
      href={href}
      aria-label={`Appeler ${fullName}, téléphone ${label.toLowerCase()} : ${value}`}
    >
      {content}
    </a>
  );
}

const PAGE_SIZE = 12;

const initialForm = {
  first_name: "",
  last_name: "",
  phone: "",
  phone2: "",
  note: "",
};

export default function SponsorsPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState("");

  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("fr");
    if (!term) return items;

    return items.filter((item) => [
      item?.first_name,
      item?.last_name,
      item?.phone,
      item?.phone2,
      item?.note,
    ].filter(Boolean).some((value) => String(value).toLocaleLowerCase("fr").includes(term)));
  }, [items, query]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const displayedPage = Math.min(currentPage, pageCount);
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => Math.max(1, Math.min(displayedPage - 2, pageCount - 4)) + index
  );
  const visibleItems = filteredItems.slice((displayedPage - 1) * PAGE_SIZE, displayedPage * PAGE_SIZE);
  const firstVisibleItem = filteredItems.length ? (displayedPage - 1) * PAGE_SIZE + 1 : 0;
  const lastVisibleItem = Math.min(displayedPage * PAGE_SIZE, filteredItems.length);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setGlobalError("");

      try {
        const response = await sponsorsApi.list();
        if (active) setItems(normalizeCollection(response));
      } catch (error) {
        if (active) setGlobalError(error?.response?.data?.message || "Impossible de charger l’annuaire des parrains.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!imagePreview) return undefined;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  function resetForm() {
    setEditing(null);
    setForm(initialForm);
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    setErrors({});
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    resetForm();
  }

  function openCreate() {
    resetForm();
    setGlobalError("");
    setFormOpen(true);
  }

  function startEdit(item) {
    setEditing(item);
    setForm({
      first_name: item?.first_name || "",
      last_name: item?.last_name || "",
      phone: item?.phone || "",
      phone2: item?.phone2 || "",
      note: item?.note || "",
    });
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    setErrors({});
    setGlobalError("");
    setFormOpen(true);
  }

  async function loadItems() {
    setLoading(true);
    setGlobalError("");

    try {
      const response = await sponsorsApi.list();
      setItems(normalizeCollection(response));
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger l’annuaire des parrains.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrors({});
    setGlobalError("");

    const wasEditing = Boolean(editing);
    const payload = new FormData();
    payload.append("first_name", form.first_name.trim());
    payload.append("last_name", form.last_name.trim());
    payload.append("phone", form.phone.trim());
    payload.append("phone2", form.phone2.trim());
    payload.append("note", form.note.trim());
    if (imageFile) payload.append("image", imageFile);
    if (removeImage) payload.append("remove_image", "1");

    try {
      const response = wasEditing
        ? await sponsorsApi.update(editing.encrypted_id ?? editing.id, payload)
        : await sponsorsApi.create(payload);

      setFormOpen(false);
      resetForm();
      await loadItems();
      setToast(response?.message || (wasEditing ? "Fiche mise à jour." : "Parrain ajouté à l’annuaire."));
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Impossible d’enregistrer cette fiche.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setGlobalError("");

    try {
      await sponsorsApi.remove(deleteTarget.encrypted_id ?? deleteTarget.id);
      setDeleteTarget(null);
      await loadItems();
      setToast("Fiche du parrain supprimée.");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de supprimer cette fiche.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-xl-row align-items-xl-end justify-content-between gap-3 mb-4">
        <div>
          <div className="small text-uppercase text-secondary fw-semibold mb-1">Relations & partenaires</div>
          <h4 className="mb-1">Annuaire des parrains</h4>
          <p className="text-secondary small mb-0">Retrouvez les coordonnées et les notes associées à chaque parrain.</p>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2">
          <div className="input-group">
            <span className="input-group-text bg-white"><i className="bi bi-search" aria-hidden="true" /></span>
            <input
              className="form-control"
              type="search"
              aria-label="Rechercher un parrain"
              placeholder="Nom, téléphone, note..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button type="button" className="btn btn-dark text-nowrap" onClick={openCreate}>
            <i className="bi bi-person-plus me-2" aria-hidden="true" /> Ajouter un parrain
          </button>
        </div>
      </div>

      {globalError ? <div className="alert alert-danger py-2" role="alert">{globalError}</div> : null}
      {toast ? <div className="alert alert-success py-2" role="status">{toast}</div> : null}

      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="text-secondary small">{filteredItems.length} résultat{filteredItems.length === 1 ? "" : "s"}</div>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void loadItems()} disabled={loading}>
          {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : <i className="bi bi-arrow-clockwise me-2" aria-hidden="true" />}
          Actualiser
        </button>
      </div>

      {loading ? <div className="text-secondary py-5 text-center">Chargement de l’annuaire…</div> : null}
      {!loading && !filteredItems.length ? (
        <div className="border rounded-4 bg-white text-center p-5">
          <i className="bi bi-person-lines-fill display-6 text-secondary" aria-hidden="true" />
          <h5 className="mt-3">{query ? "Aucun résultat" : "L’annuaire est encore vide"}</h5>
          <p className="text-secondary mb-3">{query ? "Essayez avec un autre nom ou numéro." : "Ajoutez une fiche pour commencer à organiser les coordonnées de vos parrains."}</p>
          {!query ? <button type="button" className="btn btn-outline-dark" onClick={openCreate}>Ajouter un parrain</button> : null}
        </div>
      ) : null}

      {!loading && filteredItems.length ? (
        <>
          <div className="row g-3">
            {visibleItems.map((item) => {
            const fullName = `${item.first_name || ""} ${item.last_name || ""}`.trim();

            return (
              <div className="col-md-6 col-xxl-4" key={item.encrypted_id ?? item.id}>
                <article className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3">
                      <img
                        src={resolveImageUrl(item.image_url)}
                        alt={fullName ? `Photo de ${fullName}` : "Photo du parrain"}
                        className="rounded-circle object-fit-cover border bg-light flex-shrink-0"
                        style={{ width: 64, height: 64 }}
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-grow-1">
                        <h5 className="mb-1 text-break">{fullName || "Nom non renseigné"}</h5>
                        <div className="small text-secondary">Parrain</div>
                      </div>
                      <div className="d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-light border" onClick={() => startEdit(item)} aria-label={`Modifier ${fullName}`} title="Modifier">
                          <i className="bi bi-pencil-square" aria-hidden="true" />
                        </button>
                        <button type="button" className="btn btn-sm btn-light border text-danger" onClick={() => setDeleteTarget(item)} aria-label={`Supprimer ${fullName}`} title="Supprimer">
                          <i className="bi bi-trash3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <hr className="my-3" />

                    <div className="d-grid gap-2">
                      <SponsorPhone value={item.phone} label="Principal" icon="bi-telephone-outbound" fullName={fullName || "ce parrain"} />
                      <SponsorPhone value={item.phone2} label="Secondaire" icon="bi-telephone-plus" fullName={fullName || "ce parrain"} />
                      {!item.phone && !item.phone2 ? <span className="small text-secondary">Aucun numéro renseigné</span> : null}
                    </div>

                    {item.note ? (
                      <div className="rounded-3 bg-light p-3 mt-3">
                        <div className="small text-uppercase fw-semibold text-secondary mb-1">Note</div>
                        <p className="small mb-0 text-secondary" style={{ whiteSpace: "pre-wrap" }}>{item.note}</p>
                      </div>
                    ) : null}
                  </div>
                </article>
              </div>
            );
            })}
          </div>

          {filteredItems.length > PAGE_SIZE ? (
            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mt-4">
              <div className="small text-secondary">
                Affichage de <strong>{firstVisibleItem}–{lastVisibleItem}</strong> sur <strong>{filteredItems.length}</strong> parrains
              </div>
              <nav aria-label="Pagination des parrains">
                <ul className="pagination pagination-sm mb-0 justify-content-center">
                  <li className={`page-item ${displayedPage === 1 ? "disabled" : ""}`}>
                    <button type="button" className="page-link" onClick={() => setCurrentPage(displayedPage - 1)} disabled={displayedPage === 1} aria-label="Page précédente">
                      <i className="bi bi-chevron-left" aria-hidden="true" />
                    </button>
                  </li>
                  {pageNumbers.map((page) => (
                    <li className={`page-item ${page === displayedPage ? "active" : ""}`} key={page}>
                      <button type="button" className="page-link" onClick={() => setCurrentPage(page)} aria-current={page === displayedPage ? "page" : undefined} aria-label={`Page ${page}`}>
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${displayedPage === pageCount ? "disabled" : ""}`}>
                    <button type="button" className="page-link" onClick={() => setCurrentPage(displayedPage + 1)} disabled={displayedPage === pageCount} aria-label="Page suivante">
                      <i className="bi bi-chevron-right" aria-hidden="true" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          ) : null}
        </>
      ) : null}

      {formOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true" aria-labelledby="sponsor-form-title">
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <div>
                      <div className="small text-uppercase text-secondary fw-semibold">Annuaire des parrains</div>
                      <h5 className="modal-title" id="sponsor-form-title">{editing ? "Modifier la fiche" : "Ajouter un parrain"}</h5>
                    </div>
                    <button type="button" className="btn-close" onClick={closeForm} disabled={saving} aria-label="Fermer" />
                  </div>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="sponsor-first-name">Prénom <span className="text-secondary small">(facultatif)</span></label>
                        <input
                          id="sponsor-first-name"
                          className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
                          autoComplete="given-name"
                          value={form.first_name}
                          onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                        />
                        {errors.first_name ? <div className="invalid-feedback">{errors.first_name[0]}</div> : null}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="sponsor-last-name">Nom <span className="text-danger">*</span></label>
                        <input
                          id="sponsor-last-name"
                          className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
                          autoComplete="family-name"
                          value={form.last_name}
                          onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                          required
                        />
                        {errors.last_name ? <div className="invalid-feedback">{errors.last_name[0]}</div> : null}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="sponsor-phone">Téléphone principal <span className="text-danger">*</span></label>
                        <input
                          id="sponsor-phone"
                          className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                          type="tel"
                          autoComplete="tel"
                          value={form.phone}
                          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                          required
                        />
                        {errors.phone ? <div className="invalid-feedback">{errors.phone[0]}</div> : null}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="sponsor-phone2">Téléphone secondaire</label>
                        <input
                          id="sponsor-phone2"
                          className={`form-control ${errors.phone2 ? "is-invalid" : ""}`}
                          type="tel"
                          value={form.phone2}
                          onChange={(event) => setForm((current) => ({ ...current, phone2: event.target.value }))}
                        />
                        {errors.phone2 ? <div className="invalid-feedback">{errors.phone2[0]}</div> : null}
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor="sponsor-note">Note</label>
                        <textarea
                          id="sponsor-note"
                          className={`form-control ${errors.note ? "is-invalid" : ""}`}
                          rows={4}
                          value={form.note}
                          onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                        />
                        {errors.note ? <div className="invalid-feedback">{errors.note[0]}</div> : null}
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor="sponsor-image">Photo</label>
                        <input
                          id="sponsor-image"
                          className={`form-control ${errors.image ? "is-invalid" : ""}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setImageFile(file);
                            setImagePreview(file ? URL.createObjectURL(file) : "");
                            if (file) setRemoveImage(false);
                          }}
                        />
                        {errors.image ? <div className="invalid-feedback">{errors.image[0]}</div> : null}
                        <div className="form-text">Image JPG, PNG ou WebP, 5 Mo maximum.</div>
                      </div>
                      {(imagePreview || (editing?.image_url && !removeImage)) ? (
                        <div className="col-12 d-flex align-items-center gap-3">
                          <img
                            src={imagePreview || resolveImageUrl(editing.image_url)}
                            alt="Aperçu du parrain"
                            className="rounded-circle object-fit-cover border"
                            style={{ width: 72, height: 72 }}
                          />
                          <div className="small text-secondary">{imageFile?.name || "Photo actuelle"}</div>
                        </div>
                      ) : null}
                      {editing?.image_url ? (
                        <div className="col-12">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="sponsor-remove-image"
                              checked={removeImage}
                              onChange={(event) => setRemoveImage(event.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="sponsor-remove-image">Supprimer la photo actuelle</label>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeForm} disabled={saving}>Annuler</button>
                    <button type="submit" className="btn btn-dark" disabled={saving}>
                      {saving ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Enregistrement…</> : editing ? "Enregistrer les modifications" : "Ajouter le parrain"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeForm} />
        </>
      ) : null}

      {deleteTarget ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true" aria-labelledby="sponsor-delete-title">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title" id="sponsor-delete-title">Supprimer cette fiche</h5>
                  <button type="button" className="btn-close" onClick={() => !deleting && setDeleteTarget(null)} aria-label="Fermer" />
                </div>
                <div className="modal-body">
                  Supprimer la fiche de <strong>{`${deleteTarget.first_name || ""} ${deleteTarget.last_name || ""}`.trim()}</strong> ?
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Annuler</button>
                  <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={deleting}>
                    {deleting ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Suppression…</> : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => !deleting && setDeleteTarget(null)} />
        </>
      ) : null}
    </div>
  );
}
