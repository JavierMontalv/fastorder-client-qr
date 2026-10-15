const ESTADOS_CON_HAPTICA = new Set([
  'recibido',
  'pendiente',
  'aceptado',
  'preparacion',
  'pendiente_pago',
  'listo',
  'entregado',
  'cancelado'
]);

const PATRONES_ESTADO = {
  recibido: [120, 35, 170, 45, 230],
  pendiente: [120, 35, 170, 45, 230],
  aceptado: [150, 45, 230, 65, 330, 80, 420],
  preparacion: [170, 50, 260, 70, 380, 90, 520],
  pendiente_pago: [180, 55, 260, 80, 420, 95, 560],
  listo: [240, 60, 360, 80, 520, 95, 720, 120, 880],
  entregado: [170, 45, 240, 65, 340, 85, 460],
  cancelado: [320, 90, 460, 120, 680, 140, 820]
};

const PATRON_LLAMADO = [280, 70, 420, 90, 620, 110, 820, 130, 980, 150, 1180];
const DEDUPE_MS = 320;
const MAX_PENDIENTES = 8;
const ultimosDisparos = new Map();
const pendientes = [];
let listenersInstalados = false;
let hapticaDesbloqueada = false;
let audioContext = null;
let audioDesbloqueado = false;
let audioElement = null;
let audioDataUrl = null;
let ultimoPulsoVisual = 0;

const ALIAS_ESTADO = new Map([
  ['recibido', 'pendiente'],
  ['received', 'pendiente'],
  ['creado', 'pendiente'],
  ['creada', 'pendiente'],
  ['nuevo', 'pendiente'],
  ['nueva', 'pendiente'],
  ['confirmado', 'aceptado'],
  ['confirmada', 'aceptado'],
  ['aceptada', 'aceptado'],
  ['aprobado', 'aceptado'],
  ['aprobada', 'aceptado'],
  ['en_preparacion', 'preparacion'],
  ['en-preparacion', 'preparacion'],
  ['en preparacion', 'preparacion'],
  ['en preparacion cocina', 'preparacion'],
  ['preparando', 'preparacion'],
  ['cocinando', 'preparacion'],
  ['preparado', 'preparacion'],
  ['preparada', 'preparacion'],
  ['ready', 'listo'],
  ['lista', 'listo'],
  ['pedido_listo', 'listo'],
  ['pedido listo', 'listo'],
  ['listo_para_entrega', 'listo'],
  ['listo para entrega', 'listo'],
  ['llamado', 'listo'],
  ['rellamado', 'listo'],
  ['pendiente pago', 'pendiente_pago'],
  ['pendiente-pago', 'pendiente_pago'],
  ['por_pagar', 'pendiente_pago'],
  ['por pagar', 'pendiente_pago'],
  ['pagando', 'pendiente_pago'],
  ['delivered', 'entregado'],
  ['entregada', 'entregado'],
  ['cerrado', 'entregado'],
  ['cerrada', 'entregado'],
  ['cancelada', 'cancelado'],
  ['anulado', 'cancelado'],
  ['anulada', 'cancelado']
]);

function normalizarEstado(estado) {
  if (!estado) return null;
  const limpio = String(estado)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

  return ALIAS_ESTADO.get(limpio) || limpio.replace(/\s+/g, '_');
}

export function esDispositivoMovil() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const narrowScreen = window.matchMedia?.('(max-width: 820px)')?.matches ?? false;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

  return Boolean(coarsePointer || (mobileUA && narrowScreen));
}

export function soportaVibracionPedido() {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

function esIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function tieneActivacionUsuario() {
  if (typeof navigator === 'undefined') return false;
  return Boolean(navigator.userActivation?.hasBeenActive ?? hapticaDesbloqueada);
}

function puedeVibrarAhora() {
  return (
    soportaVibracionPedido() &&
    tieneActivacionUsuario()
  );
}

function ejecutarVibracion(pattern) {
  navigator.vibrate(0);
  const resultado = navigator.vibrate(pattern);
  registrarDiagnostico({ tipo: 'vibrate', pattern, resultado });
  return resultado;
}

function obtenerAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  return audioContext;
}

