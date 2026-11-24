const CLAVE_PRODUCTOS = "del_campo_productos";
const CLAVE_USUARIOS = "del_campo_usuarios";

const $ = id => document.getElementById(id);

const productosIniciales = [
  {
    id: "producto-1",
    nombre: "Chullo andino",
    categoria: "Textiles",
    emoji: "🧶",
    productor: "Andre",
    telefono: "51987654321",
    ubicacion: "Centro Histórico, Cusco, Perú",
    precio: "S/ 500",
    latitud: -13.5167,
    longitud: -71.9789,
    materiales: "Lana y ganchero",
    descripcion: "Ejemplo de tejido andino elaborado con dedicación y saberes artesanales que forman parte de la tradición cusqueña."
  },
  {
    id: "producto-2",
    nombre: "Cerámica tradicional",
    categoria: "Cerámica",
    emoji: "🏺",
    productor: "Miguel Huamán",
    telefono: "51987654322",
    ubicacion: "Barrio de San Blas, Cusco, Perú",
    precio: "S/ 65",
    latitud: -13.5144,
    longitud: -71.9735,
    materiales: "Arcilla y pigmentos naturales",
    descripcion: "Pieza de muestra modelada a mano, inspirada en los oficios y talleres artesanales de Cusco."
  },
  {
    id: "producto-3",
    nombre: "Canasta artesanal",
    categoria: "Tejidos",
    emoji: "🧺",
    productor: "Rosa Cárdenas",
    telefono: "51987654323",
    ubicacion: "Mercado de San Pedro, Cusco, Perú",
    precio: "S/ 45",
    latitud: -13.5215,
    longitud: -71.9820,
    materiales: "Fibras naturales",
    descripcion: "Ejemplo de canasta tejida con fibras naturales, como las piezas que se encuentran en los mercados de Cusco."
  }
];

function cargarProductos() {
  try {
    const datos = JSON.parse(
      localStorage.getItem(CLAVE_PRODUCTOS)
    );

    return Array.isArray(datos)
      ? datos
      : [...productosIniciales];

  } catch (error) {
    return [...productosIniciales];
  }
}

let productos = cargarProductos();
let mapa = null;
let marcadores = null;
let mapaSeleccionProducto = null;
let marcadorSeleccionProducto = null;
let mapaProductoQR = null;
let productoActual = null;

function guardarProductos() {
  try {
    localStorage.setItem(
      CLAVE_PRODUCTOS,
      JSON.stringify(productos)
    );
    return true;
  } catch (error) {
    alert("No fue posible guardar el producto en este navegador.");
    return false;
  }
}

function seguro(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, letra => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[letra]);
}

function limpiarTelefono(numero) {
  return String(numero || "").replace(/\D/g, "");
}

function crearWhatsApp(telefono, producto) {
  const numero = limpiarTelefono(telefono);

  const mensaje = encodeURIComponent(
    `¡Hola! Vi tu producto "${producto}" en DEL CAMPO. Me gustaría conocer más sobre él.`
  );

  return `https://wa.me/${numero}?text=${mensaje}`;
}

