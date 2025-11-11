// Initialize EmailJS
emailjs.init("1V6iYSsUr5Ua0PmXF"); // Your public key

let cart = [];
const orderMsg = document.getElementById("order-msg");

function showOrderMessage(productName) {
  orderMsg.innerText = `${productName} added to your order!`;
  orderMsg.classList.add("show");
  setTimeout(() => orderMsg.classList.remove("show"), 2000);
}

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
    showOrderMessage(name);
  });
});

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

  if (cart.length === 0) {
    cartBox.style.display = "none";
    return;
  }

  cartBox.style.display = "block";

  let total = 0;

  cartItems.innerHTML = cart
    .map((p, i) => {
      total += p.qty * p.price;
      return `
          <div class="cart-item">
            <strong>${p.name}</strong><br>
            Qty: 
            <button onclick="changeQty(${i},-1)">-</button>
            ${p.qty}
            <button onclick="changeQty(${i},1)">+</button>
            <br>
            Price: ${p.qty * p.price} TL<br>
            <button onclick="removeItem(${i})" style="background:#ff4444;color:white;">Remove</button>
          </div>`;
    })
    .join("");

  cartItems.innerHTML += `<h3>Total: ${total} TL</h3>`;
}

function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();

  if (!name || !phone || !address) {
    alert("Please fill all details");
    return;
  }

  const orderData = {
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    order_items: cart
      .map((item) => `${item.name} x${item.qty} = ${item.qty * item.price} TL`)
      .join("\n"),
    order_time: new Date().toLocaleString(),
    total_price: cart.reduce((sum, item) => sum + item.qty * item.price, 0),
  };

  console.log("Sending order:", orderData); // Debug

  emailjs
    .send("service_bc3uehl", "template_hwustb8", orderData)
    .then((res) => {
      console.log("SUCCESS:", res);
      function showToast(message) {
        const toast = document.getElementById("custom-toast");
        toast.innerHTML = "✅ " + message;
        toast.classList.add("show");

        setTimeout(() => {
          toast.classList.remove("show");
        }, 3000); // disappears after 3 seconds
      }

      // Example usage after sending email
      showToast("Your order has been sent!");

      cart = [];
      updateCart();
      document.getElementById("orderForm").reset();
    })
    .catch((err) => {
      console.error("FAILED:", err);
      alert("⚠️ Failed to send email. Check your EmailJS keys.");
    });
}

// ✅ Test Email function
function testEmail() {
  const testData = {
    customer_name: "Test User",
    customer_phone: "1234567890",
    customer_address: "Test Address",
    order_items: "1x Product = 100 TL",
    order_time: new Date().toLocaleString(),
    total_price: "100",
  };
  console.log("Sending test email:", testData);
  emailjs
    .send("service_l7rjly4", "template_hwusb8", testData)
    .then((res) => {
      console.log("Test email SUCCESS:", res);
      alert("✅ Test email sent successfully!");
    })
    .catch((err) => {
      console.error("Test email FAILED:", err);
      alert("⚠️ Test email failed. Check your keys, service, and template.");
    });
}
