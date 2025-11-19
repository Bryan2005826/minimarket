// === CARGA INICIAL ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || !["administrador", "supervisor"].includes(currentUser.role)) {
  alert("⚠️ Acceso denegado. Solo administradores y supervisores pueden gestionar productos.");
  window.location.href = "dashboard.html";
}

document.getElementById("user-role-display").textContent = currentUser.nombre;

// === CARGAR PRODUCTOS ===
function loadProducts() {
  return JSON.parse(localStorage.getItem("PRODUCTS")) || [];
}

// === GUARDAR PRODUCTOS ===
function saveProducts(products) {
  localStorage.setItem("PRODUCTS", JSON.stringify(products));
}

// === ESTADO DE STOCK ===
function getStatus(stock) {
  if (stock === 0) return "agotado";
  if (stock <= 5) return "stock-bajo";
  return "en-stock";
}

// === OBTENER CATEGORÍAS ÚNICAS ===
function getCategories(products) {
  return [...new Set(products.map(p => p.category).filter(Boolean))].sort();
}

// === RENDERIZAR FILTROS ===
function renderCategoryFilters(products) {
  const ul = document.getElementById("category-filters");
  const categories = getCategories(products);
  ul.innerHTML = '<li data-category="all" class="active">Todas</li>';
  categories.forEach(cat => {
    const li = document.createElement("li");
    li.textContent = cat;
    li.dataset.category = cat;
    li.addEventListener("click", () => {
      document.querySelectorAll("#category-filters li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
      renderProducts();
    });
    ul.appendChild(li);
  });
}

// === APLICAR FILTROS ===
function getActiveFilters() {
  const status = document.querySelector("#status-filters li.active")?.dataset.status || "all";
  const category = document.querySelector("#category-filters li.active")?.dataset.category || "all";
  return { status, category };
}

// === RENDERIZAR TABLA (CON PESOS COLOMBIANOS) ===
function renderProducts() {
  const products = loadProducts();
  const { status, category } = getActiveFilters();

  let filtered = products;
  if (status !== "all") {
    filtered = filtered.filter(p => getStatus(p.stock) === status);
  }
  if (category !== "all") {
    filtered = filtered.filter(p => p.category === category);
  }

  const tbody = document.getElementById("products-table-body");
  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.barcode}</td>
      <td>${p.category || 'Sin categoría'}</td>
      <td><strong>$${p.price.toLocaleString('es-CO')}</strong></td>
      <td>${p.stock}</td>
      <td>
        <span class="badge badge-${getStatus(p.stock)}">
          ${getStatus(p.stock) === 'en-stock' ? 'En Stock' : 
            getStatus(p.stock) === 'stock-bajo' ? 'Stock Bajo' : 'Agotado'}
        </span>
      </td>
      <td class="actions">
        <button class="edit-btn" data-id="${p.id}">✏️</button>
        <button class="delete-btn" data-id="${p.id}">🗑️</button>
      </td>
    </tr>
  `).join('');

  renderCategoryFilters(products);
}

// === INICIAR ===
document.addEventListener("DOMContentLoaded", function() {
  renderProducts();

  // NUEVO PRODUCTO
  document.getElementById("add-product-btn").addEventListener("click", function() {
    document.getElementById("modal-title").textContent = "Nuevo Producto";
    document.getElementById("product-form").dataset.mode = "create";
    document.getElementById("product-form").reset();
    document.getElementById("product-modal").style.display = "block";
  });

  // GUARDAR PRODUCTO
  document.getElementById("product-form").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const name = document.getElementById("product-name").value.trim();
    const barcode = document.getElementById("product-barcode").value.trim();
    const category = document.getElementById("product-category").value.trim();
    const price = parseFloat(document.getElementById("product-price").value);
    const stock = parseInt(document.getElementById("product-stock").value);

    if (!name || !barcode || !category || isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
      showNotification("❌ Todos los campos son obligatorios y válidos.", true);
      return;
    }

    const products = loadProducts();
    const mode = this.dataset.mode;

    if (mode === "create") {
      // Verificar que no exista el código de barras
      if (products.some(p => p.barcode === barcode)) {
        showNotification("❌ Ya existe un producto con ese código de barras.", true);
        return;
      }
      products.push({ id: Date.now(), name, barcode, category, price, stock });
      showNotification(`✅ Producto "${name}" agregado.`);
    } else {
      const id = parseInt(this.dataset.id);
      const product = products.find(p => p.id === id);
      if (product) {
        product.name = name;
        product.barcode = barcode;
        product.category = category;
        product.price = price;
        product.stock = stock;
        showNotification(`✅ Producto "${name}" actualizado.`);
      }
    }

    saveProducts(products);
    renderProducts();
    document.getElementById("product-modal").style.display = "none";
  });

  // EDITAR
  document.addEventListener("click", function(e) {
    if (e.target.classList.contains("edit-btn")) {
      const id = parseInt(e.target.dataset.id);
      const product = loadProducts().find(p => p.id === id);
      if (product) {
        document.getElementById("modal-title").textContent = "Editar Producto";
        document.getElementById("product-form").dataset.mode = "edit";
        document.getElementById("product-form").dataset.id = id;
        document.getElementById("product-name").value = product.name;
        document.getElementById("product-barcode").value = product.barcode;
        document.getElementById("product-category").value = product.category;
        document.getElementById("product-price").value = product.price;
        document.getElementById("product-stock").value = product.stock;
        document.getElementById("product-modal").style.display = "block";
      }
    }
  });

  // ELIMINAR
  document.addEventListener("click", function(e) {
    if (e.target.classList.contains("delete-btn")) {
      if (confirm("¿Eliminar este producto permanentemente?")) {
        const id = parseInt(e.target.dataset.id);
        let products = loadProducts();
        const product = products.find(p => p.id === id);
        products = products.filter(p => p.id !== id);
        saveProducts(products);
        renderProducts();
        showNotification(`🗑️ Producto "${product.name}" eliminado.`);
      }
    }
  });

  // FILTROS DE ESTADO
  document.querySelectorAll("#status-filters li").forEach(li => {
    li.addEventListener("click", () => {
      document.querySelectorAll("#status-filters li").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
      renderProducts();
    });
  });

  // CERRAR MODAL
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("product-modal").style.display = "none";
  });
});

// === NOTIFICACIÓN ===
function showNotification(message, isError = false) {
  const el = document.getElementById("notification-message");
  el.textContent = message;
  const notification = document.getElementById("notification");
  notification.style.backgroundColor = isError ? "#f44336" : "#4CAF50";
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}