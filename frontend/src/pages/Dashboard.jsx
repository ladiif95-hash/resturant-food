import React from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaChartBar,
  FaChartPie,
  FaClipboardList,
  FaMoneyBillWave,
  FaTachometerAlt,
  FaUserCircle,
  FaUtensils,
} from "react-icons/fa";

export default function Dashboard({
  dashboardRange,
  setDashboardRange,
  handleDownloadDashboardReport,
  dashboardItems,
  totalSystemItems,
  isAdmin,
  dashboardOrderCount,
  orderDeltaPercent,
  dashboardRangeLabel,
  todayOrderCount,
  dashboardMoneyTotal,
  avgTicket,
  categoryChart,
  maxCategoryValue,
  last7Days,
  maxWeeklyValue,
  deliveryPercent,
  deliveryCount,
  pickupCount,
  topItems,
  dashboardSellerTotals,
}) {
  return (
    <section className="menu-side dashboard-page">
      <div className="invoice-paper dashboard-shell">
        <div className="dashboard-topbar">
          <div className="dashboard-title-block">
            <h2 className="invoice-title dashboard-main-title">Business Dashboard</h2>
          </div>
          <div className="dashboard-top-actions">
            <div className="dashboard-pills">
              <button
                type="button"
                className={`dashboard-pill ${dashboardRange === "today" ? "active" : ""}`}
                onClick={() => setDashboardRange("today")}
              >
                Today
              </button>
              <button
                type="button"
                className={`dashboard-pill ${dashboardRange === "7d" ? "active" : ""}`}
                onClick={() => setDashboardRange("7d")}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`dashboard-pill ${dashboardRange === "30d" ? "active" : ""}`}
                onClick={() => setDashboardRange("30d")}
              >
                30 Days
              </button>
            </div>
            <button
              type="button"
              className="dashboard-download-btn"
              onClick={handleDownloadDashboardReport}
            >
              <FaArrowDown />
              <span>Download Reports</span>
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-head">
              <p>Total Category</p>
              <span className="dashboard-card-icon">
                <FaClipboardList />
              </span>
            </div>
            <strong>{dashboardItems.length}</strong>
            <small className="kpi-caption">Selected menu category items</small>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-head">
              <p>Total Items</p>
              <span className="dashboard-card-icon">
                <FaUtensils />
              </span>
            </div>
            <strong>{totalSystemItems}</strong>
            <small className="kpi-caption">All items in the system</small>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-head">
              <p>{isAdmin ? "All Orders" : "My Orders"}</p>
              <span className="dashboard-card-icon">
                <FaUserCircle />
              </span>
            </div>
            <strong>{dashboardOrderCount}</strong>
            <small className={`kpi-trend ${orderDeltaPercent >= 0 ? "up" : "down"}`}>
              {orderDeltaPercent >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(orderDeltaPercent).toFixed(1)}% vs yesterday
            </small>
            <small className="kpi-note">{dashboardRangeLabel} window</small>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-head">
              <p>Today Orders</p>
              <span className="dashboard-card-icon">
                <FaTachometerAlt />
              </span>
            </div>
            <strong>{todayOrderCount}</strong>
            <small className="kpi-caption">Orders placed today</small>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-card-head">
              <p>{isAdmin ? "All Money" : "My Money"}</p>
              <span className="dashboard-card-icon">
                <FaMoneyBillWave />
              </span>
            </div>
            <strong>${dashboardMoneyTotal.toFixed(2)}</strong>
            <small className="kpi-caption">Avg ticket ${avgTicket.toFixed(2)}</small>
          </div>
        </div>

        <div className="dashboard-charts-grid">
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-head">
              <h3>Category Breakdown</h3>
              <FaChartBar />
            </div>
            {categoryChart.map((cat) => (
              <div key={cat.label} className="chart-row">
                <span>{cat.label}</span>
                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{ width: `${(cat.value / maxCategoryValue) * 100}%` }}
                  />
                </div>
                <strong>{cat.value}</strong>
              </div>
            ))}
          </div>

          <div className="dashboard-chart-card">
            <div className="dashboard-chart-head">
              <h3>Weekly Orders Trend</h3>
              <FaChartBar />
            </div>
            <div className="weekly-bars">
              {last7Days.map((day) => (
                <div key={day.label} className="weekly-bar-item">
                  <div className="weekly-bar-track">
                    <div
                      className="weekly-bar-fill"
                      style={{ height: `${(day.value / maxWeeklyValue) * 100}%` }}
                    />
                  </div>
                  <span className="weekly-bar-label">{day.label}</span>
                  <small>{day.value}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-chart-card">
            <div className="dashboard-chart-head">
              <h3>Delivery Ratio</h3>
              <FaChartPie />
            </div>
            <div className="donut-wrap">
              <div
                className="donut-chart"
                style={{
                  background: `conic-gradient(#14b8a6 ${deliveryPercent}%, #cbd5e1 ${deliveryPercent}% 100%)`,
                }}
              >
                <div className="donut-center">
                  {Math.round(deliveryPercent)}%
                </div>
              </div>
              <div className="donut-legend">
                <p><span className="legend-dot delivery" />Delivery: {deliveryCount}</p>
                <p><span className="legend-dot pickup" />Pickup: {pickupCount}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-chart-card top-items-card">
            <div className="dashboard-chart-head">
              <h3>Top Selling Items (By Money)</h3>
              <FaUtensils />
            </div>
            {topItems.length === 0 ? (
              <p className="empty-chart">No orders yet</p>
            ) : (
              <div className="top-items-list">
                {topItems.map((item, index) => (
                  <div key={item.name} className="top-item-row">
                    <span className="top-item-rank">#{index + 1}</span>
                    <span className="top-item-name">{item.name}</span>
                    <span className="top-item-qty">{item.qty} sold</span>
                    <strong>${item.total.toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-chart-card top-items-card">
            <div className="dashboard-chart-head">
              <h3>{isAdmin ? "All Users Sales" : "My Sales"}</h3>
              <FaMoneyBillWave />
            </div>
            <div className="seller-sales-list">
              {Object.entries(dashboardSellerTotals).length === 0 ? (
                <p className="empty-chart">No sales yet.</p>
              ) : (
                Object.entries(dashboardSellerTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([username, total]) => (
                    <div key={username} className="seller-sales-row">
                      <span>{username}</span>
                      <strong>${total.toFixed(2)}</strong>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
