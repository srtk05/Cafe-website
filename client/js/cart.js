let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItemsDiv = document.getElementById("cart-items");
const totalPriceDiv = document.getElementById("total-price");

function renderCart() {
  cartItemsDiv.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.qty;

    cartItemsDiv.innerHTML += `
      <div class="cart-item">
        <span>${item.item} (x${item.qty})</span>
        <span>₹${item.price * item.qty}</span>
      </div>
    `;
  });

  totalPriceDiv.innerText = "Total: ₹" + total;
}

renderCart();

const orderForm = document.getElementById("order-form");

orderForm.addEventListener("submit", function (e) {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const orderData = {
    customerName: document.getElementById("customerName").value,
    mobileNumber: document.getElementById("mobileNumber").value,
    orderType: document.getElementById("orderType").value,
    cart: cart,
    totalAmount: cart.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    ),
    orderTime: new Date().toISOString()
  };

 fetch("/api/place-order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(orderData)
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    alert("Order placed successfully!");
    localStorage.removeItem("cart");
    window.location.href = "menu.html";
  }
})
.catch(err => {
  console.error(err);
  alert("Server error. Try again.");
});

});
