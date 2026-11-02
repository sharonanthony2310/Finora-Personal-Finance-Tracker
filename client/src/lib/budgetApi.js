
import api from "./api";

// Get all budgets
export const getBudgets = async () => {
  const response = await api.get("/budgets");
  return response.data.budgets;
};

// Create a budget
export const createBudget = async (budgetData) => {
  const response = await api.post("/budgets", budgetData);
  return response.data;
};

// Update a budget
export const updateBudget = async (id, budgetData) => {
  const response = await api.put(`/budgets/${id}`, budgetData);
  return response.data;
};

// Delete a budget
export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};

// Get budget spending summary
export const getBudgetSummary = async (month, year) => {
  const response = await api.get("/budgets/summary", {
    params: { month, year },
  });

  return response.data.summary;
};
