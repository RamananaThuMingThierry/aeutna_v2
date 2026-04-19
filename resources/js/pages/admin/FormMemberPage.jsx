import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { axesApi } from "../../api/axe";
import { educationLevelsApi } from "../../api/education-level";
import { functionsApi } from "../../api/function";
import { membersApi } from "../../api/member";
import { useI18n } from "../../hooks/website/I18nContext";

const STATUS_OPTIONS = ["pending", "active", "inactive", "suspended", "archived"];
const MEMBER_TYPE_OPTIONS = [
  { value: "member", label: "Membre" },
  { value: "bureau", label: "Bureau" },
];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function getNextMemberNumber(items = []) {
  const maxNumber = items.reduce((max, item) => {
    const raw = String(item?.member_number ?? "").replace(/\D+/g, "");
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);

  return String(maxNumber + 1);
}

function emptyForm() {
  return {
    member_type: "member", axis_id: "", education_level_id: "", member_number: "",
    first_name: "", last_name: "", gender: "", birth_date: "", birth_place: "", photo: "",
    email: "", phone: "", alternative_phone: "", address: "", city: "", cin: "", facebook: "",
    institution_name: "", field_of_study: "", is_student: false, is_sympathizer: false,
    is_from_antalaha: true, status: "pending", joined_at: todayIsoDate(), notes: "",
    function_ids: [], function_start_date: todayIsoDate(), function_end_date: "", function_notes: "",
  };
}

function resolvePhotoUrl(photo) {
  if (!photo) return "/images/avatar.png";
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) {
    return photo;
  }
  return `/${photo.replace(/^\/+/, "")}`;
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card border-0 bg-light shadow-none h-100">
      <div className="card-body p-4">
        <div className="mb-4">
          <h5 className="mb-1">{title}</h5>
          {subtitle ? <p className="text-muted small mb-0">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldError({ error }) {
  return error ? <span className="text-danger small d-block mt-1">{error[0]}</span> : null;
}

export default function FormMemberPage() {
  const { encryptedId } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const isEdit = Boolean(encryptedId);
  const [axes, setAxes] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setGlobalError("");

      try {
        const [axesList, levelsList, functionsList, memberData, membersListResponse] = await Promise.all([
          axesApi.list(),
          educationLevelsApi.list(),
          functionsApi.list(),
          isEdit ? membersApi.show(encryptedId) : Promise.resolve(null),
          isEdit ? Promise.resolve([]) : membersApi.list({ with_trashed: 1 }),
        ]);

        if (!active) return;

        setAxes(normalizeCollection(axesList));
        setEducationLevels(normalizeCollection(levelsList));
        setFunctions(normalizeCollection(functionsList));
        const membersList = normalizeCollection(membersListResponse);

        if (memberData?.member) {
          const member = memberData.member;
          const currentFunctions = Array.isArray(member?.current_member_functions) ? member.current_member_functions : [];
          setForm({
            member_type: member?.member_type ?? "member",
            axis_id: member?.axis_id ?? "",
            education_level_id: member?.education_level_id ?? "",
            member_number: member?.member_number ?? "",
            first_name: member?.first_name ?? "",
            last_name: member?.last_name ?? "",
            gender: member?.gender ?? "",
            birth_date: normalizeDateInput(member?.birth_date),
            birth_place: member?.birth_place ?? "",
            photo: member?.photo ?? "",
            email: member?.email ?? "",
            cin: member?.cin ?? "",
            facebook: member?.facebook ?? "",
            phone: member?.phone ?? "",
            alternative_phone: member?.alternative_phone ?? "",
            address: member?.address ?? "",
            city: member?.city ?? "",
            institution_name: member?.institution_name ?? "",
            field_of_study: member?.field_of_study ?? "",
            is_student: !!member?.is_student,
            is_sympathizer: !!member?.is_sympathizer,
            is_from_antalaha: member?.is_from_antalaha ?? true,
            status: member?.status ?? "pending",
            joined_at: normalizeDateInput(member?.joined_at) || todayIsoDate(),
            notes: member?.notes ?? "",
            function_ids: currentFunctions.map((item) => String(item.function_id)),
            function_start_date: normalizeDateInput(currentFunctions[0]?.start_date) || normalizeDateInput(member?.joined_at) || todayIsoDate(),
            function_end_date: normalizeDateInput(currentFunctions[0]?.end_date),
            function_notes: currentFunctions[0]?.notes ?? "",
          });
        } else {
          setForm((current) => ({
            ...current,
            member_number: current.member_number || getNextMemberNumber(membersList),
          }));
        }
      } catch (error) {
        if (!active) return;
        setGlobalError(error?.response?.data?.message || t("members.toast.loadFailed", "Impossible de charger le formulaire membre."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [encryptedId, isEdit, t]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      const nextValue = type === "checkbox" ? checked : value;

      if (name === "member_type") {
        if (nextValue === "member") {
          return {
            ...current,
            member_type: nextValue,
            function_ids: [],
            function_start_date: current.function_start_date || current.joined_at || todayIsoDate(),
            function_end_date: "",
            function_notes: "",
          };
        }

        return {
          ...current,
          member_type: nextValue,
          function_start_date: current.function_start_date || current.joined_at || todayIsoDate(),
        };
      }

      if (name === "function_ids") {
        return {
          ...current,
          function_ids: Array.from(event.target.selectedOptions).map((option) => option.value),
        };
      }

      return { ...current, [name]: nextValue };
    });
  }

  function buildPayload() {
    const payload = new FormData();

    const fields = {
      axis_id: form.axis_id,
      education_level_id: form.education_level_id,
      member_number: form.member_number.trim(),
      member_type: form.member_type,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      gender: form.gender.trim(),
      birth_date: form.birth_date,
      birth_place: form.birth_place.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      cin: form.cin.trim(),
      facebook: form.facebook.trim(),
      alternative_phone: form.alternative_phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      institution_name: form.institution_name.trim(),
      field_of_study: form.field_of_study.trim(),
      status: form.status,
      joined_at: form.joined_at,
      notes: form.notes.trim(),
      function_start_date: form.member_type === "bureau" ? form.function_start_date : "",
      function_end_date: form.member_type === "bureau" ? form.function_end_date : "",
      function_notes: form.member_type === "bureau" ? form.function_notes.trim() : "",
    };

    Object.entries(fields).forEach(([key, value]) => {
      payload.append(key, value || "");
    });

    if (form.member_type === "bureau") {
      form.function_ids.forEach((functionId) => {
        payload.append("function_ids[]", functionId);
      });
    }

    payload.append("is_student", form.is_student ? "1" : "0");
    payload.append("is_sympathizer", form.is_sympathizer ? "1" : "0");
    payload.append("is_from_antalaha", form.is_from_antalaha ? "1" : "0");

    if (photoFile) {
      payload.append("photo", photoFile);
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setGlobalError("");

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setErrors({
        first_name: !form.first_name.trim() ? [t("members.toast.firstNameRequired", "Le prenom est obligatoire.")] : undefined,
        last_name: !form.last_name.trim() ? [t("members.toast.lastNameRequired", "Le nom est obligatoire.")] : undefined,
      });
      return;
    }

    if (form.member_type === "bureau" && !form.function_ids.length) {
      setErrors({
        function_ids: ["Au moins une fonction du bureau est obligatoire."],
      });
      return;
    }

    setSaving(true);

    try {
      if (isEdit) await membersApi.update(encryptedId, buildPayload());
      else await membersApi.create(buildPayload());

      navigate("/admin/members", {
        replace: true,
        state: { flashMessage: isEdit ? "Membre mis a jour." : "Membre cree." },
      });
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setGlobalError(data?.message || t("members.toast.saveFailed", "Echec de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  }

  const currentPhotoUrl = photoPreview || resolvePhotoUrl(form.photo);
  const executiveFunctions = functions.filter((item) => !!item?.is_executive);

  return (
    <div>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">{isEdit ? "Modifier membre" : "Nouveau membre"}</h3>
          <p className="text-secondary mb-0">Formulaire de creation et de mise a jour d&apos;un membre.</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/members" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2" />
            Retour a la liste
          </Link>
        </div>
      </div>

      {globalError ? <div className="alert alert-danger">{globalError}</div> : null}

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 text-muted">
              <div className="spinner-border spinner-border-sm" />
              Chargement...
            </div>
          </div>
        </div>
      ) : (
        <form id="member-form" onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-xl-4">
              <div className="d-flex flex-column gap-4">
                <SectionCard title="Photo" subtitle="Image du membre et apercu">
                  <div className="text-center">
                    <div
                      className="rounded-4 overflow-hidden border bg-light-subtle mx-auto mb-3 d-flex align-items-center justify-content-center"
                      style={{ width: "180px", height: "180px" }}
                    >
                      <img
                        src={currentPhotoUrl}
                        alt="Apercu membre"
                        className="w-100 h-100 object-fit-cover"
                      />
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      className={`form-control ${errors.photo ? "is-invalid" : ""}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setPhotoFile(file);

                        if (photoPreview) URL.revokeObjectURL(photoPreview);
                        setPhotoPreview(file ? URL.createObjectURL(file) : "");
                      }}
                    />
                    <div className="form-text">
                      Image par defaut affichee tant qu&apos;aucune photo n&apos;est selectionnee.
                    </div>
                    {form.photo && !photoFile ? <div className="small text-muted mt-2">Image actuelle conservee.</div> : null}
                    {photoFile ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary mt-3"
                        onClick={() => {
                          setPhotoFile(null);
                          if (photoPreview) URL.revokeObjectURL(photoPreview);
                          setPhotoPreview("");
                        }}
                      >
                        Retirer l&apos;image
                      </button>
                    ) : null}
                    <FieldError error={errors.photo} />
                  </div>
                </SectionCard>

                <SectionCard title="Statut" subtitle="Etat et rattachement du membre">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Type de membre</label>
                      <select className="form-select" name="member_type" value={form.member_type} onChange={handleFormChange}>
                        {MEMBER_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Statut</label>
                      <select className="form-select" name="status" value={form.status} onChange={handleFormChange}>
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Numero membre</label>
                      <input className="form-control" name="member_number" value={form.member_number} onChange={handleFormChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Axe</label>
                      <select className="form-select" name="axis_id" value={form.axis_id} onChange={handleFormChange}>
                        <option value="">Aucun</option>
                        {axes.map((axe) => <option key={axe.id} value={axe.id}>{axe.name}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Niveau d&apos;education</label>
                      <select className="form-select" name="education_level_id" value={form.education_level_id} onChange={handleFormChange}>
                        <option value="">Aucun</option>
                        {educationLevels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Date adhesion</label>
                      <input type="date" className="form-control" name="joined_at" value={form.joined_at} onChange={handleFormChange} />
                    </div>
                    {form.member_type === "bureau" ? (
                      <>
                        <div className="col-12">
                          <label className="form-label">Fonctions du bureau</label>
                          <select className={`form-select ${errors.function_ids ? "is-invalid" : ""}`} name="function_ids" value={form.function_ids} onChange={handleFormChange} multiple size={Math.min(6, Math.max(3, executiveFunctions.length || 3))}>
                            {executiveFunctions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                          <div className="form-text">Maintiens `Ctrl` ou `Cmd` pour selectionner plusieurs fonctions.</div>
                          <FieldError error={errors.function_ids} />
                          {!executiveFunctions.length ? <div className="small text-muted mt-2">Aucune fonction de bureau active n&apos;est disponible.</div> : null}
                        </div>
                        <div className="col-12">
                          <label className="form-label">Debut de fonction</label>
                          <input type="date" className="form-control" name="function_start_date" value={form.function_start_date} onChange={handleFormChange} />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Fin de fonction</label>
                          <input type="date" className="form-control" name="function_end_date" value={form.function_end_date} onChange={handleFormChange} />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Notes sur la fonction</label>
                          <textarea className="form-control" rows={3} name="function_notes" value={form.function_notes} onChange={handleFormChange} />
                        </div>
                      </>
                    ) : null}
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="col-xl-8">
              <div className="d-flex flex-column gap-4">
                <SectionCard title="Identite" subtitle="Informations personnelles du membre">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Prenom</label>
                      <input className={`form-control ${errors.first_name ? "is-invalid" : ""}`} name="first_name" value={form.first_name} onChange={handleFormChange} />
                      <FieldError error={errors.first_name} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Nom</label>
                      <input className={`form-control ${errors.last_name ? "is-invalid" : ""}`} name="last_name" value={form.last_name} onChange={handleFormChange} />
                      <FieldError error={errors.last_name} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Carte d'identité National (C.I.N)</label>
                      <input type="number" className={`form-control ${errors.cin ? "is-invalid" : ""}`} name="cin" value={form.cin} onChange={handleFormChange}/>
                      <FieldError error={errors.cin} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Genre</label>
                      <select className="form-select" name="gender" value={form.gender} onChange={handleFormChange}>
                        <option value="">Selectionner</option>
                        <option value="Homme">Homme</option>
                        <option value="Femme">Femme</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date naissance</label>
                      <input type="date" className="form-control" name="birth_date" value={form.birth_date} onChange={handleFormChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Lieu naissance</label>
                      <input className="form-control" name="birth_place" value={form.birth_place} onChange={handleFormChange} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Contact" subtitle="Coordonnees et adresse">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" name="email" value={form.email} onChange={handleFormChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Facebook</label>
                      <input className="form-control" name="facebook" value={form.facebook} onChange={handleFormChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Téléphone</label>
                      <input className="form-control" name="phone" value={form.phone} onChange={handleFormChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Téléphone alternatif</label>
                      <input className="form-control" name="alternative_phone" value={form.alternative_phone} onChange={handleFormChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Adresse</label>
                      <input className="form-control" name="address" value={form.address} onChange={handleFormChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ville</label>
                      <input className="form-control" name="city" value={form.city} onChange={handleFormChange} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Informations complementaires" subtitle="Parcours, profil et remarques">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Institution</label>
                      <input className="form-control" name="institution_name" value={form.institution_name} onChange={handleFormChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Filière</label>
                      <input className="form-control" name="field_of_study" value={form.field_of_study} onChange={handleFormChange} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Notes</label>
                      <textarea className="form-control" rows={4} name="notes" value={form.notes} onChange={handleFormChange} />
                    </div>
                    <div className="col-12">
                      <div className="rounded-3 border p-3 bg-light-subtle">
                        <div className="fw-semibold mb-3">Options du profil</div>
                        <div className="d-flex flex-wrap gap-4">
                          <label className="form-check mb-0">
                            <input className="form-check-input" type="checkbox" name="is_student" checked={form.is_student} onChange={handleFormChange} />
                            <span className="form-check-label">Etudiant(e)</span>
                          </label>
                          <label className="form-check mb-0">
                            <input className="form-check-input" type="checkbox" name="is_sympathizer" checked={form.is_sympathizer} onChange={handleFormChange} />
                            <span className="form-check-label">Sympathisant(e)</span>
                          </label>
                          <label className="form-check mb-0">
                            <input className="form-check-input" type="checkbox" name="is_from_antalaha" checked={form.is_from_antalaha} onChange={handleFormChange} />
                            <span className="form-check-label">Originaire d&apos;Antalaha</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Link to="/admin/members" className="btn btn-outline-secondary"><i className="bi bi-x-circle"></i> Annuler</Link>
            <button type="submit" className="btn btn-dark" disabled={saving}>
              <i className="bi bi-save"></i> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
