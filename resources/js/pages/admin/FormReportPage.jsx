import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { membersApi } from "../../api/member";
import { reportsApi } from "../../api/report";

const REPORT_TYPES = [
  { value: "bureau_meeting", label: "Reunion bureau" },
  { value: "general_meeting", label: "Reunion generale" },
  { value: "gathering", label: "Rassemblement" },
  { value: "celebration", label: "Fete" },
  { value: "event", label: "Evenement" },
  { value: "other", label: "Autre" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "validated", label: "Valide" },
  { value: "archived", label: "Archive" },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function normalizeDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function emptyForm() {
  return {
    title: "",
    report_type: "bureau_meeting",
    report_date: todayIsoDate(),
    start_time: "",
    end_time: "",
    location: "",
    subject: "",
    agenda: "",
    content: "",
    decisions_summary: "",
    status: "draft",
    is_confidential: true,
    member_ids: [],
    scanned_entries: [],
  };
}

function resolvePhotoUrl(photo) {
  if (!photo) return "/images/avatar.png";
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `/${photo.replace(/^\/+/, "")}`;
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card border-0 bg-light shadow-none h-100">
      <div className="card-body p-4">
        <div className="mb-4">
          <h5 className="mb-1">{title}</h5>
          {subtitle ? <p className="text-muted small mb-0">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldError({ error }) {
  return error ? <span className="text-danger small d-block mt-1">{error[0]}</span> : null;
}

export default function FormReportPage() {
  const { encryptedId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(encryptedId);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberTypeFilter, setMemberTypeFilter] = useState("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [form, setForm] = useState(emptyForm());
  const videoRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerTimerRef = useRef(null);

  function stopScanner() {
    if (scannerTimerRef.current) {
      window.clearInterval(scannerTimerRef.current);
      scannerTimerRef.current = null;
    }

    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerOpen(false);
    setScannerBusy(false);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setGlobalError("");

      try {
        const [membersResponse, reportResponse] = await Promise.all([
          membersApi.list({ with_trashed: 0 }),
          isEdit ? reportsApi.show(encryptedId) : Promise.resolve(null),
        ]);

        if (!active) return;

        setMembers(normalizeCollection(membersResponse));

        if (reportResponse?.report) {
          const report = reportResponse.report;
          setForm({
            title: report?.title ?? "",
            report_type: report?.report_type ?? "bureau_meeting",
            report_date: normalizeDateInput(report?.report_date) || todayIsoDate(),
            start_time: report?.start_time ?? "",
            end_time: report?.end_time ?? "",
            location: report?.location ?? "",
            subject: report?.subject ?? "",
            agenda: report?.agenda ?? "",
            content: report?.content ?? "",
            decisions_summary: report?.decisions_summary ?? "",
            status: report?.status ?? "draft",
            is_confidential: report?.is_confidential ?? true,
            member_ids: Array.isArray(report?.attendances) ? report.attendances.map((item) => String(item.member_id)) : [],
            scanned_entries: Array.isArray(report?.attendances)
              ? report.attendances
                .filter((item) => item?.entry_method === "qr_scan")
                .map((item) => ({
                  member_id: Number(item.member_id),
                  check_in_at: item?.check_in_at || null,
                }))
              : [],
          });
        }
      } catch (error) {
        if (!active) return;
        setGlobalError(error?.response?.data?.message || "Impossible de charger le formulaire rapport.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      stopScanner();
    };
  }, [encryptedId, isEdit]);

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleMember(memberId) {
    setForm((current) => {
      const next = new Set(current.member_ids);
      let nextScannedEntries = current.scanned_entries;

      if (next.has(String(memberId))) {
        next.delete(String(memberId));
        nextScannedEntries = current.scanned_entries.filter((entry) => Number(entry.member_id) !== Number(memberId));
      } else {
        next.add(String(memberId));
      }

      return {
        ...current,
        member_ids: Array.from(next),
        scanned_entries: nextScannedEntries,
      };
    });
  }

  function findMemberByQrValue(value) {
    const normalizedValue = String(value || "").trim().toLowerCase();
    if (!normalizedValue) return null;

    return members.find((member) => String(member?.member_number || "").trim().toLowerCase() === normalizedValue) || null;
  }

  function markMemberPresentByScan(rawValue) {
    const member = findMemberByQrValue(rawValue);

    if (!member) {
      setScanMessage("Aucun membre trouve pour ce QR code ou numero de membre.");
      return;
    }

    const checkInAt = new Date().toISOString();
    const memberLabel = `${member.first_name || ""} ${member.last_name || ""}`.trim() || "Membre";

    setForm((current) => {
      const memberId = String(member.id);
      const nextMemberIds = current.member_ids.includes(memberId)
        ? current.member_ids
        : [...current.member_ids, memberId];
      const hasScanEntry = current.scanned_entries.some((entry) => Number(entry.member_id) === Number(member.id));
      const nextScannedEntries = hasScanEntry
        ? current.scanned_entries.map((entry) => (
          Number(entry.member_id) === Number(member.id)
            ? { ...entry, check_in_at: checkInAt }
            : entry
        ))
        : [...current.scanned_entries, { member_id: Number(member.id), check_in_at: checkInAt }];

      return {
        ...current,
        member_ids: nextMemberIds,
        scanned_entries: nextScannedEntries,
      };
    });

    setScanMessage(`${memberLabel} marque present par QR.`);
  }

  async function startScanner() {
    if (!window.BarcodeDetector) {
      setGlobalError("Le scan QR n'est pas supporte sur ce navigateur. Utilisez la saisie manuelle du numero de badge.");
      return;
    }

    try {
      setGlobalError("");
      setScanMessage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      scannerStreamRef.current = stream;
      setScannerOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      scannerTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current || scannerBusy) return;

        try {
          setScannerBusy(true);
          const codes = await detector.detect(videoRef.current);
          const firstCode = codes?.[0]?.rawValue;

          if (firstCode) {
            markMemberPresentByScan(firstCode);
          }
        } catch (scanError) {
          setScanMessage(scanError?.message || "Impossible de lire le QR code pour le moment.");
        } finally {
          setScannerBusy(false);
        }
      }, 700);
    } catch (error) {
      stopScanner();
      setGlobalError(error?.message || "Impossible d'acceder a la camera pour le scan QR.");
    }
  }

  function handleManualQrSubmit(event) {
    event.preventDefault();

    if (!qrInput.trim()) {
      setScanMessage("Entrez d'abord le numero ou le code QR du badge.");
      return;
    }

    markMemberPresentByScan(qrInput.trim());
    setQrInput("");
  }

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();

    return members.filter((member) => {
      if (memberTypeFilter !== "all" && member?.member_type !== memberTypeFilter) {
        return false;
      }

      if (!query) return true;

      const fullName = `${member?.first_name || ""} ${member?.last_name || ""}`.trim().toLowerCase();
      const email = String(member?.email || "").toLowerCase();
      const phone = String(member?.phone || member?.alternative_phone || "").toLowerCase();

      return fullName.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [members, memberQuery, memberTypeFilter]);

  const scannedEntriesMap = useMemo(() => (
    new Map(form.scanned_entries.map((entry) => [String(entry.member_id), entry]))
  ), [form.scanned_entries]);

  async function onSubmit(event) {
    event.preventDefault();
    setErrors({});
    setGlobalError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        member_ids: form.member_ids.map((value) => Number(value)),
        scanned_entries: form.scanned_entries.map((entry) => ({
          member_id: Number(entry.member_id),
          check_in_at: entry.check_in_at,
        })),
      };

      if (isEdit) {
        await reportsApi.update(encryptedId, payload);
      } else {
        await reportsApi.create(payload);
      }

      navigate("/admin/reports", {
        replace: true,
      });
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || "Echec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-muted">Chargement...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">{isEdit ? "Modifier rapport" : "Nouveau rapport"}</h3>
          <p className="text-secondary mb-0">Contenu de reunion et liste des membres presents.</p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin/reports" className="btn btn-outline-secondary">
            Retour
          </Link>
        </div>
      </div>

      {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}

      <form onSubmit={onSubmit} className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="d-grid gap-4">
            <SectionCard title="Informations generales" subtitle="Base du rapport de reunion ou d evenement interne">
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">Titre</label>
                  <input className="form-control" name="title" value={form.title} onChange={handleFormChange} />
                  <FieldError error={errors.title} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Type</label>
                  <select className="form-select" name="report_type" value={form.report_type} onChange={handleFormChange}>
                    {REPORT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <FieldError error={errors.report_type} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" name="report_date" value={form.report_date} onChange={handleFormChange} />
                  <FieldError error={errors.report_date} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Heure debut</label>
                  <input type="time" className="form-control" name="start_time" value={form.start_time} onChange={handleFormChange} />
                  <FieldError error={errors.start_time} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Heure fin</label>
                  <input type="time" className="form-control" name="end_time" value={form.end_time} onChange={handleFormChange} />
                  <FieldError error={errors.end_time} />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Lieu</label>
                  <input className="form-control" name="location" value={form.location} onChange={handleFormChange} />
                  <FieldError error={errors.location} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Statut</label>
                  <select className="form-select" name="status" value={form.status} onChange={handleFormChange}>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <FieldError error={errors.status} />
                </div>
                <div className="col-12">
                  <label className="form-label">Objet</label>
                  <input className="form-control" name="subject" value={form.subject} onChange={handleFormChange} />
                  <FieldError error={errors.subject} />
                </div>
                <div className="col-12">
                  <label className="form-label">Ordre du jour</label>
                  <textarea className="form-control" rows="4" name="agenda" value={form.agenda} onChange={handleFormChange} />
                  <FieldError error={errors.agenda} />
                </div>
                <div className="col-12">
                  <label className="form-label">Contenu du rapport</label>
                  <textarea className="form-control" rows="8" name="content" value={form.content} onChange={handleFormChange} />
                  <FieldError error={errors.content} />
                </div>
                <div className="col-12">
                  <label className="form-label">Resume des decisions</label>
                  <textarea className="form-control" rows="5" name="decisions_summary" value={form.decisions_summary} onChange={handleFormChange} />
                  <FieldError error={errors.decisions_summary} />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="report-confidential" name="is_confidential" checked={form.is_confidential} onChange={handleFormChange} />
                    <label className="form-check-label" htmlFor="report-confidential">
                      Rapport confidentiel
                    </label>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <SectionCard title="Membres presents" subtitle="Selectionnez les membres presents a cette reunion">
            <div className="border rounded-4 p-3 mb-3 bg-white">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <div className="fw-semibold">Presence par QR code</div>
                  <div className="small text-secondary">Scannez le badge ou saisissez le numero du membre.</div>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm ${scannerOpen ? "btn-outline-danger" : "btn-outline-dark"}`}
                  onClick={() => {
                    if (scannerOpen) stopScanner();
                    else void startScanner();
                  }}
                >
                  {scannerOpen ? "Arreter le scan" : "Ouvrir le scan"}
                </button>
              </div>

              {scannerOpen ? (
                <div className="rounded-4 overflow-hidden border mb-3 bg-dark">
                  <video ref={videoRef} className="w-100 d-block" muted playsInline style={{ maxHeight: 260, objectFit: "cover" }} />
                </div>
              ) : null}

              <form className="row g-2" onSubmit={handleManualQrSubmit}>
                <div className="col-12 col-md-8">
                  <input
                    className="form-control"
                    placeholder="Numero du badge ou contenu du QR"
                    value={qrInput}
                    onChange={(event) => setQrInput(event.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <button type="submit" className="btn btn-dark w-100">
                    Marquer present
                  </button>
                </div>
              </form>

              {scanMessage ? <div className="small text-secondary mt-2">{scanMessage}</div> : null}
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-7">
                <input
                  className="form-control"
                  placeholder="Rechercher un membre"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                />
              </div>
              <div className="col-md-5">
                <select className="form-select" value={memberTypeFilter} onChange={(event) => setMemberTypeFilter(event.target.value)}>
                  <option value="all">Tous</option>
                  <option value="bureau">Bureau</option>
                  <option value="member">Membres</option>
                </select>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="small text-secondary">{form.member_ids.length} membre(s) selectionne(s)</div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setForm((current) => ({ ...current, member_ids: filteredMembers.map((member) => String(member.id)) }))}
              >
                Tout selectionner
              </button>
            </div>

            <div className="d-grid gap-2" style={{ maxHeight: 560, overflow: "auto" }}>
              {filteredMembers.map((member) => {
                const checked = form.member_ids.includes(String(member.id));
                const scannedEntry = scannedEntriesMap.get(String(member.id));

                return (
                  <label key={member.id} className="d-flex align-items-center gap-3 border rounded-4 p-3" style={{ cursor: "pointer" }}>
                    <input type="checkbox" className="form-check-input mt-0" checked={checked} onChange={() => toggleMember(member.id)} />
                    <img
                      src={resolvePhotoUrl(member.photo)}
                      alt={`${member.first_name || ""} ${member.last_name || ""}`.trim() || "Membre"}
                      className="rounded-circle object-fit-cover border"
                      style={{ width: 42, height: 42 }}
                    />
                    <span className="flex-grow-1">
                      <span className="d-block fw-semibold">{`${member.first_name || ""} ${member.last_name || ""}`.trim() || "Membre"}</span>
                      <span className="d-block small text-secondary">{member.member_type || "member"} · {member.email || member.phone || "-"}</span>
                      {scannedEntry ? (
                        <span className="d-inline-flex align-items-center gap-2 mt-2">
                          <span className="badge text-bg-dark">QR</span>
                          <span className="small text-secondary">
                            Pointe le {new Date(scannedEntry.check_in_at || Date.now()).toLocaleString("fr-FR")}
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
              {!filteredMembers.length ? <div className="text-secondary small">Aucun membre trouve pour ce filtre.</div> : null}
            </div>

            <FieldError error={errors.member_ids} />
          </SectionCard>
        </div>

        <div className="col-12">
          <div className="d-flex gap-2 justify-content-end">
            <Link to="/admin/reports" className="btn btn-outline-secondary">Annuler</Link>
            <button className="btn btn-dark" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</> : (isEdit ? "Mettre a jour" : "Enregistrer")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
