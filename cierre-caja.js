// === CARGA INICIAL ===
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || !["cajero", "supervisor", "administrador"].includes(currentUser.role)) {
  alert("⚠️ Solo los cajeros pueden realizar cierre de caja.");
  window.location.href = "dashboard.html";
}

document.getElementById("user-role-display").textContent = currentUser.nombre;

// === OBTENER VENTAS DEL DÍA ===
function getSalesOfToday() {
  const sales = JSON.parse(localStorage.getItem("SALES")) || [];
  const today = new Date().toISOString().split('T')[0];
  return sales.filter(sale => sale.date.startsWith(today));
}

// === RENDERIZAR CIERRE ===
function renderClosure() {
  const sales = getSalesOfToday();
  
  const totalSales = sales.length;
  const totalCash = sales.filter(s => s.paymentMethod === "Efectivo").reduce((sum, s) => sum + s.total, 0);
  const totalTransfer = sales.filter(s => s.paymentMethod === "Transferencia").reduce((sum, s) => sum + s.total, 0);
  const totalDay = totalCash + totalTransfer;

  document.getElementById("total-sales").textContent = totalSales;
  document.getElementById("total-cash").textContent = `$${totalCash.toFixed(2)}`;
  document.getElementById("total-transfer").textContent = `$${totalTransfer.toFixed(2)}`;
  document.getElementById("total-day").textContent = `$${totalDay.toFixed(2)}`;

  const tbody = document.getElementById("closure-details");
  tbody.innerHTML = sales.map(sale => {
    const time = new Date(sale.date).toLocaleTimeString();
    return `
      <tr>
        <td>${time}</td>
        <td>${sale.productName}</td>
        <td>${sale.quantity}</td>
        <td>${sale.paymentMethod}</td>
        <td>$${sale.total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
}

// === GENERAR PDF ===
function generatePDF(sales, totals) {
  try {
    // Verificar que jsPDF esté disponible
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error("jsPDF no está disponible");
    }

    const { totalSales, totalCash, totalTransfer, totalDay } = totals;
    const doc = new jsPDF();
    
    // Configuración de colores
    const primaryColor = [255, 107, 53]; // #ff6b35
    const darkGray = [51, 51, 51];
    const lightGray = [128, 128, 128];
    
    // ENCABEZADO
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text("MiniMarket Las Palmeras", 105, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'normal');
    doc.text("Reporte de Cierre de Caja", 105, 25, { align: 'center' });

    // INFORMACIÓN GENERAL
    doc.setTextColor(...darkGray);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = currentDate.toLocaleTimeString('es-ES');
    
    doc.text(`Fecha: ${dateStr}`, 20, 45);
    doc.text(`Hora de cierre: ${timeStr}`, 20, 52);
    doc.text(`Cajero: ${currentUser.nombre}`, 20, 59);
    doc.text(`Email: ${currentUser.email}`, 20, 66);

    // LÍNEA SEPARADORA
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 72, 190, 72);

    // RESUMEN DEL DÍA
    doc.setFillColor(249, 249, 249);
    doc.roundedRect(20, 78, 170, 45, 3, 3, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("RESUMEN DEL DÍA", 105, 88, { align: 'center' });
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    doc.text(`Número de ventas realizadas:`, 30, 100);
    doc.setFont(undefined, 'bold');
    doc.text(`${totalSales}`, 180, 100, { align: 'right' });
    
    doc.setFont(undefined, 'normal');
    doc.text(`Total en Efectivo:`, 30, 108);
    doc.setFont(undefined, 'bold');
    doc.text(`$${totalCash.toFixed(2)}`, 180, 108, { align: 'right' });
    
    doc.setFont(undefined, 'normal');
    doc.text(`Total en Transferencia:`, 30, 116);
    doc.setFont(undefined, 'bold');
    doc.text(`$${totalTransfer.toFixed(2)}`, 180, 116, { align: 'right' });

    // TOTAL DESTACADO
    doc.setFillColor(232, 245, 233);
    doc.roundedRect(20, 128, 170, 12, 2, 2, 'F');
    doc.setTextColor(46, 125, 50);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL DEL DÍA: $${totalDay.toFixed(2)}`, 105, 136, { align: 'center' });

    // DETALLE DE VENTAS
    let yPosition = 155;
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("DETALLE DE VENTAS", 20, yPosition);
    
    yPosition += 10;
    
    // Encabezados de tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition - 5, 170, 8, 'F');
    
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("HORA", 22, yPosition);
    doc.text("PRODUCTO", 50, yPosition);
    doc.text("CANT.", 120, yPosition);
    doc.text("MÉTODO", 140, yPosition);
    doc.text("TOTAL", 175, yPosition, { align: 'right' });
    
    yPosition += 8;
    
    // Línea de separación
    doc.setDrawColor(220, 220, 220);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    // Filas de ventas
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    sales.forEach((sale, index) => {
      // Verificar si necesitamos nueva página
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
        
        // Repetir encabezados en nueva página
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPosition - 5, 170, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text("HORA", 22, yPosition);
        doc.text("PRODUCTO", 50, yPosition);
        doc.text("CANT.", 120, yPosition);
        doc.text("MÉTODO", 140, yPosition);
        doc.text("TOTAL", 175, yPosition, { align: 'right' });
        yPosition += 8;
        doc.setFont(undefined, 'normal');
      }
      
      // Alternar color de fondo
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPosition - 4, 170, 6, 'F');
      }
      
      const time = new Date(sale.date).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Truncar nombre de producto si es muy largo
      const productName = sale.productName.length > 25 
        ? sale.productName.substring(0, 22) + '...' 
        : sale.productName;
      
      doc.setTextColor(...darkGray);
      doc.text(time, 22, yPosition);
      doc.text(productName, 50, yPosition);
      doc.text(sale.quantity.toString(), 125, yPosition, { align: 'center' });
      doc.text(sale.paymentMethod, 140, yPosition);
      doc.text(`$${sale.total.toFixed(2)}`, 175, yPosition, { align: 'right' });
      
      yPosition += 7;
    });

    // PIE DE PÁGINA
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...lightGray);
      doc.text(
        `Página ${i} de ${totalPages} - Generado el ${currentDate.toLocaleString('es-ES')}`,
        105,
        290,
        { align: 'center' }
      );
      doc.text(
        'MiniMarket Las Palmeras - Sistema de Gestión',
        105,
        285,
        { align: 'center' }
      );
    }

    // Guardar PDF
    const fileName = `cierre-caja-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("⚠️ Error al generar el PDF: " + error.message);
    return false;
  }
}

// === CONFIRMAR CIERRE ===
document.getElementById("close-cash-btn").addEventListener("click", function() {
  if (confirm("¿Confirmar cierre de caja? Se generará un reporte y se reiniciará el día.")) {
    const sales = getSalesOfToday();
    if (sales.length === 0) {
      alert("⚠️ No hay ventas registradas para hoy.");
      return;
    }

    const totalCash = sales.filter(s => s.paymentMethod === "Efectivo").reduce((sum, s) => sum + s.total, 0);
    const totalTransfer = sales.filter(s => s.paymentMethod === "Transferencia").reduce((sum, s) => sum + s.total, 0);
    const totalDay = totalCash + totalTransfer;

    const totals = {
      totalSales: sales.length,
      totalCash,
      totalTransfer,
      totalDay
    };

    // Intentar generar PDF
    const pdfGenerated = generatePDF(sales, totals);

    // Guardar cierre
    const closure = {
      id: Date.now(),
      date: new Date().toISOString(),
      cashier: currentUser.email,
      salesCount: sales.length,
      total: totalDay,
      totalCash,
      totalTransfer,
      sales: sales.map(s => ({ id: s.id, total: s.total, method: s.paymentMethod }))
    };

    let closures = JSON.parse(localStorage.getItem("CLOSURES")) || [];
    closures.push(closure);
    localStorage.setItem("CLOSURES", JSON.stringify(closures));

    // ✅ LIMPIAR VENTAS DEL DÍA ACTUAL
    let allSales = JSON.parse(localStorage.getItem("SALES")) || [];
    const today = new Date().toISOString().split('T')[0];
    allSales = allSales.filter(sale => !sale.date.startsWith(today));
    localStorage.setItem("SALES", JSON.stringify(allSales));

    alert(pdfGenerated 
      ? "✅ Cierre de caja confirmado y PDF generado correctamente." 
      : "✅ Cierre de caja confirmado. (No se pudo generar el PDF)");

    window.location.href = "dashboard.html";
  }
});

// === INICIAR ===
document.addEventListener("DOMContentLoaded", renderClosure);