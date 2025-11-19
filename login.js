// app/login.js
const selectedRole = localStorage.getItem("selectedRole");
if (!selectedRole) {
  window.location.href = "index.html";
}

const roleLabels = { cajero: "Cajero", supervisor: "Supervisor", administrador: "Administrador" };
document.getElementById("title").textContent = `Iniciar Sesión como ${roleLabels[selectedRole]}`;

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  msg.style.display = "none";
  msg.className = "msg";

  const USERS = JSON.parse(localStorage.getItem("USERS")) || [];
  const user = USERS.find(u => u.email === email && u.password === password);

  if (!user) {
    msg.textContent = "❌ Usuario o contraseña incorrectos.";
    msg.className = "msg error";
    msg.style.display = "block";
    return;
  }

  if (user.role !== selectedRole) {
    msg.textContent = "⚠️ Esta no es tu sección. Usa credenciales de tu rol.";
    msg.className = "msg error";
    msg.style.display = "block";
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.removeItem("selectedRole");

  msg.textContent = "✅ Inicio de sesión exitoso!";
  msg.className = "msg success";
  msg.style.display = "block";

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1000);
});