import React, { useEffect, useMemo, useState } from "react";

import { activitiesApi } from "../../api/activity";
import { cashCategoriesApi } from "../../api/cash-category";
import { cashTransactionsApi } from "../../api/cash-transaction";
import { feePaymentsApi } from "../../api/fee-payment";
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
  transaction_type: "income",
  source_type: "manual",
  activity_id: "",
  member_id: "",
  member_search: "",
  fee_payment_id: "",
  label: "",
  category: "",
  amount: "",
  transaction_date: "",
  payment_method: "",
  reference: "",
  description: "",
};

export default function CashTransactionsPage() {
  const [items, setItems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
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
      [item?.label, item?.category, item?.transaction_type, item?.reference]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [items, query]);

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load() {
    setLoading(true);
    try {
      const [transactionsList, activitiesList, categoriesList, feePaymentsList, membersList] = await Promise.all([
        cashTransactionsApi.list(),
        activitiesApi.list(),
        cashCategoriesApi.list(),
        feePaymentsApi.list(),
        membersApi.list(),
      ]);
      setItems(normalizeCollection(transactionsList));
      setActivities(normalizeCollection(activitiesList));
      setCategories(normalizeCollection(categoriesList));
      setFeePayments(normalizeCollection(feePaymentsList));
      setMembers(normalizeCollection(membersList));
      setGlobalError("");
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Impossible de charger les transactions caisse.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setForm((current) => ({ ...current, transaction_date: new Date().toISOString().slice(0, 10) }));
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
    setForm({ ...defaultForm, transaction_date: new Date().toISOString().slice(0, 10) });
  }

  function startEdit(item) {
    setEditing(item);
    setErrors({});
    setForm({
      transaction_type: item?.transaction_type ?? "income",
      source_type: item?.source_type ?? "manual",
      activity_id: item?.activity_id ? String(item.activity_id) : "",
      member_id: item?.member_id ? String(item.member_id) : "",
      member_search: item?.member ? memberLabel(item.member) : "",
      fee_payment_id: item?.fee_payment_id ? String(item.fee_payment_id) : "",
      label: item?.label ?? "",
      category: item?.category ?? "",
      amount: item?.amount ?? "",
      transaction_date: item?.transaction_date ? String(item.transaction_date).slice(0, 10) : "",
      payment_method: item?.payment_method ?? "",
      reference: item?.reference ?? "",
      description: item?.description ?? "",
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        transaction_type: form.transaction_type,
        source_type: form.source_type,
        activity_id: form.activity_id ? Number(form.activity_id) : null,
        member_id: form.member_id ? Number(form.member_id) : null,
        fee_payment_id: form.fee_payment_id ? Number(form.fee_payment_id) : null,
        label: form.label.trim(),
        category: form.category.trim() || null,
        amount: Number(form.amount),
        transaction_date: form.transaction_date || null,
        payment_method: form.payment_method.trim() || null,
        reference: form.reference.trim() || null,
        description: form.description.trim() || null,
      };

      if (editing) await cashTransactionsApi.update(getRowId(editing), payload);
      else await cashTransactionsApi.create(payload);

      resetForm();
      await load();
      setToast(editing ? "Transaction caisse mise a jour." : "Transaction caisse creee.");
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
      await cashTransactionsApi.remove(getRowId(deleteTarget));
      setDeleteTarget(null);
      await load();
      setToast("Transaction caisse supprimee.");
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
          <h4 className="mb-1">Cash Transactions</h4>
          <div className="text-muted small">Recettes et depenses manuelles et liees</div>
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
        <div className="col-xl-7"><div className="card border-0 shadow-sm"><div className="card-body">
          {loading ? <div className="text-muted">Chargement...</div> : null}
          {!loading && !filteredItems.length ? <div className="text-muted">Aucune transaction.</div> : null}
          <div className="d-grid gap-3">
            {filteredItems.map((item) => (
              <div key={getRowId(item)} className="border rounded-4 p-3 d-flex justify-content-between gap-3">
                <div>
                  <div className="fw-semibold">{item?.label || "Transaction"}</div>
                  <div className="small text-muted">{item?.transaction_type || "-"} · {item?.amount || "-"}</div>
                  <div className="small mt-2">Categorie: {item?.category || "-"}</div>
                  <div className="small">Source: {item?.source_type || "-"} · Date: {item?.transaction_date || "-"}</div>
                </div>
                <div className="d-flex gap-2 align-self-start">
                  <button className="btn btn-sm btn-outline-dark" onClick={() => startEdit(item)}>Modifier</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(item)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div></div></div>

        <div className="col-xl-5"><div className="card border-0 shadow-sm"><div className="card-body">
          <h5 className="mb-3">{editing ? "Modifier" : "Creer"} une transaction</h5>
          <form onSubmit={onSubmit} className="row g-3">
            <div className="col-md-6"><label className="form-label">Type</label><select className="form-select" value={form.transaction_type} onChange={(e) => setForm((x) => ({ ...x, transaction_type: e.target.value }))}><option value="income">Income</option><option value="expense">Expense</option></select></div>
            <div className="col-md-6"><label className="form-label">Source</label><select className="form-select" value={form.source_type} onChange={(e) => setForm((x) => ({ ...x, source_type: e.target.value }))}><option value="manual">Manual</option><option value="activity">Activity</option><option value="donation">Donation</option><option value="fee_payment">Fee payment</option><option value="other">Other</option></select></div>
            <div className="col-12"><label className="form-label">Libelle</label><input className="form-control" value={form.label} onChange={(e) => setForm((x) => ({ ...x, label: e.target.value }))} />{errors.label ? <div className="text-danger small">{errors.label[0]}</div> : null}</div>
            <div className="col-12"><label className="form-label">Categorie</label><input list="cash-categories-list" className="form-control" value={form.category} onChange={(e) => setForm((x) => ({ ...x, category: e.target.value }))} placeholder="Selectionner ou saisir une categorie" /><datalist id="cash-categories-list">{categories.map((category) => <option key={category.id} value={category.name} />)}</datalist></div>
            <div className="col-md-6"><label className="form-label">Montant</label><input type="number" step="0.01" min="0" className="form-control" value={form.amount} onChange={(e) => setForm((x) => ({ ...x, amount: e.target.value }))} /></div>
            <div className="col-md-6"><label className="form-label">Date</label><input type="date" className="form-control" value={form.transaction_date} onChange={(e) => setForm((x) => ({ ...x, transaction_date: e.target.value }))} /></div>
            <div className="col-12"><label className="form-label">Membre</label><input list="members-cash-list" className="form-control" value={form.member_search} onChange={(e) => { const value = e.target.value; const selected = members.find((member) => memberLabel(member) === value); setForm((current) => ({ ...current, member_search: value, member_id: selected ? String(selected.id) : "" })); }} placeholder="Associer un membre si besoin" /><datalist id="members-cash-list">{members.map((member) => <option key={member.id} value={memberLabel(member)} />)}</datalist></div>
            <div className="col-12"><label className="form-label">Activite</label><select className="form-select" value={form.activity_id} onChange={(e) => setForm((x) => ({ ...x, activity_id: e.target.value }))}><option value="">Aucune</option>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</select></div>
            <div className="col-12"><label className="form-label">Cotisation liee</label><select className="form-select" value={form.fee_payment_id} onChange={(e) => setForm((x) => ({ ...x, fee_payment_id: e.target.value }))}><option value="">Aucune</option>{feePayments.map((payment) => <option key={payment.id} value={payment.id}>{payment?.member ? memberLabel(payment.member) : 'Cotisation'} - {payment?.annual_fee?.year || '-'}</option>)}</select></div>
            <div className="col-md-6"><label className="form-label">Methode</label><input className="form-control" value={form.payment_method} onChange={(e) => setForm((x) => ({ ...x, payment_method: e.target.value }))} /></div>
            <div className="col-md-6"><label className="form-label">Reference</label><input className="form-control" value={form.reference} onChange={(e) => setForm((x) => ({ ...x, reference: e.target.value }))} /></div>
            <div className="col-12"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} /></div>
            <div className="col-12 d-flex gap-2 justify-content-end">{editing ? <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Annuler</button> : null}<button className="btn btn-warning" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button></div>
          </form>
        </div></div></div>
      </div>

      {deleteTarget ? <><div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true"><div className="modal-dialog modal-dialog-centered"><div className="modal-content border-0 shadow"><div className="modal-header"><h5 className="modal-title">Confirmation</h5><button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} /></div><div className="modal-body">Supprimer cette transaction ?</div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)}>Annuler</button><button type="button" className="btn btn-danger" disabled={deleting} onClick={() => void confirmDelete()}>{deleting ? "Suppression..." : "Supprimer"}</button></div></div></div></div><div className="modal-backdrop fade show" onClick={() => setDeleteTarget(null)} /></> : null}
    </div>
  );
}
