import React, { useEffect, useMemo, useState } from "react";

import { suppliersApi } from "../../api/supplier";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

const defaultForm = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  notes: "",
  is_active: true,
};

export default function SuppliersPage() {
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
      [item?.name, item?.contact_name, item?.email, item?.phone, item?.city, item?.country]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, query]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load() {
    setLoading(true);
    try {
      const list = await suppliersApi.list();
      setItems(normalizeCollection(list));
      setGlobalError("");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger les fournisseurs.");
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
      contact_name: item?.contact_name ?? "",
      email: item?.email ?? "",
      phone: item?.phone ?? "",
      address: item?.address ?? "",
      city: item?.city ?? "",
      country: item?.country ?? "",
      notes: item?.notes ?? "",
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
        contact_name: form.contact_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        notes: form.notes.trim() || null,
        is_active: !!form.is_active,
      };

      if (editing) await suppliersApi.update(getRowId(editing), payload);
      else await suppliersApi.create(payload);

      resetForm();
      await load();
      setToast(editing ? "Fournisseur mis a jour." : "Fournisseur cree.");
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
      await suppliersApi.remove(getRowId(deleteTarget));
      setDeleteTarget(null);
      await load();
      setToast("Fournisseur supprime.");
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
          <h4 className="mb-1">Suppliers</h4>
          <div className="text-muted small">Gestion des fournisseurs</div>
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
              {!loading && !filteredItems.length ? <div className="text-muted">Aucun fournisseur.</div> : null}
              <div className="d-grid gap-3">
                {filteredItems.map((item) => (
                  <div key={getRowId(item)} className="border rounded-4 p-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                      <div>
                        <div className="fw-semibold">{item.name}</div>
                        <div className="small text-muted">{item.contact_name || "Sans contact"}</div>
                        <div className="small mt-2">{item.email || "-"} · {item.phone || "-"}</div>
                        <div className="small">{item.city || "-"} · {item.country || "-"}</div>
                        <div className="small">Statut: {item.is_active ? "Actif" : "Inactif"}</div>
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
              <h5 className="mb-3">{editing ? "Modifier" : "Creer"} un fournisseur</h5>
              <form onSubmit={onSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nom</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))} />
                  {errors.name ? <div className="text-danger small">{errors.name[0]}</div> : null}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Contact</label>
                  <input className="form-control" value={form.contact_name} onChange={(e) => setForm((x) => ({ ...x, contact_name: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={form.email} onChange={(e) => setForm((x) => ({ ...x, email: e.target.value }))} />
                  {errors.email ? <div className="text-danger small">{errors.email[0]}</div> : null}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Telephone</label>
                  <input className="form-control" value={form.phone} onChange={(e) => setForm((x) => ({ ...x, phone: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Ville</label>
                  <input className="form-control" value={form.city} onChange={(e) => setForm((x) => ({ ...x, city: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Pays</label>
                  <input className="form-control" value={form.country} onChange={(e) => setForm((x) => ({ ...x, country: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Adresse</label>
                  <textarea className="form-control" rows={2} value={form.address} onChange={(e) => setForm((x) => ({ ...x, address: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))} />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="supplier-active" checked={!!form.is_active} onChange={(e) => setForm((x) => ({ ...x, is_active: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="supplier-active">Fournisseur actif</label>
                  </div>
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
                <div className="modal-body">Supprimer le fournisseur <b>{deleteTarget.name}</b> ?</div>
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

