// Registro del service worker e instalación de la PWA.

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  });
}

const botonInstalar = document.getElementById("boton-instalar");
const ayudaIos = document.getElementById("ayuda-ios");
let solicitudInstalacion = null;

window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault();
  solicitudInstalacion = evento;
  if (botonInstalar) botonInstalar.hidden = false;
});

if (botonInstalar) {
  botonInstalar.addEventListener("click", async () => {
    if (!solicitudInstalacion) return;
    solicitudInstalacion.prompt();
    await solicitudInstalacion.userChoice;
    solicitudInstalacion = null;
    botonInstalar.hidden = true;
  });
}

const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
const yaInstalada = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
if (ayudaIos && esIos && !yaInstalada) ayudaIos.hidden = false;

const cursos = {
  ciencia: {
    etiqueta: "MISIÓN DE CIENCIA",
    misiones: [
      { titulo: "Detectives de la naturaleza", pregunta: "¿Cuál de estos seres necesita luz para crecer?", respuestas: ["Una piedra", "Una planta", "Un lápiz"], correcta: "Una planta" },
      { titulo: "Bajo el agua", pregunta: "¿Dónde respira un pez?", respuestas: ["En el agua", "En un árbol", "En la arena"], correcta: "En el agua" },
      { titulo: "Agua viajera", pregunta: "¿En qué se convierte el agua cuando se congela?", respuestas: ["En vapor", "En hielo", "En arena"], correcta: "En hielo" },
      { titulo: "Guardianes del jardín", pregunta: "¿Qué parte de la planta suele estar debajo de la tierra?", respuestas: ["La raíz", "La flor", "El fruto"], correcta: "La raíz" },
    ],
  },
  matematicas: {
    etiqueta: "MISIÓN DE NÚMEROS",
    misiones: [
      { titulo: "El acertijo de la isla", pregunta: "El mono encontró 7 bananas y luego 5 más. ¿Cuántas tiene ahora?", respuestas: ["10 bananas", "12 bananas", "13 bananas"], correcta: "12 bananas" },
      { titulo: "El puente de los números", pregunta: "Había 15 luciérnagas y 6 se fueron a dormir. ¿Cuántas quedan?", respuestas: ["9 luciérnagas", "10 luciérnagas", "11 luciérnagas"], correcta: "9 luciérnagas" },
      { titulo: "La merienda", pregunta: "Hay 3 platos con 2 galletas en cada uno. ¿Cuántas galletas hay?", respuestas: ["5 galletas", "6 galletas", "8 galletas"], correcta: "6 galletas" },
      { titulo: "El cohete curioso", pregunta: "El cohete recorrió 20 km y luego 7 más. ¿Cuántos recorrió?", respuestas: ["26 km", "27 km", "28 km"], correcta: "27 km" },
    ],
  },
  lectura: {
    etiqueta: "MISIÓN DE LECTURA",
    misiones: [
      { titulo: "Palabras que riman", pregunta: "¿Qué palabra rima con «sol»?", respuestas: ["Mar", "Col", "Flor"], correcta: "Col" },
      { titulo: "Palabras opuestas", pregunta: "¿Qué palabra significa lo contrario de «grande»?", respuestas: ["Enorme", "Pequeño", "Gigante"], correcta: "Pequeño" },
      { titulo: "La letra escondida", pregunta: "¿Cuál de estas palabras empieza con la letra M?", respuestas: ["Mesa", "Silla", "Luna"], correcta: "Mesa" },
      { titulo: "Signos viajeros", pregunta: "¿Qué signo usamos al final de una pregunta?", respuestas: ["¡", "?", "."], correcta: "?" },
    ],
  },
  arte: {
    etiqueta: "MISIÓN CREATIVA",
    misiones: [
      { titulo: "El laboratorio de colores", pregunta: "¿Qué color aparece al mezclar azul y amarillo?", respuestas: ["Verde", "Morado", "Rojo"], correcta: "Verde" },
      { titulo: "Pinturas primarias", pregunta: "¿Cuál de estos es un color primario?", respuestas: ["Rojo", "Verde", "Morado"], correcta: "Rojo" },
      { titulo: "El rincón del artista", pregunta: "¿Qué herramienta sirve para dibujar en papel?", respuestas: ["Un lápiz", "Una cuchara", "Un calcetín"], correcta: "Un lápiz" },
      { titulo: "Atardecer de colores", pregunta: "¿Qué color aparece al mezclar rojo y amarillo?", respuestas: ["Naranja", "Azul", "Verde"], correcta: "Naranja" },
    ],
  },
};

