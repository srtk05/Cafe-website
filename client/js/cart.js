let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItemsDiv = document.getElementById("cart-items");
const totalPriceDiv = document.getElementById("total-price");
const orderForm = document.getElementById("order-form");
const tableNumberInput = document.getElementById("tableNumber");
const orderTypeSelect = document.getElementById("orderType");
const submitBtn = document.getElementById("submit-btn");

const orderModeButtons = document.querySelectorAll(".mode-btn");
const freshOnlyEls = document.querySelectorAll(".fresh-only");
const appendOnlyEls = document.querySelectorAll(".append-only");


/* ================= RENDER CART ================= */
function renderCart() {
  cartItemsDiv.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = "<p>Your cart is empty</p>";
    totalPriceDiv.innerText = "Total: ₹0";
    return;
  }

  cart.forEach((item, index) => {
    total += item.price * item.qty;

    cartItemsDiv.innerHTML += `
      <div class="cart-card" style="animation-delay:${index * 0.05}s">
        <div class="cart-row">

          <div class="item-info">
            <strong>${item.item}</strong>
          </div>

          <div class="qty-controls">
            <button onclick="changeQty(${index}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${index}, 1)">+</button>
          </div>

          <div class="item-total">
            ₹${item.price * item.qty}
          </div>

          <button class="delete-btn" onclick="removeItem(${index})">✕</button>

        </div>
      </div>
    `;
  });

  totalPriceDiv.innerText = "Total: ₹" + total;
}

renderCart();

/* ================= ORDER MODE ================= */
function getOrderMode() {
  const selected = document.querySelector(".mode-btn.active");
  return selected ? selected.dataset.mode : "fresh";
}

function updateTableNumberVisibility() {
  if (!tableNumberInput) return;

  const mode = getOrderMode();
  if (mode === "append") {
    tableNumberInput.style.display = "";
    tableNumberInput.required = true;
    return;
  }

  const isDineIn = orderTypeSelect && orderTypeSelect.value === "Dine In";
  tableNumberInput.style.display = "";
  tableNumberInput.required = isDineIn;
  if (!isDineIn) {
    tableNumberInput.value = "";
  }
}

function setOrderModeUI() {
  const mode = getOrderMode();
  const isAppend = mode === "append";

  freshOnlyEls.forEach(el => {
    el.style.display = isAppend ? "none" : "";
  });
  appendOnlyEls.forEach(el => {
    el.style.display = isAppend ? "block" : "none";
  });

  if (submitBtn) {
    submitBtn.innerText = isAppend ? "Add To Order" : "Place Order";
  }

  const nameInput = document.getElementById("customerName");
  if (nameInput) nameInput.required = !isAppend;
  if (orderTypeSelect) orderTypeSelect.required = !isAppend;

  updateTableNumberVisibility();
}

orderModeButtons.forEach(button => {
  button.addEventListener("click", () => {
    orderModeButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    setOrderModeUI();
  });
});

if (orderTypeSelect) {
  orderTypeSelect.addEventListener("change", updateTableNumberVisibility);
}

setOrderModeUI();

/* ================= QUANTITY CONTROLS ================= */
function changeQty(index, change) {
  cart[index].qty += change;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

/* ================= PLACE ORDER ================= */
orderForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const mode = getOrderMode();
  const tableNumber = tableNumberInput ? tableNumberInput.value.trim() : "";

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  if (mode === "append") {
    if (!tableNumber || Number(tableNumber) < 1 || Number(tableNumber) > 9) {
      alert("Please enter a table number between 1 and 9");
      return;
    }
    try {
      const res = await fetch("/api/orders/append", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tableNumber, cart })
      });

      const data = await res.json();

      if (data.success) {
        alert("Items added to your order!");
        localStorage.removeItem("cart");
        cart = [];
        renderCart();
        window.location.href = "menu.html";
      } else {
        alert(data.message || "Failed to add items");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
    return;
  }

  const customerName = document.getElementById("customerName").value.trim();
  const mobileNumber = document.getElementById("mobileNumber").value.trim();
  const orderType = document.getElementById("orderType").value;

  if (!customerName || !orderType) {
    alert("Please fill all required fields");
    return;
  }
  if (orderType === "Dine In") {
    if (!tableNumber || Number(tableNumber) < 1 || Number(tableNumber) > 9) {
      alert("Please enter a table number between 1 and 9");
      return;
    }
  }

  const orderData = {
    customerName,
    mobileNumber,
    orderType,
    cart,
    totalAmount
  };
  if (orderType === "Dine In") {
    orderData.tableNumber = tableNumber;
  }

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();

    if (data.success) {
      alert("Order placed successfully!");

      localStorage.removeItem("cart");
      cart = [];
      renderCart();  // ✅ immediately empty UI

      window.location.href = "menu.html";
    } else {
      alert(data.message || "Order failed");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});
