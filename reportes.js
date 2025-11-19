// === CARGA INICIAL ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
  window.location.href = "login.html";
}

document.getElementById("user-role-display").textContent = currentUser.nombre;

// Fechas por defecto: últimos 7 días
document.getElementById("end-date").valueAsDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7);
document.getElementById("start-date").valueAsDate = startDate;

let currentReportData = null;

// === CARGAR VENTAS REALES ===
function getSales() {
  return JSON.parse(localStorage.getItem("SALES")) || [];
}

// === FILTRAR POR FECHA (USANDO EL CAMPO CORRECTO: 'date') ===
function filterSalesByDate(sales, start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  return sales.filter(sale => {
    const saleDate = new Date(sale.date); // ← ¡CORRECTO! Tu campo se llama 'date'
    return saleDate >= startDate && saleDate <= endDate;
  });
}

// === FORMATEAR FECHA ===
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// === GENERAR REPORTE ===
document.getElementById("generate-report").addEventListener("click", function() {
  const type = document.getElementById("report-type").value;
  const start = document.getElementById("start-date").value;
  const end = document.getElementById("end-date").value;

  if (!start || !end) {
    alert("❌ Seleccione un rango de fechas válido.");
    return;
  }

  if (new Date(start) > new Date(end)) {
    alert("❌ La fecha de inicio no puede ser posterior a la fecha fin.");
    return;
  }

  const allSales = getSales();
  const filteredSales = filterSalesByDate(allSales, start, end);

  if (filteredSales.length === 0) {
    document.getElementById("report-title").textContent = "Sin datos para mostrar";
    document.getElementById("report-content").innerHTML = `
      <p style="text-align:center; padding:40px; color:#666;">
        No se encontraron ventas entre <strong>${formatDate(start)}</strong> y <strong>${formatDate(end)}</strong>.
      </p>
    `;
    document.getElementById("report-actions").style.display = "none";
    return;
  }

  let content = "";
  const title = `${type} (${formatDate(start)} - ${formatDate(end)})`;
  document.getElementById("report-title").textContent = title;
  document.getElementById("report-actions").style.display = "flex";

  // === VENTAS DIARIAS ===
  if (type === "Ventas Diarias") {
    const daily = {};
    filteredSales.forEach(s => {
      const date = s.date.split('T')[0];
      if (!daily[date]) daily[date] = { count: 0, total: 0 };
      daily[date].count++;
      daily[date].total += s.total;
    });

    const rows = Object.keys(daily).sort().map(date => [
      formatDate(date),
      daily[date].count.toString(),
      `$${daily[date].total.toFixed(2)}`
    ]);

    const totalSales = rows.reduce((sum, r) => sum + parseInt(r[1]), 0);
    const totalAmount = rows.reduce((sum, r) => sum + parseFloat(r[2].replace('$', '')), 0);
    rows.push(["<strong>TOTAL</strong>", `<strong>${totalSales}</strong>`, `<strong>$${totalAmount.toFixed(2)}</strong>`]);

    currentReportData = { type, headers: ["Fecha", "N° Ventas", "Total"], rows };
    content = generateTableHTML(currentReportData.headers, currentReportData.rows);

  // === VENTAS POR PRODUCTO ===
  } else if (type === "Ventas por Producto") {
    const byProduct = {};
    filteredSales.forEach(s => {
      if (!byProduct[s.productName]) byProduct[s.productName] = { units: 0, total: 0 };
      byProduct[s.productName].units += s.quantity;
      byProduct[s.productName].total += s.total;
    });

    const totalIncome = Object.values(byProduct).reduce((sum, p) => sum + p.total, 0);
    const rows = Object.keys(byProduct).map(name => {
      const p = byProduct[name];
      const pct = totalIncome > 0 ? ((p.total / totalIncome) * 100).toFixed(1) : 0;
      return [name, p.units.toString(), `$${p.total.toFixed(2)}`, `${pct}%`];
    }).sort((a, b) => parseFloat(b[2].replace('$', '')) - parseFloat(a[2].replace('$', '')));

    const totalUnits = Object.values(byProduct).reduce((sum, p) => sum + p.units, 0);
    rows.push(["<strong>TOTAL</strong>", `<strong>${totalUnits}</strong>`, `<strong>$${totalIncome.toFixed(2)}</strong>`, "<strong>100%</strong>"]);

    currentReportData = {
      type,
      headers: ["Producto", "Unidades Vendidas", "Ingresos", "% del Total"],
      rows
    };
    content = generateTableHTML(currentReportData.headers, currentReportData.rows);
  } else {
    content = "<p>⚠️ Tipo de reporte no implementado.</p>";
  }

  document.getElementById("report-content").innerHTML = content;
  showNotification("✅ Reporte generado con datos reales");
});

// === FUNCIONES AUXILIARES ===
function generateTableHTML(headers, rows) {
  let html = '<table><thead><tr>';
  headers.forEach(h => html += `<th>${h}</th>`);
  html += '</tr></thead><tbody>';
  rows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => html += `<td>${cell}</td>`);
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function showNotification(message) {
  const notif = document.getElementById("notification") || (() => {
    const el = document.createElement('div');
    el.id = "notification";
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: #4CAF50; color: white; padding: 16px 24px;
      border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      z-index: 10000; font-weight: 600;
    `;
    document.body.appendChild(el);
    return el;
  })();

  document.getElementById("notification-message").textContent = message;
  notif.style.display = "block";
  setTimeout(() => notif.style.display = "none", 3000);
}