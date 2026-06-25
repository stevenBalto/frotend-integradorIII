# FRONTEND — Contexto del Proyecto Rooster Pizza & Grill

Frontend del Proyecto Integrador III. Cliente ficticio: Rooster Pizza &
Grill. Stack: Ionic, un solo proyecto con tres modos: app cliente (4 tabs:
Inicio, Carrito, Cupones, Mi cuenta), panel admin (10 módulos, role-gated),
modo kiosko de autoservicio. El repo hermano `backend-integradorIII` es
Laravel + PostgreSQL y se comunica con este frontend solo por API REST —
no comparten subagentes.

## Protocolo de enrutamiento
Antes de responder una tarea de implementación o revisión, anunciá en una
línea cuál subagente vas a usar y por qué:
`Agente: [nombre] — Razón: [una línea breve]`
Si el usuario indica que prefiere otro agente, usá ese sin discutir.

## Matriz de decisión

| Intención del usuario | Agente | Modelo |
|---|---|---|
| Implementar/crear/modificar pantallas, componentes, servicios Ionic/Angular | frontend-developer | opus |
| Revisar que una pantalla respete la guía visual (sin negro de fondo en app cliente, 70-20-10 en admin, colores de marca) | ui-verifier | sonnet |
| Conectar pantallas con endpoints del backend, manejo de loading/error, mapeo de API Resources a modelos | api-integration-helper | sonnet |
| Actualizar documentación técnica viva del proyecto | doc-updater | sonnet |
| Vigilar que un cambio no rompa el esquema de datos vigente (21 tablas del backend) sin aprobación explícita | db-schema-guardian | sonnet |
| Verificar alineación de nombres/estados entre lo que el frontend espera y lo que el backend expone | consistency-checker | sonnet |
| Pregunta general, arquitectura, planificación | Respuesta directa (sin agente) | — |

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
