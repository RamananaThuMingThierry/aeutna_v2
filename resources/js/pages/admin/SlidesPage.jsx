import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { slidesApi } from "../../api/slide";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "/images/avatar.png";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/")) {
    return imageUrl;
  }
  return `/${imageUrl.replace(/^\/+/, "")}`;
}

export default function SlidesPage() {
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    position: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
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

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast((x) => ({ ...x, open: false })), 3500);
  }

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  function resetForm() {
    setEditing(null);
    setForm({
      title: "",
      subtitle: "",
      position: 0,
      is_active: true,
    });
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
    setErrors({});
    setGlobalError("");
  }

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const list = await slidesApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les slides.";
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
          data: "image_url",
          width: 100,
          orderable: false,
          searchable: false,
          render: (value) => `
            <div class="d-flex align-items-center justify-content-center">
              <img
                src="${resolveImageUrl(value)}"
                alt="slide"
                style="width:72px;height:44px;object-fit:cover;border-radius:10px;border:1px solid rgba(0,0,0,.08)"
              />
            </div>
          `,
        },
        {
          data: null,
          render: (d, t, row) => `
            <div class="fw-semibold">${row?.title || "-"}</div>
            <div class="small text-muted">${row?.subtitle || "-"}</div>
          `,
        },
        { data: "position", defaultContent: 0 },
        {
          data: "is_active",
          width: 120,
          render: (value) =>
            value
              ? `<span class="badge text-bg-success">Actif</span>`
              : `<span class="badge text-bg-secondary">Inactif</span>`,
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 180,
          render: (d, t, row) => {
            const id = getRowId(row);
            return `<button class="btn btn-sm btn-outline-primary me-2 js-show" data-id="${id}"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-sm btn-outline-danger js-del" data-id="${id}"><i class="bi bi-trash3"></i></button>`;
          },
        },
      ],
    });

    $table.on("click", ".js-show", async (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;
      try {
        const data = await slidesApi.show(getRowId(item));
        setShowing(data?.slide || item);
      } catch {
        setShowing(item);
      }
      setShowOpen(true);
    });

    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;
      setEditing(item);
      setForm({
        title: item?.title ?? "",
        subtitle: item?.subtitle ?? "",
        position: item?.position ?? 0,
        is_active: !!item?.is_active,
      });
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      setErrors({});
      setGlobalError("");
      setOpen(true);
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

    if (!editing && !imageFile) {
      setErrors({ image: ["L'image est obligatoire."] });
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("subtitle", form.subtitle.trim());
      payload.append("position", String(Number(form.position || 0)));
      payload.append("is_active", form.is_active ? "1" : "0");

      if (imageFile) {
        payload.append("image", imageFile);
      }

      if (editing) await slidesApi.update(getRowId(editing), payload);
      else await slidesApi.create(payload);

      await load({ mode: "refresh" });
      setOpen(false);
      resetForm();
      showToast("success", editing ? "Slide mis a jour." : "Slide cree.");
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
      await slidesApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", "Slide supprime.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  const currentImageUrl = imagePreview || resolveImageUrl(editing?.image_url);

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Slides</h4>
          <div className="text-muted small">Gestion des slides du carousel</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>
            {initialLoading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />Rafraichissement...</> : <><i className="bi bi-arrow-clockwise me-2" />Rafraichir</>}
          </button>
          <button className="btn btn-dark" onClick={() => { resetForm(); setOpen(true); }} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />Nouveau slide
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
                  <th>Contenu</th>
                  <th>Position</th>
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
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? "Modifier" : "Creer"}</h5>
                  <button type="button" className="btn-close" onClick={() => !saving && setOpen(false)} />
                </div>
                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
                    <div className="mb-3">
                      <label className="form-label">Titre</label>
                      <input className={`form-control ${errors.title ? "is-invalid" : ""}`} value={form.title} onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))} />
                      {errors.title ? <span className="text-danger small">{errors.title[0]}</span> : null}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Sous-titre</label>
                      <input className={`form-control ${errors.subtitle ? "is-invalid" : ""}`} value={form.subtitle} onChange={(e) => setForm((x) => ({ ...x, subtitle: e.target.value }))} />
                      {errors.subtitle ? <span className="text-danger small">{errors.subtitle[0]}</span> : null}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        className={`form-control ${errors.image ? "is-invalid" : ""}`}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setImageFile(file);

                          if (imagePreview) URL.revokeObjectURL(imagePreview);
                          setImagePreview(file ? URL.createObjectURL(file) : "");
                        }}
                      />
                      {errors.image ? <span className="text-danger small">{errors.image[0]}</span> : null}
                      {editing && !imageFile ? <div className="form-text">L'image actuelle sera conservee si aucun nouveau fichier n'est selectionne.</div> : null}
                    </div>
                    {currentImageUrl && currentImageUrl !== "/images/avatar.png" ? (
                      <div className="mb-3">
                        <div className="rounded-4 overflow-hidden border" style={{ height: "180px" }}>
                          <img src={currentImageUrl} alt="Preview slide" className="w-100 h-100 object-fit-cover" />
                        </div>
                      </div>
                    ) : null}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Position</label>
                        <input type="number" min="0" className={`form-control ${errors.position ? "is-invalid" : ""}`} value={form.position} onChange={(e) => setForm((x) => ({ ...x, position: e.target.value }))} />
                        {errors.position ? <span className="text-danger small">{errors.position[0]}</span> : null}
                      </div>
                      <div className="col-md-6 d-flex align-items-end">
                        <div className="form-check mb-2">
                          <input className="form-check-input" type="checkbox" id="slide-active" checked={!!form.is_active} onChange={(e) => setForm((x) => ({ ...x, is_active: e.target.checked }))} />
                          <label className="form-check-label" htmlFor="slide-active">Actif</label>
                        </div>
                      </div>
                    </div>
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
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail slide</h5>
                  <button type="button" className="btn-close" onClick={() => setShowOpen(false)} />
                </div>
                <div className="modal-body">
                  {showing ? (
                    <div className="row g-4">
                      <div className="col-md-7">
                        <div className="rounded-4 overflow-hidden border" style={{ minHeight: "260px" }}>
                          <img src={resolveImageUrl(showing.image_url)} alt="Slide" className="w-100 h-100 object-fit-cover" />
                        </div>
                      </div>
                      <div className="col-md-5">
                        <div className="mb-3">
                          <div className="text-muted small">Titre</div>
                          <div className="fw-semibold">{showing.title || "-"}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-muted small">Sous-titre</div>
                          <div>{showing.subtitle || "-"}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-muted small">Position</div>
                          <div>{showing.position ?? 0}</div>
                        </div>
                        <div>
                          <div className="text-muted small">Statut</div>
                          <div>{showing.is_active ? <span className="badge text-bg-success">Actif</span> : <span className="badge text-bg-secondary">Inactif</span>}</div>
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
                  <p className="mb-0">Supprimer le slide <b>{deleteTarget?.title || "#"}</b> ?</p>
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
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((x) => ({ ...x, open: false }))} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
