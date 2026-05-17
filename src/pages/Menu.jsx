import React from "react";
import { FaTrash } from "react-icons/fa";

export default function Menu({
  category,
  setCategory,
  menuSearch,
  setMenuSearch,
  selectedCategoryLabel,
  filteredMenuItems,
  visibleItems,
  addToOrder,
  totalQty,
  subTotal,
  orders,
  updateQty,
  removeItem,
  deliveryType,
  setDeliveryType,
  setDeliveryDistrict,
  setDeliveryNeighborhood,
  deliveryDistrict,
  deliveryNeighborhood,
  MOGADISHU_DISTRICTS,
  taxAmount,
  deliveryCharge,
  maxDiscount,
  discount,
  setDiscount,
  finalTotal,
  handlePay,
}) {
  return (
    <>
      <section className="menu-side pos-menu-side">
        <div className="pos-menu-header">
          <div>
            <h2 className="invoice-title">Menu Explorer</h2>
            <p className="dashboard-subtitle">
              {selectedCategoryLabel} category - {filteredMenuItems.length}/{visibleItems.length} items shown
            </p>
          </div>
          <div className="pos-menu-stats">
            <div className="pos-chip">
              <span>Cart Qty</span>
              <strong>{totalQty}</strong>
            </div>
            <div className="pos-chip">
              <span>Subtotal</span>
              <strong>${subTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
        <div className="category-bar">
          {["all", "fast", "drinks", "normalday"].map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat === "normalday" ? "NORMAL DAY" : cat.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Search menu items..."
          value={menuSearch}
          onChange={(e) => setMenuSearch(e.target.value)}
        />
        <div className="items-grid pos-items-grid">
          {filteredMenuItems.length === 0 ? (
            <p className="pos-empty-state">No items match your search.</p>
          ) : (
            filteredMenuItems.map((item) => (
              <div
                key={item.id}
                className={`item-card ${item.outOfStock ? "item-card-out" : ""}`}
                onClick={() => !item.outOfStock && addToOrder(item)}
              >
                <img
                  className="food-img"
                  src={encodeURI(item.image)}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/placeholder.png";
                  }}
                />
                <h3>{item.name}</h3>
                <span className="price">${item.price.toFixed(2)}</span>
                {item.outOfStock && <span className="item-stock-note">Out of Stock</span>}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="order-side pos-order-side">
        <div className="invoice-paper pos-order-paper">
          <div className="pos-order-header">
            <h2 className="invoice-title">Current Order</h2>
            <div className="pos-order-badges">
              <span className="pos-order-badge">{totalQty} Qty</span>
              <span className="pos-order-badge active">
                {deliveryType === "delivery" ? "Delivery" : "Pickup"}
              </span>
            </div>
          </div>
          <div className="invoice-table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>ITEM</th>
                <th>QTY</th>
                <th>PRICE</th>
                <th>TOTAL</th>
                <th>DELETE</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6">No Items Yet</td>
                </tr>
              ) : (
                orders.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                      {item.qty}
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${(item.price * item.qty).toFixed(2)}</td>
                    <td>
                      <button className="delete-btn" onClick={() => removeItem(item.id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          <div className="delivery-side">
            <p className="delivery-label">Order Type</p>
            <div className="delivery-options">
              <label>
                <input
                  type="radio"
                  name="deliveryType"
                  value="pickup"
                  checked={deliveryType === "pickup"}
                  onChange={(e) => {
                    setDeliveryType(e.target.value);
                    setDeliveryDistrict("");
                    setDeliveryNeighborhood("");
                  }}
                />
                Pickup
              </label>
              <label>
                <input
                  type="radio"
                  name="deliveryType"
                  value="delivery"
                  checked={deliveryType === "delivery"}
                  onChange={(e) => setDeliveryType(e.target.value)}
                />
                Delivery
              </label>
            </div>
            {deliveryType === "delivery" && (
              <div className="delivery-fields">
                <select
                  className="orders-select delivery-input"
                  value={deliveryDistrict}
                  onChange={(e) => setDeliveryDistrict(e.target.value)}
                >
                  <option value="">Dooro Degmada</option>
                  {MOGADISHU_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="search-input delivery-input"
                  placeholder="Geli Xaafada"
                  value={deliveryNeighborhood}
                  onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="totals-box"> 
            <div className="total-row">
              SUBTOTAL: <span>${subTotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              TAX ($0.05/item): <span>${taxAmount.toFixed(2)}</span>
            </div>
            {deliveryType === "delivery" && (
              <div className="total-row">
                DELIVERY FEE: <span>${deliveryCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row">
              DISCOUNT: <input type="number" min="0" max={maxDiscount.toFixed(2)} step="0.01" className="discount-input" value={discount} onChange={(e) => setDiscount(Math.min(Math.max(Number(e.target.value) || 0, 0), maxDiscount))}/>
            </div>
            <div className="total-row grand-total">
              TOTAL: <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="pay-btn"
            disabled={
              orders.length === 0 ||
              (deliveryType === "delivery" &&
                (!deliveryDistrict || !deliveryNeighborhood.trim()))
            }
            onClick={handlePay}
          >
            PAY NOW
          </button>
        </div>
      </section>
    </>
  );
}
