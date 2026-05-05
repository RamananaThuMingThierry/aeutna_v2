import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { dashboardApi } from "../../api/dashboard";

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  if (Number.isNaN(amount)) return value || "-";

  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "MGA",
    maximumFractionDigits: 0,
  });
}

function formatMonthLabel(value, year) {
  const month = Number(value || 1);
  const date = new Date(year || 2026, Math.max(month - 1, 0), 1);

  return date.toLocaleDateString("fr-FR", {
    month: "short",
  });
}

function StatCard({ title, value, icon, tone = "dark", subtitle }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div className="small text-secondary text-uppercase fw-semibold">{title}</div>
          <div className={`rounded-circle d-inline-flex align-items-center justify-content-center bg-${tone}-subtle text-${tone}`} style={{ width: 44, height: 44 }}>
            <i className={`bi ${icon}`} />
          </div>
        </div>
        <div className="display-6 fw-bold mb-2">{value}</div>
        <div className="small text-secondary">{subtitle}</div>
      </div>
    </div>
  );
}

function ChartBars({ data = [], valueKey, color = "#0f766e", formatValue = (value) => value }) {
  const maxValue = Math.max(...data.map((item) => Number(item?.[valueKey] || 0)), 0);

  if (!data.length) {
    return <div className="text-secondary small">Aucune donnee disponible pour ce filtre.</div>;
  }

  return (
    <div>
      <div className="d-flex align-items-end gap-2" style={{ height: 220 }}>
        {data.map((item) => {
          const value = Number(item?.[valueKey] || 0);
          const height = maxValue > 0 ? Math.max((value / maxValue) * 180, value > 0 ? 10 : 4) : 4;

          return (
            <div key={`${item.label}-${item.year || ""}-${item.month || ""}`} className="d-flex flex-column justify-content-end align-items-stretch flex-fill h-100">
              <div className="small text-secondary text-center mb-2">{formatValue(value)}</div>
              <div
                className="rounded-top-4"
                title={`${item.label}: ${formatValue(value)}`}
                style={{
                  height,
                  background: color,
                  minWidth: 16,
                }}
              />
              <div className="small text-secondary text-center mt-2">{item.short_label || item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsCard({
  title,
  description,
  icon,
  tone = "dark",
  mode,
  onModeChange,
  selectedYear,
  onYearChange,
  availableYears = [],
  data = [],
  valueKey,
  summaryValue,
  summaryLabel,
  formatValue,
}) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex flex-column flex-lg-row align-items-lg-start justify-content-between gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center bg-${tone}-subtle text-${tone}`} style={{ width: 42, height: 42 }}>
                <i className={`bi ${icon}`} />
              </div>
              <h4 className="h5 mb-0">{title}</h4>
            </div>
            <div className="text-secondary small">{description}</div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <div className="btn-group" role="group" aria-label={`${title} mode`}>
              <button type="button" className={`btn btn-sm ${mode === "month" ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => onModeChange("month")}>
                Par mois
              </button>
              <button type="button" className={`btn btn-sm ${mode === "year" ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => onModeChange("year")}>
                Par année
              </button>
            </div>

            {mode === "month" ? (
              <select className="form-select form-select-sm" value={selectedYear} onChange={(event) => onYearChange(Number(event.target.value))}>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        <div className="d-flex align-items-baseline justify-content-between gap-3 mb-3">
          <div className="display-6 fw-bold mb-0">{summaryValue}</div>
          <div className="small text-secondary text-end">{summaryLabel}</div>
        </div>

        <ChartBars data={data} valueKey={valueKey} color={tone === "success" ? "#15803d" : "#b45309"} formatValue={formatValue} />
      </div>
    </div>
  );
}

function statusBadge(status) {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    case "needs_correction":
      return "warning";
    case "submitted":
      return "secondary";
    case "published":
      return "success";
    case "completed":
      return "primary";
    default:
      return "light";
  }
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [membersMode, setMembersMode] = useState("month");
  const [paymentsMode, setPaymentsMode] = useState("month");
  const [membersYear, setMembersYear] = useState(new Date().getFullYear());
  const [paymentsYear, setPaymentsYear] = useState(new Date().getFullYear());

  async function load(mode = "initial") {
    if (mode === "initial") {
      setLoading(true);
      setError("");
    } else {
      setRefreshing(true);
    }

    try {
      const response = await dashboardApi.get();
      setData(response);
    } catch (loadError) {
      const message = loadError?.response?.data?.message || "Impossible de charger le dashboard.";

      if (mode === "initial") {
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load("initial");
  }, []);

  useEffect(() => {
    const defaultYear = data?.analytics?.default_year;

    if (defaultYear) {
      setMembersYear(defaultYear);
      setPaymentsYear(defaultYear);
    }
  }, [data?.analytics?.default_year]);

  const stats = data?.stats || {};
  const analytics = data?.analytics || {};
  const availableYears = analytics?.available_years || [];
  const quickActions = useMemo(
    () => [
      { to: "/admin/member-applications", icon: "bi-person-plus-fill", label: "Traiter les candidatures", note: `${stats.applications_submitted || 0} en attente` },
      { to: "/admin/contacts", icon: "bi-envelope-fill", label: "Repondre aux contacts", note: `${stats.contacts_pending || 0} messages a traiter` },
      { to: "/admin/members", icon: "bi-people-fill", label: "Gerer les membres", note: `${stats.members_total || 0} membres en base` },
      { to: "/admin/activities", icon: "bi-calendar2-event-fill", label: "Publier une actualite", note: `${stats.activities_upcoming || 0} actualités a venir` },
    ],
    [stats]
  );

  const membersMonthlyData = useMemo(() => {
    const source = analytics?.members?.monthly || [];
    const rows = source.filter((item) => Number(item.year) === Number(membersYear));

    if (!rows.length) return [];

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const found = rows.find((item) => Number(item.month) === month);

      return found || {
        year: membersYear,
        month,
        label: `${month}/${membersYear}`,
        short_label: formatMonthLabel(month, membersYear),
        total: 0,
      };
    });
  }, [analytics?.members?.monthly, membersYear]);

  const membersYearlyData = useMemo(
    () => (analytics?.members?.yearly || []).map((item) => ({ ...item, short_label: String(item.year) })),
    [analytics?.members?.yearly]
  );

  const paymentsMonthlyData = useMemo(() => {
    const source = analytics?.payments?.monthly || [];
    const rows = source.filter((item) => Number(item.year) === Number(paymentsYear));

    if (!rows.length) return [];

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const found = rows.find((item) => Number(item.month) === month);

      return found || {
        year: paymentsYear,
        month,
        label: `${month}/${paymentsYear}`,
        short_label: formatMonthLabel(month, paymentsYear),
        total_amount: 0,
        total_payments: 0,
      };
    });
  }, [analytics?.payments?.monthly, paymentsYear]);

  const paymentsYearlyData = useMemo(
    () => (analytics?.payments?.yearly || []).map((item) => ({ ...item, short_label: String(item.year) })),
    [analytics?.payments?.yearly]
  );

  const visibleMembersData = membersMode === "month" ? membersMonthlyData : membersYearlyData;
  const visiblePaymentsData = paymentsMode === "month" ? paymentsMonthlyData : paymentsYearlyData;

  const membersSummary = visibleMembersData.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const paymentsSummary = visiblePaymentsData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

  if (loading) {
    return <div className="text-muted">Chargement du dashboard...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">Dashboard</h3>
          <p className="text-secondary mb-0">
            Vue d&apos;ensemble de l&apos;administration AEUTNA.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => void load("refresh")} disabled={refreshing}>
            {refreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Rafraichissement...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-2" />
                Rafraichir
              </>
            )}
          </button>
          <Link to="/admin/member-applications" className="btn btn-dark">
            <i className="bi bi-person-plus-fill me-2" />
            Voir les candidatures
          </Link>
        </div>
      </div>

      {error ? <div className="alert alert-danger py-2 mb-4">{error}</div> : null}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            title="Membres actifs"
            value={stats.members_active || 0}
            icon="bi-people-fill"
            tone="success"
            subtitle={`${stats.members_total || 0} membres au total`}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            title="Candidatures"
            value={stats.applications_submitted || 0}
            icon="bi-person-plus-fill"
            tone="warning"
            subtitle={`${stats.applications_approved || 0} approuvées`}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            title="Messages contacts"
            value={stats.contacts_pending || 0}
            icon="bi-envelope-open-fill"
            tone="primary"
            subtitle={`${stats.contacts_answered || 0} déjà repondus`}
          />
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <StatCard
            title="Cotisations"
            value={stats.payments_validated || 0}
            icon="bi-cash-coin"
            tone="dark"
            subtitle={`${stats.payments_pending || 0} en attente de validation`}
          />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-6">
          <AnalyticsCard
            title="Membres inscrits"
            description="Suivi des inscriptions de membres par mois ou par année."
            icon="bi-people-fill"
            tone="success"
            mode={membersMode}
            onModeChange={setMembersMode}
            selectedYear={membersYear}
            onYearChange={setMembersYear}
            availableYears={availableYears}
            data={visibleMembersData}
            valueKey="total"
            summaryValue={membersSummary}
            summaryLabel={membersMode === "month" ? `Total des inscriptions sur ${membersYear}` : "Total des inscriptions par année"}
            formatValue={(value) => value}
          />
        </div>
        <div className="col-12 col-xl-6">
          <AnalyticsCard
            title="Montants des cotisations"
            description="Montants valides encaisses, consultables par mois ou par année."
            icon="bi-cash-coin"
            tone="warning"
            mode={paymentsMode}
            onModeChange={setPaymentsMode}
            selectedYear={paymentsYear}
            onYearChange={setPaymentsYear}
            availableYears={availableYears}
            data={visiblePaymentsData}
            valueKey="total_amount"
            summaryValue={formatCurrency(paymentsSummary)}
            summaryLabel={paymentsMode === "month" ? `Montant valide cumule sur ${paymentsYear}` : "Montant valide cumule par année"}
            formatValue={(value) => (Number(value || 0) > 0 ? formatCurrency(value) : "0")}
          />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                <div>
                  <h4 className="h5 mb-1">Synthèse rapide</h4>
                  <p className="text-secondary small mb-0">
                    Situation courante des modules les plus utilises.
                  </p>
                </div>
                <div className="small text-secondary">Mise a jour: {formatDate(data?.generated_at)}</div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="rounded-4 p-3 h-100" style={{ background: "rgba(15,23,42,0.04)" }}>
                    <div className="small text-uppercase fw-semibold text-secondary mb-2">Adhesions</div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Soumises</span>
                      <strong>{stats.applications_submitted || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>A corriger</span>
                      <strong>{stats.applications_needs_correction || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Approuvees</span>
                      <strong>{stats.applications_approved || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="rounded-4 p-3 h-100" style={{ background: "rgba(15,23,42,0.04)" }}>
                    <div className="small text-uppercase fw-semibold text-secondary mb-2">Actualités</div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Total</span>
                      <strong>{stats.activities_total || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Publiees</span>
                      <strong>{stats.activities_published || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>A venir</span>
                      <strong>{stats.activities_upcoming || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="rounded-4 p-3 h-100" style={{ background: "rgba(15,23,42,0.04)" }}>
                    <div className="small text-uppercase fw-semibold text-secondary mb-2">Utilisateurs et bureau</div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Utilisateurs</span>
                      <strong>{stats.users_total || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Membres du bureau</span>
                      <strong>{stats.bureau_members || 0}</strong>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="rounded-4 p-3 h-100" style={{ background: "rgba(15,23,42,0.04)" }}>
                    <div className="small text-uppercase fw-semibold text-secondary mb-2">Cotisation annuelle active</div>
                    {data?.active_annual_fee ? (
                      <>
                        <div className="fw-bold fs-5 mb-1">{formatCurrency(data.active_annual_fee.amount)}</div>
                        <div className="small text-secondary">Année {data.active_annual_fee.year}</div>
                        <div className="small text-secondary">Echeance: {formatShortDate(data.active_annual_fee.due_date)}</div>
                      </>
                    ) : (
                      <div className="text-secondary small">Aucune cotisation annuelle active.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h4 className="h5 mb-3">Raccourcis</h4>
              <div className="d-grid gap-2">
                {quickActions.map((item) => (
                  <Link key={item.to} to={item.to} className="btn btn-outline-dark text-start rounded-4 p-3">
                    <div className="d-flex align-items-start gap-3">
                      <i className={`bi ${item.icon} fs-5`} />
                      <div>
                        <div className="fw-semibold">{item.label}</div>
                        <div className="small text-secondary">{item.note}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="h5 mb-0">Candidatures récentes</h4>
                <Link to="/admin/member-applications" className="small text-decoration-none">Tout voir</Link>
              </div>
              <div className="d-grid gap-3">
                {(data?.recent_applications || []).map((item) => (
                  <div key={item.encrypted_id || item.id} className="border rounded-4 p-3">
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <div className="fw-semibold">{item.last_name} {item.first_name}</div>
                      <span className={`badge text-bg-${statusBadge(item.status)}`}>{item.status || "submitted"}</span>
                    </div>
                    <div className="small text-secondary">{item.institution_name || "-"}</div>
                    <div className="small text-secondary">{item.axis?.name || item.education_level?.name || "-"}</div>
                    <div className="small text-secondary mt-2">{formatDate(item.created_at)}</div>
                  </div>
                ))}
                {!data?.recent_applications?.length ? <div className="text-secondary small">Aucune candidature récente.</div> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="h5 mb-0">Messages récents</h4>
                <Link to="/admin/contacts" className="small text-decoration-none">Tout voir</Link>
              </div>
              <div className="d-grid gap-3">
                {(data?.recent_contacts || []).map((item) => (
                  <div key={item.encrypted_id || item.id} className="border rounded-4 p-3">
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <div className="fw-semibold">{item.name || "-"}</div>
                      <span className={`badge text-bg-${item.responded_at ? "success" : "warning"}`}>
                        {item.responded_at ? "Repondu" : "En attente"}
                      </span>
                    </div>
                    <div className="small text-secondary">{item.subject || "-"}</div>
                    <div className="small text-secondary text-truncate">{item.email || "-"}</div>
                    <div className="small text-secondary mt-2">{formatDate(item.created_at)}</div>
                  </div>
                ))}
                {!data?.recent_contacts?.length ? <div className="text-secondary small">Aucun message récent.</div> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="h5 mb-0">Actualités et journal</h4>
                <Link to="/admin/activity-logs" className="small text-decoration-none">Voir les logs</Link>
              </div>

              <div className="mb-4">
                <div className="small text-uppercase text-secondary fw-semibold mb-2">Actualités a venir</div>
                <div className="d-grid gap-2">
                  {(data?.upcoming_activities || []).map((item) => (
                    <div key={item.encrypted_id || item.id} className="border rounded-4 p-3">
                      <div className="fw-semibold">{item.title || "-"}</div>
                      <div className="small text-secondary">{item.location || "-"}</div>
                      <div className="small text-secondary">{formatDate(item.starts_at)}</div>
                    </div>
                  ))}
                  {!data?.upcoming_activities?.length ? <div className="text-secondary small">Aucune actualité planifiée.</div> : null}
                </div>
              </div>

              <div>
                <div className="small text-uppercase text-secondary fw-semibold mb-2">Derniers logs</div>
                <div className="d-grid gap-2">
                  {(data?.recent_logs || []).map((item) => (
                    <div key={item.id} className="border rounded-4 p-3">
                      <div className="fw-semibold">{item.message || item.action || "-"}</div>
                      <div className="small text-secondary">{item.user?.name || "Systeme"} · {item.method || "-"}</div>
                      <div className="small text-secondary">{formatDate(item.created_at)}</div>
                    </div>
                  ))}
                  {!data?.recent_logs?.length ? <div className="text-secondary small">Aucun log recent.</div> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
