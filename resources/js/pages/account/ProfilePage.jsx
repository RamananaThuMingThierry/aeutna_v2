import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import SEO from "../../components/seo/SEO";
import { meApi, updateProfileApi } from "../../api/auth";

function normalizeRoles(user, fallbackRoles) {
  const roles = Array.isArray(user?.roles) ? user.roles : Array.isArray(fallbackRoles) ? fallbackRoles : [];

  return roles
    .map((role) => (typeof role === "string" ? role : role?.code))
    .filter(Boolean);
}

function resolveAvatarUrl(avatar) {
  if (!avatar) return "";
  if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("blob:")) return avatar;

  const normalizedAvatar = avatar.replace(/^\/+/, "");

  if (normalizedAvatar.startsWith("uploads/")) return `/${normalizedAvatar}`;

  return `/storage/${normalizedAvatar}`;
}

export default function ProfilePage({ embedded = false }) {
  const avatarInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarStoredUrl, setAvatarStoredUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const data = await meApi();
      const user = data?.user || null;
      const nextRoles = normalizeRoles(user, data?.roles);

      setForm({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        password: "",
        password_confirmation: "",
      });
      setAvatarFile(null);
      setAvatarStoredUrl(resolveAvatarUrl(user?.avatar || ""));
      setAvatarPreview(resolveAvatarUrl(user?.avatar || ""));
      setRoles(nextRoles);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("roles", JSON.stringify(nextRoles));
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de charger votre profil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage("");
    setError("");

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("email", form.email);
    payload.append("phone", form.phone || "");

    if (avatarFile) payload.append("avatar", avatarFile);

    if (form.password) {
      payload.append("password", form.password);
      payload.append("password_confirmation", form.password_confirmation);
    }

    try {
      const data = await updateProfileApi(payload);
      const user = data?.user || null;
      const nextRoles = normalizeRoles(user, data?.roles);

      setMessage(data?.message || "Profil mis a jour avec succes.");
      setRoles(nextRoles);
      setForm((current) => ({
        ...current,
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        password: "",
        password_confirmation: "",
      }));
      setAvatarFile(null);
      setAvatarStoredUrl(resolveAvatarUrl(user?.avatar || ""));
      setAvatarPreview(resolveAvatarUrl(user?.avatar || ""));
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("roles", JSON.stringify(nextRoles));

      window.location.reload();
    } catch (err) {
      setErrors(err?.response?.data?.errors || {});
      setError(err?.response?.data?.message || "Impossible de mettre a jour votre profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SEO page="account" />
      <div className={embedded ? "" : "container py-4 py-lg-5"}>
        <div className={embedded ? "" : "row justify-content-center"}>
          <div className={embedded ? "col-12" : "col-12 col-xl-10"}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <h1 className="h3 mb-1">Mon compte</h1>
                <p className="text-secondary mb-0">Modifiez vos informations personnelles. Vos roles restent en lecture seule.</p>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {!embedded ? <Link to="/" className="btn btn-light border">Retour au site</Link> : null}
                {(roles.includes("bureau") || roles.includes("admin") || roles.includes("super_admin")) && !embedded ? (
                  <Link to="/admin/dashboard" className="btn btn-dark">Aller a l'admin</Link>
                ) : null}
              </div>
            </div>

            {message ? <div className="alert alert-success">{message}</div> : null}
            {error ? <div className="alert alert-danger">{error}</div> : null}

            <div className="row g-4">
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm h-100 bg-light">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar utilisateur" className="rounded-circle object-fit-cover border" style={{ width: "64px", height: "64px" }} />
                      ) : (
                        <div className="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center fw-semibold" style={{ width: "64px", height: "64px" }}>
                          {(form.name || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="fw-semibold">{form.name || "Utilisateur"}</div>
                        <div className="small text-secondary">{form.email || "-"}</div>
                      </div>
                    </div>

                    <div className="small text-secondary mb-2">Roles</div>
                    <div className="d-flex flex-wrap gap-2 mb-4">
                      {roles.length > 0 ? roles.map((role) => (
                        <span key={role} className="badge text-bg-light border text-dark text-uppercase">{role}</span>
                      )) : <span className="text-secondary small">Aucun role</span>}
                    </div>

                    <div className="small text-secondary mb-1">Statut</div>
                    <div className="fw-semibold">Compte personnel</div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="card border-0 shadow-sm bg-light">
                  <div className="card-body p-4 p-lg-5">
                    {loading ? (
                      <div className="text-center py-5 text-secondary">Chargement du profil...</div>
                    ) : (
                      <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-12">
                          <label className="form-label">Avatar</label>
                          <input
                            ref={avatarInputRef}
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setAvatarFile(file);
                              setAvatarPreview(file ? URL.createObjectURL(file) : avatarStoredUrl);
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Nom</label>
                          <input className="form-control" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                          {errors.name ? <div className="text-danger small mt-1">{errors.name[0]}</div> : null}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Email</label>
                          <input type="email" className="form-control" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                          {errors.email ? <div className="text-danger small mt-1">{errors.email[0]}</div> : null}
                        </div>
                        <div className="col-12">
                          <label className="form-label">Telephone</label>
                          <input className="form-control" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                          {errors.phone ? <div className="text-danger small mt-1">{errors.phone[0]}</div> : null}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Nouveau mot de passe</label>
                          <input type="password" className="form-control" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
                          {errors.password ? <div className="text-danger small mt-1">{errors.password[0]}</div> : null}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Confirmation mot de passe</label>
                          <input type="password" className="form-control" value={form.password_confirmation} onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))} />
                        </div>
                        <div className="col-12 d-flex justify-content-end">
                          <button type="submit" className="btn btn-dark px-4" disabled={saving}>{saving ? "Enregistrement..." : "Mettre a jour"}</button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
