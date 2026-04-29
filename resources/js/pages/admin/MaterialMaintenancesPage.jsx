import React, { useEffect, useMemo, useState } from "react";

import { materialMaintenancesApi } from "../../api/material-maintenance";
import { materialsApi } from "../../api/material";
import { suppliersApi } from "../../api/supplier";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

const defaultForm = {
  material_id: "",
  supplier_id: "",
  title: "",
  description: "",
  cost: "",
  maintenance_date: "",
  status: "planned",
  notes: "",
};

export default function MaterialMaintenancesPage() {
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
      [item?.title, item?.material?.name, item?.supplier?.name, item?.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, query]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load() {
    setLoading(true);
    try {
      const [maintenancesList, materialsList, suppliersList] = await Promise.all([
        materialMaintenancesApi.list(),
        materialsApi.list(),
        suppliersApi.list(),
      ]);
      setItems(normalizeCollection(maintenancesList));
      setMaterials(normalizeCollection(materialsList));
      setSuppliers(normalizeCollection(suppliersList));
      setGlobalError("");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger les maintenances.");
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
      material_id: item?.material_id ? String(item.material_id) : "",
      supplier_id: item?.supplier_id ? String(item.supplier_id) : "",
      title: item?.title ?? "",
      description: item?.description ?? "",
      cost: item?.cost ?? "",
      maintenance_date: item?.maintenance_date ? String(item.maintenance_date).slice(0, 10) : "",
      status: item?.status ?? "planned",
      notes: item?.notes ?? "",
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        material_id: Number(form.material_id),
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        cost: form.cost === "" ? null : Number(form.cost),
        maintenance_date: form.maintenance_date || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (editing) await materialMaintenancesApi.update(getRowId(editing), payload);
      else await materialMaintenancesApi.create(payload);

      resetForm();
      await load();
      setToast(editing ? "Maintenance mise a jour." : "Maintenance creee.");
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
      await materialMaintenancesApi.remove(getRowId(deleteTarget));
      setDeleteTarget(null);
      await load();
      setToast("Maintenance supprimee.");
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
          <h4 className="mb-1">Material Maintenances</h4>
          <div className="text-muted small">Suivi des maintenances</div>
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
              {!loading && !filteredItems.length ? <div className="text-muted">Aucune maintenance.</div> : null}
              <div className="d-grid gap-3">
                {filteredItems.map((item) => (
                  <div key={getRowId(item)} className="border rounded-4 p-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                      <div>
                        <div className="fw-semibold">{item?.title || "Maintenance"}</div>
                        <div className="small text-muted">{item?.material?.name || "-"} · {item?.supplier?.name || "Sans fournisseur"}</div>
                        <div className="small mt-2">Date: {item?.maintenance_date || "-"}</div>
                        <div className="small">Statut: {item?.status || "-"} · Cout: {item?.cost || "-"}</div>
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
              <h5 className="mb-3">{editing ? "Modifier" : "Creer"} une maintenance</h5>
              <form onSubmit={onSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">Material</label>
                  <select className="form-select" value={form.material_id} onChange={(e) => setForm((x) => ({ ...x, material_id: e.target.value }))}>
                    <option value="">Selectionner</option>
                    {materials.map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
                  </select>
                  {errors.material_id ? <div className="text-danger small">{errors.material_id[0]}</div> : null}
                </div>
                <div className="col-12">
                  <label className="form-label">Fournisseur</label>
                  <select className="form-select" value={form.supplier_id} onChange={(e) => setForm((x) => ({ ...x, supplier_id: e.target.value }))}>
                    <option value="">Aucun</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Titre</label>
                  <input className="form-control" value={form.title} onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))} />
                  {errors.title ? <div className="text-danger small">{errors.title[0]}</div> : null}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={form.maintenance_date} onChange={(e) => setForm((x) => ({ ...x, maintenance_date: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Cout</label>
                  <input type="number" step="0.01" min="0" className="form-control" value={form.cost} onChange={(e) => setForm((x) => ({ ...x, cost: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Statut</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value }))}>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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
                <div className="modal-body">Supprimer cette maintenance ?</div>
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
