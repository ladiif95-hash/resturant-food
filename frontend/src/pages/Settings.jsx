import React from "react";
import SettingsForm from "../components/SettingsForm";

export default function Settings({
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
  return (
    <SettingsForm
      currentUser={currentUser}
      isAdmin={isAdmin}
      restaurantInfo={restaurantInfo}
      onRestaurantInfoChange={onRestaurantInfoChange}
      onRestaurantLogoUpload={onRestaurantLogoUpload}
      paymentSettings={paymentSettings}
      onPaymentSettingsChange={onPaymentSettingsChange}
      deliverySettings={deliverySettings}
      onDeliverySettingsChange={onDeliverySettingsChange}
      onDeliveryAreaToggle={onDeliveryAreaToggle}
      mogadishuDistricts={mogadishuDistricts}
      menuItems={menuItems}
      onMenuItemCategoryChange={onMenuItemCategoryChange}
      onMenuItemPriceChange={onMenuItemPriceChange}
      onMenuItemStockToggle={onMenuItemStockToggle}
      onMenuItemDelete={onMenuItemDelete}
      onMenuItemAdd={onMenuItemAdd}
      managedUsers={managedUsers}
      onAdminUpdateUserCredentials={onAdminUpdateUserCredentials}
      onAdminAddUser={onAdminAddUser}
      onAdminDeleteUser={onAdminDeleteUser}
      activeSettingsSection={activeSettingsSection}
      setActiveSettingsSection={setActiveSettingsSection}
    />
  );
}
