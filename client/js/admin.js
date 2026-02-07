console.log("Admin JS Loaded");

/* ================= AUTH CHECK ================= */

// 🔐 Block direct access to admin page
const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
  window.location.href = "/admin-login.html";
}



/* ================= ELEMENTS ================= */
const menuContainer = document.getElementById("menu-container");
const recentDiv = document.getElementById("recent-orders");
const acceptedDiv = document.getElementById("accepted-orders");
const completedDiv = document.getElementById("completed-orders");
const rejectedDiv = document.getElementById("rejected-orders");
const galleryApprovalsList = document.getElementById("gallery-approvals-list");

let allOrders = [];

/* ================= AUTH RESPONSE HANDLER ================= */
function handleAuthFailure(res) {
  if (res.status === 401 || res.status === 400) {
    alert("Session expired. Please log in again.");
    localStorage.removeItem("adminToken");
    window.location.href = "/admin-login.html";
    return true;
  }
  return false;
}

/* ================= STATUS NORMALIZER ================= */
function normalize(status) {
  return (status || "").toString().toLowerCase();
}

/* ================= MENU ================= */
async function loadMenu() {
  try {
    const res = await fetch("/api/menu", {
      headers: {
        "Authorization": adminToken
      }
    });

    if (handleAuthFailure(res)) return;

    const menu = await res.json();
    menuContainer.innerHTML = "";

    const grouped = {};
    menu.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    for (let cat in grouped) {
      menuContainer.innerHTML += `
        <h3 style="color:#c62828">${cat}</h3>
        <table>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
          ${grouped[cat].map(i => `
            <tr>
              <td>${i.name}</td>
              <td>₹${i.price}</td>
              <td>
                <button class="action" onclick="deleteMenu('${i._id}')">Delete</button>
              </td>
            </tr>
          `).join("")}
        </table>
      `;
    }
  } catch (err) {
    console.error("Menu load error:", err);
  }
}

async function addItem() {
  if (!itemName.value || !itemPrice.value || !itemCategory.value) {
    return alert("Fill all fields");
  }

  await fetch("/api/menu", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": adminToken
    },
    body: JSON.stringify({
      name: itemName.value,
      price: itemPrice.value,
      category: itemCategory.value
    })
  });

  itemName.value = "";
  itemPrice.value = "";
  itemCategory.value = "";

  loadMenu();
}

async function deleteMenu(id) {
  if (!confirm("Delete item?")) return;

  await fetch(`/api/menu/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": adminToken
    }
  });

  loadMenu();
}

/* ================= ORDERS ================= */
async function loadOrders() {
  try {
    const res = await fetch("/api/orders", {
      headers: {
        "Authorization": adminToken
      }
    });

    if (handleAuthFailure(res)) return;

    allOrders = await res.json();
    renderOrders();
  } catch (err) {
    console.error("Order load error:", err);
  }
}

function renderOrders() {
  recentDiv.innerHTML = "";
  acceptedDiv.innerHTML = "";
  if (completedDiv) completedDiv.innerHTML = "";
  rejectedDiv.innerHTML = "";

  if (!allOrders || allOrders.length === 0) {
    recentDiv.innerHTML = "<p>No orders found</p>";
    return;
  }

  const today = new Date().toDateString();

  const todaysOrders = allOrders.filter(
    o => new Date(o.createdAt).toDateString() === today
  );

  todaysOrders.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  todaysOrders.forEach((order, index) => {
    order.dailyNumber = index + 1;
  });

  [...allOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach(order => {

      const status = order.status
        ? order.status.toLowerCase()
        : "pending";

      const isToday =
        new Date(order.createdAt).toDateString() === today;

      const orderNumber = isToday
        ? `#${order.dailyNumber}`
        : "";
      const tableLabel = order.tableNumber
        ? `Table ${order.tableNumber}`
        : "Table N/A";

      const itemsHTML = order.cart
        .map(i => `${i.item} × ${i.qty}`)
        .join("<br>");

      const card = `
        <div class="order-card">
          <b>${orderNumber} ${order.customerName}</b><br>
          🪑 ${tableLabel}<br>
          📞 ${order.mobileNumber || "N/A"}<br>
          🍽 ${order.orderType}<br>

          <hr>

          ${itemsHTML}

          <hr>

          💰 ₹${order.totalAmount}<br>
          🕒 ${new Date(order.createdAt).toLocaleString()}<br>
          <b>Status:</b> ${status}<br><br>

          ${
            status === "pending"
              ? `
                <button class="action" onclick="updateStatus('${order._id}','accepted')">
                  Accept
                </button>
                <button class="action" onclick="updateStatus('${order._id}','rejected')">
                  Reject
                </button>
              `
              : status === "accepted"
              ? `
                <button class="action" onclick="updateStatus('${order._id}','completed')">
                  Complete
                </button>
              `
              : ""
          }
        </div>
      `;

      if (status === "pending") {
        recentDiv.innerHTML += card;
      } else if (status === "accepted") {
        acceptedDiv.innerHTML += card;
      } else if (status === "completed") {
        if (completedDiv) completedDiv.innerHTML += card;
      } else if (status === "rejected") {
        rejectedDiv.innerHTML += card;
      }
    });
}

