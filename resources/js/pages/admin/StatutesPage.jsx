import React, { useEffect, useMemo, useRef, useState } from "react";

import { documentsApi } from "../../api/document";
import { statutesApi } from "../../api/statute";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

function countArticles(statute) {
  return (statute?.titles || []).reduce((sum, title) => sum + (title?.articles?.length || 0), 0);
}

export default function StatutesPage() {
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleSaving, setTitleSaving] = useState(false);
  const [articleSaving, setArticleSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [titleModal, setTitleModal] = useState({ open: false, editing: null });
  const [articleModal, setArticleModal] = useState({ open: false, editing: null, title: null });
  const [form, setForm] = useState({ title: "", version: "1.0", publication_status: "draft", visibility: "admin", validated_at: "", effective_at: "", is_current: false, document_id: "" });
  const [titleForm, setTitleForm] = useState({ number: "", heading: "", sort_order: 0 });
  const [articleForm, setArticleForm] = useState({ article_number: "", title: "", content: "", sort_order: 0 });
  const [titleErrors, setTitleErrors] = useState({});
  const [articleErrors, setArticleErrors] = useState({});
  const toastTimeoutRef = useRef(null);

  useEffect(() => () => { if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current); }, []);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast((current) => ({ ...current, open: false })), 3500);
  }

  const getRowId = (row) => row?.encrypted_id ?? row?.id;
  const documentOptions = useMemo(() => documents.filter((item) => item.document_type === "statut" || item.document_type === "statuts"), [documents]);

  async function loadDocuments() {
    try {
      const list = await documentsApi.list();
      setDocuments(normalizeCollection(list));
    } catch {}
  }

  async function loadStatutes({ mode = "refresh", keepSelection = true } = {}) {
    if (mode === "initial") setInitialLoading(true); else setRefreshing(true);
    try {
      const list = normalizeCollection(await statutesApi.list());
      setItems(list);
      setGlobalError("");
      const nextSelectedId = keepSelection ? selectedId || getRowId(list[0]) : getRowId(list[0]);
      if (nextSelectedId) setSelectedId(nextSelectedId); else { setSelectedId(""); setSelected(null); }
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les statuts.";
      if (mode === "initial") setGlobalError(message); else showToast("danger", message);
    } finally {
      if (mode === "initial") setInitialLoading(false);
      setRefreshing(false);
    }
  }

  async function loadDetails(encryptedId) {
    if (!encryptedId) { setSelected(null); return; }
    setDetailsLoading(true);
    try {
      const response = await statutesApi.show(encryptedId);
      setSelected(response?.statute || null);
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Impossible de charger le detail du statut.");
    } finally { setDetailsLoading(false); }
  }

  useEffect(() => { void Promise.all([loadDocuments(), loadStatutes({ mode: "initial", keepSelection: false })]); }, []);
  useEffect(() => { if (!selectedId) return; void loadDetails(selectedId); }, [selectedId]);

  function openCreate() { setEditing(null); setForm({ title: "", version: "1.0", publication_status: "draft", visibility: "admin", validated_at: "", effective_at: "", is_current: false, document_id: "" }); setErrors({}); setOpen(true); }
  function openEdit(item) { setEditing(item); setForm({ title: item?.title || "", version: item?.version || "1.0", publication_status: item?.publication_status || "draft", visibility: item?.visibility || "admin", validated_at: item?.validated_at || "", effective_at: item?.effective_at || "", is_current: !!item?.is_current, document_id: item?.document_id ? String(item.document_id) : "" }); setErrors({}); setOpen(true); }

  async function submitStatute(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = { title: form.title.trim(), version: form.version.trim(), publication_status: form.publication_status, visibility: form.visibility, validated_at: form.validated_at || null, effective_at: form.effective_at || null, is_current: form.is_current, document_id: form.document_id ? Number(form.document_id) : null };
      let response;
      if (editing) response = await statutesApi.update(getRowId(editing), payload); else response = await statutesApi.create(payload);
      await loadStatutes({ mode: "refresh" });
      await loadDetails(getRowId(response.data));
      setSelectedId(getRowId(response.data));
      setOpen(false);
      showToast("success", editing ? "Statut mis a jour." : "Statut cree.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors); else showToast("danger", data?.message || "Echec de l'enregistrement.");
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await statutesApi.remove(getRowId(deleteTarget));
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadStatutes({ mode: "refresh", keepSelection: false });
      showToast("success", "Statut supprime.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de la suppression.");
    } finally { setDeleting(false); }
  }

  function openCreateTitle() { setTitleModal({ open: true, editing: null }); setTitleForm({ number: "", heading: "", sort_order: selected?.titles?.length || 0 }); setTitleErrors({}); }
  function openEditTitle(title) { setTitleModal({ open: true, editing: title }); setTitleForm({ number: title?.number || "", heading: title?.heading || "", sort_order: title?.sort_order ?? 0 }); setTitleErrors({}); }

  async function submitTitle(event) {
    event.preventDefault();
    if (!selected) return;
    setTitleSaving(true);
    setTitleErrors({});
    try {
      const payload = { statute_id: selected.id, number: titleForm.number.trim(), heading: titleForm.heading.trim(), sort_order: Number(titleForm.sort_order || 0) };
      if (titleModal.editing) await statutesApi.updateTitle(getRowId(titleModal.editing), payload); else await statutesApi.createTitle(getRowId(selected), payload);
      await loadDetails(getRowId(selected));
      setTitleModal({ open: false, editing: null });
      showToast("success", titleModal.editing ? "Titre mis a jour." : "Titre ajoute.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setTitleErrors(data.errors); else showToast("danger", data?.message || "Echec de l'enregistrement du titre.");
    } finally { setTitleSaving(false); }
  }

  async function deleteTitle(title) {
    if (!window.confirm(`Supprimer le titre ${title?.number || ""} ?`)) return;
    try {
      await statutesApi.removeTitle(getRowId(title));
      await loadDetails(getRowId(selected));
      showToast("success", "Titre supprime.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de la suppression du titre.");
    }
  }

  function openCreateArticle(title) { setArticleModal({ open: true, editing: null, title }); setArticleForm({ article_number: "", title: "", content: "", sort_order: title?.articles?.length || 0 }); setArticleErrors({}); }
  function openEditArticle(title, article) { setArticleModal({ open: true, editing: article, title }); setArticleForm({ article_number: article?.article_number || "", title: article?.title || "", content: article?.content || "", sort_order: article?.sort_order ?? 0 }); setArticleErrors({}); }

  async function submitArticle(event) {
    event.preventDefault();
    const parentTitle = articleModal.title;
    if (!parentTitle) return;
    setArticleSaving(true);
    setArticleErrors({});
    try {
      const payload = { statute_title_id: parentTitle.id, article_number: articleForm.article_number.trim(), title: articleForm.title.trim() || null, content: articleForm.content.trim(), sort_order: Number(articleForm.sort_order || 0) };
      if (articleModal.editing) await statutesApi.updateArticle(getRowId(articleModal.editing), payload); else await statutesApi.createArticle(getRowId(parentTitle), payload);
      await loadDetails(getRowId(selected));
      setArticleModal({ open: false, editing: null, title: null });
      showToast("success", articleModal.editing ? "Article mis a jour." : "Article ajoute.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setArticleErrors(data.errors); else showToast("danger", data?.message || "Echec de l'enregistrement de l'article.");
    } finally { setArticleSaving(false); }
  }

  async function deleteArticle(article) {
    if (!window.confirm(`Supprimer l'article ${article?.article_number || ""} ?`)) return;
    try {
      await statutesApi.removeArticle(getRowId(article));
      await loadDetails(getRowId(selected));
      showToast("success", "Article supprime.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de la suppression de l'article.");
    }
  }

  return <div className="container-fluid"><div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3"><div><h4 className="mb-1">Statuts</h4><div className="text-muted small">Gestion des statuts, titres et articles</div></div><div className="d-flex gap-2"><button className="btn btn-outline-secondary" onClick={() => void loadStatutes({ mode: "refresh" })} disabled={initialLoading || refreshing}>{initialLoading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />Rafraichissement...</> : <><i className="bi bi-arrow-clockwise me-2" />Rafraichir</>}</button><button className="btn btn-dark" onClick={openCreate}><i className="bi bi-plus-lg me-2" />Nouveau statut</button></div></div>{globalError ? <div className="alert alert-danger">{globalError}</div> : null}<div className="row g-3"><div className="col-lg-4"><div className="card border-0 shadow-sm"><div className="card-body"><div className="d-flex align-items-center justify-content-between mb-3"><h5 className="mb-0">Liste</h5><span className="badge text-bg-light border text-dark">{items.length}</span></div>{initialLoading ? <div className="text-muted">Chargement...</div> : null}<div className="d-grid gap-2">{items.map((item) => { const active = String(getRowId(item)) === String(selectedId); return <button key={getRowId(item)} type="button" className={`btn text-start border rounded-4 p-3 ${active ? "btn-dark" : "btn-light"}`} onClick={() => setSelectedId(getRowId(item))}><div className="d-flex align-items-start justify-content-between gap-2"><div><div className="fw-semibold">{item.title}</div><div className={`small ${active ? "text-white-50" : "text-muted"}`}>Version {item.version}</div></div>{item.is_current ? <span className="badge text-bg-success">Courant</span> : null}</div><div className={`small mt-2 ${active ? "text-white-50" : "text-muted"}`}>{item.publication_status} • {item.visibility}</div><div className="d-flex gap-2 mt-3"><span className={`badge ${active ? "text-bg-light text-dark" : "text-bg-secondary"}`}>{item.titles_count || 0} titres</span></div></button>; })}{!initialLoading && !items.length ? <div className="text-muted small">Aucun statut enregistre.</div> : null}</div></div></div></div><div className="col-lg-8"><div className="card border-0 shadow-sm"><div className="card-body">{detailsLoading ? <div className="d-flex align-items-center gap-2 text-muted mb-3"><div className="spinner-border spinner-border-sm" />Chargement du detail...</div> : null}{selected ? <><div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4"><div><div className="d-flex align-items-center gap-2 flex-wrap"><h5 className="mb-0">{selected.title}</h5>{selected.is_current ? <span className="badge text-bg-success">Version courante</span> : null}</div><div className="text-muted small mt-1">Version {selected.version} • {selected.publication_status} • {selected.visibility}</div><div className="text-muted small mt-1">Validation : {formatDate(selected.validated_at)} • Effet : {formatDate(selected.effective_at)}</div></div><div className="d-flex gap-2 align-self-start"><button className="btn btn-outline-dark" onClick={() => openEdit(selected)}><i className="bi bi-pencil-square me-2" />Modifier</button><button className="btn btn-outline-danger" onClick={() => { setDeleteTarget(selected); setDeleteOpen(true); }}><i className="bi bi-trash3 me-2" />Supprimer</button></div></div><div className="row g-3 mb-4"><div className="col-md-4"><div className="rounded-4 bg-light p-3"><div className="small text-uppercase text-secondary fw-semibold mb-2">Titres</div><div className="fs-4 fw-semibold">{selected.titles?.length || 0}</div></div></div><div className="col-md-4"><div className="rounded-4 bg-light p-3"><div className="small text-uppercase text-secondary fw-semibold mb-2">Articles</div><div className="fs-4 fw-semibold">{countArticles(selected)}</div></div></div><div className="col-md-4"><div className="rounded-4 bg-light p-3"><div className="small text-uppercase text-secondary fw-semibold mb-2">Document lie</div><div className="fw-semibold">{selected.document?.title || "-"}</div></div></div></div><div className="d-flex align-items-center justify-content-between mb-3"><h6 className="mb-0">Titres et articles</h6><button className="btn btn-dark btn-sm" onClick={openCreateTitle}><i className="bi bi-plus-lg me-2" />Ajouter un titre</button></div><div className="accordion d-grid gap-3">{(selected.titles || []).map((title) => <div key={getRowId(title)} className="border rounded-4 p-3"><div className="d-flex flex-column flex-md-row justify-content-between gap-3"><div><div className="small text-uppercase text-secondary fw-semibold">Titre {title.number}</div><div className="fw-semibold">{title.heading}</div></div><div className="d-flex gap-2 align-self-start"><button className="btn btn-outline-primary btn-sm" onClick={() => openCreateArticle(title)}><i className="bi bi-plus-lg me-1" />Article</button><button className="btn btn-outline-dark btn-sm" onClick={() => openEditTitle(title)}><i className="bi bi-pencil-square me-1" />Modifier</button><button className="btn btn-outline-danger btn-sm" onClick={() => void deleteTitle(title)}><i className="bi bi-trash3 me-1" />Supprimer</button></div></div><div className="d-grid gap-3 mt-3">{(title.articles || []).map((article) => <div key={getRowId(article)} className="bg-body-tertiary rounded-4 p-3"><div className="d-flex flex-column flex-md-row justify-content-between gap-2"><div><div className="fw-semibold">Article {article.article_number}{article.title ? ` - ${article.title}` : ""}</div></div><div className="d-flex gap-2 align-self-start"><button className="btn btn-outline-dark btn-sm" onClick={() => openEditArticle(title, article)}><i className="bi bi-pencil-square me-1" />Modifier</button><button className="btn btn-outline-danger btn-sm" onClick={() => void deleteArticle(article)}><i className="bi bi-trash3 me-1" />Supprimer</button></div></div><div className="text-secondary small mt-2" style={{ whiteSpace: "pre-wrap" }}>{article.content}</div></div>)}{!title.articles?.length ? <div className="text-muted small">Aucun article sous ce titre.</div> : null}</div></div>)}{!selected.titles?.length ? <div className="text-muted small">Aucun titre pour ce statut.</div> : null}</div></> : <div className="text-muted">Selectionne un statut pour afficher son detail.</div>}</div></div></div></div>{open ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">{editing ? "Modifier le statut" : "Nouveau statut"}</h5><button type="button" className="btn-close" onClick={() => !saving && setOpen(false)} /></div><form onSubmit={submitStatute}><div className="modal-body"><div className="row g-3"><div className="col-md-8"><label className="form-label">Titre</label><input className={`form-control ${errors.title ? "is-invalid" : ""}`} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />{errors.title ? <span className="text-danger small">{errors.title[0]}</span> : null}</div><div className="col-md-4"><label className="form-label">Version</label><input className={`form-control ${errors.version ? "is-invalid" : ""}`} value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} /></div><div className="col-md-4"><label className="form-label">Publication</label><select className="form-select" value={form.publication_status} onChange={(event) => setForm((current) => ({ ...current, publication_status: event.target.value }))}><option value="draft">Brouillon</option><option value="validated">Valide</option><option value="published">Publie</option><option value="archived">Archive</option></select></div><div className="col-md-4"><label className="form-label">Visibilite</label><select className="form-select" value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}><option value="public">Public</option><option value="admin">Admin</option><option value="private">Prive</option></select></div><div className="col-md-4"><label className="form-label">Document PDF lie</label><select className="form-select" value={form.document_id} onChange={(event) => setForm((current) => ({ ...current, document_id: event.target.value }))}><option value="">Aucun</option>{documentOptions.map((doc) => <option key={doc.id} value={doc.id}>{doc.title}</option>)}</select></div><div className="col-md-6"><label className="form-label">Date de validation</label><input type="date" className="form-control" value={form.validated_at} onChange={(event) => setForm((current) => ({ ...current, validated_at: event.target.value }))} /></div><div className="col-md-6"><label className="form-label">Date d'effet</label><input type="date" className="form-control" value={form.effective_at} onChange={(event) => setForm((current) => ({ ...current, effective_at: event.target.value }))} /></div><div className="col-12"><div className="form-check"><input id="is-current" className="form-check-input" type="checkbox" checked={form.is_current} onChange={(event) => setForm((current) => ({ ...current, is_current: event.target.checked }))} /><label className="form-check-label" htmlFor="is-current">Definir comme version courante</label></div></div></div></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)} disabled={saving}>Annuler</button><button className="btn btn-dark" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</> : "Enregistrer"}</button></div></form></div></div></div><div className="modal-backdrop fade show" onClick={() => !saving && setOpen(false)} /></> : null}{titleModal.open ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">{titleModal.editing ? "Modifier le titre" : "Ajouter un titre"}</h5><button type="button" className="btn-close" onClick={() => !titleSaving && setTitleModal({ open: false, editing: null })} /></div><form onSubmit={submitTitle}><div className="modal-body"><div className="row g-3"><div className="col-md-3"><label className="form-label">Numero</label><input className={`form-control ${titleErrors.number ? "is-invalid" : ""}`} value={titleForm.number} onChange={(event) => setTitleForm((current) => ({ ...current, number: event.target.value }))} />{titleErrors.number ? <span className="text-danger small">{titleErrors.number[0]}</span> : null}</div><div className="col-md-7"><label className="form-label">Intitule</label><input className={`form-control ${titleErrors.heading ? "is-invalid" : ""}`} value={titleForm.heading} onChange={(event) => setTitleForm((current) => ({ ...current, heading: event.target.value }))} /></div><div className="col-md-2"><label className="form-label">Ordre</label><input type="number" className="form-control" value={titleForm.sort_order} onChange={(event) => setTitleForm((current) => ({ ...current, sort_order: event.target.value }))} /></div></div></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setTitleModal({ open: false, editing: null })} disabled={titleSaving}>Annuler</button><button className="btn btn-dark" disabled={titleSaving}>{titleSaving ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</> : "Enregistrer"}</button></div></form></div></div></div><div className="modal-backdrop fade show" onClick={() => !titleSaving && setTitleModal({ open: false, editing: null })} /></> : null}{articleModal.open ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">{articleModal.editing ? "Modifier l'article" : "Ajouter un article"}</h5><button type="button" className="btn-close" onClick={() => !articleSaving && setArticleModal({ open: false, editing: null, title: null })} /></div><form onSubmit={submitArticle}><div className="modal-body"><div className="row g-3"><div className="col-md-3"><label className="form-label">Numero</label><input className={`form-control ${articleErrors.article_number ? "is-invalid" : ""}`} value={articleForm.article_number} onChange={(event) => setArticleForm((current) => ({ ...current, article_number: event.target.value }))} />{articleErrors.article_number ? <span className="text-danger small">{articleErrors.article_number[0]}</span> : null}</div><div className="col-md-7"><label className="form-label">Titre court</label><input className="form-control" value={articleForm.title} onChange={(event) => setArticleForm((current) => ({ ...current, title: event.target.value }))} /></div><div className="col-md-2"><label className="form-label">Ordre</label><input type="number" className="form-control" value={articleForm.sort_order} onChange={(event) => setArticleForm((current) => ({ ...current, sort_order: event.target.value }))} /></div><div className="col-12"><label className="form-label">Contenu</label><textarea className={`form-control ${articleErrors.content ? "is-invalid" : ""}`} rows={8} value={articleForm.content} onChange={(event) => setArticleForm((current) => ({ ...current, content: event.target.value }))} />{articleErrors.content ? <span className="text-danger small">{articleErrors.content[0]}</span> : null}</div></div></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setArticleModal({ open: false, editing: null, title: null })} disabled={articleSaving}>Annuler</button><button className="btn btn-dark" disabled={articleSaving}>{articleSaving ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</> : "Enregistrer"}</button></div></form></div></div></div><div className="modal-backdrop fade show" onClick={() => !articleSaving && setArticleModal({ open: false, editing: null, title: null })} /></> : null}{deleteOpen ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">Confirmation</h5><button type="button" className="btn-close" onClick={() => !deleting && setDeleteOpen(false)} /></div><div className="modal-body"><p className="mb-0">Supprimer le statut <b>{deleteTarget?.title || "#"}</b> ?</p></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</button><button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={deleting}>{deleting ? <><span className="spinner-border spinner-border-sm me-2" />Suppression...</> : "Supprimer"}</button></div></div></div></div><div className="modal-backdrop fade show" onClick={() => !deleting && setDeleteOpen(false)} /></> : null}{toast.open ? <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}><div className={`toast show text-bg-${toast.type} border-0`}><div className="d-flex"><div className="toast-body">{toast.message}</div><button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((current) => ({ ...current, open: false }))} /></div></div></div> : null}</div>;
}

