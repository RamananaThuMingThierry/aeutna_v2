import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { reportsApi } from "../../api/report";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("fr-FR");
}

function attendanceMethodLabel(value) {
  if (value === "qr_scan") return "QR code";
  if (value === "manual") return "Manuel";
  return value || "-";
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

function resolvePhotoUrl(photo) {
  if (!photo) return "/images/avatar.png";
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `/${photo.replace(/^\/+/, "")}`;
}

export default function DetailReportPage() {
  const { encryptedId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await reportsApi.show(encryptedId);
        if (!active) return;
        setReport(response?.report || null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.response?.data?.message || "Impossible de charger ce rapport.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [encryptedId]);

  if (loading) {
    return <div className="text-muted">Chargement...</div>;
  }

  if (error) {
    return <div className="alert alert-danger py-2">{error}</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">{report?.title || "Rapport"}</h3>
          <p className="text-secondary mb-0">{reportTypeLabel(report?.report_type)} · {formatDate(report?.report_date)}</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/reports" className="btn btn-outline-secondary">Retour</Link>
          <Link to={`/admin/reports/${encryptedId}/edit`} className="btn btn-dark">Modifier</Link>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="small text-uppercase fw-semibold text-secondary mb-1">Lieu</div>
                  <div>{report?.location || "-"}</div>
                </div>
                <div className="col-md-4">
                  <div className="small text-uppercase fw-semibold text-secondary mb-1">Horaire</div>
                  <div>{report?.start_time || "-"} {report?.end_time ? `- ${report.end_time}` : ""}</div>
                </div>
                <div className="col-md-4">
                  <div className="small text-uppercase fw-semibold text-secondary mb-1">Statut</div>
                  <div>{report?.status || "-"}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="small text-uppercase fw-semibold text-secondary mb-2">Objet</div>
                <div>{report?.subject || "-"}</div>
              </div>

              <div className="mb-4">
                <div className="small text-uppercase fw-semibold text-secondary mb-2">Ordre du jour</div>
                <div className="text-secondary" style={{ whiteSpace: "pre-wrap" }}>{report?.agenda || "-"}</div>
              </div>

              <div className="mb-4">
                <div className="small text-uppercase fw-semibold text-secondary mb-2">Contenu</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{report?.content || "-"}</div>
              </div>

              <div>
                <div className="small text-uppercase fw-semibold text-secondary mb-2">Resume des decisions</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{report?.decisions_summary || "-"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="small text-uppercase fw-semibold text-secondary mb-3">Redaction</div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <img src={resolvePhotoUrl(report?.writer?.avatar || "")} alt={report?.writer?.name || "Utilisateur"} className="rounded-circle object-fit-cover border" style={{ width: 46, height: 46 }} />
                <div>
                  <div className="fw-semibold">{report?.writer?.name || "Utilisateur inconnu"}</div>
                  <div className="small text-secondary">{report?.writer?.email || ""}</div>
                </div>
              </div>

              <div className="small text-uppercase fw-semibold text-secondary mb-3">Validation</div>
              {report?.approver ? (
                <div className="d-flex align-items-center gap-3">
                  <img src={resolvePhotoUrl(report?.approver?.avatar || "")} alt={report?.approver?.name || "Utilisateur"} className="rounded-circle object-fit-cover border" style={{ width: 46, height: 46 }} />
                  <div>
                    <div className="fw-semibold">{report?.approver?.name || "Utilisateur inconnu"}</div>
                    <div className="small text-secondary">{report?.approver?.email || ""}</div>
                  </div>
                </div>
              ) : <div className="text-secondary small">Aucune validation pour le moment.</div>}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="small text-uppercase fw-semibold text-secondary">Membres presents</div>
                <span className="badge text-bg-light border text-dark">{report?.attendances_count || report?.attendances?.length || 0}</span>
              </div>
              <div className="d-grid gap-2" style={{ maxHeight: 520, overflow: "auto" }}>
                {(report?.attendances || []).map((attendance) => (
                  <div key={attendance.id} className="border rounded-4 p-3">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={resolvePhotoUrl(attendance?.member?.photo || "")}
                        alt={`${attendance?.member?.first_name || ""} ${attendance?.member?.last_name || ""}`.trim() || "Membre"}
                        className="rounded-circle object-fit-cover border"
                        style={{ width: 40, height: 40 }}
                      />
                      <div>
                        <div className="fw-semibold">{`${attendance?.member?.first_name || ""} ${attendance?.member?.last_name || ""}`.trim() || "Membre"}</div>
                        <div className="small text-secondary">{attendance?.member?.member_type || "-"} · {attendance?.attendance_status || "present"}</div>
                        <div className="small text-secondary mt-1">
                          {attendanceMethodLabel(attendance?.entry_method)} Â· {formatDateTime(attendance?.check_in_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!report?.attendances?.length ? <div className="text-secondary small">Aucun membre present enregistre.</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
