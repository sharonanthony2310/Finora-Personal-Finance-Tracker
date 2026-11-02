# Finora – Personal Finance Tracker

## 1. Introduction

Finora is a full-stack personal finance management web application designed to help users manage their income, expenses, budgets, savings goals, and recurring transactions in one place.

Managing personal finances can become difficult when financial records are maintained manually or across different platforms. Finora aims to simplify this process by providing a centralized platform where users can record transactions, monitor spending patterns, set monthly budgets, and track their financial goals.

The application provides an interactive dashboard with financial summaries, charts, and notifications to help users understand their financial activities and make informed financial decisions.

### Project Objectives

- Simplify personal income and expense tracking.
- Provide a centralized platform for financial management.
- Help users monitor monthly budgets and spending.
- Encourage consistent savings through financial goals.
- Manage recurring financial transactions.
- Present financial information through visual charts and summaries.

## 2. Technology Stack and Reasons for Selection

Finora uses a modern full-stack JavaScript architecture. The frontend communicates with a backend REST API, which interacts with MongoDB to store and retrieve user data.

| Technology | Purpose | Reason for Selection |
|---|---|---|
| React.js | Frontend development | Supports reusable components and dynamic interfaces. |
| Vite | Development and build tool | Provides fast development and optimized builds. |
| Tailwind CSS | UI styling | Makes responsive and consistent styling easier. |
| Node.js | Backend runtime | Allows JavaScript to be used on the server side. |
| Express.js | Backend framework | Simplifies REST API development and routing. |
| MongoDB Atlas | Database | Provides flexible cloud-based document storage. |
| Mongoose | Database modelling | Supports schemas, validation, and database operations. |
| JWT | Authentication | Provides token-based authentication. |
| bcryptjs | Password security | Hashes passwords before database storage. |
| Axios | API communication | Connects the frontend with backend endpoints. |
| Recharts | Data visualization | Displays financial information through charts. |
| Lucide React | Icons | Provides consistent interface icons. |
| Vercel | Frontend deployment | Hosts the frontend application. |
| Render | Backend deployment | Hosts the backend API. |

### Application Architecture

Finora follows a client-server architecture.

1. The user interacts with the React frontend.
2. Axios sends HTTP requests to the Express backend.
3. Express processes requests and applies authentication and validation.
4. Mongoose communicates with MongoDB Atlas.
5. The backend returns responses to the frontend.
6. React updates the interface with the retrieved information.

## 3. Use Cases

### 3.1 User Registration and Login

- Users can create an account using their name, email, and password.
- Passwords are hashed using bcryptjs.
- JWT tokens are used to authenticate requests.
- Users can access their accounts and manage their financial information.

### 3.2 Dashboard and Financial Overview

- View total income and expenses.
- Monitor available balance.
- View financial summaries.
- Understand spending patterns through charts.

### 3.3 Transaction Management

- Add income and expense transactions.
- Specify transaction title, amount, category, date, and notes.
- Edit existing transactions.
- Delete transactions.
- View transaction history.

### 3.4 Budget Management

- Create monthly budgets for different categories.
- Monitor spending against allocated budgets.
- View remaining budget amounts.
- Receive notifications when spending reaches defined thresholds.

### 3.5 Savings Goals

- Create financial goals.
- Set target amounts and target dates.
- Record contributions toward goals.
- Monitor savings progress.
- Update or delete goals.

### 3.6 Recurring Transactions

- Create recurring income or expense entries.
- Select frequencies such as daily, weekly, monthly, or yearly.
- Manage active and inactive recurring transactions.
- Process transactions that are due.

### 3.7 Notifications

- Receive spending-related notifications.
- View unread notifications.
- Mark individual notifications as read.
- Mark all notifications as read.
- Delete notifications.

## 4. Research and Problem Analysis

### 4.1 Problem Identification

Managing personal finances requires regular monitoring of income, expenses, budgets, and savings.

When these activities are tracked manually or across separate platforms, users may face difficulties such as:

