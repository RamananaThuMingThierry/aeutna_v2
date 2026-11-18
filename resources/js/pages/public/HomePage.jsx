import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { websiteApi } from "../../api/website";
import { submitContactApi } from "../../api/contact";
import { memberApplicationsApi } from "../../api/member-application";
import { publicFeePaymentsApi } from "../../api/public-fee-payment";

const imageUrl = (value, fallback = "/images/slide.png") => !value ? fallback : /^(https?:)?\/\//i.test(value) || value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
const dateLabel = (value) => { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }); };
function Heading({ eyebrow, title, text }) { return <div className="home-section-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>; }

const PAYMENT_OPTIONS = [
  { id: "orange_money", label: "Orange Money", number: import.meta.env.VITE_ORANGE_MONEY_NUMBER },
  { id: "mvola", label: "Telma · MVola", number: import.meta.env.VITE_MVOLA_NUMBER },
  { id: "airtel_money", label: "Airtel Money", number: import.meta.env.VITE_AIRTEL_MONEY_NUMBER },
];

function PaymentModal({ onClose }) {
  const [phase, setPhase] = useState("lookup");
  const [memberNumber, setMemberNumber] = useState("");
  const [member, setMember] = useState(null);
  const [annualFees, setAnnualFees] = useState([]);
  const [methods, setMethods] = useState([]);
  const [feeId, setFeeId] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selectedFee = annualFees.find((fee) => String(fee.id) === String(feeId));
  const selectedMethodInfo = methods.find((method) => method.value === selectedMethod);
  const selectedOption = PAYMENT_OPTIONS.find((option) => option.id === selectedMethod);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event) { if (event.key === "Escape" && !loading) onClose(); }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, loading]);

  async function findMember(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const [memberResponse, meta] = await Promise.all([
        publicFeePaymentsApi.searchMember(memberNumber.trim()),
        publicFeePaymentsApi.meta(),
      ]);
      const fees = meta?.annual_fees || [];
      const paymentMethods = meta?.payment_methods || [];
      setMember(memberResponse?.member || null);
      setAnnualFees(fees);
      setMethods(paymentMethods);
      setFeeId(String(fees[0]?.id || ""));
      setSelectedMethod(paymentMethods[0]?.value || "");
      setPhase("payment");
    } catch (err) {
      setError(err?.response?.data?.message || "Membre introuvable ou informations de paiement indisponibles.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPayment(event) {
    event.preventDefault();
    if (!member || !selectedFee) return;
    setLoading(true);
    setError("");
    try {
      const response = await publicFeePaymentsApi.submit({
        member_id: member.id,
        annual_fee_id: selectedFee.id,
        payment_method: selectedMethod,
        reference: reference.trim(),
        payment_date: paymentDate,
        amount_paid: Number(selectedFee.amount),
      });
      setSuccess(response?.message || "Votre paiement a été enregistré et sera vérifié par l’administration.");
      setPhase("success");
    } catch (err) {
      const validationError = Object.values(err?.response?.data?.errors || {}).flat().find(Boolean);
      setError(validationError || err?.response?.data?.message || "L’enregistrement du paiement a échoué.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="payment-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <section className="payment-modal fee-payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
        <div className="fee-payment-modal-header">
          <button type="button" className="payment-modal-close" aria-label="Fermer" onClick={onClose} disabled={loading}><i className="bi bi-x-lg" /></button>
          <span className="home-eyebrow">Paiement des cotisations</span>
          <h2 id="payment-modal-title">{phase === "success" ? "Paiement enregistré" : phase === "lookup" ? "Rechercher le membre" : "Régler la cotisation"}</h2>
        </div>
        <div className="fee-payment-modal-body">
        {phase === "success" ? (
          <div className="membership-success"><span><i className="bi bi-check2" /></span><p>{success}</p><button type="button" className="home-button home-button-primary" onClick={onClose}>Terminer</button></div>
        ) : (
          <>
            {phase === "lookup" ? (
              <form className="fee-member-search" onSubmit={findMember}>
                <p className="payment-modal-intro">Saisissez d’abord le numéro du membre qui effectue le paiement.</p>
                {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
                <label>Numéro de membre<input className="form-control home-contact-input" value={memberNumber} onChange={(event) => setMemberNumber(event.target.value)} placeholder="Ex. AEUTNA-0001" required /></label>
                <button className="home-button home-button-primary" type="submit" disabled={loading}>{loading ? "Recherche…" : "Rechercher le membre"} <i className={`bi ${loading ? "bi-hourglass-split" : "bi-search"}`} /></button>
              </form>
            ) : (
              <form className="fee-payment-form" onSubmit={confirmPayment}>
                <div className="fee-member-confirmed"><i className="bi bi-person-check-fill" /><span><strong>{member?.first_name} {member?.last_name}</strong><small>{member?.member_number}</small></span><button type="button" onClick={() => { setPhase("lookup"); setError(""); }} disabled={loading}>Changer</button></div>
                {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
                {annualFees.length ? <label>Année et montant<select className="form-select home-contact-input" value={feeId} onChange={(event) => setFeeId(event.target.value)} required>{annualFees.map((fee) => <option value={fee.id} key={fee.id}>{fee.year} — {Number(fee.amount).toLocaleString("fr-FR")} Ar</option>)}</select></label> : <div className="alert alert-warning">Aucune cotisation active n’est configurée.</div>}
                <label>Moyen de paiement<select className="form-select home-contact-input" value={selectedMethod} onChange={(event) => setSelectedMethod(event.target.value)} required>{methods.map((method) => <option key={method.value} value={method.value}>{method.value === "mvola" ? "Telma · MVola" : method.label}</option>)}</select></label>
                <div className="payment-recipient" role="status"><span>Numéro {selectedMethodInfo?.label || "de paiement"}</span><strong>{selectedOption?.number || "À renseigner"}</strong><small>{selectedOption?.number ? "Vérifiez le bénéficiaire AEUTNA avant le transfert." : "Le numéro de paiement de cet opérateur n’est pas encore configuré."}</small></div>
                <label>Référence du transfert<input className="form-control home-contact-input" value={reference} onChange={(event) => setReference(event.target.value)} required /></label>
                <label>Date du paiement<input type="date" className="form-control home-contact-input" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required /></label>
                <button className="home-button home-button-primary" type="submit" disabled={loading || !selectedFee}>{loading ? "Enregistrement…" : "Confirmer le paiement"} <i className={`bi ${loading ? "bi-hourglass-split" : "bi-arrow-right"}`} /></button>
                <p className="payment-modal-note"><i className="bi bi-info-circle" /> Le paiement sera enregistré en attente de validation par l’administration.</p>
              </form>
            )}
          </>
        )}
        </div>
      </section>
    </div>
  );
}

function MembershipModal({ onClose, onContinue }) {
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(() => {
    try { return { first_name: "", last_name: "", email: "", phone: "", axis_id: "", ...JSON.parse(sessionStorage.getItem("aeutna_membership_draft") || "{}") }; }
    catch { return { first_name: "", last_name: "", email: "", phone: "", axis_id: "" }; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    memberApplicationsApi.publicMeta()
      .then((data) => { if (mounted) setMeta(data); })
      .catch((err) => { if (mounted) setError(err?.response?.data?.message || "Impossible de charger les informations d’adhésion."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  function continueToPayment(event) {
    event.preventDefault();
    sessionStorage.setItem("aeutna_membership_draft", JSON.stringify(form));
    onContinue(form);
  }

  return (
    <div className="payment-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="payment-modal membership-modal" role="dialog" aria-modal="true" aria-labelledby="membership-modal-title">
        <button type="button" className="payment-modal-close" aria-label="Fermer" onClick={onClose}><i className="bi bi-x-lg" /></button>
            <span className="home-eyebrow">Adhésion AEUTNA</span>
            <h2 id="membership-modal-title">Devenir membre</h2>
            <p className="payment-modal-intro">Complétez vos informations personnelles. Vous pourrez ensuite régler votre cotisation sur la page de paiement.</p>
            {meta?.active_annual_fee ? <div className="membership-fee-note">Cotisation {meta.active_annual_fee.year} : <strong>{Number(meta.active_annual_fee.amount).toLocaleString("fr-FR")} Ar</strong></div> : null}
            {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
            {loading ? <div className="bureau-page-state"><span className="spinner-border spinner-border-sm" role="status" /> Chargement du formulaire…</div> : (
              <form className="membership-form" onSubmit={continueToPayment}>
                <label>Nom<input className="form-control home-contact-input" value={form.last_name} onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))} autoComplete="family-name" required /></label>
                <label>Prénom<input className="form-control home-contact-input" value={form.first_name} onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))} autoComplete="given-name" required /></label>
                <label>Email<input className="form-control home-contact-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" required /></label>
                <label>Téléphone<input className="form-control home-contact-input" type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} autoComplete="tel" required /></label>
                {meta?.axes?.length ? <label className="membership-form-wide">Section<select className="form-select home-contact-input" value={form.axis_id} onChange={(event) => setForm((current) => ({ ...current, axis_id: event.target.value }))}><option value="">Choisir une section</option>{meta.axes.map((axis) => <option key={axis.id} value={axis.id}>{axis.name}</option>)}</select></label> : null}
                <button className="home-button home-button-primary membership-form-wide" type="submit" disabled={loading}>Continuer vers le paiement <i className="bi bi-arrow-right" /></button>
              </form>
            )}
      </section>
    </div>
  );
}

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [error, setError] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactFeedback, setContactFeedback] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [annualFeeInfo, setAnnualFeeInfo] = useState(null);
  useEffect(() => {
    if (!selectedActivity) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => { if (event.key === "Escape") setSelectedActivity(null); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [selectedActivity]);
  useEffect(() => { let active = true; websiteApi.home().then((value) => active && setData(value)).catch((err) => active && setError(err?.response?.data?.message || "Impossible de charger les informations du site.")); return () => { active = false; }; }, []);
  useEffect(() => { let active = true; publicFeePaymentsApi.meta().then((value) => active && setAnnualFeeInfo(value?.annual_fees?.[0] || null)).catch(() => {}); return () => { active = false; }; }, []);
  useEffect(() => {
    if (new URLSearchParams(location.search).get("payment") === "1") {
      setPaymentModalOpen(true);
      navigate(`${location.pathname}${location.hash || "#cotisations"}`, { replace: true });
    } else if (new URLSearchParams(location.search).get("modal") === "membership") {
      setMembershipModalOpen(true);
      navigate(`${location.pathname}${location.hash}`, { replace: true });
    }
    if (location.hash) {
      const frame = window.requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [location.hash, location.pathname, location.search, navigate]);
  const slides = useMemo(() => data?.slides?.length ? data.slides : [{ id: "welcome", title: "Ensemble, donnons vie à nos ambitions", subtitle: "Une communauté, un avenir commun", image_url: "/images/slide.png" }], [data]);
  const activities = data?.activities || [];
  const gallery = data?.gallery || [];
  const contacts = data?.contacts || {};
  const hero = slides[activeSlide % slides.length];
  const motherAssociations = [
    { name: "FITEFA", logo: "/parrains/fitefa.jpg", president: "À renseigner" },
    { name: "FIMPISAVA", logo: "/parrains/fimpisava.png", president: "À renseigner" },
    { name: "ASNA", logo: "/parrains/asna.jpg", president: "À renseigner" },
    { name: "Jeunes Cadres d’Antalaha", logo: "/parrains/jeunes_cardre.jpg", president: "À renseigner" },
  ];
  const partners = [{ name: "AZ Service", logo: "/partners/az_service.jpg" }];

  async function handleContactSubmit(event) {
    event.preventDefault();
    setContactSubmitting(true);
    setContactFeedback(null);
    try {
      const response = await submitContactApi({ ...contactForm, name: contactForm.name.trim(), email: contactForm.email.trim(), subject: contactForm.subject.trim(), message: contactForm.message.trim() });
      setContactFeedback({ type: "success", text: response?.message || "Votre message a été envoyé avec succès." });
      setContactForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setContactFeedback({ type: "danger", text: err?.response?.data?.message || "L’envoi du message a échoué. Veuillez réessayer." });
    } finally {
      setContactSubmitting(false);
    }
  }

  return <div className="home-page">
    <section className="home-hero"><img className="home-hero-image" src={imageUrl(hero.image_url)} alt=""/><div className="home-hero-shade"/><div className="container home-hero-content"><span className="home-eyebrow"><i className="bi bi-stars"/> Association des étudiants de l'Université de Tananarive Natifs d’Antalaha</span><h1>{hero.title || "Ensemble, donnons vie à nos ambitions."}</h1><p>{hero.subtitle || data?.about?.summary || "Une association qui rassemble, accompagne et valorise les étudiants et les membres de notre communauté."}</p><div className="d-flex flex-wrap gap-3 mt-4"><Link to="/devenir-membre" className="home-button home-button-primary">Devenir membre <i className="bi bi-arrow-right"/></Link></div><div className="home-hero-note"><span><i className="bi bi-heart-fill"/></span> Solidarité, engagement et avenir partagé</div></div>{slides.length > 1 && <div className="home-slide-controls"><button type="button" aria-label="Image précédente" onClick={() => setActiveSlide((index) => (index - 1 + slides.length) % slides.length)}><i className="bi bi-arrow-left" /></button><span>{String(activeSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span><button type="button" aria-label="Image suivante" onClick={() => setActiveSlide((index) => (index + 1) % slides.length)}><i className="bi bi-arrow-right" /></button></div>}</section>
    {error && <div className="container mt-4"><div className="alert alert-warning">{error}</div></div>}
    <section className="home-pillars container">{[["bi-people", "Une communauté unie", "Créer du lien entre les membres"], ["bi-mortarboard", "Accompagner les étudiants", "Soutenir les parcours et les projets"], ["bi-heart-arrow", "Agir ensemble", "Faire vivre l’entraide et le partage"]].map(([icon, title, text]) => <article className="home-pillar" key={title}><span><i className={`bi ${icon}`}/></span><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>
    <section id="apropos" className="home-about container section-space"><div className="home-about-visual"><img src="/images/about.png" alt="La communauté de l’AEUTNA"/><div className="home-about-badge"><i className="bi bi-heart-arrow"/><strong>Grandir ensemble,<br/>aller plus loin.</strong></div></div><div><Heading eyebrow="Qui sommes-nous ?" title={data?.about?.title || "Bien plus qu’une association, une famille."} text={data?.about?.summary || "AEUTNA rassemble les étudiants et membres natifs d’Antalaha autour de l’entraide et de projets communs."}/><div className="home-values">{[["Solidarité", "Un réseau d’entraide et de soutien au quotidien."], ["Engagement", "Des initiatives concrètes au service de la communauté."], ["Développement", "Des occasions de grandir, d’apprendre et de partager."]].map(([title, text]) => <div key={title}><i className="bi bi-check2"/><span><strong>{title}</strong><small>{text}</small></span></div>)}</div><Link to="/#apropos" className="home-text-link">En savoir plus sur l’association <i className="bi bi-arrow-right"/></Link></div></section>
    <section className="home-partners section-space"><div className="container"><div className="home-heading-row"><Heading eyebrow="Associations mères" title="Nos associations mères" text="Les associations qui accompagnent et soutiennent notre communauté."/></div><div className="row g-4 home-partners-grid">{motherAssociations.map((association) => <div className="col-6 col-md-4 col-lg-3" key={association.name}><article className="home-partner-card home-mother-association-card"><img src={association.logo} alt={`Logo ${association.name}`} loading="lazy"/><div className="home-partner-name">{association.name}</div><div className="home-partner-president">Président : {association.president}</div></article></div>)}</div></div></section>
    <section className="home-sponsors section-space"><div className="container"><div className="home-heading-row"><Heading eyebrow="Partenaires" title="Nos partenaires" text="Nous remercions les partenaires qui contribuent à nos actions."/></div><div className="row g-4 home-partners-grid">{partners.map((partner) => <div className="col-6 col-md-4 col-lg-3" key={partner.name}><article className="home-partner-card"><img src={partner.logo} alt={`Logo ${partner.name}`} loading="lazy"/><div className="home-partner-name">{partner.name}</div></article></div>)}</div></div></section>
    <section className="home-news section-space"><div className="container"><div className="home-heading-row"><Heading eyebrow="À la une" title="Les dernières actualités" text="Les rencontres, projets et événements qui font vivre notre association."/><Link to="/activities" className="home-button home-button-outline">Toutes les actualités <i className="bi bi-arrow-right"/></Link></div><div className="row g-4">{activities.slice(0, 3).map((activity) => <div className="col-md-6 col-lg-4" key={activity.id}><article className="home-news-card"><div className="home-news-image"><img src={imageUrl(activity.images?.find((item) => item.is_cover)?.image_path || activity.images?.[0]?.image_path)} alt={activity.title} loading="lazy"/><span>{activity.location || "Vie associative"}</span></div><div className="home-news-body"><small><i className="bi bi-calendar3"/> {dateLabel(activity.starts_at)}</small><h3>{activity.title}</h3><p>{activity.description || "Découvrez les temps forts de la vie de notre association."}</p><button type="button" onClick={() => setSelectedActivity(activity)}>Voir plus <i className="bi bi-arrow-right"/></button></div></article></div>)}{!activities.length && <div className="col-12"><div className="home-empty">Les prochaines actualités de l’association seront publiées ici.</div></div>}</div></div></section>
    <section className="home-gallery container section-space"><div className="home-heading-row"><Heading eyebrow="Nos moments forts" title="La vie de l’association en images" text="Des souvenirs, des rencontres et des moments qui nous rassemblent."/><Link to="/gallery" className="home-text-link">Explorer la galerie <i className="bi bi-arrow-right"/></Link></div><div className="home-gallery-grid">{gallery.slice(0, 5).map((image, index) => <Link to="/gallery" className={`home-gallery-item item-${index + 1}`} key={image.id}><img src={imageUrl(image.image_path)} alt={image.caption || image.activity_title || "Photo de l’association"} loading="lazy"/><span>{image.caption || image.activity_title || "AEUTNA"}</span></Link>)}{!gallery.length && <div className="home-empty home-gallery-empty"><i className="bi bi-image" aria-hidden="true"/><span>Les photos des activités apparaîtront dans cette galerie.</span></div>}</div></section>
    <section id="cotisations" className="home-contribution section-space"><div className="container home-contribution-inner"><div><span className="home-eyebrow">Cotisations en ligne</span><h2>Votre contribution fait avancer nos projets.</h2><p>Grâce aux cotisations des membres, nous pouvons organiser des activités et soutenir des actions solidaires. Un parcours simple est prévu pour consulter et régler vos cotisations.</p><ul className="home-contribution-benefits">{["Retrouvez vos informations de membre", "Consultez votre cotisation annuelle", "Choisissez votre moyen de paiement"].map((item) => <li key={item}><span><i className="bi bi-check2" /></span>{item}</li>)}</ul><button type="button" className="home-button home-button-gold" onClick={() => setPaymentModalOpen(true)}><i className="bi bi-credit-card"/> Payer ma cotisation <i className="bi bi-arrow-right"/></button><p className="home-contribution-note">Après votre transfert, enregistrez sa référence pour validation par l’administration.</p></div><div className="home-contribution-card"><span><i className="bi bi-wallet2"/></span><small>Espace membre</small><h3>Mes cotisations</h3><div className="home-fee-year"><div><small>Année de cotisation</small><strong>{annualFeeInfo?.year || new Date().getFullYear()}</strong></div><span>À vérifier</span></div><dl className="home-fee-details"><div><dt>Montant</dt><dd>{annualFeeInfo ? `${Number(annualFeeInfo.amount).toLocaleString("fr-FR")} Ar` : "Selon votre profil"}</dd></div></dl><p className="home-fee-disclaimer"><i className="bi bi-shield-check"/> Le paiement sera enregistré et soumis à validation.</p></div></div></section>
    <section className="home-join container"><div><span>Rejoignez le mouvement</span><h2>Et si votre prochaine belle aventure commençait ici ?</h2><p>Partagez vos idées et prenez part à des projets qui ont du sens.</p><Link to="/devenir-membre" className="home-button home-button-primary">Faire mon adhésion en ligne <i className="bi bi-arrow-right"/></Link></div></section>
    <section id="contact" className="home-contact container section-space">
      <div>
        <Heading eyebrow="Restons en contact" title="Une question ? Parlons-en." text="Pour une adhésion, une cotisation ou une idée de collaboration, notre équipe est à votre écoute."/>
        <div className="home-contact-list">
          {[["bi-geo-alt", "Localisation", contacts.address || "Antananarivo, Madagascar"], ["bi-envelope", "Email", contacts.email || "ramananathumingthierry@gmail.com"], ["bi-telephone", "Téléphone", contacts.phone || "+261 32 75 637 70"], ["bi-facebook", "Facebook", contacts.facebook || "https://facebook.com/aeutna"]].map(([icon, label, value]) => <div key={label}><i className={`bi ${icon}`}/><span><small>{label}</small>{label === "Facebook" ? <a href={value} target="_blank" rel="noreferrer">Visiter notre page</a> : label === "Email" ? <a href={`mailto:${value}`}>{value}</a> : label === "Téléphone" ? <a href={`tel:${value.replace(/[^\d+]/g, "")}`}>{value}</a> : <strong>{value}</strong>}</span></div>)}
        </div>
      </div>
      <div className="home-contact-form-card">
        <h3>Envoyez-nous un message</h3>
        {contactFeedback && <div className={`alert alert-${contactFeedback.type}`} role="status">{contactFeedback.text}</div>}
        <form className="home-contact-form" onSubmit={handleContactSubmit}>
          <label>Votre nom<input className="form-control home-contact-input" value={contactForm.name} onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required /></label>
          <label>Votre email<input className="form-control home-contact-input" type="email" value={contactForm.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" required /></label>
          <label className="home-contact-wide">Objet du message<input className="form-control home-contact-input" value={contactForm.subject} onChange={(event) => setContactForm((current) => ({ ...current, subject: event.target.value }))} required /></label>
          <label className="home-contact-wide">Votre message<textarea className="form-control home-contact-input" rows="5" value={contactForm.message} onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))} required /></label>
          <button className="home-button home-button-primary home-contact-wide" type="submit" disabled={contactSubmitting}>{contactSubmitting ? "Envoi en cours…" : "Envoyer le message"} <i className={`bi ${contactSubmitting ? "bi-hourglass-split" : "bi-arrow-right"}`}/></button>
        </form>
      </div>
    </section>
    {selectedActivity ? <div className="payment-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedActivity(null); }}><section className="payment-modal activity-detail-modal" role="dialog" aria-modal="true" aria-labelledby="activity-detail-title"><button type="button" className="payment-modal-close" aria-label="Fermer" onClick={() => setSelectedActivity(null)}><i className="bi bi-x-lg" /></button><span className="home-eyebrow">{selectedActivity.location || "Vie associative"}</span><h2 id="activity-detail-title">{selectedActivity.title}</h2>{selectedActivity.images?.length ? <div className="activity-detail-images">{selectedActivity.images.map((image) => <figure key={image.id || image.image_path}><img src={imageUrl(image.image_path)} alt={image.caption || selectedActivity.title} />{image.caption ? <figcaption>{image.caption}</figcaption> : null}</figure>)}</div> : null}<dl className="activity-detail-meta"><div><dt>Date</dt><dd>{dateLabel(selectedActivity.starts_at) || "\u00c0 pr\u00e9ciser"}{selectedActivity.ends_at ? ` \u2014 ${dateLabel(selectedActivity.ends_at)}` : ""}</dd></div>{selectedActivity.location ? <div><dt>Lieu</dt><dd>{selectedActivity.location}</dd></div> : null}</dl><div className="activity-detail-description">{selectedActivity.description || "Aucune description suppl\u00e9mentaire."}</div></section></div> : null}
    {paymentModalOpen ? <PaymentModal onClose={() => setPaymentModalOpen(false)} /> : null}
    {membershipModalOpen ? <MembershipModal onClose={() => setMembershipModalOpen(false)} onContinue={(membershipForm) => { setMembershipModalOpen(false); navigate("/paiement-adhesion", { state: { membershipForm } }); }} /> : null}
  </div>;
}


