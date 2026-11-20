import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { websiteApi } from "../../api/website";

const DEFAULT_PHOTO = "/images/avatar.png";
const EXECUTIVE_POSITIONS = [
  { code: "PRESIDENT", acronym: "PR", title: "Président(e)", description: "Coordination générale" },
  { code: "COMMISSAIRE_COMPTES", acronym: "CC", title: "Commissaire aux comptes", description: "Contrôle et transparence financière" },
  { code: "TRESORIER", acronym: "TR", title: "Trésorier", description: "Finances et cotisations" },
];

function imageUrl(value) {
  if (!value) return DEFAULT_PHOTO;
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) return value;
  return `/${value.replace(/^\/+/, "")}`;
}

function formatDate(value) {
  if (!value) return "Date à  renseigner";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function SectionTitle({ id, eyebrow, title, text }) {
  return (
    <div className="bureau-section-title">
      <span>{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

function MemberCard({ assignment }) {
  const name = assignment.member?.full_name || "Nom à  renseigner";
  return (
    <article className="bureau-dynamic-card">
      <div className="bureau-dynamic-card-top">
        <img src={imageUrl(assignment.member?.photo)} alt={name} loading="lazy" />
        <span className="bureau-role-icon"><i className="bi bi-person-badge-fill" /></span>
      </div>
      <div className="bureau-role-label">{assignment.role || "Fonction du bureau"}</div>
      <h3>{name}</h3>
      {assignment.start_date ? <div className="bureau-card-date"><i className="bi bi-calendar3" /> Depuis {formatDate(assignment.start_date)}</div> : null}
      {assignment.member?.email ? <a className="bureau-card-contact" href={`mailto:${assignment.member.email}`}><i className="bi bi-envelope"/> {assignment.member.email}</a> : null}
      {assignment.member?.phone ? <a className="bureau-card-contact" href={`tel:${assignment.member.phone.replace(/[^\d+]/g, "")}`}><i className="bi bi-telephone"/> {assignment.member.phone}</a> : null}
    </article>
  );
}

function ExecutiveCard({ position, assignment }) {
  const name = assignment?.member?.full_name || "Titulaire à  renseigner";
  return (
    <article className="bureau-dynamic-card">
      <div className="bureau-dynamic-card-top">
        <img src={imageUrl(assignment?.member?.photo)} alt={name} loading="lazy" />
        <span className="bureau-role-icon bureau-role-acronym">{position.acronym}</span>
      </div>
      <div className="bureau-role-label">{position.title}</div>
      <p className="bureau-position-description">{position.description}</p>
      <h3>{name}</h3>
      {assignment?.member?.email ? <a className="bureau-card-contact" href={`mailto:${assignment.member.email}`}><i className="bi bi-envelope"/> {assignment.member.email}</a> : null}
      {assignment?.member?.phone ? <a className="bureau-card-contact" href={`tel:${assignment.member.phone.replace(/[^\d+]/g, "")}`}><i className="bi bi-telephone"/> {assignment.member.phone}</a> : null}
    </article>
  );
}

export default function BureauPage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("current");

  useEffect(() => {
    let mounted = true;
    websiteApi.home()
      .then((data) => {
        if (mounted) setPayload(data);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || "Impossible de charger les membres du bureau.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const currentMembers = payload?.bureau_members || [];
  const executiveCodes = EXECUTIVE_POSITIONS.map((position) => position.code);
  const additionalMembers = currentMembers.filter((assignment) => !executiveCodes.includes(assignment.code));
  const formerMembers = useMemo(
    () => (payload?.role_history || []).flatMap((group) =>
      (group.items || [])
        .filter((item) => !item.is_current)
        .map((item) => ({ ...item, role: group.label }))
    ),
    [payload]
  );
  const historyEvents = useMemo(
    () => (payload?.role_history || [])
      .flatMap((group) => (group.items || []).map((item) => ({ ...item, role: group.label })))
      .sort((a, b) => new Date(a.start_date || a.end_date || 0) - new Date(b.start_date || b.end_date || 0)),
    [payload]
  );

  return (
    <div className="bureau-page">
      <main className="container bureau-page-content">
        <div className="bureau-tabs" role="tablist" aria-label="Rubriques du bureau">
          <button type="button" role="tab" aria-selected={tab === "current"} className={tab === "current" ? "is-active" : ""} onClick={() => setTab("current")}>
            Bureau actuel <span>{currentMembers.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === "history"} className={tab === "history" ? "is-active" : ""} onClick={() => setTab("history")}>
            Historique des mandats <span>{formerMembers.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === "association"} className={tab === "association" ? "is-active" : ""} onClick={() => setTab("association")}>
            Histoire de l'association <span>{historyEvents.length}</span>
          </button>
        </div>

        {loading ? <div className="bureau-page-state"><span className="spinner-border spinner-border-sm" role="status" /> Chargement des membresâ€¦</div> : null}
        {!loading && error ? <div className="alert alert-warning" role="alert">{error}</div> : null}

        {!loading && !error && tab === "current" ? (
          <section aria-labelledby="bureau-current-title">
            <SectionTitle id="bureau-current-title" eyebrow="équipe actuelle" title="Membres du bureau" text="Les fonctions et les membres en exercice, actualisés depuis les données de l'association." />
            <div className="row g-4">
              {EXECUTIVE_POSITIONS.map((position) => <div className="col-sm-6 col-lg-4" key={position.code}><ExecutiveCard position={position} assignment={currentMembers.find((item) => item.code === position.code)} /></div>)}
              {additionalMembers.map((assignment) => <div className="col-sm-6 col-lg-4" key={assignment.id}><MemberCard assignment={assignment} /></div>)}
            </div>
          </section>
        ) : null}

        {!loading && !error && tab === "history" ? (
          <section aria-labelledby="bureau-history-title">
            <SectionTitle id="bureau-history-title" eyebrow="Archives" title="Historique des mandats" text="Les responsabilités passées enregistrées dans l'historique de l'association." />
            {formerMembers.length ? (
              <div className="row g-4">
                {formerMembers.map((assignment) => (
                  <div className="col-sm-6 col-lg-4" key={assignment.id}>
                    <MemberCard assignment={{ ...assignment, role: assignment.role }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bureau-page-empty"><i className="bi bi-clock-history" /><h3>Aucun ancien mandat n'est encore enregistré.</h3><p>Les mandats terminés apparaîtront ici lorsqu'ils seront ajoutés à  l'historique.</p></div>
            )}
          </section>
        ) : null}

        {!loading && !error && tab === "association" ? (
          <section aria-labelledby="bureau-association-title">
            <SectionTitle id="bureau-association-title" eyebrow="Mémoire collective" title="Histoire de l'association" text={payload?.about?.summary || "Les étapes de l'association se dessinent à  travers les mandats et les personnes qui se sont engagées."} />
            {historyEvents.length ? (
              <div className="bureau-history-timeline">
                {historyEvents.map((event) => (
                  <article className="bureau-history-event" key={event.id}>
                    <span className="bureau-history-dot" />
                    <div className="bureau-history-event-card">
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <h3>{event.role}</h3>
                        <span className={event.is_current ? "is-current" : ""}>{event.is_current ? "Mandat en cours" : "Mandat terminé"}</span>
                      </div>
                      <p>{event.member?.full_name || "Membre non renseigné"}</p>
                      <small>{formatDate(event.start_date)}{event.end_date ? ` â€” ${formatDate(event.end_date)}` : event.is_current ? " â€” aujourd'hui" : ""}</small>
                      {event.notes ? <p className="bureau-history-note">{event.notes}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bureau-page-empty"><i className="bi bi-clock-history" /><h3>L'histoire des mandats sera publiée prochainement.</h3><p>Les étapes apparaà®tront ici dès que les dates et les responsabilités seront enregistrées.</p></div>
            )}
          </section>
        ) : null}

        <aside className="bureau-page-cta">
          <div><span>Rejoignez l'association</span><h2>Construisons la suite ensemble.</h2></div>
          <Link to="/devenir-membre" className="home-button home-button-primary">Faire mon adhésion <i className="bi bi-arrow-right" /></Link>
        </aside>

      </main>
    </div>
  );
}

