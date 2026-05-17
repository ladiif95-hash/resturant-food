import React, { useEffect, useMemo } from "react";
import DeliverySettings from "./DeliverySettings";
import AdminProfile from "./AdminProfile";
import MenuSettings from "./MenuSettings";
import PaymentSettings from "./PaymentSettings";
import ProfileSettings from "./ProfileSettings";

export default function SettingsForm({
  currentUser,
  isAdmin,
  restaurantInfo,
  onRestaurantInfoChange,
  onRestaurantLogoUpload,
  paymentSettings,
  onPaymentSettingsChange,
  deliverySettings,
  onDeliverySettingsChange,
  onDeliveryAreaToggle,
  mogadishuDistricts,
  menuItems,
  onMenuItemCategoryChange,
  onMenuItemPriceChange,
  onMenuItemStockToggle,
  onMenuItemDelete,
  onMenuItemAdd,
  managedUsers,
  onAdminUpdateUserCredentials,
  onAdminAddUser,
  onAdminDeleteUser,
  activeSettingsSection,
  setActiveSettingsSection,
}) {
  const currentRole = currentUser?.role || "user";
  const activeSection = activeSettingsSection || "restaurant";

  const settingsSections = useMemo(
    () => [
      {
        id: "restaurant",
        label: "Restaurant Information",
        group: "Business",
        description: "Logo, name, contact, location, and open hours.",
      },
      {
        id: "payment",
        label: "Payment Settings",
        group: "Business",
        description: "EVC Plus, Zaad, Sahal, bank account, and cash settings.",
      },
      {
        id: "delivery",
        label: "Delivery Settings",
        group: "Business",
        description: "Fees, free delivery limit, delivery time, and areas.",
      },
      {
        id: "menu",
        label: "Menu Settings",
        group: "Business",
        description: "Categories, product prices, stock status, and delete actions.",
      },
      ...(isAdmin
        ? [
            {
              id: "admin",
              label: "Users",
              group: "Users & Access",
              description: "Manage usernames, passwords, and create users.",
            },
          ]
        : [
            {
              id: "user",
              label: "User Profile",
              group: "Users & Access",
              description: "View your current username and role.",
            },
          ]),
      {
        id: "account",
        label: "Account",
        group: "Users & Access",
        description: "Current signed-in account information.",
      },
      {
        id: "access",
        label: "Permissions",
        group: "Users & Access",
        description: "Review which pages this role can access.",
      },
      {
        id: "system",
        label: "System",
        group: "System",
        description: "Autosave and app-level settings status.",
      },
    ],
    [isAdmin]
  );

  const activeSectionDetails =
    settingsSections.find((section) => section.id === activeSection) ||
    settingsSections[0];

  useEffect(() => {
    if (!settingsSections.some((section) => section.id === activeSection)) {
      setActiveSettingsSection("restaurant");
    }
  }, [activeSection, settingsSections, setActiveSettingsSection]);

  const renderActiveSection = () => {
    if (activeSection === "restaurant") {
      return (
        <ProfileSettings
          isAdmin={isAdmin}
          restaurantInfo={restaurantInfo}
          onRestaurantInfoChange={onRestaurantInfoChange}
          onRestaurantLogoUpload={onRestaurantLogoUpload}
        />
      );
    }

    if (activeSection === "payment") {
      return (
        <PaymentSettings
          isAdmin={isAdmin}
          paymentSettings={paymentSettings}
          onPaymentSettingsChange={onPaymentSettingsChange}
        />
      );
    }

    if (activeSection === "delivery") {
      return (
        <DeliverySettings
          isAdmin={isAdmin}
          deliverySettings={deliverySettings}
          onDeliverySettingsChange={onDeliverySettingsChange}
          onDeliveryAreaToggle={onDeliveryAreaToggle}
          mogadishuDistricts={mogadishuDistricts}
        />
      );
    }

    if (activeSection === "menu") {
      return (
        <MenuSettings
          isAdmin={isAdmin}
          menuItems={menuItems}
          onMenuItemCategoryChange={onMenuItemCategoryChange}
          onMenuItemPriceChange={onMenuItemPriceChange}
          onMenuItemStockToggle={onMenuItemStockToggle}
          onMenuItemDelete={onMenuItemDelete}
          onMenuItemAdd={onMenuItemAdd}
        />
      );
    }

    if (activeSection === "admin" && isAdmin) {
      return (
        <AdminProfile
          managedUsers={managedUsers}
          onAdminUpdateUserCredentials={onAdminUpdateUserCredentials}
          onAdminAddUser={onAdminAddUser}
          onAdminDeleteUser={onAdminDeleteUser}
        />
      );
    }

    if (activeSection === "user") {
      return (
        <article className="settings-card settings-card-half settings-meta-card">
          <div className="settings-card-head">
            <h3>User Profile</h3>
            <span className="settings-chip readonly">User</span>
          </div>
          <p className="settings-card-note">
            Admin Profile Settings admin kaliya ayaa arki kara.
          </p>
          <p>
            Username: <strong>{currentUser?.username || "user"}</strong>
          </p>
          <p>
            Role: <strong>User</strong>
          </p>
        </article>
      );
    }

    if (activeSection === "account") {
      return (
        <article className="settings-card settings-meta-card">
          <h3>Account</h3>
          <p>
            User: <strong>{currentUser?.username || "unknown"}</strong>
          </p>
          <p>
            Role: <strong>{currentRole}</strong>
          </p>
        </article>
      );
    }

    if (activeSection === "access") {
      return (
        <article className="settings-card settings-meta-card">
          <h3>Access</h3>
          <p>
            Orders: <strong>{isAdmin ? "Admin only" : "No access"}</strong>
          </p>
          <p>
            Orders Money: <strong>{isAdmin ? "Admin only" : "No access"}</strong>
          </p>
        </article>
      );
    }

    return (
      <article className="settings-card settings-meta-card">
        <h3>System</h3>
        <p>All settings are saved automatically.</p>
        <p>Waxaad si toos ah u maamuli kartaa profile, payment, delivery.</p>
      </article>
    );
  };

  return (
    <section className="menu-side dashboard-page settings-page">
      <div className="invoice-paper dashboard-shell settings-shell">
        <div className="settings-topbar">
          <div className="settings-head">
            <h2 className="invoice-title dashboard-main-title">Settings</h2>
            <p className="dashboard-subtitle">
              
            </p>
          </div>
          <div className="settings-status-list">
            <span className={`settings-status-pill ${isAdmin ? "ok" : "muted"}`}>
              {isAdmin ? "Admin Access" : "User Access"}
            </span>
            <span className="settings-status-pill">Auto Save: ON</span>
          </div>
        </div>

        <div className="settings-workspace settings-workspace-single">
          <main className="settings-content">
            <div className="settings-content-head">
              <div>
                <p className="settings-section-title">
                  {activeSectionDetails.group}
                </p>
                <h3>{activeSectionDetails.label}</h3>
                <p>{activeSectionDetails.description}</p>
              </div>
              <span className={`settings-chip ${isAdmin ? "admin" : "readonly"}`}>
                {isAdmin ? "Editable" : "Read only"}
              </span>
            </div>
            <div className="settings-grid">
              <div className="settings-active-panel">{renderActiveSection()}</div>
            </div>
          </main>
        </div>
      </div>
    </section>  );
}
