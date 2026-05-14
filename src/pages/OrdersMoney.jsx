import React from "react";
import { FaUserCircle } from "react-icons/fa";

export default function OrdersMoney({
  savedOrders,
  selectedUsersSales,
  openAdminDetailUsers,
  toggleAdminDetail,
  getDeliveryLocation,
}) {
  const moneyRows = selectedUsersSales.map((user, index) => {
    const userOrders = savedOrders.filter(
      (order) => (order.createdBy || "unknown") === user.username
    );
    const totalOrderAmount = userOrders.reduce((sum, order) => {
      const itemsTotal = (order.items || []).reduce(
        (itemSum, item) => itemSum + Number(item.price || 0) * Number(item.qty || 0),
        0
      );
      return sum + (itemsTotal || Number(order.total || 0));
    }, 0);
    const netSpend = userOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );
    const totalDiscounted = Math.max(totalOrderAmount - netSpend, 0);

    return {
      ...user,
      rank: index + 1,
      userOrders,
      totalOrderAmount,
      totalDiscounted,
      netSpend,
    };
  });

  const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

  return (
    <section className="order-side orders-money-page">
      <div className="invoice-paper orders-money-shell">
        <h2 className="orders-money-title">Orders Money (Admin)</h2>
        {savedOrders.length === 0 ? (
          <p>No paid orders yet.</p>
        ) : (
          <>
            <div className="money-sections">
              <div className="money-section">
                <div className="money-section-header">
                  <h3>Users by Order Money (Admin Excluded)</h3>
                  <span className="money-badge">{savedOrders.length} Orders</span>
                </div>

                {moneyRows.length === 0 && (
                  <p>No user sales available.</p>
                )}

                {moneyRows.length > 0 && (
                  <div className="orders-money-table-wrap">
                    <table className="orders-money-table">
                      <thead>
                        <tr>
                          <th>User Rank</th>
                          <th>User</th>
                          <th>Total Order Amount</th>
                          <th>Total Discounted</th>
                          <th>Net Spend</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moneyRows.map((user) => {
                          const isOpen = openAdminDetailUsers.includes(user.username);

                          return (
                            <React.Fragment key={user.username}>
                              <tr className={isOpen ? "orders-money-row-open" : ""}>
                                <td>{user.rank}</td>
                                <td>
                                  <div className="orders-money-user">
                                    <span className="orders-money-avatar">
                                      <FaUserCircle />
                                    </span>
                                    <span>
                                      <strong>{user.username}</strong>
                                      <small>Username: {user.username}</small>
                                    </span>
                                  </div>
                                </td>
                                <td>{formatMoney(user.totalOrderAmount)}</td>
                                <td>{formatMoney(user.totalDiscounted)}</td>
                                <td className="orders-money-net">
                                  {formatMoney(user.netSpend || user.total)}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="orders-money-detail-btn"
                                    onClick={() => toggleAdminDetail(user.username)}
                                  >
                                    Detailed Analysis
                                  </button>
                                </td>
                              </tr>
                              {isOpen && (
                                <tr className="orders-money-detail-row">
                                  <td colSpan="6">
                                    <div className="money-inline-detail">
                                      <div className="money-section-header">
                                        <h3>User Detail</h3>
                                        <span className="money-badge">
                                          {formatMoney(user.netSpend || user.total)}
                                        </span>
                                      </div>
                                      {user.userOrders.length === 0 ? (
                                        <p>No details available.</p>
                                      ) : (
                                        user.userOrders.map((order, orderIndex) => {
                                          const location = getDeliveryLocation(order);
                                          return (
                                            <div key={order.id} className="saved-order">
                                              <h3>Order #{orderIndex + 1} - {order.date}</h3>
                                              <p>Submitted by: {order.createdBy || "unknown"}</p>
                                              {order.deliveryType === "delivery" && (
                                                <>
                                                  <p>Type: delivery</p>
                                                  <p>Degmada: {location.district}</p>
                                                  <p>Xaafada: {location.neighborhood}</p>
                                                </>
                                              )}
                                              <div className="money-detail-items">
                                                {(order.items || []).map((item) => (
                                                  <p key={`${order.id}-${item.id}`}>
                                                    {item.name} x {item.qty} ={" "}
                                                    {formatMoney(item.price * item.qty)}
                                                  </p>
                                                ))}
                                              </div>
                                              <strong>
                                                Order Total: {formatMoney(order.total)}
                                              </strong>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
