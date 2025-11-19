// === Inicializar usuarios predeterminados ===
function initDefaultUsers() {
  if (!localStorage.getItem("USERS")) {
    const users = [
      {
        email: "admin@minimarket.com",
        password: "Admin123",
        role: "administrador",
        nombre: "Administrador"
      },
      {
        email: "supervisor@minimarket.com",
        password: "Supervisor123",
        role: "supervisor",
        nombre: "Supervisor"
      },
      {
        email: "cajero@minimarket.com",
        password: "Cajero123",
        role: "cajero",
        nombre: "Cajero"
      }
    ];
    localStorage.setItem("USERS", JSON.stringify(users));
    console.log("✅ Usuarios predeterminados creados.");
  }
}
initDefaultUsers();