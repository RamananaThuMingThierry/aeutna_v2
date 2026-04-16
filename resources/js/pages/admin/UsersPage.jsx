import { useEffect, useRef, useState } from "react";
import DataTable from "datatables.net-bs5";
import { Modal } from "bootstrap";

import { usersApi } from "../../api/user";

const AVAILABLE_ROLES = ["super_admin", "admin", "bureau", "member"];

function normalizeCollection(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function formatRoles(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles
    .map((role) => (typeof role === "string" ? role : role?.code))
    .filter(Boolean);
}

function resolveAvatarUrl(avatar) {
  if (!avatar) {
    return "";
  }

  if (avatar.startsWith("http://") || avatar.startsWith("https://") || avatar.startsWith("blob:")) {
    return avatar;
  }

  const normalizedAvatar = avatar.replace(/^\/+/, "");

  if (normalizedAvatar.startsWith("uploads/")) {
    return `/${normalizedAvatar}`;
  }

  return `/storage/${normalizedAvatar}`;
}

export default function UsersPage() {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  const viewModalRef = useRef(null);
  const editModalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const viewModalInstance = useRef(null);
  const editModalInstance = useRef(null);
  const deleteModalInstance = useRef(null);

  useEffect(() => {
    viewModalInstance.current = new Modal(viewModalRef.current);
    editModalInstance.current = new Modal(editModalRef.current);
    deleteModalInstance.current = new Modal(deleteModalRef.current);

    return () => {
      viewModalInstance.current?.dispose();
      editModalInstance.current?.dispose();
      deleteModalInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    if (loading || !tableRef.current) {
      return;
    }

    dataTableRef.current?.destroy();
    dataTableRef.current = new DataTable(tableRef.current, {
      pageLength: 10,
      lengthMenu: [10, 25, 50, 100],
      order: [[0, "asc"]],
      columnDefs: [
        { targets: [5], orderable: false, searchable: false },
      ],
      language: {
        search: "Rechercher :",
        lengthMenu: "Afficher _MENU_ lignes",
        info: "Affichage de _START_ a _END_ sur _TOTAL_ utilisateurs",
        infoEmpty: "Aucun utilisateur a afficher",
        zeroRecords: "Aucun utilisateur correspondant",
        emptyTable: "Aucun utilisateur trouve",
        paginate: {
          first: "<<",
          last: ">>",
          next: ">",
          previous: "<",
        },
      },
    });

    return () => {
      dataTableRef.current?.destroy();
      dataTableRef.current = null;
    };
  }, [users, loading]);

  useEffect(() => {
    if (!tableRef.current) {
      return;
    }

    function handleUserAction(action, user) {
      if (action === "show") {
        openViewModal(user);
        return;
      }

      if (action === "edit") {
        openEditModal(user);
        return;
      }

      if (action === "delete") {
        if (String(currentUser?.encrypted_id || currentUser?.id) === String(user.encrypted_id || user.id)) {
          setError("Vous ne pouvez pas vous supprimer vous-meme.");
          return;
        }

        openDeleteModal(user);
      }
    }

    function handleTableClick(event) {
      const actionButton = event.target.closest("[data-user-action]");

      if (!actionButton) {
        return;
      }

      const action = actionButton.getAttribute("data-user-action");
      const userIndex = Number(actionButton.getAttribute("data-user-index"));
      const user = Number.isInteger(userIndex) ? users[userIndex] : null;

      if (!user) {
        return;
      }

      handleUserAction(action, user);
    }

    const tableElement = tableRef.current;
    const clickScope = tableElement.closest(".dt-container") || tableElement.parentElement || tableElement;

    clickScope.addEventListener("click", handleTableClick, true);

    return () => {
      clickScope.removeEventListener("click", handleTableClick, true);
    };
  }, [users, currentUser]);

  function handleActionClickCapture(event) {
    const actionButton = event.target.closest("[data-user-action]");

    if (!actionButton) {
      return;
    }

    const action = actionButton.getAttribute("data-user-action");
    const userIndex = Number(actionButton.getAttribute("data-user-index"));
    const user = Number.isInteger(userIndex) ? users[userIndex] : null;

    if (!user) {
      return;
    }

    if (action === "show") {
      openViewModal(user);
      return;
    }

    if (action === "edit") {
      openEditModal(user);
      return;
    }

    if (action === "delete") {
      if (String(currentUser?.encrypted_id || currentUser?.id) === String(user.encrypted_id || user.id)) {
        setError("Vous ne pouvez pas vous supprimer vous-meme.");
        return;
      }

      openDeleteModal(user);
    }
  }

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data = await usersApi.list();
      setUsers(normalizeCollection(data));
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }

  function openViewModal(user) {
    setError("");
    setSelectedUser(user);
    setViewLoading(true);
    viewModalInstance.current?.show();

    void (async () => {
      try {
        const data = await usersApi.show(user.encrypted_id);
        setSelectedUser(data?.user || user);
      } catch (err) {
        setError(err?.response?.data?.message || "Impossible de charger cet utilisateur.");
      } finally {
        setViewLoading(false);
      }
    })();
  }

  function openEditModal(user) {
    setSuccess("");
    setError("");
    setSelectedUser(user);
    setSelectedRoles(formatRoles(user.roles));
    editModalInstance.current?.show();
  }

  function openDeleteModal(user) {
    setSuccess("");
    setError("");
    setSelectedUser(user);
    deleteModalInstance.current?.show();
  }

  function updateUserInState(nextUser) {
    setUsers((current) =>
      current.map((user) =>
        (user.encrypted_id || user.id) === (nextUser.encrypted_id || nextUser.id) ? nextUser : user
      )
    );
  }

  async function handleUpdateSubmit(event) {
    event.preventDefault();
    if (!selectedUser?.encrypted_id) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const result = await usersApi.syncRoles(selectedUser.encrypted_id, selectedRoles);
      const nextUser = result.data;

      updateUserInState(nextUser);
      setSelectedUser(nextUser);
      setSuccess(result.message || "Roles synchronises avec succes.");
      editModalInstance.current?.hide();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de mettre a jour les roles.");
    } finally {
      setSaving(false);
    }
  }

  function toggleRole(roleCode) {
    setSelectedRoles((current) =>
      current.includes(roleCode) ? current.filter((role) => role !== roleCode) : [...current, roleCode]
    );
  }

  async function handleDeleteConfirm() {
    if (!selectedUser?.encrypted_id) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const result = await usersApi.remove(selectedUser.encrypted_id);
      setUsers((current) =>
        current.filter((user) => (user.encrypted_id || user.id) !== selectedUser.encrypted_id)
      );
      setSuccess(result.message || "Utilisateur supprime avec succes.");
      deleteModalInstance.current?.hide();
      setSelectedUser(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de supprimer l'utilisateur.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="h4 mb-1">Utilisateurs</h3>
          <p className="text-secondary mb-0">
            Gestion des comptes avec consultation, gestion des roles et suppression.
          </p>
        </div>

        <button type="button" className="btn btn-dark" onClick={() => void loadUsers()}>
          <i className="bi bi-arrow-clockwise me-2" />
          Rafraichir
        </button>
      </div>

      {success ? (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table
              ref={tableRef}
              className="table table-hover align-middle mb-0"
              onClickCapture={handleActionClickCapture}
            >
              <thead className="table-light">
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Telephone</th>
                  <th>Roles</th>
                  <th>Statut</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-secondary">
                      Chargement des utilisateurs...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-secondary">
                      Aucun utilisateur trouve.
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => {
                    const isCurrentUser =
                      String(currentUser?.id) === String(user.id);

                    console.log("Rendering user:", isCurrentUser);

                    return (
                    <tr key={user.encrypted_id || user.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {resolveAvatarUrl(user.avatar) ? (
                            <img
                              src={resolveAvatarUrl(user.avatar)}
                              alt={user.name || "Avatar utilisateur"}
                              className="rounded-circle object-fit-cover border"
                              style={{ width: "44px", height: "44px" }}
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center fw-semibold"
                              style={{ width: "44px", height: "44px", minWidth: "44px" }}
                            >
                              {(user.name || "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="fw-semibold">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email || "-"}</td>
                      <td>{user.phone || "-"}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          {formatRoles(user.roles).length > 0 ? (
                            formatRoles(user.roles).map((role) => (
                              <span key={`${user.encrypted_id}-${role}`} className="badge text-bg-light border text-dark">
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-secondary small">Aucun role</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                          {user.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            data-user-action="show"
                            data-user-index={index}
                          >
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            data-user-action="edit"
                            data-user-index={index}
                          >
                            <i className="bi bi-pencil-square" />
                          </button>
                          {!isCurrentUser ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              data-user-action="delete"
                              data-user-index={index}
                              title="Supprimer"
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="modal fade" tabIndex="-1" ref={viewModalRef} aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header">
              <h5 className="modal-title">Details utilisateur</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              {viewLoading ? (
                <div className="text-center py-4 text-secondary">Chargement...</div>
              ) : selectedUser ? (
                <div className="row g-4">
                  <div className="col-12">
                    <div className="shadow-sm border-0 bg-light rounded-4 p-3 p-md-4">
                      <div className="d-flex flex-column flex-md-row align-items-md-center gap-3 gap-md-4">
                      {resolveAvatarUrl(selectedUser.avatar) ? (
                        <img
                          src={resolveAvatarUrl(selectedUser.avatar)}
                          alt={selectedUser.name || "Avatar utilisateur"}
                          className="rounded-circle object-fit-cover border shadow-sm"
                          style={{ width: "84px", height: "84px" }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-dark text-white d-inline-flex align-items-center justify-content-center fw-semibold fs-3 shadow-sm"
                          style={{ width: "84px", height: "84px" }}
                        >
                          {(selectedUser.name || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="h5 mb-1">{selectedUser.name || "-"}</div>
                        <div className="text-secondary">{selectedUser.email || "-"}</div>
                        <div className="d-flex flex-wrap gap-2 mt-3">
                          <span className={`badge ${selectedUser.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                            {selectedUser.is_active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="border shadow-sm bg-light border-0 p-3 h-100">
                      <div className="small text-uppercase text-secondary fw-semibold mb-3">Informations personnelles</div>
                      <div className="mb-3">
                        <div className="small text-secondary mb-1">Nom</div>
                        <div className="fw-semibold">{selectedUser.name || "-"}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-secondary mb-1">Email</div>
                        <div className="fw-semibold">{selectedUser.email || "-"}</div>
                      </div>
                      <div>
                        <div className="small text-secondary mb-1">Telephone</div>
                        <div className="fw-semibold">{selectedUser.phone || "-"}</div>
                      </div>
                                <div className="small text-uppercase text-secondary fw-semibold mb-3">Acces et statut</div>
                      <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="small text-secondary mb-1">Statut du compte</div>
                        <div className="fw-semibold">
                          <span className={`badge ${selectedUser.is_active ? "text-bg-success" : "text-bg-secondary"}`}>
                            {selectedUser.is_active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="small text-secondary mb-2">Roles attribues</div>
                        <div className="d-flex flex-wrap gap-2">
                          {formatRoles(selectedUser.roles).length > 0 ? (
                            formatRoles(selectedUser.roles).map((role) => (
                              <span key={`view-${role}`} className="badge text-bg-light border text-dark text-uppercase">
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-secondary small">Aucun role</span>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" tabIndex="-1" ref={editModalRef} aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <form onSubmit={handleUpdateSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Modifier les roles</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="fw-semibold">{selectedUser?.name || "-"}</div>
                  <div className="small text-secondary">{selectedUser?.email || "-"}</div>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Roles attribues</label>
                    <div className="row g-2">
                      {AVAILABLE_ROLES.map((roleCode) => (
                        <div className="col-md-6" key={roleCode}>
                          <label className="border rounded-3 px-3 py-2 d-flex align-items-center gap-2 w-100 bg-light-subtle">
                            <input
                              type="checkbox"
                              className="form-check-input mt-0"
                              checked={selectedRoles.includes(roleCode)}
                              onChange={() => toggleRole(roleCode)}
                            />
                            <span className="text-uppercase small fw-semibold">{roleCode}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="form-text">
                      Seuls les roles sont modifiables depuis l&apos;administration. Les informations personnelles sont
                      gerees par chaque utilisateur depuis son compte.
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light border" data-bs-dismiss="modal">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" tabIndex="-1" ref={deleteModalRef} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header">
              <h5 className="modal-title">Confirmer la suppression</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <p className="mb-0">
                Supprimer l&apos;utilisateur <strong>{selectedUser?.name || "-"}</strong> ?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light border" data-bs-dismiss="modal">
                Annuler
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void handleDeleteConfirm()} disabled={deleting}>
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