function escribirString(view, offset, value) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function crearWavAvisoDataUrl({ urgente = false } = {}) {
  const sampleRate = 44100;
  const duracion = urgente ? 1.42 : 0.82;
  const totalSamples = Math.floor(sampleRate * duracion);
  const bytesPorSample = 2;
  const buffer = new ArrayBuffer(44 + totalSamples * bytesPorSample);
  const view = new DataView(buffer);
  const frecuencias = urgente ? [880, 1174, 988, 1320, 1046] : [784, 988, 880];
  const segmento = totalSamples / frecuencias.length;

  escribirString(view, 0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * bytesPorSample, true);
  escribirString(view, 8, 'WAVE');
  escribirString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPorSample, true);
  view.setUint16(32, bytesPorSample, true);
  view.setUint16(34, 8 * bytesPorSample, true);
  escribirString(view, 36, 'data');
  view.setUint32(40, totalSamples * bytesPorSample, true);

  for (let i = 0; i < totalSamples; i += 1) {
    const freq = frecuencias[Math.min(frecuencias.length - 1, Math.floor(i / segmento))];
    const t = i / sampleRate;
    const local = (i % segmento) / segmento;
    const envelope = Math.sin(Math.PI * Math.min(1, local * 1.2)) * Math.max(0.08, 1 - local * 0.72);
    const wave = Math.sin(2 * Math.PI * freq * t) * 0.68 + Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.18;
    const sample = Math.max(-1, Math.min(1, wave * envelope * (urgente ? 0.62 : 0.46)));
    view.setInt16(44 + i * bytesPorSample, sample * 0x7fff, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

function obtenerAudioElement({ urgente = false } = {}) {
  if (typeof Audio === 'undefined') return null;
  const nextSrc = crearWavAvisoDataUrl({ urgente });

  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
    audioElement.playsInline = true;
  }

  if (audioDataUrl !== nextSrc) {
    audioDataUrl = nextSrc;
    audioElement.src = audioDataUrl;
    audioElement.load();
  }

  return audioElement;
}

function desbloquearAudioElement() {
  const el = obtenerAudioElement({ urgente: false });
  if (!el) return false;

  try {
    el.volume = 0.001;
    el.currentTime = 0;
    const playResult = el.play();
    if (playResult?.then) {
      playResult
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.volume = 1;
          audioDesbloqueado = true;
          registrarDiagnostico({ tipo: 'html-audio-unlocked', ios: esIOS() });
          procesarPendientes();
        })
        .catch(() => {
          el.volume = 1;
          registrarDiagnostico({ tipo: 'html-audio-unlock-failed', ios: esIOS() });
        });
    } else {
      el.pause();
      el.currentTime = 0;
      el.volume = 1;
      audioDesbloqueado = true;
      registrarDiagnostico({ tipo: 'html-audio-unlocked', ios: esIOS() });
    }
    return true;
  } catch {
    return false;
  }
}

function desbloquearAudioAviso() {
  const ctx = obtenerAudioContext();
  const htmlAudio = desbloquearAudioElement();
  if (!ctx) return htmlAudio;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume()
        .then(() => {
          audioDesbloqueado = true;
          registrarDiagnostico({ tipo: 'audio-unlocked', ios: esIOS(), state: ctx.state });
          procesarPendientes();
        })
        .catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 20;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.025);
    audioDesbloqueado = true;
    registrarDiagnostico({ tipo: 'audio-unlocked', ios: esIOS(), state: ctx.state });
    return true;
  } catch {
    return htmlAudio;
  }
}

function reproducirTono(ctx, inicio, frecuencia, duracion, volumen = 0.26) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frecuencia, inicio);
  osc.frequency.exponentialRampToValueAtTime(frecuencia * 0.82, inicio + duracion);
  gain.gain.setValueAtTime(0.0001, inicio);
  gain.gain.exponentialRampToValueAtTime(volumen, inicio + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.02);
}

function programarAvisoSonoro(ctx, { urgente = false } = {}) {
    const now = ctx.currentTime + 0.02;
    const secuencia = urgente
      ? [
          [0, 880, 0.16, 0.34],
          [0.22, 1174, 0.18, 0.36],
          [0.48, 988, 0.16, 0.32],
          [0.74, 1320, 0.22, 0.38],
          [1.08, 1046, 0.18, 0.32]
        ]
      : [
          [0, 784, 0.12, 0.24],
          [0.18, 988, 0.14, 0.26],
          [0.42, 880, 0.14, 0.24]
        ];

    secuencia.forEach(([offset, freq, duration, volume]) => {
      reproducirTono(ctx, now + offset, freq, duration, volume);
    });
}

