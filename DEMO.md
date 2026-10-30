# Guion de demo: Sparky Reader (3 minutos)

La demo la hace un adulto leyendo **como un lector principiante**. No hace falta un niño: el jurado necesita ver que la app funciona con un libro real y una voz real, y leyendo tú controlas los errores para que la demo salga igual cada vez.

Dilo al empezar, con honestidad:
> "I'll read like a beginner reader so you can see how Sparky reacts."

## Preparación

**Equipo**
- [ ] Publicada con `npm run deploy` (README §5) e **instalada en el teléfono** desde `https://sparky-lector.web.app`: Chrome → *Instalar app*, o Safari → *Compartir → Agregar a inicio*.
- [ ] En **Escudo de Privacidad** (menú ☰): activar **Meta Muse Voice** y **Lectura de páginas con Meta Muse Spark**.
- [ ] Una lectura de prueba ese mismo día, para que el micrófono y la cámara ya tengan permiso.
- [ ] Si el reconocimiento de voz no responde con la app instalada, ábrela en una pestaña normal de Chrome o Safari y repite la prueba.

**Libro**
- [ ] Un libro infantil físico con una página corta: 2–4 oraciones, letra grande, sin texto dentro de los dibujos.
- [ ] Buena luz y la página lo más plana posible.
- [ ] Elige desde antes **la palabra en la que te vas a equivocar** (una larga, por ejemplo *butterfly* o *mariposa*) y **la palabra antes de la que harás una pausa**.

## Cómo leer como principiante

- Lee **despacio**, palabra por palabra, en voz clara.
- **Error a propósito**: cambia la palabra elegida por algo parecido (*butterfly* → "butterfry"). Saldrá en rojo.
- **Vacilación a propósito**: antes de otra palabra, quédate callado **2–3 segundos**. Saldrá en amarillo.
- El resto, bien leído: saldrá en verde.
- No te corrijas solo: deja que Sparky lo marque.

## Guion

**0:00–0:20 · El problema**
> "Many children finish primary school still unable to read and understand a simple text. Their parents can't always sit with them every night, and a tutor is a luxury. But almost every home has a few printed books."

**0:20–0:45 · Escanear el libro real**
Abre Sparky desde el ícono en la pantalla de inicio. Toca la cámara y fotografía la página.
> "Sparky works with the books families already own. Meta Muse Spark reads the photo and turns it into an interactive page."

**0:45–1:35 · Leer en voz alta** (el corazón de la demo)
Toca el micrófono grande y lee como principiante, con el error y la pausa.
> "As the child reads, every word lights up: green when it's right, yellow when they hesitate, red when they need practice. Sparky never interrupts; it just listens."

Al terminar sale la celebración: señala **Verif. Meta**.
> "When the reading ends, Meta Muse Voice transcribes the whole session and we re-score it against the page. Parents get a second opinion from Meta AI, not just the browser."

**1:35–2:05 · El tutor**
Toca la palabra en la que te equivocaste.
> "Tap any word: Muse Spark explains it like a patient tutor, with syllables you can hear and a picture."

**2:05–2:30 · El reporte para la familia**
Pestaña **Reporte**: velocidad, precisión, palabras para practicar y la tarjeta de verificación Meta. Toca **Compartir por WhatsApp**.
> "Parents get a report they understand, in their language, and can send it to the teacher on WhatsApp."

**2:30–2:45 · Idiomas**
Menú ☰ → idioma → English/Español.
> "Nine languages: stories, buttons and the tutor switch instantly."

**2:45–3:00 · Privacidad y cierre**
Abre el **Escudo de Privacidad**.
> "Every cloud feature is off by default and switched on by a parent. Without it, photos and voices never leave the phone. Any printed book, a patient tutor for every child."

## Grabar el video

Graba antes, aunque luego presentes en vivo: es tu plan B y la mayoría de los hackathons piden video.

| Plano | Cómo |
| --- | --- |
| A · Pantalla | Grabación de pantalla del propio teléfono (iPhone: Centro de control → Grabar pantalla con el micrófono activado; Android: Grabador de pantalla). Capta la app y tu voz. |
| B · Manos y libro | Con otro teléfono, graba tus manos sosteniendo el libro y apuntando la cámara. Demuestra que el libro es físico. |
| C · Voz en off | Graba el guion aparte, en un lugar silencioso, si el audio de la toma A no queda limpio. |

Montaje: B (abrir el libro y escanear) → A (lectura, tutor, reporte, idiomas, privacidad), con la voz en off encima. Graba 2–3 tomas de la lectura y quédate con la mejor.

## Si quieres incluir a un niño

Es opcional. Si lo haces:
- **Permiso por escrito** de los padres para grabar y publicar.
- **Sin mostrar su cara**: solo manos, libro y pantalla.
- **No hace falta que sea bilingüe**: que lea en su idioma; los otros idiomas los muestras tú desde el menú.
- Graba varias tomas; no lo hagas en vivo.

## Preguntas probables del jurado

| Pregunta | Respuesta honesta |
| --- | --- |
| ¿Qué hace Meta que sea imprescindible? | Muse Spark lee las fotos de libros reales (visión) y es el tutor; Muse Voice verifica y recalifica cada sesión. |
| ¿Es una app nativa? | Es una web app instalable (PWA): se instala desde el navegador y abre sin internet. La lectura en vivo usa el reconocimiento de voz del navegador. La versión nativa es el siguiente paso. |
| ¿Qué tan preciso es? | El puntaje en vivo es una guía para el niño; el verificado por Meta es una segunda opinión para el padre. No es una evaluación clínica. |
| ¿De dónde sale la referencia de velocidad? | Normas de fluidez de Hasbrouck & Tindal (2017), en inglés; la usamos como referencia, no como diagnóstico. |
| ¿Y los datos de los niños? | Nada sale del teléfono sin permiso del adulto. La clave de la API vive en un proxy, no en la app. |

## Si algo falla en vivo

- **No reconoce la voz** → toca **Demo** y explica el flujo mientras corre.
- **La foto no se lee** → en el escáner usa una página de muestra (*1-Click Test*).
- **Sin internet** → la app instalada abre igual; la demo, las palabras tocables y el reporte funcionan. Solo el tutor, el escaneo con Meta y la verificación necesitan conexión.
