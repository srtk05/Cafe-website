const gallerySlideImage = document.getElementById("gallerySlideImage");
const gallerySlideReview = document.getElementById("gallerySlideReview");
const gallerySlideEmail = document.getElementById("gallerySlideEmail");
const gallerySliderDots = document.getElementById("gallerySliderDots");
const galleryForm = document.getElementById("galleryForm");
const galleryPhoto = document.getElementById("galleryPhoto");
const galleryName = document.getElementById("galleryName");
const galleryReview = document.getElementById("galleryReview");
const galleryStatus = document.getElementById("galleryStatus");

let slideTimer = null;

function enforceTwoLines(text) {
  const lines = text.split(/\r?\n/);
  return lines.slice(0, 2).join("\n");
}

if (galleryReview) {
  galleryReview.addEventListener("input", () => {
    const cleaned = enforceTwoLines(galleryReview.value);
    if (cleaned !== galleryReview.value) {
      galleryReview.value = cleaned;
    }
  });
}

function startSlider(items) {
  if (!gallerySlideImage) return;
  if (!items || items.length === 0) return;

  let index = 0;
  const applySlide = (item) => {
    gallerySlideImage.src = item.image;
    if (gallerySlideReview) gallerySlideReview.textContent = item.review || "";
    if (gallerySlideEmail) {
      gallerySlideEmail.textContent = item.name ? `Review by ${item.name}` : "Review by Customer";
    }
  };

  applySlide(items[0]);

  if (gallerySliderDots) {
    gallerySliderDots.innerHTML = items
      .map((_, i) => `<span class="slider-dot${i === 0 ? " active" : ""}"></span>`)
      .join("");
  }

  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(() => {
    index = (index + 1) % items.length;
    applySlide(items[index]);
    if (gallerySliderDots) {
      const dots = gallerySliderDots.querySelectorAll(".slider-dot");
      dots.forEach((d, i) => d.classList.toggle("active", i === index));
    }
  }, 3500);
}

async function loadGallery() {
  try {
    const res = await fetch("/api/gallery");
    const items = await res.json();

    const approved = Array.isArray(items) ? items : [];
    const fallback = [
      { image: "assets/images/img1.jpg", review: "Loved the vibe!", name: "Customer" },
      { image: "assets/images/img2.jpg", review: "Great coffee and snacks.", name: "Customer" },
      { image: "assets/images/img3.png", review: "Cozy place to relax.", name: "Customer" }
    ];

    startSlider(approved.length ? approved : fallback);
  } catch (err) {
    console.error("Failed to load gallery");
  }
}

async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

if (galleryForm) {
  galleryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!galleryPhoto.files || galleryPhoto.files.length === 0) {
      galleryStatus.textContent = "Please select a photo.";
      return;
    }

    const nameValue = (galleryName?.value || "").trim();
    const reviewText = enforceTwoLines(galleryReview.value.trim());
    if (!nameValue) {
      galleryStatus.textContent = "Please enter your name.";
      return;
    }
    if (!reviewText) {
      galleryStatus.textContent = "Please add a short review.";
      return;
    }

    try {
      galleryStatus.textContent = "Submitting...";
      const file = galleryPhoto.files[0];
      if (file.size > 2 * 1024 * 1024) {
        galleryStatus.textContent = "Photo must be under 2MB.";
        return;
      }
      const image = await toBase64(file);

      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, review: reviewText, name: nameValue })
      });

      const data = await res.json();
      if (!res.ok) {
        galleryStatus.textContent = data.message || "Failed to submit.";
        return;
      }

      galleryStatus.textContent = "Submitted.";
      galleryForm.reset();
    } catch (err) {
      galleryStatus.textContent = "Failed to submit.";
    }
  });
}

loadGallery();
