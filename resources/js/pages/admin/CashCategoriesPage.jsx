import React, { useEffect, useMemo, useState } from "react";

import { cashCategoriesApi } from "../../api/cash-category";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

const defaultForm = {
  name: "",
  code: "",
  type: "both",
  description: "",
  is_active: true,
};

export default function CashCategoriesPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState("");

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item?.name, item?.code, item?.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, query]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load() {
    setLoading(true);
    try {
      const list = await cashCategoriesApi.list();
      setItems(normalizeCollection(list));
      setGlobalError("");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger les categories caisse.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  function resetForm() {
    setEditing(null);
    setErrors({});
    setForm(defaultForm);
  }

  function startEdit(item) {
    setEditing(item);
    setErrors({});
    setForm({
      name: item?.name ?? "",
      code: item?.code ?? "",
      type: item?.type ?? "both",
      description: item?.description ?? "",
      is_active: !!item?.is_active,
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        type: form.type,
        description: form.description.trim() || null,
        is_active: !!form.is_active,
      };

      if (editing) await cashCategoriesApi.update(getRowId(editing), payload);
      else await cashCategoriesApi.create(payload);

      resetForm();
      await load();
      setToast(editing ? "Categorie caisse mise a jour." : "Categorie caisse creee.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cashCategoriesApi.remove(getRowId(deleteTarget));
      setDeleteTarget(null);
      await load();
      setToast("Categorie caisse supprimee.");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Echec de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1">Cash Categories</h4>
          <div className="text-muted small">Categories de recettes et depenses</div>
        </div>
        <div className="d-flex gap-2">
          <input className="form-control" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn btn-outline-secondary" onClick={() => void load()} disabled={loading}>Rafraichir</button>
          <button className="btn btn-dark" onClick={resetForm}>Nouveau</button>
        </div>
      </div>

      {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
      {toast ? <div className="alert alert-success py-2">{toast}</div> : null}

      <div className="row g-4">
        <div className="col-xl-7">
          <div className="card border-0 shadow-sm"><div className="card-body">
            {loading ? <div className="text-muted">Chargement...</div> : null}
            {!loading && !filteredItems.length ? <div className="text-muted">Aucune categorie.</div> : null}
            <div className="d-grid gap-3">
              {filteredItems.map((item) => (
                <div key={getRowId(item)} className="border rounded-4 p-3 d-flex justify-content-between gap-3">
                  <div>
                    <div className="fw-semibold">{item.name}</div>
                    <div className="small text-muted">{item.code || "Sans code"} · {item.type || "-"}</div>
                    <div className="small">{item.is_active ? "Active" : "Inactive"}</div>
                  </div>
                  <div className="d-flex gap-2 align-self-start">
                    <button className="btn btn-sm btn-outline-dark" onClick={() => startEdit(item)}>Modifier</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(item)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div></div>
        </div>
        <div className="col-xl-5">
          <div className="card border-0 shadow-sm"><div className="card-body">
            <h5 className="mb-3">{editing ? "Modifier" : "Creer"} une categorie</h5>
            <form onSubmit={onSubmit} className="row g-3">
              <div className="col-md-6"><label className="form-label">Nom</label><input className="form-control" value={form.name} onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))} />{errors.name ? <div className="text-danger small">{errors.name[0]}</div> : null}</div>
              <div className="col-md-6"><label className="form-label">Code</label><input className="form-control" value={form.code} onChange={(e) => setForm((x) => ({ ...x, code: e.target.value }))} />{errors.code ? <div className="text-danger small">{errors.code[0]}</div> : null}</div>
              <div className="col-12"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={(e) => setForm((x) => ({ ...x, type: e.target.value }))}><option value="income">Income</option><option value="expense">Expense</option><option value="both">Both</option></select></div>
              <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} /></div>
              <div className="col-12"><div className="form-check"><input className="form-check-input" type="checkbox" id="cash-category-active" checked={!!form.is_active} onChange={(e) => setForm((x) => ({ ...x, is_active: e.target.checked }))} /><label className="form-check-label" htmlFor="cash-category-active">Categorie active</label></div></div>
              <div className="col-12 d-flex gap-2 justify-content-end">{editing ? <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Annuler</button> : null}<button className="btn btn-warning" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button></div>
            </form>
          </div></div>
        </div>
      </div>

      {deleteTarget ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">Confirmation</h5><button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} /></div><div className="modal-body">Supprimer cette categorie ?</div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)}>Annuler</button><button type="button" className="btn btn-danger" disabled={deleting} onClick={() => void confirmDelete()}>{deleting ? "Suppression..." : "Supprimer"}</button></div></div></div></div><div className="modal-backdrop fade show" onClick={() => setDeleteTarget(null)} /></> : null}
    </div>
  );
}
