// Load offer image dynamically (avoid cached 304 with no body)
async function loadOfferImage() {
  try {
    const offerImageEl = document.getElementById("offerImage");
    const offerUpdatedAtEl = document.getElementById("offerUpdatedAt");
    if (!offerImageEl || !offerUpdatedAtEl) return;
    const res = await fetch(`/api/offer?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Offer fetch failed: ${res.status}`);
    const data = await res.json();

    if (data.image) {
      const normalized =
        data.image.startsWith("http") ||
        data.image.startsWith("/") ||
        data.image.startsWith("data:image")
          ? data.image
          : `/assets/images/${data.image}`;
      offerImageEl.src = normalized;
      const stamp = new Date().toLocaleTimeString();
      offerUpdatedAtEl.textContent = `Last updated: ${stamp}`;
    }
  } catch (err) {
    console.log("No offer found");
  }
}

loadOfferImage();
setInterval(loadOfferImage, 5000);

// Offer image lightbox
const offerImage = document.getElementById("offerImage");
const offerLightbox = document.getElementById("offerLightbox");
const offerLightboxImage = document.getElementById("offerLightboxImage");
const offerLightboxClose = document.querySelector(".offer-lightbox-close");
let lastFocusedElement = null;

if (offerLightbox) {
  offerLightbox.setAttribute("inert", "");
}

function openOfferLightbox() {
  if (!offerImage || !offerLightbox || !offerLightboxImage) return;
  lastFocusedElement = document.activeElement;
  offerLightboxImage.src = offerImage.src;
  offerLightbox.classList.add("is-open");
  offerLightbox.setAttribute("aria-hidden", "false");
  offerLightbox.removeAttribute("inert");
  document.body.style.overflow = "hidden";
  if (offerLightboxClose) {
    offerLightboxClose.focus();
  }
}

function closeOfferLightbox() {
  if (!offerLightbox) return;
  offerLightbox.classList.remove("is-open");
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
  offerLightbox.setAttribute("aria-hidden", "true");
  offerLightbox.setAttribute("inert", "");
  document.body.style.overflow = "";
}

if (offerImage) {
  offerImage.addEventListener("click", openOfferLightbox);
}
if (offerLightbox) {
  offerLightbox.addEventListener("click", (e) => {
    if (e.target === offerLightbox || e.target.classList.contains("offer-lightbox-backdrop")) {
      closeOfferLightbox();
    }
  });
}
if (offerLightboxClose) {
  offerLightboxClose.addEventListener("click", closeOfferLightbox);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && offerLightbox && offerLightbox.classList.contains("is-open")) {
    closeOfferLightbox();
  }
});
