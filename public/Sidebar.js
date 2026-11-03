async function toggleSidebar() {
  const container = document.getElementById('sidebar-container');
  
  // Si está vacío, cargamos el parcial la primera vez
  if (container.innerHTML.trim() === '') {
    try {
      const respuesta = await fetch('/partials/sidebar.ejs');
      const html = await respuesta.text();
      container.innerHTML = html;
      
      const btnClose = container.querySelector('#btn-sidebar-internal-toggle');
      if (btnClose) {
        btnClose.addEventListener('click', toggleSidebar);
      }
    } catch (error) {
      console.error("Error al cargar la barra lateral:", error);
      return;
    }
  }
// Detectar clics en cualquier parte de la ventana para cerrar la sidebar si está abierta
window.addEventListener('click', function(event) {
  const container = document.getElementById('sidebar-container');
  const btnPerfil = document.getElementById('btn-perfil-user');

  // Verificamos si la sidebar está abierta (es decir, NO tiene la clase 'hidden')
  if (container && !container.classList.contains('hidden')) {
    
    // Si el clic NO fue dentro de la sidebar Y TAMPOCO fue en el botón de perfil
    if (!container.contains(event.target) && !btnPerfil.contains(event.target)) {
      container.classList.add('hidden');
    }
  }
});
  // Alternamos de forma directa el despliegue con la clase hidden de Tailwind
  container.classList.toggle('hidden');
}