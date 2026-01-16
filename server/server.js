const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../client")));

// Save order API
app.post("/api/place-order", (req, res) => {
  const order = req.body;
  const filePath = path.join(__dirname, "orders.json");

  let orders = [];
  if (fs.existsSync(filePath)) {
    orders = JSON.parse(fs.readFileSync(filePath));
  }

  orders.push(order);
  fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
