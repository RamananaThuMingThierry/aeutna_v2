import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";
import { useNavigate } from "react-router-dom";

import { membersApi } from "../../api/member";
import { useI18n } from "../../hooks/website/I18nContext";

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

function resolvePhotoUrl(photo) {
  if (!photo) return "/images/avatar.png";
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `/${photo.replace(/^\/+/, "")}`;
}

function currentFunctionNames(row) {
  const items = Array.isArray(row?.current_member_functions) ? row.current_member_functions : [];
  const names = items
    .map((item) => item?.function?.name)
    .filter(Boolean);

  return names.join(", ");
}

export default function MembersPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const DT_LANG_URL = useMemo(() => `/lang/datatables/${lang}.json`, [lang]);
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
      const membersList = await membersApi.list();
      setItems(normalizeCollection(membersList));
    } catch (error) {
      const message = error?.response?.data?.message || t("members.toast.loadFailed", "Impossible de charger les membres.");
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

  function onDeleteAsk(member) {
    setDeleteTarget(member);
    setDeleteOpen(true);
  }

  function closeDeleteModal() {
    if (!deleting) {
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  }

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
          data: "photo",
          orderable: false,
          searchable: false,
          width: 88,
          render: (value) => `
            <div class="d-flex align-items-center justify-content-center">
              <img
                src="${resolvePhotoUrl(value)}"
                alt="member"
                style="width:44px;height:44px;object-fit:cover;border-radius:12px;border:1px solid rgba(0,0,0,.08)"
              />
            </div>
          `,
        },
        {
          data: null,
          render: (d, t2, row) => `
            <div class="fw-semibold">${`${row?.first_name || ""} ${row?.last_name || ""}`.trim() || "-"}</div>
            <div class="small text-muted">${row?.email || row?.phone || "-"}</div>
            <div class="small mt-1">
              <span class="badge text-bg-${row?.member_type === "bureau" ? "warning" : "secondary"}">${row?.member_type || "member"}</span>
              ${currentFunctionNames(row) ? `<span class="ms-2 text-muted">${currentFunctionNames(row)}</span>` : ""}
            </div>
          `,
        },
        { data: "member_number", defaultContent: "", render: (value) => value || `<span class="text-muted small">-</span>` },
        { data: "axe", defaultContent: "", render: (value) => value?.name || `<span class="text-muted small">-</span>` },
        {
          data: null,
          defaultContent: "",
          render: (d, t2, row) => {
            const institution = row?.institution_name || "-";
            const field = row?.field_of_study || "-";
            return `
              <div>${institution}</div>
              <div class="small text-muted">${field}</div>
            `;
          },
        },
        { data: null, defaultContent: "", render: (d, t2, row) => row?.educationLevel?.name || row?.education_level?.name || `<span class="text-muted small">-</span>` },
        { data: "joined_at", defaultContent: "", render: (value) => formatDate(value) },
        { data: "status", render: (value) => `<span class="badge text-bg-light border text-dark text-uppercase">${value || "-"}</span>` },
        {
          data: null, orderable: false, searchable: false, className: "text-end", width: 180,
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
      navigate(`/admin/members/${id}`);
    });
    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      navigate(`/admin/members/${id}/edit`);
    });
    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const member = itemsRef.current.find((item) => String(getRowId(item)) === String(id));
      if (member) onDeleteAsk(member);
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
      await membersApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", t("members.toast.deleted", "Membre supprime."));
    } catch (error) {
      const message = error?.response?.data?.message || t("members.toast.deleteFailed", "Echec de la suppression.");
      showToast("danger", message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">{t("members.title", "Membres")}</h4>
          <div className="text-muted small">{t("members.subtitle", "Gestion des membres")}</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>
            {initialLoading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />{t("members.refreshing", "Rafraichissement...")}</> : <><i className="bi bi-arrow-clockwise me-2" />{t("members.refresh", "Rafraichir")}</>}
          </button>
          <button className="btn btn-dark" onClick={() => navigate("/admin/members/new")} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />{t("members.new", "Nouveau membre")}
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {initialLoading ? <div className="d-flex align-items-center gap-2 text-muted mb-3"><div className="spinner-border spinner-border-sm" />{t("members.loading", "Chargement...")}</div> : null}
          {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
          <div className="table-responsive">
            <table ref={tableRef} className="table align-middle mb-0 w-100">
              <thead>
                <tr className="text-muted small">
                    <th>{t("members.table.photo", "Photo")}</th>
                    <th>{t("members.table.name", "Nom complet")}</th>
                    <th>{t("members.table.number", "Numero")}</th>
                    <th>{t("members.table.axe", "Axe")}</th>
                    <th>{t("members.table.institution", "Institution / Filiere")}</th>
                    <th>{t("members.table.educationLevel", "Niveau")}</th>
                    <th>{t("members.table.joinedAt", "Date adhesion")}</th>
                    <th>{t("members.table.status", "Statut")}</th>
                    <th className="text-end" style={{ width: 180 }}>{t("members.table.actions", "Actions")}</th>
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
                <div className="modal-header"><h5 className="modal-title">{t("members.delete.title", "Confirmation")}</h5><button type="button" className="btn-close" onClick={closeDeleteModal} /></div>
                <div className="modal-body">{deleteTarget ? <p className="mb-0">{t("members.delete.message", "Supprimer le membre")} <b>{deleteTarget.first_name} {deleteTarget.last_name}</b> ?</p> : <p className="mb-0">{t("members.delete.message2", "Supprimer ce membre ?")}</p>}</div>
                <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={closeDeleteModal} disabled={deleting}>{t("members.modal.cancel", "Annuler")}</button><button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>{deleting ? <><span className="spinner-border spinner-border-sm me-2" />{t("members.delete.deleting", "Suppression...")}</> : t("members.delete.btn", "Supprimer")}</button></div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeDeleteModal} />
        </>
      ) : null}

      {toast.open ? (
        <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`toast show text-bg-${toast.type} border-0`}><div className="d-flex"><div className="toast-body">{toast.message}</div><button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((current) => ({ ...current, open: false }))} /></div></div>
        </div>
      ) : null}
    </div>
  );
}
