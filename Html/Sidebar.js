// 1. Carga dinámicamente el HTML de la sidebar desde el servidor Express
async function cargarSidebarGlobal() {
    const contenedor = document.getElementById('sidebar-container');
    if (!contenedor) return;

    try {
        // Hace una petición a tu servidor para buscar el archivo Sidebar.html
        const respuesta = await fetch('/Sidebar.html');
        if (respuesta.ok) {
            const htmlSidebar = await respuesta.text();
            contenedor.innerHTML = htmlSidebar;
            
            // Vincular el botón interno de cierre de la sidebar (si lo tiene)
            const btnCerrarInterno = document.getElementById('btn-sidebar-internal-toggle');
            if (btnCerrarInterno) {
                btnCerrarInterno.addEventListener('click', toggleSidebar);
            }
        }
    } catch (error) {
        console.error('Error al cargar la barra lateral:', error);
    }
}

// 2. Función para mostrar u ocultar la sidebar al hacer clic en el perfil
function toggleSidebar() {
    const contenedor = document.getElementById('sidebar-container');
    if (contenedor) {
        contenedor.classList.toggle('hidden');
    }
}

// 3. Cierra la sidebar automáticamente si el usuario hace clic fuera de ella
document.addEventListener('click', (event) => {
    const contenedor = document.getElementById('sidebar-container');
    const btnPerfil = document.getElementById('btn-perfil-user');

    if (contenedor && btnPerfil) {
        const clicDentroContenedor = contenedor.contains(event.target);
        const clicEnBoton = btnPerfil.contains(event.target);

        // Si hizo clic afuera y la sidebar está abierta, la oculta
        if (!clicDentroContenedor && !clicEnBoton && !contenedor.classList.contains('hidden')) {
            contenedor.classList.add('hidden');
        }
    }
});

// Ejecutar la función de carga apenas la página termine de abrirse
document.addEventListener('DOMContentLoaded', cargarSidebarGlobal);