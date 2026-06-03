import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

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

export default function AnnualFeePaymentPage() {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [memberNumber, setMemberNumber] = useState("");
  const [member, setMember] = useState(null);
  
  const [form, setForm] = useState({
    member_id: "",
    annual_fee_id: "",
    payment_method: "mvola",
    reference: "",
    payment_date: getTodayDate(),
    amount_paid: "",
    proof: null,
    notes: "",
  });

  useEffect(() => {
    async function loadMeta() {
      try {
        const response = await axios.get("/api/public-fee-payments/meta");
        setMeta(response.data);
        if (response.data.annual_fees?.length > 0) {
          setForm(prev => ({ 
            ...prev, 
            annual_fee_id: response.data.annual_fees[0].id,
            amount_paid: response.data.annual_fees[0].amount
          }));
        }
      } catch (error) {
        setGlobalError("Impossible de charger les informations de paiement.");
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    
    if (name === "annual_fee_id" && meta?.annual_fees) {
      const selected = meta.annual_fees.find(f => f.id === parseInt(value));
      if (selected) {
        setForm(current => ({ ...current, amount_paid: selected.amount }));
      }
    }
  }

  async function handleSearchMember(e) {
    e.preventDefault();
    if (!memberNumber || searching) return;

    setSearching(true);
    setGlobalError("");
    setMember(null);
    setErrors({});

    try {
      const response = await axios.post("/api/public-fee-payments/search-member", { member_number: memberNumber });
      setMember(response.data.member);
      setForm(prev => ({ ...prev, member_id: response.data.member.id }));
    } catch (error) {
      setGlobalError(error.response?.data?.message || "Membre non trouve.");
    } finally {
      setSearching(false);
    }
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
        if (value !== null && value !== "") {
          payload.append(key, value);
        }
      });

      const response = await axios.post("/api/public-fee-payments", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccessMessage(response.data.message);
      setMember(null);
      setMemberNumber("");
      setForm({
        member_id: "",
        annual_fee_id: meta?.annual_fees?.[0]?.id || "",
        payment_method: "mvola",
        reference: "",
        payment_date: getTodayDate(),
        amount_paid: meta?.annual_fees?.[0]?.amount || "",
        proof: null,
        notes: "",
      });
    } catch (error) {
      const data = error.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setGlobalError(data?.message || "Une erreur est survenue lors de l'envoi du paiement.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container py-5 text-center"><span className="spinner-border"></span></div>;

  return (
    <div className="pb-5 pb-lg-6">
      <section className="py-5 py-lg-6 mb-4">
        <div className="container">
          <div
            className="rounded-2 overflow-hidden shadow-lg p-4 p-lg-5"
            style={{ background: "linear-gradient(135deg, rgba(15,118,110,0.96), rgba(17,94,89,0.88))" }}
          >
            <div className="row g-4 align-items-center">
              <div className="col-lg-8 text-white">
                <h1 className="fw-bold mb-3">Paiement de cotisation annuelle</h1>
                <p className="lead text-white-50 mb-0">
                  Espace reserve aux membres deja inscrits pour regulariser leur cotisation annuelle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="d-grid gap-3 position-sticky" style={{ top: "6rem" }}>
              <div className="p-4 rounded-2 shadow-sm" style={{ background: "var(--panel)" }}>
                <div className="fw-semibold mb-3">Numeros de paiement</div>
                <div className="d-grid gap-2">
                  {paymentContactItems.map((item) => (
                    <div key={item.label} className="d-flex align-items-center gap-3 p-3 rounded-2" style={{ background: "var(--panel-strong)" }}>
                      <div className={`rounded-circle d-inline-flex align-items-center justify-content-center text-${item.tone} bg-white flex-shrink-0`} style={{ width: 42, height: 42 }}>
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
              
              <div className="p-4 rounded-2 shadow-sm bg-info text-white">
                <div className="fw-bold mb-2"><i className="bi bi-info-circle me-2"></i> Aide</div>
                <p className="small mb-0">
                  Munissez-vous de votre numero de membre (ex: AEUTNA-2026-001) pour vous identifier.
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="p-4 p-lg-5 rounded-2 shadow-sm" style={{ background: "var(--panel)" }}>
              {globalError ? <div className="alert alert-danger py-2">{globalError}</div> : null}
              {successMessage ? <div className="alert alert-success py-2">{successMessage}</div> : null}

              {!member ? (
                <div className="mb-4">
                  <h2 className="h5 fw-bold mb-3">Etape 1 : Identifiez-vous</h2>
                  <form onSubmit={handleSearchMember} className="d-flex gap-2">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Votre numero de membre..." 
                      value={memberNumber}
                      onChange={e => setMemberNumber(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-dark" disabled={searching}>
                      {searching ? <span className="spinner-border spinner-border-sm"></span> : "Rechercher"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-2 bg-light border">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-uppercase small fw-bold text-secondary">Membre identifie</div>
                      <div className="h5 mb-0">{member.first_name} {member.last_name}</div>
                      <div className="small text-secondary">{member.member_number} | {member.email}</div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setMember(null)}>Changer</button>
                  </div>
                </div>
              )}

              {member && (
                <form onSubmit={handleSubmit} className="row g-3">
                  <h2 className="h5 fw-bold mb-0">Etape 2 : Details du paiement</h2>
                  
                  <div className="col-md-6">
                    <label className="form-label">Annee de cotisation</label>
                    <select 
                      className="form-select" 
                      value={form.annual_fee_id} 
                      onChange={e => updateField("annual_fee_id", e.target.value)}
                      required
                    >
                      {meta.annual_fees.map(f => (
                        <option key={f.id} value={f.id}>Cotisation {f.year} ({formatCurrency(f.amount)})</option>
                      ))}
                    </select>
                    <FieldError error={errors.annual_fee_id} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Montant paye (MGA)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={form.amount_paid} 
                      onChange={e => updateField("amount_paid", e.target.value)}
                      required
                    />
                    <FieldError error={errors.amount_paid} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Moyen de paiement</label>
                    <select 
                      className="form-select" 
                      value={form.payment_method} 
                      onChange={e => updateField("payment_method", e.target.value)}
                      required
                    >
                      {meta.payment_methods.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <FieldError error={errors.payment_method} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Reference de transaction</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: Ref MVola / OM..." 
                      value={form.reference} 
                      onChange={e => updateField("reference", e.target.value)}
                    />
                    <FieldError error={errors.reference} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Date du paiement</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={form.payment_date} 
                      onChange={e => updateField("payment_date", e.target.value)}
                      required
                    />
                    <FieldError error={errors.payment_date} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Preuve de paiement (Optionnel)</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      accept="image/*,.pdf" 
                      onChange={e => updateField("proof", e.target.files?.[0])}
                    />
                    <FieldError error={errors.proof} />
                    <div className="small text-secondary mt-1">Capture d'ecran ou scan (Max 2Mo)</div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Notes complementaires</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      value={form.notes} 
                      onChange={e => updateField("notes", e.target.value)}
                    ></textarea>
                  </div>

                  <div className="col-12 pt-3">
                    <button type="submit" className="btn btn-dark px-5 rounded-pill" disabled={submitting}>
                      {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi...</> : "Envoyer le paiement"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
