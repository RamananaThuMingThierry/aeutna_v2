import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { membersApi } from "../../api/member";
import { useI18n } from "../../hooks/website/I18nContext";

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

function currentFunctionNames(member) {
  const items = Array.isArray(member?.current_member_functions) ? member.current_member_functions : [];
  const names = items.map((item) => item?.function?.name).filter(Boolean);
  return names.join(", ");
}

function paymentStatusBadge(status) {
  const map = {
    unpaid: "secondary",
    partial: "warning",
    paid: "success",
    cancelled: "danger",
  };

  return map[status] || "secondary";
}

function validationStatusBadge(status) {
  const map = {
    pending: "info",
    validated: "success",
    cancelled: "danger",
  };

  return map[status] || "secondary";
}

function DetailCard({ title, children }) {
  return (
    <div className="card border-0 bg-light shadow-none h-100">
      <div className="card-body p-4">
        <div className="small text-uppercase text-secondary fw-semibold mb-3">{title}</div>
        {children}
      </div>
    </div>
  );
}

function DetailItem({ label, value, children }) {
  return (
    <div className="mb-3">
      <div className="text-muted small">{label}</div>
      <div>{children ?? value ?? "-"}</div>
    </div>
  );
}

export default function DetailMemberPage() {
  const { encryptedId } = useParams();
  const { t } = useI18n();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await membersApi.show(encryptedId);
        if (!active) return;
        setMember(response?.member ?? null);
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.response?.data?.message || t("members.toast.loadFailed", "Impossible de charger le membre."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [encryptedId, t]);

  const hasMemberPhoto = Boolean(member?.photo);

  return (
    <div>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">Detail membre</h3>
          <p className="text-secondary mb-0">Fiche detaillee du membre et historique futur de ses operations.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/members" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2" />
            Retour a la liste
          </Link>
          <Link to={`/admin/members/${encryptedId}/edit`} className="btn btn-dark">
            <i className="bi bi-pencil-square me-2" />
            Modifier
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 text-muted">
              <div className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          </div>
        </div>
      ) : null}

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {!loading && !error && member ? (
        <div className="d-flex flex-column gap-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row g-4 align-items-center">
                <div className="col-md-auto">
                  <button
                    type="button"
                    className="rounded-4 overflow-hidden border bg-light-subtle d-flex align-items-center justify-content-center p-0"
                    style={{ width: "140px", height: "140px" }}
                    onClick={() => {
                      if (hasMemberPhoto) setPhotoModalOpen(true);
                    }}
                    disabled={!hasMemberPhoto}
                    title={hasMemberPhoto ? "Afficher l'image en grand" : "Aucune image disponible"}
                  >
                    <img src={resolvePhotoUrl(member.photo)} alt="Photo membre" className="w-100 h-100 object-fit-cover" />
                  </button>
                </div>

                <div className="col">
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="badge text-bg-light border text-dark text-uppercase">{member.status || "-"}</span>
                    <span className="badge text-bg-secondary">{member.member_number || "Sans numero"}</span>
                    <span className={`badge ${member.member_type === "bureau" ? "text-bg-warning" : "text-bg-secondary"}`}>
                      {member.member_type || "member"}
                    </span>
                  </div>
                  <h2 className="h3 mb-1">{[member.first_name, member.last_name].filter(Boolean).join(" ") || "-"}</h2>
                  <div className="text-secondary mb-2">{member.email || member.phone || "-"}</div>
                  <div className="small text-muted">
                    Adhesion: {formatDate(member.joined_at)} | Axe: {member.axe?.name || "-"} | Niveau: {member.educationLevel?.name || member.education_level?.name || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-xl-6">
              <DetailCard title="Identification">
                <DetailItem label="Prenom" value={member.first_name || "-"} />
                <DetailItem label="Nom" value={member.last_name || "-"} />
                <DetailItem label="Genre" value={member.gender || "-"} />
                <DetailItem label="Date naissance" value={formatDate(member.birth_date)} />
                <DetailItem label="Lieu naissance" value={member.birth_place || "-"} />
              </DetailCard>
            </div>

            <div className="col-xl-6">
              <DetailCard title="Contact">
                <DetailItem label="Email" value={member.email || "-"} />
                <DetailItem label="Telephone" value={member.phone || "-"} />
                <DetailItem label="Telephone alternatif" value={member.alternative_phone || "-"} />
                <DetailItem label="Adresse" value={member.address || "-"} />
                <DetailItem label="Ville / Region" value={[member.city, member.region].filter(Boolean).join(" / ") || "-"} />
              </DetailCard>
            </div>

            <div className="col-xl-6">
              <DetailCard title="Parcours">
                <DetailItem label="Institution" value={member.institution_name || "-"} />
                <DetailItem label="Filiere" value={member.field_of_study || "-"} />
                <DetailItem label="Etudiant" value={member.is_student ? "Oui" : "Non"} />
                <DetailItem label="Sympathisant" value={member.is_sympathizer ? "Oui" : "Non"} />
                <DetailItem label="Originaire d'Antalaha" value={member.is_from_antalaha ? "Oui" : "Non"} />
              </DetailCard>
            </div>

            <div className="col-xl-6">
              <DetailCard title="Adhesion">
                <DetailItem label="Numero membre" value={member.member_number || "-"} />
                <DetailItem label="Type de membre" value={member.member_type || "-"} />
                <DetailItem label="Fonctions actuelles" value={currentFunctionNames(member) || "-"} />
                <DetailItem label="Date adhesion" value={formatDate(member.joined_at)} />
                <DetailItem label="Axe" value={member.axe?.name || "-"} />
                <DetailItem label="Niveau d'education" value={member.educationLevel?.name || member.education_level?.name || "-"} />
              </DetailCard>
            </div>

            <div className="col-12">
              <DetailCard title="Notes">
                <div className="text-secondary" style={{ whiteSpace: "pre-wrap" }}>
                  {member.notes || t("members.show.noNotes", "Aucune note.")}
                </div>
              </DetailCard>
            </div>

            <div className="col-12">
              <DetailCard title="Cotisations et annulations">
                {Array.isArray(member.fee_payments) && member.fee_payments.length ? (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr className="text-muted small">
                          <th>Annee</th>
                          <th>Montant du</th>
                          <th>Montant paye</th>
                          <th>Paiement</th>
                          <th>Validation</th>
                          <th>Details</th>
                          <th>Suivi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {member.fee_payments.map((payment) => (
                          <tr key={payment.id}>
                            <td>{payment.annual_fee?.year || "-"}</td>
                            <td>{payment.amount_due || "-"}</td>
                            <td>{payment.amount_paid || "-"}</td>
                            <td>
                              <span className={`badge text-bg-${paymentStatusBadge(payment.payment_status)}`}>
                                {payment.payment_status || "-"}
                              </span>
                            </td>
                            <td>
                              <span className={`badge text-bg-${validationStatusBadge(payment.validation_status)}`}>
                                {payment.validation_status || "-"}
                              </span>
                            </td>
                            <td>
                              <div>{payment.payment_method || "-"}</div>
                              <div className="small text-muted">{payment.reference || "-"}</div>
                            </td>
                            <td>
                              {payment.validation_status === "cancelled" ? (
                                <>
                                  <div className="small">Annule par {payment.canceller?.name || "-"}</div>
                                  <div className="small text-muted">{payment.cancel_reason || "-"}</div>
                                </>
                              ) : payment.validation_status === "validated" ? (
                                <>
                                  <div className="small">Valide par {payment.validator?.name || "-"}</div>
                                  <div className="small text-muted">{formatDate(payment.validated_at || payment.paid_at)}</div>
                                </>
                              ) : (
                                <>
                                  <div className="small">En attente de validation</div>
                                  <div className="small text-muted">{formatDate(payment.paid_at)}</div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-secondary">Aucune cotisation enregistree pour ce membre.</div>
                )}
              </DetailCard>
            </div>
          </div>
        </div>
      ) : null}

      {photoModalOpen && hasMemberPhoto ? (
        <>
          <div className="modal fade show" style={{ display: "block" }} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header">
                  <h5 className="modal-title">Photo du membre</h5>
                  <button type="button" className="btn-close" onClick={() => setPhotoModalOpen(false)} />
                </div>
                <div className="modal-body text-center bg-body-tertiary">
                  <img
                    src={resolvePhotoUrl(member.photo)}
                    alt="Photo membre agrandie"
                    className="img-fluid rounded-4 shadow-sm d-inline-block"
                    style={{ maxHeight: "75vh", objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setPhotoModalOpen(false)} />
        </>
      ) : null}
    </div>
  );
}