const dialogoLeccion = document.getElementById("dialogo-leccion");
const contenidoLeccion = document.getElementById("contenido-leccion");
const dialogoAula = document.getElementById("dialogo-aula");
const formularioAula = document.getElementById("formulario-aula");
const campoCodigo = document.getElementById("codigo-aula");
const etiquetaAula = document.getElementById("etiqueta-aula");
const avatarActual = document.getElementById("avatar-actual");
const anuncio = document.getElementById("anuncio");
let cursoActual = null;
let idCursoActual = null;
let temporizadorAnuncio = null;

function mostrarAnuncio(mensaje) {
  anuncio.textContent = mensaje;
  anuncio.classList.add("visible");
  window.clearTimeout(temporizadorAnuncio);
  temporizadorAnuncio = window.setTimeout(() => anuncio.classList.remove("visible"), 3200);
}

function leerNumeroGuardado(clave, valorInicial = 0) {
  const valor = Number.parseInt(localStorage.getItem(clave) ?? "", 10);
  return Number.isFinite(valor) && valor >= 0 ? valor : valorInicial;
}

function leerProgresoCurso(idCurso) {
  return Math.min(100, leerNumeroGuardado(`chispa-progreso-${idCurso}`));
}

function actualizarProgreso() {
  document.querySelectorAll("[data-id-curso]").forEach((tarjeta) => {
    const id = tarjeta.dataset.idCurso;
    const progreso = leerProgresoCurso(id);
    tarjeta.querySelector("[data-texto-progreso]").textContent = `${progreso}%`;
    tarjeta.querySelector("[data-barra-progreso]").style.width = `${progreso}%`;
    tarjeta.querySelector('[role="progressbar"]').setAttribute("aria-valuenow", progreso);
    const boton = tarjeta.querySelector("[data-iniciar-curso]");
    const textoBoton = progreso === 100 ? "Repasar" : progreso ? "Continuar" : "Empezar";
    boton.innerHTML = `${textoBoton} <span aria-hidden="true">→</span>`;
  });
  document.getElementById("total-estrellas").textContent = leerNumeroGuardado("chispa-estrellas").toString();
}

function abrirReto(idCurso) {
  cursoActual = cursos[idCurso];
  if (!cursoActual) return;
  idCursoActual = idCurso;
  const progreso = leerProgresoCurso(idCurso);
  const indiceMision = Math.min(cursoActual.misiones.length - 1, Math.floor(progreso / 25));
  const misionActual = cursoActual.misiones[indiceMision];
  contenidoLeccion.innerHTML = `
    <span class="etiqueta-reto">${cursoActual.etiqueta} · RETO ${indiceMision + 1} DE ${cursoActual.misiones.length}</span>
    <h2 id="titulo-leccion">${misionActual.titulo}</h2>
    <p class="pregunta-reto">${misionActual.pregunta}</p>
    <div class="opciones-reto" role="group" aria-label="Elige una respuesta"></div>
    <p class="feedback-reto" aria-live="polite"></p>
    <button class="boton boton-oscuro boton-continuar" type="button" hidden>¡Terminé el reto! <span aria-hidden="true">★</span></button>
  `;
  const opciones = contenidoLeccion.querySelector(".opciones-reto");
  const feedback = contenidoLeccion.querySelector(".feedback-reto");
  const botonContinuar = contenidoLeccion.querySelector(".boton-continuar");

  misionActual.respuestas.forEach((respuesta) => {
    const boton = document.createElement("button");
    boton.className = "opcion-reto";
    boton.type = "button";
    boton.textContent = respuesta;
    boton.addEventListener("click", () => {
      if (respuesta === misionActual.correcta) {
        boton.classList.add("correcta");
        feedback.textContent = "¡Eso es! ¡Qué gran descubrimiento!";
        feedback.classList.add("correcto");
        botonContinuar.hidden = false;
        opciones.querySelectorAll("button").forEach((opcion) => {
          opcion.disabled = true;
        });
      } else {
        feedback.textContent = "¡Casi! Piensa un poquito más e inténtalo otra vez.";
      }
    });
    opciones.append(boton);
  });

  botonContinuar.addEventListener("click", terminarReto);
  dialogoLeccion.showModal();
}

