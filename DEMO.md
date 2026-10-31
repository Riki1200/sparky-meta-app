# Guion de demo: Sparky Reader (3 minutos)

Sparky es un tutor de lectura para **adultos (18+)**: personas que no aprendieron a leer con fluidez y personas que leen en un idioma nuevo. En la demo lee un adulto, que es exactamente el usuario de la app. Leyendo tú, controlas los errores y la demo sale igual cada vez.

Al empezar, preséntate como usuario:
> "Imagine I'm an adult learning to read in a new language. This is my evening practice."

## Preparación

**Equipo**
- [ ] Publicada con `npm run deploy` (README §5) e **instalada en el teléfono** desde `https://sparky-lector.web.app`: Chrome → *Instalar app*, o Safari → *Compartir → Agregar a inicio*.
- [ ] En la bienvenida, marca **"Confirmo que tengo 18 años o más"**.
- [ ] En **Escudo de Privacidad** (menú ☰): activa **Meta Muse Voice** y **Lectura de páginas con Meta Muse Spark**.
- [ ] Una lectura de prueba ese mismo día, para que el micrófono y la cámara ya tengan permiso.
- [ ] Si el reconocimiento de voz no responde con la app instalada, ábrela en una pestaña normal de Chrome o Safari y repite la prueba.

**Página para leer**
- [ ] Algo impreso y cotidiano, con 2–4 oraciones de letra clara: una página de un libro, una nota, un aviso, una receta. Sin texto dentro de dibujos.
- [ ] Buena luz y la página lo más plana posible.
- [ ] Elige desde antes **la palabra en la que te vas a equivocar** (una larga, por ejemplo *appointment* o *ingredientes*) y **la palabra antes de la que harás una pausa**.

## Cómo leer como principiante

- Lee **despacio**, palabra por palabra, en voz clara.
- **Error a propósito**: cambia la palabra elegida por algo parecido (*appointment* → "apointmen"). Saldrá en rojo.
- **Vacilación a propósito**: antes de otra palabra, quédate callado **2–3 segundos**. Saldrá en amarillo.
- El resto, bien leído: saldrá en verde.
- No te corrijas solo: deja que Sparky lo marque.

## Guion

**0:00–0:20 · El problema**
> "Millions of adults read with difficulty, or are learning to read in a new language. Practicing out loud in front of other people is embarrassing, and a tutor is expensive. But everyone has printed pages at home."

**0:20–0:45 · Escanear una página real**
Abre Sparky desde el ícono en la pantalla de inicio. Toca la cámara y fotografía la página.
> "Sparky works with whatever you need to read: a book, a letter, a notice. Meta Muse Spark reads the photo and turns it into an interactive page."

**0:45–1:35 · Leer en voz alta** (el corazón de la demo)
Toca el micrófono grande y lee como principiante, con el error y la pausa.
> "As I read, every word lights up: green when it's right, yellow when I hesitate, red when I need practice. Sparky never interrupts; it just listens."

Al terminar sale la celebración: señala **Verif. Meta**.
> "When I finish, Meta Muse Voice transcribes the whole session and we re-score it against the page. A second opinion from Meta AI, not just the browser."

**1:35–2:05 · El tutor**
Toca la palabra en la que te equivocaste.
> "Tap any word: Muse Spark explains it in plain language, with syllables I can hear and an everyday example."

**2:05–2:30 · Mi progreso**
Pestaña **Mi progreso**: velocidad, precisión, palabras para practicar y la tarjeta de verificación Meta. Toca **Compartir por WhatsApp**.
> "I can see my progress over time, and share it with my teacher or literacy class on WhatsApp."

**2:30–2:45 · Idiomas**
Menú ☰ → idioma → English/Español.
> "Nine languages: the interface, the practice texts and the coach switch instantly."

**2:45–3:00 · Privacidad y cierre**
Abre el **Escudo de Privacidad**.
> "Sparky is for adults, and every cloud feature is off until I turn it on. Without that, my photos and my voice never leave the phone. Any printed page, a patient coach for every adult who wants to read better."

## Grabar el video

Graba antes, aunque luego presentes en vivo: es tu plan B y la mayoría de los hackathons piden video.

| Plano | Cómo |
| --- | --- |
| A · Pantalla | Grabación de pantalla del propio teléfono (iPhone: Centro de control → Grabar pantalla con el micrófono activado; Android: Grabador de pantalla). Capta la app y tu voz. |
| B · Manos y página | Con otro teléfono, graba tus manos sosteniendo la página y apuntando la cámara. Demuestra que el texto es real e impreso. |
| C · Voz en off | Graba el guion aparte, en un lugar silencioso, si el audio de la toma A no queda limpio. |

Montaje: B (tomar la página y escanear) → A (lectura, tutor, progreso, idiomas, privacidad), con la voz en off encima. Graba 2–3 tomas de la lectura y quédate con la mejor.

Si sale otra persona leyendo, que sea **mayor de 18** y con su permiso por escrito para grabar y publicar.

## Preguntas probables del jurado

| Pregunta | Respuesta honesta |
| --- | --- |
| ¿Para quién es? | Adultos (18+) que leen con dificultad o están aprendiendo a leer en otro idioma. La app pide confirmar la edad al empezar. |
| ¿Por qué no para niños? | Las condiciones de la API de Meta no permiten usuarios menores de 18, así que la diseñamos para adultos desde el inicio. |
| ¿Qué hace Meta que sea imprescindible? | Muse Spark lee las fotos de páginas reales (visión) y es el tutor; Muse Voice verifica y recalifica cada sesión. |
| ¿Es una app nativa? | Es una web app instalable (PWA): se instala desde el navegador y abre sin internet. La lectura en vivo usa el reconocimiento de voz del navegador. La versión nativa es el siguiente paso. |
| ¿Qué tan preciso es? | El puntaje en vivo es una guía; el verificado por Meta es una segunda opinión. No es una evaluación clínica. |
| ¿Y los datos? | Nada sale del teléfono sin que el usuario lo active. La clave de la API vive en un proxy, no en la app. |

## Si algo falla en vivo

- **No reconoce la voz** → menú **Más** → **Demo** y explica el flujo mientras corre.
- **La foto no se lee** → en el escáner usa una página de muestra (*1-Click Test*).
- **Sin internet** → la app instalada abre igual; la demo, las palabras tocables y el progreso funcionan. Solo el tutor, el escaneo con Meta y la verificación necesitan conexión.
