// 1. Carga dinámicamente el HTML de la sidebar y lo posiciona como Overlay
async function cargarSidebarGlobal() {
    const contenedor = document.getElementById('sidebar-container');
    const btnPerfilUser = document.getElementById('btn-perfil-user');

    if (!contenedor || !btnPerfilUser) return;

    try {
        const respuesta = await fetch('/Sidebar.html');
        if (respuesta.ok) {
            const htmlSidebar = await respuesta.text();
            contenedor.innerHTML = htmlSidebar;
            
            // --- POSICIONAMIENTO SUPERPUESTO PROFESIONAL ---
            // En lugar de usar el ancho del botón, fijamos un ancho de tarjeta (ej. 320px)
            // y lo alineamos a la derecha del botón o del contenedor del header.
            contenedor.style.position = 'absolute';
            contenedor.style.top = '100% '; // Justo debajo del header/botón
            contenedor.style.right = '-25px';  // Alineado al borde derecho
            contenedor.style.width = '265px'; // Ancho fijo ideal para menús desplegables
            contenedor.style.zIndex = "600"; 
            // -------------------------------------------------------------

            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
            }

            const btnCerrarInterno = document.getElementById('btn-sidebar-internal-toggle');
            if (btnCerrarInterno) {
                btnCerrarInterno.addEventListener('click', toggleSidebar);
            }
        }
    } catch (error) {
        console.error('Error al cargar la barra lateral:', error);
    }
}

// 2. Función para mostrar u ocultar la sidebar
function toggleSidebar() {
    const contenedor = document.getElementById('sidebar-container');
    const overlay = document.getElementById('sidebar-overlay');

    if (contenedor) {
        contenedor.classList.toggle('hidden');
    }
    if (overlay) {
        overlay.classList.toggle('hidden');
        // Alternamos el paso del mouse para que no bloquee los enlaces de abajo al cerrar
        overlay.classList.toggle('pointer-events-none');
        overlay.classList.toggle('pointer-events-auto');
    }
}

// 3. Cierre inteligente al hacer clic fuera
document.addEventListener('click', (event) => {
    const contenedor = document.getElementById('sidebar-container');
    const btnPerfil = document.getElementById('btn-perfil-user');

    if (contenedor && !contenedor.classList.contains('hidden')) {
        const clicDentroContenedor = contenedor.contains(event.target);
        const clicEnBoton = btnPerfil ? btnPerfil.contains(event.target) : false;

        if (!clicDentroContenedor && !clicEnBoton) {
            toggleSidebar();
        }
    }
});

document.addEventListener('DOMContentLoaded', cargarSidebarGlobal);