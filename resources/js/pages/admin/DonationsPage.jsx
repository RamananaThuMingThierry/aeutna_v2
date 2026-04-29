import React, { useEffect, useMemo, useState } from "react";

import { donationsApi } from "../../api/donation";
import { membersApi } from "../../api/member";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function memberLabel(member) {
  const name = `${member?.first_name || ""} ${member?.last_name || ""}`.trim();
  return `${member?.member_number || "-"} - ${name || "Membre"}`;
}

const defaultForm = {
  member_id: "",
  member_search: "",
  donor_name: "",
  donor_email: "",
  donor_phone: "",
  donation_type: "money",
  amount: "",
  donation_date: "",
  reference: "",
  description: "",
  is_anonymous: false,
};

export default function DonationsPage() {
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
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
      [item?.donor_name, item?.donor_email, item?.donation_type, item?.reference]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, query]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load() {
    setLoading(true);
    try {
      const [donationsList, membersList] = await Promise.all([
        donationsApi.list(),
        membersApi.list(),
      ]);
      setItems(normalizeCollection(donationsList));
      setMembers(normalizeCollection(membersList));
      setGlobalError("");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger les donations.");
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
      member_id: item?.member_id ? String(item.member_id) : "",
      member_search: item?.member ? memberLabel(item.member) : "",
      donor_name: item?.donor_name ?? "",
      donor_email: item?.donor_email ?? "",
      donor_phone: item?.donor_phone ?? "",
      donation_type: item?.donation_type ?? "money",
      amount: item?.amount ?? "",
      donation_date: item?.donation_date ? String(item.donation_date).slice(0, 10) : "",
      reference: item?.reference ?? "",
      description: item?.description ?? "",
      is_anonymous: !!item?.is_anonymous,
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        member_id: form.member_id ? Number(form.member_id) : null,
        donor_name: form.donor_name.trim(),
        donor_email: form.donor_email.trim() || null,
        donor_phone: form.donor_phone.trim() || null,
        donation_type: form.donation_type,
        amount: form.amount === "" ? null : Number(form.amount),
        donation_date: form.donation_date || null,
        reference: form.reference.trim() || null,
        description: form.description.trim() || null,
        is_anonymous: !!form.is_anonymous,
      };

      if (editing) await donationsApi.update(getRowId(editing), payload);
      else await donationsApi.create(payload);

      resetForm();
      await load();
      setToast(editing ? "Donation mise a jour." : "Donation creee.");
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
      await donationsApi.remove(getRowId(deleteTarget));
      setDeleteTarget(null);
      await load();
      setToast("Donation supprimee.");
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
          <h4 className="mb-1">Donations</h4>
          <div className="text-muted small">Gestion des dons financiers, materiels et services</div>
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
              {!loading && !filteredItems.length ? <div className="text-muted">Aucune donation.</div> : null}
              <div className="d-grid gap-3">
                {filteredItems.map((item) => (
                  <div key={getRowId(item)} className="border rounded-4 p-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                      <div>
                        <div className="fw-semibold">{item?.is_anonymous ? "Don anonyme" : item?.donor_name}</div>
                        <div className="small text-muted">{item?.donation_type || "-"} · {item?.amount || "-"}</div>
                        <div className="small mt-2">Date: {item?.donation_date || "-"}</div>
                        <div className="small">Reference: {item?.reference || "-"}</div>
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
              <h5 className="mb-3">{editing ? "Modifier" : "Creer"} une donation</h5>
              <form onSubmit={onSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">Membre</label>
                  <input
                    list="members-donations-list"
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
                    placeholder="Associer un membre si besoin"
                  />
                  <datalist id="members-donations-list">
                    {members.map((member) => <option key={member.id} value={memberLabel(member)} />)}
                  </datalist>
                </div>
                <div className="col-12">
                  <label className="form-label">Nom du donateur</label>
                  <input className="form-control" value={form.donor_name} onChange={(e) => setForm((x) => ({ ...x, donor_name: e.target.value }))} />
                  {errors.donor_name ? <div className="text-danger small">{errors.donor_name[0]}</div> : null}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={form.donor_email} onChange={(e) => setForm((x) => ({ ...x, donor_email: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Telephone</label>
                  <input className="form-control" value={form.donor_phone} onChange={(e) => setForm((x) => ({ ...x, donor_phone: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.donation_type} onChange={(e) => setForm((x) => ({ ...x, donation_type: e.target.value }))}>
                    <option value="money">Money</option>
                    <option value="material">Material</option>
                    <option value="service">Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Montant</label>
                  <input type="number" step="0.01" min="0" className="form-control" value={form.amount} onChange={(e) => setForm((x) => ({ ...x, amount: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={form.donation_date} onChange={(e) => setForm((x) => ({ ...x, donation_date: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Reference</label>
                  <input className="form-control" value={form.reference} onChange={(e) => setForm((x) => ({ ...x, reference: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="donation-anonymous" checked={!!form.is_anonymous} onChange={(e) => setForm((x) => ({ ...x, is_anonymous: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="donation-anonymous">Don anonyme</label>
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
                <div className="modal-body">Supprimer cette donation ?</div>
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
