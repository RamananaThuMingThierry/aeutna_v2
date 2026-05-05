import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { forgotPasswordApi } from "../../api/auth";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await forgotPasswordApi({ email: email.trim() });
      navigate(`/verify-code?email=${encodeURIComponent(email.trim())}`, {
        replace: true,
        state: { message: response?.message || "Code envoye." },
      });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat().find(Boolean) : null;
      setError(firstError || err?.response?.data?.message || "Demande impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-lg-5">
              <div className="mb-4 text-center">
                <h1 className="h3 mb-2">Mot de passe oublie</h1>
                <p className="text-muted mb-0">
                  Saisis ton email pour recevoir un code de vérification.
                </p>
              </div>

              {error ? <div className="alert alert-danger">{error}</div> : null}

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <div>
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-dark py-2" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer le code"}
                </button>
              </form>

              <div className="mt-4 text-center d-grid gap-2">
                <Link to="/login" className="text-decoration-none">Retour à la connexion</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
