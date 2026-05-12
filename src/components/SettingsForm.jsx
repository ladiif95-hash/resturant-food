import React from "react";
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
  managedUsers,
  onAdminUpdateUserCredentials,
  onAdminAddUser,
}) {
  const currentRole = currentUser?.role || "user";

  return (
    <section className="menu-side dashboard-page settings-page">
      <div className="invoice-paper dashboard-shell settings-shell">
        <div className="settings-topbar">
          <div className="settings-head">
            <h2 className="invoice-title dashboard-main-title">Settings</h2>
            <p className="dashboard-subtitle">
              Maamul app-ka iyo account-kaaga hal meel.
            </p>
          </div>
          <div className="settings-status-list">
            <span className={`settings-status-pill ${isAdmin ? "ok" : "muted"}`}>
              {isAdmin ? "Admin Access" : "User Access"}
            </span>
            <span className="settings-status-pill">Auto Save: ON</span>
          </div>
        </div>

        <p className="settings-section-title">Business Configuration</p>
        <div className="settings-grid">
          <ProfileSettings
            isAdmin={isAdmin}
            restaurantInfo={restaurantInfo}
            onRestaurantInfoChange={onRestaurantInfoChange}
            onRestaurantLogoUpload={onRestaurantLogoUpload}
          />

          <PaymentSettings
            isAdmin={isAdmin}
            paymentSettings={paymentSettings}
            onPaymentSettingsChange={onPaymentSettingsChange}
          />

          <DeliverySettings
            isAdmin={isAdmin}
            deliverySettings={deliverySettings}
            onDeliverySettingsChange={onDeliverySettingsChange}
            onDeliveryAreaToggle={onDeliveryAreaToggle}
            mogadishuDistricts={mogadishuDistricts}
          />

          <MenuSettings
            isAdmin={isAdmin}
            menuItems={menuItems}
            onMenuItemCategoryChange={onMenuItemCategoryChange}
            onMenuItemPriceChange={onMenuItemPriceChange}
            onMenuItemStockToggle={onMenuItemStockToggle}
            onMenuItemDelete={onMenuItemDelete}
          />

          {isAdmin && (
            <AdminProfile
              managedUsers={managedUsers}
              onAdminUpdateUserCredentials={onAdminUpdateUserCredentials}
              onAdminAddUser={onAdminAddUser}
            />
          )}
          {!isAdmin && (
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
          )}

          <article className="settings-card settings-meta-card">
            <h3>Account</h3>
            <p>
              User: <strong>{currentUser?.username || "unknown"}</strong>
            </p>
            <p>
              Role: <strong>{currentRole}</strong>
            </p>
          </article>

          <article className="settings-card settings-meta-card">
            <h3>Access</h3>
            <p>
              Orders: <strong>{isAdmin ? "Admin only" : "No access"}</strong>
            </p>
            <p>
              Orders Money: <strong>{isAdmin ? "Admin only" : "No access"}</strong>
            </p>
          </article>

          <article className="settings-card settings-meta-card">
            <h3>System</h3>
            <p>All settings are saved automatically.</p>
            <p>Waxaad si toos ah u maamuli kartaa profile, payment, delivery.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
