import React, { useEffect, useMemo, useState } from "react";

import { groupMessagesApi } from "../../api/group-message";
import { membersApi } from "../../api/member";

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR");
}

function normalizePhone(value) {
  if (!value) return "";
  let normalized = String(value).replace(/[^\d+]/g, "");
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`;
  return normalized;
}

function resolveAvatarUrl(avatar) {
  if (!avatar) return "/images/avatar.png";
  if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("/")) {
    return avatar;
  }

  const normalizedAvatar = avatar.replace(/^\/+/, "");

  if (normalizedAvatar.startsWith("uploads/")) {
    return `/${normalizedAvatar}`;
  }

  return `/storage/${normalizedAvatar}`;
}

function audienceLabel(value) {
  switch (value) {
    case "bureau":
      return "Bureau";
    case "member":
      return "Membres";
    case "all":
      return "Toutes";
    default:
      return value || "-";
  }
}

function historyAudienceLabel(item) {
  return audienceLabel(item?.target_label || (item?.target_type === "official_members" ? "member" : item?.target_type === "all_members" ? "all" : "bureau"));
}

export default function BulkMessagesPage() {
  const [members, setMembers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    audience_type: "all",
    title: "",
    content: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [membersResponse, historyResponse] = await Promise.all([
          membersApi.list(),
          groupMessagesApi.list(),
        ]);

        if (!active) return;

        setMembers(normalizeCollection(membersResponse));
        setHistory(Array.isArray(historyResponse?.messages) ? historyResponse.messages : []);
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.response?.data?.message || "Impossible de charger le module de messages.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    if (form.audience_type === "bureau") {
      return members.filter((member) => member?.member_type === "bureau");
    }

    if (form.audience_type === "member") {
      return members.filter((member) => member?.member_type === "member");
    }

    return members;
  }, [members, form.audience_type]);

  const recipients = useMemo(() => {
    return filteredMembers
      .map((member) => ({
        id: member.id,
        name: `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Membre",
        phone: normalizePhone(member.phone || member.alternative_phone || ""),
      }))
      .filter((member) => member.phone)
      .filter((member, index, array) => array.findIndex((item) => item.phone === member.phone) === index);
  }, [filteredMembers]);

  const missingPhonesCount = Math.max(filteredMembers.length - recipients.length, 0);
  const smsHref = useMemo(() => {
    if (!recipients.length || !form.content.trim()) return "";
    const numbers = recipients.map((item) => item.phone).join(",");
    return `sms:${numbers}?body=${encodeURIComponent(form.content.trim())}`;
  }, [recipients, form.content]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await groupMessagesApi.create({
        audience_type: form.audience_type,
        title: form.title.trim(),
        content: form.content.trim(),
      });

      setSuccess(response?.message || "Message prepare avec succes.");
      setHistory((current) => [response.group_message, ...current]);

      const directSmsHref = Array.isArray(response?.phone_numbers) && response.phone_numbers.length
        ? `sms:${response.phone_numbers.join(",")}?body=${encodeURIComponent(form.content.trim())}`
        : smsHref;

      if (directSmsHref) {
        window.location.href = directSmsHref;
      }
    } catch (sendError) {
      setError(sendError?.response?.data?.message || "Impossible de preparer ce message.");
    } finally {
      setSending(false);
    }
  }

  async function handleOpenHistory(item) {
    if (!item?.encrypted_id) return;

    setHistoryLoading(true);
    setError("");

    try {
      const response = await groupMessagesApi.show(item.encrypted_id);
      setSelectedMessage(response?.group_message || null);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "Impossible de charger ce detail.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleDeleteHistory() {
    if (!deleteTarget?.encrypted_id || deleteLoading) return;

    setDeleteLoading(true);
    setError("");

    try {
      const response = await groupMessagesApi.remove(deleteTarget.encrypted_id);
      setSuccess(response?.message || "Message supprime avec succes.");
      setHistory((current) => current.filter((item) => item.encrypted_id !== deleteTarget.encrypted_id));
      if (selectedMessage?.encrypted_id === deleteTarget.encrypted_id) {
        setSelectedMessage(null);
      }
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || "Impossible de supprimer ce message.");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return <div className="text-muted">Chargement...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="mb-1">Messages en masse</h4>
          <div className="text-muted small">
            Filtrez les membres, ecrivez votre message puis ouvrez l application SMS du mobile.
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              {success ? <div className="alert alert-success py-2">{success}</div> : null}

              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Type de destinataires</label>
                  <select
                    className="form-select"
                    value={form.audience_type}
                    onChange={(event) => setForm((current) => ({ ...current, audience_type: event.target.value }))}
                  >
                    <option value="all">Toutes</option>
                    <option value="member">Membres</option>
                    <option value="bureau">Bureau</option>
                  </select>
                </div>

                <div className="col-md-8">
                  <label className="form-label">Titre</label>
                  <input
                    className="form-control"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex: Reunion generale"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Message a envoyer</label>
                  <textarea
                    className="form-control"
                    rows="7"
                    value={form.content}
                    onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                    placeholder="Ecrivez le message qui sera pre-rempli dans l application SMS..."
                  />
                </div>

                <div className="col-12">
                  <div className="rounded-4 p-3" style={{ background: "rgba(15,23,42,0.04)" }}>
                    <div className="d-flex flex-wrap gap-3 mb-2">
                      <div>
                        <div className="small text-uppercase text-secondary fw-semibold">Filtre</div>
                        <div className="fw-semibold">{audienceLabel(form.audience_type)}</div>
                      </div>
                      <div>
                        <div className="small text-uppercase text-secondary fw-semibold">Membres trouves</div>
                        <div className="fw-semibold">{filteredMembers.length}</div>
                      </div>
                      <div>
                        <div className="small text-uppercase text-secondary fw-semibold">Numeros disponibles</div>
                        <div className="fw-semibold">{recipients.length}</div>
                      </div>
                      <div>
                        <div className="small text-uppercase text-secondary fw-semibold">Sans numero</div>
                        <div className="fw-semibold">{missingPhonesCount}</div>
                      </div>
                    </div>

                    <div className="small text-secondary">
                      L ouverture de l application SMS depend du mobile. Si trop de numeros sont inclus, certains appareils peuvent limiter la composition automatique.
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-dark" disabled={sending || !recipients.length || !form.content.trim()}>
                      {sending ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Preparation...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2" />
                          Envoyer via SMS
                        </>
                      )}
                    </button>

                    {smsHref ? (
                      <a className="btn btn-outline-secondary" href={smsHref}>
                        <i className="bi bi-phone me-2" />
                        Ouvrir directement
                      </a>
                    ) : null}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Apercu des destinataires</h5>
                <span className="badge text-bg-light border text-dark">{recipients.length}</span>
              </div>

              <div className="d-grid gap-2" style={{ maxHeight: 420, overflow: "auto" }}>
                {recipients.slice(0, 40).map((recipient) => (
                  <div key={`${recipient.id}-${recipient.phone}`} className="border rounded-4 p-3">
                    <div className="fw-semibold">{recipient.name}</div>
                    <div className="small text-secondary">{recipient.phone}</div>
                  </div>
                ))}
                {!recipients.length ? <div className="text-secondary small">Aucun destinataire avec numero disponible.</div> : null}
                {recipients.length > 40 ? (
                  <div className="small text-secondary">Et {recipients.length - 40} autre(s) destinataire(s)...</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h5 className="mb-3">Historique des messages prepares</h5>
          <div className="row g-3">
            {history.map((item) => (
              <div key={item.id} className="col-12 col-xl-6">
                <div className="border rounded-4 p-3 h-100">
                  <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                    <div>
                      <div className="fw-semibold">{item.title || "Message sans titre"}</div>
                      <div className="small text-secondary">{historyAudienceLabel(item)}</div>
                    </div>
                    <span className="badge text-bg-light border text-dark">
                      {item.recipients_count || 0} destinataire(s)
                    </span>
                  </div>
                  <div className="small text-secondary mb-2">
                    {formatDate(item.sent_at || item.created_at)}
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <img
                      src={resolveAvatarUrl(item?.sender?.avatar || "")}
                      alt={item?.sender?.name || "Utilisateur"}
                      className="rounded-circle object-fit-cover border"
                      style={{ width: 34, height: 34 }}
                    />
                    <div>
                      <div className="small fw-semibold">{item?.sender?.name || "Utilisateur inconnu"}</div>
                      <div className="small text-secondary">{item?.sender?.email || ""}</div>
                    </div>
                  </div>
                  <p className="mb-3 text-secondary">
                    {item.content}
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => void handleOpenHistory(item)} disabled={historyLoading}>
                      <i className="bi bi-eye me-2" />
                      Details
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(item)} disabled={deleteLoading}>
                      <i className="bi bi-trash3 me-2" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!history.length ? <div className="col-12 text-secondary small">Aucun message enregistre pour le moment.</div> : null}
          </div>
        </div>
      </div>

      {selectedMessage ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Detail du message</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedMessage(null)} />
                </div>
                <div className="modal-body">
                  <div className="row g-4">
                    <div className="col-lg-5">
                      <div className="rounded-4 border p-3 h-100">
                        <div className="small text-uppercase fw-semibold text-secondary mb-2">Informations</div>
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <img
                            src={resolveAvatarUrl(selectedMessage?.sender?.avatar || "")}
                            alt={selectedMessage?.sender?.name || "Utilisateur"}
                            className="rounded-circle object-fit-cover border"
                            style={{ width: 48, height: 48 }}
                          />
                          <div>
                            <div className="fw-semibold">{selectedMessage?.sender?.name || "Utilisateur inconnu"}</div>
                            <div className="small text-secondary">{selectedMessage?.sender?.email || ""}</div>
                          </div>
                        </div>
                        <div className="fw-semibold mb-1">{selectedMessage.title || "Message sans titre"}</div>
                        <div className="small text-secondary mb-3">{historyAudienceLabel(selectedMessage)}</div>
                        <div className="small text-secondary mb-3">{formatDate(selectedMessage.sent_at || selectedMessage.created_at)}</div>
                        <div className="small text-uppercase fw-semibold text-secondary mb-2">Message</div>
                        <p className="mb-0 text-secondary">{selectedMessage.content}</p>
                      </div>
                    </div>
                    <div className="col-lg-7">
                      <div className="rounded-4 border p-3">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="small text-uppercase fw-semibold text-secondary">Destinataires</div>
                          <span className="badge text-bg-light border text-dark">
                            {selectedMessage.recipients_count || selectedMessage.recipients?.length || 0}
                          </span>
                        </div>

                        <div className="d-grid gap-2" style={{ maxHeight: 420, overflow: "auto" }}>
                          {(selectedMessage.recipients || []).map((recipient) => (
                            <div key={recipient.id} className="border rounded-4 p-3">
                              <div className="fw-semibold">
                                {recipient.member ? `${recipient.member.first_name || ""} ${recipient.member.last_name || ""}`.trim() : "Membre"}
                              </div>
                              <div className="small text-secondary">
                                {recipient.member?.member_type || "-"} · {normalizePhone(recipient.member?.phone || recipient.member?.alternative_phone || "") || "-"}
                              </div>
                            </div>
                          ))}
                          {!selectedMessage.recipients?.length ? <div className="text-secondary small">Aucun destinataire trouve.</div> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setSelectedMessage(null)} />
        </>
      ) : null}

      {deleteTarget ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Supprimer ce message</h5>
                  <button type="button" className="btn-close" onClick={() => !deleteLoading && setDeleteTarget(null)} />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    Supprimer le message <b>{deleteTarget.title || "Message sans titre"}</b> ?
                  </p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                    Annuler
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => void handleDeleteHistory()} disabled={deleteLoading}>
                    {deleteLoading ? (
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
          <div className="modal-backdrop fade show" onClick={() => !deleteLoading && setDeleteTarget(null)} />
        </>
      ) : null}
    </div>
  );
}
