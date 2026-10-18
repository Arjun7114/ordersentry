import { useEffect, useState } from 'react';
import { fetchOrders, createOrder, type Order, type NewOrder } from './api';
import './App.css';

// The form's starting / reset state.
const EMPTY_FORM: NewOrder = {
  customerName: '',
  customerPhone: '',
  shippingAddress: '',
  pincode: '',
  amount: 0,
  paymentMethod: 'COD',
};

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<NewOrder>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load orders once on mount.
  useEffect(() => {
    loadOrders();
  }, []);

  function loadOrders() {
    setLoading(true);
    fetchOrders()
      .then((data) => setOrders(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  // Update one field of the form as the user types.
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      // amount is a number; everything else is a string
      [name]: name === 'amount' ? Number(value) : value,
    }));
  }

  // Submit the form to create an order.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createOrder(form);
      // Put the new order at the top of the list (newest first).
      setOrders((prev) => [created, ...prev]);
      setForm(EMPTY_FORM); // reset the form
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>OrderSentry</h1>
        <p className="subtitle">Merchant order-risk dashboard</p>
      </header>

      <main>
        {/* Create-order form */}
        <section className="form-card">
          <h2>Ingest an order</h2>
          <form onSubmit={handleSubmit} className="order-form">
            <input
              name="customerName"
              placeholder="Customer name"
              value={form.customerName}
              onChange={handleChange}
            />
            <input
              name="customerPhone"
              placeholder="Phone"
              value={form.customerPhone}
              onChange={handleChange}
            />
            <input
              name="pincode"
              placeholder="Pincode"
              value={form.pincode}
              onChange={handleChange}
            />
            <input
              name="amount"
              type="number"
              placeholder="Amount"
              value={form.amount || ''}
              onChange={handleChange}
            />
            <input
              name="shippingAddress"
              placeholder="Shipping address"
              value={form.shippingAddress}
              onChange={handleChange}
              className="wide"
            />
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
            >
              <option value="COD">COD</option>
              <option value="PREPAID">PREPAID</option>
            </select>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add order'}
            </button>
          </form>
          {formError && <p className="error">{formError}</p>}
        </section>

        {/* Orders table */}
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