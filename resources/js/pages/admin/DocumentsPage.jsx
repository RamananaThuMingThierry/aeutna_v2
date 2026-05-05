import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { documentsApi } from "../../api/document";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR");
}

function formatBytes(value) {
  const size = Number(value || 0);
  if (!size) return "-";
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function DocumentsPage() {
  const DT_LANG_URL = useMemo(() => "/lang/datatables/fr.json", []);
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", document_type: "statut", visibility: "private", publication_status: "draft", published_at: "", file: null });
  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const itemsRef = useRef(items);
  const toastTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => { if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current); }, []);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 3500);
  }

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true); else setRefreshing(true);
    try {
      const list = await documentsApi.list();
      setItems(normalizeCollection(list));
      setGlobalError("");
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les documents.";
      if (mode === "initial") setGlobalError(message); else showToast("danger", message);
    } finally {
      if (mode === "initial") setInitialLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load({ mode: "initial" }); }, []);

  useEffect(() => {
    if (initialLoading || !tableRef.current) return;
    const $table = $(tableRef.current);
    if (dtRef.current) {
      try { $table.off("click", ".js-show"); $table.off("click", ".js-edit"); $table.off("click", ".js-del"); } catch {}
      dtRef.current.destroy();
      dtRef.current = null;
      $table.find("tbody").empty();
    }

    dtRef.current = $table.DataTable({
      data: [], pageLength: 10, lengthMenu: [10, 15, 25, 50, 100], ordering: true, searching: true, responsive: true, language: { url: DT_LANG_URL },
      columns: [
        { data: null, render: (d, t, row) => `<div class="fw-semibold">${row?.title || "-"}</div><div class="small text-muted">${row?.file_name || row?.document_type || "-"}</div>` },
        { data: "document_type", defaultContent: "-" },
        { data: "visibility", render: (value) => `<span class="badge text-bg-light border text-dark">${value || "-"}</span>` },
        { data: "publication_status", render: (value) => `<span class="badge text-bg-${value === "published" ? "success" : value === "archived" ? "secondary" : "warning"}">${value || "-"}</span>` },
        { data: "file_size", render: (value) => formatBytes(value) },
        { data: "updated_at", render: (value) => formatDate(value) },
        { data: null, orderable: false, searchable: false, className: "text-end", width: 180, render: (d, t, row) => { const id = getRowId(row); return `<button class="btn btn-sm btn-outline-primary me-2 js-show" data-id="${id}"><i class="bi bi-eye"></i></button><button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}"><i class="bi bi-pencil-square"></i></button><button class="btn btn-sm btn-outline-danger js-del" data-id="${id}"><i class="bi bi-trash3"></i></button>`; } },
      ],
    });

    $table.on("click", ".js-show", (event) => { const id = $(event.currentTarget).data("id"); const item = itemsRef.current.find((row) => String(getRowId(row)) === String(id)); if (item) void openShow(item); });
    $table.on("click", ".js-edit", (event) => { const id = $(event.currentTarget).data("id"); const item = itemsRef.current.find((row) => String(getRowId(row)) === String(id)); if (item) openEdit(item); });
    $table.on("click", ".js-del", (event) => { const id = $(event.currentTarget).data("id"); const item = itemsRef.current.find((row) => String(getRowId(row)) === String(id)); if (item) { setDeleteTarget(item); setDeleteOpen(true); } });

    return () => { try { $table.off("click", ".js-show"); $table.off("click", ".js-edit"); $table.off("click", ".js-del"); } catch {} dtRef.current?.destroy(); dtRef.current = null; };
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

  function resetForm() {
    setForm({ title: "", description: "", document_type: "statut", visibility: "private", publication_status: "draft", published_at: "", file: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openCreate() { setEditing(null); resetForm(); setErrors({}); setGlobalError(""); setOpen(true); }
  function openEdit(item) { setEditing(item); setForm({ title: item?.title || "", description: item?.description || "", document_type: item?.document_type || "statut", visibility: item?.visibility || "private", publication_status: item?.publication_status || "draft", published_at: item?.published_at ? String(item.published_at).slice(0, 10) : "", file: null }); if (fileInputRef.current) fileInputRef.current.value = ""; setErrors({}); setGlobalError(""); setOpen(true); }
  async function openShow(item) { try { const response = await documentsApi.show(getRowId(item)); setShowing(response?.document || item); } catch { setShowing(item); } setShowOpen(true); }
  function closeModal() { if (saving) return; setOpen(false); }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setGlobalError("");

    try {
      const payload = { title: form.title.trim(), description: form.description.trim() || null, document_type: form.document_type, visibility: form.visibility, publication_status: form.publication_status, published_at: form.published_at || null, file: form.file || undefined };
      if (editing) await documentsApi.update(getRowId(editing), payload); else await documentsApi.create(payload);
      await load({ mode: "refresh" });
      setOpen(false);
      showToast("success", editing ? "Document mis a jour." : "Document cree.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors); else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await documentsApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", "Document supprime.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de la suppression.");
    } finally { setDeleting(false); }
  }

  return <div className="container-fluid"><div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3"><div><h4 className="mb-1">Documents</h4><div className="text-muted small">Gestion des PDF, Excel, Word et autres fichiers</div></div><div className="d-flex gap-2"><button className="btn btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>{initialLoading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />Rafraichissement...</> : <><i className="bi bi-arrow-clockwise me-2" />Rafraichir</>}</button><button className="btn btn-dark" onClick={openCreate} disabled={initialLoading}><i className="bi bi-plus-lg me-2" />Nouveau document</button></div></div><div className="card border-0 shadow-sm"><div className="card-body">{initialLoading ? <div className="d-flex align-items-center gap-2 text-muted mb-3"><div className="spinner-border spinner-border-sm" />Chargement...</div> : null}{globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}<div className="table-responsive"><table ref={tableRef} className="table align-middle mb-0 w-100"><thead><tr className="text-muted small"><th>Titre</th><th>Type</th><th>Visibilite</th><th>Publication</th><th>Taille</th><th>Mis a jour</th><th className="text-end">Actions</th></tr></thead><tbody /></table></div></div></div>{open ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">{editing ? "Modifier le document" : "Nouveau document"}</h5><button type="button" className="btn-close" onClick={closeModal} /></div><form onSubmit={onSubmit}><div className="modal-body">{globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}<div className="row g-3"><div className="col-md-8"><label className="form-label">Titre</label><input className={`form-control ${errors.title ? "is-invalid" : ""}`} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />{errors.title ? <span className="text-danger small">{errors.title[0]}</span> : null}</div><div className="col-md-4"><label className="form-label">Type</label><input className={`form-control ${errors.document_type ? "is-invalid" : ""}`} value={form.document_type} onChange={(event) => setForm((current) => ({ ...current, document_type: event.target.value }))} />{errors.document_type ? <span className="text-danger small">{errors.document_type[0]}</span> : null}</div><div className="col-md-6"><label className="form-label">Visibilite</label><select className="form-select" value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}><option value="public">Public</option><option value="admin">Admin</option><option value="private">Prive</option></select></div><div className="col-md-6"><label className="form-label">Publication</label><select className="form-select" value={form.publication_status} onChange={(event) => setForm((current) => ({ ...current, publication_status: event.target.value }))}><option value="draft">Brouillon</option><option value="published">Publie</option><option value="archived">Archive</option></select></div><div className="col-md-6"><label className="form-label">Date de publication</label><input type="date" className="form-control" value={form.published_at} onChange={(event) => setForm((current) => ({ ...current, published_at: event.target.value }))} /></div><div className="col-md-6"><label className="form-label">Fichier</label><input ref={fileInputRef} type="file" className={`form-control ${errors.file ? "is-invalid" : ""}`} onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} />{errors.file ? <span className="text-danger small">{errors.file[0]}</span> : null}{editing?.file_name ? <div className="text-muted small mt-1">Fichier actuel : {editing.file_name}</div> : null}</div><div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div></div></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>Annuler</button><button className="btn btn-dark" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</> : "Enregistrer"}</button></div></form></div></div></div><div className="modal-backdrop fade show" onClick={closeModal} /></> : null}{showOpen ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">Details document</h5><button type="button" className="btn-close" onClick={() => setShowOpen(false)} /></div><div className="modal-body">{showing ? <div className="row g-3"><div className="col-md-6"><div className="small text-muted">Titre</div><div className="fw-semibold">{showing.title || "-"}</div></div><div className="col-md-6"><div className="small text-muted">Type</div><div>{showing.document_type || "-"}</div></div><div className="col-md-4"><div className="small text-muted">Visibilite</div><div>{showing.visibility || "-"}</div></div><div className="col-md-4"><div className="small text-muted">Publication</div><div>{showing.publication_status || "-"}</div></div><div className="col-md-4"><div className="small text-muted">Taille</div><div>{formatBytes(showing.file_size)}</div></div><div className="col-md-6"><div className="small text-muted">Fichier</div><div>{showing.file_name || "-"}</div></div><div className="col-md-6"><div className="small text-muted">Mis a jour</div><div>{formatDate(showing.updated_at)}</div></div><div className="col-12"><div className="small text-muted">Description</div><div style={{ whiteSpace: "pre-wrap" }}>{showing.description || "-"}</div></div>{showing.file_url ? <div className="col-12"><a className="btn btn-outline-dark" href={showing.file_url} target="_blank" rel="noreferrer"><i className="bi bi-download me-2" />Ouvrir le fichier</a></div> : null}</div> : null}</div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setShowOpen(false)}>Fermer</button></div></div></div></div><div className="modal-backdrop fade show" onClick={() => setShowOpen(false)} /></> : null}{deleteOpen ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">Confirmation</h5><button type="button" className="btn-close" onClick={() => !deleting && setDeleteOpen(false)} /></div><div className="modal-body"><p className="mb-0">Supprimer le document <b>{deleteTarget?.title || "#"}</b> ?</p></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</button><button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={deleting}>{deleting ? <><span className="spinner-border spinner-border-sm me-2" />Suppression...</> : "Supprimer"}</button></div></div></div></div><div className="modal-backdrop fade show" onClick={() => !deleting && setDeleteOpen(false)} /></> : null}{toast.open ? <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}><div className={`toast show text-bg-${toast.type} border-0`}><div className="d-flex"><div className="toast-body">{toast.message}</div><button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((current) => ({ ...current, open: false }))} /></div></div></div> : null}</div>;
}

