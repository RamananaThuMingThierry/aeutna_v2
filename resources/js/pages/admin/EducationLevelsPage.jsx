import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { educationLevelsApi } from "../../api/education-level";
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

export default function EducationLevelsPage() {
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
      const list = await educationLevelsApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        t("educationLevels.toast.loadFailed", "Impossible de charger les niveaux d'education.");

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
      is_active: true,
    });
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

  function openEdit(educationLevel) {
    setEditing(educationLevel);
    setForm({
      name: educationLevel?.name ?? "",
      code: educationLevel?.code ?? "",
      is_active: !!educationLevel?.is_active,
    });
    setErrors({});
    setGlobalError("");
    setOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
  }

  function onDeleteAsk(educationLevel) {
    setDeleteTarget(educationLevel);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  async function openShow(educationLevel) {
    try {
      const data = await educationLevelsApi.show(getRowId(educationLevel));
      setShowing(data?.education_level || educationLevel);
    } catch {
      setShowing(educationLevel);
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
          data: "is_active",
          width: 120,
          render: (value) =>
            value
              ? `<span class="badge text-bg-success">${t("educationLevels.table.active", "Actif")}</span>`
              : `<span class="badge text-bg-secondary">${t("educationLevels.table.inactive", "Inactif")}</span>`,
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
      const educationLevel = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (educationLevel) void openShow(educationLevel);
    });

    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      const educationLevel = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (educationLevel) openEdit(educationLevel);
    });

    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const educationLevel = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (educationLevel) onDeleteAsk(educationLevel);
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
      setErrors({ name: [t("educationLevels.toast.nameRequired", "Le nom est obligatoire.")] });
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await educationLevelsApi.update(getRowId(editing), {
          name: form.name.trim(),
          code: form.code.trim() || null,
          is_active: form.is_active,
        });
      } else {
        await educationLevelsApi.create({
          name: form.name.trim(),
          code: form.code.trim() || null,
          is_active: form.is_active,
        });
      }

      await load({ mode: "refresh" });
      setOpen(false);

      showToast(
        "success",
        editing
          ? t("educationLevels.toast.updated", "Niveau d'education mis a jour.")
          : t("educationLevels.toast.created", "Niveau d'education cree.")
      );
    } catch (error) {
      const data = error?.response?.data;

      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setGlobalError(
          data?.message || t("educationLevels.toast.saveFailed", "Echec de l'enregistrement.")
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);

    try {
      await educationLevelsApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("educationLevels.toast.deleted", "Niveau d'education supprime."));
    } catch (error) {
      const message =
        error?.response?.data?.message || t("educationLevels.toast.deleteFailed", "Echec de la suppression.");
      showToast("danger", message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("educationLevels.title", "Niveaux d'education")}</h4>
          <div className="text-muted small">
            {t("educationLevels.subtitle", "Gestion des niveaux d'education")}
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
                {t("educationLevels.refreshing", "Rafraichissement...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("educationLevels.refresh", "Rafraichir")}
              </>
            )}
          </button>

          <button className="btn btn-dark" onClick={openCreate} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />
            {t("educationLevels.new", "Nouveau niveau")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? (
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <div className="spinner-border spinner-border-sm" />
              {t("educationLevels.loading", "Chargement...")}
            </div>
          ) : null}

          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th>{t("educationLevels.table.name", "Nom")}</th>
                  <th style={{ width: 120 }}>{t("educationLevels.table.status", "Statut")}</th>
                  <th style={{ width: 180 }} className="text-end">
                    {t("educationLevels.table.actions", "Actions")}
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
                    {editing
                      ? t("educationLevels.modal.editTitle", "Modifier")
                      : t("educationLevels.modal.createTitle", "Creer")}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

                    <div className="mb-3">
                      <label className="form-label">{t("educationLevels.modal.name", "Nom")}</label>
                      <input
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder={t("educationLevels.modal.placeholderName", "Ex: Licence 1")}
                        autoFocus
                      />
                      {errors.name ? <span className="text-danger small">{errors.name[0]}</span> : null}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">{t("educationLevels.modal.code", "Code")}</label>
                      <input
                        className={`form-control ${errors.code ? "is-invalid" : ""}`}
                        value={form.code}
                        onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                        placeholder={t("educationLevels.modal.placeholderCode", "Ex: L1")}
                      />
                      {errors.code ? <span className="text-danger small">{errors.code[0]}</span> : null}
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="education-level-active"
                        checked={!!form.is_active}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, is_active: event.target.checked }))
                        }
                      />
                      <label className="form-check-label" htmlFor="education-level-active">
                        {t("educationLevels.modal.active", "Actif")}
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                      {t("educationLevels.modal.cancel", "Annuler")}
                    </button>
                    <button className="btn btn-warning" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("educationLevels.modal.saving", "Enregistrement...")}
                        </>
                      ) : (
                        t("educationLevels.modal.save", "Enregistrer")
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
                  <h5 className="modal-title">{t("educationLevels.show.title", "Details niveau d'education")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>

                <div className="modal-body">
                  {showing ? (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="border-0 bg-light rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("educationLevels.show.identity", "Identification")}
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("educationLevels.table.name", "Nom")}</div>
                            <div className="fw-semibold">{showing.name || "-"}</div>
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("educationLevels.table.code", "Code")}</div>
                            <div>{showing.code || "-"}</div>
                          </div>

                          <div>
                            <div className="text-muted small">{t("educationLevels.table.status", "Statut")}</div>
                            <div>
                              {showing.is_active ? (
                                <span className="badge text-bg-success">
                                  {t("educationLevels.table.active", "Actif")}
                                </span>
                              ) : (
                                <span className="badge text-bg-secondary">
                                  {t("educationLevels.table.inactive", "Inactif")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border-0 bg-light rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("educationLevels.show.timeline", "Suivi")}
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("educationLevels.show.createdAt", "Cree le")}</div>
                            <div className="fw-semibold">{formatDate(showing.created_at)}</div>
                          </div>

                          <div>
                            <div className="text-muted small">{t("educationLevels.show.updatedAt", "Mis a jour le")}</div>
                            <div className="fw-semibold">{formatDate(showing.updated_at)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow}>
                    {t("educationLevels.modal.close", "Fermer")}
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
                  <h5 className="modal-title">{t("educationLevels.delete.title", "Confirmation")}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      {t("educationLevels.delete.message", "Supprimer le niveau")} <b>{deleteTarget.name}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">{t("educationLevels.delete.message2", "Supprimer ce niveau ?")}</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                  >
                    {t("educationLevels.modal.cancel", "Annuler")}
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("educationLevels.delete.deleting", "Suppression...")}
                      </>
                    ) : (
                      t("educationLevels.delete.btn", "Supprimer")
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
