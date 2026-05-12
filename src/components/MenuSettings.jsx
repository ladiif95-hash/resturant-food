import React, { useMemo, useState } from "react";

const CATEGORY_OPTIONS = [
  { value: "fast", label: "Fast Food" },
  { value: "drinks", label: "Drinks" },
  { value: "normalday", label: "Normal Food" },
];

export default function MenuSettings({
  isAdmin,
  menuItems,
  onMenuItemCategoryChange,
  onMenuItemPriceChange,
  onMenuItemStockToggle,
  onMenuItemDelete,
}) {
  const [menuFilter, setMenuFilter] = useState("");

  const filteredItems = useMemo(() => {
    const needle = menuFilter.trim().toLowerCase();
    if (!needle) return menuItems || [];
    return (menuItems || []).filter((item) =>
      item.name.toLowerCase().includes(needle)
    );
  }, [menuItems, menuFilter]);

  return (
    <article className="settings-card settings-card-half">
      <div className="settings-card-head">
        <h3>Menu Settings</h3>
        <span className={`settings-chip ${isAdmin ? "admin" : "readonly"}`}>
          {isAdmin ? "Editable" : "Read only"}
        </span>
      </div>
      <p className="settings-card-note">
        Add category, edit price, delete product, and mark out of stock.
      </p>

      <div className="settings-field settings-field-full">
        <label htmlFor="menu-settings-filter">Search Product</label>
        <input
          id="menu-settings-filter"
          type="text"
          className="settings-input"
          placeholder="Search by product name..."
          value={menuFilter}
          onChange={(e) => setMenuFilter(e.target.value)}
        />
      </div>

      <div className="menu-settings-list">
        {filteredItems.length === 0 ? (
          <p className="settings-hint">No products found.</p>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="menu-settings-row">
              <div className="menu-settings-main">
                <strong>{item.name}</strong>
                <span className={`menu-stock-badge ${item.outOfStock ? "out" : "in"}`}>
                  {item.outOfStock ? "Out of Stock" : "In Stock"}
                </span>
              </div>

              <div className="menu-settings-controls">
                <select
                  className="settings-input"
                  value={item.category}
                  onChange={(e) =>
                    onMenuItemCategoryChange(item.id, e.target.value)
                  }
                  disabled={!isAdmin}
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="settings-input"
                  value={item.price}
                  onChange={(e) => onMenuItemPriceChange(item.id, e.target.value)}
                  disabled={!isAdmin}
                />

                <button
                  type="button"
                  className={`settings-action-btn ${item.outOfStock ? "" : "settings-action-btn-ghost"}`}
                  onClick={() => onMenuItemStockToggle(item.id)}
                  disabled={!isAdmin}
                >
                  {item.outOfStock ? "mayalo" : "wuu yaalaa"}
                </button>

                <button
                  type="button"
                  className="settings-action-btn danger"
                  onClick={() => onMenuItemDelete(item.id)}
                  disabled={!isAdmin}
                >
                  Delete Product
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
