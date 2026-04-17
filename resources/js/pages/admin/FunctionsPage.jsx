import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { functionsApi } from "../../api/function";
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

export default function FunctionsPage() {
  const { lang, t } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    is_executive: false,
    is_active: true,
  });

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

  const getRowId = (row) => row?.encrypted_id ?? row?.id;

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const list = await functionsApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        t("functions.toast.loadFailed", "Impossible de charger les fonctions.");

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

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      code: "",
      description: "",
      is_executive: false,
      is_active: true,
    });
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

  function openEdit(func) {
    setEditing(func);
    setForm({
      name: func?.name ?? "",
      code: func?.code ?? "",
      description: func?.description ?? "",
      is_executive: !!func?.is_executive,
      is_active: !!func?.is_active,
    });
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function onDeleteAsk(func) {
    setDeleteTarget(func);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  async function openShow(func) {
    try {
      const data = await functionsApi.show(getRowId(func));
      setShowing(data?.function || func);
    } catch {
      setShowing(func);
    }

    setShowOpen(true);
  }

  function closeShow() {
    setShowOpen(false);
    setShowing(null);
  }

  useEffect(() => {
    if (initialLoading) return;
    if (!tableRef.current) return;

    const $table = $(tableRef.current);

    if (dtRef.current) {
      try {
        $table.off("click", ".js-show");
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
        { data: "name", defaultContent: "" },
        {
          data: "code",
          defaultContent: "",
          render: (value) => {
            const safe = String(value ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return safe
              ? `<span class="badge text-bg-light border text-dark">${safe}</span>`
              : `<span class="text-muted small">-</span>`;
          },
        },
        {
          data: "is_executive",
          width: 120,
          render: (value) =>
            value
              ? `<span class="badge text-bg-warning">${t("functions.table.executive", "Bureau")}</span>`
              : `<span class="badge text-bg-light border text-dark">${t("functions.table.nonExecutive", "Standard")}</span>`,
        },
        {
          data: "is_active",
          width: 120,
          render: (value) =>
            value
              ? `<span class="badge text-bg-success">${t("functions.table.active", "Actif")}</span>`
              : `<span class="badge text-bg-secondary">${t("functions.table.inactive", "Inactif")}</span>`,
        },
        {
          data: "description",
          defaultContent: "",
          render: (value) => {
            const raw = (value ?? "").toString();
            const safe = raw.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const shortText = safe.length > 90 ? `${safe.slice(0, 90)}...` : safe;
            return shortText || `<span class="text-muted small">-</span>`;
          },
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 180,
          render: (data, type, row) => {
            const id = getRowId(row);

            return `
              <button class="btn btn-sm btn-outline-primary me-2 js-show" data-id="${id}">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger js-del" data-id="${id}">
                <i class="bi bi-trash3"></i>
              </button>
            `;
          },
        },
      ],
    });

    $table.on("click", ".js-show", (event) => {
      const id = $(event.currentTarget).data("id");
      const func = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (func) void openShow(func);
    });

    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      const func = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (func) openEdit(func);
    });

    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const func = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (func) onDeleteAsk(func);
    });

    return () => {
      try {
        $table.off("click", ".js-show");
        $table.off("click", ".js-edit");
        $table.off("click", ".js-del");
      } catch {}

      dtRef.current?.destroy();
      dtRef.current = null;
    };
  }, [initialLoading, DT_LANG_URL, t]);

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

    if (!form.name.trim()) {
      setErrors({ name: [t("functions.toast.nameRequired", "Le nom est obligatoire.")] });
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await functionsApi.update(getRowId(editing), {
          name: form.name.trim(),
          code: form.code.trim() || null,
          description: form.description.trim() || null,
          is_executive: form.is_executive,
          is_active: form.is_active,
        });
      } else {
        await functionsApi.create({
          name: form.name.trim(),
          code: form.code.trim() || null,
          description: form.description.trim() || null,
          is_executive: form.is_executive,
          is_active: form.is_active,
        });
      }

      await load({ mode: "refresh" });
      setOpen(false);

      showToast(
        "success",
        editing
          ? t("functions.toast.updated", "Fonction mise a jour.")
          : t("functions.toast.created", "Fonction creee.")
      );
    } catch (error) {
      const data = error?.response?.data;

      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setGlobalError(data?.message || t("functions.toast.saveFailed", "Echec de l'enregistrement."));
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);

    try {
      await functionsApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("functions.toast.deleted", "Fonction supprimee."));
    } catch (error) {
      const message =
        error?.response?.data?.message || t("functions.toast.deleteFailed", "Echec de la suppression.");
      showToast("danger", message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("functions.title", "Fonctions")}</h4>
          <div className="text-muted small">{t("functions.subtitle", "Gestion des fonctions")}</div>
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
                {t("functions.refreshing", "Rafraichissement...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("functions.refresh", "Rafraichir")}
              </>
            )}
          </button>

          <button className="btn btn-dark" onClick={openCreate} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />
            {t("functions.new", "Nouvelle fonction")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              {t("functions.loading", "Chargement...")}
            </div>
          ) : null}

          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>{t("functions.table.name", "Nom")}</th>
                  <th>{t("functions.table.code", "Code")}</th>
                  <th style={{ width: 120 }}>{t("functions.table.scope", "Type")}</th>
                  <th style={{ width: 120 }}>{t("functions.table.status", "Statut")}</th>
                  <th>{t("functions.table.description", "Description")}</th>
                  <th style={{ width: 180 }} className="text-end">
                    {t("functions.table.actions", "Actions")}
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
                  <h5 className="modal-title">
                    {editing ? t("functions.modal.editTitle", "Modifier") : t("functions.modal.createTitle", "Creer")}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

                    <div className="mb-3">
                      <label className="form-label">{t("functions.modal.name", "Nom")}</label>
                      <input
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder={t("functions.modal.placeholderName", "Ex: President")}
                        autoFocus
                      />
                      {errors.name ? <span className="text-danger small">{errors.name[0]}</span> : null}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("functions.modal.code", "Code")}</label>
                      <input
                        className={`form-control ${errors.code ? "is-invalid" : ""}`}
                        value={form.code}
                        onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                        placeholder={t("functions.modal.placeholderCode", "Ex: PRES")}
                      />
                      {errors.code ? <span className="text-danger small">{errors.code[0]}</span> : null}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("functions.modal.description", "Description")}</label>
                      <textarea
                        className={`form-control ${errors.description ? "is-invalid" : ""}`}
                        rows={3}
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, description: event.target.value }))
                        }
                        placeholder={t("functions.modal.placeholderDescription", "Description courte")}
                      />
                      {errors.description ? <span className="text-danger small">{errors.description[0]}</span> : null}
                    </div>

                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="function-executive"
                        checked={!!form.is_executive}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, is_executive: event.target.checked }))
                        }
                      />
                      <label className="form-check-label" htmlFor="function-executive">
                        {t("functions.modal.executive", "Fonction du bureau")}
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="function-active"
                        checked={!!form.is_active}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, is_active: event.target.checked }))
                        }
                      />
                      <label className="form-check-label" htmlFor="function-active">
                        {t("functions.modal.active", "Actif")}
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                      {t("functions.modal.cancel", "Annuler")}
                    </button>
                    <button className="btn btn-warning" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("functions.modal.saving", "Enregistrement...")}
                        </>
                      ) : (
                        t("functions.modal.save", "Enregistrer")
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeModal} />
        </>
      ) : null}

      {showOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("functions.show.title", "Details fonction")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>

                <div className="modal-body">
                  {showing ? (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="border-0 bg-light rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("functions.show.identity", "Identification")}
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("functions.table.name", "Nom")}</div>
                            <div className="fw-semibold">{showing.name || "-"}</div>
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("functions.table.code", "Code")}</div>
                            <div>{showing.code || "-"}</div>
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("functions.table.scope", "Type")}</div>
                            <div>
                              {showing.is_executive ? (
                                <span className="badge text-bg-warning">{t("functions.table.executive", "Bureau")}</span>
                              ) : (
                                <span className="badge text-bg-light border text-dark">
                                  {t("functions.table.nonExecutive", "Standard")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small">{t("functions.table.status", "Statut")}</div>
                            <div>
                              {showing.is_active ? (
                                <span className="badge text-bg-success">{t("functions.table.active", "Actif")}</span>
                              ) : (
                                <span className="badge text-bg-secondary">{t("functions.table.inactive", "Inactif")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border-0 bg-light rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("functions.show.timeline", "Suivi")}
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("functions.show.createdAt", "Cree le")}</div>
                            <div className="fw-semibold">{formatDate(showing.created_at)}</div>
                          </div>

                          <div>
                            <div className="text-muted small">{t("functions.show.updatedAt", "Mis a jour le")}</div>
                            <div className="fw-semibold">{formatDate(showing.updated_at)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="border-0 bg-light rounded-4 p-3">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("functions.table.description", "Description")}
                          </div>
                          <div className="text-secondary" style={{ whiteSpace: "pre-wrap" }}>
                            {showing.description || t("functions.show.noDescription", "Aucune description.")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow}>
                    {t("functions.modal.close", "Fermer")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      ) : null}

      {deleteOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("functions.delete.title", "Confirmation")}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      {t("functions.delete.message", "Supprimer la fonction")} <b>{deleteTarget.name}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">{t("functions.delete.message2", "Supprimer cette fonction ?")}</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                  >
                    {t("functions.modal.cancel", "Annuler")}
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("functions.delete.deleting", "Suppression...")}
                      </>
                    ) : (
                      t("functions.delete.btn", "Supprimer")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeDeleteModal} />
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
