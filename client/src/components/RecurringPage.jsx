
import { useEffect, useState } from "react";

import {
  Plus,
  Repeat,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  Pencil,
  Trash2,
  Pause,
  Play,
  X,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  updateRecurringStatus,
  deleteRecurringTransaction,
  processDueTransactions,
} from "../lib/recurringApi";

const emptyForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "Food",
  notes: "",
  frequency: "monthly",
  startDate: new Date().toLocaleDateString("en-CA"),
  endDate: "",
};

const categories = [
  "Food",
  "Housing",
  "Transport",
  "Shopping",
  "Health",
  "Education",
  "Entertainment",
  "Salary",
  "Freelance",
  "Subscriptions",
  "Utilities",
  "Other",
];

const frequencies = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function RecurringPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // Load schedules
  const fetchSchedules = async () => {
    try {
      setError("");

      const data = await getRecurringTransactions();

      setSchedules(data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load recurring transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  // Process due schedules once when the page opens.
  // The backend generates the corresponding transactions.
  useEffect(() => {
    const initializePage = async () => {
      try {
        setProcessing(true);

        await processDueTransactions();
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to process due transactions."
        );
      } finally {
        setProcessing(false);
        await fetchSchedules();
      }
    };

    initializePage();
  }, []);

  // Calculate summary values
  const activeSchedules = schedules.filter(
    (schedule) => schedule.isActive
  );

  const pausedSchedules = schedules.filter(
    (schedule) => !schedule.isActive
  );

  const monthlyExpenses = activeSchedules
    .filter((schedule) => schedule.type === "expense")
    .reduce((total, schedule) => {
      if (schedule.frequency === "monthly") {
        return total + schedule.amount;
      }

      if (schedule.frequency === "weekly") {
        return total + schedule.amount * (52 / 12);
      }

      if (schedule.frequency === "daily") {
        return total + schedule.amount * (365 / 12);
      }

      if (schedule.frequency === "yearly") {
        return total + schedule.amount / 12;
      }

      return total;
    }, 0);

  const monthlyIncome = activeSchedules
    .filter((schedule) => schedule.type === "income")
    .reduce((total, schedule) => {
      if (schedule.frequency === "monthly") {
        return total + schedule.amount;
      }

      if (schedule.frequency === "weekly") {
        return total + schedule.amount * (52 / 12);
      }

      if (schedule.frequency === "daily") {
        return total + schedule.amount * (365 / 12);
      }

      if (schedule.frequency === "yearly") {
        return total + schedule.amount / 12;
      }

      return total;
    }, 0);

  // Open creation form
  const openCreateForm = () => {
    setEditingSchedule(null);
    setForm({
      ...emptyForm,
      startDate: new Date().toLocaleDateString("en-CA"),
    });
    setShowForm(true);
    setError("");
  };

  // Open editing form
  const openEditForm = (schedule) => {
    setEditingSchedule(schedule);

    setForm({
      title: schedule.title,
      amount: schedule.amount,
      type: schedule.type,
      category: schedule.category,
      notes: schedule.notes || "",
      frequency: schedule.frequency,
      startDate: new Date(schedule.startDate)
        .toISOString()
        .slice(0, 10),
      endDate: schedule.endDate
        ? new Date(schedule.endDate).toISOString().slice(0, 10)
        : "",
    });

    setShowForm(true);
    setError("");
  };

  // Close form
  const closeForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setForm(emptyForm);
  };

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update schedule
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !form.amount ||
      Number(form.amount) <= 0 ||
      !form.startDate
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setError("End date cannot be before the start date.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const scheduleData = {
        ...form,
        title: form.title.trim(),
        amount: Number(form.amount),
        endDate: form.endDate || null,
      };

      if (editingSchedule) {
        await updateRecurringTransaction(
          editingSchedule._id,
          scheduleData
        );

        setSuccess("Recurring transaction updated successfully.");
      } else {
        await createRecurringTransaction(scheduleData);

        setSuccess("Recurring transaction created successfully.");
      }

      closeForm();
      await fetchSchedules();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save recurring transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  // Pause or resume schedule
  const handleStatusChange = async (schedule) => {
    try {
      setError("");
      setSuccess("");

      await updateRecurringStatus(
        schedule._id,
        !schedule.isActive
      );

      setSuccess(
        schedule.isActive
          ? "Recurring transaction paused."
          : "Recurring transaction resumed."
      );

      await fetchSchedules();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update recurring transaction."
      );
    }
  };

  // Delete schedule
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this recurring transaction? Previously generated transactions will remain in your transaction history."
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteRecurringTransaction(id);

      setSuccess("Recurring transaction deleted.");
      await fetchSchedules();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete recurring transaction."
      );
    }
  };

  // Manually process due transactions
  const handleProcessDue = async () => {
    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const result = await processDueTransactions();

      setSuccess(
        `${result.generatedCount || 0} transaction(s) generated successfully.`
      );

      await fetchSchedules();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process due transactions."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-indigo-400">
            AUTOMATED FINANCES
          </p>

          <h1 className="text-3xl font-bold text-white">
            Recurring Transactions
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Keep track of payments and income that repeat regularly.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleProcessDue}
            disabled={processing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={processing ? "animate-spin" : ""}
            />
            Process Due
          </button>

          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus size={18} />
            Add Schedule
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert
          message={error}
          type="error"
          onClose={() => setError("")}
        />
      )}

      {success && (
        <Alert
          message={success}
          type="success"
          onClose={() => setSuccess("")}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active Schedules"
          value={activeSchedules.length}
          icon={Repeat}
          color="text-indigo-400"
        />

        <SummaryCard
          title="Monthly Expenses"
          value={currency(monthlyExpenses)}
          icon={TrendingDown}
          color="text-rose-400"
        />

        <SummaryCard
          title="Monthly Income"
          value={currency(monthlyIncome)}
          icon={TrendingUp}
          color="text-emerald-400"
        />

        <SummaryCard
          title="Paused Schedules"
          value={pausedSchedules.length}
          icon={Pause}
          color="text-amber-400"
        />
      </div>

      {/* Information */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-start gap-3">
          <Clock
            size={21}
            className="mt-0.5 shrink-0 text-indigo-400"
          />

          <div>
            <h3 className="font-semibold text-white">
              How recurring transactions work
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              Finora checks active schedules when this page opens and when
              you select Process Due. Transactions are generated for
              occurrences that have reached their due dates.
            </p>
          </div>
        </div>
      </div>

      {/* Schedule list */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Your Schedules
          </h2>

          <span className="text-sm text-slate-400">
            {schedules.length} total
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-10 text-center text-slate-400">
            Loading recurring transactions...
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-[#111B2E] px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
              <Repeat size={30} className="text-indigo-400" />
            </div>

            <h3 className="text-lg font-semibold text-white">
              No recurring transactions
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
              Create a recurring schedule to keep track of your regular
              payments and income.
            </p>

            <button
              onClick={openCreateForm}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule._id}
                schedule={schedule}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <Modal onClose={closeForm}>
          <h2 className="text-xl font-bold text-white">
            {editingSchedule
              ? "Edit Recurring Transaction"
              : "Create Recurring Transaction"}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Configure the details and frequency of your schedule.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <FormField label="Transaction Title">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Monthly Rent"
                maxLength={100}
                required
                className="form-input"
              />
            </FormField>

            <FormField label="Amount (₹)">
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                className="form-input"
              />
            </FormField>

            <FormField label="Transaction Type">
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="form-input"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </FormField>

            <FormField label="Category">
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-input"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Frequency">
              <select
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
                className="form-input"
              >
                {frequencies.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency.charAt(0).toUpperCase() +
                      frequency.slice(1)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Start Date">
              <input
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                required
                className="form-input"
              />
            </FormField>

            <FormField label="End Date (Optional)">
              <input
                name="endDate"
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={handleChange}
                className="form-input"
              />
            </FormField>

            <FormField label="Notes (Optional)">
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional information..."
                rows={2}
                className="form-input resize-none"
              />
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
                  : editingSchedule
                  ? "Update Schedule"
                  : "Create Schedule"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Individual recurring schedule card
function ScheduleCard({
  schedule,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const isIncome = schedule.type === "income";

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-6 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isIncome
                ? "bg-emerald-500/10"
                : "bg-rose-500/10"
            }`}
          >
            {isIncome ? (
              <TrendingUp
                size={22}
                className="text-emerald-400"
              />
            ) : (
              <TrendingDown
                size={22}
                className="text-rose-400"
              />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">
              {schedule.title}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              {schedule.category}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            schedule.isActive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {schedule.isActive ? "Active" : "Paused"}
        </span>
      </div>

      <div className="mt-6">
        <p className="text-xs text-slate-400">
          {isIncome ? "Recurring Income" : "Recurring Expense"}
        </p>

        <p
          className={`mt-1 text-2xl font-bold ${
            isIncome ? "text-emerald-400" : "text-white"
          }`}
        >
          {isIncome ? "+" : "-"}
          {currency(schedule.amount)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
        <div>
          <p className="text-xs text-slate-500">
            Frequency
          </p>

          <p className="mt-1 text-sm font-medium capitalize text-slate-300">
            {schedule.frequency}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Next Due Date
          </p>

          <p className="mt-1 text-sm font-medium text-slate-300">
            {formatDate(schedule.nextDueDate)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Start Date
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {formatDate(schedule.startDate)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            End Date
          </p>

          <p className="mt-1 text-sm text-slate-300">
            {schedule.endDate
              ? formatDate(schedule.endDate)
              : "No end date"}
          </p>
        </div>
      </div>

      {schedule.notes && (
        <p className="mt-4 text-sm text-slate-400">
          {schedule.notes}
        </p>
      )}

      {schedule.lastGeneratedDate && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle size={14} />
          Last generated: {formatDate(schedule.lastGeneratedDate)}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
        <button
          onClick={() => onEdit(schedule)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          <Pencil size={14} />
          Edit
        </button>

        <button
          onClick={() => onStatusChange(schedule)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
            schedule.isActive
              ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          }`}
        >
          {schedule.isActive ? (
            <Pause size={14} />
          ) : (
            <Play size={14} />
          )}

          {schedule.isActive ? "Pause" : "Resume"}
        </button>

        <button
          onClick={() => onDelete(schedule._id)}
          className="rounded-lg bg-rose-500/10 px-3 py-2 text-rose-400 hover:bg-rose-500/20"
          title="Delete schedule"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// Summary card
function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {title}
        </p>

        <Icon size={21} className={color} />
      </div>

      <p className="mt-4 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

// Form field
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

// Modal
function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-[#111B2E] p-6">
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

// Alert
function Alert({ message, type, onClose }) {
  const isError = type === "error";

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      <span>{message}</span>

      <button onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
}

export default RecurringPage;
