// Central API client for the OrderSentry backend.
// Keeping all backend calls here (instead of scattered fetch calls)
// gives one typed place to change if the API shape or URL moves.

const API_BASE = 'http://localhost:3000';

// Mirrors the backend's OrderStatus enum.
export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'RTO'
    | 'CANCELLED';

// The shape of an order as returned by the API.
export interface Order {
    _id: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    pincode: string;
    amount: number;
    paymentMethod: string;
    status: OrderStatus;
    riskScore: number | null;
    createdAt: string;
    updatedAt: string;
}

// The fields we send when creating an order (matches CreateOrderDto).
export interface NewOrder {
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    pincode: string;
    amount: number;
    paymentMethod?: string;
}

// GET /orders — list all orders
export async function fetchOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) {
        throw new Error(`Failed to fetch orders (${res.status})`);
    }
    return res.json();
}

// POST /orders — create a new order
export async function createOrder(order: NewOrder): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
    if (!res.ok) {
        // Surface the backend's validation message if there is one.
        const body = await res.json().catch(() => null);
        const message = body?.message
            ? Array.isArray(body.message)
                ? body.message.join(', ')
                : body.message
            : `Failed to create order (${res.status})`;
        throw new Error(message);
    }
    return res.json();
}

// PATCH /orders/:id/status — update an order's status
export async function updateOrderStatus(
    id: string,
    status: OrderStatus,
): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) {
        throw new Error(`Failed to update status (${res.status})`);
    }
    return res.json();
}