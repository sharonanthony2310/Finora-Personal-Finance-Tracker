
import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Wallet,
  TrendingUp,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import {
  getBudgetSummary,
  createBudget,
  deleteBudget,
} from "../lib/budgetApi";

const categories = [
  "Food",
  "Housing",
  "Transport",
  "Shopping",
  "Health",
  "Education",
  "Other",
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function BudgetPage() {
  const today = new Date();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    category: "Food",
    amount: "",
  });

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBudgetSummary(month, year);
      setBudgets(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load budgets. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  const totalBudget = budgets.reduce(
    (sum, budget) => sum + budget.amount,
    0
  );

  const totalSpent = budgets.reduce(
    (sum, budget) => sum + budget.spent,
    0
  );

  const remaining = totalBudget - totalSpent;

  const addBudget = async (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid budget amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createBudget({
        category: form.category,
        amount,
        month,
        year,
      });

      setForm({
        category: "Food",
        amount: "",
      });

      setShowForm(false);
      await fetchBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not create budget."
      );
    } finally {
      setSaving(false);
    }
  };

  const removeBudget = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteBudget(id);
      await fetchBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not delete budget."
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">
            Budget management
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Plan your spending and stay within your limits.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          <Plus size={18} />
          Create budget
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
          className="rounded-xl border border-slate-700 bg-[#111B2E] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
        >
          {monthNames.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
          className="rounded-xl border border-slate-700 bg-[#111B2E] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
        >
          {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <SummaryCard
          title="Total budget"
          amount={totalBudget}
          icon={Wallet}
          color="text-indigo-400"
        />

        <SummaryCard
          title="Total spent"
          amount={totalSpent}
          icon={TrendingUp}
          color="text-rose-400"
        />

        <SummaryCard
          title="Remaining budget"
          amount={remaining}
          icon={Wallet}
          color={remaining < 0 ? "text-rose-400" : "text-emerald-400"}
        />
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5 sm:p-6">
        <div className="mb-6">
          <h3 className="font-bold text-white">
            Category budgets
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Spending progress for {monthNames[month - 1]} {year}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <LoaderCircle size={18} className="animate-spin" />
            Loading budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet size={35} className="mx-auto text-slate-600" />
            <p className="mt-3 font-medium text-slate-300">
              No budgets for this month
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Create a budget to start tracking your spending.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {budgets.map((budget) => {
              const percentage = Math.min(
                budget.percentage,
                100
              );

              const exceeded = budget.spent > budget.amount;

              return (
                <div key={budget._id}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {budget.category}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatMoney(budget.spent)} spent of{" "}
                        {formatMoney(budget.amount)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold ${
                          exceeded ? "text-rose-400" : "text-slate-300"
                        }`}
                      >
                        {budget.percentage}%
                      </span>

                      <button
                        onClick={() => removeBudget(budget._id)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-400/10 hover:text-rose-400"
                        title="Delete budget"
                        aria-label={`Delete ${budget.category} budget`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        exceeded ? "bg-rose-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {exceeded
                      ? `${formatMoney(budget.spent - budget.amount)} over budget`
                      : `${formatMoney(budget.remaining)} remaining`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111B2E] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Create a budget
              </h3>

              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <form onSubmit={addBudget} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-[#0B1120] px-4 py-3 text-sm text-white outline-none focus:border-indigo-400"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Monthly limit (₹)
                </label>

                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({ ...form, amount: event.target.value })
                  }
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-slate-700 bg-[#0B1120] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400"
                />
              </div>

              <p className="text-xs text-slate-500">
                Budget period: {monthNames[month - 1]} {year}
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save budget"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, amount, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={20} className={color} />
      </div>

      <p className={`mt-4 text-2xl font-bold ${color}`}>
        {formatMoney(amount)}
      </p>
    </div>
  );
}
