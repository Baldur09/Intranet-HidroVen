(function() {
  function formatearCedula(cedula) {
    if (!cedula) return '--';
    let soloNumeros = String(cedula).replace(/\D/g, '');
    return soloNumeros.replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, '$&.');
  }

  // 1. Cargar datos del perfil desde la API
  async function cargarDatosPerfil() {
    try {
      const respuesta = await fetch('/api/perfil');
      const data = await respuesta.json();

      if (!respuesta.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener perfil');
      }

      const p = data.perfil;
      const nombreCompleto = `${p.nombres} ${p.apellidos}`;
      const iniciales = (p.nombres.charAt(0) + (p.apellidos ? p.apellidos.charAt(0) : '')).toUpperCase();

      document.getElementById('perfil-avatar').textContent = iniciales;
      document.getElementById('perfil-nombre-completo').textContent = nombreCompleto;
      document.getElementById('perfil-gerencia').textContent = `${p.gerencia} • ${p.rol}`;
      document.getElementById('perfil-cedula').textContent = formatearCedula(p.cedula);
      document.getElementById('perfil-nombres').textContent = p.nombres;
      document.getElementById('perfil-apellidos').textContent = p.apellidos;
      document.getElementById('perfil-correo').textContent = p.correo;
      document.getElementById('perfil-telefono').textContent = p.telefono || 'No registrado';

    } catch (error) {
      console.error('Error cargando perfil:', error);
      document.getElementById('perfil-nombre-completo').textContent = 'Error al cargar datos';
    }
  }

  cargarDatosPerfil();

  // 2. Mostrar / Ocultar contraseñas
  document.querySelectorAll('.btn-toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('.material-symbols-outlined');

      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        icon.textContent = 'visibility';
      }
    });
  });

  // 3. Manejo del formulario de cambio de contraseña
  const formPassword = document.getElementById('password-form');
  const alertaBox = document.getElementById('pwd-alerta');
  const btnGuardar = document.getElementById('btn-guardar-pass');

  function mostrarAlerta(mensaje, esError = true) {
    alertaBox.textContent = mensaje;
    alertaBox.classList.remove('hidden', 'bg-error-container', 'text-on-error-container', 'bg-emerald-50', 'text-emerald-800', 'border', 'border-emerald-200');
    
    if (esError) {
      alertaBox.classList.add('bg-error-container', 'text-on-error-container');
    } else {
      alertaBox.classList.add('bg-emerald-50', 'text-emerald-800', 'border', 'border-emerald-200');
    }
  }

  if (formPassword) {
    formPassword.addEventListener('submit', async (e) => {
      e.preventDefault();

      const actualPassword = document.getElementById('curr-pass').value;
      const nuevaPassword = document.getElementById('new-pass').value;
      const confirmarPassword = document.getElementById('conf-pass').value;

      if (nuevaPassword.length < 8) {
        mostrarAlerta('La nueva contraseña debe tener al menos 8 caracteres.', true);
        return;
      }

      if (nuevaPassword !== confirmarPassword) {
        mostrarAlerta('La nueva contraseña y su confirmación no coinciden.', true);
        return;
      }

      btnGuardar.disabled = true;
      btnGuardar.textContent = 'Actualizando...';

      try {
        const respuesta = await fetch('/api/perfil/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actualPassword, nuevaPassword })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
          mostrarAlerta(resultado.message || 'No se pudo actualizar la contraseña.', true);
        } else {
          mostrarAlerta('¡Contraseña actualizada con éxito!', false);
          formPassword.reset();
          setTimeout(() => alertaBox.classList.add('hidden'), 4000);
        }
      } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarAlerta('Error de conexión con el servidor.', true);
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Actualizar Contraseña';
      }
    });
  }
})();