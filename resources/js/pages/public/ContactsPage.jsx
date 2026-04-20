import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { submitContactApi } from "../../api/contact";
import { websiteApi } from "../../api/website";

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function ContactCard({ icon, title, description, href, label, variant = "outline" }) {
  const className =
    variant === "solid"
      ? "btn btn-dark rounded-pill px-4"
      : "btn btn-outline-dark rounded-pill px-4";

  return (
    <article className="card border-0 shadow-sm h-100" style={{ background: "var(--panel)" }}>
      <div className="card-body p-4 p-lg-5 d-flex flex-column">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
          style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, rgba(15,118,110,0.16), rgba(194,65,12,0.18))",
            color: "var(--accent-strong)",
          }}
        >
          <i className={`bi ${icon} fs-4`} />
        </div>
        <h2 className="h4 fw-bold mb-2">{title}</h2>
        <p className="text-secondary mb-4 flex-grow-1">{description}</p>
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {label}
        </a>
      </div>
    </article>
  );
}

function ContactInfoItem({ icon, label, value, href, accent = "rgba(15,118,110,0.16)" }) {
  const content = href ? (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
      className="fw-semibold text-decoration-none"
      style={{ color: "var(--page-ink)" }}
    >
      {value}
    </a>
  ) : (
    <div className="fw-semibold">{value}</div>
  );

  return (
    <div
      className="d-flex align-items-center gap-3 p-3 rounded-4"
      style={{
        background: "var(--panel-strong)",
        border: "1px solid var(--line)",
      }}
    >
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
        style={{
          width: 52,
          height: 52,
          background: accent,
          color: "var(--accent-strong)",
        }}
      >
        <i className={`bi ${icon}`} style={{ fontSize: "1.1rem" }} />
      </div>
      <div className="min-w-0">
        <div className="small text-uppercase fw-semibold text-secondary mb-1">{label}</div>
        {content}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await websiteApi.home();
        if (!active) return;
        setData(response);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Impossible de charger les contacts.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");
    setFieldErrors({});

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      };

      const response = await submitContactApi(payload);

      setSubmitSuccess(response?.message || "Votre message a ete envoye avec succes.");
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      const errors = err?.response?.data?.errors || {};
      const firstError = Object.values(errors).flat().find(Boolean);

      setFieldErrors(errors);
      setSubmitError(firstError || err?.response?.data?.message || "Envoi du message impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  const contacts = useMemo(() => {
    const base = data?.contacts || {};
    const whatsapp = base.whatsapp || base.phone || "+261 32 75 637 70";
    const email = base.email || "ramananathumingthierry@gmail.com";
    const facebook = base.facebook || "https://facebook.com/aeutna";

    return {
      whatsapp,
      email,
      facebook,
      whatsappHref: `https://wa.me/${normalizePhone(whatsapp).replace(/^\+/, "")}`,
      emailHref: `mailto:${email}`,
      facebookHref: facebook,
    };
  }, [data]);

  if (loading) {
    return <div className="container py-5">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <section className="p-5 pb-lg-6">
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-lg-5">
              <div className="rounded-5 p-4 p-lg-5 shadow-sm h-100" style={{ background: "var(--panel)" }}>
                <div className="text-uppercase small fw-bold mb-2" style={{ color: "var(--warm)", letterSpacing: "0.14em" }}>
                  Contact
                </div>
                <p className="text-secondary mb-4">
                  Utilisez le formulaire ou contactez directement l association par email, WhatsApp ou Facebook.
                </p>
                <div className="d-grid gap-3">
                  <ContactInfoItem
                    icon="bi-envelope-fill"
                    label="Email"
                    value={contacts.email}
                    href={contacts.emailHref}
                    accent="rgba(10, 61, 119, 0.16)"
                  />
                  <ContactInfoItem
                    icon="bi-whatsapp"
                    label="WhatsApp"
                    value={contacts.whatsapp}
                    href={contacts.whatsappHref}
                    accent="rgba(22,163,74,0.14)"
                  />
                  <ContactInfoItem
                    icon="bi-facebook"
                    label="Facebook"
                    value="Suivre notre page"
                    href={contacts.facebookHref}
                    accent="rgba(37,99,235,0.14)"
                  />
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card border-0 shadow-sm" style={{ background: "var(--panel)" }}>
                <div className="card-body p-4 p-lg-5">
                  <div className="mb-4">
                    <div className="text-uppercase small fw-bold mb-2" style={{ color: "var(--warm)", letterSpacing: "0.14em" }}>
                      Formulaire
                    </div>
                    <h2 className="h3 fw-bold mb-2">Envoyer un message</h2>
                    <p className="text-secondary mb-0">
                      Remplissez ce formulaire pour transmettre votre demande a l association.
                    </p>
                  </div>

                  {submitSuccess ? <div className="alert alert-success">{submitSuccess}</div> : null}
                  {submitError ? <div className="alert alert-danger">{submitError}</div> : null}

                  <form onSubmit={handleSubmit} className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="contact-name" className="form-label fw-semibold">Nom complet</label>
                      <input
                        id="contact-name"
                        type="text"
                        className="form-control"
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Votre nom complet"
                        style={{ minHeight: 52, borderRadius: "1rem", borderColor: "var(--line)", background: "rgba(255,255,255,0.75)" }}
                        required
                      />
                      {fieldErrors.name ? <div className="text-danger small mt-1">{fieldErrors.name[0]}</div> : null}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="contact-email" className="form-label fw-semibold">Email</label>
                      <input
                        id="contact-email"
                        type="email"
                        className="form-control"
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="nom@example.com"
                        style={{ minHeight: 52, borderRadius: "1rem", borderColor: "var(--line)", background: "rgba(255,255,255,0.75)" }}
                        required
                      />
                      {fieldErrors.email ? <div className="text-danger small mt-1">{fieldErrors.email[0]}</div> : null}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="contact-phone" className="form-label fw-semibold">Telephone</label>
                      <input
                        id="contact-phone"
                        type="text"
                        className="form-control"
                        value={form.phone}
                        onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="+261 ..."
                        style={{ minHeight: 52, borderRadius: "1rem", borderColor: "var(--line)", background: "rgba(255,255,255,0.75)" }}
                      />
                      {fieldErrors.phone ? <div className="text-danger small mt-1">{fieldErrors.phone[0]}</div> : null}
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="contact-subject" className="form-label fw-semibold">Sujet</label>
                      <input
                        id="contact-subject"
                        type="text"
                        className="form-control"
                        value={form.subject}
                        onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                        placeholder="Objet de votre message"
                        style={{ minHeight: 52, borderRadius: "1rem", borderColor: "var(--line)", background: "rgba(255,255,255,0.75)" }}
                        required
                      />
                      {fieldErrors.subject ? <div className="text-danger small mt-1">{fieldErrors.subject[0]}</div> : null}
                    </div>

                    <div className="col-12">
                      <label htmlFor="contact-message" className="form-label fw-semibold">Message</label>
                      <textarea
                        id="contact-message"
                        className="form-control"
                        rows="6"
                        value={form.message}
                        onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                        placeholder="Ecrivez votre message ici..."
                        style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "rgba(255,255,255,0.75)", resize: "vertical" }}
                        required
                      />
                      {fieldErrors.message ? <div className="text-danger small mt-1">{fieldErrors.message[0]}</div> : null}
                    </div>

                    <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-3 pt-2">
                      <div className="small text-secondary">
                        Les champs obligatoires permettent d enregistrer votre demande dans la table `contact_us`.
                      </div>
                      <button
                        type="submit"
                        className="btn rounded-pill px-4 py-3 fw-semibold"
                        style={{
                          background: "linear-gradient(135deg, var(--accent-strong), var(--warm))",
                          color: "#fff",
                          border: "none",
                          minWidth: 220,
                        }}
                        disabled={submitting}
                      >
                        <i className={`bi ${submitting ? "bi-hourglass-split" : "bi-send-fill"} me-2`} />
                        {submitting ? "Envoi en cours..." : "Envoyer le message"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