function terminarReto() {
  const progresoActual = leerProgresoCurso(idCursoActual);
  const cursoCompletado = progresoActual === 100;
  if (!cursoCompletado) {
    localStorage.setItem(`chispa-progreso-${idCursoActual}`, (progresoActual + 25).toString());
    localStorage.setItem("chispa-estrellas", (leerNumeroGuardado("chispa-estrellas") + 10).toString());
  }
  actualizarProgreso();
  contenidoLeccion.innerHTML = `
    <div class="resultado-reto">
      <span class="emoji-resultado" aria-hidden="true">🎉</span>
      <h2 id="titulo-leccion">${cursoCompletado ? "¡Curso completado!" : "¡Misión completada!"}</h2>
      <p>${cursoCompletado ? "Ya completaste esta aventura. Puedes repasar el reto cuando quieras." : "Ganaste <strong>10 estrellas</strong> y avanzaste en tu aventura. ¡Sigue así!"}</p>
      <button class="boton boton-oscuro boton-continuar" type="button">Volver a mis cursos</button>
    </div>
  `;
  contenidoLeccion.querySelector("button").addEventListener("click", () => dialogoLeccion.close());
}

document.querySelectorAll("[data-filtro]").forEach((boton) => {
  boton.addEventListener("click", () => {
    const filtro = boton.dataset.filtro;
    document.querySelectorAll("[data-filtro]").forEach((opcion) => {
      const seleccionado = opcion === boton;
      opcion.classList.toggle("activo", seleccionado);
      opcion.setAttribute("aria-pressed", seleccionado.toString());
    });
    document.querySelectorAll("[data-id-curso]").forEach((tarjeta) => {
      tarjeta.hidden = filtro !== "todos" && tarjeta.dataset.categoria !== filtro;
    });
  });
});

document.querySelectorAll("[data-iniciar-curso]").forEach((boton) => {
  boton.addEventListener("click", () => abrirReto(boton.dataset.iniciarCurso));
});

document.querySelectorAll("[data-cerrar-dialogo]").forEach((boton) => {
  boton.addEventListener("click", () => boton.closest("dialog").close());
});

document.getElementById("boton-aula").addEventListener("click", () => dialogoAula.showModal());
document.getElementById("boton-avatar").addEventListener("click", () => dialogoAula.showModal());

formularioAula.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!formularioAula.reportValidity()) return;

  const codigo = campoCodigo.value.trim().toUpperCase();
  const avatar = formularioAula.querySelector('input[name="avatar"]:checked').value;
  localStorage.setItem("chispa-aula", codigo);
  localStorage.setItem("chispa-avatar", avatar);
  etiquetaAula.textContent = codigo || "sin código";
  avatarActual.textContent = avatar;
  dialogoAula.close();
  mostrarAnuncio(codigo ? "¡Listo! El código quedó guardado en este dispositivo." : "¡Avatar guardado! Puedes ingresar el código de aula cuando quieras.");
});

function cargarPreferencias() {
  const codigo = localStorage.getItem("chispa-aula") ?? "";
  const avatar = localStorage.getItem("chispa-avatar") ?? "🦊";
  etiquetaAula.textContent = codigo || "sin código";
  avatarActual.textContent = avatar;
  campoCodigo.value = codigo;
  const opcionAvatar = formularioAula.querySelector(`input[name="avatar"][value="${CSS.escape(avatar)}"]`);
  if (opcionAvatar) opcionAvatar.checked = true;
}

actualizarProgreso();
cargarPreferencias();
