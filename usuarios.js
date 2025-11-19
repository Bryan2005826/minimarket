// === CARGA INICIAL ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || currentUser.role !== "administrador") {
  alert("⚠️ Acceso denegado. Solo los administradores pueden gestionar usuarios.");
  window.location.href = "dashboard.html";
}

document.getElementById("user-role-display").textContent = currentUser.nombre;

// === CARGAR USUARIOS ===
function loadUsers() {
  return JSON.parse(localStorage.getItem("USERS")) || [];
}

// === GUARDAR USUARIOS ===
function saveUsers(users) {
  localStorage.setItem("USERS", JSON.stringify(users));
}

// === RENDERIZAR TABLA ===
function renderUsers() {
  const users = loadUsers();
  const tbody = document.getElementById("users-table-body");
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td><input type="checkbox" data-id="${user.email}" /></td>
      <td>${user.nombre}</td>
      <td>${user.email}</td>
      <td><span class="badge badge-${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
      <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Nunca"}</td>
      <td><span class="badge badge-active">Activo</span></td>
      <td class="actions">
        <button title="Editar">✏️</button>
        <button title="Desactivar" class="delete-btn" data-id="${user.email}">🗑️</button>
      </td>
    </tr>
  `).join('');
}

// === EVENTOS ===
document.addEventListener("DOMContentLoaded", function() {
  renderUsers();

  // Agregar usuario
  document.getElementById("add-user-btn").addEventListener("click", function() {
    const nombre = prompt("Nombre completo:");
    const email = prompt("Correo electrónico:");
    const password = prompt("Contraseña (mín. 6 caracteres):");
    const role = prompt("Rol (cajero, supervisor, administrador):");

    if (!nombre || !email || !password || !role) {
      alert("❌ Todos los campos son obligatorios.");
      return;
    }

    if (password.length < 6) {
      alert("❌ La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!["cajero", "supervisor", "administrador"].includes(role)) {
      alert("❌ Rol inválido. Use: cajero, supervisor o administrador.");
      return;
    }

    const users = loadUsers();
    if (users.find(u => u.email === email)) {
      alert("❌ Ya existe un usuario con ese correo.");
      return;
    }

    const newUser = {
      nombre,
      email,
      password,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    renderUsers();
    alert("✅ Usuario creado exitosamente.");
  });

  // Eliminar usuario
  document.addEventListener("click", function(e) {
    if (e.target.classList.contains("delete-btn")) {
      if (confirm("¿Está seguro de desactivar este usuario?")) {
        const email = e.target.dataset.id;
        let users = loadUsers();
        users = users.filter(u => u.email !== email);
        saveUsers(users);
        renderUsers();
        alert("✅ Usuario desactivado.");
      }
    }
  });
});