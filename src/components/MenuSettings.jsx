import React, { useMemo, useRef, useState } from "react";
import {
  FaBoxes,
  FaDollarSign,
  FaImage,
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUtensils,
} from "react-icons/fa";

const CATEGORY_OPTIONS = [
  { value: "fast", label: "Fast Food" },
  { value: "drinks", label: "Drinks" },
  { value: "normalday", label: "Normal Food" },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All Categories" },
  ...CATEGORY_OPTIONS,
];

export default function MenuSettings({
  isAdmin,
  menuItems,
  onMenuItemCategoryChange,
  onMenuItemPriceChange,
  onMenuItemStockToggle,
  onMenuItemDelete,
  onMenuItemAdd,
}) {
  const [menuFilter, setMenuFilter] = useState("");
  const [editCategory, setEditCategory] = useState("all");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "fast",
    price: "",
    image: "",
    outOfStock: false,
  });
  const imageInputRef = useRef(null);

  const menuStats = useMemo(() => {
    const items = menuItems || [];
    const activeItems = items.filter((item) => !item.outOfStock).length;
    const averagePrice = items.length
      ? items.reduce((sum, item) => sum + Number(item.price || 0), 0) / items.length
      : 0;

    return {
      total: items.length,
      active: activeItems,
      out: Math.max(items.length - activeItems, 0),
      averagePrice,
    };
  }, [menuItems]);

  const categoryCounts = useMemo(() => {
    const counts = { all: (menuItems || []).length };
    CATEGORY_OPTIONS.forEach((category) => {
      counts[category.value] = (menuItems || []).filter(
        (item) => item.category === category.value
      ).length;
    });
    return counts;
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    const needle = menuFilter.trim().toLowerCase();
    return (menuItems || []).filter((item) => {
      const matchesCategory =
        editCategory === "all" || item.category === editCategory;
      const matchesSearch =
        !needle || item.name.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, menuFilter, editCategory]);

  const getCategoryLabel = (value) =>
    CATEGORY_OPTIONS.find((category) => category.value === value)?.label ||
    "Uncategorized";

  const handleNewProductChange = (field, value) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProductImageUpload = (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = typeof reader.result === "string" ? reader.result : "";
      if (image) {
        handleNewProductChange("image", image);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProductSubmit = (event) => {
    event.preventDefault();
    if (!isAdmin || !onMenuItemAdd) return;

    const wasAdded = onMenuItemAdd(newProduct);
    if (!wasAdded) return;

    setNewProduct({
      name: "",
      category: "fast",
      price: "",
      image: "",
      outOfStock: false,
    });
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    setMenuFilter("");
    setEditCategory("all");
  };

  return (
    <article className="settings-card settings-card-half menu-settings-card">
      <div className="settings-card-head menu-settings-card-head">
        <div>
          <p className="menu-settings-eyebrow">Inventory Control</p>
          <h3>Menu Settings</h3>
          <p className="settings-card-note">
            Update categories, pricing, availability, and remove products from one
            clean workspace.
          </p>
        </div>
        <span className={`settings-chip ${isAdmin ? "admin" : "readonly"}`}>
          {isAdmin ? "Editable" : "Read only"}
        </span>
      </div>

      <div className="menu-settings-stats" aria-label="Menu summary">
        <div className="menu-settings-stat">
          <span className="menu-settings-stat-icon">
            <FaUtensils />
          </span>
          <small>Total Products</small>
          <strong>{menuStats.total}</strong>
        </div>
        <div className="menu-settings-stat">
          <span className="menu-settings-stat-icon">
            <FaBoxes />
          </span>
          <small>In Stock</small>
          <strong>{menuStats.active}</strong>
        </div>
        <div className="menu-settings-stat">
          <span className="menu-settings-stat-icon warning">
            <FaLayerGroup />
          </span>
          <small>Out of Stock</small>
          <strong>{menuStats.out}</strong>
        </div>
        <div className="menu-settings-stat">
          <span className="menu-settings-stat-icon">
            <FaDollarSign />
          </span>
          <small>Avg. Price</small>
          <strong>${menuStats.averagePrice.toFixed(2)}</strong>
        </div>
      </div>

      <form className="menu-add-product-card" onSubmit={handleAddProductSubmit}>
        <div className="menu-add-product-head">
          <span className="menu-add-product-icon">
            <FaPlus />
          </span>
          <div>
            <h4>Add New Product</h4>
            <p>Cunto cusub ku dar menu-ga admin-ka.</p>
          </div>
        </div>

        <div className="menu-add-product-grid">
          <label className="settings-field">
            <span>Product Name</span>
            <input
              type="text"
              className="settings-input"
              placeholder="e.g. Chicken Shawarma"
              value={newProduct.name}
              onChange={(e) => handleNewProductChange("name", e.target.value)}
              disabled={!isAdmin}
            />
          </label>

          <label className="settings-field">
            <span>Category</span>
            <select
              className="settings-input"
              value={newProduct.category}
              onChange={(e) => handleNewProductChange("category", e.target.value)}
              disabled={!isAdmin}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-field">
            <span>Price</span>
            <div className="menu-settings-price-input">
              <span>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="settings-input"
                placeholder="0.00"
                value={newProduct.price}
                onChange={(e) => handleNewProductChange("price", e.target.value)}
                disabled={!isAdmin}
              />
            </div>
          </label>

          <label className="settings-field">
            <span>Image URL</span>
            <input
              type="text"
              className="settings-input"
              placeholder="/images/product.png"
              value={newProduct.image.startsWith("data:") ? "" : newProduct.image}
              onChange={(e) => handleNewProductChange("image", e.target.value)}
              disabled={!isAdmin}
            />
          </label>

          <label className="settings-field menu-add-product-upload">
            <span>Upload Image</span>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="settings-input"
              onChange={(e) => handleProductImageUpload(e.target.files?.[0])}
              disabled={!isAdmin}
            />
          </label>

          <label className="menu-add-product-check">
            <input
              type="checkbox"
              checked={newProduct.outOfStock}
              onChange={(e) =>
                handleNewProductChange("outOfStock", e.target.checked)
              }
              disabled={!isAdmin}
            />
            <span>Start as out of stock</span>
          </label>

          <button
            type="submit"
            className="settings-action-btn menu-add-product-btn"
            disabled={!isAdmin}
          >
            <FaPlus />
            Add Product
          </button>
        </div>

        {newProduct.image && (
          <div className="menu-add-product-preview">
            <FaImage />
            <img src={newProduct.image} alt="" />
            <span>Image ready</span>
          </div>
        )}
      </form>

      <div className="menu-settings-toolbar">
        <div className="menu-settings-toolbar-head">
          <div>
            <h4>Product Catalog</h4>
            <p>Dooro qeyb, raadi cunto, kadib category/price/stock si degdeg ah u beddel.</p>
          </div>
          <span>{filteredItems.length} shown</span>
        </div>
        <div className="menu-category-tabs" aria-label="Filter products by category">
          {CATEGORY_FILTER_OPTIONS.map((category) => (
            <button
              key={category.value}
              type="button"
              className={`menu-category-tab ${
                editCategory === category.value ? "active" : ""
              }`}
              onClick={() => setEditCategory(category.value)}
            >
              <span>{category.label}</span>
              <strong>{categoryCounts[category.value] || 0}</strong>
            </button>
          ))}
        </div>
        <div className="settings-field menu-settings-search-field">
          <label htmlFor="menu-settings-filter">Search Product</label>
          <div className="menu-settings-search">
            <FaSearch />
            <input
              id="menu-settings-filter"
              type="text"
              className="settings-input"
              placeholder="Search by product name..."
              value={menuFilter}
              onChange={(e) => setMenuFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="menu-settings-list">
        {filteredItems.length > 0 && (
          <div className="menu-settings-list-head">
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Actions</span>
          </div>
        )}
        {filteredItems.length === 0 ? (
          <div className="menu-settings-empty">
            <FaSearch />
            <strong>No products found</strong>
            <p>Try another category or search term.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="menu-settings-row">
              <div className="menu-settings-main">
                <div className="menu-settings-product">
                  {item.image ? (
                    <img src={item.image} alt="" className="menu-settings-thumb" />
                  ) : (
                    <span className="menu-settings-thumb menu-settings-thumb-fallback">
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <strong>{item.name}</strong>
                    <span>{getCategoryLabel(item.category)} - Product #{item.id}</span>
                  </div>
                </div>
                <span className={`menu-stock-badge ${item.outOfStock ? "out" : "in"}`}>
                  {item.outOfStock ? "Out of Stock" : "In Stock"}
                </span>
              </div>

              <div className="menu-settings-controls">
                <label className="menu-settings-control">
                  <span>Category</span>
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
                </label>

                <label className="menu-settings-control">
                  <span>Price</span>
                  <div className="menu-settings-price-input">
                    <span>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="settings-input"
                      value={item.price}
                      onChange={(e) =>
                        onMenuItemPriceChange(item.id, e.target.value)
                      }
                      disabled={!isAdmin}
                    />
                  </div>
                </label>

                <button
                  type="button"
                  className={`settings-action-btn menu-stock-toggle ${
                    item.outOfStock ? "" : "settings-action-btn-ghost"
                  }`}
                  onClick={() => onMenuItemStockToggle(item.id)}
                  disabled={!isAdmin}
                >
                  {item.outOfStock ? "Mark In Stock" : "Mark Out"}
                </button>

                <button
                  type="button"
                  className="settings-action-btn danger menu-delete-btn"
                  onClick={() => onMenuItemDelete(item.id)}
                  disabled={!isAdmin}
                  aria-label={`Delete ${item.name}`}
                >
                  <FaTrash />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}
