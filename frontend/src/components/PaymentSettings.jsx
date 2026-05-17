import React from "react";

export default function PaymentSettings({
  isAdmin,
  paymentSettings,
  onPaymentSettingsChange,
}) {
  const handlePaymentFieldChange = (field) => (e) => {
    onPaymentSettingsChange(field, e.target.value);
  };

  const handleCashOnDeliveryChange = (value) => {
    onPaymentSettingsChange("cashOnDelivery", value);
  };

  return (
    <article className="settings-card settings-card-half">
      <div className="settings-card-head">
        <h3>Payment Settings</h3>
        <span className={`settings-chip ${isAdmin ? "admin" : "readonly"}`}>
          {isAdmin ? "Editable" : "Read only"}
        </span>
      </div>
      <p className="settings-card-note">
        Deji hababka lacag bixinta: EVC Plus, Zaad, Sahal, bank account, iyo COD.
      </p>

      <div className="settings-form-grid">
        <div className="settings-field">
          <label htmlFor="pay-evc-plus">EVC Plus Number</label>
          <input
            id="pay-evc-plus"
            type="text"
            className="settings-input"
            value={paymentSettings?.evcPlusNumber || ""}
            onChange={handlePaymentFieldChange("evcPlusNumber")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="pay-zaad">Zaad Number</label>
          <input
            id="pay-zaad"
            type="text"
            className="settings-input"
            value={paymentSettings?.zaadNumber || ""}
            onChange={handlePaymentFieldChange("zaadNumber")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="pay-sahal">Sahal Number</label>
          <input
            id="pay-sahal"
            type="text"
            className="settings-input"
            value={paymentSettings?.sahalNumber || ""}
            onChange={handlePaymentFieldChange("sahalNumber")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field">
          <label htmlFor="pay-bank">Bank Account</label>
          <input
            id="pay-bank"
            type="text"
            className="settings-input"
            value={paymentSettings?.bankAccount || ""}
            onChange={handlePaymentFieldChange("bankAccount")}
            disabled={!isAdmin}
          />
        </div>

        <div className="settings-field settings-field-full">
          <label>Cash on Delivery</label>
          <div className="settings-toggle-row">
            <button
              type="button"
              className={`settings-toggle-btn ${paymentSettings?.cashOnDelivery ? "active" : ""}`}
              onClick={() => handleCashOnDeliveryChange(true)}
              disabled={!isAdmin}
            >
              ON
            </button>
            <button
              type="button"
              className={`settings-toggle-btn ${!paymentSettings?.cashOnDelivery ? "active" : ""}`}
              onClick={() => handleCashOnDeliveryChange(false)}
              disabled={!isAdmin}
            >
              OFF
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
