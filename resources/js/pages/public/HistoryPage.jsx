import { useEffect, useMemo, useState } from "react";
import { websiteApi } from "../../api/website";
import staticMandateHistory from "../../data/mandateHistory.json";

function formatDate(value) {
  if (!value) return "Date à renseigner";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function HistoryPage() {
  const [payload, setPayload] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [statute, setStatute] = useState(null);
  const [statuteLoading, setStatuteLoading] = useState(true);
  const [tab, setTab] = useState("mandates");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([websiteApi.home(), websiteApi.documents()])
      .then(([data, publishedDocuments]) => { if (active) { setPayload(data); setDocuments(Array.isArray(publishedDocuments?.data) ? publishedDocuments.data : Array.isArray(publishedDocuments) ? publishedDocuments : []); } })
      .catch((err) => { if (active) setError(err?.response?.data?.message || "Impossible de charger l’historique."); })
      .finally(() => { if (active) setLoading(false); });
    websiteApi.about()
      .then((data) => { if (active) setStatute(data?.statute || null); })
      .catch(() => { if (active) setStatute(null); })
      .finally(() => { if (active) setStatuteLoading(false); });
    return () => { active = false; };
  }, []);

  const mandates = useMemo(() => {
    const roleOrder = ["PRESIDENT", "COMMISSAIRE_COMPTES", "TRESORIER"];
    const roleLabels = {
      PRESIDENT: "Président(e)",
      COMMISSAIRE_COMPTES: "Commissaire aux comptes",
      TRESORIER: "Trésorier(ère)",
    };
    const years = new Map();

    (payload?.role_history || []).forEach((group) => {
      (group.items || []).filter((item) => !item.is_current).forEach((item) => {
        const year = String(item.start_date || item.end_date || "").slice(0, 4);
        if (!year) return;
        if (!years.has(year)) years.set(year, { year, roles: {} });
        const mandateYear = years.get(year);
        mandateYear.roles[group.code] ||= [];
        mandateYear.roles[group.code].push({
          name: item.member?.full_name || "Nom non renseigné",
          photo: item.member?.photo,
        });
      });
    });

    // Keep the prepared archive visible until past mandates are entered in the database.
    staticMandateHistory.forEach((entry) => {
      if (!years.has(entry.year)) years.set(entry.year, { year: entry.year, roles: {} });
      const year = years.get(entry.year);
      Object.entries(entry.roles).forEach(([code, candidates]) => {
        if (!year.roles[code]?.length) year.roles[code] = candidates;
      });
    });

    return [...years.values()]
      .map((year) => ({ ...year, roleOrder, roleLabels }))
      .sort((a, b) => Number(b.year) - Number(a.year));
  }, [payload]);
  const events = useMemo(() => (payload?.role_history || [])
    .flatMap((group) => (group.items || []).map((item) => ({ ...item, role: group.label })))
    .sort((a, b) => new Date(a.start_date || a.end_date || 0) - new Date(b.start_date || b.end_date || 0)), [payload]);

  return (
    <main className="history-page">
      <section className="history-hero"><div className="container"><span className="home-eyebrow">Mémoire collective</span><h1>L’histoire de l’AEUTNA</h1><p>Les personnes, les mandats et les étapes qui ont construit notre association.</p></div></section>
      <section className="container bureau-page-content">
        <div className="bureau-tabs" role="tablist" aria-label="Historique de l’association">
          <button type="button" role="tab" aria-selected={tab === "mandates"} className={tab === "mandates" ? "is-active" : ""} onClick={() => setTab("mandates")}>Historique des mandats</button>
          <button type="button" role="tab" aria-selected={tab === "association"} className={tab === "association" ? "is-active" : ""} onClick={() => setTab("association")}>Historique de l’association</button>
        </div>
        {loading ? <div className="bureau-page-state"><span className="spinner-border spinner-border-sm" role="status"/> Chargement de l’historique…</div> : null}
        {error ? <div className="alert alert-warning" role="alert">{error}</div> : null}
        {!loading && !error && tab === "mandates" ? <section aria-labelledby="history-mandates-title">
          <div className="bureau-section-title"><span>Archives</span><h2 id="history-mandates-title">Historique des mandats</h2><p>Retrouvez les membres qui ont exercé une responsabilité au sein de l’association.</p></div>
          {mandates.length ? <div className="history-mandate-years">{mandates.map((mandate) => <section className="history-mandate-year-group" key={mandate.year} aria-labelledby={`history-mandate-${mandate.year}`}><div className="history-mandate-year-heading"><span>Année du mandat</span><h3 id={`history-mandate-${mandate.year}`}>{mandate.year}</h3></div><div className="row g-4">{mandate.roleOrder.flatMap((code) => (mandate.roles[code] || []).map((candidate, index) => { const photo = candidate.photo ? (candidate.photo.startsWith("/") || /^https?:/i.test(candidate.photo) ? candidate.photo : `/${candidate.photo}`) : null; const image = <img className="history-candidate-photo" src={photo || "/images/avatar.png"} alt={photo ? `Photo de ${candidate.name}` : "Photo non disponible"} loading="lazy"/>; return <div className="col-12 col-sm-6 col-lg-4" key={`${code}-${candidate.name}-${index}`}><article className="history-candidate-card">{photo ? <a className="history-candidate-photo-link" href={photo} target="_blank" rel="noreferrer" aria-label={`Agrandir la photo de ${candidate.name}`}>{image}</a> : image}<div className="history-candidate-details"><span>{mandate.roleLabels[code]}</span><h4>{candidate.name}</h4></div></article></div>; }))}</div></section>)}</div> : <div className="bureau-page-empty"><i className="bi bi-clock-history"/><h3>Aucun ancien mandat n’est encore enregistré.</h3><p>Les mandats terminés apparaîtront ici lorsqu’ils seront ajoutés à l’historique.</p></div>}
        </section> : null}
        {!loading && !error && tab === "association" ? <section aria-labelledby="history-association-title">
          <div className="bureau-section-title"><span>Notre mémoire</span><h2 id="history-association-title">Historique de l’association</h2><p>{payload?.about?.summary || "Les étapes de l’association se dessinent à travers les mandats et les personnes qui se sont engagées."}</p></div>
          <section className="bureau-official-documents mb-4" aria-labelledby="history-documents-title">
            <div className="bureau-documents-copy">
              <span>Documents officiels</span>
              <h2 id="history-documents-title">Statuts de l’association</h2>
              {statuteLoading ? <p>Recherche du document officiel…</p> : statute?.document?.file_url ? (
                <p>{statute.title}{statute.version ? ` · Version ${statute.version}` : ""}{statute.effective_at ? ` · En vigueur depuis le ${formatDate(statute.effective_at)}` : ""}</p>
              ) : <p>Aucun document officiel n’est actuellement publié en téléchargement.</p>}
            </div>
            {statute?.document?.file_url ? <a className="home-button home-button-primary" href={statute.document.file_url} download={statute.document.file_name || true}><i className="bi bi-download" /> Télécharger les statuts</a> : null}
          </section>
          {events.length ? <div className="bureau-history-timeline">{events.map((event) => <article className="bureau-history-event" key={event.id}><span className="bureau-history-dot"/><div className="bureau-history-event-card"><div className="d-flex flex-wrap align-items-center justify-content-between gap-2"><h3>{event.role}</h3><span className={event.is_current ? "is-current" : ""}>{event.is_current ? "Mandat en cours" : "Mandat terminé"}</span></div><p>{event.member?.full_name || "Membre non renseigné"}</p><small>{formatDate(event.start_date)}{event.end_date ? ` — ${formatDate(event.end_date)}` : event.is_current ? " — aujourd’hui" : ""}</small>{event.notes ? <p className="bureau-history-note">{event.notes}</p> : null}</div></article>)}</div> : <div className="bureau-page-empty"><i className="bi bi-clock-history"/><h3>L’histoire de l’association sera publiée prochainement.</h3><p>Les étapes apparaîtront ici dès que les dates et les responsabilités seront enregistrées.</p></div>}
          <div className="bureau-section-title mt-5"><span>Archives publiques</span><h2>Documents publiés</h2><p>Téléchargez les documents officiels mis à disposition par l’association.</p></div>
          {documents.length ? <div className="row g-3">{documents.map((document) => <div className="col-md-6 col-lg-4" key={document.id}><article className="bureau-dynamic-card h-100"><div className="d-flex align-items-center gap-2"><div className="bureau-role-icon"><i className="bi bi-file-earmark-text"/></div><h3 className="mb-0">{document.title}</h3></div>{document.description ? <p>{document.description}</p> : null}<a className="home-button home-button-primary mt-3 w-100" href={document.file_url || `/${String(document.file_path || "").replace(/^\/+/, "")}`} download={document.file_name || true}><i className="bi bi-download"/> Télécharger</a></article></div>)}</div> : <div className="bureau-page-empty"><i className="bi bi-file-earmark"/><h3>Aucun document publié</h3><p>Les documents disponibles au téléchargement apparaîtront ici.</p></div>}
        </section> : null}
      </section>
    </main>
  );
}
