import React, { useState } from "react";
import {
  FaBuilding,
  FaEnvelope,
  FaPhoneAlt,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";

export default function Header({ currentUser, onOpenProfile, onLogout, onBrandClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userInitial = (currentUser?.username || "U").charAt(0).toUpperCase();
  const roleLabel = currentUser?.role === "admin" ? "admin" : "user";

  return (
    <header className="main-header">
      <div className="header-left">
        <div className="brand brand-click" onClick={onBrandClick}>
          <span className="taban-text">TABAN</span>
          <span className="food-text">FOOD</span>
        </div>
      </div>
      <nav className="top-nav">
        <ul>
          <li className="nav-user-wrap">
            <button
              type="button"
              className="nav-user nav-user-clickable"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="nav-avatar"
                />
              ) : (
                <span className="nav-profile-icon">
                  <FaUserCircle />
                </span>
              )}
              <span>
                {currentUser.username} ({currentUser.role})
              </span>
            </button>

            {isMenuOpen && (
              <div className="nav-user-menu">
                <div className="nav-user-menu-head">
                  <span className="nav-user-menu-avatar">{userInitial}</span>
                  <span>
                    <strong>{currentUser.username}</strong>
                    <small>{roleLabel}</small>
                  </span>
                </div>
                <p>
                  <FaEnvelope />
                  <span>{currentUser.email || "Gmail not added"}</span>
                </p>
                <p>
                  <FaPhoneAlt />
                  <span>{currentUser.phone || "Phone not added"}</span>
                </p>
                <p>
                  <FaBuilding />
                  <span>Taban Food</span>
                </p>
                <button type="button" onClick={onOpenProfile}>
                  <FaUserCircle />
                  <span>View Profile</span>
                </button>
                <button type="button" onClick={onLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
