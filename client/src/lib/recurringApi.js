
import api from "./api";

// Fetch all recurring transactions
export const getRecurringTransactions = async () => {
  const response = await api.get("/recurring");
  return response.data.schedules;
};

// Create a recurring transaction
export const createRecurringTransaction = async (data) => {
  const response = await api.post("/recurring", data);
  return response.data;
};

// Update a recurring transaction
export const updateRecurringTransaction = async (id, data) => {
  const response = await api.put(`/recurring/${id}`, data);
  return response.data;
};

// Pause or resume a recurring transaction
export const updateRecurringStatus = async (id, isActive) => {
  const response = await api.patch(`/recurring/${id}/status`, {
    isActive,
  });

  return response.data;
};

// Delete a recurring transaction
export const deleteRecurringTransaction = async (id) => {
  const response = await api.delete(`/recurring/${id}`);
  return response.data;
};

// Process transactions that have reached their due dates
export const processDueTransactions = async () => {
  const response = await api.post("/recurring/process-due");
  return response.data;
};
