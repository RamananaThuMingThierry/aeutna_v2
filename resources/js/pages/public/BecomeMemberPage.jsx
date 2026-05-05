import React, { useEffect, useMemo, useState } from "react";

import { memberApplicationsApi } from "../../api/member-application";

const paymentContactItems = [
  { label: "Orange Money", value: "+261 32 29 239 50", tone: "warning", icon: "bi-phone" },
  { label: "Mvola", value: "+261 38 29 239 50", tone: "success", icon: "bi-wallet2" },
  { label: "Airtel Money", value: "+261 33 29 239 50", tone: "danger", icon: "bi-sim" },
];

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  });
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function FieldError({ error }) {
  if (!error) return null;

  return <div className="text-danger small mt-1">{error}</div>;
}

function SectionBlockTitle({ title, text }) {
  return (
    <div className="col-12">
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-1">
        <h2 className="h5 fw-bold mb-0">{title}</h2>
      </div>
      {text ? <p className="text-secondary small mb-0">{text}</p> : null}
    </div>
  );
}

export default function BecomeMemberPage() {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    alternative_phone: "",
    gender: "",
    birth_date: "",
    birth_place: "",
    city: "",
    address: "",
    institution_name: "",
    field_of_study: "",
    facebook: "",
    cin: "",
    is_student: false,
    is_sympathizer: false,
    axis_id: "",
    education_level_id: "",
    payment_method: "mvola",
    payment_reference: "",
    payment_date: getTodayDate(),
    photo: null,
  });

  useEffect(() => {
    let active = true;

    async function loadMeta() {
      setLoading(true);
      setGlobalError("");

      try {
        const response = await memberApplicationsApi.publicMeta();
        if (!active) return;

        setMeta(response);

        if (response?.payment_methods?.[0]?.value) {
          setForm((current) => ({
            ...current,
            payment_method: current.payment_method || response.payment_methods[0].value,
          }));
        }
      } catch (error) {
        if (!active) return;
        setGlobalError(error?.response?.data?.message || "Impossible de charger le formulaire d adhesion.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMeta();

    return () => {
      active = false;
    };
  }, []);

  const activeAnnualFee = meta?.active_annual_fee;
  const paymentMethods = useMemo(() => meta?.payment_methods || [], [meta]);
  const axes = useMemo(() => meta?.axes || [], [meta]);
  const educationLevels = useMemo(() => meta?.education_levels || [], [meta]);
  const photoPreview = useMemo(() => (form.photo ? URL.createObjectURL(form.photo) : ""), [form.photo]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrors({});
    setGlobalError("");
    setSuccessMessage("");

    try {
      const payload = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "photo") {
          if (value) payload.append(key, value);
          return;
        }

        if (typeof value === "boolean") {
          payload.append(key, value ? "1" : "0");
          return;
        }

        if (value !== "" && value !== null && value !== undefined) {
          payload.append(key, value);
        }
      });

      payload.append("member_type", "member");

      const response = await memberApplicationsApi.create(payload);

      setSuccessMessage(response?.message || "Votre demande a ete envoyee.");
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        alternative_phone: "",
        gender: "",
        birth_date: "",
        birth_place: "",
        city: "",
        address: "",
        institution_name: "",
        field_of_study: "",
        facebook: "",
        cin: "",
        is_student: false,
        is_sympathizer: false,
        axis_id: "",
        education_level_id: "",
        payment_method: paymentMethods[0]?.value || "mvola",
        payment_reference: "",
        payment_date: getTodayDate(),
        photo: null,
      });
    } catch (error) {
      const data = error?.response?.data;

      if (data?.errors) {
        const nextErrors = {};
        Object.entries(data.errors).forEach(([key, value]) => {
          nextErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        setErrors(nextErrors);
      } else {
        setGlobalError(data?.message || "Impossible d envoyer la demande d adhesion.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="container py-5">Chargement...</div>;
  }

  return (
    <div>
      <section className="py-5 py-lg-6">
        <div className="container">
          <div
            className="rounded-2 overflow-hidden shadow-lg p-4 p-lg-5"
            style={{ background: "linear-gradient(135deg, rgba(17,94,89,0.96), rgba(194,65,12,0.88))" }}
          >
            <div className="row g-4 align-items-center">
              <div className="col-lg-8 text-white">
                <h1 className="fw-bold mb-3">Devenir membre de l'AEUTNA</h1>
                <p className="lead text-white-50 mb-0">
                  Remplissez votre dossier, envoyez votre reference de paiement et laissez l'administration vérifier
                  votre demande avant validation finale.
                </p>
              </div>
              <div className="col-lg-4">
                <div className="rounded-2 p-4 h-100" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)" }}>
                  <div className="small text-uppercase fw-semibold text-white-50 mb-2">Cotisation active</div>
                  <div className="text-white fw-bold mb-1">
                    {activeAnnualFee ? formatCurrency(activeAnnualFee.amount) : "-"}
                  </div>
                  <div className="text-white-50 small">
                    {activeAnnualFee?.year ? `Annee ${activeAnnualFee.year}` : "Montant defini par l administration"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-5 pb-lg-6">
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-lg-4">
              <div className="d-grid gap-3 position-sticky" style={{ top: "6rem" }}>
                <div className="p-4 rounded-2 shadow-sm" style={{ background: "var(--panel)" }}>
                  <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.12em", color: "var(--warm)" }}>
                    Comment ca marche
                  </div>
                  <div className="d-grid gap-3">
                    <div className="d-flex gap-3 align-items-start">
                      <div className="rounded-2ircle d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: 36, height: 36, background: "rgba(194,65,12,0.14)", color: "var(--warm)" }}>
                        1
                      </div>
                      <div>
                        <div className="fw-semibold">Remplir le formulaire</div>
                        <div className="text-secondary small">Ajoutez vos informations personnelles, universitaires et de contact.</div>
                      </div>
                    </div>

                    <div className="d-flex gap-3 align-items-start">
                      <div className="rounded-2ircle d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: 36, height: 36, background: "rgba(15,118,110,0.14)", color: "var(--accent-strong)" }}>
                        2
                      </div>
                      <div>
                        <div className="fw-semibold">Payer la cotisation</div>
                        <div className="text-secondary small">Utilisez un des numeros ci-dessous puis renseignez la reference du transfert.</div>
                      </div>
                    </div>

                    <div className="d-flex gap-3 align-items-start">
                      <div className="rounded-2ircle d-inline-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: 36, height: 36, background: "rgba(37,99,235,0.14)", color: "#2563eb" }}>
                        3
                      </div>
                      <div>
                        <div className="fw-semibold">Attendre la verification</div>
                        <div className="text-secondary small">L equipe administrative confirme votre paiement et valide votre adhesion.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2 shadow-sm" style={{ background: "var(--panel)" }}>
                  <div className="fw-semibold mb-3">Numeros de paiement</div>
                  <div className="d-grid gap-2">
                    {paymentContactItems.map((item) => (
                      <div
                        key={item.label}
                        className="d-flex align-items-center gap-3 p-3 rounded-2"
                        style={{ background: "var(--panel-strong)" }}
                      >
                        <div className={`rounded-2ircle d-inline-flex align-items-center justify-content-center text-${item.tone} bg-white flex-shrink-0`} style={{ width: 42, height: 42 }}>
                          <i className={`bi ${item.icon}`} />
                        </div>
                        <div>
                          <div className={`fw-semibold text-${item.tone}`}>{item.label}</div>
                          <div className="small text-secondary">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2 shadow-sm bg-success">
                  <div className="fw-semibold mb-2">Important</div>
                  <p className="text-white small mb-0">
                    La demande reste en attente tant que le paiement n est pas verifie. Veillez a joindre une photo nette
                    et a saisir la bonne reference.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="p-4 p-lg-5 rounded-2 shadow-sm" style={{ background: "var(--panel)" }}>
                {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
                {successMessage ? <div className="alert alert-success py-2">{successMessage}</div> : null}

                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-12">
                    <div className="card border-0 shadow-sm overflow-hidden" style={{ background: "var(--panel-strong)" }}>
                      <div className="card-body p-3 p-lg-4">
                        <div className="row g-3 align-items-center">
                          <div className="col-md-4 col-lg-3">
                            <div
                              className="rounded-2 overflow-hidden d-flex align-items-center justify-content-center h-100"
                              style={{
                                minHeight: 180,
                                background: photoPreview
                                  ? `center / cover no-repeat url(${photoPreview})`
                                  : "linear-gradient(135deg, rgba(17,94,89,0.12), rgba(194,65,12,0.12))",
                                border: "1px dashed rgba(17,94,89,0.24)",
                              }}
                            >
                              {!photoPreview ? (
                                <div className="text-center px-3">
                                  <div
                                    className="d-inline-flex align-items-center justify-content-center rounded-2ircle mb-3"
                                    style={{ width: 56, height: 56, background: "rgba(255,255,255,0.74)" }}
                                  >
                                    <i className="bi bi-camera fs-4" style={{ color: "var(--accent-strong)" }} />
                                  </div>
                                  <div className="fw-semibold">Photo du demandeur</div>
                                  <div className="small text-secondary">Ajoutez une image nette et recente.</div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="col-md-8 col-lg-9">
                            <div className="text-uppercase small fw-bold mb-2" style={{ letterSpacing: "0.12em", color: "var(--warm)" }}>
                              Photo de profil
                            </div>
                            <h3 className="h5 fw-bold mb-2">Importez votre image au debut du dossier</h3>
                            <p className="text-secondary mb-3">
                              Cette photo sera utilisee pour identifier rapidement votre candidature pendant la verification.
                            </p>
                            <label className="btn btn-outline-dark rounded-2ill px-4 mb-2">
                              <i className="bi bi-upload me-2" />
                              Choisir une image
                              <input
                                type="file"
                                accept="image/*"
                                className="d-none"
                                onChange={(event) => updateField("photo", event.target.files?.[0] || null)}
                              />
                            </label>
                            <div className="small text-secondary">
                              {form.photo ? `Fichier selectionne : ${form.photo.name}` : "Aucun fichier selectionne pour le moment."}
                            </div>
                            <FieldError error={errors.photo} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <SectionBlockTitle title="Paiement et piece jointe" text="La reference et la date du paiement sont necessaires pour le controle." />

                  <div className="col-md-6">
                    <label className="form-label">Moyen de paiement</label>
                    <select className={`form-select ${errors.payment_method ? "is-invalid" : ""}`} value={form.payment_method} onChange={(event) => updateField("payment_method", event.target.value)}>
                      {paymentMethods.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    <FieldError error={errors.payment_method} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Reference de paiement</label>
                    <input className={`form-control ${errors.payment_reference ? "is-invalid" : ""}`} value={form.payment_reference} onChange={(event) => updateField("payment_reference", event.target.value)} />
                    <FieldError error={errors.payment_reference} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Date de paiement</label>
                    <input
                      type="date"
                      className={`form-control ${errors.payment_date ? "is-invalid" : ""}`}
                      value={form.payment_date}
                      onChange={(event) => updateField("payment_date", event.target.value)}
                    />
                    <FieldError error={errors.payment_date} />
                  </div>

                  <SectionBlockTitle title="Informations personnelles" text="Les informations de base du membre demandeur." />

                  <div className="col-md-6">
                    <label className="form-label">Nom</label>
                    <input className={`form-control ${errors.last_name ? "is-invalid" : ""}`} value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
                    <FieldError error={errors.last_name} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Prénom</label>
                    <input className={`form-control ${errors.first_name ? "is-invalid" : ""}`} value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
                    <FieldError error={errors.first_name} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Genre</label>
                    <select className={`form-select ${errors.gender ? "is-invalid" : ""}`} value={form.gender} onChange={(event) => updateField("gender", event.target.value)}>
                      <option value="">Selectionner</option>
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                    </select>
                    <FieldError error={errors.gender} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">CIN</label>
                    <input className={`form-control ${errors.cin ? "is-invalid" : ""}`} value={form.cin} onChange={(event) => updateField("cin", event.target.value)} />
                    <FieldError error={errors.cin} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date de naissance</label>
                    <input type="date" className={`form-control ${errors.birth_date ? "is-invalid" : ""}`} value={form.birth_date} onChange={(event) => updateField("birth_date", event.target.value)} />
                    <FieldError error={errors.birth_date} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Lieu de naissance</label>
                    <input className={`form-control ${errors.birth_place ? "is-invalid" : ""}`} value={form.birth_place} onChange={(event) => updateField("birth_place", event.target.value)} />
                    <FieldError error={errors.birth_place} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Axe</label>
                    <select className={`form-select ${errors.axis_id ? "is-invalid" : ""}`} value={form.axis_id} onChange={(event) => updateField("axis_id", event.target.value)}>
                      <option value="">Selectionner</option>
                      {axes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <FieldError error={errors.axis_id} />
                  </div>
                  <SectionBlockTitle title="Contact et adresse" text="Les canaux permettant de vous joindre rapidement." />

                  <div className="col-md-6">
                    <label className="form-label">Téléphone</label>
                    <input className={`form-control ${errors.phone ? "is-invalid" : ""}`} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                    <FieldError error={errors.phone} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Téléphone alternatif</label>
                    <input className={`form-control ${errors.alternative_phone ? "is-invalid" : ""}`} value={form.alternative_phone} onChange={(event) => updateField("alternative_phone", event.target.value)} />
                    <FieldError error={errors.alternative_phone} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input type="email" className={`form-control ${errors.email ? "is-invalid" : ""}`} value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                    <FieldError error={errors.email} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Adresse</label>
                    <input className={`form-control ${errors.address ? "is-invalid" : ""}`} value={form.address} onChange={(event) => updateField("address", event.target.value)} />
                    <FieldError error={errors.address} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Facebook</label>
                    <input className={`form-control ${errors.facebook ? "is-invalid" : ""}`} value={form.facebook} onChange={(event) => updateField("facebook", event.target.value)} />
                    <FieldError error={errors.facebook} />
                  </div>
                  <SectionBlockTitle title="Parcours universitaire" text="Les informations utiles pour le suivi et le classement de votre adhésion." />

                  <div className="col-md-6">
                    <label className="form-label">Etablissement</label>
                    <input className={`form-control ${errors.institution_name ? "is-invalid" : ""}`} value={form.institution_name} onChange={(event) => updateField("institution_name", event.target.value)} />
                    <FieldError error={errors.institution_name} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Filière</label>
                    <input className={`form-control ${errors.field_of_study ? "is-invalid" : ""}`} value={form.field_of_study} onChange={(event) => updateField("field_of_study", event.target.value)} />
                    <FieldError error={errors.field_of_study} />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Niveau d'étude</label>
                    <select className={`form-select ${errors.education_level_id ? "is-invalid" : ""}`} value={form.education_level_id} onChange={(event) => updateField("education_level_id", event.target.value)}>
                      <option value="">Selectionner</option>
                      {educationLevels.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <FieldError error={errors.education_level_id} />
                  </div>
                  <div className="col-12">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label
                          className="d-flex align-items-start gap-3 p-3 rounded-2 h-100"
                          style={{ background: "var(--panel-strong)", border: "1px solid var(--line)", cursor: "pointer" }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input mt-1"
                            checked={form.is_student}
                            onChange={(event) => updateField("is_student", event.target.checked)}
                          />
                          <span>
                            <span className="d-block fw-semibold">Je suis etudiant(e)</span>
                            <span className="d-block text-secondary small">
                              Cochez cette case si vous êtes actuellement en etudes.
                            </span>
                          </span>
                        </label>
                        <FieldError error={errors.is_student} />
                      </div>
                      <div className="col-md-6">
                        <label
                          className="d-flex align-items-start gap-3 p-3 rounded-2 h-100"
                          style={{ background: "var(--panel-strong)", border: "1px solid var(--line)", cursor: "pointer" }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input mt-1"
                            checked={form.is_sympathizer}
                            onChange={(event) => updateField("is_sympathizer", event.target.checked)}
                          />
                          <span>
                            <span className="d-block fw-semibold">Je suis sympathisant(e)</span>
                            <span className="d-block text-secondary small">
                              Cochez cette case si vous soutenez l'association sans etre etudiant(e).
                            </span>
                          </span>
                        </label>
                        <FieldError error={errors.is_sympathizer} />
                      </div>
                    </div>
                  </div>

                  <div className="col-12 pt-2">
                    <button className="btn btn-dark rounded-2ill px-4" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Envoi en cours...
                        </>
                      ) : (
                        "Soumettre la demande"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
