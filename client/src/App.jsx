
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Repeat,
  Bell,
} from "lucide-react";

import { useAuth } from "./context/AuthContext";
import api from "./lib/api";
import { getNotifications } from "./lib/notificationApi";

import Login from "./pages/Login";
import Register from "./pages/Register";

import BudgetPage from "./components/BudgetPage";
import Reports from "./components/Reports";
import SettingsPage from "./components/SettingsPage";
import GoalsPage from "./components/GoalsPage";
import RecurringPage from "./components/RecurringPage";
import NotificationsPage from "./components/NotificationsPage";
import NotificationBell from "./components/NotificationBell";

const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Transactions", icon: ArrowLeftRight },
  { name: "Recurring", icon: Repeat },
  { name: "Budgets", icon: Wallet },
  { name: "Savings Goals", icon: Target },
  { name: "Notifications", icon: Bell },
  { name: "Reports", icon: ChartNoAxesCombined },
  { name: "Settings", icon: Settings },
];

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

// Protect pages requiring authentication
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120] text-white">
        Loading Finora...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Redirect authenticated users away from login/register
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120] text-white">
        Loading Finora...
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Main dashboard
function Dashboard() {
  const { user, logout } = useAuth();

  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [unreadCount, setUnreadCount] = useState(0);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setError("");

      const response = await api.get("/transactions");

      setTransactions(response.data.transactions || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const data = await getNotifications();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Unable to fetch notification count.");
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchTransactions();
    fetchUnreadCount();
  }, []);

  // Refresh unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Listen for requests to open Notifications page
  useEffect(() => {
    const handleOpenNotifications = () => {
      setActivePage("Notifications");
      setSidebarOpen(false);
    };

    window.addEventListener(
      "finora:open-notifications",
      handleOpenNotifications
    );

    return () => {
      window.removeEventListener(
        "finora:open-notifications",
        handleOpenNotifications
      );
    };
  }, []);

  // Calculate totals
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

  const balance = totalIncome - totalExpenses;

  // Search transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const search = searchTerm.toLowerCase();

    return (
      transaction.title.toLowerCase().includes(search) ||
      transaction.category.toLowerCase().includes(search)
    );
  });

  // Reset form
  const resetForm = () => {
    setForm({
      title: "",
      amount: "",
      type: "expense",
      category: "Food",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // Handle input changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update transaction
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");

      const transactionData = {
        ...form,
        amount: Number(form.amount),
      };

      if (editingId) {
        await api.put(
          `/transactions/${editingId}`,
          transactionData
        );
      } else {
        await api.post("/transactions", transactionData);
      }

      resetForm();

      await fetchTransactions();
      await fetchUnreadCount();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save transaction."
      );
    }
  };

  // Edit transaction
  const handleEdit = (transaction) => {
    setEditingId(transaction._id);

    setForm({
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: new Date(transaction.date).toISOString().slice(0, 10),
      notes: transaction.notes || "",
    });

    setShowForm(true);
  };

  // Delete transaction
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/transactions/${id}`);

      await fetchTransactions();
      await fetchUnreadCount();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete transaction."
      );
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = [
      "Title",
      "Amount",
      "Type",
      "Category",
      "Date",
      "Notes",
    ];

    const rows = transactions.map((transaction) => [
      transaction.title,
      transaction.amount,
      transaction.type,
      transaction.category,
      new Date(transaction.date).toLocaleDateString("en-IN"),
      transaction.notes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "finora-transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  // Change page
  const changePage = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setError("");

    if (page === "Notifications") {
      fetchUnreadCount();
    }
  };

  // Render selected page
  const renderContent = () => {
    if (activePage === "Budgets") {
      return <BudgetPage />;
    }

    if (activePage === "Savings Goals") {
      return <GoalsPage />;
    }

    if (activePage === "Recurring") {
      return <RecurringPage />;
    }

    if (activePage === "Notifications") {
      return <NotificationsPage />;
    }

    if (activePage === "Reports") {
      return <Reports />;
    }

    if (activePage === "Settings") {
      return <SettingsPage />;
    }

    if (activePage === "Transactions") {
      return (
        <TransactionsPage
          transactions={filteredTransactions}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAdd={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={exportCSV}
        />
      );
    }

    return (
      <DashboardPage
        user={user}
        transactions={transactions}
        loading={loading}
        error={error}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        balance={balance}
        onNavigate={changePage}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#0F172A] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <IndianRupee size={22} />
            </div>

            <span className="text-xl font-bold tracking-wide">
              Finora
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => changePage(item.name)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={19} />
                    {item.name}
                  </span>

                  {item.name === "Notifications" &&
                    unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile */}
        <div className="border-t border-slate-800 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-800/60 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 font-semibold text-indigo-300">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "User"}
              </p>

              <p className="truncate text-xs text-slate-400">
                {user?.email || ""}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800 bg-[#0B1120]/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-400 hover:text-white lg:hidden"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-lg font-semibold text-white">
              {activePage}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell
              onCountChange={setUnreadCount}
            />

            <div className="hidden text-sm text-slate-400 sm:block">
              Welcome back,{" "}
              <span className="font-medium text-white">
                {user?.name || "User"}
              </span>
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          {showForm && activePage === "Transactions" && (
            <TransactionModal
              form={form}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              onClose={resetForm}
              editing={Boolean(editingId)}
            />
          )}

          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// Dashboard overview
function DashboardPage({
  user,
  transactions,
  loading,
  error,
  totalIncome,
  totalExpenses,
  balance,
  onNavigate,
}) {
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium text-indigo-400">
          FINANCIAL OVERVIEW
        </p>

        <h1 className="text-3xl font-bold text-white">
          Good to see you, {user?.name?.split(" ")[0] || "there"}!
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Here's an overview of your financial activity.
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard
          title="Total Balance"
          value={currency(balance)}
          icon={Wallet}
          color="text-indigo-400"
        />

        <StatCard
          title="Total Income"
          value={currency(totalIncome)}
          icon={TrendingUp}
          color="text-emerald-400"
        />

        <StatCard
          title="Total Expenses"
          value={currency(totalExpenses)}
          icon={TrendingDown}
          color="text-rose-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Recent Transactions
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Your latest financial activity
              </p>
            </div>

            <button
              onClick={() => onNavigate("Transactions")}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              View all
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Loading transactions...
            </p>
          ) : recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No transactions yet. Add your first transaction.
            </p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction._id}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-6">
          <h2 className="font-semibold text-white">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Manage your finances
          </p>

          <div className="mt-5 space-y-3">
            <QuickAction
              icon={ArrowLeftRight}
              label="Transactions"
              onClick={() => onNavigate("Transactions")}
            />

            <QuickAction
              icon={Repeat}
              label="Recurring Transactions"
              onClick={() => onNavigate("Recurring")}
            />

            <QuickAction
              icon={Wallet}
              label="Manage Budgets"
              onClick={() => onNavigate("Budgets")}
            />

            <QuickAction
              icon={Target}
              label="Savings Goals"
              onClick={() => onNavigate("Savings Goals")}
            />

            <QuickAction
              icon={Bell}
              label="Notifications"
              onClick={() => onNavigate("Notifications")}
            />

            <QuickAction
              icon={ChartNoAxesCombined}
              label="View Reports"
              onClick={() => onNavigate("Reports")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Transactions page
function TransactionsPage({
  transactions,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  onAdd,
  onEdit,
  onDelete,
  onExport,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Transactions
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage your income and expenses.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search transactions..."
          className="w-full rounded-xl border border-slate-800 bg-[#111B2E] py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-indigo-500"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111B2E]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/40 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">
                        {transaction.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {transaction.notes || "No notes"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {transaction.category}
                    </td>

                    <td className="px-6 py-4 text-slate-400">
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </td>

                    <td
                      className={`px-6 py-4 font-semibold ${
                        transaction.type === "income"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {currency(transaction.amount)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(transaction)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => onDelete(transaction._id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Transaction modal
function TransactionModal({
  form,
  onChange,
  onSubmit,
  onClose,
  editing,
}) {
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
    "Other",
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#111B2E] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {editing ? "Edit Transaction" : "Add Transaction"}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Transaction Title">
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. Monthly salary"
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
              onChange={onChange}
              placeholder="Enter amount"
              required
              className="form-input"
            />
          </FormField>

          <FormField label="Type">
            <select
              name="type"
              value={form.type}
              onChange={onChange}
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
              onChange={onChange}
              className="form-input"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Date">
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              required
              className="form-input"
            />
          </FormField>

          <FormField label="Notes (Optional)">
            <textarea
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={2}
              placeholder="Add a note..."
              className="form-input resize-none"
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 py-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {editing ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Summary card
function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={22} className={color} />
      </div>

      <p className="mt-4 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

// Quick action
function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-800 p-4 text-left text-sm text-slate-300 transition hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-white"
    >
      <Icon size={19} className="text-indigo-400" />
      {label}
    </button>
  );
}

// Recent transaction row
function TransactionRow({ transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isIncome
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-rose-500/10 text-rose-400"
          }`}
        >
          {isIncome ? (
            <TrendingUp size={19} />
          ) : (
            <TrendingDown size={19} />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {transaction.title}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {transaction.category} ·{" "}
            {new Date(transaction.date).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      <p
        className={`shrink-0 text-sm font-semibold ${
          isIncome ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {isIncome ? "+" : "-"}
        {currency(transaction.amount)}
      </p>
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

// Error message
function ErrorMessage({ message }) {
  return (
    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {message}
    </div>
  );
}

export default App;
