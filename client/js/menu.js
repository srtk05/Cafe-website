const menuDiv = document.getElementById("menu-items");
const categoryButtons = document.querySelectorAll(".category-btn");

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let fullMenu = [];

/* ================= FETCH MENU ================= */
fetch("/api/menu")
  .then(res => res.json())
  .then(menu => {
    if (!menu || menu.length === 0) {
      menuDiv.innerHTML = "<p>No items available</p>";
      return;
    }

    fullMenu = menu;
    const initialCategory = getInitialCategory();
    const appliedCategory = setActiveCategory(initialCategory);
    renderMenu(appliedCategory); // default or deep link
  })
  .catch(err => {
    console.error("Menu fetch error:", err);
    menuDiv.innerHTML = "<p>Failed to load menu</p>";
  });

function getInitialCategory() {
  const hash = window.location.hash.replace("#", "").trim();
  if (hash) return decodeURIComponent(hash);
  const params = new URLSearchParams(window.location.search);
  return params.get("category") || "all";
}

function setActiveCategory(category) {
  const normalized = (category || "all").trim().toLowerCase();
  let matched = false;
  categoryButtons.forEach(btn => {
    const btnCategory = (btn.getAttribute("data-category") || "").trim().toLowerCase();
    if (btnCategory === normalized) {
      btn.classList.add("active");
      matched = true;
    } else {
      btn.classList.remove("active");
    }
  });
  return matched ? normalized : "all";
}

/* ================= RENDER MENU ================= */
function renderMenu(category) {
  menuDiv.innerHTML = "";

  const selectedCategory = category.trim().toLowerCase();

  const filteredMenu =
    selectedCategory === "all"
      ? fullMenu
      : fullMenu.filter(item =>
          item.category &&
          item.category.trim().toLowerCase() === selectedCategory
        );

  if (filteredMenu.length === 0) {
    menuDiv.innerHTML = "<p>No items in this category</p>";
    return;
  }

  filteredMenu.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.style.animationDelay = `${index * 0.04}s`;

    div.innerHTML = `
      <h3>${item.name}</h3>
      <p class="price">₹${item.price}</p>
      <button 
        data-name="${item.name}" 
        data-price="${item.price}"
        class="add-btn">
        Add
      </button>
    `;

    menuDiv.appendChild(div);
  });

  // attach click handlers safely
  document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.name, Number(btn.dataset.price));
    });
  });
}

/* ================= CATEGORY BUTTON CLICK ================= */
categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const category = btn.getAttribute("data-category");
    renderMenu(category);
  });
});

/* ================= ADD TO CART ================= */
function addToCart(name, price) {
  const existing = cart.find(i => i.item === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ item: name, price, qty: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Item added to cart");
}
