// === CARGA INICIAL ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || !["cajero", "supervisor", "administrador"].includes(currentUser.role)) {
  alert("⚠️ Acceso denegado. Solo Cajero, Supervisor y Administrador pueden registrar ventas.");
  window.location.href = "dashboard.html";
}

document.getElementById("user-role-display").textContent = currentUser.nombre;

// === FUNCIONES DE DATOS ===
function loadProducts() {
  return JSON.parse(localStorage.getItem("PRODUCTS")) || [];
}

function loadSales() {
  return JSON.parse(localStorage.getItem("SALES")) || [];
}

function saveSales(sales) {
  localStorage.setItem("SALES", JSON.stringify(sales));
}

// === RENDERIZAR TABLA DE VENTAS ===
function renderSales() {
  const sales = loadSales();
  const tbody = document.getElementById("sales-table-body");
  tbody.innerHTML = sales.map(sale => `
    <tr>
      <td><input type="checkbox" /></td>
      <td>${sale.productName}</td>
      <td>${sale.quantity}</td>
      <td>$${sale.unitPrice.toLocaleString('es-CO')}</td>
      <td>$${sale.total.toLocaleString('es-CO')}</td>
      <td>${sale.paymentMethod}</td>
      <td><span class="badge badge-success">Completada</span></td>
      <td class="actions">
        <button title="Anular" class="anular-btn" data-id="${sale.id}">🗑️</button>
      </td>
    </tr>
  `).join('');

  // Actualizar contadores: valores totales en COP
  const completadas = sales.length;
  const efectivo = sales.filter(s => s.paymentMethod === "Efectivo").reduce((sum, s) => sum + s.total, 0);
  const transferencia = sales.filter(s => s.paymentMethod === "Transferencia").reduce((sum, s) => sum + s.total, 0);

  const counts = document.querySelectorAll(".count");
  if (counts[0]) counts[0].textContent = completadas;
  if (counts[1]) counts[1].textContent = `$${efectivo.toLocaleString('es-CO')}`;
  if (counts[2]) counts[2].textContent = `$${transferencia.toLocaleString('es-CO')}`;
}

// === RENDERIZAR PRODUCTOS EN MODAL ===
function renderProductsInModal() {
  const products = loadProducts().filter(p => p.stock > 0);
  const select = document.getElementById("sale-product");
  select.innerHTML = '<option value="">Seleccionar producto...</option>';
  products.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.name} (${p.stock} en stock)`;
    select.appendChild(option);
  });
}

// === INICIAR ===
document.addEventListener("DOMContentLoaded", function() {
  renderSales();

  // Nueva venta
  document.getElementById("new-sale-btn").addEventListener("click", function() {
    renderProductsInModal();
    document.getElementById("sale-quantity").value = "1";
    document.getElementById("sale-total").textContent = "0.00";
    document.getElementById("sale-modal").style.display = "block";
  });

  // Calcular total
  document.getElementById("sale-product").addEventListener("change", updateTotal);
  document.getElementById("sale-quantity").addEventListener("input", updateTotal);

  function updateTotal() {
    const productId = document.getElementById("sale-product").value;
    const quantity = parseInt(document.getElementById("sale-quantity").value) || 0;
    const products = loadProducts();
    const product = products.find(p => p.id == productId);
    if (product && quantity > 0 && quantity <= product.stock) {
      const total = (product.price * quantity).toFixed(2);
      document.getElementById("sale-total").textContent = total;
    } else {
      document.getElementById("sale-total").textContent = "0.00";
    }
  }

  // Vender
  document.getElementById("confirm-sale").addEventListener("click", function() {
    const productId = document.getElementById("sale-product").value;
    const quantity = parseInt(document.getElementById("sale-quantity").value) || 0;
    const paymentMethod = document.getElementById("sale-payment").value;

    if (!productId || quantity <= 0) {
      alert("❌ Seleccione un producto y cantidad válida.");
      return;
    }

    const products = loadProducts();
    const product = products.find(p => p.id == productId);
    if (!product || quantity > product.stock) {
      alert("❌ Stock insuficiente.");
      return;
    }

    // Crear venta
    const newSale = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price,
      total: product.price * quantity,
      paymentMethod: paymentMethod,
      status: "completada",
      date: new Date().toISOString(),
      cashier: currentUser.email
    };

    // Guardar venta
    const sales = loadSales();
    sales.push(newSale);
    saveSales(sales);

    // Actualizar stock
    product.stock -= quantity;
    localStorage.setItem("PRODUCTS", JSON.stringify(products));

    // Actualizar UI
    renderSales();
    document.getElementById("sale-modal").style.display = "none";
    alert("✅ Venta registrada exitosamente.");
  });

  // Anular venta
  document.addEventListener("click", function(e) {
    if (e.target.classList.contains("anular-btn")) {
      if (confirm("¿Anular esta venta? El stock se repondrá.")) {
        const id = parseInt(e.target.dataset.id);
        const sales = loadSales();
        const sale = sales.find(s => s.id === id);
        const products = loadProducts();
        const product = products.find(p => p.id === sale.productId);
        if (product) {
          product.stock += sale.quantity;
          localStorage.setItem("PRODUCTS", JSON.stringify(products));
        }
        const updatedSales = sales.filter(s => s.id !== id);
        saveSales(updatedSales);
        renderSales();
        alert("✅ Venta anulada. Stock actualizado.");
      }
    }
  });
});