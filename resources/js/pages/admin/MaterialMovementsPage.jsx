import React, { useEffect, useMemo, useState } from "react";

import { materialMovementsApi } from "../../api/material-movement";
import { materialLoansApi } from "../../api/material-loan";
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
  material_id: "",
  material_loan_id: "",
  movement_type: "entry",
  quantity: 1,
  movement_date: "",
  source_location: "",
  destination_location: "",
  notes: "",
};

export default function MaterialMovementsPage() {
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loans, setLoans] = useState([]);
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
      [item?.material?.name, item?.movement_type, item?.source_location, item?.destination_location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, query]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load() {
    setLoading(true);
    try {
      const [movementsList, materialsList, loansList] = await Promise.all([
        materialMovementsApi.list(),
        materialsApi.list(),
        materialLoansApi.list(),
      ]);
      setItems(normalizeCollection(movementsList));
      setMaterials(normalizeCollection(materialsList));
      setLoans(normalizeCollection(loansList));
      setGlobalError("");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger les mouvements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm((current) => ({ ...current, movement_date: local }));
    void load();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  function resetForm() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditing(null);
    setErrors({});
    setForm({ ...defaultForm, movement_date: local });
  }

  function startEdit(item) {
    setEditing(item);
    setErrors({});
    setForm({
      material_id: item?.material_id ? String(item.material_id) : "",
      material_loan_id: item?.material_loan_id ? String(item.material_loan_id) : "",
      movement_type: item?.movement_type ?? "entry",
      quantity: item?.quantity ?? 1,
      movement_date: item?.movement_date ? String(item.movement_date).slice(0, 16) : "",
      source_location: item?.source_location ?? "",
      destination_location: item?.destination_location ?? "",
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
        material_loan_id: form.material_loan_id ? Number(form.material_loan_id) : null,
        movement_type: form.movement_type,
        quantity: Number(form.quantity),
        movement_date: form.movement_date || null,
        source_location: form.source_location.trim() || null,
        destination_location: form.destination_location.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editing) await materialMovementsApi.update(getRowId(editing), payload);
      else await materialMovementsApi.create(payload);

      resetForm();
      await load();
      setToast(editing ? "Mouvement mis a jour." : "Mouvement cree.");
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
      await materialMovementsApi.remove(getRowId(deleteTarget));
      setDeleteTarget(null);
      await load();
      setToast("Mouvement supprime.");
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
          <h4 className="mb-1">Material Movements</h4>
          <div className="text-muted small">Historique des mouvements de stock</div>
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
              {!loading && !filteredItems.length ? <div className="text-muted">Aucun mouvement.</div> : null}
              <div className="d-grid gap-3">
                {filteredItems.map((item) => (
                  <div key={getRowId(item)} className="border rounded-4 p-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                      <div>
                        <div className="fw-semibold">{item?.material?.name || "Material"}</div>
                        <div className="small text-muted">Type: {humanize(item?.movement_type)}</div>
                        <div className="small mt-2">Quantite: {item?.quantity || 0}</div>
                        <div className="small">Source: {item?.source_location || "-"} · Destination: {item?.destination_location || "-"}</div>
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
              <h5 className="mb-3">{editing ? "Modifier" : "Creer"} un mouvement</h5>
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
                  <label className="form-label">Pret lie</label>
                  <select className="form-select" value={form.material_loan_id} onChange={(e) => setForm((x) => ({ ...x, material_loan_id: e.target.value }))}>
                    <option value="">Aucun</option>
                    {loans.map((loan) => <option key={loan.id} value={loan.id}>{loan?.material?.name || "Material"} - {loan?.quantity || 0}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.movement_type} onChange={(e) => setForm((x) => ({ ...x, movement_type: e.target.value }))}>
                    <option value="entry">Entry</option>
                    <option value="exit">Exit</option>
                    <option value="loan">Loan</option>
                    <option value="return">Return</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="loss">Loss</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Quantite</label>
                  <input type="number" min="1" className="form-control" value={form.quantity} onChange={(e) => setForm((x) => ({ ...x, quantity: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Date mouvement</label>
                  <input type="datetime-local" className="form-control" value={form.movement_date} onChange={(e) => setForm((x) => ({ ...x, movement_date: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Source</label>
                  <input className="form-control" value={form.source_location} onChange={(e) => setForm((x) => ({ ...x, source_location: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Destination</label>
                  <input className="form-control" value={form.destination_location} onChange={(e) => setForm((x) => ({ ...x, destination_location: e.target.value }))} />
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
                <div className="modal-body">Supprimer ce mouvement ?</div>
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
