import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";
import { useNavigate } from "react-router-dom";

import { reportsApi } from "../../api/report";

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

function reportTypeLabel(value) {
  switch (value) {
    case "bureau_meeting":
      return "Reunion bureau";
    case "general_meeting":
      return "Reunion generale";
    case "gathering":
      return "Rassemblement";
    case "celebration":
      return "Fete";
    case "event":
      return "Evenement";
    default:
      return "Autre";
  }
}

function statusBadge(status) {
  switch (status) {
    case "validated":
      return "success";
    case "archived":
      return "secondary";
    default:
      return "warning";
  }
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const DT_LANG_URL = useMemo(() => "/lang/datatables/fr.json", []);
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [globalError, setGlobalError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast((current) => ({ ...current, open: false }));
    }, 3500);
  }

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const list = await reportsApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les rapports.";
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
        $table.off("click", ".js-view");
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
        {
          data: null,
          render: (d, t2, row) => `
            <div class="fw-semibold">${row?.title || "-"}</div>
            <div class="small text-muted">${row?.subject || "-"}</div>
          `,
        },
        { data: "report_type", render: (value) => reportTypeLabel(value) },
        { data: "report_date", render: (value) => formatDate(value) },
        { data: "location", defaultContent: "", render: (value) => value || `<span class="text-muted small">-</span>` },
        { data: "attendances_count", defaultContent: 0, render: (value) => `<span class="badge text-bg-light border text-dark">${value || 0}</span>` },
        { data: "status", render: (value) => `<span class="badge text-bg-${statusBadge(value)}">${value || "draft"}</span>` },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 180,
          render: (d, t2, row) => {
            const id = getRowId(row);
            return `<button class="btn btn-sm btn-outline-primary me-2 js-view" data-id="${id}"><i class="bi bi-eye"></i></button>
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-sm btn-outline-danger js-del" data-id="${id}"><i class="bi bi-trash3"></i></button>`;
          },
        },
      ],
    });

    $table.on("click", ".js-view", (event) => {
      const id = $(event.currentTarget).data("id");
      navigate(`/admin/reports/${id}`);
    });

    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      navigate(`/admin/reports/${id}/edit`);
    });

    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((row) => String(getRowId(row)) === String(id));
      if (item) {
        setDeleteTarget(item);
        setDeleteOpen(true);
      }
    });

    return () => {
      try {
        $table.off("click", ".js-view");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}
      dtRef.current?.destroy();
      dtRef.current = null;
    };
  }, [initialLoading, DT_LANG_URL, navigate]);

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

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);

    try {
      await reportsApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", "Rapport supprime.");
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
          <h4 className="mb-1">Rapports</h4>
          <div className="text-muted small">Gestion des rapports de reunions et des membres presents</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>
            {initialLoading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />Rafraichissement...</> : <><i className="bi bi-arrow-clockwise me-2" />Rafraichir</>}
          </button>
          <button className="btn btn-dark" onClick={() => navigate("/admin/reports/new")} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />Nouveau rapport
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? <div className="d-flex align-items-center gap-2 text-muted mb-3"><div className="spinner-border spinner-border-sm" />Chargement...</div> : null}
          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0 w-100">
              <thead>
                <tr className="text-muted small">
                  <th>Titre</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Lieu</th>
                  <th>Presents</th>
                  <th>Statut</th>
                  <th className="text-end" style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

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
                  <p className="mb-0">Supprimer le rapport <b>{deleteTarget?.title || "#"}</b> ?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Annuler</button>
                  <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={deleting}>
                    {deleting ? <><span className="spinner-border spinner-border-sm me-2" />Suppression...</> : "Supprimer"}
                  </button>
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
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((current) => ({ ...current, open: false }))} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
