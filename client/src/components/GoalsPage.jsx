
import { useEffect, useState } from "react";
import {
  Target,
  Plus,
  Wallet,
  TrendingUp,
  Calendar,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Plane,
  GraduationCap,
  Car,
  ShieldCheck,
  ShoppingBag,
  MoreHorizontal,
  PiggyBank,
} from "lucide-react";

import {
  getGoals,
  createGoal,
  updateGoal,
  contributeToGoal,
  deleteGoal,
} from "../lib/goalApi";

const categories = [
  { name: "Emergency Fund", icon: ShieldCheck },
  { name: "Travel", icon: Plane },
  { name: "Education", icon: GraduationCap },
  { name: "Shopping", icon: ShoppingBag },
  { name: "Vehicle", icon: Car },
  { name: "Other", icon: MoreHorizontal },
];

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const emptyForm = {
  name: "",
  description: "",
  targetAmount: "",
  targetDate: "",
  category: "Other",
};

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [contributionGoal, setContributionGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");

  const fetchGoals = async () => {
    try {
      setError("");
      const data = await getGoals();
      setGoals(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load savings goals."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const totalTarget = goals.reduce(
    (total, goal) => total + goal.targetAmount,
    0
  );

  const totalSaved = goals.reduce(
    (total, goal) => total + goal.savedAmount,
    0
  );

  const completedGoals = goals.filter(
    (goal) => goal.status === "completed"
  ).length;

  const overallProgress =
    totalTarget > 0
      ? Math.min((totalSaved / totalTarget) * 100, 100)
      : 0;

  const openCreateForm = () => {
    setEditingGoal(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (goal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      description: goal.description || "",
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate
        ? new Date(goal.targetDate).toISOString().slice(0, 10)
        : "",
      category: goal.category,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setForm(emptyForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const amount = Number(form.targetAmount);

    if (!form.name.trim() || !form.targetDate || amount <= 0) {
      setError("Please complete all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const goalData = {
        ...form,
        name: form.name.trim(),
        targetAmount: amount,
      };

      if (editingGoal) {
        await updateGoal(editingGoal._id, goalData);
      } else {
        await createGoal(goalData);
      }

      closeForm();
      await fetchGoals();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save your goal."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleContribution = async (event) => {
    event.preventDefault();

    const amount = Number(contributionAmount);

    if (!contributionGoal || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid contribution amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await contributeToGoal(contributionGoal._id, amount);

      setContributionGoal(null);
      setContributionAmount("");
      await fetchGoals();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to add contribution."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this savings goal?"
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteGoal(id);
      await fetchGoals();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this goal."
      );
    }
  };

  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    return Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getCategoryIcon = (category) => {
    const item = categories.find((cat) => cat.name === category);
    return item?.icon || Target;
  };

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-indigo-400">
            FINANCIAL PLANNING
          </p>

          <h1 className="text-3xl font-bold text-white">
            Savings Goals
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Plan ahead and turn your financial goals into reality.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500"
        >
          <Plus size={18} />
          Create Goal
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Saved"
          value={currency(totalSaved)}
          icon={Wallet}
          color="text-emerald-400"
        />

        <SummaryCard
          title="Total Target"
          value={currency(totalTarget)}
          icon={Target}
          color="text-indigo-400"
        />

        <SummaryCard
          title="Active Goals"
          value={goals.filter((g) => g.status === "active").length}
          icon={TrendingUp}
          color="text-amber-400"
        />

        <SummaryCard
          title="Completed Goals"
          value={completedGoals}
          icon={CheckCircle}
          color="text-emerald-400"
        />
      </div>

      {/* Overall progress */}
      <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Overall Savings Progress
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Your progress across all savings goals
            </p>
          </div>

          <span className="text-xl font-bold text-indigo-400">
            {overallProgress.toFixed(0)}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="mt-3 flex justify-between text-sm">
          <span className="text-slate-400">
            {currency(totalSaved)} saved
          </span>
          <span className="text-slate-400">
            {currency(totalTarget)} target
          </span>
        </div>
      </div>

      {/* Goals list */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Your Goals
          </h2>

          <span className="text-sm text-slate-400">
            {goals.length} goals
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-10 text-center text-slate-400">
            Loading savings goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-[#111B2E] px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
              <PiggyBank className="text-indigo-400" size={30} />
            </div>

            <h3 className="text-lg font-semibold text-white">
              No savings goals yet
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
              Start planning your future by creating your first savings goal.
            </p>

            <button
              onClick={openCreateForm}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Create your first goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {goals.map((goal) => {
              const progress =
                goal.targetAmount > 0
                  ? Math.min(
                      (goal.savedAmount / goal.targetAmount) * 100,
                      100
                    )
                  : 0;

              const daysRemaining = getDaysRemaining(goal.targetDate);
              const CategoryIcon = getCategoryIcon(goal.category);
              const isCompleted = goal.status === "completed";

              return (
                <div
                  key={goal._id}
                  className="rounded-2xl border border-slate-800 bg-[#111B2E] p-6 transition hover:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                        <CategoryIcon
                          size={22}
                          className="text-indigo-400"
                        />
                      </div>

                      <div>
                        <h3 className="font-semibold text-white">
                          {goal.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {goal.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(goal)}
                        title="Edit goal"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(goal._id)}
                        title="Delete goal"
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="mt-4 text-sm text-slate-400">
                      {goal.description}
                    </p>
                  )}

                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Amount saved
                      </p>
                      <p className="mt-1 text-xl font-bold text-white">
                        {currency(goal.savedAmount)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        Target amount
                      </p>
                      <p className="mt-1 font-semibold text-slate-300">
                        {currency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-slate-400">
                      {progress.toFixed(0)}% completed
                    </span>
                    <span className="text-slate-400">
                      {currency(
                        Math.max(
                          goal.targetAmount - goal.savedAmount,
                          0
                        )
                      )}{" "}
                      remaining
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar size={14} />

                      {isCompleted
                        ? "Goal completed"
                        : daysRemaining < 0
                        ? "Deadline passed"
                        : daysRemaining === 0
                        ? "Due today"
                        : `${daysRemaining} days remaining`}
                    </div>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                        <CheckCircle size={14} />
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setContributionGoal(goal);
                          setContributionAmount("");
                        }}
                        className="rounded-lg bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/20"
                      >
                        + Add Savings
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <Modal onClose={closeForm}>
          <h2 className="text-xl font-bold text-white">
            {editingGoal ? "Edit Savings Goal" : "Create Savings Goal"}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Set a target and start building your savings.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormField label="Goal Name">
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. New Laptop"
                maxLength={100}
                required
                className="form-input"
              />
            </FormField>

            <FormField label="Description (Optional)">
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="What are you saving for?"
                maxLength={300}
                rows={2}
                className="form-input resize-none"
              />
            </FormField>

            <FormField label="Target Amount (₹)">
              <input
                name="targetAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.targetAmount}
                onChange={handleFormChange}
                placeholder="50000"
                required
                className="form-input"
              />
            </FormField>

            <FormField label="Target Date">
              <input
                name="targetDate"
                type="date"
                value={form.targetDate}
                onChange={handleFormChange}
                required
                className="form-input"
              />
            </FormField>

            <FormField label="Category">
              <select
                name="category"
                value={form.category}
                onChange={handleFormChange}
                className="form-input"
              >
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingGoal
                  ? "Update Goal"
                  : "Create Goal"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Contribution modal */}
      {contributionGoal && (
        <Modal onClose={() => setContributionGoal(null)}>
          <h2 className="text-xl font-bold text-white">
            Add Savings
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Add money towards{" "}
            <span className="font-medium text-white">
              {contributionGoal.name}
            </span>
          </p>

          <p className="mt-4 text-sm text-slate-400">
            Remaining target:{" "}
            <span className="font-semibold text-white">
              {currency(
                Math.max(
                  contributionGoal.targetAmount -
                    contributionGoal.savedAmount,
                  0
                )
              )}
            </span>
          </p>

          <form onSubmit={handleContribution} className="mt-5 space-y-4">
            <FormField label="Contribution Amount (₹)">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={contributionAmount}
                onChange={(event) =>
                  setContributionAmount(event.target.value)
                }
                placeholder="Enter amount"
                required
                className="form-input"
              />
            </FormField>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setContributionGoal(null)}
                className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Contribution"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Summary card component
function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={20} className={color} />
      </div>

      <p className="mt-4 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// Reusable form field
function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}

// Reusable modal
function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-[#111B2E] p-6 shadow-2xl">
        <div className="mb-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default GoalsPage;
