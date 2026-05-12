import React from "react";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";

export default function Header({ currentUser, onOpenProfile, onLogout, onBrandClick }) {
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
          <li className="nav-user nav-user-clickable" onClick={onOpenProfile}>
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
          </li>
          <li className="nav-icon-btn" onClick={onLogout} title="Logout" aria-label="Logout">
            <FaSignOutAlt />
          </li>
        </ul>
      </nav>
    </header>
  );
}
