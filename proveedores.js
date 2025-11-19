// === CARGA INICIAL ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || !["administrador", "supervisor"].includes(currentUser.role)) {
  alert("⚠️ Acceso denegado. Solo administradores y supervisores pueden gestionar proveedores.");
  window.location.href = "dashboard.html";
}

document.getElementById("user-role-display").textContent = currentUser.nombre;

// === CARGAR PROVEEDORES ===
function loadProviders() {
  return JSON.parse(localStorage.getItem("PROVIDERS")) || [];
}

// === GUARDAR PROVEEDORES ===
function saveProviders(providers) {
  localStorage.setItem("PROVIDERS", JSON.stringify(providers));
}

// === RENDERIZAR TABLA ===
function renderProviders() {
  const providers = loadProviders();
  const tbody = document.getElementById("providers-table-body");
  
  tbody.innerHTML = providers.map(p => `
    <tr>
      <td><input type="checkbox" data-id="${p.nit}" /></td>
      <td>${p.name}</td>
      <td>${p.nit}</td>
      <td>${p.address}</td>
      <td>${p.phone}</td>
      <td>${p.email}</td>
      <td class="actions">
        <button title="Editar">✏️</button>
        <button title="Eliminar" class="delete-btn" data-nit="${p.nit}">🗑️</button>
      </td>
    </tr>
  `).join('');
}

// === EVENTOS ===
document.addEventListener("DOMContentLoaded", function() {
  renderProviders();

  // Agregar proveedor
  document.getElementById("add-provider-btn").addEventListener("click", function() {
    const name = prompt("Nombre del proveedor:");
    const nit = prompt("NIT (sin puntos ni guiones):");
    const address = prompt("Dirección:");
    const phone = prompt("Teléfono:");
    const email = prompt("Correo electrónico:");

    if (!name || !nit || !address || !phone || !email) {
      alert("❌ Todos los campos son obligatorios.");
      return;
    }

    const providers = loadProviders();
    if (providers.find(p => p.nit === nit)) {
      alert("❌ Ya existe un proveedor con ese NIT.");
      return;
    }

    const newProvider = {
      name,
      nit,
      address,
      phone,
      email,
      createdAt: new Date().toISOString()
    };

    providers.push(newProvider);
    saveProviders(providers);
    renderProviders();
    alert("✅ Proveedor registrado exitosamente.");
  });

  // Eliminar proveedor
  document.addEventListener("click", function(e) {
    if (e.target.classList.contains("delete-btn")) {
      if (confirm("¿Está seguro de eliminar este proveedor?")) {
        const nit = e.target.dataset.nit;
        let providers = loadProviders();
        providers = providers.filter(p => p.nit !== nit);
        saveProviders(providers);
        renderProviders();
        alert("✅ Proveedor eliminado.");
      }
    }
  });
});