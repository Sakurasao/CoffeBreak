const apiBaseUrl = window.SABAR_API.apiBaseUrl;
let menuData = [];
let cart = {};
let lastMenuData = "";

async function initDashboard() {
  try {
    const resInfo = await fetch(`${apiBaseUrl}/info`);
    const dataInfo = await resInfo.json();
    if (dataInfo.pengumuman) {
      document.getElementById("announcement-section").classList.remove("d-none");
      document.getElementById("text-pengumuman").innerText = dataInfo.pengumuman;
      document.getElementById("text-jadwal").innerText = `Jam Operasional: ${dataInfo.jadwal_buka}`;
    }
    syncData();
    setInterval(syncData, 2000);
  } catch (err) {}
}

async function syncData() {
  try {
    const resMenu = await fetch(`${apiBaseUrl}/menu`);
    const data = await resMenu.json();
    const dataStr = JSON.stringify(data);

    if (dataStr === lastMenuData) return;
    lastMenuData = dataStr;
    menuData = data;

    if (document.getElementById("group-buttons").innerHTML.trim() === "") {
      renderCategoryButtons();
    }

    const activeBtn = document.querySelector(".btn-category.active");
    const activeCat = activeBtn ? activeBtn.innerText : "Semua";
    renderCards(activeCat === "Semua" ? null : activeCat);
  } catch (err) {}
}

function renderCategoryButtons() {
  const categories = ["Semua", ...new Set(menuData.map((m) => m.category))];
  const container = document.getElementById("group-buttons");
  container.innerHTML = categories
    .map(
      (cat) => `
        <button class="btn-category ${cat === "Semua" ? "active" : ""}" onclick="filterMenu('${cat}', this)">${cat}</button>
      `,
    )
    .join("");
}

function filterMenu(cat, btn) {
  document.querySelectorAll(".btn-category").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderCards(cat === "Semua" ? null : cat);
}

function renderCards(filter = null) {
  const container = document.getElementById("menu-cards");
  const items = filter ? menuData.filter((m) => m.category === filter) : menuData;

  container.innerHTML = items
    .map(
      (item) => `
        <div class="col-6 col-md-4">
            <div class="card card-menu">
                <div class="card-img-container">
                    <img src="${item.image_url}" class="card-img-top" alt="${item.name}" loading="lazy">
                </div>
                <div class="card-body d-flex flex-column p-3">
                    <h6 class="fw-bold mb-1 text-truncate" title="${item.name}">${item.name}</h6>
                    <p class="small text-muted mb-3">${item.category}</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="fw-bold fs-6" style="color: var(--brand-primary);">Rp ${item.price.toLocaleString()}</span>
                        <button class="btn btn-add-menu shadow" onclick="addToCart(${item.id})">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      `,
    )
    .join("");
}

function addToCart(id) {
  const item = menuData.find((m) => m.id === id);
  if (!cart[id]) cart[id] = { ...item, qty: 1 };
  else cart[id].qty++;
  updateCartUI();
}

function decreaseQty(id) {
  if (cart[id]) {
    cart[id].qty--;
    if (cart[id].qty <= 0) delete cart[id];
    updateCartUI();
  }
}

function updateCartUI() {
  const list = document.getElementById("cart-items");
  const items = Object.values(cart);

  if (items.length > 0) {
    list.innerHTML = items
      .map(
        (it) => `
          <div class="cart-item-row d-flex justify-content-between align-items-center">
              <div style="max-width: 60%;">
                  <span class="fw-bold small d-block text-truncate">${it.name}</span>
                  <span class="extra-small fw-bold" style="color: var(--brand-primary);">Rp ${it.price.toLocaleString()}</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                  <button class="btn-qty" onclick="decreaseQty(${it.id})">-</button>
                  <span class="small fw-bold px-1">${it.qty}</span>
                  <button class="btn-qty" onclick="addToCart(${it.id})">+</button>
              </div>
          </div>
        `,
      )
      .join("");

    const total = items.reduce((acc, it) => acc + it.qty * it.price, 0);
    document.getElementById("total-price").innerText = `Rp ${total.toLocaleString()}`;
  } else {
    list.innerHTML = `
      <div class="text-center py-5">
          <i class="bi bi-cart text-muted opacity-25" style="font-size: 3rem;"></i>
          <p class="text-muted small mt-2">Keranjang kosong.<br>Pilih menu di samping.</p>
      </div>
    `;
    document.getElementById("total-price").innerText = "Rp 0";
  }
}

document.getElementById("btn-order").addEventListener("click", async () => {
  const items = Object.values(cart);
  if (items.length === 0) return alert("Keranjang belanja kosong!");

  const btn = document.getElementById("btn-order");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengirim...';

  const queueNum = "Q-" + Math.floor(1000 + Math.random() * 9000);
  const payload = {
    queue: queueNum,
    items: items.map((it) => ({ id: it.id, qty: it.qty, price: it.price })),
    total: items.reduce((acc, it) => acc + it.qty * it.price, 0),
  };

  try {
    const res = await fetch(`${apiBaseUrl}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const alertEl = document.getElementById("order-alert");
      alertEl.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>Sukses! Antrean: <strong>${queueNum}</strong>. Silakan bayar di kasir.`;
      alertEl.classList.remove("d-none");
      cart = {};
      updateCartUI();
      setTimeout(() => {
        alertEl.classList.add("d-none");
      }, 8000);
    }
  } catch (err) {}
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-send-check me-2"></i>Kirim Pesanan';
  }
});

document.getElementById("btn-cancel").addEventListener("click", () => {
  if (confirm("Batalkan semua pesanan?")) {
    cart = {};
    updateCartUI();
  }
});

initDashboard();
