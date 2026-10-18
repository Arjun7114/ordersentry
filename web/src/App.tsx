import { useEffect, useState } from 'react';
import { fetchOrders, type Order } from './api';
import './App.css';

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load orders from the API when the page first renders.
  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>OrderSentry</h1>
        <p className="subtitle">Merchant order-risk dashboard</p>
      </header>

      <main>
        {loading && <p>Loading orders…</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && (
          <>
            <p className="count">{orders.length} order(s)</p>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Pincode</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td>{o.customerName}</td>
                    <td>{o.customerPhone}</td>
                    <td>{o.pincode}</td>
                    <td>₹{o.amount}</td>
                    <td>{o.paymentMethod}</td>
                    <td>
                      <span className={`status status-${o.status.toLowerCase()}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>{o.riskScore ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>
    </div>
  );
}

export default App;