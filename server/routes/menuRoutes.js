const express = require("express");
const router = express.Router();
const Menu = require("../models/menu");

// GET MENU (User)
router.get("/", async (req, res) => {
  const menu = await Menu.find({ available: true });
  res.json(menu);
});

// ADD MENU ITEM (Admin)
router.post("/", require("../middleware/auth"), async (req, res) => {
  const { name, price, category, available = true } = req.body || {};
  if (!name || !category || typeof price !== "number") {
    return res.status(400).json({ message: "Invalid menu item" });
  }
  const item = new Menu({ name: name.trim(), price, category: category.trim().toLowerCase(), available });
  await item.save();
  res.json({ success: true });
});

// DELETE MENU ITEM (Admin)
router.delete("/:id", require("../middleware/auth"), async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
