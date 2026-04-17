import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { annualFeesApi } from "../../api/annual-fee";
import { feePaymentsApi } from "../../api/fee-payment";
import { membersApi } from "../../api/member";

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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function paymentStatusBadge(status) {
  const map = {
    unpaid: "secondary",
    partial: "warning",
    paid: "success",
    cancelled: "danger",
  };
  return map[status] || "secondary";
}

function validationStatusBadge(status) {
  const map = {
    pending: "info",
    validated: "success",
    cancelled: "danger",
  };
  return map[status] || "secondary";
}

const PAYMENT_METHOD_OPTIONS = [
  "Orange Money",
  "Mvola",
  "Airtel Money",
  "Espece",
  "Autres",
];

function memberOptionLabel(member) {
  const fullName = `${member?.first_name || ""} ${member?.last_name || ""}`.trim();
  return `${member?.member_number || "-"} - ${fullName || "Membre"}`;
}

function memberPhotoUrl(photo) {
  if (!photo) return "/images/avatar.png";
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `/${photo.replace(/^\/+/, "")}`;
}

export default function FeePaymentsPage() {
  const DT_LANG_URL = useMemo(() => "/lang/datatables/fr.json", []);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [annualFees, setAnnualFees] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [globalError, setGlobalError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    member_id: "",
    member_search: "",
    annual_fee_id: "",
    amount_due: "",
    amount_paid: "",
    payment_method: "",
    payment_method_other: "",
    reference: "",
    paid_at: todayIsoDate(),
    notes: "",
  });
  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const itemsRef = useRef(items);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  function showToast(type, message) {
    setToast({ open: true, type, message });
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3500);
  }

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  function resetForm() {
    setEditing(null);
    setForm({
      member_id: "",
      member_search: "",
      annual_fee_id: "",
      amount_due: "",
      amount_paid: "",
      payment_method: "",
      payment_method_other: "",
      reference: "",
      paid_at: todayIsoDate(),
      notes: "",
    });
    setErrors({});
    setGlobalError("");
  }

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const [paymentsList, membersList, annualFeesList] = await Promise.all([
        feePaymentsApi.list(),
        membersApi.list(),
        annualFeesApi.list(),
      ]);

      setItems(normalizeCollection(paymentsList));
      setMembers(normalizeCollection(membersList));
      setAnnualFees(normalizeCollection(annualFeesList));
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les cotisations.";
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
        $table.off("click", ".js-detail");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-validate");
        $table.off("click", ".js-cancel");
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
        {
          data: null,
          render: (d, t, row) => `${row?.member?.first_name || ""} ${row?.member?.last_name || ""}`.trim() || "-",
        },
        { data: null, render: (d, t, row) => row?.annual_fee?.year || "-" },
        { data: "amount_due", defaultContent: "" },
        { data: "amount_paid", defaultContent: "" },
        { data: "paid_at", defaultContent: "", render: (v) => formatDate(v) },
        {
          data: "payment_status",
          render: (v) => `<span class="badge text-bg-${paymentStatusBadge(v)}">${v || "-"}</span>`,
        },
        {
          data: "validation_status",
          render: (v) => `<span class="badge text-bg-${validationStatusBadge(v)}">${v || "-"}</span>`,
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 220,
          render: (d, t, row) => {
            const id = getRowId(row);
            const canEdit = row?.validation_status !== "validated" && row?.validation_status !== "cancelled";
            const canValidate = row?.payment_status === "paid" && row?.validation_status === "pending";
            const canCancel = row?.validation_status === "pending";
            return `
              <button class="btn btn-sm btn-outline-primary me-2 js-detail" data-id="${id}">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}" ${canEdit ? "" : "style=\"display:none\""}>
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-outline-success me-2 js-validate" data-id="${id}" ${canValidate ? "" : "style=\"display:none\""}>
                <i class="bi bi-check2-circle"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger js-cancel" data-id="${id}" ${canCancel ? "" : "style=\"display:none\""}>
                <i class="bi bi-x-circle"></i>
              </button>
            `;
          },
        },
      ],
    });

    $table.on("click", ".js-detail", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((current) => String(getRowId(current)) === String(id));
      if (!item) return;
      setDetailTarget(item);
      setDetailOpen(true);
    });

    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((current) => String(getRowId(current)) === String(id));
      if (!item) return;
      if (item?.validation_status === "validated" || item?.validation_status === "cancelled") return;

      const paymentMethod = item?.payment_method ?? "";
      const knownPaymentMethod =
        PAYMENT_METHOD_OPTIONS.includes(paymentMethod) && paymentMethod !== "Autres";

      setEditing(item);
      setForm({
        member_id: item?.member_id ? String(item.member_id) : "",
        member_search: memberOptionLabel(item?.member),
        annual_fee_id: item?.annual_fee_id ? String(item.annual_fee_id) : "",
        amount_due: item?.amount_due ?? "",
        amount_paid: item?.amount_paid ?? "",
        payment_method: knownPaymentMethod ? paymentMethod : paymentMethod ? "Autres" : "",
        payment_method_other: knownPaymentMethod ? "" : paymentMethod,
        reference: item?.reference ?? "",
        paid_at: item?.paid_at ? String(item.paid_at).slice(0, 10) : todayIsoDate(),
        notes: item?.notes ?? "",
      });
      setErrors({});
      setGlobalError("");
      setOpen(true);
    });

    $table.on("click", ".js-validate", async (event) => {
      const id = $(event.currentTarget).data("id");
      try {
        await feePaymentsApi.validate(id);
        await load({ mode: "refresh" });
        showToast("success", "Cotisation validee.");
      } catch (error) {
        showToast("danger", error?.response?.data?.message || "Echec de la validation.");
      }
    });

    $table.on("click", ".js-cancel", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((current) => String(getRowId(current)) === String(id));
      if (!item) return;
      setCancelTarget(item);
      setCancelReason("");
      setCancelOpen(true);
    });

    return () => {
      try {
        $table.off("click", ".js-detail");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-validate");
        $table.off("click", ".js-cancel");
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

    if (!form.member_id) {
      setErrors({ member_id: ["Selectionne un membre dans la liste proposee."] });
      return;
    }

    if (!form.annual_fee_id) {
      setErrors({ annual_fee_id: ["Selectionne une cotisation annuelle."] });
      return;
    }

    if (form.payment_method === "Autres" && !form.payment_method_other.trim()) {
      setErrors({ payment_method_other: ["Precise la methode de paiement."] });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        member_id: Number(form.member_id),
        annual_fee_id: Number(form.annual_fee_id),
        amount_due: Number(form.amount_due),
        amount_paid: Number(form.amount_paid || 0),
        payment_method:
          (form.payment_method === "Autres" ? form.payment_method_other : form.payment_method).trim() || null,
        reference: form.reference.trim() || null,
        paid_at: form.paid_at || null,
        notes: form.notes.trim() || null,
      };

      if (editing) {
        await feePaymentsApi.update(getRowId(editing), payload);
      } else {
        await feePaymentsApi.create(payload);
      }

      await load({ mode: "refresh" });
      setOpen(false);
      resetForm();
      showToast("success", editing ? "Cotisation mise a jour." : "Cotisation creee.");
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    try {
      await feePaymentsApi.cancel(getRowId(cancelTarget), { reason: cancelReason || null });
      await load({ mode: "refresh" });
      setCancelOpen(false);
      setCancelTarget(null);
      setCancelReason("");
      showToast("success", "Cotisation annulee.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Echec de l'annulation.");
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Cotisations membres</h4>
          <div className="text-muted small">Enregistrement, validation et annulation des paiements</div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => void load({ mode: "refresh" })}
            disabled={initialLoading || refreshing}
          >
            {initialLoading || refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Rafraichissement...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                Rafraichir
              </>
            )}
          </button>

          <button
            className="btn btn-dark"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            disabled={initialLoading}
          >
            <i className="bi bi-plus-lg me-2" />
            Nouvelle cotisation
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          ) : null}

          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>Membres</th>
                  <th>Année</th>
                  <th>Montant dû</th>
                  <th>Montant payé</th>
                  <th>Payé le</th>
                  <th>Paiement</th>
                  <th>Validation</th>
                  <th className="text-end" style={{ width: 220 }}>
                    Actions
                  </th>
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
                  <h5 className="modal-title">{editing ? "Modifier" : "Creer"}</h5>
                  <button type="button" className="btn-close" onClick={() => !saving && setOpen(false)} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Membre</label>
                      <input
                        list="members-list"
                        className={`form-control ${errors.member_id ? "is-invalid" : ""}`}
                        value={form.member_search}
                        onChange={(e) => {
                          const value = e.target.value;
                          const selected = members.find((member) => memberOptionLabel(member) === value);
                          setForm((current) => ({
                            ...current,
                            member_search: value,
                            member_id: selected ? String(selected.id) : "",
                          }));
                        }}
                        placeholder="Rechercher par numero, prenom ou nom"
                      />
                      <datalist id="members-list">
                        {members.map((member) => (
                          <option key={member.id} value={memberOptionLabel(member)} />
                        ))}
                      </datalist>
                      {errors.member_id ? <span className="text-danger small">{errors.member_id[0]}</span> : null}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Cotisation annuelle</label>
                      <select
                        className={`form-select ${errors.annual_fee_id ? "is-invalid" : ""}`}
                        value={form.annual_fee_id}
                        onChange={(e) => {
                          const annualFeeId = e.target.value;
                          const selected = annualFees.find((item) => String(item.id) === String(annualFeeId));
                          setForm((current) => ({
                            ...current,
                            annual_fee_id: annualFeeId,
                            amount_due: selected?.amount ?? current.amount_due,
                          }));
                        }}
                      >
                        <option value="">Selectionner</option>
                        {annualFees.map((annualFee) => (
                          <option key={annualFee.id} value={annualFee.id}>
                            {annualFee.year}
                          </option>
                        ))}
                      </select>
                      {errors.annual_fee_id ? (
                        <span className="text-danger small">{errors.annual_fee_id[0]}</span>
                      ) : null}
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Montant du</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={form.amount_due}
                          onChange={(e) => setForm((current) => ({ ...current, amount_due: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Montant paye</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={form.amount_paid}
                          onChange={(e) => setForm((current) => ({ ...current, amount_paid: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label">Methode de paiement</label>
                        <select
                          className="form-select"
                          value={form.payment_method}
                          onChange={(e) =>
                            setForm((current) => ({
                              ...current,
                              payment_method: e.target.value,
                              payment_method_other: e.target.value === "Autres" ? current.payment_method_other : "",
                            }))
                          }
                        >
                          <option value="">Selectionner</option>
                          {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Reference</label>
                        <input
                          className="form-control"
                          value={form.reference}
                          onChange={(e) => setForm((current) => ({ ...current, reference: e.target.value }))}
                        />
                      </div>
                    </div>

                    {form.payment_method === "Autres" ? (
                      <div className="mb-3 mt-3">
                        <label className="form-label">Autre methode</label>
                        <input
                          className={`form-control ${errors.payment_method_other ? "is-invalid" : ""}`}
                          value={form.payment_method_other}
                          onChange={(e) =>
                            setForm((current) => ({ ...current, payment_method_other: e.target.value }))
                          }
                          placeholder="Preciser la methode de paiement"
                        />
                        {errors.payment_method_other ? (
                          <span className="text-danger small">{errors.payment_method_other[0]}</span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mb-3 mt-3">
                      <label className="form-label">Date de paiement</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.paid_at}
                        onChange={(e) => setForm((current) => ({ ...current, paid_at: e.target.value }))}
                      />
                    </div>

                    <div className="mb-0">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => !saving && setOpen(false)}>
                      Annuler
                    </button>
                    <button className="btn btn-warning" disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={() => !saving && setOpen(false)} />
        </>
      ) : null}

      {detailOpen && detailTarget ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail cotisation - {detailTarget?.annual_fee?.year || "-"}</h5>
                  <button type="button" className="btn-close" onClick={() => setDetailOpen(false)} />
                </div>
                <div className="modal-body">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div
                      className="rounded-4 overflow-hidden border-0 bg-light-subtle flex-shrink-0"
                      style={{ width: "84px", height: "84px" }}
                    >
                      <img
                        src={memberPhotoUrl(detailTarget?.member?.photo)}
                        alt="Photo membre"
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <div>
                      <div className="text-muted small">Membre</div>
                      <div className="fw-semibold">
                        {`${detailTarget?.member?.first_name || ""} ${detailTarget?.member?.last_name || ""}`.trim() || "-"}
                      </div>
                      <div className="small text-muted">Numero carte: {detailTarget?.member?.member_number || "-"}</div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="text-muted small">Montant du</div>
                      <div>{detailTarget?.amount_due || "-"}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Montant paye</div>
                      <div>{detailTarget?.amount_paid || "-"}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Paiement</div>
                      <div>
                        <span className={`badge text-bg-${paymentStatusBadge(detailTarget?.payment_status)}`}>
                          {detailTarget?.payment_status || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Validation</div>
                      <div>
                        <span className={`badge text-bg-${validationStatusBadge(detailTarget?.validation_status)}`}>
                          {detailTarget?.validation_status || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Methode</div>
                      <div>{detailTarget?.payment_method || "-"}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Reference</div>
                      <div>{detailTarget?.reference || "-"}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Date de paiement</div>
                      <div>{formatDate(detailTarget?.paid_at)}</div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-muted small">Valide par</div>
                      <div>{detailTarget?.validator?.name || "-"}</div>
                    </div>
                    <div className="col-12">
                      <div className="text-muted small">Notes</div>
                      <div>{detailTarget?.notes || "-"}</div>
                    </div>
                    {detailTarget?.validation_status === "cancelled" ? (
                      <div className="col-12">
                        <div className="text-muted small">Annulation</div>
                        <div>{detailTarget?.canceller?.name || "-"}</div>
                        <div className="small text-muted">{detailTarget?.cancel_reason || "-"}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDetailOpen(false)}>
                    <i className="bi bi-x-circle"></i> Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setDetailOpen(false)} />
        </>
      ) : null}

      {cancelOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Annuler la cotisation</h5>
                  <button type="button" className="btn-close" onClick={() => setCancelOpen(false)} />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Motif</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setCancelOpen(false)}>
                    Fermer
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmCancel}>
                    Annuler la cotisation
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={() => setCancelOpen(false)} />
        </>
      ) : null}

      {toast.open ? (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show text-bg-${toast.type} border-0`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast((current) => ({ ...current, open: false }))}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
