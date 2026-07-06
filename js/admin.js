const apiBaseUrl = window.SABAR_API.apiBaseUrl;
let myChart = null;
let lastTxData = "";
let lastStockData = "";
let lastReportData = "";

setInterval(() => {
  document.getElementById("clock").innerText = new Date().toLocaleTimeString("id-ID");
}, 1000);

function forceRefresh() {
  lastTxData = "";
  lastStockData = "";
  lastReportData = "";
  syncData();
}

async function loadTransactions() {
  try {
    const res = await fetch(`${apiBaseUrl}/admin/transactions`);
    const data = await res.json();
    const dataStr = JSON.stringify(data);
    if (dataStr === lastTxData) return;
    lastTxData = dataStr;

    const container = document.getElementById("transaction-groups");
    const groups = {};
    data.forEach((order) => {
      const dateKey = new Date(order.created_at).toISOString().split("T")[0];
      if (!groups[dateKey]) groups[dateKey] = { items: [], totalDay: 0 };
      groups[dateKey].items.push(order);
      groups[dateKey].totalDay += order.total_price;
    });
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
    if (sortedDates.length === 0) {
      container.innerHTML = '<p class="text-center py-5 text-muted">Belum ada riwayat transaksi.</p>';
      return;
    }
    container.innerHTML = sortedDates
      .map((date, idx) => {
        const dayData = groups[date];
        const displayDate = new Date(date).toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        return `
          <div class="day-group-card">
              <div class="day-header ${idx === 0 ? "active" : ""}" data-bs-toggle="collapse" data-bs-target="#day-${idx}">
                  <div>
                      <p class="day-title">${displayDate}</p>
                      <small class="text-muted">${dayData.items.length} Transaksi</small>
                  </div>
                  <div class="text-end">
                      <span class="day-total">Rp ${dayData.totalDay.toLocaleString()}</span>
                      <i class="bi bi-chevron-down ms-3"></i>
                  </div>
              </div>
              <div id="day-${idx}" class="collapse ${idx === 0 ? "show" : ""}">
                  <div class="table-detail">
                      <div class="table-responsive">
                          <table class="table table-hover mt-3">
                              <thead>
                                  <tr>
                                      <th>Antrean</th>
                                      <th>Jam</th>
                                      <th>Item</th>
                                      <th>Status</th>
                                      <th class="text-end">Total</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  ${dayData.items
                                    .map(
                                      (o) => `
                                      <tr>
                                          <td class="fw-bold">#${o.queue_number}</td>
                                          <td>${new Date(o.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                                          <td><small class="text-muted">${o.order_items.map((it) => `${it.quantity}x ${it.products.name}`).join(", ")}</small></td>
                                          <td><span class="badge rounded-pill bg-${o.status === "Completed" ? "success" : o.status === "Pending" ? "warning" : "secondary"}">${o.status}</span></td>
                                          <td class="text-end fw-bold">Rp ${o.total_price.toLocaleString()}</td>
                                      </tr>
                                  `,
                                    )
                                    .join("")}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>`;
      })
      .join("");
  } catch (e) {}
}

async function loadStock() {
  try {
    const res = await fetch(`${apiBaseUrl}/menu`);
    const data = await res.json();
    const dataStr = JSON.stringify(data);
    if (dataStr === lastStockData) return;
    lastStockData = dataStr;

    const list = document.getElementById("stock-list");
    list.innerHTML = data
      .map(
        (p) => `
          <div class="col-md-4">
              <div class="card-stock p-4 h-100">
                  <h6 class="fw-bold mb-1">${p.name}</h6>
                  <p class="text-muted small mb-3">${p.category}</p>
                  <div class="d-flex justify-content-between align-items-center">
                      <span class="badge ${p.stock > 0 ? "bg-success" : "bg-danger"} rounded-pill">Stok: ${p.stock}</span>
                      <div class="input-group input-group-sm w-50">
                          <input type="number" class="form-control" id="add-${p.id}" placeholder="+/-">
                          <button class="btn btn-brand text-white" onclick="updateStock(${p.id})">OK</button>
                      </div>
                  </div>
              </div>
          </div>
        `,
      )
      .join("");
  } catch (e) {}
}

async function updateStock(id) {
  const val = document.getElementById(`add-${id}`).value;
  if (!val) return;
  await fetch(`${apiBaseUrl}/admin/update-stock/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock: parseInt(val) }),
  });
  lastStockData = "";
  loadStock();
}

async function loadSalesReport() {
  try {
    const res = await fetch(`${apiBaseUrl}/admin/sales-report`);
    const result = await res.json();
    const dataStr = JSON.stringify(result);
    if (dataStr === lastReportData) return;
    lastReportData = dataStr;

    document.getElementById("stat-total-revenue").innerText = `Rp ${result.total_period.toLocaleString()}`;
    const ctx = document.getElementById("salesChart").getContext("2d");
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: result.labels,
        datasets: [
          {
            label: "Revenue",
            data: result.data,
            borderColor: "#c85a2e",
            backgroundColor: "rgba(200, 90, 46, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  } catch (e) {}
}

function syncData() {
  const activeTab = document.querySelector(".nav-link.active").id;
  const ind = document.getElementById("sync-indicator");
  ind.style.opacity = "1";

  if (activeTab === "tab-transactions") loadTransactions();
  else if (activeTab === "tab-stock") loadStock();
  else if (activeTab === "tab-report") loadSalesReport();

  setTimeout(() => {
    ind.style.opacity = "0.3";
  }, 500);
}

document.getElementById("tab-transactions").addEventListener("click", () => {
  setTimeout(syncData, 100);
});
document.getElementById("tab-stock").addEventListener("click", () => {
  setTimeout(syncData, 100);
});
document.getElementById("tab-report").addEventListener("click", () => {
  setTimeout(syncData, 100);
});

syncData();
setInterval(syncData, 2000);
