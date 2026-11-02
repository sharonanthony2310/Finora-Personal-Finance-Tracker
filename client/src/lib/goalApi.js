
import api from "./api";

// Fetch all savings goals
export const getGoals = async () => {
  const response = await api.get("/goals");
  return response.data.goals;
};

// Create a savings goal
export const createGoal = async (goalData) => {
  const response = await api.post("/goals", goalData);
  return response.data;
};

// Update an existing savings goal
export const updateGoal = async (id, goalData) => {
  const response = await api.put(`/goals/${id}`, goalData);
  return response.data;
};

// Add money to a savings goal
export const contributeToGoal = async (id, amount) => {
  const response = await api.post(`/goals/${id}/contribute`, {
    amount: Number(amount),
  });

  return response.data;
};

// Delete a savings goal
export const deleteGoal = async (id) => {
  const response = await api.delete(`/goals/${id}`);
  return response.data;
};
