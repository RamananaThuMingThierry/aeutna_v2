import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { albumsApi } from "../../api/album";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "/images/avatar.png";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/")) return imageUrl;
  return `/${imageUrl.replace(/^\/+/, "")}`;
}

function ImageEditorRow({ image, onChange, onDeleteToggle }) {
  return (
    <div className={`border rounded-4 p-3 ${image.markedForDelete ? "border-danger bg-danger-subtle" : "bg-light-subtle"}`}>
      <div className="row g-3">
        <div className="col-md-3">
          <div className="rounded-4 overflow-hidden border" style={{ height: 120 }}>
            <img src={resolveImageUrl(image.image_url)} alt={image.name || "Album"} className="w-100 h-100 object-fit-cover" />
          </div>
        </div>
        <div className="col-md-9">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nom</label>
              <input className="form-control" value={image.name || ""} onChange={(event) => onChange({ ...image, name: event.target.value })} disabled={image.markedForDelete} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Position</label>
              <input type="number" className="form-control" value={image.position ?? 0} onChange={(event) => onChange({ ...image, position: event.target.value })} disabled={image.markedForDelete} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Statut</label>
              <select className="form-select" value={image.status || "active"} onChange={(event) => onChange({ ...image, status: event.target.value })} disabled={image.markedForDelete}>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="2" value={image.description || ""} onChange={(event) => onChange({ ...image, description: event.target.value })} disabled={image.markedForDelete} />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button type="button" className={`btn ${image.markedForDelete ? "btn-outline-secondary" : "btn-outline-danger"}`} onClick={onDeleteToggle}>
                {image.markedForDelete ? "Annuler la suppression" : "Supprimer cette image"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryAdminPage() {
  const DT_LANG_URL = useMemo(() => "/lang/datatables/fr.json", []);
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [globalError, setGlobalError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ title: "", slug: "", description: "", status: "active" });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const itemsRef = useRef(items);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
  }, []);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 3500);
  }

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  function resetForm() {
    setEditing(null);
    setForm({ title: "", slug: "", description: "", status: "active" });
    setExistingImages([]);
    setNewImages([]);
    setErrors({});
    setGlobalError("");
  }

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const list = await albumsApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les albums.";
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

  useEffect(() => {
    if (initialLoading || !tableRef.current) return;
    const $table = $(tableRef.current);

    if (dtRef.current) {
      try {
        $table.off("click", ".js-show");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}
      dtRef.current.destroy();
      dtRef.current = null;
      $table.find("tbody").empty();
    }

    dtRef.current = $table.DataTable({
      data: [],
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        {
          data: null,
          width: 100,
          orderable: false,
          searchable: false,
          render: (data, type, row) => {
            const image = row?.images?.[0]?.image_url;
            return `<div class="d-flex align-items-center justify-content-center"><img src="${resolveImageUrl(image)}" alt="album" style="width:72px;height:48px;object-fit:cover;border-radius:12px;border:1px solid rgba(0,0,0,.08)" /></div>`;
          },
        },
        {
          data: null,
          render: (data, type, row) => `<div class="fw-semibold">${row?.title || "-"}</div><div class="small text-muted">${row?.slug || "-"}</div>`,
        },
        {
          data: "description",
          render: (value) => {
            const text = String(value || "-");
            return text.length > 90 ? `${text.slice(0, 90)}...` : text;
          },
        },
        {
          data: "images",
          width: 110,
          render: (value) => Array.isArray(value) ? value.length : 0,
        },
        {
          data: "status",
          width: 120,
          render: (value) => value === "active" ? `<span class="badge text-bg-success">Actif</span>` : `<span class="badge text-bg-secondary">Inactif</span>`,
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 180,
          render: (data, type, row) => {
            const id = getRowId(row);
            return `<button class="btn btn-sm btn-outline-primary me-2 js-show" data-id="${id}"><i class="bi bi-eye"></i></button><button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}"><i class="bi bi-pencil-square"></i></button><button class="btn btn-sm btn-outline-danger js-del" data-id="${id}"><i class="bi bi-trash3"></i></button>`;
          },
        },
      ],
    });

    $table.on("click", ".js-show", async (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;
      try {
        const data = await albumsApi.show(getRowId(item));
        setShowing(data?.album || item);
      } catch {
        setShowing(item);
      }
      setShowOpen(true);
    });

    $table.on("click", ".js-edit", async (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;
      try {
        const data = await albumsApi.show(getRowId(item));
        const album = data?.album || item;
        setEditing(album);
        setForm({ title: album?.title ?? "", slug: album?.slug ?? "", description: album?.description ?? "", status: album?.status ?? "active" });
        setExistingImages((album?.images || []).map((image) => ({ ...image, markedForDelete: false })));
        setNewImages([]);
        setErrors({});
        setGlobalError("");
        setOpen(true);
      } catch {
        showToast("danger", "Impossible de charger l album pour edition.");
      }
    });

    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;
      setDeleteTarget(item);
      setDeleteOpen(true);
    });

    return () => {
      try {
        $table.off("click", ".js-show");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}
      dtRef.current?.destroy();
      dtRef.current = null;
    };
  }, [initialLoading, DT_LANG_URL]);

  useEffect(() => {
    if (!dtRef.current) return;
    const dt = dtRef.current;
    const page = dt.page();
    const search = dt.search();
    const order = dt.order();
    dt.clear();
    dt.rows.add(items);
    dt.draw(false);
    dt.order(order).draw(false);
    dt.search(search).draw(false);
    dt.page(page).draw(false);
  }, [items]);

  async function onSubmit(event) {
    event.preventDefault();
    setErrors({});
    setGlobalError("");
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("slug", form.slug.trim());
      payload.append("description", form.description.trim());
      payload.append("status", form.status);

      existingImages.filter((image) => image.markedForDelete).forEach((image, index) => {
        payload.append(`deleted_image_ids[${index}]`, String(image.id));
      });

      payload.append("existing_images", JSON.stringify(existingImages.filter((image) => !image.markedForDelete).map((image) => ({
        id: image.id,
        name: image.name || "",
        description: image.description || "",
        position: Number(image.position || 0),
        status: image.status || "active",
      }))));

      newImages.forEach((file) => {
        payload.append("images[]", file);
      });

      if (editing) await albumsApi.update(getRowId(editing), payload);
      else await albumsApi.create(payload);

      await load({ mode: "refresh" });
      setOpen(false);
      resetForm();
      showToast("success", editing ? "Album mis a jour." : "Album cree.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await albumsApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", "Album supprime.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Galerie</h4>
          <div className="text-muted small">Gestion des albums et des images de la galerie.</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>
            {initialLoading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />Rafraichissement...</> : <><i className="bi bi-arrow-clockwise me-2" />Rafraichir</>}
          </button>
          <button className="btn btn-dark" onClick={() => { resetForm(); setOpen(true); }} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />Nouvel album
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? <div className="d-flex align-items-center gap-2 text-muted mb-3"><div className="spinner-border spinner-border-sm" />Chargement...</div> : null}
          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>Apercu</th>
                  <th>Album</th>
                  <th>Description</th>
                  <th>Images</th>
                  <th>Statut</th>
                  <th className="text-end" style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

      {open ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? "Modifier l album" : "Creer un album"}</h5>
                  <button type="button" className="btn-close" onClick={() => !saving && setOpen(false)} />
                </div>
                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Titre</label>
                        <input className={`form-control ${errors.title ? "is-invalid" : ""}`} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Slug</label>
                        <input className={`form-control ${errors.slug ? "is-invalid" : ""}`} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Statut</label>
                        <select className="form-select" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                          <option value="active">Actif</option>
                          <option value="inactive">Inactif</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea className="form-control" rows="3" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Nouvelles images</label>
                        <input type="file" accept="image/*" multiple className="form-control" onChange={(event) => setNewImages(Array.from(event.target.files || []))} />
                        {newImages.length > 0 ? <div className="form-text">{newImages.length} image(s) selectionnee(s).</div> : null}
                      </div>
                    </div>

                    {editing ? (
                      <div className="mt-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <h6 className="mb-0">Images existantes</h6>
                          <div className="small text-secondary">Modifier les informations ou marquer une image pour suppression.</div>
                        </div>
                        <div className="d-grid gap-3">
                          {existingImages.length === 0 ? <div className="alert alert-secondary mb-0">Aucune image existante sur cet album.</div> : existingImages.map((image, index) => (
                            <ImageEditorRow
                              key={image.id}
                              image={image}
                              onChange={(nextImage) => setExistingImages((current) => current.map((item, itemIndex) => (itemIndex === index ? nextImage : item)))}
                              onDeleteToggle={() => setExistingImages((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, markedForDelete: !item.markedForDelete } : item)))}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => !saving && setOpen(false)}>Annuler</button>
                    <button className="btn btn-warning" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => !saving && setOpen(false)} />
        </>
      ) : null}

      {showOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail album</h5>
                  <button type="button" className="btn-close" onClick={() => setShowOpen(false)} />
                </div>
                <div className="modal-body">
                  {showing ? (
                    <div className="row g-4">
                      <div className="col-lg-4">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="mb-3"><div className="text-muted small">Titre</div><div className="fw-semibold">{showing.title || "-"}</div></div>
                          <div className="mb-3"><div className="text-muted small">Slug</div><div>{showing.slug || "-"}</div></div>
                          <div className="mb-3"><div className="text-muted small">Statut</div><div>{showing.status === "active" ? <span className="badge text-bg-success">Actif</span> : <span className="badge text-bg-secondary">Inactif</span>}</div></div>
                          <div><div className="text-muted small">Description</div><div>{showing.description || "-"}</div></div>
                        </div>
                      </div>
                      <div className="col-lg-8">
                        <div className="row g-3">
                          {(showing.images || []).map((image) => (
                            <div key={image.id} className="col-md-6">
                              <div className="border rounded-4 overflow-hidden h-100">
                                <img src={resolveImageUrl(image.image_url)} alt={image.name || showing.title} className="w-100 object-fit-cover" style={{ height: 220 }} />
                                <div className="p-3">
                                  <div className="fw-semibold">{image.name || "-"}</div>
                                  <div className="small text-secondary mb-2">{image.description || "Sans description"}</div>
                                  <div className="d-flex justify-content-between small text-secondary"><span>Position: {image.position ?? 0}</span><span>{image.status || "active"}</span></div>
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
                  <p className="mb-0">Supprimer l album <b>{deleteTarget?.title || "#"}</b> et toutes ses images ?</p>
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
