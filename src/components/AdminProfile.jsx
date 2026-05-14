import React, { useEffect, useMemo, useState } from "react";
import { FaEye, FaEyeSlash, FaSearch, FaUser, FaUserPlus } from "react-icons/fa";

export default function AdminProfile({
  managedUsers,
  onAdminUpdateUserCredentials,
  onAdminAddUser,
  onAdminDeleteUser,
}) {
  const sanitizeUsername = (value) => value.replace(/\s+/g, "");
  const [userFilter, setUserFilter] = useState("");
  const [selectedUsername, setSelectedUsername] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [enableAddUserTyping, setEnableAddUserTyping] = useState(false);

  const editableUsers = useMemo(
    () => (managedUsers || []).filter((user) => user.role !== "admin"),
    [managedUsers]
  );

  const filteredUsers = useMemo(() => {
    const needle = userFilter.trim().toLowerCase();
    if (!needle) return editableUsers;
    return editableUsers.filter((user) =>
      user.username.toLowerCase().includes(needle)
    );
  }, [editableUsers, userFilter]);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectedUsername("");
      setEditUsername("");
      setEditPassword("");
      setEditEmail("");
      setEditPhone("");
      return;
    }
    setSelectedUsername((prev) =>
      filteredUsers.some((user) => user.username === prev)
        ? prev
        : filteredUsers[0].username
    );
  }, [filteredUsers]);

  useEffect(() => {
    const selected = editableUsers.find(
      (user) => user.username === selectedUsername
    );
    setEditUsername(selected?.username || "");
    setEditPassword("");
    setEditEmail(selected?.email || "");
    setEditPhone(selected?.phone || "");
  }, [selectedUsername, editableUsers]);

  const submitUserUpdate = async (e) => {
    e.preventDefault();
    const changed = await onAdminUpdateUserCredentials(
      selectedUsername,
      editUsername,
      editPassword,
      editEmail,
      editPhone
    );
    if (changed) {
      setSelectedUsername(editUsername.trim());
    }
  };

  const submitNewUser = async (e) => {
    e.preventDefault();
    const created = await onAdminAddUser(newUsername, newPassword, newEmail, newPhone);
    if (created) {
      setNewUsername("");
      setNewPassword("");
      setNewEmail("");
      setNewPhone("");
      setUserFilter("");
      setEnableAddUserTyping(false);
    }
  };

  const deleteSelectedUser = async () => {
    if (!selectedUsername) return;
    const deleted = await onAdminDeleteUser?.(selectedUsername);
    if (deleted) {
      setUserFilter("");
    }
  };

  return (
    <article className="settings-card settings-card-half admin-profile-card">
      <div className="settings-card-head">
        <h3>Admin Profile Settings</h3>
        <span className="settings-chip admin">Editable</span>
      </div>
      <p className="settings-card-note">
        
      </p>

      <div className="admin-profile-layout admin-profile-reference-layout">
        <section className="admin-manage-section">
          <h4>Select and Manage User</h4>
          <div className="admin-search-wrap">
            <input
              id="admin-user-filter"
              type="text"
              className="settings-input"
              placeholder="Filter Users (non-admin)"
              autoComplete="off"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
            <FaSearch />
          </div>
          <label className="admin-reference-field" htmlFor="admin-user-select">
            <span>Select User</span>
            <select
              id="admin-user-select"
              className="settings-input"
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              disabled={filteredUsers.length === 0}
            >
              {filteredUsers.length === 0 ? (
                <option value="">No users found</option>
              ) : (
                filteredUsers.map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.username}
                  </option>
                ))
              )}
            </select>
          </label>
        </section>

        <form className="admin-edit-reference" onSubmit={submitUserUpdate}>
          <h4>Edit User Details</h4>

          <div className="admin-user-info-card">
            <p>User Information</p>
            <div className="admin-user-info-grid">
              <label className="admin-reference-field" htmlFor="admin-edit-username">
                <span>Username</span>
                <div className="admin-input-icon-wrap">
                  <FaUser />
                  <input
                    id="admin-edit-username"
                    type="text"
                    className="settings-input"
                    placeholder="New username"
                    autoComplete="off"
                    value={editUsername}
                    onChange={(e) => setEditUsername(sanitizeUsername(e.target.value))}
                    disabled={!selectedUsername}
                  />
                </div>
              </label>
              <label className="admin-reference-field" htmlFor="admin-edit-email">
                <span>Gmail</span>
                <input
                  id="admin-edit-email"
                  type="email"
                  className="settings-input"
                  placeholder="user@gmail.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={!selectedUsername}
                />
              </label>
              <label className="admin-reference-field" htmlFor="admin-edit-phone">
                <span>Phone Number</span>
                <input
                  id="admin-edit-phone"
                  type="tel"
                  className="settings-input"
                  placeholder="Phone number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={!selectedUsername}
                />
              </label>
            </div>
          </div>

          <div className="admin-password-row">
            <label className="admin-password-card admin-reference-field" htmlFor="admin-edit-password">
              <span>Change Password</span>
              <div className="admin-password-input-wrap">
                <input
                  id="admin-edit-password"
                  type={showEditPassword ? "text" : "password"}
                  className="settings-input"
                  placeholder="New password"
                  autoComplete="new-password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={!selectedUsername}
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword((prev) => !prev)}
                  disabled={!selectedUsername}
                  aria-label={showEditPassword ? "Hide password" : "Show password"}
                >
                  {showEditPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <small>Password is not displayed; enter a new one to reset</small>
            </label>
            <button
              type="button"
              className="settings-action-btn settings-action-btn-ghost admin-show-btn"
              onClick={() => setShowEditPassword((prev) => !prev)}
              disabled={!selectedUsername}
            >
              {showEditPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="admin-reference-actions">
            <button
              type="submit"
              className="settings-action-btn"
              disabled={!selectedUsername}
            >
              Save User
            </button>
            <button
              type="button"
              className="settings-action-btn danger"
              onClick={deleteSelectedUser}
              disabled={!selectedUsername}
            >
              Delete User
            </button>
          </div>
        </form>

        <form
          className="settings-add-user-card admin-add-reference"
          onSubmit={submitNewUser}
          autoComplete="off"
        >
          <input
            type="text"
            name="fake_admin_username"
            autoComplete="username"
            className="settings-honeypot"
            tabIndex={-1}
            aria-hidden="true"
          />
          <input
            type="password"
            name="fake_admin_password"
            autoComplete="current-password"
            className="settings-honeypot"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="admin-add-reference-head">
            <div>
              <h4><FaUserPlus /> Add New User</h4>
              <p>soo gali username iyo password si aad user cusub ugu darto.</p>
            </div>
          </div>

          <div className="admin-add-reference-grid settings-add-user-stack">
            <label className="admin-reference-field" htmlFor="admin-new-username">
              <span>Username</span>
              <input
                id="admin-new-username"
                type="text"
                name="admin_new_username"
                className="settings-input"
                placeholder="New username"
                autoComplete="new-username"
                readOnly={!enableAddUserTyping}
                onFocus={() => setEnableAddUserTyping(true)}
                value={newUsername}
                onChange={(e) => setNewUsername(sanitizeUsername(e.target.value))}
              />
            </label>
            <label className="admin-reference-field" htmlFor="admin-new-password">
              <span>Password</span>
              <div className="admin-password-input-wrap">
                <input
                  id="admin-new-password"
                  type={showNewPassword ? "text" : "password"}
                  name="admin_new_password"
                  className="settings-input"
                  placeholder="New password"
                  autoComplete="new-password"
                  readOnly={!enableAddUserTyping}
                  onFocus={() => setEnableAddUserTyping(true)}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>
            <label className="admin-reference-field" htmlFor="admin-new-email">
              <span>Gmail</span>
              <input
                id="admin-new-email"
                type="email"
                name="admin_new_email"
                className="settings-input"
                placeholder="user@gmail.com"
                autoComplete="email"
                readOnly={!enableAddUserTyping}
                onFocus={() => setEnableAddUserTyping(true)}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </label>
            <label className="admin-reference-field" htmlFor="admin-new-phone">
              <span>Phone Number</span>
              <input
                id="admin-new-phone"
                type="tel"
                name="admin_new_phone"
                className="settings-input"
                placeholder="Phone number"
                autoComplete="tel"
                readOnly={!enableAddUserTyping}
                onFocus={() => setEnableAddUserTyping(true)}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </label>
          </div>

          <div className="admin-add-reference-actions settings-add-user-actions">
            <button
              type="button"
              className="settings-action-btn settings-action-btn-ghost"
              onClick={() => setShowNewPassword((prev) => !prev)}
            >
              {showNewPassword ? "Hide" : "Show"}
            </button>
            <button type="submit" className="settings-action-btn settings-action-btn-large">
              Add User
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}
