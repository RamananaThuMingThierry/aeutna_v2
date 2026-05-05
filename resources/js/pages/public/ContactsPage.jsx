import React, { useEffect, useMemo, useState } from "react";

import { submitContactApi } from "../../api/contact";
import { websiteApi } from "../../api/website";

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function ContactInfoItem({ icon, label, value, href, accent = "rgba(15,118,110,0.16)" }) {
  const content = href ? (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
      className="fw-semibold text-decoration-none text-break"
      style={{ color: "var(--page-ink)" }}
    >
      {value}
    </a>
  ) : (
    <div className="fw-semibold text-break">{value}</div>
  );

  return (
    <div
      className="d-flex align-items-start align-items-sm-center gap-3 p-3 p-sm-3 rounded-4 h-100"
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
      <div className="min-w-0 flex-grow-1">
        <div className="small text-uppercase fw-semibold text-secondary mb-1" style={{ letterSpacing: "0.08em" }}>{label}</div>
        {content}
      </div>
    </div>
  );
}

function ContactField({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="form-label fw-semibold">{label}</label>
      {children}
      {error ? <div className="text-danger small mt-1">{error}</div> : null}
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

      setSubmitSuccess(response?.message || "Votre message a été envoye avec succes.");
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
      <section className="py-4 py-md-5">
        <div className="container">
          <div className="rounded-2 p-3 p-sm-4 p-lg-5 mb-4 shadow-sm overflow-hidden position-relative" style={{ background: "var(--panel)" }}>
            <div className="row g-4 align-items-center">
              <div className="col-12">
                <div className="text-uppercase small fw-bold mb-2" style={{ color: "var(--warm)", letterSpacing: "0.18em" }}>
                  Contactez-nous
                </div>
                <h1 className="h2 fw-bold mb-3">Parlons de vos questions, idées et collaborations.</h1>
                <p className="text-secondary mb-0">Ecrivez-nous directement depuis le formulaire ou passez par nos canaux habituels. La page a été simplifiée pour être plus lisible et plus confortable sur mobile.</p>
              </div>
            </div>
          </div>

          <div className="row g-4 align-items-start">
            <div className="col-12 col-lg-5 order-2 order-lg-1">
              <div className="rounded-2 p-3 p-sm-4 shadow-sm h-100" style={{ background: "var(--panel)" }}>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 56, height: 56, background: "rgba(212,160,23,0.16)", color: "var(--warm)" }}>
                    <i className="bi bi-chat-heart fs-4" />
                  </div>
                  <div>
                    <div className="fw-bold fs-5">Restons en contact</div>
                    <div className="text-secondary small">Association AEUTNA</div>
                  </div>
                </div>

                <p className="text-secondary mb-4">
                  Pour une demande d information, une proposition de partenariat ou un simple message, choisissez le
                  canal qui vous convient le mieux.
                </p>

                <div className="d-grid gap-3">
                  <ContactInfoItem
                    icon="bi-envelope-fill"
                    label="Email direct"
                    value={contacts.email}
                    href={contacts.emailHref}
                    accent="rgba(10, 61, 119, 0.16)"
                  />
                  <ContactInfoItem
                    icon="bi-whatsapp"
                    label="WhatsApp"
                    value={contacts.whatsapp}
                    href={contacts.whatsappHref}
                    accent="rgba(3, 44, 18, 0.14)"
                  />
                  <ContactInfoItem
                    icon="bi-facebook"
                    label="Facebook"
                    value={contacts.facebook}
                    href={contacts.facebookHref}
                    accent="rgba(37,99,235,0.14)"
                  />

                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7 order-1 order-lg-2">
              <div className="card border-0 rounded-2 shadow-sm" style={{ background: "var(--panel)" }}>
                <div className="card-body p-3 p-sm-4 p-lg-5">
                  {submitSuccess ? <div className="alert alert-success">{submitSuccess}</div> : null}
                  {submitError ? <div className="alert alert-danger">{submitError}</div> : null}

                  <form onSubmit={handleSubmit} className="row g-3 g-sm-4">
                    <div className="col-12 col-md-6">
                      <ContactField id="contact-name" label="Nom complet" error={fieldErrors.name?.[0]}>
                        <input
                          id="contact-name"
                          type="text"
                          className="form-control"
                          value={form.name}
                          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                          placeholder="Votre nom complet"
                          style={{ minHeight: 52, borderColor: "var(--line)", background: "rgba(255,255,255,0.75)" }}
                          required
                        />
                      </ContactField>
                    </div>

                    <div className="col-12 col-md-6">
                      <ContactField id="contact-email" label="Email" error={fieldErrors.email?.[0]}>
                        <input
                          id="contact-email"
                          type="email"
                          className="form-control"
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                          placeholder="nom@example.com"
                          style={{ minHeight: 52, borderColor: "var(--line)", background: "rgba(255,255,255,0.75)" }}
                          required
                        />
                      </ContactField>
                    </div>

                    <div className="col-12 col-md-6">
                      <ContactField id="contact-phone" label="Téléphone" error={fieldErrors.phone?.[0]}>
                        <input
                          id="contact-phone"
                          type="text"
                          className="form-control"
                          value={form.phone}
                          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                          placeholder="+261 ..."
                          style={{ minHeight: 52, borderColor: "var(--line)", background: "rgba(255,255,255,0.75)" }}
                        />
                      </ContactField>
                    </div>

                    <div className="col-12 col-md-6">
                      <ContactField id="contact-subject" label="Sujet" error={fieldErrors.subject?.[0]}>
                        <input
                          id="contact-subject"
                          type="text"
                          className="form-control"
                          value={form.subject}
                          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                          placeholder="Objet de votre message"
                          style={{ minHeight: 52, borderColor: "var(--line)", background: "rgba(255,255,255,0.75)" }}
                          required
                        />
                      </ContactField>
                    </div>

                    <div className="col-12">
                      <ContactField id="contact-message" label="Message" error={fieldErrors.message?.[0]}>
                        <textarea
                          id="contact-message"
                          className="form-control"
                          rows="6"
                          value={form.message}
                          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                          placeholder="Ecrivez votre message ici..."
                          style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.75)", resize: "vertical", minHeight: 180 }}
                          required
                        />
                      </ContactField>
                    </div>

                    <div className="col-12 pt-2">
                      <button
                        type="submit"
                        className="btn btn-dark w-100 px-4 py-3 fw-semibold rounded-4"
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
