import React from "react";
import { FaTimes, FaUserCircle } from "react-icons/fa";

export default function Profile({
  currentUser,
  setShowProfilePopup,
  handleAvatarPick,
  handleLogout,
}) {
  if (!currentUser) return null;

  const closePopup = () => setShowProfilePopup(false);

  return (
    <div className="profile-popup-overlay" onClick={closePopup}>
      <div className="profile-popup-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="profile-popup-close"
          aria-label="Close profile"
          onClick={closePopup}
        >
          <FaTimes />
        </button>

        <div className="profile-popup-top">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="profile-popup-avatar"
            />
          ) : (
            <FaUserCircle className="profile-popup-avatar" />
          )}
          <h3>{currentUser.username}</h3>
          <p>{currentUser.role === "admin" ? "Admin Account" : "User Account"}</p>
        </div>

        <div className="profile-popup-actions">
          <button type="button" className="back-btn" onClick={handleAvatarPick}>
            Change Photo
          </button>
          <button type="button" className="delete-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
