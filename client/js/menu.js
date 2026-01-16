let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(item, price) {
  const existingItem = cart.find(i => i.item === item);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ item, price, qty: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(item + " added to cart");
}
