import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import {
  FaBars,
  FaCog,
  FaMoneyBillWave,
  FaTachometerAlt,
  FaUserCircle,
  FaUtensils,
  FaClipboardList,
} from "react-icons/fa";

export default function Sidebar({
  isCollapsed,
  onToggle,
  page,
  setPage,
  isAdmin,
  onOpenProfile,
  activeSettingsSection,
  setActiveSettingsSection,
}) {
  const settingsGroups = [
    {
      title: "Business",
      items: [
        { id: "restaurant", label: "Restaurant Info" },
        { id: "payment", label: "Payment" },
        { id: "delivery", label: "Delivery" },
        { id: "menu", label: "Menu Settings" },
      ],
    },
    {
     
      items: [
        { id: isAdmin ? "admin" : "user", label: isAdmin ? "Users" : "User Profile" },
        { id: "account", label: "Account" },
        { id: "access", label: "Permissions" },
      ],
    },
    {
      title: "System",
      items: [{ id: "system", label: "System" }],
    },
  ];

  const openSettingsSection = (sectionId) => {
    setPage("settings");
    setActiveSettingsSection?.(sectionId);
  };
  

  return (
    <>
      {isCollapsed && (
        <aside className="side-nav-rail-wrap">
          <div className="side-nav-rail">
            <button
              type="button"
              className="side-rail-btn"
              onClick={onToggle}
              aria-label="Toggle sidebar"
            >
              <FaBars />
            </button>
            <button
              type="button"
              className={`side-rail-btn ${page === "dashboard" ? "active" : ""}`}
              onClick={() => setPage("dashboard")}
              aria-label="Dashboard"
            >
              <FaTachometerAlt />
            </button>
            <button
              type="button"
              className={`side-rail-btn ${page === "pos" ? "active" : ""}`}
              onClick={() => setPage("pos")}
              aria-label="Menu"
            >
              <FaUtensils />
            </button>
            {isAdmin && (
              <button
                type="button"
                className={`side-rail-btn ${page === "orders" ? "active" : ""}`}
                onClick={() => setPage("orders")}
                aria-label="Orders"
              >
                <FaClipboardList />
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                className={`side-rail-btn ${page === "orders MONEY" ? "active" : ""}`}
                onClick={() => setPage("orders MONEY")}
                aria-label="Orders Money"
              >
                <FaMoneyBillWave />
              </button>
            )}
            <button
              type="button"
              className={`side-rail-btn ${page === "settings" ? "active" : ""}`}
              onClick={() => setPage("settings")}
              aria-label="Settings"
            >
              <FaCog />
            </button>
            <button
              type="button"
              className={`side-rail-btn ${page === "profile" ? "active" : ""}`}
              onClick={onOpenProfile}
              aria-label="Profile"
            >
              <FaUserCircle />
            </button>
          </div>
        </aside>
      )}

      {!isCollapsed && (
        <aside className="side-nav-main-panel">
          <div className="side-nav-main">
            <div className="side-nav-main-head">
              <div className="side-nav-top">
                <div className="side-nav-brand-row">
                  <div className="side-nav-avatar">TB</div>
                  <div>
                    <h3 className="side-nav-brand-title">Taban Food</h3>
                    <p className="side-nav-brand-sub">cunto dhadhan leh</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="side-main-center-toggle"
                  onClick={onToggle}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <FontAwesomeIcon
                    icon={faRightToBracket}
                    style={{ color: "rgba(255, 255, 255, 1.00)" }}
                  />
                </button>
              </div>
            </div>

            <p className="side-nav-section-title">Main Menu</p>
            <button
              className={`side-nav-btn ${page === "dashboard" ? "active" : ""}`}
              onClick={() => setPage("dashboard")}
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </button>
            <button
              className={`side-nav-btn ${page === "pos" ? "active" : ""}`}
              onClick={() => setPage("pos")}
            >
              <FaUtensils />
              <span>Menu</span>
            </button>
            {isAdmin && (
              <button
                className={`side-nav-btn ${page === "orders" ? "active" : ""}`}
                onClick={() => setPage("orders")}
              >
                <FaClipboardList />
                <span>Orders</span>
              </button>
            )}
            {isAdmin && (
              <button
                className={`side-nav-btn ${page === "orders MONEY" ? "active" : ""}`}
                onClick={() => setPage("orders MONEY")}
              >
                <FaMoneyBillWave />
                <span>Orders Money</span>
              </button>
            )}
            <button
              className={`side-nav-btn ${page === "settings" ? "active" : ""}`}
              onClick={() => openSettingsSection(activeSettingsSection || "restaurant")}
            >
              <FaCog />
              <span>Settings</span>
            </button>
            <button
              className={`side-nav-btn ${page === "profile" ? "active" : ""}`}
              onClick={onOpenProfile}
            >
              <FaUserCircle />
              <span>Profile</span>
            </button>

            {isAdmin && page === "settings" && (
              <div className="side-settings-menu">
                {settingsGroups.map((group) => (
                  <div key={group.title} className="side-settings-group">
                    <p className="side-settings-title">{group.title}</p>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`side-settings-btn ${
                          activeSettingsSection === item.id ? "active" : ""
                        }`}
                        onClick={() => openSettingsSection(item.id)}
                      >
                        <span className="side-settings-square" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
