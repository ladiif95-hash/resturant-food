import React from "react";

export default function ReceiptModal({
  paidReceiptOrder,
  paidReceiptLocation,
  setPaidReceiptOrder,
  printPDF,
}) {
  if (!paidReceiptOrder) return null;

  return (
    <div
      className="receipt-modal-overlay"
      onClick={() => setPaidReceiptOrder(null)}
    >
      <div
        className="receipt-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="receipt-modal-head">
          <h3>Payment Receipt</h3>
          <div className="pos-order-badges">
            <span className="pos-order-badge">
              {paidReceiptOrder.items.reduce((sum, item) => sum + item.qty, 0)} Qty
            </span>
            <span className="pos-order-badge active">Paid</span>
          </div>
        </div>

        <div className="paid-receipt-card">
          <div className="paid-receipt-meta">
            <p>
              Receipt Date: <strong>{paidReceiptOrder.date}</strong>
            </p>
            <p>
              Type: <strong>{paidReceiptOrder.deliveryType || "pickup"}</strong>
            </p>
            {paidReceiptOrder.deliveryType === "delivery" && paidReceiptLocation && (
              <>
                <p>
                  Degmada: <strong>{paidReceiptLocation.district}</strong>
                </p>
                <p>
                  Xaafada: <strong>{paidReceiptLocation.neighborhood}</strong>
                </p>
              </>
            )}
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
                </tr>
              </thead>
              <tbody>
                {paidReceiptOrder.items.map((item, index) => (
                  <tr key={`${paidReceiptOrder.id}-${item.id}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals-box">
            <div className="total-row">
              ITEMS:
              <span>{paidReceiptOrder.items.reduce((sum, item) => sum + item.qty, 0)}</span>
            </div>
            {paidReceiptOrder.deliveryType === "delivery" && Number(paidReceiptOrder.deliveryFee) > 0 && (
              <div className="total-row">
                DELIVERY FEE:
                <span>${Number(paidReceiptOrder.deliveryFee).toFixed(2)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              TOTAL: <span>${paidReceiptOrder.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="order-actions receipt-actions">
            <button
              className="pay-btn order-action-btn"
              onClick={() => printPDF(paidReceiptOrder)}
            >
              Print Receipt
            </button>
            <button
              className="back-btn receipt-action-btn"
              onClick={() => setPaidReceiptOrder(null)}
            >
              New Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
