import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { usersApi } from "../../api/user";
import { useI18n } from "../../hooks/website/I18nContext";

const AVAILABLE_ROLES = ["super_admin", "admin", "bureau", "member"];

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function formatRoles(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles
    .map((role) => (typeof role === "string" ? role : role?.code))
    .filter(Boolean);
}

function resolveAvatarUrl(avatar) {
  if (!avatar) return "";

  if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("blob:")) {
    return avatar;
  }

  const normalizedAvatar = avatar.replace(/^\/+/, "");

  if (normalizedAvatar.startsWith("uploads/")) {
    return `/${normalizedAvatar}`;
  }

  return `/storage/${normalizedAvatar}`;
}

export default function UsersPage() {
  const { lang, t } = useI18n();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });

  const [showOpen, setShowOpen] = useState(false);
  const [showing, setShowing] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [errors, setErrors] = useState({});
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
  const isCurrentUserRow = (row) => String(currentUser?.id || "") === String(row?.id || "__no_id__");

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const list = await usersApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        t("users.toast.loadFailed", "Impossible de charger les utilisateurs.");

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

  function openEdit(user) {
    setEditing(user);
    setSelectedRoles(formatRoles(user.roles));
    setErrors({});
    setGlobalError("");
    setEditOpen(true);
  }

  function closeEdit() {
    if (saving) return;
    setEditOpen(false);
    setEditing(null);
  }

  function onDeleteAsk(user) {
    if (isCurrentUserRow(user)) {
      showToast("danger", t("users.toast.selfDelete", "Vous ne pouvez pas vous supprimer vous-meme."));
      return;
    }

    setDeleteTarget(user);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  async function openShow(user) {
    setShowLoading(true);
    setShowing(user);
    setShowOpen(true);

    try {
      const data = await usersApi.show(getRowId(user));
      setShowing(data?.user || user);
    } catch {
      setShowing(user);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    setShowOpen(false);
    setShowing(null);
    setShowLoading(false);
  }

  function toggleRole(roleCode) {
    setSelectedRoles((current) =>
      current.includes(roleCode) ? current.filter((role) => role !== roleCode) : [...current, roleCode]
    );
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
        {
          data: "avatar",
          orderable: false,
          searchable: false,
          width: 80,
          render: (value, type, row) => {
            const src = resolveAvatarUrl(value);
            const initial = String(row?.name || "?").slice(0, 1).toUpperCase();

            if (!src) {
              return `
                <div class="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center fw-semibold"
                  style="width:40px;height:40px;">
                  ${initial}
                </div>
              `;
            }

            return `
              <img src="${src}" alt="avatar"
                class="rounded-circle object-fit-cover border"
                style="width:40px;height:40px;" />
            `;
          },
        },
        { data: "name", defaultContent: "" },
        { data: "email", defaultContent: "" },
        { data: "phone", defaultContent: "-" },
        {
          data: "roles",
          defaultContent: "",
          render: (value) => {
            const roles = formatRoles(value);

            if (roles.length === 0) {
              return `<span class="text-muted small">${t("users.table.noRoles", "Aucun role")}</span>`;
            }

            return roles
              .map(
                (role) =>
                  `<span class="badge text-bg-light border text-dark text-uppercase me-1 mb-1">${role}</span>`
              )
              .join("");
          },
        },
        {
          data: "is_active",
          width: 120,
          render: (value) =>
            value
              ? `<span class="badge text-bg-success">${t("users.table.active", "Actif")}</span>`
              : `<span class="badge text-bg-secondary">${t("users.table.inactive", "Inactif")}</span>`,
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 180,
          render: (data, type, row) => {
            const id = getRowId(row);
            const isCurrentUser = isCurrentUserRow(row);

            return `
              <button class="btn btn-sm btn-outline-primary me-2 js-show" data-id="${id}">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}">
                <i class="bi bi-pencil-square"></i>
              </button>
              ${
                isCurrentUser
                  ? ""
                  : `<button class="btn btn-sm btn-outline-danger js-del" data-id="${id}">
                      <i class="bi bi-trash3"></i>
                    </button>`
              }
            `;
          },
        },
      ],
    });

    $table.on("click", ".js-show", (event) => {
      const id = $(event.currentTarget).data("id");
      const user = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (user) void openShow(user);
    });

    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      const user = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (user) openEdit(user);
    });

    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const user = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (user) onDeleteAsk(user);
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
  }, [initialLoading, DT_LANG_URL, t, currentUser]);

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

    if (!editing) return;

    setSaving(true);

    try {
      await usersApi.syncRoles(getRowId(editing), selectedRoles);
      await load({ mode: "refresh" });
      setEditOpen(false);
      setEditing(null);
      showToast("success", t("users.toast.updated", "Roles synchronises avec succes."));
    } catch (error) {
      const data = error?.response?.data;

      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setGlobalError(data?.message || t("users.toast.saveFailed", "Impossible de mettre a jour les roles."));
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);

    try {
      await usersApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("users.toast.deleted", "Utilisateur supprime avec succes."));
    } catch (error) {
      const message =
        error?.response?.data?.message || t("users.toast.deleteFailed", "Impossible de supprimer l'utilisateur.");
      showToast("danger", message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("users.title", "Utilisateurs")}</h4>
          <div className="text-muted small">
            {t("users.subtitle", "Gestion des comptes avec consultation, roles et suppression")}
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
                {t("users.refreshing", "Rafraichissement...")}
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                {t("users.refresh", "Rafraichir")}
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
              {t("users.loading", "Chargement...")}
            </div>
          ) : null}

          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0">
              <thead>
                <tr className="text-muted small">
                  <th style={{ width: 80 }}>{t("users.table.avatar", "Avatar")}</th>
                  <th>{t("users.table.name", "Nom")}</th>
                  <th>{t("users.table.email", "Email")}</th>
                  <th>{t("users.table.phone", "Telephone")}</th>
                  <th>{t("users.table.roles", "Roles")}</th>
                  <th style={{ width: 120 }}>{t("users.table.status", "Statut")}</th>
                  <th style={{ width: 180 }} className="text-end">
                    {t("users.table.actions", "Actions")}
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
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("users.show.title", "Details utilisateur")}</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>

                <div className="modal-body">
                  {showLoading ? (
                    <div className="text-center py-4 text-secondary">{t("users.show.loading", "Chargement...")}</div>
                  ) : showing ? (
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="rounded-4 border bg-light-subtle p-3 p-md-4">
                          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                            <div className="d-flex align-items-center gap-3">
                              {resolveAvatarUrl(showing.avatar) ? (
                                <img
                                  src={resolveAvatarUrl(showing.avatar)}
                                  alt={showing.name || "Avatar utilisateur"}
                                  className="rounded-circle object-fit-cover border shadow-sm"
                                  style={{ width: "84px", height: "84px" }}
                                />
                              ) : (
                                <div
                                  className="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center fw-semibold fs-3 shadow-sm"
                                  style={{ width: "84px", height: "84px" }}
                                >
                                  {(showing.name || "?").slice(0, 1).toUpperCase()}
                                </div>
                              )}

                              <div>
                                <div className="h4 mb-1">{showing.name || "-"}</div>
                                <div className="text-secondary">{showing.email || "-"}</div>
                              </div>
                            </div>

                            <div className="d-flex gap-2 flex-wrap align-items-start">
                              <span className={`badge ${showing.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                                {showing.is_active
                                  ? t("users.table.active", "Actif")
                                  : t("users.table.inactive", "Inactif")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("users.show.personal", "Informations personnelles")}
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("users.table.name", "Nom")}</div>
                            <div className="fw-semibold">{showing.name || "-"}</div>
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("users.table.email", "Email")}</div>
                            <div className="fw-semibold">{showing.email || "-"}</div>
                          </div>

                          <div>
                            <div className="text-muted small">{t("users.table.phone", "Telephone")}</div>
                            <div className="fw-semibold">{showing.phone || "-"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">
                            {t("users.show.access", "Acces et statut")}
                          </div>

                          <div className="mb-3">
                            <div className="text-muted small">{t("users.table.status", "Statut")}</div>
                            <div>
                              <span className={`badge ${showing.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                                {showing.is_active
                                  ? t("users.table.active", "Actif")
                                  : t("users.table.inactive", "Inactif")}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="text-muted small mb-2">{t("users.table.roles", "Roles")}</div>
                            <div className="d-flex flex-wrap gap-2">
                              {formatRoles(showing.roles).length > 0 ? (
                                formatRoles(showing.roles).map((role) => (
                                  <span key={`show-${role}`} className="badge text-bg-light border text-dark text-uppercase">
                                    {role}
                                  </span>
                                ))
                              ) : (
                                <span className="text-muted small">{t("users.table.noRoles", "Aucun role")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow}>
                    {t("users.modal.close", "Fermer")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      )}

      {editOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("users.edit.title", "Modifier les roles")}</h5>
                  <button type="button" className="btn-close" onClick={closeEdit} />
                </div>

                <form onSubmit={onSubmit}>
                  <div className="modal-body">
                    {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

                    <div className="mb-3">
                      <div className="fw-semibold">{editing?.name || "-"}</div>
                      <div className="small text-secondary">{editing?.email || "-"}</div>
                    </div>

                    <div className="row g-2">
                      {AVAILABLE_ROLES.map((roleCode) => (
                        <div className="col-md-6" key={roleCode}>
                          <label className="border rounded-3 px-3 py-2 d-flex align-items-center gap-2 w-100 bg-light-subtle">
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              checked={selectedRoles.includes(roleCode)}
                              onChange={() => toggleRole(roleCode)}
                            />
                            <span className="text-uppercase small fw-semibold">{roleCode}</span>
                          </label>
                        </div>
                      ))}
                    </div>

                    {errors.roles ? <div className="text-danger small mt-2">{errors.roles[0]}</div> : null}

                    <div className="form-text mt-3">
                      {t(
                        "users.edit.help",
                        "Seuls les roles sont modifiables depuis l'administration. Les informations personnelles sont gerees par chaque utilisateur depuis son compte."
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeEdit} disabled={saving}>
                      {t("users.modal.cancel", "Annuler")}
                    </button>
                    <button className="btn btn-dark" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          {t("users.edit.saving", "Enregistrement...")}
                        </>
                      ) : (
                        t("users.edit.save", "Enregistrer")
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeEdit} />
        </>
      )}

      {deleteOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{t("users.delete.title", "Confirmer la suppression")}</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} />
                </div>

                <div className="modal-body">
                  {deleteTarget ? (
                    <p className="mb-0">
                      {t("users.delete.message", "Supprimer l'utilisateur")} <b>{deleteTarget.name}</b> ?
                    </p>
                  ) : (
                    <p className="mb-0">{t("users.delete.message2", "Supprimer cet utilisateur ?")}</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                  >
                    {t("users.modal.cancel", "Annuler")}
                  </button>

                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {t("users.delete.deleting", "Suppression...")}
                      </>
                    ) : (
                      t("users.delete.btn", "Supprimer")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeDeleteModal} />
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
