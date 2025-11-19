// === CARGA INICIAL ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || !["administrador", "supervisor"].includes(currentUser.role)) {
  alert("⚠️ Acceso denegado. Solo administradores y supervisores pueden registrar compras.");
  window.location.href = "dashboard.html";
}

// === CARGAR DATOS ===
function loadProviders() {
  return JSON.parse(localStorage.getItem("PROVIDERS")) || [];
}

function loadProducts() {
  return JSON.parse(localStorage.getItem("PRODUCTS")) || [];
}

function loadPurchases() {
  return JSON.parse(localStorage.getItem("PURCHASES")) || [];
}

function savePurchases(purchases) {
  localStorage.setItem("PURCHASES", JSON.stringify(purchases));
}

// === RENDERIZAR PROVEEDORES ===
function renderProviders() {
  const providers = loadProviders();
  const select = document.getElementById("provider-select");
  select.innerHTML = '<option value="">Seleccionar proveedor...</option>';
  providers.forEach(p => {
    const option = document.createElement("option");
    option.value = p.name;
    option.textContent = `${p.name} (${p.nit})`;
    select.appendChild(option);
  });
}

// === RENDERIZAR PRODUCTOS EN FILA ===
let purchaseItems = [];

function addProductRow() {
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td>
      <input type="text" placeholder="Nombre del producto" class="item-name" required />
    </td>
    <td>
      <input type="text" placeholder="Código de barras" class="item-barcode" required />
    </td>
    <td>
      <input type="text" placeholder="Categoría" class="item-category" required />
    </td>
    <td>
      <input type="number" placeholder="Precio COP" class="item-price" min="0" step="100" required />
    </td>
    <td>
      <input type="number" placeholder="Cantidad" class="item-quantity" min="1" required />
    </td>
    <td class="item-total">COP $0</td>
    <td>
      <button class="btn-delete-item">🗑️</button>
    </td>
  `;
  document.getElementById("purchase-items").appendChild(newRow);

  // Actualizar total al cambiar cantidad o precio
  const priceInput = newRow.querySelector(".item-price");
  const qtyInput = newRow.querySelector(".item-quantity");
  const totalCell = newRow.querySelector(".item-total");

  const updateTotal = () => {
    const price = parseFloat(priceInput.value) || 0;
    const qty = parseInt(qtyInput.value) || 0;
    totalCell.textContent = `COP $${(price * qty).toLocaleString('es-CO')}`;
  };

  priceInput.addEventListener("input", updateTotal);
  qtyInput.addEventListener("input", updateTotal);

  // Eliminar fila
  newRow.querySelector(".btn-delete-item").addEventListener("click", () => {
    newRow.remove();
    updateGrandTotal();
  });

  updateTotal();
}

// === ACTUALIZAR TOTAL GENERAL ===
function updateGrandTotal() {
  let grandTotal = 0;
  document.querySelectorAll(".item-total").forEach(cell => {
    const text = cell.textContent.replace(/[^0-9]/g, '');
    grandTotal += parseInt(text) || 0;
  });
  document.getElementById("total-amount").textContent = grandTotal.toLocaleString('es-CO');
}

// === GUARDAR COMPRA ===
function savePurchase() {
  const provider = document.getElementById("provider-select").value;
  const invoice = document.getElementById("invoice").value.trim();
  const date = document.getElementById("purchase-date").value;
  const payment = document.getElementById("payment-method").value;

  if (!provider || !invoice || !date) {
    alert("❌ Todos los campos son obligatorios.");
    return false;
  }

  const items = [];
  let hasError = false;

  document.querySelectorAll("#purchase-items tr").forEach(row => {
    const name = row.querySelector(".item-name").value.trim();
    const barcode = row.querySelector(".item-barcode").value.trim();
    const category = row.querySelector(".item-category").value.trim();
    const price = parseFloat(row.querySelector(".item-price").value);
    const quantity = parseInt(row.querySelector(".item-quantity").value);

    if (!name || !barcode || !category || isNaN(price) || isNaN(quantity) || price < 0 || quantity <= 0) {
      hasError = true;
      return;
    }

    items.push({ name, barcode, category, price, quantity });
  });

  if (hasError || items.length === 0) {
    alert("❌ Todos los productos deben tener datos válidos.");
    return false;
  }

  // === ACTUALIZAR INVENTARIO ===
  let products = loadProducts();
  items.forEach(item => {
    const existing = products.find(p => p.barcode === item.barcode);
    if (existing) {
      // Sumar al stock existente
      existing.stock = (existing.stock || 0) + item.quantity;
      // Opcional: actualizar precio si es diferente
      existing.price = item.price;
    } else {
      // Crear nuevo producto
      products.push({
        id: Date.now() + Math.random(),
        name: item.name,
        barcode: item.barcode,
        category: item.category,
        price: item.price,
        stock: item.quantity
      });
    }
  });
  localStorage.setItem("PRODUCTS", JSON.stringify(products));

  // === GUARDAR COMPRA ===
  const newPurchase = {
    id: Date.now(),
    provider,
    invoice,
    date,
    paymentMethod: payment,
    items,
    total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    createdBy: currentUser.email,
    createdAt: new Date().toISOString()
  };

  const purchases = loadPurchases();
  purchases.push(newPurchase);
  savePurchases(purchases);

  return true;
}

// === INICIAR ===
document.addEventListener("DOMContentLoaded", function() {
  renderProviders();
  document.getElementById("purchase-date").valueAsDate = new Date();

  // Añadir primera fila
  addProductRow();

  // Añadir producto
  document.getElementById("add-product-btn").addEventListener("click", addProductRow);

  // Calcular total
  document.getElementById("purchase-items").addEventListener("input", updateGrandTotal);

  // Guardar compra
  document.getElementById("save-purchase-btn").addEventListener("click", function() {
    if (savePurchase()) {
      alert("✅ Compra registrada exitosamente. El inventario ha sido actualizado.");
      window.location.href = "productos.html"; // Redirigir al inventario
    }
  });
});