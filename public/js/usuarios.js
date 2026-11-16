(function() {
  let usuariosDB = [];
  let paginaActual = 1;
  let registrosPorPagina = 10;
  let usuarioSeleccionadoParaBaja = null;

  function formatearCedula(cedula) {
    if (!cedula) return '';
    let soloNumeros = String(cedula).replace(/\D/g, '');
    return soloNumeros.replace(/\d{1,3}(?=(\d{3})+(?!\d))/g, '$&.');
  }

  const toast = document.getElementById('toast-notificacion');
  const toastMensaje = document.getElementById('toast-mensaje');
  const toastIcono = document.getElementById('toast-icono');

  function mostrarToast(texto, tipo = 'success') {
    if (!toast) return;
    toastMensaje.textContent = texto;
    if (tipo === 'error') {
      if (toastIcono) {
        toastIcono.textContent = 'error';
        toastIcono.className = 'material-symbols-outlined text-red-400 text-[22px]';
      }
    } else {
      if (toastIcono) {
        toastIcono.textContent = 'check_circle';
        toastIcono.className = 'material-symbols-outlined text-secondary-container text-[22px]';
      }
    }
    toast.classList.remove('hidden');
    toast.classList.add('flex');
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('flex');
    }, 4000);
  }

  async function cargarUsuariosBD() {
    try {
      const respuesta = await fetch('/api/usuarios');
      const data = await respuesta.json();
      if (!respuesta.ok || !data.success) {
        throw new Error(data.message || 'No se pudo cargar la lista de usuarios.');
      }
      if (data.success) {
        usuariosDB = data.usuarios;
        aplicarFiltros(); 
        actualizarKPIs(usuariosDB);
      }
    } catch (error) {
      console.error("Error al cargar los usuarios:", error);
      mostrarToast("No se pudo conectar con la base de datos", "error");
    }
  }

  async function cargarGerencias() {
    try {
      const respuesta = await fetch('/api/gerencias');
      const data = await respuesta.json();
      
      if (!respuesta.ok || !data.success) {
        throw new Error(data.message || 'No se pudieron cargar las gerencias.');
      }

      ['select-gerencia', 'editar-gerencia'].forEach(idSelect => {
        const select = document.getElementById(idSelect);
        if (select) {
          select.replaceChildren(new Option('Seleccione Gerencia...', ''));
          data.gerencias.forEach(gerencia => {
            select.add(new Option(gerencia.nombre, gerencia.Id));
          });
        }
      });

      const filtroGerencia = document.getElementById('filtro-gerencia');
      if (filtroGerencia) {
        filtroGerencia.replaceChildren(new Option('Todas las Gerencias', 'todas'));
        data.gerencias.forEach(gerencia => {
          filtroGerencia.add(new Option(gerencia.nombre, gerencia.nombre));
        });
      }
    } catch (error) {
      console.error('Error al cargar gerencias:', error);
      mostrarToast('No se pudieron cargar las gerencias disponibles.', 'error');
    }
  }

  async function cargarRoles() {
    try {
      const respuesta = await fetch('/api/roles');
      const data = await respuesta.json();
      
      if (!respuesta.ok || !data.success) {
        throw new Error(data.message || 'No se pudieron cargar los roles.');
      }

      ['select-rol', 'editar-rol'].forEach(idSelect => {
        const select = document.getElementById(idSelect);
        if (select) {
          select.replaceChildren(new Option('Seleccione Rol...', ''));
          data.roles.forEach(rol => {
            select.add(new Option(rol.nombre, rol.Id));
          });
        }
      });

      const filtroRol = document.getElementById('filtro-rol');
      if (filtroRol) {
        filtroRol.replaceChildren(new Option('Todos los Roles', 'todos'));
        data.roles.forEach(rol => {
          filtroRol.add(new Option(rol.nombre, rol.nombre));
        });
      }
    } catch (error) {
      console.error('Error al cargar roles:', error);
      mostrarToast('No se pudieron cargar los roles disponibles.', 'error');
    }
  }

  cargarRoles();
  cargarUsuariosBD();
  cargarGerencias();
  
  function actualizarKPIs(lista) {
    const totalUsuarios = document.getElementById('kpi-total-usuarios');
    const inactivos = document.getElementById('kpi-inactivos');

    const total = lista.length;
    const cantInactivos = lista.filter(u => u.estado === 'Inactivo').length;

    if (totalUsuarios) totalUsuarios.textContent = total;
    if (inactivos) inactivos.textContent = cantInactivos;
  }

  function renderizarTablaPaginada(listaFiltrada) {
    const tablaCuerpo = document.getElementById('tabla-usuarios-cuerpo');
    const spanInicio = document.getElementById('paginacion-inicio');
    const spanFin = document.getElementById('paginacion-fin');
    const spanTotal = document.getElementById('paginacion-total');
    const contenedorBotones = document.getElementById('contenedor-botones-paginacion');

    if (!tablaCuerpo) return;

    const totalRegistros = listaFiltrada.length;
    spanTotal.textContent = totalRegistros;

    if (totalRegistros === 0) {
      tablaCuerpo.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-outline">No hay usuarios registrados que coincidan con la búsqueda.</td></tr>`;
      spanInicio.textContent = 0;
      spanFin.textContent = 0;
      contenedorBotones.innerHTML = '';
      return;
    }

    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    if (paginaActual < 1) paginaActual = 1;

    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = Math.min(inicio + registrosPorPagina, totalRegistros);
    const listaPaginada = listaFiltrada.slice(inicio, fin);

    spanInicio.textContent = inicio + 1;
    spanFin.textContent = fin;

    tablaCuerpo.innerHTML = listaPaginada.map(u => {
      const nombreCompleto = `${u.nombres} ${u.apellidos}`;
      const iniciales = (u.nombres.charAt(0) + (u.apellidos ? u.apellidos.charAt(0) : '')).toUpperCase();
      const esActivo = u.estado === 'Activo';
      const cedulaFormateada = formatearCedula(u.cedula);

      return `
        <tr class="hover:bg-surface-container-low/50 transition-colors group ${!esActivo ? 'opacity-85' : ''}" data-cedula="${u.cedula}" data-correo="${u.correo}" data-estado="${u.estado}" data-gerencia="${u.gerencia}" data-id="${u.id}" data-nombre="${nombreCompleto}" data-rol="${u.rol}">
          <td class="py-4 px-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-fixed text-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold flex-shrink-0">
                ${iniciales}
              </div>
              <div class="min-w-0">
                <span class="font-label-lg text-label-lg text-on-surface block truncate usuario-nombre">${nombreCompleto}</span>
                <span class="text-body-sm font-body-sm text-outline block truncate usuario-correo">${u.correo}</span>
              </div>
            </div>
          </td>
          <td class="py-4 px-4 font-mono text-on-surface usuario-cedula">${cedulaFormateada}</td>
          <td class="py-4 px-4">
            <span class="inline-flex items-center gap-1.5 text-on-surface usuario-gerencia"><span>${u.gerencia}</span></span>
          </td>
          <td class="py-4 px-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-label-caps font-label-caps bg-primary text-on-primary usuario-rol-badge">
              ${u.rol}
            </span>
          </td>
          <td class="py-4 px-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-caps font-label-caps ${esActivo ? 'bg-secondary-fixed/50 text-on-secondary-fixed-variant' : 'bg-error-container text-on-error-container'} usuario-estado-badge">
              <span class="w-1.5 h-1.5 rounded-full ${esActivo ? 'bg-secondary' : 'bg-error'}"></span>
              ${u.estado}
            </span>
          </td>
          <td class="py-4 px-4">
            <div class="flex items-center justify-center gap-2 text-on-surface-variant">
              <button class="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all cursor-pointer btn-accion-editar" title="Editar datos del usuario" type="button">
                <span class="material-symbols-outlined text-[22px]">edit</span>
              </button>
              <button class="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-error-container text-on-surface-variant hover:text-error transition-all cursor-pointer btn-accion-baja" title="Desactivar / Dar de baja" type="button">
                <span class="material-symbols-outlined text-[22px]">person_off</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    let htmlBotones = `
      <button class="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container transition-all ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}" ${paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual - 1})">Anterior</button>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
      if (i === 1 || i === totalPaginas || (i >= paginaActual - 1 && i <= paginaActual + 1)) {
        htmlBotones += `
          <button class="w-8 h-8 rounded-lg text-xs font-semibold transition-all ${i === paginaActual ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest border border-surface-container-high text-on-surface hover:bg-surface-container'} cursor-pointer" onclick="cambiarPagina(${i})">${i}</button>
        `;
      } else if (i === paginaActual - 2 || i === paginaActual + 2) {
        htmlBotones += `<span class="px-1 text-outline">...</span>`;
      }
    }

    htmlBotones += `
      <button class="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container transition-all ${paginaActual === totalPaginas || totalPaginas === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}" ${paginaActual === totalPaginas || totalPaginas === 0 ? 'disabled' : ''} onclick="cambiarPagina(${paginaActual + 1})">Siguiente</button>
    `;

    contenedorBotones.innerHTML = htmlBotones;
  }

  window.cambiarPagina = function(nuevaPagina) {
    paginaActual = nuevaPagina;
    aplicarFiltros();
  };

  // ================= MODAL CREAR =================
  const modalCrear = document.getElementById('modal-nuevo-usuario');
  const btnAbrirCrear = document.getElementById('btn-abrir-modal');
  const btnCerrarCrear = document.getElementById('btn-cerrar-modal');
  const btnCerrarCrearX = document.getElementById('btn-cerrar-modal-x');
  const formCrear = document.getElementById('form-crear-usuario');
  const btnGenerarClave = document.getElementById('btn-generar-clave');
  const inputPassword = document.getElementById('input-password-temp');
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  const iconoTogglePassword = document.getElementById('icono-toggle-password');

  function abrirModalCrear() {
    if (modalCrear) {
      modalCrear.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      if (inputPassword) {
        inputPassword.type = 'text';
        inputPassword.value = '%hidrolara123%';
      }
      if (iconoTogglePassword) {
        iconoTogglePassword.textContent = 'visibility_off';
      }
    }
  }

  function cerrarModalCrear() {
    if (modalCrear) {
      modalCrear.classList.add('hidden');
      document.body.style.overflow = '';
      if (formCrear) formCrear.reset();
      if (inputPassword) {
        inputPassword.type = 'text';
        inputPassword.value = '';
      }
      if (iconoTogglePassword) {
        iconoTogglePassword.textContent = 'visibility_off';
      }
    }
  }

  if (btnAbrirCrear) btnAbrirCrear.addEventListener('click', abrirModalCrear);
  if (btnCerrarCrear) btnCerrarCrear.addEventListener('click', cerrarModalCrear);
  if (btnCerrarCrearX) btnCerrarCrearX.addEventListener('click', cerrarModalCrear);
  if (modalCrear) {
    modalCrear.addEventListener('click', (e) => {
      if (e.target === modalCrear) cerrarModalCrear();
    });
  }

  if (btnTogglePassword && inputPassword && iconoTogglePassword) {
    btnTogglePassword.addEventListener('click', (e) => {
      e.preventDefault();
      if (inputPassword.type === 'password') {
        inputPassword.type = 'text';
        iconoTogglePassword.textContent = 'visibility_off';
      } else {
        inputPassword.type = 'password';
        iconoTogglePassword.textContent = 'visibility';
      }
    });
  }

  if (btnGenerarClave && inputPassword) {
    btnGenerarClave.addEventListener('click', (e) => {
      e.preventDefault();
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#%*';
      let nuevaClave = 'HV.' + Array.from({length: 8}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('') + '*';
      inputPassword.value = nuevaClave;
    });
  }

  if (formCrear) {
    formCrear.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombres = document.getElementById('input-nombres').value.trim();
      const apellidos = document.getElementById('input-apellidos').value.trim();
      const cedulaInput = document.getElementById('input-cedula').value.trim().replace(/\D/g, '');
      const usuarioCorreo = document.getElementById('input-correo').value.trim();
      const correo = usuarioCorreo.includes('@') ? usuarioCorreo : `${usuarioCorreo}@gmail.com`;
      const telefono = document.getElementById('input-telefono').value.trim();
      const id_gerencia = document.getElementById('select-gerencia').value;
      const id_rol = document.getElementById('select-rol').value;
      const password = inputPassword.value;

      if (!nombres || !apellidos || !cedulaInput || !correo || !telefono || !id_gerencia || !id_rol || !password) {
        alert('Por favor complete los campos obligatorios del formulario.');
        return;
      }

      const nuevoUsuarioData = {
        nombres,
        apellidos,
        cedula: cedulaInput,
        correo,
        telefono,
        id_gerencia: Number(id_gerencia),
        id_rol: Number(id_rol),
        password
      };

      try {
        const respuesta = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoUsuarioData)
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
          throw new Error(resultado.message || 'Error al registrar usuario.');
        }
        cerrarModalCrear();
        mostrarToast('Usuario registrado exitosamente en la base de datos');
        cargarUsuariosBD();
      } catch (error) {
        console.error('Error al registrar usuario:', error);
        alert(error.message || 'No se pudo conectar con el servidor.');
      }
    });
  }

  // ================= MODAL EDITAR =================
  const modalEditar = document.getElementById('modal-editar-usuario');
  const btnCerrarEditar = document.getElementById('btn-cerrar-modal-editar');
  const btnCerrarEditarX = document.getElementById('btn-cerrar-modal-editar-x');
  const tablaCuerpoUsuarios = document.getElementById('tabla-usuarios-cuerpo');
  const inputPasswordEditar = document.getElementById('editar-password-temp');
  const btnTogglePasswordEditar = document.getElementById('btn-toggle-password-editar');
  const iconoTogglePasswordEditar = document.getElementById('icono-toggle-password-editar');
  const btnSetDefaultPass = document.getElementById('btn-set-default-pass');

  function abrirModalEditar() {
    if (modalEditar) {
      modalEditar.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function cerrarModalEditar() {
    if (modalEditar) {
      modalEditar.classList.add('hidden');
      document.body.style.overflow = '';
      const formEditar = document.getElementById('form-editar-usuario');
      if (formEditar) formEditar.reset();
      if (inputPasswordEditar) {
        inputPasswordEditar.value = '';
        inputPasswordEditar.type = 'password';
      }
      if (iconoTogglePasswordEditar) {
        iconoTogglePasswordEditar.textContent = 'visibility';
      }
      const inputBuscador = document.getElementById('editar-buscar-usuario');
      if (inputBuscador) inputBuscador.value = '';
    }
  }

  if (btnCerrarEditar) btnCerrarEditar.addEventListener('click', cerrarModalEditar);
  if (btnCerrarEditarX) btnCerrarEditarX.addEventListener('click', cerrarModalEditar);
  if (modalEditar) {
    modalEditar.addEventListener('click', (e) => {
      if (e.target === modalEditar) cerrarModalEditar();
    });
  }

  if (btnTogglePasswordEditar && inputPasswordEditar && iconoTogglePasswordEditar) {
    btnTogglePasswordEditar.addEventListener('click', (e) => {
      e.preventDefault();
      if (inputPasswordEditar.type === 'password') {
        inputPasswordEditar.type = 'text';
        iconoTogglePasswordEditar.textContent = 'visibility_off';
      } else {
        inputPasswordEditar.type = 'password';
        iconoTogglePasswordEditar.textContent = 'visibility';
      }
    });
  }

  if (btnSetDefaultPass && inputPasswordEditar) {
    btnSetDefaultPass.addEventListener('click', (e) => {
      e.preventDefault();
      inputPasswordEditar.type = 'text';
      inputPasswordEditar.value = '%hidrolara123%';
      if (iconoTogglePasswordEditar) {
        iconoTogglePasswordEditar.textContent = 'visibility_off';
      }
    });
  }

  function limpiarFormularioEditar() {
    const userIdInput = document.getElementById('editar-user-id');
    if (userIdInput) userIdInput.value = '';
    
    const campos = ['editar-nombres', 'editar-apellidos', 'editar-cedula', 'editar-correo', 'editar-telefono', 'editar-gerencia', 'editar-rol', 'editar-buscar-usuario', 'editar-password-temp'];
    campos.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    if (inputPasswordEditar) {
      inputPasswordEditar.type = 'password';
    }
    if (iconoTogglePasswordEditar) {
      iconoTogglePasswordEditar.textContent = 'visibility';
    }
    
    const radioActivo = document.querySelector('input[name="editar-estado-radio"][value="Activo"]');
    if (radioActivo) radioActivo.checked = true;

    abrirModalEditar();
  }

  document.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('#btn-editar-rapido');
    if (targetBtn) {
      e.preventDefault();
      limpiarFormularioEditar();
    }
  });

  if (tablaCuerpoUsuarios) {
    tablaCuerpoUsuarios.addEventListener('click', (e) => {
      const btnEditar = e.target.closest('.btn-accion-editar');
      if (btnEditar) {
        const fila = btnEditar.closest('tr');
        const userId = fila.dataset.id;
        const usuarioEncontrado = usuariosDB.find(u => u.id == userId);
        
        if (usuarioEncontrado) {
          poblarFormularioEditar(usuarioEncontrado);
        } else {
          console.warn('Usuario no encontrado en la memoria local');
        }
      }
    });
  }

  function poblarFormularioEditar(usuario) {
    if (!usuario) return;

    document.getElementById('editar-user-id').value = usuario.id;
    document.getElementById('editar-nombres').value = usuario.nombres || '';
    document.getElementById('editar-apellidos').value = usuario.apellidos || '';
    document.getElementById('editar-cedula').value = String(usuario.cedula || '').replace(/\D/g, '');
    
    const correoLimpio = (usuario.correo || '').replace(/@gmail\.com$/i, '');
    document.getElementById('editar-correo').value = correoLimpio;

    const telefonoInput = document.getElementById('editar-telefono');
    if (telefonoInput) telefonoInput.value = usuario.telefono || '';

    if (inputPasswordEditar) {
      inputPasswordEditar.value = '';
      inputPasswordEditar.type = 'password';
    }
    if (iconoTogglePasswordEditar) {
      iconoTogglePasswordEditar.textContent = 'visibility';
    }

    if (document.getElementById('editar-gerencia')) {
      document.getElementById('editar-gerencia').value = usuario.id_gerencia || '';
    }
    
    if (document.getElementById('editar-rol')) {
      document.getElementById('editar-rol').value = usuario.id_rol || '';
    }

    const radioEstado = document.querySelector(`input[name="editar-estado-radio"][value="${usuario.estado || 'Activo'}"]`);
    if (radioEstado) radioEstado.checked = true;

    abrirModalEditar();
  }

  const inputBuscadorEditar = document.getElementById('editar-buscar-usuario');
  const listaResultadosEditar = document.getElementById('lista-coincidencias-editar');
  const btnLimpiarBusquedaEditar = document.getElementById('btn-limpiar-busqueda-editar');

  if (inputBuscadorEditar && listaResultadosEditar) {
    inputBuscadorEditar.addEventListener('input', () => {
      const query = inputBuscadorEditar.value.trim().toLowerCase();
      if (btnLimpiarBusquedaEditar) {
        btnLimpiarBusquedaEditar.classList.toggle('hidden', query.length === 0);
      }

      if (query.length === 0) {
        listaResultadosEditar.classList.add('hidden');
        return;
      }

      const filtrados = usuariosDB.filter(u => 
        (`${u.nombres} ${u.apellidos}`).toLowerCase().includes(query) ||
        String(u.cedula).includes(query) ||
        (u.correo && u.correo.toLowerCase().includes(query))
      );

      if (filtrados.length === 0) {
        listaResultadosEditar.innerHTML = `<div class="p-3 text-body-sm text-outline text-center">No se encontraron coincidencias</div>`;
      } else {
        listaResultadosEditar.innerHTML = filtrados.map(u => `
          <button type="button" class="w-full text-left p-2.5 hover:bg-surface-container-low transition-colors flex items-center justify-between border-b border-surface-container last:border-0 item-coincidencia-editar" data-id="${u.id}">
            <div>
              <span class="font-label-lg text-label-lg text-on-surface block">${u.nombres} ${u.apellidos}</span>
              <span class="text-body-sm text-outline">${formatearCedula(u.cedula)} • ${u.gerencia || ''}</span>
            </div>
          </button>
        `).join('');

        listaResultadosEditar.querySelectorAll('.item-coincidencia-editar').forEach(btn => {
          btn.addEventListener('click', () => {
            const uid = btn.dataset.id;
            const usuarioEncontrado = usuariosDB.find(x => x.id == uid);
            if (usuarioEncontrado) {
              poblarFormularioEditar(usuarioEncontrado);
              listaResultadosEditar.classList.add('hidden');
            }
          });
        });
      }
      listaResultadosEditar.classList.remove('hidden');
    });

    if (btnLimpiarBusquedaEditar) {
      btnLimpiarBusquedaEditar.addEventListener('click', () => {
        inputBuscadorEditar.value = '';
        btnLimpiarBusquedaEditar.classList.add('hidden');
        listaResultadosEditar.classList.add('hidden');
      });
    }
  }

  const formEditar = document.getElementById('form-editar-usuario');

  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = document.getElementById('editar-user-id').value;
      
      if (!userId) {
        alert('Por favor busque y seleccione un usuario utilizando la barra de búsqueda superior dentro del modal.');
        return;
      }

      const nombres = document.getElementById('editar-nombres').value.trim();
      const apellidos = document.getElementById('editar-apellidos').value.trim();
      const cedulaInput = document.getElementById('editar-cedula').value.trim().replace(/\D/g, '');
      const usuarioCorreo = document.getElementById('editar-correo').value.trim();
      const correo = usuarioCorreo.includes('@') ? usuarioCorreo : `${usuarioCorreo}@gmail.com`;
      const telefono = document.getElementById('editar-telefono').value.trim();
      const id_gerencia = document.getElementById('editar-gerencia').value;
      const id_rol = document.getElementById('editar-rol').value;
      const passwordIngresada = inputPasswordEditar ? inputPasswordEditar.value.trim() : '';
      const estado = document.querySelector('input[name="editar-estado-radio"]:checked').value;

      if (!nombres || !apellidos || !cedulaInput || !correo || !telefono || !id_gerencia || !id_rol) {
        alert('Por favor complete todos los campos obligatorios para actualizar.');
        return;
      }

      const usuarioEditadoData = {
        nombres,
        apellidos,
        cedula: cedulaInput,
        correo,
        telefono,
        id_gerencia: Number(id_gerencia),
        id_rol: Number(id_rol),
        estado
      };

      if (passwordIngresada !== '') {
        usuarioEditadoData.password = passwordIngresada;
      }

      try {
        const respuesta = await fetch(`/api/usuarios/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(usuarioEditadoData)
        });
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
          throw new Error(resultado.message || 'Error al actualizar usuario.');
        }

        modalEditar.classList.add('hidden');
        document.body.style.overflow = '';
        
        mostrarToast('Usuario actualizado correctamente');
        cargarUsuariosBD();
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
        alert(error.message || 'No se pudo conectar con el servidor.');
      }
    });
  }

  // ================= MODAL DESACTIVAR / BAJA =================
  const modalDesactivar = document.getElementById('modal-desactivar-usuario');
  const btnCerrarDesactivar = document.getElementById('btn-cerrar-modal-desactivar');
  const btnCerrarDesactivarX = document.getElementById('btn-cerrar-modal-desactivar-x');
  const btnConfirmarBaja = document.getElementById('btn-confirmar-baja');
  const btnAbrirDesactivarSuperior = document.getElementById('btn-eliminar-seleccion');
  const inputBuscadorBaja = document.getElementById('baja-input-buscador');
  const listaResultadosBaja = document.getElementById('baja-lista-coincidencias');

  function poblarTarjetaBaja(usuario) {
    if (!usuario) return;
    usuarioSeleccionadoParaBaja = usuario;

    const iniciales = (usuario.nombres.charAt(0) + (usuario.apellidos ? usuario.apellidos.charAt(0) : '')).toUpperCase();
    const elAvatar = document.getElementById('baja-avatar-iniciales');
    const elNombre = document.getElementById('baja-nombre-empleado');
    const elCedula = document.getElementById('baja-cedula-empleado');
    const elGerencia = document.getElementById('baja-gerencia-empleado');
    const elCorreo = document.getElementById('baja-correo-empleado');

    if (elAvatar) elAvatar.textContent = iniciales;
    if (elNombre) elNombre.textContent = `${usuario.nombres} ${usuario.apellidos}`;
    if (elCedula) elCedula.textContent = formatearCedula(usuario.cedula);
    if (elGerencia) elGerencia.textContent = usuario.gerencia || 'Sin Gerencia';
    if (elCorreo) elCorreo.textContent = usuario.correo || '';
    
    if (inputBuscadorBaja) inputBuscadorBaja.value = `${usuario.nombres} ${usuario.apellidos}`;
  }

  function abrirModalBaja(usuario) {
    if (!modalDesactivar) return;
    
    if (usuario) {
      poblarTarjetaBaja(usuario);
    } else {
      usuarioSeleccionadoParaBaja = null;
      if (inputBuscadorBaja) inputBuscadorBaja.value = '';
      document.getElementById('baja-nombre-empleado').textContent = 'Busque y seleccione un empleado...';
      document.getElementById('baja-cedula-empleado').textContent = '--';
      document.getElementById('baja-gerencia-empleado').textContent = '--';
      document.getElementById('baja-correo-empleado').textContent = '--';
      document.getElementById('baja-avatar-iniciales').textContent = '--';
    }

    if (listaResultadosBaja) listaResultadosBaja.classList.add('hidden');
    modalDesactivar.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function cerrarModalBaja() {
    if (modalDesactivar) {
      modalDesactivar.classList.add('hidden');
      document.body.style.overflow = '';
      usuarioSeleccionadoParaBaja = null;
      if (inputBuscadorBaja) inputBuscadorBaja.value = '';
      if (listaResultadosBaja) listaResultadosBaja.classList.add('hidden');
    }
  }

  if (btnCerrarDesactivar) btnCerrarDesactivar.addEventListener('click', cerrarModalBaja);
  if (btnCerrarDesactivarX) btnCerrarDesactivarX.addEventListener('click', cerrarModalBaja);
  if (modalDesactivar) {
    modalDesactivar.addEventListener('click', (e) => {
      if (e.target === modalDesactivar) cerrarModalBaja();
    });
  }

  if (inputBuscadorBaja && listaResultadosBaja) {
    inputBuscadorBaja.addEventListener('input', () => {
      const query = inputBuscadorBaja.value.trim().toLowerCase();

      if (query.length === 0) {
        listaResultadosBaja.classList.add('hidden');
        return;
      }

      const filtrados = usuariosDB.filter(u => 
        (`${u.nombres} ${u.apellidos}`).toLowerCase().includes(query) ||
        String(u.cedula).includes(query) ||
        (u.correo && u.correo.toLowerCase().includes(query))
      );

      if (filtrados.length === 0) {
        listaResultadosBaja.innerHTML = `<div class="p-3 text-body-sm text-outline text-center">No se encontraron empleados</div>`;
      } else {
        listaResultadosBaja.innerHTML = filtrados.map(u => `
          <button type="button" class="w-full text-left p-2.5 hover:bg-surface-container-low transition-colors flex items-center justify-between border-b border-surface-container last:border-0 item-coincidencia-baja" data-id="${u.id}">
            <div>
              <span class="font-label-lg text-label-lg text-on-surface block">${u.nombres} ${u.apellidos}</span>
              <span class="text-body-sm text-outline">Cédula: ${formatearCedula(u.cedula)} • ${u.gerencia || ''}</span>
            </div>
          </button>
        `).join('');

        listaResultadosBaja.querySelectorAll('.item-coincidencia-baja').forEach(btn => {
          btn.addEventListener('click', () => {
            const uid = btn.dataset.id;
            const usuarioEncontrado = usuariosDB.find(x => x.id == uid);
            if (usuarioEncontrado) {
              poblarTarjetaBaja(usuarioEncontrado);
              listaResultadosBaja.classList.add('hidden');
            }
          });
        });
      }
      listaResultadosBaja.classList.remove('hidden');
    });
  }

  if (btnAbrirDesactivarSuperior) {
    btnAbrirDesactivarSuperior.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalBaja(null);
    });
  }

  if (tablaCuerpoUsuarios) {
    tablaCuerpoUsuarios.addEventListener('click', (e) => {
      const btnBaja = e.target.closest('.btn-accion-baja');
      if (btnBaja) {
        const fila = btnBaja.closest('tr');
        const userId = fila.dataset.id;
        const usuarioEncontrado = usuariosDB.find(u => u.id == userId);
        if (usuarioEncontrado) {
          abrirModalBaja(usuarioEncontrado);
        }
      }
    });
  }

  if (btnConfirmarBaja) {
    btnConfirmarBaja.addEventListener('click', async () => {
      if (!usuarioSeleccionadoParaBaja) {
        alert('Por favor busque y seleccione un empleado para dar de baja.');
        return;
      }

      const selectMotivo = document.getElementById('select-motivo-baja');
      const motivo = selectMotivo ? selectMotivo.value : 'Baja lógica';
      const observacionesInput = document.getElementById('input-observaciones-baja');
      const observaciones = observacionesInput ? observacionesInput.value.trim() : '';

      try {
        const respuesta = await fetch(`/api/usuarios/${usuarioSeleccionadoParaBaja.id}/baja`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: 'Inactivo',
            motivo: motivo,
            observaciones: observaciones
          })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
          throw new Error(resultado.message || 'No se pudo desactivar el usuario.');
        }

        cerrarModalBaja();
        mostrarToast('Usuario dado de baja exitosamente');
        cargarUsuariosBD();
      } catch (error) {
        console.error('Error al dar de baja:', error);
        alert(error.message || 'Error al conectar con el servidor.');
      }
    });
  }

  // ================= FILTROS Y PAGINACIÓN =================
  const inputBusqueda = document.getElementById('filtro-busqueda');
  const selectGerencia = document.getElementById('filtro-gerencia');
  const selectRol = document.getElementById('filtro-rol');
  const selectEstado = document.getElementById('filtro-estado');
  const selectLimitePag = document.getElementById('select-limite-pag');

  function aplicarFiltros() {
    const q = (inputBusqueda.value || '').toLowerCase().trim();
    const gerencia = selectGerencia.value;
    const rol = selectRol.value;
    const estado = selectEstado.value;

    const listaFiltrada = usuariosDB.filter(u => {
      const nombreCompleto = `${u.nombres} ${u.apellidos}`.toLowerCase();
      const cedulaStr = String(u.cedula || '').toLowerCase();
      const correoStr = (u.correo || '').toLowerCase();
      const gerenciaStr = (u.gerencia || '').toLowerCase();
      const rolStr = (u.rol || '').toLowerCase();
      const estadoStr = (u.estado || '').toLowerCase();

      const coincideBusqueda = !q || nombreCompleto.includes(q) || cedulaStr.includes(q) || correoStr.includes(q);
      const coincideGerencia = gerencia === 'todas' || gerenciaStr.includes(gerencia.toLowerCase());
      const coincideRol = rol === 'todos' || rolStr.includes(rol.toLowerCase());
      
      let coincideEstado = false;
      if (estado === 'todos') {
        if (u.estado === 'Activo') {
          coincideEstado = true;
        } else if (u.estado === 'Inactivo' && q !== '') {
          coincideEstado = true;
        }
      } else {
        coincideEstado = estadoStr === estado.toLowerCase();
      }

      return coincideBusqueda && coincideGerencia && coincideRol && coincideEstado;
    });

    renderizarTablaPaginada(listaFiltrada);
  }

  if (inputBusqueda) inputBusqueda.addEventListener('input', () => { paginaActual = 1; aplicarFiltros(); });
  if (selectGerencia) selectGerencia.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });
  if (selectRol) selectRol.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });
  if (selectEstado) selectEstado.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });
  
  if (selectLimitePag) {
    selectLimitePag.addEventListener('change', (e) => {
      registrosPorPagina = Number(e.target.value);
      paginaActual = 1;
      aplicarFiltros();
    });
  }
})();