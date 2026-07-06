const apiBaseUrl = window.SABAR_API.apiBaseUrl;
let lastPendingData = "";

async function loadBaristaOrders() {
  try {
    const ind = document.getElementById("sync-indicator");
    if (ind) ind.style.opacity = "1";

    const res = await fetch(`${apiBaseUrl}/admin/transactions`);
    const data = await res.json();
    const pendingOrders = data
      .filter((o) => o.status === "Pending")
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const dataStr = JSON.stringify(pendingOrders);
    if (dataStr === lastPendingData) {
      if (ind) setTimeout(() => { ind.style.opacity = "0.3"; }, 500);
      return;
    }
    lastPendingData = dataStr;

    const list = document.getElementById("barista-list");
    if (pendingOrders.length === 0) {
      list.innerHTML = `
        <div class="col-12 text-center py-5 mt-5">
            <i class="bi bi-emoji-smile text-muted opacity-50" style="font-size: 4rem;"></i>
            <h4 class="text-muted mt-3 fw-bold">Dapur Kosong</h4>
            <p class="text-muted">Belum ada pesanan masuk yang perlu diracik.</p>
        </div>`;
      if (ind) setTimeout(() => { ind.style.opacity = "0.3"; }, 500);
      return;
    }

    list.innerHTML = pendingOrders
      .map(
        (order, index) => `
          <div class="col-md-6 col-lg-4">
              <div class="card barista-card h-100 ${index === 0 ? "priority-one" : ""}">
                  <div class="badge-urutan">Urutan #${index + 1}</div>
                  <div class="card-body text-center pt-5">
                      <div class="small text-muted text-uppercase fw-bold" style="letter-spacing: 1px;">Antrean</div>
                      <div class="queue-number mb-2">${order.queue_number}</div>
                      <div class="small text-muted mb-4">
                          <i class="bi bi-clock me-1"></i> Masuk: ${new Date(order.created_at).toLocaleTimeString("id-ID")}
                      </div>
                      <div class="item-list mb-4">
                          <ul class="list-unstyled mb-0">
                              ${order.order_items
                                .map(
                                  (it) => `
                                  <li class="d-flex justify-content-between mb-2 pb-2 border-bottom border-light">
                                      <span class="fw-bold text-dark">${it.quantity}x</span>
                                      <span class="text-end text-muted">${it.products.name}</span>
                                  </li>
                              `,
                                )
                                .join("")}
                          </ul>
                      </div>
                      <button class="btn btn-brand btn-finish w-100 shadow-sm" onclick="completeOrder(${order.id})">
                          <i class="bi bi-check2-circle me-2"></i>Selesai
                      </button>
                  </div>
              </div>
          </div>
        `,
      )
      .join("");

    document.getElementById("status-badge").className = "badge bg-white text-brand px-3 py-2 rounded-pill shadow-sm me-3";
    document.getElementById("status-badge").innerText = "Sistem Aktif";
    if (ind) setTimeout(() => { ind.style.opacity = "0.3"; }, 500);
  } catch (err) {
    document.getElementById("status-badge").className = "badge bg-danger text-white px-3 py-2 rounded-pill shadow-sm me-3";
    document.getElementById("status-badge").innerText = "Koneksi Error";
  }
}

async function completeOrder(orderId) {
  try {
    const res = await fetch(`${apiBaseUrl}/admin/order-complete/${orderId}`, { method: "PATCH" });
    if (res.ok) {
      lastPendingData = "";
      loadBaristaOrders();
    } else {
      alert("Gagal memperbarui status pesanan.");
    }
  } catch (err) {
    alert("Gagal memproses pesanan.");
  }
}

loadBaristaOrders();
setInterval(loadBaristaOrders, 2000);
