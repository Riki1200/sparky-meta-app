# Guion de demo: Sparky Reader (3 minutos)

## Antes de subir al escenario

- [ ] App publicada en HTTPS (EAS Hosting, ver README §5) y abierta en el **navegador de un teléfono real** (Chrome o Safari). Agregada a la pantalla de inicio.
- [ ] Proxy de la API de Meta en línea y `EXPO_PUBLIC_META_API_BASE_URL` apuntando a él.
- [ ] En **Escudo de Privacidad** (menú ☰): activar **Meta Muse Voice** y **Lectura de páginas con Meta Muse Spark**.
- [ ] Un **libro infantil físico** con una página corta (2–4 oraciones, letra grande) y buena luz.
- [ ] Haber hecho una lectura de prueba ese día, para que el micrófono y la cámara ya tengan permiso.
- [ ] Plan B si falla la red: el botón **Demo** funciona sin internet.

## Guion

**0:00–0:25 · El problema**
> "Many children finish primary school still unable to read and understand a simple text. Their parents can't always sit with them every night, and a tutor is a luxury. But almost every home has a few printed books."

> Sin cifras: cuenten una historia real (un niño o una familia que conozcan) en vez de estadísticas que no puedan respaldar.

**0:25–0:50 · Escanear un libro real**
Toca la cámara, fotografía la página del libro físico.
> "Sparky works with the books families already own. Meta Muse Spark reads the photo and turns it into an interactive page."

**0:50–1:40 · Leer en voz alta** (el corazón de la demo)
Toca el micrófono grande y lee la página en voz alta. **Equivócate a propósito** en una palabra y haz una pausa larga antes de otra.
> "As the child reads, every word lights up: green when it's right, yellow when they hesitate, red when they need practice. Sparky never interrupts; it just listens."

Al terminar sale la celebración: señala el puntaje **Verif. Meta**.
> "When the reading ends, Meta Muse Voice transcribes the whole session and we re-score it against the page. Parents get a second opinion from Meta AI, not just the browser."

**1:40–2:10 · El tutor**
Toca la palabra en la que te equivocaste.
> "Tap any word: Muse Spark explains it like a patient tutor, with syllables you can hear and a picture."

Opcional (si sobra tiempo): pestaña **Preguntar**, haz una pregunta en voz alta sobre el cuento.

**2:10–2:40 · El reporte para la familia**
Pestaña **Reporte**: WPM, precisión, palabras para practicar, tarjeta de verificación Meta. Toca **Compartir por WhatsApp**.
> "Parents get a report they understand, in their language, and can send it to the teacher on WhatsApp."

**2:40–3:00 · Privacidad y cierre**
Abre el **Escudo de Privacidad**.
> "Every cloud feature is off by default and switched on by a parent. Without it, photos and voices never leave the phone. Nine languages, any printed book, a patient tutor for every child."

## Preguntas probables del jurado

| Pregunta | Respuesta honesta |
| --- | --- |
| ¿Qué hace Meta que sea imprescindible? | Muse Spark lee las fotos de libros reales (visión) y es el tutor; Muse Voice verifica y recalifica la lectura de cada sesión. |
| ¿Funciona como app nativa? | Hoy es una web móvil instalable (PWA): la lectura en vivo usa el reconocimiento de voz del navegador. La versión nativa es el siguiente paso. |
| ¿Qué tan preciso es? | El puntaje en vivo es una guía para el niño; el puntaje verificado por Meta es el que ve el padre. No es una evaluación clínica. |
| ¿De dónde salen las referencias de WPM? | Normas de fluidez de Hasbrouck & Tindal (2017), en inglés; las usamos como referencia, no como diagnóstico. |
| ¿Y los datos de los niños? | Nada sale del teléfono sin permiso del adulto. La clave de la API vive en un proxy, no en la app. |

## Si algo falla

- **No reconoce la voz** → usa **Demo** y explica el flujo mientras corre.
- **La foto no se lee** → en el escáner usa una de las páginas de muestra (*1-Click Test*).
- **Sin internet** → la demo, las palabras tocables y el reporte funcionan sin red; solo el tutor y la verificación Meta necesitan conexión.
