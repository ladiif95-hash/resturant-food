import React from "react";

export default function DeliverySettings({
  isAdmin,
  deliverySettings,
  onDeliverySettingsChange,
  onDeliveryAreaToggle,
  mogadishuDistricts,
}) {
  const handleDeliveryFieldChange = (field) => (e) => {
    onDeliverySettingsChange(field, e.target.value);
  };

  return (
    <article className="settings-card settings-card-half">
      <div className="settings-card-head">
        <h3>Delivery Settings</h3>
        <span className={`settings-chip ${isAdmin ? "admin" : "readonly"}`}>
          {isAdmin ? "Editable" : "Read only"}
        </span>
      </div>
      <p className="settings-card-note">
        Deji delivery fee, free delivery limit, waqtiga geynta, iyo degmooyinka Xamar.
      </p>

      <div className="settings-form-grid">
        <div className="settings-field">
          <label htmlFor="delivery-fee">Delivery Fee ($)</label>
          <input
            id="delivery-fee"
            type="number"
            min="0"
            step="0.01"
            className="settings-input"
            value={deliverySettings?.deliveryFee ?? ""}
            onChange={handleDeliveryFieldChange("deliveryFee")}
            disabled={!isAdmin}
          />
          <p className="settings-hint">Tusaale: $1 gudaha Xamar.</p>
        </div>

        <div className="settings-field">
          <label htmlFor="delivery-free-above">Free Delivery If Order &gt; ($)</label>
          <input
            id="delivery-free-above"
            type="number"
            min="0"
            step="0.01"
            className="settings-input"
            value={deliverySettings?.freeDeliveryAbove ?? ""}
            onChange={handleDeliveryFieldChange("freeDeliveryAbove")}
            disabled={!isAdmin}
          />
          <p className="settings-hint">
            Tusaale: free delivery haddii order ka bato $20.
          </p>
        </div>

        <div className="settings-field">
          <label htmlFor="delivery-time-min">Delivery Time Min (minutes)</label>
          <input
            id="delivery-time-min"
            type="number"
            min="1"
            className="settings-input"
            value={deliverySettings?.deliveryTimeMin ?? ""}
            onChange={handleDeliveryFieldChange("deliveryTimeMin")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="delivery-time-max">Delivery Time Max (minutes)</label>
          <input
            id="delivery-time-max"
            type="number"
            min="1"
            className="settings-input"
            value={deliverySettings?.deliveryTimeMax ?? ""}
            onChange={handleDeliveryFieldChange("deliveryTimeMax")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field settings-field-full">
          <label>Delivery Areas (Degmooyinka Xamar)</label>
          <div className="settings-checkbox-grid">
            {mogadishuDistricts.map((district) => {
              const isChecked = (deliverySettings?.deliveryAreas || []).includes(
                district
              );
              return (
                <label key={district} className="settings-checkbox-item">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onDeliveryAreaToggle(district)}
                    disabled={!isAdmin}
                  />
                  <span>{district}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
