import React, { useEffect, useMemo, useState } from "react";

import { materialsApi } from "../../api/material";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function humanize(value) {
  return value ? String(value).replaceAll("_", " ") : "-";
}

const defaultForm = {
  name: "",
  reference: "",
  category: "",
  quantity_total: 1,
  quantity_available: 1,
  condition_status: "good",
  status: "available",
  storage_location: "",
  acquired_at: "",
  acquisition_cost: "",
  description: "",
  notes: "",
};

export default function MaterialsPage() {
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
      [item?.name, item?.reference, item?.category, item?.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, query]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load() {
    setLoading(true);
    try {
      const list = await materialsApi.list();
      setItems(normalizeCollection(list));
      setGlobalError("");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger les materials.");
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
    setForm(defaultForm);
    setErrors({});
  }

  function startEdit(item) {
    setEditing(item);
    setErrors({});
    setForm({
      name: item?.name ?? "",
      reference: item?.reference ?? "",
      category: item?.category ?? "",
      quantity_total: item?.quantity_total ?? 1,
      quantity_available: item?.quantity_available ?? 1,
      condition_status: item?.condition_status ?? "good",
      status: item?.status ?? "available",
      storage_location: item?.storage_location ?? "",
      acquired_at: item?.acquired_at ? String(item.acquired_at).slice(0, 10) : "",
      acquisition_cost: item?.acquisition_cost ?? "",
      description: item?.description ?? "",
      notes: item?.notes ?? "",
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        name: form.name.trim(),
        reference: form.reference.trim() || null,
        category: form.category.trim() || null,
        quantity_total: Number(form.quantity_total),
        quantity_available: Number(form.quantity_available),
        condition_status: form.condition_status,
        status: form.status,
        storage_location: form.storage_location.trim() || null,
        acquired_at: form.acquired_at || null,
        acquisition_cost: form.acquisition_cost === "" ? null : Number(form.acquisition_cost),
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editing) await materialsApi.update(getRowId(editing), payload);
      else await materialsApi.create(payload);

      resetForm();
      await load();
      setToast(editing ? "Material mis a jour." : "Material cree.");
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
      await materialsApi.remove(getRowId(deleteTarget));
      setDeleteTarget(null);
      await load();
      setToast("Material supprime.");
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
          <h4 className="mb-1">Materials</h4>
          <div className="text-muted small">Gestion du stock materiel</div>
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
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {loading ? <div className="text-muted">Chargement...</div> : null}
              {!loading && !filteredItems.length ? <div className="text-muted">Aucun material.</div> : null}
              <div className="d-grid gap-3">
                {filteredItems.map((item) => (
                  <div key={getRowId(item)} className="border rounded-4 p-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                      <div>
                        <div className="fw-semibold">{item.name}</div>
                        <div className="small text-muted">{item.reference || "Sans reference"} · {item.category || "Sans categorie"}</div>
                        <div className="small mt-2">Stock: {item.quantity_available} / {item.quantity_total}</div>
                        <div className="small">Etat: {humanize(item.condition_status)} · Statut: {humanize(item.status)}</div>
                        <div className="small">Emplacement: {item.storage_location || "-"}</div>
                      </div>
                      <div className="d-flex gap-2 align-self-start">
                        <button className="btn btn-sm btn-outline-dark" onClick={() => startEdit(item)}>Modifier</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(item)}>Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">{editing ? "Modifier" : "Creer"} un material</h5>
              <form onSubmit={onSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nom</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))} />
                  {errors.name ? <div className="text-danger small">{errors.name[0]}</div> : null}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Reference</label>
                  <input className="form-control" value={form.reference} onChange={(e) => setForm((x) => ({ ...x, reference: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Categorie</label>
                  <input className="form-control" value={form.category} onChange={(e) => setForm((x) => ({ ...x, category: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Emplacement</label>
                  <input className="form-control" value={form.storage_location} onChange={(e) => setForm((x) => ({ ...x, storage_location: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Quantite totale</label>
                  <input type="number" min="0" className="form-control" value={form.quantity_total} onChange={(e) => setForm((x) => ({ ...x, quantity_total: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Quantite disponible</label>
                  <input type="number" min="0" className="form-control" value={form.quantity_available} onChange={(e) => setForm((x) => ({ ...x, quantity_available: e.target.value }))} />
                  {errors.quantity_available ? <div className="text-danger small">{errors.quantity_available[0]}</div> : null}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Etat</label>
                  <select className="form-select" value={form.condition_status} onChange={(e) => setForm((x) => ({ ...x, condition_status: e.target.value }))}>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                    <option value="out_of_service">Out of service</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Statut</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value }))}>
                    <option value="available">Available</option>
                    <option value="in_use">In use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="lost">Lost</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date acquisition</label>
                  <input type="date" className="form-control" value={form.acquired_at} onChange={(e) => setForm((x) => ({ ...x, acquired_at: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Cout acquisition</label>
                  <input type="number" step="0.01" min="0" className="form-control" value={form.acquisition_cost} onChange={(e) => setForm((x) => ({ ...x, acquisition_cost: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))} />
                </div>
                <div className="col-12 d-flex gap-2 justify-content-end">
                  {editing ? <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Annuler</button> : null}
                  <button className="btn btn-warning" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {deleteTarget ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmation</h5>
                  <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
                </div>
                <div className="modal-body">Supprimer le material <b>{deleteTarget.name}</b> ?</div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)}>Annuler</button>
                  <button type="button" className="btn btn-danger" disabled={deleting} onClick={() => void confirmDelete()}>{deleting ? "Suppression..." : "Supprimer"}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setDeleteTarget(null)} />
        </>
      ) : null}
    </div>
  );
}

