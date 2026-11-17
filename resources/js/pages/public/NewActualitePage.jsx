import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { websiteApi } from "../../api/website";

const PAGE_SIZE = 12;

function resolveImageUrl(path) {
  if (!path) return "/images/slide.png";
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  return `/${path.replace(/^\/+/, "")}`;
}

function formatDate(value) {
  if (!value) return "Date à préciser";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date à préciser" : new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default function NewActualitePage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    let active = true;
    websiteApi.activities()
      .then((response) => {
        if (active) setActivities(response?.activities || []);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || "Impossible de charger les actualités.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return activities
      .filter((activity) => {
        const date = activity.starts_at ? new Date(activity.starts_at) : null;
        const validDate = date && !Number.isNaN(date.getTime());
        const day = validDate ? date.toISOString().slice(0, 10) : "";
        const matchesDate = (!dateFrom || (day && day >= dateFrom)) && (!dateTo || (day && day <= dateTo));
        const searchable = [activity.title, activity.description, activity.location, activity.status].filter(Boolean).join(" ").toLocaleLowerCase("fr");
        return matchesDate && (!query || searchable.includes(query));
      })
      .sort((a, b) => new Date(b.starts_at || 0) - new Date(a.starts_at || 0) || Number(b.id) - Number(a.id));
  }, [activities, search, dateFrom, dateTo]);

  useEffect(() => setPage(1), [search, dateFrom, dateTo]);
  useEffect(() => {
    if (!selectedActivity) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => { if (event.key === "Escape") setSelectedActivity(null); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [selectedActivity]);

  const pageCount = Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE));
  const pageActivities = filteredActivities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="actualites-page">
      <section className="actualites-hero">
        <div className="container actualites-hero-content">
          <span className="home-eyebrow">Le journal de l’association</span>
          <h1>Actualités AEUTNA</h1>
          <p>Retrouvez les événements, les projets et les moments qui font vivre notre communauté.</p>
        </div>
      </section>
      <section className="container actualites-content section-space">
        <div className="actualites-heading">
          <div><span className="home-eyebrow">À la une</span><h2>Toutes nos actualités</h2></div>
          <span className="actualites-count">{filteredActivities.length} publication{filteredActivities.length > 1 ? "s" : ""}</span>
        </div>
        <div className="actualites-filters" role="search">
          <label className="actualites-search"><span>Rechercher</span><div><i className="bi bi-search"/><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titre, lieu, description…" /></div></label>
          <label><span>Depuis le</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
          <label><span>Jusqu’au</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
          {(search || dateFrom || dateTo) && <button type="button" className="actualites-reset" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}>Effacer les filtres</button>}
        </div>

        {loading ? <div className="home-empty">Chargement des actualités…</div> : null}
        {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
        {!loading && !error && pageActivities.length > 0 ? (
          <div className="row g-4">
            {pageActivities.map((activity) => {
              const cover = activity.images?.find((image) => image.is_cover) || activity.images?.[0];
              return <div className="col-md-6 col-lg-4" key={activity.id}>
                <article className="home-news-card actualites-card">
                  <div className="home-news-image"><img src={resolveImageUrl(cover?.image_path)} alt={cover?.caption || activity.title} loading="lazy"/><span>{activity.location || "Vie associative"}</span></div>
                  <div className="home-news-body"><small><i className="bi bi-calendar3"/> {formatDate(activity.starts_at)}</small><h3>{activity.title}</h3><p>{activity.description || "Découvrez les temps forts de la vie de notre association."}</p><button type="button" className="actualites-more-button" onClick={() => setSelectedActivity(activity)}>Voir plus<i className="bi bi-arrow-right" /></button></div>
                </article>
              </div>;
            })}
          </div>
        ) : null}
        {!loading && !error && pageActivities.length === 0 ? <div className="home-empty">Aucune actualité ne correspond à votre recherche.</div> : null}

        {!loading && !error && filteredActivities.length > PAGE_SIZE ? <nav className="actualites-pagination" aria-label="Pagination des actualités">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}><i className="bi bi-arrow-left"/> Précédent</button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number} className={number === page ? "is-active" : ""} aria-current={number === page ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>Suivant <i className="bi bi-arrow-right"/></button>
        </nav> : null}
      </section>
      {selectedActivity ? <div className="payment-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedActivity(null); }}><section className="payment-modal activity-detail-modal" role="dialog" aria-modal="true" aria-labelledby="activity-detail-title"><button type="button" className="payment-modal-close" aria-label="Fermer" onClick={() => setSelectedActivity(null)}><i className="bi bi-x-lg" /></button><span className="home-eyebrow">{selectedActivity.location || "Vie associative"}</span><h2 id="activity-detail-title">{selectedActivity.title}</h2>{selectedActivity.images?.length ? <div className="activity-detail-images">{selectedActivity.images.map((image) => <figure key={image.id || image.image_path}><img src={resolveImageUrl(image.image_path)} alt={image.caption || selectedActivity.title} />{image.caption ? <figcaption>{image.caption}</figcaption> : null}</figure>)}</div> : null}<dl className="activity-detail-meta"><div><dt>Date</dt><dd>{formatDate(selectedActivity.starts_at)}{selectedActivity.ends_at ? ` \u2014 ${formatDate(selectedActivity.ends_at)}` : ""}</dd></div>{selectedActivity.location ? <div><dt>Lieu</dt><dd>{selectedActivity.location}</dd></div> : null}</dl><div className="activity-detail-description">{selectedActivity.description || "Aucune description suppl\u00e9mentaire."}</div></section></div> : null}
    </main>
  );
}
