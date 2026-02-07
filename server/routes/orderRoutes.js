const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const auth = require("../middleware/auth");

// ✅ PLACE ORDER (Customer)
router.post("/", async (req, res) => {
  try {
    const { cart, totalAmount, customerName, mobileNumber, orderType, tableNumber } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is required" });
    }
    const sanitizedCart = cart
      .filter(i => i && i.item && Number(i.qty) > 0 && Number(i.price) >= 0)
      .map(i => ({
        item: String(i.item),
        qty: Number(i.qty),
        price: Number(i.price)
      }));
    if (sanitizedCart.length === 0) {
      return res.status(400).json({ success: false, message: "No valid items" });
    }
    const order = new Order({
      cart: sanitizedCart,
      totalAmount: Number(totalAmount) || sanitizedCart.reduce((s, i) => s + i.qty * i.price, 0),
      customerName: customerName ? String(customerName).trim() : "Customer",
      mobileNumber,
      orderType,
      tableNumber
    });
    await order.save();
    res.json({ success: true, message: "Order placed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ ADD ITEMS TO EXISTING ORDER (Customer)
router.post("/append", async (req, res) => {
  try {
    const { tableNumber, cart } = req.body;

    if (!tableNumber || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const tableNo = Number(tableNumber);
    if (!Number.isInteger(tableNo) || tableNo < 1 || tableNo > 9) {
      return res.status(400).json({ success: false, message: "Table number must be 1 to 9" });
    }

    const order = await Order.findOne({
      tableNumber: tableNo,
      status: { $in: ["pending", "accepted"] }
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ success: false, message: "No open order found for this table" });
    }

    const normalized = cart
      .filter(i => i && i.item && Number(i.qty) > 0 && Number(i.price) >= 0)
      .map(i => ({
        item: String(i.item),
        qty: Number(i.qty),
        price: Number(i.price)
      }));

    if (normalized.length === 0) {
      return res.status(400).json({ success: false, message: "No valid items" });
    }

    const merged = [...order.cart];
    normalized.forEach(incoming => {
      const existing = merged.find(m => m.item === incoming.item && m.price === incoming.price);
      if (existing) {
        existing.qty += incoming.qty;
      } else {
        merged.push(incoming);
      }
    });

    const newTotal = merged.reduce((sum, i) => sum + i.price * i.qty, 0);

    order.cart = merged;
    order.totalAmount = newTotal;
    await order.save();

    res.json({ success: true, message: "Order updated", orderId: order._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔐 GET ALL ORDERS (Admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔐 UPDATE ORDER STATUS (Admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Failed to update status" });
  }
});

module.exports = router;
