// ==============================
// Initialize EmailJS
// ==============================
emailjs.init("1V6iYSsUr5Ua0PmXF");

// ==============================
// Global variables
// ==============================
let cart = [];
let currentLang = "en"; // default language

// ==============================
// Translations for alerts and messages
// ==============================
const translations = {
  en: {
    orderAdded: "added to your order!",
    cartEmpty: "Your cart is empty",
    fillDetails: "Please fill all details",
    orderSent: "Your order has been sent!",
    failedEmail: "Failed to send email. Check your EmailJS keys.",
    testEmailSent: "Test email sent successfully!",
    testEmailFailed:
      "Test email failed. Check your keys, service, and template.",
  },
  tr: {
    orderAdded: "siparişinize eklendi!",
    cartEmpty: "Sepetiniz boş",
    fillDetails: "Lütfen tüm bilgileri doldurun",
    orderSent: "Siparişiniz gönderildi!",
    failedEmail: "E-posta gönderilemedi. EmailJS anahtarlarını kontrol edin.",
    testEmailSent: "Test e-postası başarıyla gönderildi!",
    testEmailFailed:
      "Test e-postası gönderilemedi. Anahtarları, servis ve şablonu kontrol edin.",
  },
};

// ==============================
// Wait for DOM to load
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
      updateLanguage(currentLang); // update page content
      updateCart(); // update cart names in the correct language
    });
  });

  // ==============================
  // Update page content dynamically
  // ==============================
  function updateLanguage(lang) {
    document.querySelectorAll("[data-en]").forEach((el) => {
      if (el.dataset[lang]) el.innerText = el.dataset[lang];
    });
  }

  // ==============================
  // Show order message
  // ==============================
  function showOrderMessage(productEl) {
    const productName =
      productEl.dataset[`name${currentLang.toUpperCase()}`] ||
      productEl.dataset.name;
    if (!orderMsg) return;
    orderMsg.innerText = `${productName} ${translations[currentLang].orderAdded}`;
    orderMsg.classList.add("show");
    setTimeout(() => orderMsg.classList.remove("show"), 2000);
  }

  // ==============================
  // Add to Cart
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
  // Cart Operations
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

  function updateCart() {
    const cartBox = document.getElementById("cartContainer");
    const cartItems = document.getElementById("cartItems");
    if (!cartBox || !cartItems) return;

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
            Qty: 
            <button onclick="changeQty(${i},-1)">-</button>
            ${p.qty}
            <button onclick="changeQty(${i},1)">+</button>
            <br>
            Price: ${p.qty * p.price} TL<br>
            <button onclick="removeItem(${i})" style="background:#ff4444;color:white;">Remove</button>
          </div>
        `;
      })
      .join("");

    cartItems.innerHTML += `<h3>Total: ${total} TL</h3>`;
  }

  // ==============================
  // Checkout
  // ==============================
  function checkout() {
    if (cart.length === 0) {
      alert(translations[currentLang].cartEmpty);
      return;
    }

    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const address = document.getElementById("customerAddress").value.trim();

    if (!name || !phone || !address) {
      alert(translations[currentLang].fillDetails);
      return;
    }

    const orderData = {
      customer_name: name,
      customer_phone: phone,
      customer_address: address,
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
      total_price: cart.reduce((sum, item) => sum + item.qty * item.price, 0),
    };

    emailjs
      .send("service_bc3uehl", "template_hwustb8", orderData)
      .then(() => {
        const toast = document.getElementById("custom-toast");
        if (toast) {
          toast.innerText = "✅ " + translations[currentLang].orderSent;
          toast.classList.add("show");
          setTimeout(() => toast.classList.remove("show"), 3000);
        }

        cart = [];
        updateCart();

        const orderForm = document.getElementById("orderForm");
        if (orderForm) orderForm.reset();
      })
      .catch(() => alert(translations[currentLang].failedEmail));
  }

  // ==============================
  // Attach checkout button listener
  // ==============================
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkout);
  }

  // ==============================
  // Test Email (optional)
  // ==============================
  window.testEmail = function () {
    const testData = {
      customer_name: "Test User",
      customer_phone: "1234567890",
      customer_address: "Test Address",
      order_items: "1x Product = 100 TL",
      order_time: new Date().toLocaleString(),
      total_price: "100",
    };

    emailjs
      .send("service_l7rjly4", "template_hwusb8", testData)
      .then(() => alert(translations[currentLang].testEmailSent))
      .catch(() => alert(translations[currentLang].testEmailFailed));
  };

  // ==============================
  // Expose cart functions globally
  // ==============================
  window.removeItem = removeItem;
  window.changeQty = changeQty;

  // Initialize language on page load
  updateLanguage(currentLang);
});
