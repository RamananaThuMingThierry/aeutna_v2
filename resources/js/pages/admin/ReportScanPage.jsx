import React, { useEffect, useMemo, useRef, useState } from "react";
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

function resolvePhotoUrl(photo) {
  if (!photo) return "/images/avatar.png";
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `/${photo.replace(/^\/+/, "")}`;
}

export default function ReportScanPage() {
  const { encryptedId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [error, setError] = useState("");
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
      setError("");

      try {
        const response = await reportsApi.show(encryptedId);
        if (!active) return;
        setReport(response?.report || null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.response?.data?.message || "Impossible de charger ce rapport pour le scan.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
      stopScanner();
    };
  }, [encryptedId]);

  const latestAttendances = useMemo(() => {
    if (!Array.isArray(report?.attendances)) return [];
    return [...report.attendances].sort((left, right) => {
      const leftValue = left?.check_in_at ? new Date(left.check_in_at).getTime() : 0;
      const rightValue = right?.check_in_at ? new Date(right.check_in_at).getTime() : 0;
      return rightValue - leftValue;
    });
  }, [report]);

  async function submitScan(rawValue) {
    const qrValue = String(rawValue || "").trim();

    if (!qrValue || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await reportsApi.scanAttendance(encryptedId, {
        qr_value: qrValue,
        check_in_at: new Date().toISOString(),
      });

      setReport(response?.data || report);
      setScanMessage(response?.message || "Presence enregistree.");
      setQrInput("");
    } catch (submitError) {
      const apiError = submitError?.response?.data;
      const validationMessage = apiError?.errors?.qr_value?.[0];
      setError(validationMessage || apiError?.message || "Impossible d'enregistrer cette presence.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startScanner() {
    if (!window.BarcodeDetector) {
      setError("Le scan QR n'est pas supporte sur ce navigateur. Utilisez la saisie manuelle du numero du badge.");
      return;
    }

    try {
      setError("");
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
        if (!videoRef.current || scannerBusy || submitting) return;

        try {
          setScannerBusy(true);
          const codes = await detector.detect(videoRef.current);
          const firstCode = codes?.[0]?.rawValue;

          if (firstCode) {
            await submitScan(firstCode);
          }
        } catch (scanError) {
          setError(scanError?.message || "Impossible de lire le QR code pour le moment.");
        } finally {
          setScannerBusy(false);
        }
      }, 700);
    } catch (cameraError) {
      stopScanner();
      setError(cameraError?.message || "Impossible d'acceder a la camera.");
    }
  }

  function handleManualSubmit(event) {
    event.preventDefault();
    void submitScan(qrInput);
  }

  if (loading) {
    return <div className="text-muted">Chargement...</div>;
  }

  if (error && !report) {
    return <div className="alert alert-danger py-2">{error}</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">Scan des presences</h3>
          <p className="text-secondary mb-0">
            {report?.title || "Rapport"} · {formatDate(report?.report_date)}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/admin/reports/${encryptedId}`} className="btn btn-outline-secondary">Detail</Link>
          <Link to="/admin/reports" className="btn btn-outline-secondary">Retour</Link>
        </div>
      </div>

      {error ? <div className="alert alert-danger py-2">{error}</div> : null}
      {scanMessage ? <div className="alert alert-success py-2">{scanMessage}</div> : null}

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                <div>
                  <h5 className="mb-1">Scanner un badge</h5>
                  <div className="small text-secondary">Utilisez la camera du telephone ou saisissez le numero du badge.</div>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm ${scannerOpen ? "btn-outline-danger" : "btn-dark"}`}
                  onClick={() => {
                    if (scannerOpen) stopScanner();
                    else void startScanner();
                  }}
                >
                  {scannerOpen ? "Arreter" : "Ouvrir camera"}
                </button>
              </div>

              {scannerOpen ? (
                <div className="rounded-4 overflow-hidden border mb-3 bg-dark">
                  <video ref={videoRef} className="w-100 d-block" muted playsInline style={{ maxHeight: 360, objectFit: "cover" }} />
                </div>
              ) : null}

              <form className="row g-2" onSubmit={handleManualSubmit}>
                <div className="col-12 col-md-8">
                  <input
                    className="form-control"
                    placeholder="Numero du badge ou QR"
                    value={qrInput}
                    onChange={(event) => setQrInput(event.target.value)}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <button type="submit" className="btn btn-dark w-100" disabled={submitting}>
                    {submitting ? "Envoi..." : "Scanner"}
                  </button>
                </div>
              </form>

              <div className="small text-secondary mt-3">
                Pointages enregistres: <strong>{latestAttendances.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Presences enregistrees</h5>
                <span className="badge text-bg-light border text-dark">{latestAttendances.length}</span>
              </div>

              <div className="d-grid gap-2" style={{ maxHeight: 640, overflow: "auto" }}>
                {latestAttendances.map((attendance) => (
                  <div key={attendance.id} className="border rounded-4 p-3">
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={resolvePhotoUrl(attendance?.member?.photo || "")}
                        alt={`${attendance?.member?.first_name || ""} ${attendance?.member?.last_name || ""}`.trim() || "Membre"}
                        className="rounded-circle object-fit-cover border"
                        style={{ width: 46, height: 46 }}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-semibold">
                          {`${attendance?.member?.first_name || ""} ${attendance?.member?.last_name || ""}`.trim() || "Membre"}
                        </div>
                        <div className="small text-secondary">
                          {attendance?.member?.member_number || "-"} · {attendance?.member?.member_type || "-"}
                        </div>
                        <div className="small text-secondary mt-1">
                          QR code · {formatDateTime(attendance?.check_in_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {!latestAttendances.length ? (
                  <div className="text-secondary small">Aucun pointage enregistre pour le moment.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
