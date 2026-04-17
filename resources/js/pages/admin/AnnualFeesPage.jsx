import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { annualFeesApi } from "../../api/annual-fee";

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

export default function AnnualFeesPage() {
  const DT_LANG_URL = useMemo(() => "/lang/datatables/fr.json", []);
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [globalError, setGlobalError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ year: "", amount: "", due_date: "", description: "", is_active: true });
  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const itemsRef = useRef(items);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
  }, []);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast((x) => ({ ...x, open: false })), 3500);
  }

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const list = await annualFeesApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les cotisations annuelles.";
      if (mode === "initial") setGlobalError(message);
      else showToast("danger", message);
    } finally {
      if (mode === "initial") setInitialLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load({ mode: "initial" });
  }, []);

  useEffect(() => {
    if (initialLoading || !tableRef.current) return;
    const $table = $(tableRef.current);

    if (dtRef.current) {
      try {
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}
      dtRef.current.destroy();
      dtRef.current = null;
      $table.find("tbody").empty();
    }

    dtRef.current = $table.DataTable({
      data: [],
      pageLength: 10,
      lengthMenu: [10, 15, 25, 50, 100],
      ordering: true,
      searching: true,
      responsive: true,
      language: { url: DT_LANG_URL },
      columns: [
        { data: "year", defaultContent: "" },
        { data: "amount", defaultContent: "" },
        { data: "due_date", defaultContent: "", render: (v) => formatDate(v) },
        { data: "is_active", render: (v) => v ? `<span class="badge text-bg-success">Active</span>` : `<span class="badge text-bg-secondary">Inactive</span>` },
        { data: "description", defaultContent: "", render: (v) => v || `<span class="text-muted small">-</span>` },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 160,
          render: (d, t2, row) => {
            const id = getRowId(row);
            return `<button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-sm btn-outline-danger js-del" data-id="${id}"><i class="bi bi-trash3"></i></button>`;
          },
        },
      ],
    });

    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;
      setEditing(item);
      setForm({
        year: item?.year ?? "",
        amount: item?.amount ?? "",
        due_date: item?.due_date ? String(item.due_date).slice(0, 10) : "",
        description: item?.description ?? "",
        is_active: !!item?.is_active,
      });
      setErrors({});
      setGlobalError("");
      setOpen(true);
    });

    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (item) {
        setDeleteTarget(item);
        setDeleteOpen(true);
      }
    });

    return () => {
      try {
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}
      dtRef.current?.destroy();
      dtRef.current = null;
    };
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

  async function onSubmit(event) {
    event.preventDefault();
    setErrors({});
    setGlobalError("");
    setSaving(true);
    try {
      const payload = {
        year: Number(form.year),
        amount: Number(form.amount),
        due_date: form.due_date || null,
        description: form.description.trim() || null,
        is_active: form.is_active,
      };
      if (editing) await annualFeesApi.update(getRowId(editing), payload);
      else await annualFeesApi.create(payload);
      await load({ mode: "refresh" });
      setOpen(false);
      setEditing(null);
      showToast("success", editing ? "Cotisation annuelle mise a jour." : "Cotisation annuelle creee.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await annualFeesApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", "Cotisation annuelle supprimee.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Cotisations annuelles</h4>
          <div className="text-muted small">Gestion du montant annuel de reference</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>
            {initialLoading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />Rafraichissement...</> : <><i className="bi bi-arrow-clockwise me-2" />Rafraichir</>}
          </button>
          <button className="btn btn-dark" onClick={() => {
            setEditing(null);
            setForm({ year: "", amount: "", due_date: "", description: "", is_active: true });
            setErrors({});
            setGlobalError("");
            setOpen(true);
          }} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />Nouvelle cotisation
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? <div className="d-flex align-items-center gap-2 text-muted mb-3"><div className="spinner-border spinner-border-sm" />Chargement...</div> : null}
          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>Année</th>
                  <th>Montant</th>
                  <th>Date limite</th>
                  <th>Statut</th>
                  <th>Description</th>
                  <th className="text-end" style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

      {open ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? "Modifier" : "Créer"}</h5>
                  <button type="button" className="btn-close" onClick={() => !saving && setOpen(false)} />
                </div>
                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Année</label>
                      <input className={`form-control ${errors.year ? "is-invalid" : ""}`} value={form.year} onChange={(e) => setForm((x) => ({ ...x, year: e.target.value }))} />
                      {errors.year ? <span className="text-danger small">{errors.year[0]}</span> : null}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Montant</label>
                      <input type="number" step="0.01" className={`form-control ${errors.amount ? "is-invalid" : ""}`} value={form.amount} onChange={(e) => setForm((x) => ({ ...x, amount: e.target.value }))} />
                      {errors.amount ? <span className="text-danger small">{errors.amount[0]}</span> : null}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date limite</label>
                      <input type="date" className={`form-control ${errors.due_date ? "is-invalid" : ""}`} value={form.due_date} onChange={(e) => setForm((x) => ({ ...x, due_date: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} />
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="annual-fee-active" checked={!!form.is_active} onChange={(e) => setForm((x) => ({ ...x, is_active: e.target.checked }))} />
                      <label className="form-check-label" htmlFor="annual-fee-active">Actif</label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => !saving && setOpen(false)}>Annuler</button>
                    <button className="btn btn-warning" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => !saving && setOpen(false)} />
        </>
      ) : null}

      {deleteOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmation</h5>
                  <button type="button" className="btn-close" onClick={() => !deleting && setDeleteOpen(false)} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">Supprimer la cotisation annuelle <b>{deleteTarget?.year}</b> ?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => !deleting && setDeleteOpen(false)}>Annuler</button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? "Suppression..." : "Supprimer"}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => !deleting && setDeleteOpen(false)} />
        </>
      ) : null}

      {toast.open ? (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show text-bg-${toast.type} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((x) => ({ ...x, open: false }))} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
