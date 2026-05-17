import React from "react";

export default function ProfileSettings({
  isAdmin,
  restaurantInfo,
  onRestaurantInfoChange,
  onRestaurantLogoUpload,
}) {
  const handleFieldChange = (field) => (e) => {
    onRestaurantInfoChange(field, e.target.value);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    onRestaurantLogoUpload(file);
    e.target.value = "";
  };

  return (
    <article className="settings-card settings-card-half restaurant-info-card">
      <div className="settings-card-head">
        <h3>Restaurant Information</h3>
        <span className={`settings-chip ${isAdmin ? "admin" : "readonly"}`}>
          {isAdmin ? "Editable" : "Read only"}
        </span>
      </div>
      <p className="settings-card-note">
      
      </p>

      <div className="settings-form-grid">
        <div className="settings-field settings-field-full">
          <label htmlFor="restaurant-logo">Logo Upload</label>
          <div className="settings-logo-row">
            {restaurantInfo?.logo ? (
              <img
                src={restaurantInfo.logo}
                alt="Restaurant logo"
                className="settings-logo-preview"
              />
            ) : (
              <div className="settings-logo-placeholder">No Logo</div>
            )}
            <input
              id="restaurant-logo"
              type="file"
              accept="image/*"
              className="settings-input"
              onChange={handleLogoChange}
              disabled={!isAdmin}
            />
          </div>
        </div>

        <div className="settings-field">
          <label htmlFor="restaurant-name">Restaurant Name</label>
          <input
            id="restaurant-name"
            type="text"
            className="settings-input"
            value={restaurantInfo?.name || ""}
            onChange={handleFieldChange("name")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="restaurant-phone">Phone Number</label>
          <input
            id="restaurant-phone"
            type="tel"
            className="settings-input"
            value={restaurantInfo?.phone || ""}
            onChange={handleFieldChange("phone")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="restaurant-email">Email</label>
          <input
            id="restaurant-email"
            type="email"
            className="settings-input"
            value={restaurantInfo?.email || ""}
            onChange={handleFieldChange("email")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="restaurant-location">Location</label>
          <input
            id="restaurant-location"
            type="text"
            className="settings-input"
            value={restaurantInfo?.location || ""}
            onChange={handleFieldChange("location")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field settings-field-full">
          <label htmlFor="restaurant-description">Description</label>
          <textarea
            id="restaurant-description"
            className="settings-textarea"
            rows={3}
            value={restaurantInfo?.description || ""}
            onChange={handleFieldChange("description")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="restaurant-open-time">Open Time</label>
          <input
            id="restaurant-open-time"
            type="time"
            className="settings-input"
            value={restaurantInfo?.openTime || ""}
            onChange={handleFieldChange("openTime")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="restaurant-close-time">Close Time</label>
          <input
            id="restaurant-close-time"
            type="time"
            className="settings-input"
            value={restaurantInfo?.closeTime || ""}
            onChange={handleFieldChange("closeTime")}
            disabled={!isAdmin}
          />
        </div>
      </div>
    </article>
  );
}
