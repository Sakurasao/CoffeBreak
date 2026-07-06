const apiBaseUrl = window.SABAR_API.apiBaseUrl;
let myChart = null;
let lastTxData = "";
let lastStockData = "";
let lastReportData = "";

function formatMonthName(month) {
  return [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ][month - 1];
}

function populateReportFilterOptions() {
  const yearSelect = document.getElementById("report-year");
  if (!yearSelect) return;
  const currentYear = new Date().getFullYear();
  const startYear = 2020;
  const endYear = currentYear + 10;
  yearSelect.innerHTML = Array.from({ length: endYear - startYear + 1 }, (_, index) => {
    const year = startYear + index;
    return `<option value="${year}"${year === currentYear ? " selected" : ""}>${year}</option>`;
  }).join("");
}

function getReportRange() {
  const yearSelect = document.getElementById("report-year");
  const monthSelect = document.getElementById("report-month");
  const selectedYear = yearSelect ? Number(yearSelect.value) : new Date().getFullYear();
  const selectedMonth = monthSelect ? monthSelect.value : "all";

  const startDate = new Date(selectedYear, selectedMonth === "all" ? 0 : Number(selectedMonth) - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth === "all" ? 11 : Number(selectedMonth), 0);

  const formattedStart = startDate.toISOString().slice(0, 10);
  const formattedEnd = endDate.toISOString().slice(0, 10);
  let label = `Total Pendapatan (${selectedYear})`;
  if (selectedMonth !== "all") {
    label = `Total Pendapatan (${formatMonthName(Number(selectedMonth))} ${selectedYear})`;
  }

  return {
    startDate: formattedStart,
    endDate: formattedEnd,
    label,
  };
}

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

async function loadSalesReport(force = false, startDate = null, endDate = null, labelText = "Total Pendapatan (Tahun Ini)") {
  try {
    const range = getReportRange();
    startDate = startDate || range.startDate;
    endDate = endDate || range.endDate;
    labelText = labelText || range.label;

    const url = new URL(`${apiBaseUrl}/admin/sales-report`);
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date", endDate);
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Laporan gagal dimuat: ${res.status} ${res.statusText}`);
    }
    const result = await res.json();
    const dataStr = JSON.stringify({ result, startDate, endDate });
    if (!force && dataStr === lastReportData) {
      if (myChart) {
        requestAnimationFrame(() => myChart.resize());
      }
      return;
    }
    lastReportData = dataStr;

    const chartCanvas = document.getElementById("salesChart");
    if (!chartCanvas) return;

    const labelElement = document.getElementById("stat-total-label");
    if (labelElement) labelElement.innerText = labelText;
    document.getElementById("stat-total-revenue").innerText = `Rp ${Number(result.total_period || 0).toLocaleString()}`;
    const ctx = chartCanvas.getContext("2d");
    if (myChart) {
      myChart.destroy();
      myChart = null;
    }

    const salesByDate = {};
    if (Array.isArray(result.labels) && Array.isArray(result.data)) {
      result.labels.forEach((label, index) => {
        salesByDate[label] = Number(result.data[index] || 0);
      });
    }

    const labels = [];
    const data = [];
    let current = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    while (current <= end) {
      const key = current.toISOString().slice(0, 10);
      labels.push(key);
      data.push(salesByDate[key] || 0);
      current.setDate(current.getDate() + 1);
    }

    myChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Revenue",
            data,
            borderColor: "#c85a2e",
            backgroundColor: "rgba(200, 90, 46, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12,
            },
          },
        },
      },
    });

    requestAnimationFrame(() => {
      if (myChart) myChart.resize();
    });
    setTimeout(() => {
      if (myChart) myChart.resize();
    }, 150);
  } catch (e) {
    console.error(e);
  }
}

function getActiveTabId() {
  const activeButton = document.querySelector(".nav-link.active");
  if (activeButton) return activeButton.id;
  if (window.location.hash === "#content-report") return "tab-report";
  if (window.location.hash === "#content-stock") return "tab-stock";
  return "tab-transactions";
}

function syncData() {
  const activeTab = getActiveTabId();
  const ind = document.getElementById("sync-indicator");
  ind.style.opacity = "1";

  if (activeTab === "tab-transactions") loadTransactions();
  else if (activeTab === "tab-stock") loadStock();
  else if (activeTab === "tab-report") loadSalesReport(false);

  setTimeout(() => {
    ind.style.opacity = "0.3";
  }, 500);
}

function applyReportFilters() {
  loadSalesReport(true);
}

const filterButton = document.getElementById("btn-report-refresh");
if (filterButton) {
  filterButton.addEventListener("click", applyReportFilters);
}

populateReportFilterOptions();

const tabButtons = document.querySelectorAll(".nav-link");
tabButtons.forEach((button) => {
  button.addEventListener("shown.bs.tab", syncData);
});

syncData();
setInterval(syncData, 2000);
