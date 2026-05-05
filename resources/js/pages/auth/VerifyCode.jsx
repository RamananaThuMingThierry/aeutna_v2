import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { verifyResetCodeApi } from "../../api/auth";

export default function VerifyCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const infoMessage = location.state?.message || "Saisis le code recu par email.";

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await verifyResetCodeApi({
        email: email.trim(),
        code: code.trim(),
      });

      const token = response?.reset_token || "";

      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`, {
        replace: true,
        state: { token },
      });
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat().find(Boolean) : null;
      setError(firstError || err?.response?.data?.message || "Vérification impossible.");
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
                <h1 className="h3 mb-2">Vérification du code</h1>
                <p className="text-muted mb-0">{infoMessage}</p>
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

                <div>
                  <label htmlFor="code" className="form-label">Code</label>
                  <input
                    id="code"
                    type="text"
                    className="form-control"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-dark py-2" disabled={loading}>
                  {loading ? "Vérification..." : "Vérifier le code"}
                </button>
              </form>

              <div className="mt-4 text-center d-grid gap-2">
                <Link to="/forgot-password" className="text-decoration-none">Renvoyer / changer l'email</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

