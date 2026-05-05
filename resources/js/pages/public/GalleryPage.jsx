import React, { useEffect, useMemo, useState } from "react";

import { websiteApi } from "../../api/website";

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "/images/avatar.png";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("/")) {
    return imageUrl;
  }
  return `/${imageUrl.replace(/^\/+/, "")}`;
}

export default function GalleryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeAlbumId, setActiveAlbumId] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await websiteApi.gallery();
        if (!active) return;
        setData(response);
        setActiveAlbumId(response?.albums?.[0]?.id ?? null);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.message || "Impossible de charger la galerie.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const albums = useMemo(() => data?.albums || [], [data]);
  const activeAlbum = useMemo(
    () => albums.find((album) => album.id === activeAlbumId) || albums[0] || null,
    [albums, activeAlbumId]
  );

  if (loading) {
    return <div className="container py-5">Chargement...</div>;
  }

  if (error) {
    return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div>
      <section className="py-5 py-lg-6">
        <div className="container">
          <div className="rounded-2 overflow-hidden shadow-lg p-4 p-lg-5 mb-5" style={{ background: "linear-gradient(135deg, rgba(17,94,89,0.96), rgba(194,65,12,0.86))" }}>
            <div className="row g-4 align-items-center">
              <div className="col-lg-8 text-white">
                <h1 className="fw-bold mb-3">Albums et souvenirs de l'association</h1>
                <p className="lead text-white-50 mb-0">
                  Parcourez les albums publics et consultez les images partagees par l association.
                </p>
              </div>
              <div className="col-lg-4">
                <div className="rounded-2 p-4" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
                  <div className="text-white-50 small text-uppercase fw-semibold mb-2">Albums publics</div>
                  <div className="fw-bold text-white">{albums.length}</div>
                </div>
              </div>
            </div>
          </div>

          {albums.length === 0 ? (
            <div className="alert alert-secondary text-center">Aucun album public disponible pour le moment.</div>
          ) : (
            <>
              <div className="d-md-none mb-4">
                <label className="form-label fw-semibold">Choisir un album</label>
                <select
                  className="form-select"
                  value={activeAlbum?.id || ""}
                  onChange={(event) => setActiveAlbumId(Number(event.target.value))}
                >
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title} ({album.images_count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-none d-md-flex flex-wrap gap-2 mb-4 overflow-visible">
                {albums.map((album) => (
                  <button
                    key={album.id}
                    type="button"
                    className={`btn rounded-pill px-4 text-nowrap ${activeAlbum?.id === album.id ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => setActiveAlbumId(album.id)}
                  >
                    {album.title} ({album.images_count})
                  </button>
                ))}
              </div>

              {activeAlbum ? (
                <section className="mb-5">
                  <div className="row g-4 align-items-center mb-4">
                       <div className="col-12">
                      <div className="p-4 p-lg-5 rounded-2 shadow-sm h-100" style={{ background: "var(--panel)" }}>
                        <div className="text-uppercase small fw-bold mb-2" style={{ color: "var(--warm)", letterSpacing: "0.14em" }}>
                          Album selectionne
                        </div>
                        <h2 className="fw-bold mb-3">{activeAlbum.title}</h2>
                        <p className="text-secondary fs-5 mb-4">{activeAlbum.description || "Aucune description disponible pour cet album."}</p>
                        <div className="p-3 rounded-4 d-inline-block" style={{ background: "var(--panel-strong)" }}>
                          <div className="small text-uppercase text-secondary fw-semibold">Images</div>
                          <div className="fw-bold fs-4">{activeAlbum.images_count}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    {activeAlbum.images.map((image, index) => (
                      <div key={image.id} className={index % 5 === 0 ? "col-md-6 col-lg-4" : "col-md-6 col-lg-3"}>
                        <div className="rounded-2 overflow-hidden shadow-sm h-100 position-relative">
                          <img
                            src={resolveImageUrl(image.image_url)}
                            alt={image.name || activeAlbum.title}
                            className="w-100 h-100 object-fit-cover"
                            style={{ minHeight: 240 }}
                          />
                          <div className="position-absolute top-0 end-0 p-3">
                            <a
                              href={resolveImageUrl(image.image_url)}
                              className="btn btn-sm btn-light shadow-sm"
                              download
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Telecharger ${image.name || activeAlbum.title}`}
                            >
                              <i className="bi bi-download" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
