# CarbonLens — Carbon Footprint Management System 🌿

A professional, full-stack, and database-driven **Carbon Footprint Management System** developed as an engineering DBMS mini-project. CarbonLens leverages an optimized SQL relational database schema to deliver secure authentication, real-time activity logging, dynamic CO₂ calculations, historical analytics, and recommendation intelligence with **zero hardcoded values**.

---

## 🚀 Key Features

*   **🔒 Secure Dual-Authentication**:
    *   **User Module**: Secure registration (Name, Age, Email, Password, Location) and login with session state management. Uses `bcrypt` for one-way password hashing.
    *   **Admin Module**: Separate admin access to monitor registered users, check real-time SQL execution logs, and manage recommendation libraries.
*   **📊 Dynamic Empty-State Dashboard**: Starts completely empty for new users. As activities are entered, they are calculated and served directly from the database to build interactive line, bar, and doughnut charts (via Chart.js) on-the-fly.
*   **⚡ Live Calculation Engine**: Instantly translates real activity metrics into precise CO₂ kilograms using global emissions factors:
    *   *Electricity*: $0.5$ kg CO₂ per kWh
    *   *Transport*: $0.14$ kg CO₂ per km
    *   *Waste*: $1.5$ kg CO₂ per kg
    *   *Fuel*: $2.3$ kg CO₂ per Liter
*   **💡 Dynamic Recommendation Engine**: Analyzes your total emissions profile and queries recommended lifestyle adjustments dynamically.
*   **🗄️ Normalized Relational Database**: Comprises a 3NF relational SQLite schema consisting of 4 normalized tables enforcing referential integrity.

---

## 🗄️ Database Architecture (SQL)

The backend is driven by a highly organized, relational database schema with full referential integrity (`ON DELETE CASCADE`):

1.  **`USERS`**: Manages all user details, registration demographics, secure hashed passwords, and system roles (`user`, `admin`).
2.  **`CARBON_ACTIVITY`**: Stores the raw logged activity logs (type, distance, electricity consumption, fuel, waste, date).
3.  **`CARBON_EMISSION`**: Connects directly to activities to store computed CO₂ weights mapped using Foreign Keys.
4.  **`RECOMMENDATION_TEMPLATES`**: Admin-managed list of eco-tips dynamically fetched according to the user's total carbon impact levels (Low, Medium, High).

For the full setup instructions and schema queries, check out:
👉 **[`carbon_footprint.sql`](./carbon_footprint.sql)**

---

## 🛠️ Technology Stack

*   **Frontend**: HTML5 (Semantic Structure), CSS3 (Modern premium eco-friendly styling, custom animations, dark-mode toggle), Vanilla JavaScript (API calls, DOM manipulation, asynchronous state management).
*   **Charts**: Chart.js (Interactive data visualization).
*   **Backend**: Node.js + Express (Robust REST API, session persistence, secure routes).
*   **Database**: SQLite3 (ACID compliant SQL Relational Database).
*   **Security**: Bcrypt (Secure password hashing), Express-Session (Cookie-based session validation).

---

## 📦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Installation
Clone the repository and install all required Node.js packages:
```bash
npm install
```

### 2. Set Up Admin Credentials
Run the initial script to securely configure your administrator profile:
```bash
node init_admin.js
```
*   **Default Admin Email**: `admin@carbonlens.com`
*   **Default Admin Password**: `admin`

### 3. Launch the Server
Start the Express server on your localhost:
```bash
node server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to run the platform!

---

## 🔑 Demo Walkthrough
1.  **Register a User**: Create a completely fresh account.
2.  **Verify Clean Dashboard**: Note that the charts, meters, and progress bars start at `0` without any demo placeholders.
3.  **Log Activities**: Navigate to **Add Activity**, adjust slider metrics (e.g. Electricity kWh, waste kg, car distance) and submit.
4.  **Instant Dashboard Calculations**: View your live charts populate dynamically based strictly on SQL aggregations!
5.  **Admin Check**: Login to **Admin Panel** to monitor your newly registered user and active transactional activity history.
