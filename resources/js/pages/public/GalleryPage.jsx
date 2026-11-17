import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { websiteApi } from "../../api/website";

function imageUrl(path) {
  if (!path) return "/images/slide.png";
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  return `/${path.replace(/^\/+/, "")}`;
}

export default function GalleryPage() {
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    websiteApi.gallery()
      .then((response) => {
        if (active) setAlbums(response?.albums || []);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || "Impossible de charger les albums.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (activeImageIndex === null) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") setActiveImageIndex(null);
      if (event.key === "ArrowRight") setActiveImageIndex((index) => (index + 1) % activeAlbum.images.length);
      if (event.key === "ArrowLeft") setActiveImageIndex((index) => (index - 1 + activeAlbum.images.length) % activeAlbum.images.length);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeAlbum, activeImageIndex]);

  const selectedImage = activeAlbum && activeImageIndex !== null ? activeAlbum.images?.[activeImageIndex] || null : null;

  return (
    <main className="gallery-page">
      <section className="gallery-hero">
        <div className="container gallery-hero-content">
          <span className="home-eyebrow">Nos souvenirs en images</span>
          <h1>Albums de l’AEUTNA</h1>
          <p>Revivez les activités, les rencontres et les moments de partage de notre association.</p>
        </div>
      </section>

      <section className="container gallery-content section-space">
        <div className="gallery-section-heading"><div><span className="home-eyebrow">La vie associative</span><h2>Parcourir les albums</h2></div><span>{albums.length} album{albums.length > 1 ? "s" : ""}</span></div>
        {loading ? <div className="home-empty">Chargement des albums…</div> : null}
        {error ? <div className="alert alert-danger" role="alert">{error}</div> : null}
        {!loading && !error && albums.length === 0 ? <div className="home-empty">Les albums photos seront publiés ici prochainement.</div> : null}
        {!loading && !error && albums.length > 0 ? <div className="row g-4">
          {albums.map((album) => {
            const cover = album.cover_image?.image_url || album.images?.[0]?.image_url;
            return <div className="col-md-6 col-lg-4" key={album.id}>
              <button type="button" className="gallery-album-card" onClick={() => { setActiveAlbum(album); setActiveImageIndex(null); }} aria-label={`Ouvrir l’album ${album.title}`}>
                <div className="gallery-album-cover"><img src={imageUrl(cover)} alt={album.cover_image?.name || album.title} loading="lazy"/><span><i className="bi bi-images"/> {album.images_count || album.images?.length || 0} photos</span></div>
                <div className="gallery-album-copy"><h3>{album.title}</h3><p>{album.description || "Découvrez les images de cet album de l’association."}</p><span>Voir l’album <i className="bi bi-arrow-up-right"/></span></div>
              </button>
            </div>;
          })}
        </div> : null}
      </section>

      {activeAlbum ? <div className="gallery-album-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveAlbum(null); }}>
        <section className="gallery-album-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-album-title">
          <header className="gallery-album-header"><div><span className="home-eyebrow">Album photo</span><h2 id="gallery-album-title">{activeAlbum.title}</h2><p>{activeAlbum.description || `${activeAlbum.images?.length || 0} photos`}</p></div><button type="button" className="gallery-close" onClick={() => setActiveAlbum(null)} aria-label="Fermer l’album"><i className="bi bi-x-lg"/></button></header>
          {activeAlbum.images?.length ? <div className="gallery-photo-grid">{activeAlbum.images.map((image, index) => <button type="button" className="gallery-photo" key={image.id} onClick={() => setActiveImageIndex(index)} aria-label={`Afficher ${image.name || `la photo ${index + 1}`}`}><img src={imageUrl(image.image_url)} alt={image.description || image.name || activeAlbum.title} loading="lazy"/><span><i className="bi bi-arrows-fullscreen"/></span></button>)}</div> : <div className="home-empty">Cet album ne contient pas encore de photo.</div>}
        </section>
      </div> : null}

      {selectedImage ? <div className="gallery-lightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveImageIndex(null); }}>
        <button type="button" className="gallery-lightbox-close" onClick={() => setActiveImageIndex(null)} aria-label="Fermer la photo"><i className="bi bi-x-lg"/></button>
        {activeAlbum.images.length > 1 ? <button type="button" className="gallery-lightbox-prev" onClick={() => setActiveImageIndex((index) => (index - 1 + activeAlbum.images.length) % activeAlbum.images.length)} aria-label="Photo précédente"><i className="bi bi-chevron-left"/></button> : null}
        <figure><img src={imageUrl(selectedImage.image_url)} alt={selectedImage.description || selectedImage.name || activeAlbum.title}/>{(selectedImage.description || selectedImage.name) && <figcaption>{selectedImage.description || selectedImage.name}</figcaption>}</figure>
        {activeAlbum.images.length > 1 ? <button type="button" className="gallery-lightbox-next" onClick={() => setActiveImageIndex((index) => (index + 1) % activeAlbum.images.length)} aria-label="Photo suivante"><i className="bi bi-chevron-right"/></button> : null}
      </div> : null}
    </main>
  );
}
