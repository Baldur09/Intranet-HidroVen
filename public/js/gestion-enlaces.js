(function () {
  let pantallasDB = [];
  let subdivisionesDB = [];
  let enlacesDB = [];
  let paginaActual = 1;
  let registrosPorPagina = 10;

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

  function extraerDominioBase(hostname) {
    const limpio = hostname.replace(/^www\./i, '');
    const partes = limpio.split('.');
    const tldsCompuestos = ['gob', 'gov', 'com', 'org', 'edu', 'net', 'mil'];

    if (partes.length > 2) {
      const penultima = partes[partes.length - 2].toLowerCase();
      if (tldsCompuestos.includes(penultima) && partes.length > 3) {
        return partes.slice(-3).join('.');
      }
      if (!tldsCompuestos.includes(penultima)) {
        return partes.slice(-2).join('.');
      }
    }
    return limpio;
  }

  function construirUrlLogoAutomatico(dominioBase) {
    const googleFavicon = encodeURIComponent(`https://www.google.com/s2/favicons?domain=${dominioBase}&sz=128`);
    return `https://unavatar.io/${dominioBase}?fallback=${googleFavicon}`;
  }

  // ================= CARGA DE DATOS DESDE API =================
  async function inicializarDatos() {
    await Promise.all([cargarPantallas(), cargarSubdivisiones(), cargarEnlaces()]);
  }

  async function cargarPantallas() {
    try {
      const res = await fetch('/api/pantallas');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      pantallasDB = data.pantallas;
      document.getElementById('kpi-pantallas').textContent = pantallasDB.filter(p => p.estado === 'Activo').length;

      const filtroPantalla = document.getElementById('filtro-pantalla');
      if (filtroPantalla) {
        filtroPantalla.replaceChildren(new Option('Todas las Pantallas', 'all'));
        pantallasDB.forEach(p => filtroPantalla.add(new Option(p.nombre, p.Id)));
      }

      ['select-enlace-pantalla', 'select-subdivision-pantalla'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
          sel.replaceChildren(new Option('Seleccione Pantalla...', ''));
          pantallasDB.filter(p => p.estado === 'Activo').forEach(p => sel.add(new Option(p.nombre, p.Id)));
        }
      });
    } catch (err) {
      console.error('Error cargando pantallas:', err);
      mostrarToast('Error al cargar las pantallas disponibles.', 'error');
    }
  }

  async function cargarSubdivisiones() {
    try {
      const res = await fetch('/api/subdivisiones');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      subdivisionesDB = data.subdivisiones;
      document.getElementById('kpi-subdivisiones').textContent = subdivisionesDB.filter(s => s.estado === 'Activo').length;

      actualizarSelectFiltroSubdivisiones('all');
    } catch (err) {
      console.error('Error cargando subdivisiones:', err);
      mostrarToast('Error al cargar las subdivisiones.', 'error');
    }
  }

  async function cargarEnlaces() {
    try {
      const res = await fetch('/api/enlaces');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      enlacesDB = data.enlaces;
      document.getElementById('kpi-enlaces-activos').textContent = enlacesDB.filter(e => e.estado === 'Activo').length;
      aplicarFiltros();
    } catch (err) {
      console.error('Error cargando enlaces:', err);
      mostrarToast('Error al cargar los enlaces registrados.', 'error');
    }
  }

  // ================= SELECTORES EN CASCADA =================
  function poblarSubdivisionesPorPantalla(idPantalla, idSubSeleccionada = '') {
    const selSub = document.getElementById('select-enlace-subdivision');
    if (!selSub) return;

    if (!idPantalla) {
      selSub.replaceChildren(new Option('Primero elija pantalla...', ''));
      selSub.disabled = true;
      return;
    }

    const filtradas = subdivisionesDB.filter(s => String(s.id_pantalla) === String(idPantalla) && s.estado === 'Activo');
    selSub.replaceChildren(new Option(filtradas.length ? 'Seleccione Subdivisión...' : 'Sin subdivisiones (cree una con +)', ''));
    filtradas.forEach(s => selSub.add(new Option(s.nombre, s.Id)));
    selSub.disabled = false;

    if (idSubSeleccionada) {
      selSub.value = String(idSubSeleccionada);
    }
  }

  const selectEnlacePantalla = document.getElementById('select-enlace-pantalla');
  selectEnlacePantalla?.addEventListener('change', (e) => {
    poblarSubdivisionesPorPantalla(e.target.value);
  });

  function actualizarSelectFiltroSubdivisiones(idPantalla) {
    const filtroSub = document.getElementById('filtro-subdivision');
    if (!filtroSub) return;

    filtroSub.replaceChildren(new Option('Todas las Subdivisiones', 'all'));
    const lista = idPantalla === 'all'
      ? subdivisionesDB
      : subdivisionesDB.filter(s => String(s.id_pantalla) === String(idPantalla));

    lista.forEach(s => filtroSub.add(new Option(s.nombre, s.Id)));
  }

  // ================= VISTA PREVIA AUTOMÁTICA DE LOGO =================
  const inputUrl = document.getElementById('input-enlace-url');
  const inputLogo = document.getElementById('input-enlace-logo');
  const inputArchivo = document.getElementById('input-enlace-archivo');
  const spanNombreArchivo = document.getElementById('nombre-archivo-logo');
  const btnQuitarArchivo = document.getElementById('btn-quitar-archivo-logo');
  const previewBox = document.getElementById('preview-logo-box');

  function actualizarPreviewLogo() {
    if (!previewBox) return;
    const archivo = inputArchivo?.files?.[0];
    const logoManual = inputLogo?.value.trim() || '';
    const logoActual = document.getElementById('enlace-logo-actual')?.value || '';
    const urlSitio = inputUrl?.value.trim() || '';

    // 1. Archivo recién seleccionado en PC
    if (archivo) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewBox.innerHTML = `<img src="${e.target.result}" alt="Logo" class="w-full h-full object-contain">`;
      };
      reader.readAsDataURL(archivo);
      return;
    }

    // 2. URL manual, logo local guardado o logo automático con respaldo
    let srcFinal = '';
    let fallbackUrl = '';
    if (logoManual) {
      srcFinal = logoManual;
    } else if (logoActual && logoActual.startsWith('/images/logos/')) {
      srcFinal = logoActual;
    } else if (urlSitio) {
      try {
        const urlConProtocolo = /^https?:\/\//i.test(urlSitio) ? urlSitio : `https://${urlSitio}`;
        const hostname = new URL(urlConProtocolo).hostname;
        const dominioBase = extraerDominioBase(hostname);
        srcFinal = construirUrlLogoAutomatico(dominioBase);
        fallbackUrl = `https://www.google.com/s2/favicons?domain=${dominioBase}&sz=128`;
      } catch (e) {
        srcFinal = '';
      }
    }

    if (srcFinal) {
      const manejarErrorImg = fallbackUrl
        ? `if (!this.dataset.fallbackUsed) { this.dataset.fallbackUsed = '1'; this.src = '${fallbackUrl}'; } else { this.parentElement.innerHTML = '<span class=\\'material-symbols-outlined text-outline text-[22px]\\'>broken_image</span>'; }`
        : `this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-outline text-[22px]\\'>broken_image</span>'`;

      previewBox.innerHTML = `<img src="${srcFinal}" alt="Logo" class="w-full h-full object-contain" onerror="${manejarErrorImg}">`;
    } else {
      previewBox.innerHTML = `<span class="material-symbols-outlined text-outline text-[22px]">language</span>`;
    }
  }

  inputArchivo?.addEventListener('change', () => {
    const archivo = inputArchivo.files?.[0];
    if (archivo) {
      if (spanNombreArchivo) spanNombreArchivo.textContent = archivo.name;
      btnQuitarArchivo?.classList.remove('hidden');
    } else {
      if (spanNombreArchivo) spanNombreArchivo.textContent = '';
      btnQuitarArchivo?.classList.add('hidden');
    }
    actualizarPreviewLogo();
  });

  btnQuitarArchivo?.addEventListener('click', () => {
    if (inputArchivo) inputArchivo.value = '';
    const inputLogoActual = document.getElementById('enlace-logo-actual');
    if (inputLogoActual && inputLogoActual.value.startsWith('/images/logos/')) {
      inputLogoActual.value = '';
    }
    if (spanNombreArchivo) spanNombreArchivo.textContent = '';
    btnQuitarArchivo.classList.add('hidden');
    actualizarPreviewLogo();
  });

  inputUrl?.addEventListener('input', actualizarPreviewLogo);

  inputLogo?.addEventListener('input', () => {
    if (inputLogo.value.trim() !== '' && inputArchivo?.files?.length) {
      inputArchivo.value = '';
      if (spanNombreArchivo) spanNombreArchivo.textContent = '';
      btnQuitarArchivo?.classList.add('hidden');
    }
    actualizarPreviewLogo();
  });

  // ================= MODALES =================
  const modalEnlace = document.getElementById('modal-enlace');
  const modalSubdivision = document.getElementById('modal-subdivision');

  function abrirModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function cerrarModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  document.getElementById('btn-abrir-modal-enlace')?.addEventListener('click', () => {
    document.getElementById('modal-enlace-titulo-texto').textContent = 'Añadir Nuevo Enlace';
    document.getElementById('enlace-id-editar').value = '';
    document.getElementById('enlace-logo-actual').value = '';
    document.getElementById('form-enlace').reset();
    if (inputArchivo) inputArchivo.value = '';
    if (spanNombreArchivo) spanNombreArchivo.textContent = '';
    btnQuitarArchivo?.classList.add('hidden');
    poblarSubdivisionesPorPantalla('');
    actualizarPreviewLogo();
    abrirModal(modalEnlace);
  });

  document.getElementById('btn-abrir-modal-subdivision')?.addEventListener('click', () => {
    document.getElementById('form-subdivision').reset();
    abrirModal(modalSubdivision);
  });

  document.getElementById('btn-quick-subdivision')?.addEventListener('click', () => {
    const pantallaActual = document.getElementById('select-enlace-pantalla').value;
    document.getElementById('form-subdivision').reset();
    if (pantallaActual) {
      document.getElementById('select-subdivision-pantalla').value = pantallaActual;
    }
    cerrarModal(modalEnlace);
    abrirModal(modalSubdivision);
  });

  document.querySelectorAll('.btn-cerrar-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.modal);
      cerrarModal(target);
    });
  });

  [modalEnlace, modalSubdivision].forEach(m => {
    m?.addEventListener('click', (e) => {
      if (e.target === m) cerrarModal(m);
    });
  });

  // ================= GUARDAR SUBDIVISIÓN =================
  document.getElementById('form-subdivision')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_pantalla = document.getElementById('select-subdivision-pantalla').value;
    const nombre = document.getElementById('input-subdivision-nombre').value.trim();

    if (!id_pantalla || !nombre) return;

    try {
      const res = await fetch('/api/subdivisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pantalla, nombre })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      cerrarModal(modalSubdivision);
      mostrarToast('Subdivisión creada correctamente');
      await cargarSubdivisiones();
    } catch (err) {
      mostrarToast(err.message || 'Error al crear la subdivisión', 'error');
    }
  });

  // ================= GUARDAR / EDITAR ENLACE (FORMDATA + MULTER) =================
  document.getElementById('form-enlace')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idEditar = document.getElementById('enlace-id-editar').value;
    const id_subdivision = document.getElementById('select-enlace-subdivision').value;
    const titulo = document.getElementById('input-enlace-titulo').value.trim();
    const url = document.getElementById('input-enlace-url').value.trim();
    const logo = document.getElementById('input-enlace-logo').value.trim();
    const logoActual = document.getElementById('enlace-logo-actual').value;
    const estado = document.querySelector('input[name="radio-estado"]:checked')?.value || 'Activo';
    const archivo = inputArchivo?.files?.[0];

    if (!id_subdivision || !titulo || !url) {
      mostrarToast('Complete todos los campos obligatorios.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('url', url);
    formData.append('logo', logo);
    formData.append('logoActual', logoActual);
    formData.append('id_subdivision', id_subdivision);
    formData.append('estado', estado);
    if (archivo) {
      formData.append('logoArchivo', archivo);
    }

    const endpoint = idEditar ? `/api/enlaces/${idEditar}` : '/api/enlaces';
    const method = idEditar ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      cerrarModal(modalEnlace);
      mostrarToast(idEditar ? 'Enlace actualizado correctamente' : 'Enlace añadido correctamente');
      await cargarEnlaces();
    } catch (err) {
      mostrarToast(err.message || 'Error al guardar el enlace', 'error');
    }
  });

  // ================= RENDERIZADO DE TABLA Y PAGINACIÓN =================
  function renderizarTabla(lista) {
    const tbody = document.getElementById('tabla-enlaces-body');
    const spanInicio = document.getElementById('paginacion-inicio');
    const spanFin = document.getElementById('paginacion-fin');
    const spanTotal = document.getElementById('paginacion-total');
    const contenedorBotones = document.getElementById('contenedor-botones-paginacion');

    if (!tbody) return;
    const total = lista.length;
    spanTotal.textContent = total;

    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-outline">No hay enlaces registrados que coincidan con los filtros.</td></tr>`;
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
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden">
                <img src="${item.logo}" alt="${item.titulo}" loading="lazy" class="w-full h-full object-contain" onerror="this.src='/images/default-link.png'">
              </div>
              <div class="min-w-0">
                <span class="font-label-lg text-label-lg text-on-surface block truncate">${item.titulo}</span>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-body-sm text-tertiary hover:text-primary transition-colors block truncate max-w-[300px]">${item.url}</a>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-fixed/60 text-on-primary-fixed-variant font-label-md text-label-md">
              ${item.pantalla}
            </span>
          </td>
          <td class="py-3.5 px-4 text-on-surface-variant">
            ${item.subdivision}
          </td>
          <td class="py-3.5 px-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-caps text-label-caps ${esActivo ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}">
              <span class="w-1.5 h-1.5 rounded-full ${esActivo ? 'bg-secondary' : 'bg-error'}"></span>
              ${item.estado}
            </span>
          </td>
          <td class="py-3.5 px-4 text-center">
            <div class="inline-flex items-center justify-center gap-1">
              <button class="btn-editar-enlace w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer" title="Editar enlace" type="button">
                <span class="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button class="btn-estado-enlace w-9 h-9 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface-variant ${esActivo ? 'hover:text-error' : 'hover:text-secondary'} transition-colors cursor-pointer" title="${esActivo ? 'Desactivar enlace' : 'Activar enlace'}" type="button">
                <span class="material-symbols-outlined text-[20px]">${esActivo ? 'block' : 'check_circle'}</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    let htmlBotones = `
      <button class="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container transition-all ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}" ${paginaActual === 1 ? 'disabled' : ''} onclick="cambiarPaginaEnlaces(${paginaActual - 1})">Anterior</button>
    `;
    for (let i = 1; i <= totalPaginas; i++) {
      htmlBotones += `
        <button class="w-8 h-8 rounded-lg text-xs font-semibold transition-all ${i === paginaActual ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest border border-surface-container-high text-on-surface hover:bg-surface-container'} cursor-pointer" onclick="cambiarPaginaEnlaces(${i})">${i}</button>
      `;
    }
    htmlBotones += `
      <button class="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container transition-all ${paginaActual === totalPaginas ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}" ${paginaActual === totalPaginas ? 'disabled' : ''} onclick="cambiarPaginaEnlaces(${paginaActual + 1})">Siguiente</button>
    `;
    contenedorBotones.innerHTML = htmlBotones;
  }

  window.cambiarPaginaEnlaces = function (pag) {
    paginaActual = pag;
    aplicarFiltros();
  };

  // ================= ACCIONES DE FILA (EDITAR / CAMBIAR ESTADO) =================
  document.getElementById('tabla-enlaces-body')?.addEventListener('click', async (e) => {
    const fila = e.target.closest('tr');
    if (!fila) return;
    const id = fila.dataset.id;
    const enlace = enlacesDB.find(x => String(x.id) === String(id));
    if (!enlace) return;

    if (e.target.closest('.btn-editar-enlace')) {
      document.getElementById('modal-enlace-titulo-texto').textContent = 'Editar Enlace';
      document.getElementById('enlace-id-editar').value = enlace.id;
      document.getElementById('enlace-logo-actual').value = enlace.logo;
      document.getElementById('select-enlace-pantalla').value = enlace.id_pantalla;
      poblarSubdivisionesPorPantalla(enlace.id_pantalla, enlace.id_subdivision);
      document.getElementById('input-enlace-titulo').value = enlace.titulo;
      document.getElementById('input-enlace-url').value = enlace.url;

      if (inputArchivo) inputArchivo.value = '';
      if (enlace.logo.startsWith('/images/logos/')) {
        if (spanNombreArchivo) spanNombreArchivo.textContent = 'Imagen local guardada';
        btnQuitarArchivo?.classList.remove('hidden');
        document.getElementById('input-enlace-logo').value = '';
      } else {
        if (spanNombreArchivo) spanNombreArchivo.textContent = '';
        btnQuitarArchivo?.classList.add('hidden');
        const esAutomatico = enlace.logo.includes('google.com/s2/favicons') || enlace.logo.includes('unavatar.io/');
        document.getElementById('input-enlace-logo').value = esAutomatico ? '' : enlace.logo;
      }

      document.getElementsByName('radio-estado').forEach(r => {
        r.checked = (r.value === enlace.estado);
      });

      actualizarPreviewLogo();
      abrirModal(modalEnlace);
    }

    if (e.target.closest('.btn-estado-enlace')) {
      const nuevoEstado = enlace.estado === 'Activo' ? 'Inactivo' : 'Activo';
      try {
        const res = await fetch(`/api/enlaces/${id}/estado`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        mostrarToast(`Enlace marcado como ${nuevoEstado}`);
        await cargarEnlaces();
      } catch (err) {
        mostrarToast(err.message || 'Error al cambiar estado', 'error');
      }
    }
  });

  // ================= FILTROS =================
  const inputBusqueda = document.getElementById('filtro-busqueda-enlace');
  const filtroPantalla = document.getElementById('filtro-pantalla');
  const filtroSubdivision = document.getElementById('filtro-subdivision');
  const filtroEstado = document.getElementById('filtro-estado-enlace');

  function aplicarFiltros() {
    const q = (inputBusqueda?.value || '').toLowerCase().trim();
    const p = filtroPantalla?.value || 'all';
    const s = filtroSubdivision?.value || 'all';
    const est = filtroEstado?.value || 'all';

    const filtrados = enlacesDB.filter(item => {
      const matchQ = !q || item.titulo.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
      const matchP = p === 'all' || String(item.id_pantalla) === String(p);
      const matchS = s === 'all' || String(item.id_subdivision) === String(s);
      const matchEst = est === 'all' || item.estado === est;
      return matchQ && matchP && matchS && matchEst;
    });

    renderizarTabla(filtrados);
  }

  inputBusqueda?.addEventListener('input', () => { paginaActual = 1; aplicarFiltros(); });
  filtroPantalla?.addEventListener('change', (e) => {
    actualizarSelectFiltroSubdivisiones(e.target.value);
    paginaActual = 1;
    aplicarFiltros();
  });
  filtroSubdivision?.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });
  filtroEstado?.addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });

  document.getElementById('btn-limpiar-filtros')?.addEventListener('click', () => {
    if (inputBusqueda) inputBusqueda.value = '';
    if (filtroPantalla) filtroPantalla.value = 'all';
    actualizarSelectFiltroSubdivisiones('all');
    if (filtroEstado) filtroEstado.value = 'all';
    paginaActual = 1;
    aplicarFiltros();
  });

  document.getElementById('select-limite-pag')?.addEventListener('change', (e) => {
    registrosPorPagina = Number(e.target.value);
    paginaActual = 1;
    aplicarFiltros();
  });

  inicializarDatos();
})();