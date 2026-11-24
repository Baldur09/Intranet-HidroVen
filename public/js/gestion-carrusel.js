(function () {
  let carruselDB = [];
  let paginaActual = 1;
  let registrosPorPagina = 10;
  let tempObjectUrl = null;

  const toast = document.getElementById('toast-notificacion');
  const toastMensaje = document.getElementById('toast-mensaje');
  const toastIcono = document.getElementById('toast-icono');

  function mostrarToast(texto, tipo = 'success') {
    if (!toast) return;
    toastMensaje.textContent = texto;
    if (toastIcono) {
      toastIcono.textContent = tipo === 'error' ? 'error' : 'check_circle';
      toastIcono.className = tipo === 'error'
        ? 'material-symbols-outlined text-red-400 text-[22px]'
        : 'material-symbols-outlined text-secondary-container text-[22px]';
    }
    toast.classList.remove('hidden');
    toast.classList.add('flex');
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('flex');
    }, 3500);
  }

  function actualizarKPIs(lista) {
    const kpiActivos = document.getElementById('kpi-carrusel-activos');
    const kpiTotal = document.getElementById('kpi-carrusel-total');
    const kpiInactivos = document.getElementById('kpi-carrusel-inactivos');

    if (kpiActivos) kpiActivos.textContent = lista.filter(x => x.estado === 'Activo').length;
    if (kpiTotal) kpiTotal.textContent = lista.length;
    if (kpiInactivos) kpiInactivos.textContent = lista.filter(x => x.estado === 'Inactivo').length;
  }

  async function cargarCarrusel() {
    try {
      const res = await fetch('/api/carrusel');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      carruselDB = (data.slides || []).map((item, idx) => ({
        ...item,
        ordenCreacion: idx + 1
      }));

      actualizarKPIs(carruselDB);
      aplicarFiltros();
    } catch (err) {
      console.error('Error cargando carrusel:', err);
      mostrarToast('Error al cargar las fotos del carrusel.', 'error');
    }
  }

  // ================= MODAL & VISTA PREVIA =================
  const modalCarrusel = document.getElementById('modal-carrusel');
  const formCarrusel = document.getElementById('form-carrusel');
  const inputIdEditar = document.getElementById('carrusel-id-editar');
  const inputImagenActual = document.getElementById('carrusel-imagen-actual');
  const inputTitulo = document.getElementById('input-carrusel-titulo');
  const inputUbicacion = document.getElementById('input-carrusel-ubicacion');
  const inputArchivo = document.getElementById('input-carrusel-archivo');
  const labelArchivo = document.getElementById('label-carrusel-archivo');
  const modalTitulo = document.getElementById('modal-carrusel-titulo');
  const textoBtnSubmit = document.getElementById('texto-btn-submit-carrusel');

  const previewImg = document.getElementById('preview-carrusel-img');
  const previewPlaceholder = document.getElementById('preview-carrusel-placeholder');
  const previewTitulo = document.getElementById('preview-carrusel-titulo');

  function actualizarPreview(url = '') {
    if (previewTitulo) {
      previewTitulo.textContent = (inputTitulo?.value || '').trim() || 'Nombre del embalse o planta';
    }
    if (!previewImg) return;

    if (url) {
      previewImg.style.backgroundImage = `url("${url}")`;
      previewPlaceholder?.classList.add('hidden');
    } else if (!inputArchivo?.files?.[0]) {
      previewImg.style.backgroundImage = '';
      previewPlaceholder?.classList.remove('hidden');
    }
  }

  inputTitulo?.addEventListener('input', () => {
    const actual = inputImagenActual?.value || '';
    const file = inputArchivo?.files?.[0];
    actualizarPreview(file && tempObjectUrl ? tempObjectUrl : actual);
  });

  inputArchivo?.addEventListener('change', () => {
    if (tempObjectUrl) {
      URL.revokeObjectURL(tempObjectUrl);
      tempObjectUrl = null;
    }
    const file = inputArchivo.files?.[0];
    if (file) {
      tempObjectUrl = URL.createObjectURL(file);
      actualizarPreview(tempObjectUrl);
    } else {
      actualizarPreview(inputImagenActual?.value || '');
    }
  });

  function abrirModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function cerrarModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    if (tempObjectUrl) {
      URL.revokeObjectURL(tempObjectUrl);
      tempObjectUrl = null;
    }
  }

  document.getElementById('btn-abrir-modal-carrusel')?.addEventListener('click', () => {
    formCarrusel?.reset();
    if (inputIdEditar) inputIdEditar.value = '';
    if (inputImagenActual) inputImagenActual.value = '';
    if (inputArchivo) inputArchivo.required = true;
    if (labelArchivo) labelArchivo.textContent = 'Subir foto desde PC *';
    if (modalTitulo) modalTitulo.textContent = 'Añadir Foto al Carrusel';
    if (textoBtnSubmit) textoBtnSubmit.textContent = 'Guardar Foto';
    document.querySelector('input[name="radio-estado-carrusel"][value="Activo"]').checked = true;
    actualizarPreview('');
    abrirModal(modalCarrusel);
  });

  document.getElementById('btn-cerrar-modal-carrusel')?.addEventListener('click', () => cerrarModal(modalCarrusel));
  document.getElementById('btn-cerrar-modal-carrusel-x')?.addEventListener('click', () => cerrarModal(modalCarrusel));
  modalCarrusel?.addEventListener('click', (e) => {
    if (e.target === modalCarrusel) cerrarModal(modalCarrusel);
  });

  // ================= GUARDAR / EDITAR FOTO =================
  formCarrusel?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idEditar = inputIdEditar?.value.trim() || '';
    const titulo = inputTitulo?.value.trim() || '';
    const ubicacion = inputUbicacion?.value.trim() || '';
    const estado = document.querySelector('input[name="radio-estado-carrusel"]:checked')?.value || 'Activo';
    const archivo = inputArchivo?.files?.[0];

    if (!titulo || !ubicacion) {
      mostrarToast('Complete el nombre y la ubicación.', 'error');
      return;
    }

    if (!idEditar && !archivo) {
      mostrarToast('Seleccione una foto desde su PC.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('ubicacion', ubicacion);
    formData.append('estado', estado);
    if (archivo) {
      formData.append('imagenArchivo', archivo);
    }

    const endpoint = idEditar ? `/api/carrusel/${idEditar}` : '/api/carrusel';
    const method = idEditar ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, { method, body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      cerrarModal(modalCarrusel);
      mostrarToast(idEditar ? 'Foto actualizada correctamente' : 'Foto añadida al carrusel');
      await cargarCarrusel();
    } catch (err) {
      mostrarToast(err.message || 'Error al guardar la foto.', 'error');
    }
  });

  // ================= TABLA Y PAGINACIÓN =================
  function renderizarTabla(lista) {
    const tbody = document.getElementById('tabla-carrusel-body');
    const spanInicio = document.getElementById('paginacion-inicio');
    const spanFin = document.getElementById('paginacion-fin');
    const spanTotal = document.getElementById('paginacion-total');
    const contenedorBotones = document.getElementById('contenedor-botones-paginacion');

    if (!tbody) return;
    const total = lista.length;
    spanTotal.textContent = total;

    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-outline">No hay fotos registradas que coincidan con los filtros.</td></tr>`;
      spanInicio.textContent = 0;
      spanFin.textContent = 0;
      contenedorBotones.innerHTML = '';
      return;
    }

    const totalPaginas = Math.ceil(total / registrosPorPagina);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    if (paginaActual < 1) paginaActual = 1;

    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = Math.min(inicio + registrosPorPagina, total);
    const paginados = lista.slice(inicio, fin);

    spanInicio.textContent = inicio + 1;
    spanFin.textContent = fin;

    tbody.innerHTML = paginados.map(item => {
      const esActivo = item.estado === 'Activo';
      return `
        <tr class="hover:bg-surface-container-low/50 transition-colors ${!esActivo ? 'opacity-75' : ''}" data-id="${item.id}">
          <td class="py-3.5 px-4 font-mono text-on-surface-variant">#${item.ordenCreacion}</td>
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-3">
              <div class="w-16 h-11 rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden flex-shrink-0">
                <img src="${item.imagen}" alt="${item.titulo}" loading="lazy" class="w-full h-full object-cover" onerror="this.style.display='none';">
              </div>
              <span class="font-label-lg text-label-lg text-on-surface truncate max-w-[280px]">${item.titulo}</span>
            </div>
          </td>
          <td class="py-3.5 px-4 text-on-surface-variant">${item.ubicacion}</td>
          <td class="py-3.5 px-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-caps text-label-caps ${esActivo ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}">
              <span class="w-1.5 h-1.5 rounded-full ${esActivo ? 'bg-secondary' : 'bg-error'}"></span>
              ${item.estado}
            </span>
          </td>
          <td class="py-3.5 px-4 text-center">
            <div class="inline-flex items-center justify-center gap-1">
              <button class="btn-editar-carrusel w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer" title="Editar foto" type="button" translate="no">
                <span class="material-symbols-outlined text-[20px]" translate="no">edit</span>
              </button>
              <button class="btn-estado-carrusel w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant ${esActivo ? 'hover:text-error' : 'hover:text-secondary'} transition-colors cursor-pointer" title="${esActivo ? 'Desactivar foto' : 'Activar foto'}" type="button" translate="no">
                <span class="material-symbols-outlined text-[20px]" translate="no">${esActivo ? 'block' : 'check_circle'}</span>
              </button>
              <button class="btn-eliminar-carrusel w-9 h-9 rounded-lg flex items-center justify-center hover:bg-error-container text-on-surface-variant hover:text-error transition-colors cursor-pointer" title="Eliminar foto" type="button" translate="no">
                <span class="material-symbols-outlined text-[20px]" translate="no">delete</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    let htmlBotones = `
      <button class="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container transition-all ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}" ${paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPaginaCarrusel(${paginaActual - 1})">Anterior</button>
    `;
    for (let i = 1; i <= totalPaginas; i++) {
      htmlBotones += `
        <button class="w-8 h-8 rounded-lg text-xs font-semibold transition-all ${i === paginaActual ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest border border-surface-container-high text-on-surface hover:bg-surface-container'} cursor-pointer" onclick="cambiarPaginaCarrusel(${i})">${i}</button>
      `;
    }
    htmlBotones += `
      <button class="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container transition-all ${paginaActual === totalPaginas ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}" ${paginaActual === totalPaginas ? 'disabled' : ''} onclick="cambiarPaginaCarrusel(${paginaActual + 1})">Siguiente</button>
    `;
    contenedorBotones.innerHTML = htmlBotones;
  }

  window.cambiarPaginaCarrusel = function (pag) {
    paginaActual = pag;
    aplicarFiltros();
  };

  // ================= ACCIONES DE FILA =================
  document.getElementById('tabla-carrusel-body')?.addEventListener('click', async (e) => {
    const fila = e.target.closest('tr');
    if (!fila) return;
    const id = fila.dataset.id;
    const slide = carruselDB.find(x => String(x.id) === String(id));
    if (!slide) return;

    if (e.target.closest('.btn-editar-carrusel')) {
      if (inputIdEditar) inputIdEditar.value = slide.id;
      if (inputImagenActual) inputImagenActual.value = slide.imagen;
      if (inputTitulo) inputTitulo.value = slide.titulo;
      if (inputUbicacion) inputUbicacion.value = slide.ubicacion;
      if (inputArchivo) {
        inputArchivo.value = '';
        inputArchivo.required = false;
      }
      if (labelArchivo) labelArchivo.textContent = 'Cambiar foto (opcional)';
      if (modalTitulo) modalTitulo.textContent = 'Editar Foto del Carrusel';
      if (textoBtnSubmit) textoBtnSubmit.textContent = 'Actualizar Foto';

      document.getElementsByName('radio-estado-carrusel').forEach(r => {
        r.checked = (r.value === slide.estado);
      });

      actualizarPreview(slide.imagen);
      abrirModal(modalCarrusel);
      return;
    }

    if (e.target.closest('.btn-estado-carrusel')) {
      const nuevoEstado = slide.estado === 'Activo' ? 'Inactivo' : 'Activo';
      try {
        const res = await fetch(`/api/carrusel/${id}/estado`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        mostrarToast(`Foto marcada como ${nuevoEstado}`);
        await cargarCarrusel();
      } catch (err) {
        mostrarToast(err.message || 'Error al cambiar estado', 'error');
      }
      return;
    }

    if (e.target.closest('.btn-eliminar-carrusel')) {
      if (!window.confirm(`¿Eliminar "${slide.titulo}" del carrusel?`)) return;
      try {
        const res = await fetch(`/api/carrusel/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        mostrarToast('Foto eliminada del carrusel');
        await cargarCarrusel();
      } catch (err) {
        mostrarToast(err.message || 'Error al eliminar foto', 'error');
      }
    }
  });

  // ================= FILTROS =================
  const inputBusqueda = document.getElementById('filtro-busqueda-carrusel');
  const filtroEstado = document.getElementById('filtro-estado-carrusel');

  function aplicarFiltros() {
    const q = (inputBusqueda?.value || '').toLowerCase().trim();
    const est = filtroEstado?.value || 'all';

    const filtrados = carruselDB.filter(item => {
      const matchQ = !q || item.titulo.toLowerCase().includes(q) || item.ubicacion.toLowerCase().includes(q);
      const matchEst = est === 'all' || item.estado === est;
      return matchQ && matchEst;
    });

    renderizarTabla(filtrados);
  }

  inputBusqueda?.addEventListener('input', () => { paginaActual = 1; aplicarFiltros(); });
  filtroEstado?.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });

  document.getElementById('btn-limpiar-filtros-carrusel')?.addEventListener('click', () => {
    if (inputBusqueda) inputBusqueda.value = '';
    if (filtroEstado) filtroEstado.value = 'all';
    paginaActual = 1;
    aplicarFiltros();
  });

  document.getElementById('select-limite-pag')?.addEventListener('change', (e) => {
    registrosPorPagina = Number(e.target.value);
    paginaActual = 1;
    aplicarFiltros();
  });

  cargarCarrusel();
})();