import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { resetPasswordApi } from "../../api/auth";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const tokenFromState = location.state?.token || sessionStorage.getItem("reset_password_token") || "";
  const [form, setForm] = useState({
    email: initialEmail,
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await resetPasswordApi({
        email: form.email.trim(),
        token: tokenFromState,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      sessionStorage.removeItem("reset_password_token");
      setSuccess(response?.message || "Mot de passe mis à jour.");
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat().find(Boolean) : null;
      setError(firstError || err?.response?.data?.message || "Reinitialisation impossible.");
    } finally {
      setLoading(false);
    }
  }

  if (!tokenFromState) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div className="alert alert-warning">
              SSession de réinitialisation manquante. <Link to="/forgot-password">Recommencer</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-lg-5">
              <div className="mb-4 text-center">
                <h1 className="h3 mb-2">Nouveau mot de passe</h1>
                <p className="text-muted mb-0">Choisis un nouveau mot de passe sécurise.</p>
              </div>

              {success ? <div className="alert alert-success">{success}</div> : null}
              {error ? <div className="alert alert-danger">{error}</div> : null}

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <div>
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="form-label">Mot de passe</label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="form-label">Confirmation</label>
                  <input
                    id="password_confirmation"
                    type="password"
                    className="form-control"
                    value={form.password_confirmation}
                    onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-dark py-2" disabled={loading}>
                  {loading ? "Mise a jour..." : "Réinitialiser le mot de passe"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-decoration-none">Retour à la connexion</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
