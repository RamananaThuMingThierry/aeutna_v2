import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { activityLogsApi } from "../../api/activity-log";
import { useI18n } from "../../hooks/website/I18nContext";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR");
}

function colorBadgeClass(color) {
  switch (color) {
    case "success":
      return "text-bg-success";
    case "warning":
      return "text-bg-warning";
    case "danger":
      return "text-bg-danger";
    case "primary":
      return "text-bg-primary";
    default:
      return "text-bg-info";
  }
}

export default function ActivityLogPage() {
  const { lang, t } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [globalError, setGlobalError] = useState("");

  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  const tableRef = useRef(null);
  const dtRef = useRef(null);
  const itemsRef = useRef(items);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
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

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const list = await activityLogsApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        t("activityLogs.toast.loadFailed", "Impossible de charger les activity logs.");

      if (mode === "initial") {
        setGlobalError(message);
      } else {
        showToast("danger", message);
      }
    } finally {
      if (mode === "initial") {
        setInitialLoading(false);
      }

      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load({ mode: "initial" });
  }, []);

  async function openShow(log) {
    setShowLoading(true);
    setShowing(log);
    setShowOpen(true);

    try {
      const data = await activityLogsApi.show(log.id);
      setShowing(data?.activity_log || log);
    } catch {
      setShowing(log);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    setShowOpen(false);
    setShowing(null);
    setShowLoading(false);
  }

  useEffect(() => {
    if (initialLoading) return;
    if (!tableRef.current) return;

    const $table = $(tableRef.current);

    if (dtRef.current) {
      try {
        $table.off("click", ".js-show");
      } catch {}

      dtRef.current.destroy(true);
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
      order: [[0, "desc"]],
      language: { url: DT_LANG_URL },
      columns: [
        {
          data: "id",
          width: 80,
          render: (value) => `#${value ?? "-"}`,
        },
        {
          data: "action",
          defaultContent: "",
          render: (value, type, row) =>
            `<span class="badge ${colorBadgeClass(row?.color)} text-uppercase">${value || "-"}</span>`,
        },
        {
          data: "user",
          defaultContent: "",
          render: (value) => `
            <div class="fw-semibold">${value?.name || "Systeme"}</div>
            <div class="small text-secondary">${value?.email || "-"}</div>
          `,
        },
        {
          data: "message",
          defaultContent: "",
          render: (value) => {
            const raw = (value ?? "").toString();
            const safe = raw.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const shortText = safe.length > 90 ? `${safe.slice(0, 90)}...` : safe;
            return shortText || "-";
          },
        },
        {
          data: "created_at",
          render: (value) => formatDate(value),
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 100,
          render: (data, type, row) => `
            <button class="btn btn-sm btn-outline-secondary js-show" data-id="${row?.id}">
              <i class="bi bi-eye"></i>
            </button>
          `,
        },
      ],
    });

    $table.on("click", ".js-show", (event) => {
      const id = $(event.currentTarget).data("id");
      const log = itemsRef.current.find((item) => String(item?.id) === String(id));
      if (log) void openShow(log);
    });

    return () => {
      try {
        $table.off("click", ".js-show");
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

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("activityLogs.title", "Activity logs")}</h4>
          <div className="text-muted small">
            {t("activityLogs.subtitle", "Suivi des actions effectuees dans l'application")}
          </div>
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
                {t("activityLogs.refreshing", "Rafraichissement...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("activityLogs.refresh", "Rafraichir")}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              {t("activityLogs.loading", "Chargement...")}
            </div>
          ) : null}

          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th style={{ width: 80 }}>ID</th>
                  <th>{t("activityLogs.table.action", "Action")}</th>
                  <th>{t("activityLogs.table.user", "Utilisateur")}</th>
                  <th>{t("activityLogs.table.message", "Message")}</th>
                  <th>{t("activityLogs.table.date", "Date")}</th>
                  <th style={{ width: 100 }} className="text-end">
                    {t("activityLogs.table.details", "Details")}
                  </th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

      {showOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("activityLogs.show.title", "Details activity log")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="text-center py-4 text-secondary">{t("activityLogs.show.loading", "Chargement...")}</div>
                  ) : showing ? (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="rounded-4 border bg-light-subtle p-3 p-md-4">
                          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                            <div>
                              <div className="small text-uppercase text-secondary fw-semibold mb-2">
                                {t("activityLogs.show.summary", "Resume")}
                              </div>
                              <div className="h5 mb-1">{showing.message || "-"}</div>
                              <div className="text-secondary">{showing.user?.name || "Systeme"}</div>
                            </div>
                            <div className="d-flex gap-2 flex-wrap align-items-start">
                              <span className={`badge ${colorBadgeClass(showing.color)} text-uppercase`}>
                                {showing.action || "-"}
                              </span>
                              <span className="badge text-bg-light border text-dark">
                                {showing.status_code || "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("activityLogs.show.context", "Contexte")}
                          </div>

                          <div className="mb-3">
                            <div className="small text-secondary mb-1">{t("activityLogs.table.route", "Route")}</div>
                            <div className="fw-semibold">{showing.route || "-"}</div>
                          </div>

                          <div className="mb-3">
                            <div className="small text-secondary mb-1">{t("activityLogs.show.method", "Methode")}</div>
                            <div className="fw-semibold">{showing.method || "-"}</div>
                          </div>

                          <div>
                            <div className="small text-secondary mb-1">{t("activityLogs.table.date", "Date")}</div>
                            <div className="fw-semibold">{formatDate(showing.created_at)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("activityLogs.show.target", "Cible")}
                          </div>

                          <div className="mb-3">
                            <div className="small text-secondary mb-1">{t("activityLogs.show.entityType", "Entity type")}</div>
                            <div className="fw-semibold">{showing.entity_type || "-"}</div>
                          </div>

                          <div className="mb-3">
                            <div className="small text-secondary mb-1">{t("activityLogs.show.entityId", "Entity ID")}</div>
                            <div className="fw-semibold">{showing.entity_id || "-"}</div>
                          </div>

                          <div>
                            <div className="small text-secondary mb-1">{t("activityLogs.table.user", "Utilisateur")}</div>
                            <div className="fw-semibold">{showing.user?.email || "Systeme"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="border rounded-4 p-3">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("activityLogs.show.metadata", "Metadata")}
                          </div>
                          <pre className="mb-0 small bg-dark text-light rounded-3 p-3 overflow-auto">
                            {JSON.stringify(showing.metadata || {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow}>
                    {t("activityLogs.modal.close", "Fermer")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      )}

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
