import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import api from "../lib/api";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const COLORS = [
  "#818cf8",
  "#34d399",
  "#fb7185",
  "#fbbf24",
  "#38bdf8",
  "#c084fc",
  "#fb923c",
];

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/transactions");
        setTransactions(response.data.transactions || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load financial reports."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const totalIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const savings = totalIncome - totalExpenses;

  const categoryTotals = {};

  currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      categoryTotals[transaction.category] =
        (categoryTotals[transaction.category] || 0) +
        Number(transaction.amount);
    });

  const categoryData = Object.entries(categoryTotals).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentYear, currentMonth - (5 - index), 1);

    const monthTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);

      return (
        transactionDate.getMonth() === date.getMonth() &&
        transactionDate.getFullYear() === date.getFullYear()
      );
    });

    return {
      month: date.toLocaleString("en-IN", { month: "short" }),
      income: monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      expenses: monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    };
  });

  const highestCategory = [...categoryData].sort(
    (a, b) => b.value - a.value
  )[0];

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 text-slate-400">
        <LoaderCircle className="animate-spin" size={20} />
        Loading reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
        <AlertCircle size={18} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Financial reports
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Understand your income, expenses and spending patterns.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Monthly income"
          amount={totalIncome}
          icon={TrendingUp}
          color="text-emerald-400"
        />

        <SummaryCard
          title="Monthly expenses"
          amount={totalExpenses}
          icon={TrendingDown}
          color="text-rose-400"
        />

        <SummaryCard
          title="Monthly savings"
          amount={savings}
          icon={PiggyBank}
          color={savings >= 0 ? "text-indigo-400" : "text-rose-400"}
        />

        <SummaryCard
          title="Transactions"
          amount={currentMonthTransactions.length}
          icon={Wallet}
          color="text-sky-400"
          isCount
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5">
          <h3 className="font-bold text-white">
            Income vs. expenses
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Your financial activity over the last six months.
          </p>

          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid
                  stroke="#263449"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  formatter={(value) => formatMoney(value)}
                  contentStyle={{
                    backgroundColor: "#0B1120",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#34d399"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#fb7185"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5">
          <h3 className="font-bold text-white">
            Spending by category
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Where your money goes this month.
          </p>

          {categoryData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-slate-500">
              No expense data available for this month.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(value)}
                    contentStyle={{
                      backgroundColor: "#0B1120",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5 sm:p-6">
        <h3 className="font-bold text-white">
          Spending insights
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          A quick overview of your spending habits this month.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#0B1120] p-4">
            <p className="text-sm text-slate-400">
              Highest spending category
            </p>
            <p className="mt-2 text-xl font-bold text-white">
              {highestCategory?.name || "No data yet"}
            </p>
            {highestCategory && (
              <p className="mt-1 text-sm text-rose-400">
                {formatMoney(highestCategory.value)}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-[#0B1120] p-4">
            <p className="text-sm text-slate-400">
              Savings rate
            </p>
            <p className="mt-2 text-xl font-bold text-white">
              {totalIncome > 0
                ? `${((savings / totalIncome) * 100).toFixed(1)}%`
                : "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Based on this month's income and expenses.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ title, amount, icon: Icon, color, isCount }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111B2E] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={20} className={color} />
      </div>

      <p className={`mt-4 text-2xl font-bold ${color}`}>
        {isCount ? amount : formatMoney(amount)}
      </p>
    </div>
  );
}