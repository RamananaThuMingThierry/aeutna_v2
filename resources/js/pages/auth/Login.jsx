import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { loginApi, meApi } from "../../api/auth";
import { setApiToken } from "../../api/axios";
import "bootstrap-icons/font/bootstrap-icons.css";

function normalizeRoles(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  return roles
    .map((role) => (typeof role === "string" ? role : role?.code))
    .filter(Boolean);
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [redirectTo, setRedirectTo] = useState(null);

  const existingToken = localStorage.getItem("token");

  useEffect(() => {
    let mounted = true;

    async function checkExistingAuth() {
      if (!existingToken) {
        if (mounted) {
          setAuthChecking(false);
        }
        return;
      }

      try {
        setApiToken(existingToken);
        const data = await meApi();
        const user = data?.user || null;
        const roles = normalizeRoles(user);

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("roles", JSON.stringify(roles));

        if (!mounted) return;

        if (roles.includes("bureau") || roles.includes("admin") || roles.includes("super_admin")) {
          setRedirectTo("/admin/dashboard");
        } else if (roles.includes("member")) {
          setRedirectTo("/account");
        } else {
          setRedirectTo("/");
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("roles");
        setApiToken("");

        if (mounted) {
          setRedirectTo(null);
        }
      } finally {
        if (mounted) {
          setAuthChecking(false);
        }
      }
    }

    void checkExistingAuth();

    return () => {
      mounted = false;
    };
  }, [existingToken]);

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (authChecking) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5 text-center">
                <div className="spinner-border text-dark mb-3" role="status" />
                <div>Verification de la session...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginApi(form);
      const token = data?.token || "";
      const user = data?.user || null;
      const roles = normalizeRoles(user);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("roles", JSON.stringify(roles));
      setApiToken(token);

      if (roles.includes("bureau") || roles.includes("admin") || roles.includes("super_admin")) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (roles.includes("member")) {
        navigate("/account", { replace: true });
        return;
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          (err?.request ? "Serveur de connexion injoignable." : "Connexion impossible.")
      );
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
                <h1 className="h3 mb-2">Connexion</h1>
                <p className="text-muted mb-0">
                  Connecte-toi avec ton email et ton mot de passe.
                </p>
              </div>

              {error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <div>
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="form-label">
                    Mot de passe
                  </label>
                  <div className="position-relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="form-control pe-5"
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, password: event.target.value }))
                      }
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-secondary shadow-none"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      style={{ zIndex: 3 }}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                  <div className="form-check">
                    <input
                      id="remember"
                      type="checkbox"
                      className="form-check-input"
                      checked={form.remember}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, remember: event.target.checked }))
                      }
                    />
                    <label htmlFor="remember" className="form-check-label">
                      Se souvenir de moi
                    </label>
                  </div>

                  <Link to="/forgot-password" className="text-decoration-none small">
                    Mot de passe oublie ?
                  </Link>
                </div>

                <button type="submit" className="btn btn-dark py-2" disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <span className="text-muted">Pas encore de compte ? </span>
                <Link to="/register" className="text-decoration-none">
                  Creer un compte
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