- Difficulty keeping track of daily expenses.
- Lack of visibility into monthly spending patterns.
- Overspending in certain categories.
- Inconsistent savings habits.
- Forgetting recurring financial commitments.
- Difficulty understanding overall financial progress.

### 4.2 Proposed Solution

Finora addresses these challenges by combining multiple financial management features into a single web application.

Users can manage transactions, budgets, savings goals, and recurring entries through one centralized dashboard.

### 4.3 Research Approach

The project was designed around the following areas:

1. **Personal Expense Tracking:** Identifying the information required to record and categorize financial transactions.
2. **Budget Monitoring:** Understanding how users can compare actual expenses with planned spending limits.
3. **Savings Management:** Identifying ways to represent financial goals and track contributions.
4. **Data Visualization:** Exploring how charts and summaries make financial information easier to understand.
5. **Application Security:** Applying password hashing and token-based authentication to protect user accounts and their data.

### 4.4 Expected Benefits

- Better organization of financial records.
- Improved awareness of spending habits.
- Easier budget monitoring.
- More structured savings tracking.
- Convenient access to financial information.

## 5. Working of the Project

### 5.1 User Registration and Authentication

New users can register by entering their name, email address, and password.

The backend validates the registration details and hashes the password using bcryptjs before storing the user information in MongoDB.

During login, the backend verifies the credentials and generates a JWT token. This token is used to authenticate protected API requests.

### 5.2 Dashboard

After logging in, users are presented with the main dashboard.

The dashboard provides an overview of their financial activities, including income, expenses, available balance, and visual summaries.

This allows users to understand their financial position in one place.

### 5.3 Transaction Management

Users can add income and expense records by entering the transaction title, amount, type, category, date, and optional notes.

The backend validates and stores the transaction in MongoDB.

Users can also edit or delete transactions. The dashboard and transaction history reflect the updated records.

### 5.4 Budget Management

Users can create monthly budgets for different spending categories.

Finora compares recorded expenses against the allocated budget and calculates the remaining amount.

The application also generates spending notifications when expenses reach configured thresholds.

### 5.5 Savings Goals

Users can create savings goals by specifying a goal name, target amount, and target date.

They can contribute money toward their goals and monitor their savings progress through the application.

### 5.6 Recurring Transactions

Users can create recurring income or expense entries by specifying the amount, category, frequency, and dates.

The application provides functionality to process due recurring transactions and manage their active status.

### 5.7 Notifications

The notification section displays financial alerts generated by the application.

For example, users can receive notifications when their spending reaches 80% or 100% of a category's allocated budget.

Users can mark notifications as read, mark all as read, or delete notifications.

### 5.8 Deployment

Finora is deployed using separate frontend and backend hosting services.

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

The deployed frontend communicates with the backend API to retrieve and update financial information.

## 6. Conclusion

Finora demonstrates the development of a full-stack personal finance management application using modern web technologies.

The project brings together essential financial management features, including transaction tracking, budget monitoring, savings goals, recurring transactions, and notifications.

Through the integration of React, Node.js, Express, and MongoDB, the application provides a structured way to store, process, and display financial information.

Developing Finora provided practical experience in frontend development, backend API integration, database management, authentication, data visualization, and application deployment.

Overall, the project demonstrates how full-stack web technologies can be used to develop a practical application that addresses everyday financial management challenges.

## 7. Future Scope

The application can be enhanced further through:

- Email verification during registration.
- Password reset through email.
- Exporting financial reports in PDF or CSV format.
- Advanced financial analytics.
- Bank account integration.
- Additional financial insights and recommendations.
- Mobile application support.

## 8. Project Links

- **Live Application:** https://finora-personal-finance-tracker-three.vercel.app/
- **GitHub Repository:** https://github.com/sharonanthony2310/Finora-Personal-Finance-Tracker

---

**Project Name:** Finora – Personal Finance Tracker  
**Project Type:** Full-Stack Web Application  
**Domain:** Finance and Web Development