/* ================= UPDATE STATUS ================= */
async function updateStatus(id, status) {
  await fetch(`/api/orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": adminToken
    },
    body: JSON.stringify({ status })
  });

  loadOrders();
}

/* ================= AUTO REFRESH ================= */
setInterval(loadOrders, 15000);

/* ================= INIT ================= */
loadMenu();
loadOrders();
if (galleryApprovalsList) {
  loadGalleryApprovals();
  setInterval(loadGalleryApprovals, 20000);
}
function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin-login.html";
}
/* ================= OFFER ================= */

async function loadOffer() {
  try {
    const res = await fetch(`/api/offer?ts=${Date.now()}`, { cache: "no-store" });
    if (handleAuthFailure(res)) return;
    if (!res.ok) throw new Error(`Offer fetch failed: ${res.status}`);
    const data = await res.json();

    if (data.image) {
      document.getElementById("adminOfferPreview").src = data.image;
    }
  } catch (err) {
    console.log("Failed to load offer");
  }
}

async function updateOffer() {
  const rawUrl = document.getElementById("offerImageUrl").value.trim();
  const fileInput = document.getElementById("offerImageFile");

  let imagePayload = "";

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (file.size > 3 * 1024 * 1024) {
      alert("Image must be under 3MB");
      return;
    }
    imagePayload = await toBase64(file);
  } else if (rawUrl) {
    imagePayload = rawUrl.startsWith("http") || rawUrl.startsWith("/")
      ? rawUrl
      : `/assets/images/${rawUrl}`;
  } else {
    alert("Please choose a file or enter an image path/URL");
    return;
  }

  await fetch("/api/offer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": adminToken
    },
    body: JSON.stringify({ image: imagePayload })
  });

  alert("Offer Updated Successfully");
  document.getElementById("offerImageUrl").value = "";
  if (fileInput) fileInput.value = "";
  loadOffer();
}

// Load offer when admin panel opens
loadOffer();

/* ================= GALLERY APPROVALS ================= */
async function loadGalleryApprovals() {
  try {
    const res = await fetch("/api/gallery/pending", {
      headers: {
        "Authorization": adminToken
      }
    });

    if (handleAuthFailure(res)) return;

    const items = await res.json();
    if (!galleryApprovalsList) return;
    galleryApprovalsList.innerHTML = "";

    if (!items || items.length === 0) {
      galleryApprovalsList.innerHTML = "<p>No pending requests</p>";
      return;
    }

    galleryApprovalsList.innerHTML = items
      .map(item => `
        <div class="order-card">
          <img src="${item.image}" alt="Gallery request" style="max-width:240px; border-radius:10px; display:block; margin-bottom:8px;">
          <p style="margin:0 0 4px;">${item.review}</p>
          <p style="margin:0 0 8px; font-size:12px; color:#7a3b3b;">Review by ${item.name || "Customer"}</p>
          <button class="action" onclick="approveGallery('${item._id}')">Approve</button>
          <button class="action" onclick="rejectGallery('${item._id}')">Reject</button>
        </div>
      `)
      .join("");
  } catch (err) {
    console.error("Failed to load gallery approvals");
  }
}

async function approveGallery(id) {
  await fetch(`/api/gallery/${id}/approve`, {
    method: "PUT",
    headers: {
      "Authorization": adminToken
    }
  });
  loadGalleryApprovals();
}

async function rejectGallery(id) {
  await fetch(`/api/gallery/${id}/reject`, {
    method: "PUT",
    headers: {
      "Authorization": adminToken
    }
  });
  loadGalleryApprovals();
}

// helper for base64 encoding (reused in gallery)
async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
