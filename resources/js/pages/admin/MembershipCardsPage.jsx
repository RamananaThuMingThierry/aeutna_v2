import React, { useEffect, useMemo, useRef, useState } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-bs5";

import { membershipCardsApi } from "../../api/membership-card";
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

function memberPhotoUrl(photo) {
  if (!photo) return "/images/avatar.png";
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `/${photo.replace(/^\/+/, "")}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function memberOptionLabel(member) {
  const fullName = `${member?.first_name || ""} ${member?.last_name || ""}`.trim();
  return `${member?.member_number || "-"} - ${fullName || "Membre"}`;
}

function currentYear() {
  return String(new Date().getFullYear());
}

function resolveGeneratedNumber(memberId, members) {
  const member = members.find((item) => String(item?.id) === String(memberId));
  const value = member?.member_number ? String(member.member_number) : "";
  return value;
}

export default function MembershipCardsPage() {
  const DT_LANG_URL = useMemo(() => "/lang/datatables/fr.json", []);
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  const [globalError, setGlobalError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    member_id: "",
    member_search: "",
    card_number: "",
    qr_code: "",
    issue_year: currentYear(),
    issued_at: todayIsoDate(),
    expires_at: "",
    status: "active",
    pdf_path: "",
  });
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

  function generateCardPdf(card) {
    const fullName = `${card?.member?.first_name || ""} ${card?.member?.last_name || ""}`.trim() || "Membre";
    const photo = `${window.location.origin}${memberPhotoUrl(card?.member?.photo)}`;
    const logo = `${window.location.origin}/images/logo_aeutna.jpg`;
    const qrValue = encodeURIComponent(card?.qr_code || card?.member?.member_number || card?.card_number || "");
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrValue}`;
    const issuedAt = formatDate(card?.issued_at);
    const expiresAt = formatDate(card?.expires_at);
    const popup = window.open("", "_blank", "width=900,height=700");

    if (!popup) {
      showToast("danger", "Le navigateur a bloque l'ouverture de la fenetre PDF.");
      return;
    }

    const html = `<!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Carte-${card?.card_number || "membre"}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 24px; background: #f4f1e8; font-family: Arial, sans-serif; color: #1f2937; }
            .sheet { display: flex; justify-content: center; }
            .card {
              width: 860px;
              min-height: 520px;
              border-radius: 28px;
              overflow: hidden;
              background: linear-gradient(135deg, #fff7db 0%, #f7ecd0 55%, #efe3bf 100%);
              border: 2px solid #cfb777;
              box-shadow: 0 20px 60px rgba(0,0,0,.12);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 28px 34px 20px;
              background: linear-gradient(90deg, #253a2c 0%, #35553f 100%);
              color: #fff;
            }
            .brand { display: flex; align-items: center; gap: 18px; }
            .brand img { width: 72px; height: 72px; object-fit: cover; border-radius: 50%; border: 3px solid rgba(255,255,255,.18); }
            .brand h1 { margin: 0; font-size: 28px; line-height: 1.1; }
            .brand p { margin: 4px 0 0; opacity: .85; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; }
            .badge { padding: 10px 14px; border-radius: 999px; background: rgba(255,255,255,.14); font-weight: 700; text-transform: uppercase; font-size: 12px; letter-spacing: .08em; }
            .content { display: grid; grid-template-columns: 190px 1fr 190px; gap: 28px; padding: 30px 34px 34px; align-items: start; }
            .photo { width: 190px; height: 220px; border-radius: 24px; overflow: hidden; background: #fff; border: 2px solid #dac590; }
            .photo img { width: 100%; height: 100%; object-fit: cover; }
            .main h2 { margin: 0 0 12px; font-size: 34px; color: #173024; }
            .subtitle { margin: 0 0 24px; color: #5c6b61; font-size: 14px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 22px; }
            .item { background: rgba(255,255,255,.55); border: 1px solid rgba(145, 119, 52, .18); border-radius: 18px; padding: 14px 16px; }
            .item .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #7a6a43; margin-bottom: 6px; }
            .item .value { font-size: 18px; font-weight: 700; color: #1b2a22; }
            .aside { display: flex; flex-direction: column; gap: 16px; }
            .qr {
              min-height: 220px;
              border-radius: 24px;
              border: 2px dashed #b39249;
              background: rgba(255,255,255,.7);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 18px;
              color: #69531d;
            }
            .qr img {
              width: 150px;
              height: 150px;
              object-fit: contain;
              display: block;
              margin: 0 auto 10px;
              background: #fff;
              padding: 8px;
              border-radius: 14px;
              border: 1px solid rgba(0,0,0,.08);
            }
            .qr strong { display: block; font-size: 20px; margin-top: 8px; color: #2b2410; }
            .footer {
              padding: 0 34px 28px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: #6b7280;
              font-size: 13px;
            }
            .note { max-width: 520px; }
            @media print {
              body { padding: 0; background: #fff; }
              .sheet { display: block; }
              .card { box-shadow: none; border-radius: 0; width: 100%; min-height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="card">
              <div class="header">
                <div class="brand">
                  <img src="${logo}" alt="AEUTNA" />
                  <div>
                    <h1>AEUTNA</h1>
                    <p>Carte officielle de membre</p>
                  </div>
                </div>
                <div class="badge">${card?.status || "active"}</div>
              </div>

              <div class="content">
                <div class="photo">
                  <img src="${photo}" alt="Photo membre" />
                </div>

                <div class="main">
                  <h2>${fullName}</h2>
                  <p class="subtitle">Association des Etudiants Universitaires et Travailleurs Natifs d'Antalaha</p>
                  <div class="grid">
                    <div class="item">
                      <div class="label">Numero membre</div>
                      <div class="value">${card?.member?.member_number || "-"}</div>
                    </div>
                    <div class="item">
                      <div class="label">Numero carte</div>
                      <div class="value">${card?.card_number || "-"}</div>
                    </div>
                    <div class="item">
                      <div class="label">Annee d'emission</div>
                      <div class="value">${card?.issue_year || "-"}</div>
                    </div>
                    <div class="item">
                      <div class="label">Date emission</div>
                      <div class="value">${issuedAt}</div>
                    </div>
                    <div class="item">
                      <div class="label">Date expiration</div>
                      <div class="value">${expiresAt}</div>
                    </div>
                    <div class="item">
                      <div class="label">Statut</div>
                      <div class="value">${card?.status || "-"}</div>
                    </div>
                  </div>
                </div>

                <div class="aside">
                  <div class="qr">
                    <div>
                      <img src="${qrImage}" alt="QR code membre" />
                      QR code membre
                      <strong>${card?.qr_code || "-"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div class="footer">
                <div class="note">Cette carte certifie l'appartenance du titulaire a l'AEUTNA pour la periode indiquee.</div>
                <div>www.aeutna.local</div>
              </div>
            </div>
          </div>
          <script>
            window.addEventListener("load", function () {
              setTimeout(function () {
                window.print();
              }, 250);
            });
          </script>
        </body>
      </html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  function resetForm() {
    setEditing(null);
    setForm({
      member_id: "",
      member_search: "",
      card_number: "",
      qr_code: "",
      issue_year: currentYear(),
      issued_at: todayIsoDate(),
      expires_at: "",
      status: "active",
      pdf_path: "",
    });
    setErrors({});
    setGlobalError("");
  }

  async function load({ mode = "refresh" } = {}) {
    if (mode === "initial") setInitialLoading(true);
    else setRefreshing(true);

    try {
      const [cardsList, membersList] = await Promise.all([
        membershipCardsApi.list(),
        membersApi.list(),
      ]);

      setItems(normalizeCollection(cardsList));
      setMembers(normalizeCollection(membersList));
    } catch (error) {
      const message = error?.response?.data?.message || "Impossible de charger les cartes membres.";
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
        $table.off("click", ".js-pdf");
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
          render: (d, t, row) => {
            const fullName = `${row?.member?.first_name || ""} ${row?.member?.last_name || ""}`.trim();
            return `
              <div class="fw-semibold">${fullName || "-"}</div>
              <div class="small text-muted">${row?.member?.member_number || "-"}</div>
            `;
          },
        },
        { data: "card_number", defaultContent: "" },
        { data: "issue_year", defaultContent: "" },
        { data: "issued_at", defaultContent: "", render: (v) => formatDate(v) },
        { data: "expires_at", defaultContent: "", render: (v) => formatDate(v) },
        {
          data: "status",
          render: (v) => {
            const badge = v === "active" ? "success" : v === "expired" ? "secondary" : "danger";
            return `<span class="badge text-bg-${badge}">${v || "-"}</span>`;
          },
        },
        {
          data: null,
          orderable: false,
          searchable: false,
          className: "text-end",
          width: 220,
          render: (d, t, row) => {
            const id = getRowId(row);
            return `<button class="btn btn-sm btn-outline-secondary me-2 js-pdf" data-id="${id}"><i class="bi bi-file-earmark-pdf"></i></button>
              <button class="btn btn-sm btn-outline-dark me-2 js-edit" data-id="${id}"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-sm btn-outline-danger js-del" data-id="${id}"><i class="bi bi-trash3"></i></button>`;
          },
        },
      ],
    });

    $table.on("click", ".js-pdf", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;
      generateCardPdf(item);
    });

    $table.on("click", ".js-edit", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;

      setEditing(item);
      setForm({
        member_id: item?.member_id ? String(item.member_id) : "",
        member_search: memberOptionLabel(item?.member),
        card_number: item?.card_number ?? item?.member?.member_number ?? "",
        qr_code: item?.qr_code ?? item?.member?.member_number ?? "",
        issue_year: item?.issue_year ? String(item.issue_year) : currentYear(),
        issued_at: item?.issued_at ? String(item.issued_at).slice(0, 10) : todayIsoDate(),
        expires_at: item?.expires_at ? String(item.expires_at).slice(0, 10) : "",
        status: item?.status ?? "active",
        pdf_path: item?.pdf_path ?? "",
      });
      setErrors({});
      setGlobalError("");
      setOpen(true);
    });

    $table.on("click", ".js-del", (event) => {
      const id = $(event.currentTarget).data("id");
      const item = itemsRef.current.find((x) => String(getRowId(x)) === String(id));
      if (!item) return;
      setDeleteTarget(item);
      setDeleteOpen(true);
    });

    return () => {
      try {
        $table.off("click", ".js-edit");
        $table.off("click", ".js-pdf");
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

    if (!form.member_id) {
      setErrors({ member_id: ["Selectionne un membre dans la liste proposee."] });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        member_id: Number(form.member_id),
        issue_year: Number(form.issue_year),
        issued_at: form.issued_at || null,
        expires_at: form.expires_at || null,
        status: form.status,
        pdf_path: form.pdf_path.trim() || null,
      };

      if (editing) await membershipCardsApi.update(getRowId(editing), payload);
      else await membershipCardsApi.create(payload);

      await load({ mode: "refresh" });
      setOpen(false);
      resetForm();
      showToast("success", editing ? "Carte membre mise a jour." : "Carte membre creee.");
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
      await membershipCardsApi.remove(getRowId(deleteTarget));
      await load({ mode: "refresh" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast("success", "Carte membre supprimee.");
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
          <h4 className="mb-1">Cartes membres</h4>
          <div className="text-muted small">Gestion des cartes d'adhesion des membres</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => void load({ mode: "refresh" })} disabled={initialLoading || refreshing}>
            {initialLoading || refreshing ? <><span className="spinner-border spinner-border-sm me-2" />Rafraichissement...</> : <><i className="bi bi-arrow-clockwise me-2" />Rafraichir</>}
          </button>
          <button className="btn btn-dark" onClick={() => { resetForm(); setOpen(true); }} disabled={initialLoading}>
            <i className="bi bi-plus-lg me-2" />Nouvelle carte
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
                  <th>Membre</th>
                  <th>Numero carte</th>
                  <th>Annee</th>
                  <th>Emise le</th>
                  <th>Expire le</th>
                  <th>Statut</th>
                  <th className="text-end" style={{ width: 220 }}>Actions</th>
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
                        list="membership-members-list"
                        className={`form-control ${errors.member_id ? "is-invalid" : ""}`}
                        value={form.member_search}
                        disabled={!!editing}
                        onChange={(e) => {
                          const value = e.target.value;
                          const selected = members.find((member) => memberOptionLabel(member) === value);
                          setForm((x) => ({
                            ...x,
                            member_search: value,
                            member_id: selected ? String(selected.id) : "",
                            card_number: selected?.member_number ? String(selected.member_number) : "",
                            qr_code: selected?.member_number ? String(selected.member_number) : "",
                          }));
                        }}
                        placeholder="Rechercher par numero, prenom ou nom"
                      />
                      <datalist id="membership-members-list">
                        {members.map((member) => <option key={member.id} value={memberOptionLabel(member)} />)}
                      </datalist>
                      {errors.member_id ? <span className="text-danger small">{errors.member_id[0]}</span> : null}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Numero carte</label>
                      <input className="form-control" value={form.card_number || resolveGeneratedNumber(form.member_id, members)} readOnly disabled />
                      <div className="form-text">Genere automatiquement depuis le numero membre.</div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">QR code</label>
                      <input className="form-control" value={form.qr_code || resolveGeneratedNumber(form.member_id, members)} readOnly disabled />
                      <div className="form-text">Utilise directement le numero membre.</div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Annee</label>
                        <input className={`form-control ${errors.issue_year ? "is-invalid" : ""}`} value={form.issue_year} onChange={(e) => setForm((x) => ({ ...x, issue_year: e.target.value }))} />
                        {errors.issue_year ? <span className="text-danger small">{errors.issue_year[0]}</span> : null}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Statut</label>
                        <select className={`form-select ${errors.status ? "is-invalid" : ""}`} value={form.status} onChange={(e) => setForm((x) => ({ ...x, status: e.target.value }))}>
                          <option value="active">active</option>
                          <option value="expired">expired</option>
                          <option value="revoked">revoked</option>
                        </select>
                        {errors.status ? <span className="text-danger small">{errors.status[0]}</span> : null}
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label">Emise le</label>
                        <input type="date" className={`form-control ${errors.issued_at ? "is-invalid" : ""}`} value={form.issued_at} onChange={(e) => setForm((x) => ({ ...x, issued_at: e.target.value, issue_year: e.target.value ? String(new Date(e.target.value).getFullYear()) : x.issue_year }))} />
                        {errors.issued_at ? <span className="text-danger small">{errors.issued_at[0]}</span> : null}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Expire le</label>
                        <input type="date" className={`form-control ${errors.expires_at ? "is-invalid" : ""}`} value={form.expires_at} onChange={(e) => setForm((x) => ({ ...x, expires_at: e.target.value }))} />
                        {errors.expires_at ? <span className="text-danger small">{errors.expires_at[0]}</span> : null}
                      </div>
                    </div>

                    <div className="mb-0 mt-3">
                      <label className="form-label">Chemin PDF</label>
                      <input className={`form-control ${errors.pdf_path ? "is-invalid" : ""}`} value={form.pdf_path} onChange={(e) => setForm((x) => ({ ...x, pdf_path: e.target.value }))} />
                      {errors.pdf_path ? <span className="text-danger small">{errors.pdf_path[0]}</span> : null}
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
                  <p className="mb-0">Supprimer la carte <b>{deleteTarget?.card_number}</b> ?</p>
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