function reproducirAvisoSonoro({ urgente = false, reintento = false } = {}) {
  const ctx = obtenerAudioContext();
  let htmlAudioDisparado = false;

  if (!ctx && typeof Audio === 'undefined') {
    registrarDiagnostico({ tipo: 'audio-unavailable', ios: esIOS() });
    return false;
  }

  try {
    const el = obtenerAudioElement({ urgente });
    if (el && (audioDesbloqueado || tieneActivacionUsuario())) {
      try {
        const clone = el.cloneNode(true);
        clone.volume = 1;
        clone.currentTime = 0;
        const playResult = clone.play();
        htmlAudioDisparado = true;
        if (playResult?.catch) {
          playResult.catch(() => {
            registrarDiagnostico({ tipo: 'html-audio-play-failed', urgente, ios: esIOS() });
          });
        }
      } catch {
        registrarDiagnostico({ tipo: 'html-audio-error', urgente, ios: esIOS() });
      }
    }

    if (!ctx) {
      registrarDiagnostico({ tipo: 'html-audio-only', urgente, ok: htmlAudioDisparado, ios: esIOS() });
      return htmlAudioDisparado;
    }

    if (!audioDesbloqueado && !tieneActivacionUsuario()) {
      registrarDiagnostico({ tipo: 'audio-blocked', ios: esIOS(), audioDesbloqueado, state: ctx.state });
      return htmlAudioDisparado;
    }

    if (ctx.state === 'suspended' && !reintento) {
      ctx.resume()
        .then(() => {
          audioDesbloqueado = true;
          programarAvisoSonoro(ctx, { urgente });
          registrarDiagnostico({ tipo: 'audio-after-resume', urgente, ios: esIOS(), state: ctx.state });
        })
        .catch(() => {
          registrarDiagnostico({ tipo: 'audio-resume-failed', urgente, ios: esIOS(), state: ctx.state });
        });

      return true;
    }

    programarAvisoSonoro(ctx, { urgente });

    registrarDiagnostico({ tipo: 'audio', urgente, htmlAudio: htmlAudioDisparado, ios: esIOS() });
    return true;
  } catch {
    registrarDiagnostico({ tipo: 'audio-error', urgente, ios: esIOS() });
    return false;
  }
}

export function activarSonidoPedido() {
  hapticaDesbloqueada = true;
  const desbloqueado = desbloquearAudioAviso();
  registrarDiagnostico({ tipo: 'manual-audio-activation', desbloqueado, ios: esIOS() });
  return desbloqueado;
}

