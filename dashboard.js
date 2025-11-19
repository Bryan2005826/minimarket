// === CARGA INICIAL ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
  window.location.href = "login.html";
}

document.getElementById("user-name").textContent = currentUser.nombre;

// Mostrar rol en el dashboard
const roleNames = {
  cajero: "Cajero",
  supervisor: "Supervisor",
  administrador: "Administrador"
};
document.getElementById("user-role").textContent = roleNames[currentUser.role];
document.getElementById("welcome-title").textContent = `Bienvenido, ${currentUser.nombre}`;
document.getElementById("role-description").textContent = getRoleDescription(currentUser.role);

function getRoleDescription(role) {
  switch (role) {
    case "cajero":
      return "Puedes registrar y borrar ventas. No tienes acceso a gestión de productos o usuarios.";
    case "supervisor":
      return "Puedes gestionar productos y ver reportes. No puedes gestionar usuarios.";
    case "administrador":
      return "Tienes acceso completo al sistema: ventas, productos, proveedores, reportes y usuarios.";
    default:
      return "Rol no definido.";
  }
}

// === MOSTRAR MODULOS SEGÚN ROL ===
function showModulesByRole() {
  const role = currentUser.role;

  // Todos los roles pueden ver Ventas
  document.getElementById("module-ventas").style.display = "block";

  // Supervisor y Admin ven Productos
  if (role === "supervisor" || role === "administrador") {
    document.getElementById("module-productos").style.display = "block";
  }

  // Solo Admin ve Proveedores y Gestión de Usuarios
  if (role === "administrador") {
    document.getElementById("module-proveedores").style.display = "block";
    document.getElementById("module-usuarios").style.display = "block";
  }

  // Supervisor y Admin ven Reportes
  if (role === "supervisor" || role === "administrador") {
    document.getElementById("module-reportes").style.display = "block";
  }

  // Supervisor y Admin ven Reportes
  if (role === "supervisor" || role === "administrador") {
      document.getElementById("module-compras").style.display = "block";
  }
}


showModulesByRole();

// === CIERRE DE SESIÓN ===
function cerrarSesion() {
  const logEntry = {
    fecha: new Date().toISOString(),
    usuario: currentUser.email,
    accion: "Cierre de sesión manual"
  };
  let logs = JSON.parse(localStorage.getItem("auditLog")) || [];
  logs.push(logEntry);
  localStorage.setItem("auditLog", JSON.stringify(logs));
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}