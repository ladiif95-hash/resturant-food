import React from "react";

export default function OrdersMoney({
  savedOrders,
  selectedUsersSales,
  openAdminDetailUsers,
  toggleAdminDetail,
  getDeliveryLocation,
}) {
  return (
    <section className="order-side">
      <div className="invoice-paper">
        <h2>Orders Money (Admin)</h2>
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

                {selectedUsersSales.length === 0 && (
                  <p>No user sales available.</p>
                )}

                {selectedUsersSales.map((user, index) => {
                  const isOpen = openAdminDetailUsers.includes(user.username);
                  const userOrders = savedOrders.filter(
                    (order) => (order.createdBy || "unknown") === user.username
                  );
                  const userTotal = userOrders.reduce(
                    (sum, order) => sum + order.total,
                    0
                  );

                  return (
                    <div
                      key={user.username}
                      className={`saved-order ${isOpen ? "active-user-card" : ""}`}
                    >
                      <h3>
                        User {index + 1}: {user.username}
                      </h3>
                      <strong>Total Bought: ${user.total.toFixed(2)}</strong>
                      <div className="order-actions">
                        <button
                          type="button"
                          className="back-btn"
                          onClick={() => toggleAdminDetail(user.username)}
                        >
                          {isOpen ? "Hide Details" : "View Details"}
                        </button>
                      </div>

                      {isOpen && (
                        <div className="money-inline-detail">
                          <div className="money-section-header">
                            <h3>User Detail</h3>
                            <span className="money-badge">
                              ${userTotal.toFixed(2)}
                            </span>
                          </div>
                          {userOrders.length === 0 ? (
                            <p>No details available.</p>
                          ) : (
                            userOrders.map((order, orderIndex) => {
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
                                    {order.items.map((item) => (
                                      <p key={`${order.id}-${item.id}`}>
                                        {item.name} x {item.qty} = ${(item.price * item.qty).toFixed(2)}
                                      </p>
                                    ))}
                                  </div>
                                  <strong>Order Total: ${order.total.toFixed(2)}</strong>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
