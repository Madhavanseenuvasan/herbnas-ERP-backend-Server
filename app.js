const express = require("express");
require("dotenv").config();
const dbConnection = require("./config/db");
const cors = require('cors');
dbConnection();

const app = express();
app.use(express.json());
app.use(cors());

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
app.use("/api/audit", require("./routes/auditlogRoutes"));
app.use('/api',require('./Routes/healthIssue.routes');

module.exports = app;