function dispararPulsoVisual({ urgente = false } = {}) {
  if (typeof document === 'undefined') return false;

  const ahora = Date.now();
  if (ahora - ultimoPulsoVisual < 900) return false;
  ultimoPulsoVisual = ahora;

  const previo = document.getElementById('comanda-haptic-flash');
  if (previo) previo.remove();

  const flash = document.createElement('div');
  flash.id = 'comanda-haptic-flash';
  flash.setAttribute('aria-hidden', 'true');
  flash.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 999998;
    background:
      radial-gradient(circle at 50% 46%, rgba(255, 255, 255, ${urgente ? '0.28' : '0.18'}), transparent 42%),
      linear-gradient(135deg, rgba(255, 70, 92, ${urgente ? '0.28' : '0.2'}), rgba(0, 210, 190, 0.16));
    animation: comandaHapticFlash ${urgente ? '1.2s' : '0.86s'} ease-out both;
  `;

  if (!document.getElementById('comanda-haptic-flash-style')) {
    const style = document.createElement('style');
    style.id = 'comanda-haptic-flash-style';
    style.textContent = `
      @keyframes comandaHapticFlash {
        0% { opacity: 0; transform: scale(0.985); }
        12% { opacity: 1; transform: scale(1); }
        32% { opacity: .42; }
        54% { opacity: .9; }
        100% { opacity: 0; transform: scale(1.012); }
      }
      body.comanda-haptic-shake {
        animation: comandaHapticShake .62s cubic-bezier(.36,.07,.19,.97) both;
      }
      @keyframes comandaHapticShake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
        40%, 60% { transform: translate3d(3px, 0, 0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(flash);
  document.body.classList.add('comanda-haptic-shake');
  window.setTimeout(() => {
    flash.remove();
    document.body.classList.remove('comanda-haptic-shake');
  }, urgente ? 1300 : 980);

  registrarDiagnostico({ tipo: 'visual-pulse', urgente, ios: esIOS() });
  return true;
}

function emitirAvisoSensorial(pattern, { urgente = false, dedupeKey } = {}) {
  const vibro = soportaVibracionPedido() && puedeVibrarAhora()
    ? ejecutarVibracion(pattern)
    : false;
  const sono = reproducirAvisoSonoro({ urgente });
  const visual = dispararPulsoVisual({ urgente });

  registrarDiagnostico({
    tipo: 'sensory-alert',
    dedupeKey,
    vibracion: vibro,
    audio: sono,
    visual,
    ios: esIOS(),
    pattern
  });

  return Boolean(vibro || sono || visual);
}

function registrarDiagnostico(info) {
  if (typeof window === 'undefined') return;
  window.__COMANDA_HAPTICS__ = {
    supported: soportaVibracionPedido(),
    ios: esIOS(),
    mobileDetected: esDispositivoMovil(),
    unlocked: hapticaDesbloqueada,
    audioUnlocked: audioDesbloqueado,
    hasUserActivation: tieneActivacionUsuario(),
    visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
    pending: pendientes.length,
    last: {
      at: new Date().toISOString(),
      ...info
    }
  };
}

function procesarPendientes() {
  if (!puedeVibrarAhora() && !audioDesbloqueado) return;

  while (pendientes.length > 0) {
    const pendiente = pendientes.shift();
    vibrar(pendiente.pattern, pendiente.dedupeKey, {
      encolar: false,
      urgente: pendiente.urgente
    });
  }
}

function marcarInteraccionHaptica() {
  hapticaDesbloqueada = true;
  registrarDiagnostico({ tipo: 'user-activation-silent', ios: esIOS() });
  procesarPendientes();
}

export function prepararHapticaPedido() {
  if (listenersInstalados || typeof window === 'undefined' || typeof document === 'undefined') return;

  listenersInstalados = true;
  window.__COMANDA_ACTIVAR_SONIDO__ = activarSonidoPedido;
  window.__COMANDA_PROBAR_SONIDO__ = vibrarPruebaPedido;
  const opts = { passive: true, capture: true };
  const eventosActivacion = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];

  eventosActivacion.forEach((eventName) => {
    window.addEventListener(eventName, marcarInteraccionHaptica, opts);
  });

  window.addEventListener('focus', procesarPendientes, opts);
  document.addEventListener('visibilitychange', procesarPendientes, opts);
}

function encolarVibracion(pattern, dedupeKey, urgente) {
  const yaPendiente = pendientes.some((pendiente) => pendiente.dedupeKey === dedupeKey);
  if (yaPendiente) return false;

  pendientes.push({ pattern, dedupeKey, urgente });
  if (pendientes.length > MAX_PENDIENTES) {
    pendientes.shift();
  }
  registrarDiagnostico({ tipo: 'queued', dedupeKey, pattern });
  return false;
}

function vibrar(pattern, dedupeKey, { encolar = true, urgente = false } = {}) {
  prepararHapticaPedido();

  const ahora = Date.now();
  const ultimo = ultimosDisparos.get(dedupeKey) ?? 0;
  if (ahora - ultimo < DEDUPE_MS) return false;

  ultimosDisparos.set(dedupeKey, ahora);

  try {
    if (!puedeVibrarAhora() && !audioDesbloqueado) {
      dispararPulsoVisual({ urgente });
      return encolar ? encolarVibracion(pattern, dedupeKey, urgente) : false;
    }
    return emitirAvisoSensorial(pattern, { urgente, dedupeKey });
  } catch {
    registrarDiagnostico({ tipo: 'error', dedupeKey, pattern });
    return false;
  }
}

export function vibrarCambioEstadoPedido({ pedidoId, estadoAnterior, estadoNuevo }) {
  const anterior = normalizarEstado(estadoAnterior);
  const nuevo = normalizarEstado(estadoNuevo);

  if (!nuevo || anterior === nuevo || !ESTADOS_CON_HAPTICA.has(nuevo)) {
    registrarDiagnostico({
      tipo: 'ignored-state',
      pedidoId,
      estadoAnterior,
      estadoNuevo,
      anterior,
      nuevo
    });
    return false;
  }

  const pattern = PATRONES_ESTADO[nuevo] ?? [100, 50, 100];
  return vibrar(pattern, `estado:${pedidoId ?? 'actual'}:${anterior ?? 'none'}:${nuevo}`, {
    urgente: nuevo === 'listo' || nuevo === 'cancelado'
  });
}

export function vibrarLlamadoPedido({ pedidoId, eventId, payload }) {
  const fallbackId = payload
    ? JSON.stringify({
        pedidoId: payload.pedidoId ?? pedidoId ?? null,
        eventId: payload.eventId ?? eventId ?? null,
        createdAt: payload.createdAt ?? payload.fecha ?? payload.timestamp ?? null,
        titulo: payload.titulo ?? null,
        mensaje: payload.mensaje ?? null
      })
    : 'sin-payload';

  return vibrar(PATRON_LLAMADO, `llamado:${pedidoId ?? 'actual'}:${eventId ?? fallbackId}`, {
    urgente: true
  });
}

export function vibrarPruebaPedido() {
  return vibrar(PATRON_LLAMADO, `prueba:${Date.now()}`, { encolar: true, urgente: true });
}
