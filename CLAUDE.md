# FRONTEND — Contexto del Proyecto Rooster Pizza & Grill

Frontend del Proyecto Integrador III. Cliente ficticio: Rooster Pizza &
Grill. Stack: Ionic, un solo proyecto con tres modos: app cliente (4 tabs:
Inicio, Carrito, Cupones, Mi cuenta), panel admin (10 módulos, role-gated),
modo kiosko de autoservicio. El repo hermano `backend-integradorIII` es
Laravel + PostgreSQL y se comunica con este frontend solo por API REST —
no comparten subagentes.

## Protocolo de enrutamiento
El enrutamiento es automático en cada turno (lo hace el hilo principal con esta
matriz). Antes de delegar o responder, mostrá una línea de ruta visible:
`[Ruta] Subagente: <nombre|ninguno> | Modelo: <opus/sonnet/haiku> | Esfuerzo: <alto/medio/bajo> | Pensamiento: <on/off> | Motivo: <una frase>`
Si el usuario prefiere otro agente, usá ese sin discutir.

**Regla de gasto (ni tacaño ni derrochador):** elegí el tier más bajo que sirve.
Trivial/lookup/doc → context-keeper o respuesta directa (liviano, sin pensamiento).
Revisión → checkers sonnet. Construcción/riesgo → opus con pensamiento. Si la
intención es simple aunque toque un dominio pesado, bajá de tier automáticamente.
Solo `model` es nativo del subagente; `esfuerzo` y `pensamiento` son comportamiento + criterio de ruta.

## Documentación
Este proyecto NO maneja documentación propia. Toda la documentación que se lee o
actualiza (incluida la de frontend) vive en el backend:
`C:\xampp\htdocs\Back_Integradorlll\backend-integradorIII\documentacion` (frontend en `front-document/`).
Consultá con context-keeper y actualizá con doc-updater apuntando a esa ruta.

## Matriz de decisión

| Intención del usuario | Agente | Modelo | Esfuerzo | Pensamiento |
|---|---|---|---|---|
| Implementar/crear/modificar pantallas, componentes, servicios Ionic/Angular | frontend-developer | opus | alto | sí |
| Revisar que una pantalla respete la guía visual (sin negro de fondo en app cliente, 70-20-10 en admin, colores de marca) | ui-verifier | sonnet | medio | no |
| Conectar pantallas con endpoints del backend, manejo de loading/error, mapeo de API Resources a modelos | api-integration-helper | sonnet | medio | no |
| Vigilar que un cambio no rompa el esquema de datos vigente (21 tablas del backend) sin aprobación explícita | db-schema-guardian | sonnet | medio | sí |
| Verificar alineación de nombres/estados entre lo que el frontend espera y lo que el backend expone | consistency-checker | sonnet | medio | no |
| Actualizar documentación técnica viva del proyecto | doc-updater | sonnet | bajo | no |
| Preguntar sobre código/doc/contexto ya documentado | context-keeper | sonnet | bajo | no |
| Pedir recomendación explícita de ruta | orquestador | haiku | bajo | no |
| Pregunta general, arquitectura, planificación | Respuesta directa (sin agente) | liviano | bajo | no |

## Reglas de diseño visual
- App cliente: NUNCA fondo negro. Negro reservado solo para texto/iconos.
  Colores cálidos de marca: rojo Pantone 185C, naranja, dorado, tan.
- Panel admin: esquema neutral 70-20-10. Fondo gris-blanco, tarjetas
  blancas, sidebar negro, rojo solo en nav activo y botones primarios,
  barras de gráfico en gris con rojo resaltando solo el dato pico.
- No hay soporte de delivery en esta versión (sin pantallas de dirección
  de envío).

## Convenciones generales
- Cart/checkout solo ofrece "Comer aquí" / "Para llevar", no delivery.
- Modificadores de producto (tamaño, masa, extras) varían por categoría y
  recalculan precio en vivo.
- Alcance excluye intencionalmente: delivery, menús distintos por
  sucursal, push marketing automatizado. No agregar sin instrucción
  explícita del usuario.

## Git — regla estricta
Claude NUNCA, bajo ninguna circunstancia, se autoasigna como colaborador ni coautor del repositorio:
- No agregar el trailer `Co-Authored-By` de Claude/IA en los commits.
- No agregarse como collaborator en GitHub ni firmar como coautor.
- Los commits van únicamente a nombre del desarrollador humano.
