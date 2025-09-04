const express = require("express");
require("dotenv").config();
const dbConnection = require("./config/db");

dbConnection();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ERP API is running 🚀");
});

app.use("/api/users",require("./routes/authRoutes"));
app.use("/api/leads",require("./routes/leadRoutes"));
app.use("/api/employees",require("./routes/employeeRoutes"));

app.use("/api/product", require("./routes/productRoutes"));
app.use("/api/branch", require("./routes/branchRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/invoice", require("./routes/invoiceRoutes"));
app.use("/api/audit", require("./routes/auditlogRoutes"));

module.exports = app;
