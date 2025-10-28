/* app.js - simple cart + submit to Google Apps Script endpoint (see instructions) */

const MENU = [
  { id: "halwa", name: "Halwa Puri (1 plate)", price: 45 },
  { id: "qeema_paratha", name: "Qeema Paratha (frozen)", price: 20 },
  { id: "aalu_paratha", name: "Aalu Paratha (frozen)", price: 18 },
  { id: "spring_roll", name: "Spring Roll (pack)", price: 25 },
  { id: "chicken_tikka", name: "Chicken Tikka (kg)", price: 120 },
  // add or edit items here
];

let cart = {}; // {id: qty}

const menuGrid = document.getElementById("menuGrid");
const orderList = document.getElementById("orderList");
const form = document.getElementById("orderForm");
const messageEl = document.getElementById("message");
const clearCartBtn = document.getElementById("clearCartBtn");
const yearSpan = document.getElementById("year");

yearSpan.textContent = new Date().getFullYear();

function renderMenu() {
  menuGrid.innerHTML = "";
  MENU.forEach((item) => {
    const el = document.createElement("div");
    el.className = "menu-item";
    el.innerHTML = `
      <div class="meta">
        <div>
          <div class="item-name">${item.name}</div>
          <div class="item-price">${item.price} TL</div>
        </div>
      </div>
      <div class="qty-controls">
        <button data-id="${item.id}" class="dec">-</button>
        <div class="qty" id="qty-${item.id}">${cart[item.id] || 0}</div>
        <button data-id="${item.id}" class="inc">+</button>
      </div>
    `;
    menuGrid.appendChild(el);
  });
}

function updateOrderList() {
  const entries = Object.entries(cart).filter(([_, q]) => q > 0);
  if (!entries.length) {
    orderList.textContent = "Henüz ürün seçilmedi.";
    return;
  }
  const lines = entries.map(([id, q]) => {
    const item = MENU.find((x) => x.id === id);
    return `${item.name} — ${q} adet — ${item.price * q} TL`;
  });
  orderList.innerHTML = lines.join("<br>");
}

menuGrid.addEventListener("click", (e) => {
  if (e.target.matches(".inc") || e.target.matches(".dec")) {
    const id = e.target.dataset.id;
    const delta = e.target.matches(".inc") ? 1 : -1;
    cart[id] = Math.max(0, (cart[id] || 0) + delta);
    const qtyEl = document.getElementById(`qty-${id}`);
    qtyEl.textContent = cart[id];
    updateOrderList();
  }
});

clearCartBtn.addEventListener("click", () => {
  cart = {};
  renderMenu();
  updateOrderList();
  messageEl.textContent = "Sepet temizlendi.";
});

document.getElementById("previewBtn").addEventListener("click", () => {
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  if (!phone || !Object.values(cart).some((q) => q > 0)) {
    messageEl.textContent = "Lütfen telefon ve ürün seçimi yapın.";
    return;
  }
  const date = form.date.value;
  const time = form.time.value;
  let total = 0;
  const items = Object.entries(cart)
    .filter(([_, q]) => q > 0)
    .map(([id, q]) => {
      const item = MENU.find((x) => x.id === id);
      total += item.price * q;
      return `${item.name} x ${q}`;
    });
  alert(
    `Sipariş Önizleme:\n\nİsim: ${name}\nTelefon: ${phone}\nTarih: ${date} ${time}\n\nÜrünler:\n${items.join(
      "\n"
    )}\n\nToplam: ${total} TL\n\nNot: ${form.note.value}`
  );
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  messageEl.textContent = "";
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const address = form.address.value.trim();
  const date = form.date.value;
  const time = form.time.value;
  const note = form.note.value.trim();

  const items = Object.entries(cart)
    .filter(([_, q]) => q > 0)
    .map(([id, q]) => {
      const it = MENU.find((x) => x.id === id);
      return {
        id,
        name: it.name,
        qty: q,
        price: it.price,
        subtotal: it.price * q,
      };
    });

  if (!items.length) {
    messageEl.textContent = "Lütfen en az bir ürün seçin.";
    return;
  }
  if (!phone) {
    messageEl.textContent = "Lütfen telefon numarası girin.";
    return;
  }

  const order = {
    createdAt: new Date().toISOString(),
    name,
    phone,
    address,
    date,
    time,
    note,
    items,
    total: items.reduce((s, i) => s + i.subtotal, 0),
  };

  // === OPTION A: Send to Google Apps Script endpoint ===
  // Replace the URL below with your deployed Apps Script web-app URL.

  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbw_hQgVMLZ4rFkPfQrr_c7b2jYkmgHlUxYMBxu86i6tggW-tUJxfGc0AFMYpVOvHJP9/exec";

  https: try {
    // Try sending to GAS if the URL has been set (replace YOUR_SCRIPT_ID)
    if (!GAS_URL.includes("1cuQS2OfzKTjzdnnSxqsLGoKVKoxuYykxFgDpxOUZtEg")) {
      const resp = await fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      const data = await resp.json();
      if (data && data.result === "success") {
        messageEl.textContent = "Siparişiniz alınmıştır! Teşekkürler.";
        cart = {};
        renderMenu();
        updateOrderList();
        form.reset();
      } else {
        messageEl.textContent =
          "Sipariş gönderildi ama doğrulama alınamadı. (Sunucu yanıtı bekleniyor)";
      }
      return;
    }
    // If GAS not configured, fallback to saving in localStorage
    localFallback(order);
  } catch (err) {
    console.error(err);
    localFallback(order);
  }
});

function localFallback(order) {
  // Save to localStorage so user can copy/export later
  const saved = JSON.parse(localStorage.getItem("order") || "[]");
  saved.push(order);
  localStorage.setItem("hss_orders", JSON.stringify(saved));
  messageEl.textContent =
    "Sipariş tarayıcıya kaydedildi (GAS yapılandırılmamış).";
  cart = {};
  renderMenu();
  updateOrderList();
  form.reset();
}

// initial render
renderMenu();
updateOrderList();
