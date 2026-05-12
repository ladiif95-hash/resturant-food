import React, { useEffect, useMemo, useState } from "react";

export default function AdminProfile({
  managedUsers,
  onAdminUpdateUserCredentials,
  onAdminAddUser,
}) {
  const sanitizeUsername = (value) => value.replace(/\s+/g, "");
  const [userFilter, setUserFilter] = useState("");
  const [selectedUsername, setSelectedUsername] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
    setEditPassword(selected?.password || "");
  }, [selectedUsername, editableUsers]);

  const submitUserUpdate = (e) => {
    e.preventDefault();
    const changed = onAdminUpdateUserCredentials(
      selectedUsername,
      editUsername,
      editPassword
    );
    if (changed) {
      setSelectedUsername(editUsername.trim());
    }
  };

  const submitNewUser = (e) => {
    e.preventDefault();
    const created = onAdminAddUser(newUsername, newPassword);
    if (created) {
      setNewUsername("");
      setNewPassword("");
      setUserFilter("");
      setEnableAddUserTyping(false);
    }
  };

  return (
    <article className="settings-card settings-card-half">
      <div className="settings-card-head">
        <h3>Admin Profile Settings</h3>
        <span className="settings-chip admin">Editable</span>
      </div>
      <p className="settings-card-note">
        Filter users, change username/password, oo ku dar user cusub.
      </p>

      <div className="settings-form-grid">
        <div className="settings-field settings-field-full">
          <label htmlFor="admin-user-filter">Filter Users (non-admin)</label>
          <input
            id="admin-user-filter"
            type="text"
            className="settings-input"
            placeholder="Search by username..."
            autoComplete="off"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />
        </div>

        <form className="settings-field settings-field-full" onSubmit={submitUserUpdate}>
          <label htmlFor="admin-user-select">Select User</label>
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

          <div className="settings-inline-stack">
            <label htmlFor="admin-edit-username">Change Username</label>
            <div className="settings-inline-actions">
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
          </div>

          <div className="settings-inline-stack">
            <label htmlFor="admin-edit-password">Change Password</label>
            <p className="settings-hint">Admin wuu arki karaa password-ka user-ka la doortay.</p>
            <div className="settings-inline-actions">
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
                className="settings-action-btn settings-action-btn-ghost"
                onClick={() => setShowEditPassword((prev) => !prev)}
                disabled={!selectedUsername}
              >
                {showEditPassword ? "Hide" : "Show"}
              </button>
              <button
                type="submit"
                className="settings-action-btn"
                disabled={!selectedUsername}
              >
                Save User
              </button>
            </div>
          </div>
        </form>

        <form
          className="settings-field settings-field-full settings-add-user-card"
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

          <div className="settings-add-user-head">
            <label>Add User (username + password)</label>
            <span className="settings-chip admin">Quick Add</span>
          </div>
          <p className="settings-hint settings-add-user-hint">
           soo gai username iyo password si aad user cusub ugu darto.
          </p>
          <div className="settings-inline-stack settings-add-user-stack">
            <input
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
            <div className="settings-inline-actions">
              <input
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
                className="settings-action-btn settings-action-btn-ghost"
                onClick={() => setShowNewPassword((prev) => !prev)}
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
              <button type="submit" className="settings-action-btn settings-action-btn-large">
                Add User
              </button>
            </div>
          </div>
        </form>
      </div>
    </article>
  );
}
