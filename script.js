// ==============================
// Initialize EmailJS
// ==============================
emailjs.init("1V6iYSsUr5Ua0PmXF");

// ==============================
// Global variables
// ==============================
let cart = [];
let currentLang = "en";
let deliveryPrice = 0;

// Shop Location (your shop)
const shopLat = 39.96596;
const shopLng = 32.94215;

// ==============================
// Translations
// ==============================
const translations = {
  en: {
    orderAdded: "added to your order!",
    cartEmpty: "Your cart is empty",
    fillDetails: "Please fill all details",
    orderSent: "Your order has been sent!",
    failedEmail: "Failed to send email. Check your EmailJS keys.",
  },
  tr: {
    orderAdded: "siparişinize eklendi!",
    cartEmpty: "Sepetiniz boş",
    fillDetails: "Lütfen tüm bilgileri doldurun",
    orderSent: "Siparişiniz gönderildi!",
    failedEmail: "E-posta gönderilemedi. EmailJS anahtarlarını kontrol edin.",
  },
};

// ==============================
// DOM LOAD
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const orderMsg = document.getElementById("order-msg");
  const checkoutBtn = document.getElementById("checkoutBtn");

  // ==============================
  // LANGUAGE BUTTONS
  // ==============================
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      updateLanguage(currentLang);
      updateCart();
    });
  });

  function updateLanguage(lang) {
    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset[lang]) el.innerText = el.dataset[lang];
    });
  }

  function showOrderMessage(productEl) {
    const productName =
      productEl.dataset[`name${currentLang.toUpperCase()}`] ||
      productEl.dataset.name;

    orderMsg.innerText = `${productName} ${translations[currentLang].orderAdded}`;
    orderMsg.classList.add("show");
    setTimeout(() => orderMsg.classList.remove("show"), 2000);
  }

  // ==============================
  // ADD TO CART
  // ==============================
  document.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const name = card.dataset.name;
      const price = parseInt(card.dataset.price);
      const qty = parseInt(card.querySelector(".qty").value);

      const existing = cart.find((p) => p.name === name);
      if (existing) existing.qty += qty;
      else cart.push({ name, qty, price });

      updateCart();
      showOrderMessage(card);
    });
  });

  // ==============================
  // CART FUNCTIONS
  // ==============================
  function removeItem(i) {
    cart.splice(i, 1);
    updateCart();
  }

  function changeQty(i, amount) {
    cart[i].qty += amount;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    updateCart();
  }

  window.removeItem = removeItem;
  window.changeQty = changeQty;

  // ==============================
  // DELIVERY CALCULATION
  // ==============================
  function toRad(x) {
    return (x * Math.PI) / 180;
  }

  function calculateDistance(lat2, lng2) {
    const R = 6371; // km
    const dLat = toRad(lat2 - shopLat);
    const dLng = toRad(lng2 - shopLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(shopLat)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // km
  }

  async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.length === 0) return null;

    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }

  async function updateDeliveryPrice() {
    const method = document.querySelector(
      'input[name="deliveryMethod"]:checked'
    ).value;
    const deliveryBox = document.getElementById("deliveryCostBox");

    if (method === "ptt") {
      deliveryPrice = 0;
      deliveryBox.style.display = "none";
      updateCart();
      return;
    }

    const address = document.getElementById("customerAddress").value.trim();

    if (!address) {
      deliveryPrice = 0;
      document.getElementById("deliveryCost").innerText = "0 TL";
      deliveryBox.style.display = "flex";
      updateCart();
      return;
    }

    const coords = await geocodeAddress(address);
    if (!coords) {
      deliveryPrice = 0;
      document.getElementById("deliveryCost").innerText = "0 TL";
      deliveryBox.style.display = "flex";
      updateCart();
      return;
    }

    const distance = calculateDistance(coords.lat, coords.lng);
    deliveryPrice = Math.round(distance * 39); // 39 TL per km
    document.getElementById("deliveryCost").innerText = deliveryPrice + " TL";
    deliveryBox.style.display = "flex";
    updateCart();
  }

  // Recalculate delivery price when method changes
  document.querySelectorAll('input[name="deliveryMethod"]').forEach((radio) => {
    radio.addEventListener("change", updateDeliveryPrice);
  });

  // Recalculate delivery price live while typing
  const addressInput = document.getElementById("customerAddress");
  let typingTimer;
  addressInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(updateDeliveryPrice, 700); // wait 700ms after typing stops
  });

  // ==============================
  // UPDATE CART DISPLAY
  // ==============================
  function updateCart() {
    const cartBox = document.getElementById("cartContainer");
    const cartItems = document.getElementById("cartItems");

    if (cart.length === 0) {
      cartBox.style.display = "none";
      return;
    }

    cartBox.style.display = "block";

    let total = 0;

    cartItems.innerHTML = cart
      .map((p, i) => {
        const card = document.querySelector(
          `.product-card[data-name="${p.name}"]`
        );
        const displayName =
          card?.dataset[`name${currentLang.toUpperCase()}`] || p.name;
        total += p.qty * p.price;

        return `
          <div class="cart-item">
            <strong>${displayName}</strong><br>
            Qty: <button onclick="changeQty(${i},-1)">-</button>
            ${p.qty}
            <button onclick="changeQty(${i},1)">+</button><br>
            Price: ${p.qty * p.price} TL<br>
            <button onclick="removeItem(${i})" style="background:#ff4444;color:white;">Remove</button>
          </div>
        `;
      })
      .join("");

    // Include delivery price in total
    const finalTotal = total + deliveryPrice;

    // Show delivery cost in cart
    const method = document.querySelector(
      'input[name="deliveryMethod"]:checked'
    ).value;
    let deliveryText = method === "ptt" ? "0 TL" : deliveryPrice + " TL";

    cartItems.innerHTML += `
      <h4>Delivery: ${deliveryText}</h4>
      <h3>Total: ${finalTotal} TL</h3>
    `;
  }

  // ==============================
  // CHECKOUT
  // ==============================
  async function checkout() {
    if (cart.length === 0) {
      alert(translations[currentLang].cartEmpty);
      return;
    }

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const address = document.getElementById("customerAddress").value.trim();
    const method = document.querySelector(
      'input[name="deliveryMethod"]:checked'
    ).value;

    if (!name || !phone || !address) {
      alert(translations[currentLang].fillDetails);
      return;
    }

    await updateDeliveryPrice();

    const productTotal = cart.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );
    const finalTotal = productTotal + deliveryPrice;

    const orderData = {
      customer_name: name,
      customer_phone: phone,
      customer_address: address,
      delivery_method:
        method === "ptt"
          ? "PTT Cargo"
          : `AK Özgrup Delivery ( ${deliveryPrice} TL )`,
      delivery_fee: deliveryPrice + " TL",
      order_items: cart
        .map((item) => {
          const card = document.querySelector(
            `.product-card[data-name="${item.name}"]`
          );
          const displayName =
            card?.dataset[`name${currentLang.toUpperCase()}`] || item.name;
          return `${displayName} x${item.qty} = ${item.qty * item.price} TL`;
        })
        .join("\n"),
      order_time: new Date().toLocaleString(),
      total_price: finalTotal,
    };

    emailjs
      .send("service_bc3uehl", "template_hwustb8", orderData)
      .then(() => {
        const toast = document.getElementById("custom-toast");
        toast.innerText = "✅ " + translations[currentLang].orderSent;
        toast.classList.add("show");

        setTimeout(() => toast.classList.remove("show"), 3000);

        cart = [];
        deliveryPrice = 0;
        updateCart();

        document.getElementById("orderForm").reset();
        document.getElementById("deliveryCostBox").style.display = "none";
      })
      .catch(() => alert(translations[currentLang].failedEmail));
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkout);
  }

  updateLanguage(currentLang);
});
