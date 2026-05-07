import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { activitiesApi } from "../../api/activity";

function resolveImageUrl(imagePath) {
  if (!imagePath) return "/images/avatar.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("/")) {
    return imagePath;
  }
  return `/${imagePath.replace(/^\/+/, "")}`;
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (x) => String(x).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function generateTempId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getCoverImage(activity) {
  return activity?.images?.find((image) => image?.is_cover) || activity?.images?.[0] || null;
}

function emptyForm() {
  return {
    title: "",
    description: "",
    location: "",
    starts_at: "",
    ends_at: "",
    status: "draft",
  };
}

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card border-0 bg-light shadow-none h-100">
      <div className="card-body p-4">
        <div className="mb-4">
          <h5 className="mb-1">{title}</h5>
          {subtitle ? <p className="text-muted small mb-0">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldError({ error }) {
  return error ? <span className="text-danger small d-block mt-1">{error[0]}</span> : null;
}

export default function FormActivityPage() {
  const { encryptedId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(encryptedId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [activity, setActivity] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [newImages, setNewImages] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [coverSelection, setCoverSelection] = useState("");

  useEffect(() => {
    return () => {
      newImages.forEach((image) => {
        if (image.preview) URL.revokeObjectURL(image.preview);
      });
    };
  }, [newImages]);

  useEffect(() => {
    let active = true;

    async function loadActivity() {
      if (!isEdit) return;

      setLoading(true);
      setGlobalError("");

      try {
        const response = await activitiesApi.show(encryptedId);
        if (!active) return;

        const current = response?.activity;
        setActivity(current);
        setForm({
          title: current?.title ?? "",
          description: current?.description ?? "",
          location: current?.location ?? "",
          starts_at: toInputDateTime(current?.starts_at),
          ends_at: toInputDateTime(current?.ends_at),
          status: current?.status ?? "draft",
        });

        const currentCover = getCoverImage(current);
        setCoverSelection(currentCover ? `existing:${currentCover.id}` : "");
      } catch (error) {
        if (!active) return;
        setGlobalError(error?.response?.data?.message || "Impossible de charger l'actualité.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadActivity();

    return () => {
      active = false;
    };
  }, [encryptedId, isEdit]);

  function visibleExistingImages() {
    return (activity?.images || []).filter((image) => !deletedImageIds.includes(image.id));
  }

  function ensureCoverSelection() {
    if (coverSelection) return;

    const existing = visibleExistingImages();
    if (existing[0]) {
      setCoverSelection(`existing:${existing[0].id}`);
      return;
    }

    if (newImages[0]) {
      setCoverSelection(`new:${newImages[0].tempId}`);
    }
  }

  useEffect(() => {
    ensureCoverSelection();
  }, [deletedImageIds, newImages, activity]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function onAddImages(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const oversizedFiles = files.filter((file) => file.size > MAX_IMAGE_SIZE_BYTES);

    if (oversizedFiles.length) {
      setErrors((current) => ({
        ...current,
        images: ["Chaque image ne doit pas depasser 2 Mo."],
      }));
      event.target.value = "";
      return;
    }

    setErrors((current) => {
      if (!current.images) return current;
      const next = { ...current };
      delete next.images;
      return next;
    });

    setNewImages((current) => [
      ...current,
      ...files.map((file) => ({
        tempId: generateTempId(),
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);

    event.target.value = "";
  }

  function removeNewImage(tempId) {
    setNewImages((current) => {
      const target = current.find((image) => image.tempId === tempId);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return current.filter((image) => image.tempId !== tempId);
    });

    if (coverSelection === `new:${tempId}`) {
      setCoverSelection("");
    }
  }

  function toggleExistingDeletion(imageId) {
    setDeletedImageIds((current) =>
      current.includes(imageId) ? current.filter((id) => id !== imageId) : [...current, imageId]
    );

    if (coverSelection === `existing:${imageId}`) {
      setCoverSelection("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setGlobalError("");

    const totalImages = visibleExistingImages().length + newImages.length;

    if (!form.title.trim()) {
      setErrors({ title: ["Le titre est obligatoire."] });
      return;
    }

    if (!isEdit && totalImages === 0) {
      setErrors({ images: ["Au moins une image est obligatoire."] });
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("location", form.location.trim());
      if (form.starts_at) payload.append("starts_at", form.starts_at);
      if (form.ends_at) payload.append("ends_at", form.ends_at);
      payload.append("status", form.status);

      newImages.forEach((image) => payload.append("images[]", image.file));
      deletedImageIds.forEach((id) => payload.append("deleted_image_ids[]", String(id)));

      if (coverSelection.startsWith("existing:")) {
        payload.append("cover_image_id", coverSelection.replace("existing:", ""));
      } else if (coverSelection.startsWith("new:")) {
        const tempId = coverSelection.replace("new:", "");
        const index = newImages.findIndex((image) => image.tempId === tempId);
        if (index >= 0) payload.append("cover_image_id", String(-(index + 1)));
      }

      if (isEdit) {
        await activitiesApi.update(encryptedId, payload);
      } else {
        await activitiesApi.create(payload);
      }

      navigate("/admin/activities", {
        replace: true,
        state: { flashMessage: isEdit ? "Activite mise a jour." : "Activite creee." },
      });
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const existingImages = visibleExistingImages();

  return (
    <div>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">{isEdit ? "Modifier actualité" : "Nouvelle actualité"}</h3>
          <p className="text-secondary mb-0">Formulaire de creation et de mise a jour d&apos;une actualité.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/activities" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2" />
            Retour a la liste
          </Link>
        </div>
      </div>

      {globalError ? <div className="alert alert-danger">{globalError}</div> : null}

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 text-muted">
              <div className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-xl-7">
              <div className="d-flex flex-column gap-4">
                <SectionCard title="Informations" subtitle="Contenu principal de l'actualité">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Titre</label>
                      <input className={`form-control ${errors.title ? "is-invalid" : ""}`} name="title" value={form.title} onChange={handleChange} />
                      <FieldError error={errors.title} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Lieu</label>
                      <input className={`form-control ${errors.location ? "is-invalid" : ""}`} name="location" value={form.location} onChange={handleChange} />
                      <FieldError error={errors.location} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Début</label>
                      <input type="datetime-local" className={`form-control ${errors.starts_at ? "is-invalid" : ""}`} name="starts_at" value={form.starts_at} onChange={handleChange} />
                      <FieldError error={errors.starts_at} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Fin</label>
                      <input type="datetime-local" className={`form-control ${errors.ends_at ? "is-invalid" : ""}`} name="ends_at" value={form.ends_at} onChange={handleChange} />
                      <FieldError error={errors.ends_at} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Statut</label>
                      <select className={`form-select ${errors.status ? "is-invalid" : ""}`} name="status" value={form.status} onChange={handleChange}>
                        <option value="draft">Brouillon</option>
                        <option value="published">Publiée</option>
                        <option value="cancelled">Annulée</option>
                        <option value="completed">Terminée</option>
                      </select>
                      <FieldError error={errors.status} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea rows={6} className={`form-control ${errors.description ? "is-invalid" : ""}`} name="description" value={form.description} onChange={handleChange} />
                      <FieldError error={errors.description} />
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="col-xl-5">
              <div className="d-flex flex-column gap-4">
                <SectionCard title="Images" subtitle="Galerie et image de couverture">
                  <div className="mb-3">
                    <label className="form-label">Ajouter des images</label>
                    <input type="file" accept="image/*" multiple className={`form-control ${errors.images ? "is-invalid" : ""}`} onChange={onAddImages} />
                    <FieldError error={errors.images} />
                  </div>

                  <div className="mb-4">
                    <div className="fw-semibold mb-2">Images existantes</div>
                    <div className="row g-3">
                      {existingImages.map((image) => (
                        <div key={image.id} className="col-md-6">
                          <div className="border rounded-4 overflow-hidden">
                            <div style={{ height: 160 }}>
                              <img src={resolveImageUrl(image.image_path)} alt="Activity" className="w-100 h-100 object-fit-cover" />
                            </div>
                            <div className="p-3">
                              <div className="form-check mb-2">
                                <input className="form-check-input" type="radio" name="cover-image" id={`existing-${image.id}`} checked={coverSelection === `existing:${image.id}`} onChange={() => setCoverSelection(`existing:${image.id}`)} />
                                <label className="form-check-label" htmlFor={`existing-${image.id}`}>Image de couverture</label>
                              </div>
                              <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => toggleExistingDeletion(image.id)}>
                                Retirer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!existingImages.length ? <div className="col-12 text-muted small">Aucune image existante conservee.</div> : null}
                    </div>
                  </div>

                  <div>
                    <div className="fw-semibold mb-2">Nouvelles images</div>
                    <div className="row g-3">
                      {newImages.map((image) => (
                        <div key={image.tempId} className="col-md-6">
                          <div className="border rounded-4 overflow-hidden">
                            <div style={{ height: 160 }}>
                              <img src={image.preview} alt="New activity" className="w-100 h-100 object-fit-cover" />
                            </div>
                            <div className="p-3">
                              <div className="form-check mb-2">
                                <input className="form-check-input" type="radio" name="cover-image" id={`new-${image.tempId}`} checked={coverSelection === `new:${image.tempId}`} onChange={() => setCoverSelection(`new:${image.tempId}`)} />
                                <label className="form-check-label" htmlFor={`new-${image.tempId}`}>Image de couverture</label>
                              </div>
                              <button type="button" className="btn btn-sm btn-outline-secondary w-100" onClick={() => removeNewImage(image.tempId)}>
                                Retirer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!newImages.length ? <div className="col-12 text-muted small">Aucune nouvelle image ajoutée.</div> : null}
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Link to="/admin/activities" className="btn btn-outline-secondary">
              <i className="bi bi-x-circle me-2" />
              Annuler
            </Link>
            <button type="submit" className="btn btn-dark" disabled={saving}>
              <i className="bi bi-save me-2" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
