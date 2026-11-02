
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

const checkSpendingAlerts = async (
  userId,
  referenceDate = new Date()
) => {
  const month = referenceDate.getMonth() + 1;
  const year = referenceDate.getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  // Fetch the user's budgets for this month
  const budgets = await Budget.find({
    user: userId,
    month,
    year,
  });

  // Fetch the user's expenses for this month
  const transactions = await Transaction.find({
    user: userId,
    type: "expense",
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  });

  let alertsCreated = 0;

  for (const budget of budgets) {
    const spent = transactions
      .filter(
        (transaction) =>
          transaction.category === budget.category
      )
      .reduce(
        (total, transaction) => total + transaction.amount,
        0
      );

    const percentage = (spent / budget.amount) * 100;

    const thresholds = [
      {
        limit: 80,
        type: "warning",
        title: "Budget Warning",
      },
      {
        limit: 100,
        type: "danger",
        title: "Budget Limit Reached",
      },
    ];

    for (const threshold of thresholds) {
      const dedupeKey = `budget-${year}-${month}-${budget.category}-${threshold.limit}`;

      if (percentage >= threshold.limit) {
        const message =
          threshold.limit === 80
            ? `You have used ${Math.round(
                percentage
              )}% of your ${budget.category} budget. You have spent ₹${spent.toFixed(
                2
              )} out of ₹${budget.amount.toFixed(2)}.`
            : `You have reached or exceeded your ${budget.category} budget. You have spent ₹${spent.toFixed(
                2
              )} against a budget of ₹${budget.amount.toFixed(2)}.`;

        const result = await Notification.updateOne(
          {
            user: userId,
            dedupeKey,
          },
          {
            $set: {
              title: threshold.title,
              message,
              type: threshold.type,
            },
            $setOnInsert: {
              user: userId,
              dedupeKey,
              isRead: false,
            },
          },
          {
            upsert: true,
          }
        );

        if (result.upsertedCount > 0) {
          alertsCreated++;
        }
      } else {
        // Remove an outdated alert when spending falls below its threshold
        await Notification.deleteOne({
          user: userId,
          dedupeKey,
        });
      }
    }
  }

  return alertsCreated;
};

export default checkSpendingAlerts;
