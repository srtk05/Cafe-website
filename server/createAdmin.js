const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

// 🔹 CONNECT TO MONGODB (No deprecated options)
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

async function createAdmin() {
  try {
    const username = "admin";              // change if needed
    const email = "admin@moryacafe.com";   // REQUIRED FIELD
    const plainPassword = "1234";          // ⚠️ Change to strong password

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword
    });

    await newAdmin.save();

    console.log("✅ Admin created successfully");
    process.exit();

  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit();
  }
}

createAdmin();