function codificarProducto(producto) {
  const bytes = new TextEncoder().encode(
    JSON.stringify(producto)
  );

  let binario = "";

  bytes.forEach(byte => {
    binario += String.fromCharCode(byte);
  });

  return btoa(binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodificarProducto(codigo) {
  const base64 = codigo
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const relleno = "=".repeat(
    (4 - base64.length % 4) % 4
  );

  const binario = atob(base64 + relleno);

  const bytes = Uint8Array.from(
    binario,
    caracter => caracter.charCodeAt(0)
  );

  return JSON.parse(
    new TextDecoder().decode(bytes)
  );
}

function crearEnlaceQR(producto) {
  const url = new URL("ficha.html", window.location.href);
  url.hash = "p=" + codificarProducto(producto);

  return url.href;
}

function contenidoProducto(producto) {
  const telefono = limpiarTelefono(producto.telefono);

  return `
    <div class="ficha-producto">

      <span class="categoria">
        ${seguro(producto.categoria)}
      </span>

      <h2 id="tituloModalQR">
        ${seguro(producto.emoji || "🎨")}
        ${seguro(producto.nombre)}
      </h2>

      <p>
        <b>Creada por</b>
        ${seguro(producto.productor)}
      </p>

      <p>
        <b>Desde</b>
        ${seguro(producto.ubicacion)}
      </p>

      <p>
        <b>Materiales</b>
        ${seguro(producto.materiales || "No especificados")}
      </p>

      <p>
        <b>Su historia</b>
        ${seguro(producto.descripcion || "Sin descripción")}
      </p>

      <p>
        <b>Precio:</b>
        ${seguro(producto.precio || "Consultar")}
      </p>

      ${
        telefono.length >= 8
        ? `
          <a
            class="boton"
            href="${seguro(crearWhatsApp(telefono, producto.nombre))}"
            target="_blank"
            rel="noopener"
          >
            💬 Saluda al artesano
          </a>
        `
        : "<p class=\"texto-secundario\">Este artesano aún no ha compartido un número de contacto.</p>"
      }

    </div>
  `;
}

function mostrarProductos() {

  const listaProductos = $("listaProductos");
  const campoBusqueda = $("busqueda");
  const filtroCategoria = $("filtroCategoria");

  if (!listaProductos || !campoBusqueda || !filtroCategoria) return;

  const busqueda = campoBusqueda.value.trim().toLowerCase();
  const categoria = filtroCategoria.value;

  const encontrados = productos.filter(producto => {

    const coincideCategoria =
      !categoria || producto.categoria === categoria;

    const texto = `
      ${producto.nombre}
      ${producto.productor}
      ${producto.ubicacion}
    `.toLowerCase();

    return coincideCategoria &&
      texto.includes(busqueda);
  });

  if (encontrados.length === 0) {
    listaProductos.innerHTML = `
      <div class="estado-vacio">
        <span class="estado-vacio-icono" aria-hidden="true">🌾</span>
        <h3>Aún no encontramos esa historia</h3>
        <p>Prueba con otra palabra o categoría; quizá la próxima pieza especial esté esperándote un poco más allá.</p>
        <button class="boton boton-secundario" type="button" onclick="limpiarFiltros()">Volver a recorrer el catálogo</button>
      </div>
    `;
    actualizarMapa();
    return;
  }

  listaProductos.innerHTML =
    encontrados.map(producto => `

      <article class="producto">

        <div class="producto-imagen">
          ${seguro(producto.emoji || "🎨")}
        </div>

        <div class="producto-info">

          <div class="artesano-ficha">
            <div class="artesano-retrato" role="img" aria-label="Espacio reservado para el retrato de ${seguro(producto.productor)}">🌿</div>
            <div>
              <span class="artesano-etiqueta">HECHO POR</span>
              <p class="nombre-artesano">${seguro(producto.productor)}</p>
            </div>
          </div>

          <h3>${seguro(producto.nombre)}</h3>

          <p class="historia-producto">
            ${seguro(producto.descripcion || "Cada pieza guarda el tiempo, el cuidado y los saberes de quien la crea.")}
          </p>

          <p>
            <span aria-hidden="true">📍</span> ${seguro(producto.ubicacion)}
          </p>

          <div class="producto-pie">
            <span class="categoria">${seguro(producto.categoria)}</span>
            <span class="precio">${seguro(producto.precio || "Consultar con el artesano")}</span>
          </div>

          <div class="acciones">

            <button
              class="boton"
              onclick="verProducto('${seguro(producto.id)}')"
              type="button"
            >
              Conocer su historia
            </button>

            ${
              limpiarTelefono(producto.telefono).length >= 8
              ? `
                <a
                  class="boton boton-secundario"
                  href="${seguro(crearWhatsApp(producto.telefono, producto.nombre))}"
                  target="_blank"
                  rel="noopener"
                >
                  💬 Saluda al artesano
                </a>
              `
              : ""
            }

          </div>
        </div>

      </article>

    `).join("");

  actualizarMapa();
}

function limpiarFiltros() {
  const campoBusqueda = $("busqueda");
  const filtroCategoria = $("filtroCategoria");

  if (!campoBusqueda || !filtroCategoria) return;

  campoBusqueda.value = "";
  filtroCategoria.value = "";
  mostrarProductos();
}

function verProducto(id) {

  const producto = productos.find(
    item => item.id === id
  );

  if (!producto || !$("detalleProducto") || !$("modalQR")) return;

  productoActual = producto;

  $("detalleProducto").innerHTML = `

    ${contenidoProducto(producto)}

    <div class="qr-contenedor">

      <div class="qr-historia">
        <h3>La historia de esta artesanía merece conocerse.</h3>
        <p>
          Escanea este código QR para descubrir quién elaboró
          el producto, dónde nació y qué materiales se utilizaron.
        </p>
        <p class="ayuda">Este mapa muestra el lugar guardado para la artesanía.</p>
        <div id="mapaProductoQR" class="mapa-producto-qr" role="application" aria-label="Ubicación de la artesanía"></div>
      </div>

      <div class="qr">

        <h3>Código QR</h3>

        <div id="codigoQR"></div>

        <button
          class="boton boton-secundario"
          onclick="descargarQR()"
          type="button"
        >
          Descargar QR
        </button>

      </div>

    </div>
  `;

  $("modalQR").classList.add("visible");

  $("modalQR").setAttribute(
    "aria-hidden",
    "false"
  );

  mostrarMapaProductoQR(producto);

  const contenedor = $("codigoQR");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (typeof QRCode === "undefined") {
    contenedor.textContent =
      "No se pudo cargar el generador QR. Comprueba Internet.";
    return;
  }

  new QRCode(contenedor, {
    text: crearEnlaceQR(producto),
    width: 170,
    height: 170,
    correctLevel: QRCode.CorrectLevel.M
  });
}

function descargarQR() {
  if (!productoActual) return;

  const canvas = document.querySelector(
    "#codigoQR canvas"
  );

  const imagen = document.querySelector(
    "#codigoQR img"
  );

  const contenido = canvas
    ? canvas.toDataURL("image/png")
    : imagen?.src;

  if (!contenido) {
    alert("Espera a que se genere el código QR.");
    return;
  }

  const enlace = document.createElement("a");

  enlace.href = contenido;

  enlace.download =
    `DEL-CAMPO-QR-${productoActual.nombre.replace(
      /[^a-z0-9]/gi, "-"
    )}.png`;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

function cerrarModal() {
  const modal = $("modalQR");
  if (!modal) return;

  modal.classList.remove("visible");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );
}

function abrirFichaQR() {

  const hash = window.location.hash;
  const contenidoFicha = $("contenidoFichaQR");

  if (!hash.startsWith("#p=") || !contenidoFicha) {
    return false;
  }

  try {

    const producto = decodificarProducto(
      hash.slice(3)
    );

    if (
      !producto ||
      !producto.id ||
      !producto.nombre ||
      !producto.productor
    ) {
      throw new Error("Datos del QR inválidos");
    }

    contenidoFicha.innerHTML = `

      <span class="etiqueta-verde">
        TRAZABILIDAD DEL PRODUCTO
      </span>

      ${contenidoProducto(producto)}

      <p class="ayuda">
        Esta es la ficha de origen compartida mediante
        el código QR de DEL CAMPO.
      </p>

    `;

    document.title =
      producto.nombre + " | DEL CAMPO";

    return true;

  } catch (error) {

    console.error("Error al leer QR:", error);

    contenidoFicha.innerHTML = `
      <p class="aviso-local">
        No pudimos leer la información de este código QR.
        Solicita al productor un código actualizado.
      </p>
    `;

    return true;
  }
}

function crearMapa(contenedor, centro, zoom) {
  const nuevoMapa = L.map(contenedor).setView(centro, zoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(nuevoMapa);
  return nuevoMapa;
}

function mostrarMapaProductoQR(producto) {
  const contenedor = $("mapaProductoQR");
  if (!contenedor) return;

  if (mapaProductoQR) {
    mapaProductoQR.remove();
    mapaProductoQR = null;
  }

  const lat = Number(producto.latitud);
  const lng = Number(producto.longitud);
  if (typeof L === "undefined") {
    contenedor.textContent = "No se pudo cargar el mapa.";
    return;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    contenedor.textContent = "Este producto aún no tiene una ubicación registrada.";
    return;
  }

  mapaProductoQR = crearMapa(contenedor, [lat, lng], 14);
  L.marker([lat, lng])
    .addTo(mapaProductoQR)
    .bindPopup(`${seguro(producto.ubicacion)}`)
    .openPopup();
}

function iniciarMapa() {
  const contenedor = $("map");
  if (!contenedor) return;
  if (typeof L === "undefined") {
    contenedor.textContent = "No se pudo cargar el mapa. Comprueba tu conexión.";
    return;
  }

  mapa = crearMapa(contenedor, [-13.5167, -71.9789], 13);
  marcadores = L.layerGroup().addTo(mapa);
  actualizarMapa();
}

function actualizarMapa() {
  if (!mapa || !marcadores || typeof L === "undefined") return;
  marcadores.clearLayers();

  productos.forEach(producto => {
    const lat = Number(producto.latitud);
    const lng = Number(producto.longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    L.marker([lat, lng])
      .addTo(marcadores)
      .bindPopup(`
        <b>${seguro(producto.nombre)}</b><br>
        Productor: ${seguro(producto.productor)}<br>
        ${seguro(producto.ubicacion)}
      `);
  });
}

function seleccionarUbicacionProducto(latlng, centrar = true) {
  const latitud = $("latitudProducto");
  const longitud = $("longitudProducto");
  const estado = $("estadoUbicacion");
  const enlaceGoogleMaps = $("abrirGoogleMaps");
  if (!latitud || !longitud) return;

  const { lat, lng } = latlng;
  latitud.value = String(lat);
  longitud.value = String(lng);

  if (!marcadorSeleccionProducto) {
    marcadorSeleccionProducto = L.marker([lat, lng], {
      draggable: true
    }).addTo(mapaSeleccionProducto);
    marcadorSeleccionProducto.on("dragend", () => {
      seleccionarUbicacionProducto(marcadorSeleccionProducto.getLatLng(), false);
    });
  } else {
    marcadorSeleccionProducto.setLatLng([lat, lng]);
  }

  if (centrar) {
    mapaSeleccionProducto.setView([lat, lng], Math.max(mapaSeleccionProducto.getZoom(), 13));
  }

  if (estado) {
    estado.textContent = "Ubicación seleccionada. Puedes arrastrar el marcador para ajustarla.";
  }

  if (enlaceGoogleMaps) {
    enlaceGoogleMaps.href =
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    enlaceGoogleMaps.removeAttribute("aria-disabled");
    enlaceGoogleMaps.removeAttribute("tabindex");
  }
}

function limpiarUbicacionProducto() {
  const latitud = $("latitudProducto");
  const longitud = $("longitudProducto");
  const estado = $("estadoUbicacion");
  const enlaceGoogleMaps = $("abrirGoogleMaps");

  if (marcadorSeleccionProducto) {
    marcadorSeleccionProducto.remove();
    marcadorSeleccionProducto = null;
  }

  if (latitud) latitud.value = "";
  if (longitud) longitud.value = "";
  if (estado) estado.textContent = "Aún no has seleccionado una ubicación.";
  if (enlaceGoogleMaps) {
    enlaceGoogleMaps.href = "https://www.google.com/maps/";
    enlaceGoogleMaps.setAttribute("aria-disabled", "true");
    enlaceGoogleMaps.tabIndex = -1;
  }
  if (mapaSeleccionProducto) {
    mapaSeleccionProducto.setView([-13.5167, -71.9789], 12);
  }
}

function iniciarSelectorUbicacion() {
  const contenedor = $("mapaSeleccionProducto");
  if (!contenedor) return;

  const estado = $("estadoUbicacion");
  if (typeof L === "undefined") {
    contenedor.textContent = "No se pudo cargar el mapa. Comprueba tu conexión.";
    if (estado) estado.textContent = "El mapa no está disponible en este momento.";
    return;
  }

  mapaSeleccionProducto = crearMapa(contenedor, [-13.5167, -71.9789], 12);
  mapaSeleccionProducto.on("click", event => {
    seleccionarUbicacionProducto(event.latlng);
  });

  const botonUbicacionActual = $("btnUbicacionActual");
  if (botonUbicacionActual) {
    botonUbicacionActual.addEventListener("click", () => {
      if (!navigator.geolocation) {
        if (estado) estado.textContent = "Tu navegador no permite compartir la ubicación.";
        return;
      }

      botonUbicacionActual.disabled = true;
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          seleccionarUbicacionProducto({
            lat: coords.latitude,
            lng: coords.longitude
          });
          botonUbicacionActual.disabled = false;
        },
        () => {
          if (estado) {
            estado.textContent =
              "No pudimos obtener tu ubicación. Revisa los permisos o elige un punto en el mapa.";
          }
          botonUbicacionActual.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}

function inicializarFormularioUsuario() {
  const formularioUsuario = $("formUsuario");
  if (!formularioUsuario) return;

  formularioUsuario.addEventListener("submit", function(event) {
    event.preventDefault();

    const usuario = {
      tipo: $("tipoUsuario").value,
      nombre: $("nombreUsuario").value.trim(),
      telefono: limpiarTelefono($("telefonoUsuario").value),
      localidad: $("localidadUsuario").value.trim()
    };

    if (usuario.telefono.length < 8) {
      alert("Ingresa un número de WhatsApp válido.");
      return;
    }

    let usuarios = [];

    try {
      usuarios = JSON.parse(localStorage.getItem(CLAVE_USUARIOS)) || [];
    } catch {
      usuarios = [];
    }

    usuarios.push(usuario);
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));

    const mensaje = $("mensajeUsuario");
    if (mensaje) {
      mensaje.textContent =
        `¡Gracias, ${usuario.nombre}! Tu registro se guardó correctamente.`;
    }

    formularioUsuario.reset();
  });
}

function inicializarFormularioProducto() {
  const formularioProducto = $("formProducto");
  if (!formularioProducto) return;

  formularioProducto.addEventListener("submit", function(event) {
    event.preventDefault();

    const telefono = limpiarTelefono(
      $("telefonoProductor").value
    );

    if (telefono.length < 8) {
      alert("Ingresa un WhatsApp válido con código de país.");
      return;
    }

    const latitud = $("latitudProducto").value;
    const longitud = $("longitudProducto").value;
    if (!latitud || !longitud) {
      const estado = $("estadoUbicacion");
      const selector = $("mapaSeleccionProducto");
      if (estado) estado.textContent = "Selecciona un punto en el mapa antes de publicar.";
      if (selector) {
        selector.focus();
        selector.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const producto = {

      id: "art-" + Date.now(),

      nombre: $("nombreProducto").value.trim(),

      categoria: $("categoriaProducto").value,

      productor: $("nombreProductor").value.trim(),

      telefono: telefono,

      ubicacion: $("ubicacionProducto").value.trim(),

      precio: $("precioProducto").value.trim(),

      latitud: Number(latitud),

      longitud: Number(longitud),

      materiales: $("materialesProducto").value.trim(),

      descripcion: $("descripcionProducto").value.trim(),

      emoji: "🎨"
    };

    if (
      !Number.isFinite(producto.latitud) ||
      producto.latitud < -90 ||
      producto.latitud > 90 ||
      !Number.isFinite(producto.longitud) ||
      producto.longitud < -180 ||
      producto.longitud > 180
    ) {
      alert("Las coordenadas de ubicación no son válidas.");
      return;
    }

    productos.unshift(producto);

    if (!guardarProductos()) {
      productos.shift();
      return;
    }

    mostrarProductos();

    formularioProducto.reset();
    limpiarUbicacionProducto();

    // MOSTRAR AUTOMÁTICAMENTE EL QR
    verProducto(producto.id);
  });
}

function inicializarCatalogo() {
  const listaProductos = $("listaProductos");
  if (!listaProductos) return;

  const busqueda = $("busqueda");
  const filtroCategoria = $("filtroCategoria");

  if (busqueda) {
    busqueda.addEventListener("input", mostrarProductos);
  }

  if (filtroCategoria) {
    filtroCategoria.addEventListener("change", mostrarProductos);
  }

  mostrarProductos();
}

function inicializarModalQR() {
  const modal = $("modalQR");
  if (!modal) return;

  const botonCerrar = $("cerrarModal");
  if (botonCerrar) {
    botonCerrar.addEventListener("click", cerrarModal);
  }

  modal.addEventListener("click", function(event) {
    if (event.target === modal) cerrarModal();
  });

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") cerrarModal();
  });
}

function inicializarPagina() {
  const hashQR = window.location.hash;

  if (hashQR.startsWith("#p=")) {
    if (!$("contenidoFichaQR")) {
      const destinoFicha = new URL("ficha.html", window.location.href);
      destinoFicha.hash = hashQR.slice(1);
      window.location.replace(destinoFicha.href);
      return;
    }

    abrirFichaQR();
    return;
  }

  if ($("contenidoFichaQR")) return;

  inicializarModalQR();
  inicializarCatalogo();

  if ($("map")) {
    iniciarMapa();
  }

  if ($("mapaSeleccionProducto")) {
    iniciarSelectorUbicacion();
  }

  inicializarFormularioUsuario();
  inicializarFormularioProducto();
}

document.addEventListener("DOMContentLoaded", inicializarPagina);