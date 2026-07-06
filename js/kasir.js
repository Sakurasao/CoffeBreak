const apiBaseUrl = window.SABAR_API.apiBaseUrl;
let tempCashInputs = {};
let lastUnpaidData = "";

setInterval(() => {
  document.getElementById("real-time-clock").innerText = new Date().toLocaleTimeString("id-ID");
}, 1000);

async function loadUnpaid() {
  try {
    const ind = document.getElementById("sync-indicator");
    if (ind) ind.style.opacity = "1";

    const res = await fetch(`${apiBaseUrl}/admin/transactions`);
    const data = await res.json();
    const unpaid = data
      .filter((o) => o.status === "Unpaid")
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const focusedOrders = unpaid.slice(0, 2);

    const dataStr = JSON.stringify(focusedOrders);
    if (dataStr === lastUnpaidData) {
      if (ind) setTimeout(() => { ind.style.opacity = "0.3"; }, 500);
      return;
    }
    lastUnpaidData = dataStr;

    const list = document.getElementById("kasir-list");
    if (focusedOrders.length === 0) {
      list.innerHTML = '<div class="text-center py-5"><h3 class="text-muted">☕ Belum ada antrean pelanggan...</h3></div>';
      if (ind) setTimeout(() => { ind.style.opacity = "0.3"; }, 500);
      return;
    }

    list.innerHTML = focusedOrders
      .map((order) => {
        const savedValue = tempCashInputs[order.id] || "";
        return `
          <div class="col-12">
              <div class="card card-kasir p-4">
                  <div class="kasir-header">
                      <div class="queue-badge">Antrean #${order.queue_number}</div>
                      <div class="price-total">Rp ${order.total_price.toLocaleString()}</div>
                  </div>
                  <div class="row">
                      <div class="col-md-5">
                          <div class="item-box">
                              <h6 class="fw-bold mb-3 border-bottom pb-2 text-uppercase text-muted" style="letter-spacing: 1px; font-size: 0.8rem;">Item Pesanan:</h6>
                              <ul class="list-unstyled mb-0">
                                  ${order.order_items
                                    .map(
                                      (it) => `
                                      <li class="d-flex justify-content-between mb-2">
                                          <span class="fw-medium">${it.quantity}x ${it.products.name}</span>
                                          <span class="text-muted">Rp ${(it.quantity * it.price_at_purchase).toLocaleString()}</span>
                                      </li>
                                  `,
                                    )
                                    .join("")}
                              </ul>
                          </div>
                          <button class="btn btn-link text-danger text-decoration-none p-0 mt-3 small" onclick="cancel(${order.id})">
                              <i class="bi bi-x-circle me-1"></i> Batalkan Pesanan
                          </button>
                      </div>
                      <div class="col-md-7 ps-md-5 border-start">
                          <label class="fw-bold mb-2 text-muted text-uppercase" style="font-size: 0.8rem;">Uang Tunai Pelanggan:</label>
                          <div class="input-group mb-3">
                              <span class="input-group-text bg-white border-2 fw-bold fs-3 text-muted">Rp</span>
                              <input type="number" class="form-control input-bayar" id="cash-${order.id}" value="${savedValue}" placeholder="0" oninput="handleInput(${order.id}, ${order.total_price})">
                          </div>
                          <div class="d-flex justify-content-between align-items-center mb-4 px-2">
                              <span class="h5 mb-0 text-muted">Kembalian:</span>
                              <h2 id="change-${order.id}" class="fw-bold text-success m-0">Rp 0</h2>
                          </div>
                          <div class="row g-3">
                              <div class="col-9">
                                  <button class="btn btn-brand btn-lg-custom w-100 shadow-sm" onclick="pay(${order.id}, '${order.queue_number}')">
                                      <i class="bi bi-check-all me-2"></i>KONFIRMASI BAYAR
                                  </button>
                              </div>
                              <div class="col-3">
                                  <button class="btn btn-dark btn-lg-custom w-100 shadow-sm" onclick="printReceipt(${JSON.stringify(order).replace(/"/g, "&quot;")})">
                                      <i class="bi bi-printer"></i>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>`;
      })
      .join("");

    focusedOrders.forEach((o) => {
      if (tempCashInputs[o.id]) calcChange(o.id, o.total_price);
    });

    if (ind) setTimeout(() => { ind.style.opacity = "0.3"; }, 500);
  } catch (e) {}
}

function handleInput(id, total) {
  const val = document.getElementById(`cash-${id}`).value;
  tempCashInputs[id] = val;
  calcChange(id, total);
}

function calcChange(id, total) {
  const cash = document.getElementById(`cash-${id}`).value || 0;
  const changeEl = document.getElementById(`change-${id}`);
  const change = cash - total;
  if (change < 0) {
    changeEl.innerText = "- Rp " + Math.abs(change).toLocaleString();
    changeEl.className = "fw-bold text-danger m-0";
  } else {
    changeEl.innerText = "Rp " + change.toLocaleString();
    changeEl.className = "fw-bold text-success m-0";
  }
}

async function pay(id) {
  const cash = tempCashInputs[id];
  const totalText = document.getElementById(`cash-${id}`).closest(".card-kasir").querySelector(".price-total").innerText;
  const total = parseInt(totalText.replace(/\D/g, ""));

  if (!cash || cash < total) {
    alert("Uang pembayaran kurang atau belum diisi!");
    return;
  }

  await fetch(`${apiBaseUrl}/admin/confirm-payment/${id}`, { method: "PATCH" });
  delete tempCashInputs[id];
  lastUnpaidData = "";
  loadUnpaid();
}

async function cancel(id) {
  await fetch(`${apiBaseUrl}/admin/cancel-order/${id}`, { method: "DELETE" });
  delete tempCashInputs[id];
  lastUnpaidData = "";
  loadUnpaid();
}

function printReceipt(o) {
  const cash = tempCashInputs[o.id] || 0;
  document.getElementById("r-date-time").innerText = new Date().toLocaleString("id-ID");
  document.getElementById("r-queue").innerText = o.queue_number;
  document.getElementById("r-total").innerText = "Rp " + o.total_price.toLocaleString();
  document.getElementById("r-cash").innerText = "Rp " + parseInt(cash).toLocaleString();
  document.getElementById("r-change").innerText = "Rp " + (cash - o.total_price > 0 ? (cash - o.total_price).toLocaleString() : 0);

  let html = "";
  o.order_items.forEach((it) => {
    html += `<tr><td colspan="2"><strong>${it.products.name}</strong></td></tr>
               <tr><td>${it.quantity} x ${it.price_at_purchase.toLocaleString()}</td><td style="text-align:right">${(it.quantity * it.price_at_purchase).toLocaleString()}</td></tr>`;
  });
  document.getElementById("r-items").innerHTML = html;
  window.print();
}

loadUnpaid();
setInterval(loadUnpaid, 2000);
