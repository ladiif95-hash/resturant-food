const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || "API request failed");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  bootstrap: () => request("/bootstrap"),
  login: (username, password) =>
    request("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  migrateLocalStorage: (data) =>
    request("/migrate-local-storage", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createOrder: (order) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    }),
  deleteOrder: (id) =>
    request(`/orders/${id}`, {
      method: "DELETE",
    }),
  saveMenuItems: (items) =>
    request("/menu-items", {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
  saveUsers: (users) =>
    request("/users", {
      method: "PUT",
      body: JSON.stringify({ users }),
    }),
  createUser: (user) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),
  updateUser: (username, user) =>
    request(`/users/${encodeURIComponent(username)}`, {
      method: "PUT",
      body: JSON.stringify(user),
    }),
  deleteUser: (username) =>
    request(`/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
    }),
  saveSetting: (key, value) =>
    request(`/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
};
