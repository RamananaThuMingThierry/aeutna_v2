import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { memberApplicationsApi } from "../../api/member-application";

const PAYMENT_NUMBERS = {
  orange_money: import.meta.env.VITE_ORANGE_MONEY_NUMBER || "",
  mvola: import.meta.env.VITE_MVOLA_NUMBER || "",
  airtel_money: import.meta.env.VITE_AIRTEL_MONEY_NUMBER || "",
};

function getSavedDraft() {
  try {
    return JSON.parse(sessionStorage.getItem("aeutna_membership_draft") || "null");
  } catch {
    return null;
  }
}

export default function MembershipPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [draft] = useState(() => location.state?.membershipForm || getSavedDraft());
  const [meta, setMeta] = useState(null);
  const [method, setMethod] = useState("mvola");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;
    memberApplicationsApi.publicMeta()
      .then((data) => {
        if (!mounted) return;
        setMeta(data);
        setMethod(data?.payment_methods?.find((item) => item.value === "mvola")?.value || data?.payment_methods?.[0]?.value || "mvola");
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || "Impossible de charger les moyens de paiement.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const selectedMethod = useMemo(
    () => (meta?.payment_methods || []).find((item) => item.value === method),
    [meta, method]
  );
  const activeFee = meta?.active_annual_fee || meta?.annual_fees?.find((fee) => fee.is_active) || null;

  async function confirmPayment(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = new FormData();
      Object.entries(draft).forEach(([key, value]) => { if (value !== "") payload.append(key, value); });
      payload.append("payment_method", method);
      payload.append("payment_reference", reference.trim());
      const response = await memberApplicationsApi.create(payload);
      sessionStorage.removeItem("aeutna_membership_draft");
      setSuccess(response?.message || "Votre demande et votre paiement ont été transmis à l’association.");
    } catch (err) {
      const validationError = Object.values(err?.response?.data?.errors || {}).flat().find(Boolean);
      setError(validationError || err?.response?.data?.message || "L’envoi de votre demande a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!draft) return <Navigate to="/?modal=membership" replace />;

  return (
    <main className="container membership-payment-page">
      <div className="membership-payment-heading">
        <span>Adhésion AEUTNA</span>
        <h1>Finaliser le paiement</h1>
        <p>Effectuez votre transfert Mobile Money, puis saisissez sa référence pour envoyer votre demande.</p>
      </div>

      {loading ? (
        <div className="membership-fee-summary is-loading">Chargement du montant de la cotisation…</div>
      ) : activeFee ? (
        <section className="membership-fee-summary" aria-label="Montant de la cotisation annuelle">
          <div><span>Montant de la cotisation</span><strong>{Number(activeFee.amount).toLocaleString("fr-FR")} Ar</strong></div>
          <div><span>Année de cotisation</span><strong>{activeFee.year}</strong></div>
        </section>
      ) : (
        <div className="alert alert-warning" role="status">Aucune cotisation annuelle active n’est configurée actuellement.</div>
      )}

      {success ? (
        <section className="membership-payment-success">
          <span><i className="bi bi-check2" /></span>
          <h2>Demande envoyée</h2>
          <p>{success}</p>
          <Link to="/" className="home-button home-button-primary">Retour à l’accueil</Link>
        </section>
      ) : (
        <div className="membership-payment-grid">
          <section className="membership-payment-details">
            <h2>Vos informations</h2>
            <dl>
              <div><dt>Nom</dt><dd>{draft.last_name} {draft.first_name}</dd></div>
              <div><dt>Email</dt><dd>{draft.email}</dd></div>
              <div><dt>Téléphone</dt><dd>{draft.phone}</dd></div>
            </dl>
            <Link to="/?modal=membership" className="membership-edit-link"><i className="bi bi-arrow-left" /> Modifier mes informations</Link>
          </section>

          <section className="membership-payment-form-card">
            <h2>Moyen de paiement</h2>
            {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
            {loading ? <div className="bureau-page-state"><span className="spinner-border spinner-border-sm" role="status" /> Chargement des moyens de paiement…</div> : (
              <form className="membership-payment-form" onSubmit={confirmPayment}>
                <label>Opérateur<select className="form-select home-contact-input" value={method} onChange={(event) => setMethod(event.target.value)} required>{(meta?.payment_methods || []).map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
                <div className="membership-payment-recipient">
                  <span>Numéro de réception {selectedMethod?.label || ""}</span>
                  <strong>{PAYMENT_NUMBERS[method] || "À renseigner"}</strong>
                  <small>{PAYMENT_NUMBERS[method] ? "Vérifiez le bénéficiaire AEUTNA avant de confirmer le transfert." : "Le numéro de paiement de cet opérateur n’est pas encore configuré."}</small>
                </div>
                <label>Référence du paiement<input className="form-control home-contact-input" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Référence reçue après le transfert" required /></label>
                <button type="submit" className="home-button home-button-primary" disabled={submitting || loading}>{submitting ? "Envoi en cours…" : "Confirmer et envoyer ma demande"} <i className={`bi ${submitting ? "bi-hourglass-split" : "bi-arrow-right"}`} /></button>
                <p className="membership-payment-hint">La demande sera transmise à l’administration pour validation.</p>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
