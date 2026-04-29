import React, { useEffect, useMemo, useState } from "react";

import { materialLoansApi } from "../../api/material-loan";
import { materialsApi } from "../../api/material";
import { membersApi } from "../../api/member";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function humanize(value) {
  return value ? String(value).replaceAll("_", " ") : "-";
}

function memberLabel(member) {
  const name = `${member?.first_name || ""} ${member?.last_name || ""}`.trim();
  return `${member?.member_number || "-"} - ${name || "Membre"}`;
}

const defaultForm = {
  material_id: "",
  member_id: "",
  member_search: "",
  quantity: 1,
  loaned_at: "",
  expected_return_at: "",
  status: "ongoing",
  notes: "",
};

export default function MaterialLoansPage() {
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState("");

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item?.material?.name, item?.member?.first_name, item?.member?.last_name, item?.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, query]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load() {
    setLoading(true);
    try {
      const [loansList, materialsList, membersList] = await Promise.all([
        materialLoansApi.list(),
        materialsApi.list(),
        membersApi.list(),
      ]);

      setItems(normalizeCollection(loansList));
      setMaterials(normalizeCollection(materialsList));
      setMembers(normalizeCollection(membersList));
      setGlobalError("");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger les prets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm((current) => ({ ...current, loaned_at: local }));
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
    setForm({ ...defaultForm, loaned_at: local });
  }

  function startEdit(item) {
    setEditing(item);
    setErrors({});
    setForm({
      material_id: item?.material_id ? String(item.material_id) : "",
      member_id: item?.member_id ? String(item.member_id) : "",
      member_search: item?.member ? memberLabel(item.member) : "",
      quantity: item?.quantity ?? 1,
      loaned_at: item?.loaned_at ? String(item.loaned_at).slice(0, 16) : "",
      expected_return_at: item?.expected_return_at ? String(item.expected_return_at).slice(0, 16) : "",
      status: item?.status ?? "ongoing",
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
        member_id: form.member_id ? Number(form.member_id) : null,
        quantity: Number(form.quantity),
        loaned_at: form.loaned_at || null,
        expected_return_at: form.expected_return_at || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (editing) await materialLoansApi.update(getRowId(editing), payload);
      else await materialLoansApi.create(payload);

      resetForm();
      await load();
      setToast(editing ? "Pret mis a jour." : "Pret cree.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmReturn() {
    if (!returnTarget) return;
    setReturning(true);
    try {
      await materialLoansApi.returnLoan(getRowId(returnTarget), {});
      setReturnTarget(null);
      await load();
      setToast("Pret retourne.");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Echec du retour.");
    } finally {
      setReturning(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await materialLoansApi.remove(getRowId(deleteTarget));
      setDeleteTarget(null);
      await load();
      setToast("Pret supprime.");
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
          <h4 className="mb-1">Material Loans</h4>
          <div className="text-muted small">Gestion des prets et retours</div>
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
              {!loading && !filteredItems.length ? <div className="text-muted">Aucun pret.</div> : null}
              <div className="d-grid gap-3">
                {filteredItems.map((item) => {
                  const canReturn = ["ongoing", "late", "lost"].includes(item?.status);
                  return (
                    <div key={getRowId(item)} className="border rounded-4 p-3">
                      <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                        <div>
                          <div className="fw-semibold">{item?.material?.name || "Material"}</div>
                          <div className="small text-muted">{item?.member ? memberLabel(item.member) : "Sans membre"}</div>
                          <div className="small mt-2">Quantite: {item?.quantity || 0}</div>
                          <div className="small">Statut: {humanize(item?.status)}</div>
                          <div className="small">Retour prevu: {item?.expected_return_at || "-"}</div>
                        </div>
                        <div className="d-flex gap-2 align-self-start flex-wrap justify-content-end">
                          <button className="btn btn-sm btn-outline-dark" onClick={() => startEdit(item)}>Modifier</button>
                          {canReturn ? <button className="btn btn-sm btn-outline-success" onClick={() => setReturnTarget(item)}>Retourner</button> : null}
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(item)}>Supprimer</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">{editing ? "Modifier" : "Creer"} un pret</h5>
              <form onSubmit={onSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">Material</label>
                  <select className="form-select" value={form.material_id} onChange={(e) => setForm((x) => ({ ...x, material_id: e.target.value }))}>
                    <option value="">Selectionner</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>{material.name} ({material.quantity_available}/{material.quantity_total})</option>
                    ))}
                  </select>
                  {errors.material_id ? <div className="text-danger small">{errors.material_id[0]}</div> : null}
                </div>
                <div className="col-12">
                  <label className="form-label">Membre</label>
                  <input
                    list="members-loans-list"
                    className="form-control"
                    value={form.member_search}
                    onChange={(e) => {
                      const value = e.target.value;
                      const selected = members.find((member) => memberLabel(member) === value);
                      setForm((current) => ({
                        ...current,
                        member_search: value,
                        member_id: selected ? String(selected.id) : "",
                      }));
                    }}
                    placeholder="Rechercher un membre"
                  />
                  <datalist id="members-loans-list">
                    {members.map((member) => <option key={member.id} value={memberLabel(member)} />)}
                  </datalist>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Quantite</label>
                  <input type="number" min="1" className="form-control" value={form.quantity} onChange={(e) => setForm((x) => ({ ...x, quantity: e.target.value }))} />
                  {errors.quantity ? <div className="text-danger small">{errors.quantity[0]}</div> : null}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Statut</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value }))}>
                    <option value="ongoing">Ongoing</option>
                    <option value="late">Late</option>
                    <option value="lost">Lost</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date pret</label>
                  <input type="datetime-local" className="form-control" value={form.loaned_at} onChange={(e) => setForm((x) => ({ ...x, loaned_at: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Retour prevu</label>
                  <input type="datetime-local" className="form-control" value={form.expected_return_at} onChange={(e) => setForm((x) => ({ ...x, expected_return_at: e.target.value }))} />
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

      {returnTarget ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmer le retour</h5>
                  <button type="button" className="btn-close" onClick={() => setReturnTarget(null)} />
                </div>
                <div className="modal-body">Marquer le pret de <b>{returnTarget?.material?.name || "material"}</b> comme retourne ?</div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setReturnTarget(null)}>Annuler</button>
                  <button type="button" className="btn btn-success" disabled={returning} onClick={() => void confirmReturn()}>{returning ? "Traitement..." : "Retourner"}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setReturnTarget(null)} />
        </>
      ) : null}

      {deleteTarget ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmation</h5>
                  <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
                </div>
                <div className="modal-body">Supprimer ce pret ?</div>
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

