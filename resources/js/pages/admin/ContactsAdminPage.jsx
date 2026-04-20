import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { contactAdminApi } from "../../api/contact-admin";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContactsAdminPage() {
  const DT_LANG_URL = useMemo(() => "/lang/datatables/fr.json", []);
  const [items, setItems] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [showOpen, setShowOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showing, setShowing] = useState(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyErrors, setReplyErrors] = useState({});
  const [replyGlobalError, setReplyGlobalError] = useState("");
  const [replyForm, setReplyForm] = useState({
    response_subject: "",
    response_message: "",
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const list = await contactAdminApi.list();
      setItems(normalizeCollection(list));
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les messages de contact.";

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

  async function openShow(item) {
    setShowLoading(true);
    setShowing(item);
    setShowOpen(true);

    try {
      const data = await contactAdminApi.show(getRowId(item));
      setShowing(data?.contact || item);
    } catch {
      setShowing(item);
    } finally {
      setShowLoading(false);
    }
  }

  function closeShow() {
    setShowOpen(false);
    setShowing(null);
    setShowLoading(false);
  }

  function openReply(item) {
    setReplyTarget(item);
    setReplyForm({
      response_subject: item?.response_subject || `Re: ${item?.subject || ""}`.trim(),
      response_message: item?.response_message || "",
    });
    setReplyErrors({});
    setReplyGlobalError("");
    setReplyOpen(true);
  }

  function closeReply() {
    if (replying) return;
    setReplyOpen(false);
    setReplyTarget(null);
  }

  function openDelete(item) {
    setDeleteTarget(item);
    setDeleteOpen(true);
  }

  function closeDelete() {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteTarget(null);
  }

  useEffect(() => {
    if (initialLoading || !tableRef.current) return;

    const $table = $(tableRef.current);

    if (dtRef.current) {
      try {
        $table.off("click", ".js-show");
        $table.off("click", ".js-reply");
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
          render: (data, type, row) => `
            <div class="fw-semibold">${row?.name || "-"}</div>
            <div class="small text-muted">${row?.email || "-"}</div>
          `,
        },
        {
          data: "subject",
          render: (value, type, row) => `
            <div class="fw-semibold">${value || "-"}</div>
            <div class="small text-muted">${row?.phone || "-"}</div>
          `,
        },
        {
          data: "message",
          render: (value) => {
            const safe = String(value || "-");
            const preview = safe.length > 90 ? `${safe.slice(0, 90)}...` : safe;
            return `<div class="text-wrap" style="max-width:320px;">${preview}</div>`;
          },
        },
        {
          data: "responded_at",
          width: 140,
          render: (value) =>
            value
              ? `<span class="badge text-bg-success">Repondu</span>`
              : `<span class="badge text-bg-warning">En attente</span>`,
        },
        {
          data: "created_at",
          width: 180,
          render: (value) => formatDate(value),
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 220,
          render: (data, type, row) => {
            const id = getRowId(row);
            return `
              <button class="btn btn-sm btn-outline-primary me-2 js-show" data-id="${id}">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-dark me-2 js-reply" data-id="${id}">
                <i class="bi bi-reply-fill"></i>
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
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (item) void openShow(item);
    });

    $table.on("click", ".js-reply", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (item) openReply(item);
    });

    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (item) openDelete(item);
    });

    return () => {
      try {
        $table.off("click", ".js-show");
        $table.off("click", ".js-reply");
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

  async function submitReply(event) {
    event.preventDefault();
    if (!replyTarget || replying) return;

    setReplying(true);
    setReplyErrors({});
    setReplyGlobalError("");

    try {
      const response = await contactAdminApi.reply(getRowId(replyTarget), {
        response_subject: replyForm.response_subject.trim(),
        response_message: replyForm.response_message.trim(),
      });

      const updatedContact = response?.contact;

      setItems((current) =>
        current.map((item) => (String(getRowId(item)) === String(getRowId(replyTarget)) ? updatedContact : item))
      );
      setReplyOpen(false);
      setReplyTarget(null);
      showToast("success", response?.message || "Reponse envoyee avec succes.");
    } catch (error) {
      const data = error?.response?.data;

      if (data?.errors) {
        setReplyErrors(data.errors);
      } else {
        setReplyGlobalError(data?.message || "Impossible d envoyer la reponse.");
      }
    } finally {
      setReplying(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);

    try {
      const response = await contactAdminApi.remove(getRowId(deleteTarget));
      setItems((current) => current.filter((item) => String(getRowId(item)) !== String(getRowId(deleteTarget))));
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", response?.message || "Message de contact supprime avec succes.");
    } catch (error) {
      showToast("danger", error?.response?.data?.message || "Impossible de supprimer ce message.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
        <div>
          <h4 className="mb-1">Contacts</h4>
          <div className="text-muted small">Messages recus depuis le formulaire public, avec consultation, reponse et suppression.</div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>
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
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="border rounded-4 p-3 bg-light-subtle h-100">
            <div className="small text-uppercase text-secondary fw-semibold mb-2">Total</div>
            <div className="display-6 fw-bold mb-0">{items.length}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded-4 p-3 bg-light-subtle h-100">
            <div className="small text-uppercase text-secondary fw-semibold mb-2">En attente</div>
            <div className="display-6 fw-bold mb-0">{items.filter((item) => !item.responded_at).length}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded-4 p-3 bg-light-subtle h-100">
            <div className="small text-uppercase text-secondary fw-semibold mb-2">Repondus</div>
            <div className="display-6 fw-bold mb-0">{items.filter((item) => !!item.responded_at).length}</div>
          </div>
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
                  <th>Expediteur</th>
                  <th>Sujet</th>
                  <th>Message</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th className="text-end" style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </div>
      </div>

      {showOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail du message</h5>
                  <button type="button" className="btn-close" onClick={closeShow} />
                </div>
                <div className="modal-body">
                  {showLoading ? (
                    <div className="text-center py-4 text-secondary">Chargement...</div>
                  ) : showing ? (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">Message recu</div>
                          <div className="mb-3">
                            <div className="text-muted small">Nom</div>
                            <div className="fw-semibold">{showing.name || "-"}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Email</div>
                            <div className="fw-semibold">{showing.email || "-"}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Telephone</div>
                            <div className="fw-semibold">{showing.phone || "-"}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Sujet</div>
                            <div className="fw-semibold">{showing.subject || "-"}</div>
                          </div>
                          <div>
                            <div className="text-muted small">Message</div>
                            <div style={{ whiteSpace: "pre-line" }}>{showing.message || "-"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded-4 p-3 h-100">
                          <div className="small text-uppercase text-secondary fw-semibold mb-3">Reponse admin</div>
                          <div className="mb-3">
                            <div className="text-muted small">Statut</div>
                            <div>
                              {showing.responded_at ? <span className="badge text-bg-success">Repondu</span> : <span className="badge text-bg-warning">En attente</span>}
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Date de reception</div>
                            <div className="fw-semibold">{formatDate(showing.created_at)}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Date de reponse</div>
                            <div className="fw-semibold">{formatDate(showing.responded_at)}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Repondu par</div>
                            <div className="fw-semibold">{showing.responder?.name || "-"}</div>
                          </div>
                          <div className="mb-3">
                            <div className="text-muted small">Sujet de reponse</div>
                            <div className="fw-semibold">{showing.response_subject || "-"}</div>
                          </div>
                          <div>
                            <div className="text-muted small">Message de reponse</div>
                            <div style={{ whiteSpace: "pre-line" }}>{showing.response_message || "-"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeShow}>Fermer</button>
                  {showing ? <button type="button" className="btn btn-dark" onClick={() => { closeShow(); openReply(showing); }}>Repondre</button> : null}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeShow} />
        </>
      ) : null}

      {replyOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Repondre au message</h5>
                  <button type="button" className="btn-close" onClick={closeReply} />
                </div>
                <form onSubmit={submitReply}>
                  <div className="modal-body">
                    {replyGlobalError ? <div className="alert alert-danger py-2">{replyGlobalError}</div> : null}

                    <div className="rounded-4 border bg-light-subtle p-3 mb-3">
                      <div className="fw-semibold">{replyTarget?.name || "-"}</div>
                      <div className="small text-secondary mb-2">{replyTarget?.email || "-"}</div>
                      <div className="small"><strong>Sujet initial :</strong> {replyTarget?.subject || "-"}</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Sujet de reponse</label>
                      <input
                        className={`form-control ${replyErrors.response_subject ? "is-invalid" : ""}`}
                        value={replyForm.response_subject}
                        onChange={(event) => setReplyForm((current) => ({ ...current, response_subject: event.target.value }))}
                      />
                      {replyErrors.response_subject ? <div className="text-danger small mt-1">{replyErrors.response_subject[0]}</div> : null}
                    </div>

                    <div>
                      <label className="form-label">Message de reponse</label>
                      <textarea
                        rows="8"
                        className={`form-control ${replyErrors.response_message ? "is-invalid" : ""}`}
                        value={replyForm.response_message}
                        onChange={(event) => setReplyForm((current) => ({ ...current, response_message: event.target.value }))}
                      />
                      {replyErrors.response_message ? <div className="text-danger small mt-1">{replyErrors.response_message[0]}</div> : null}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeReply} disabled={replying}>Annuler</button>
                    <button className="btn btn-dark" disabled={replying}>
                      {replying ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Envoi...
                        </>
                      ) : (
                        "Envoyer la reponse"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeReply} />
        </>
      ) : null}

      {deleteOpen ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmer la suppression</h5>
                  <button type="button" className="btn-close" onClick={closeDelete} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    Supprimer le message de <b>{deleteTarget?.name || "-"}</b> ?
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeDelete} disabled={deleting}>Annuler</button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Suppression...
                      </>
                    ) : (
                      "Supprimer"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeDelete} />
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
