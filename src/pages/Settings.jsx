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
  managedUsers,
  onAdminUpdateUserCredentials,
  onAdminAddUser,
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
      managedUsers={managedUsers}
      onAdminUpdateUserCredentials={onAdminUpdateUserCredentials}
      onAdminAddUser={onAdminAddUser}
    />
  );
}
