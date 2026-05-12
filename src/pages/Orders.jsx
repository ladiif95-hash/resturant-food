import React from "react";

export default function Orders({
  ordersSearch,
  setOrdersSearch,
  setOrdersPageNo,
  ordersTypeFilter,
  setOrdersTypeFilter,
  ordersSort,
  setOrdersSort,
  ordersPageSize,
  setOrdersPageSize,
  pagedOrders,
  filteredSortedOrders,
  ordersPageNo,
  totalOrdersPages,
  getDeliveryLocation,
  printPDF,
  deleteOrder,
  orderPageButtons,
  setPage,
}) {
  const handleSearchChange = (event) => {
    setOrdersSearch(event.target.value);
    setOrdersPageNo(1);
  };

  const handleTypeChange = (event) => {
    setOrdersTypeFilter(event.target.value);
    setOrdersPageNo(1);
  };

  const handleSortChange = (event) => {
    setOrdersSort(event.target.value);
    setOrdersPageNo(1);
  };

  const handlePageSizeChange = (event) => {
    setOrdersPageSize(Number(event.target.value));
    setOrdersPageNo(1);
  };

  return (
    <section className="order-side">
      <div className="invoice-paper orders-page-shell">
        <div className="orders-header">
          <h2 className="invoice-title">My Orders</h2>
          <button type="button" className="back-btn" onClick={() => setPage("dashboard")}>
            BACK
          </button>
        </div>

        <div className="orders-toolbar">
          <input
            type="text"
            className="search-input orders-search"
            placeholder="Search by user, item, date, address..."
            value={ordersSearch}
            onChange={handleSearchChange}
          />
          <select
            className="orders-select"
            value={ordersTypeFilter}
            onChange={handleTypeChange}
          >
            <option value="all">All Types</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
          <select className="orders-select" value={ordersSort} onChange={handleSortChange}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Total</option>
            <option value="lowest">Lowest Total</option>
          </select>
          <select
            className="orders-select"
            value={ordersPageSize}
            onChange={handlePageSizeChange}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>

        <div className="orders-page-meta">
          <span>
            Showing {pagedOrders.length} of {filteredSortedOrders.length} orders
          </span>
          <span>
            Page {ordersPageNo} of {totalOrdersPages}
          </span>
        </div>

        {pagedOrders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          pagedOrders.map((order, index) => {
            const orderType = order.deliveryType || "pickup";
            const location = getDeliveryLocation(order);
            const orderItems = order.items || [];
            const totalItems = orderItems.reduce((sum, item) => sum + (item.qty || 0), 0);
            const orderNo = (ordersPageNo - 1) * Number(ordersPageSize) + index + 1;

            return (
              <article key={order.id} className="order-detail-card print-order-card">
                <div className="order-detail-head">
                  <h3>Order #{orderNo}</h3>
                  <span className="order-detail-date">{order.date}</span>
                </div>

                <div className="order-detail-meta">
                  <p>
                    Type: <strong>{orderType}</strong>
                  </p>
                  <p>
                    User: <strong>{order.createdBy || "unknown"}</strong>
                  </p>
                  {orderType === "delivery" ? (
                    <>
                      <p>
                        Degmada: <strong>{location.district}</strong>
                      </p>
                      <p>
                        Xaafada: <strong>{location.neighborhood}</strong>
                      </p>
                    </>
                  ) : (
                    <p>
                      Address: <strong>Pickup</strong>
                    </p>
                  )}
                </div>

                <div className="order-detail-table-wrap">
                  <table className="order-detail-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, itemIndex) => (
                        <tr key={`${order.id}-${item.id}-${itemIndex}`}>
                          <td>{itemIndex + 1}</td>
                          <td>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>${Number(item.price || 0).toFixed(2)}</td>
                          <td>${Number((item.price || 0) * (item.qty || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="order-detail-summary">
                  <span>Items: {totalItems}</span>
                  <strong>Total: ${Number(order.total || 0).toFixed(2)}</strong>
                </div>

                <div className="order-actions print-hide">
                  <button
                    type="button"
                    className="pay-btn order-action-btn"
                    onClick={() => printPDF(order)}
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    className="delete-btn order-action-btn"
                    onClick={() => deleteOrder(order.id)}
                  >
                    Delete Order
                  </button>
                </div>
              </article>
            );
          })
        )}

        <div className="orders-pagination print-hide">
          <button
            type="button"
            className="orders-page-btn"
            disabled={ordersPageNo === 1}
            onClick={() => setOrdersPageNo(1)}
          >
            First
          </button>
          <button
            type="button"
            className="orders-page-btn"
            disabled={ordersPageNo === 1}
            onClick={() => setOrdersPageNo((prev) => Math.max(prev - 1, 1))}
          >
            Prev
          </button>

          {orderPageButtons.map((item, idx) =>
            item === "..." ? (
              <span key={`dots-${idx}`} className="orders-page-dots">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`orders-page-btn ${ordersPageNo === item ? "active" : ""}`}
                onClick={() => setOrdersPageNo(item)}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            className="orders-page-btn"
            disabled={ordersPageNo === totalOrdersPages}
            onClick={() =>
              setOrdersPageNo((prev) => Math.min(prev + 1, totalOrdersPages))
            }
          >
            Next
          </button>
          <button
            type="button"
            className="orders-page-btn"
            disabled={ordersPageNo === totalOrdersPages}
            onClick={() => setOrdersPageNo(totalOrdersPages)}
          >
            Last
          </button>
        </div>
      </div>
    </section>
  );
}
