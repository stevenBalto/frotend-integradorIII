
---

## 2. Paleta de colores

### 2.1 Paleta de usuario (vistas públicas)

| Token | Hex | Uso |
|---|---|---|
| `red` | `#E13642` | Acento principal, botones CTA, precio, logo |
| `orange` | `#F58220` | Destaque secundario, badges de categoría |
| `gold` | `#F2B134` | Estrellas de rating, detalles cálidos |
| `brown` | `#A8895E` | Textos secundarios, bordes suaves, detalles cálidos |
| `dark` | `#1E1E1E` | Texto principal, encabezados |
| `white` | `#FFFFFF` | Fondos de tarjeta, superficies |
| `bg` | `#FAF7F2` | Fondo general de la app (crema cálido) |
| `border` | `rgba(168,137,94,0.25)` | Bordes de tarjeta, separadores |
| `muted` | `#6b6b6b` | Texto de apoyo, placeholders |
| `green` | `#2e9e4f` | Estado: disponible, completado |
| `amber` | `#F59E0B` | Estado: en proceso, advertencia |

### 2.2 Paleta de administración (vistas admin — SaaS)

| Token | Hex | Uso |
|---|---|---|
| `panel` | `#F7F5F2` | Fondo general del panel admin |
| `card` | `#FFFFFF` | Fondo de tarjetas y secciones |
| `border` | `#E5E7EB` | Bordes de tarjetas y tablas |
| `text` | `#1E1E1E` | Texto principal |
| `textMuted` | `#6B7280` | Texto secundario, labels |
| `textSoft` | `#9CA3AF` | Texto terciario, ejes de gráficos |
| `neutral1` | `#E5E7EB` | Fondo chip inactivo, barras sin énfasis |
| `neutral2` | `#9CA3AF` | Íconos suaves, líneas |
| `neutral3` | `#6B7280` | Íconos secundarios |
| `neutral4` | `#374151` | Texto énfasis medio |
| `sidebar` | `#1E1E1E` | Fondo del sidebar de navegación |
| `accent` | `#E13642` | Único acento: ítem activo sidebar, botón primario, barra máxima en gráficos |
| `green` | `#16A34A` | Estado: completado, tendencia positiva |
| `amber` | `#F59E0B` | Estado: en proceso, pendiente |
| `red` | `#DC2626` | Estado: cancelado, error, alerta crítica |

> **Regla de oro admin:** Los gráficos usan escala de grises (`neutral1`–`neutral4`). El rojo `accent` se reserva **únicamente** para el punto de mayor valor o importancia. Los estados semánticos (verde/ámbar/rojo) solo aplican a badges de estado.

---

## 3. Tipografía

| Rol | Fuente | Uso |
|---|---|---|
| **Serif / Display** | `Playfair Display` | Nombre del restaurante, títulos hero, encabezados de sección en vista usuario |
| **Sans / UI** | `Nunito` | Todo el resto: cuerpo de texto, botones, etiquetas, tablas, admin |

### Escala de tamaños (referencia en px)

| Uso | Tamaño | Peso |
|---|---|---|
| Título hero / nombre app | 28–32px | 800 |
| Título de sección | 18–22px | 700 |
| Subtítulo / card header | 13–15px | 700 |
| Cuerpo de texto | 11–13px | 400–600 |
| Label / caption | 9–11px | 500–700 |
| Micro / ejes de gráficos | 8–9px | 600 |

> En Ionic usar variables CSS: `--ion-font-family: 'Nunito', sans-serif` como base. Importar Playfair Display desde Google Fonts para headings.

---

## 4. Espaciado y bordes

| Token | Valor | Uso |
|---|---|---|
| Radio pequeño | `8px` | Badges, chips, inputs |
| Radio medio | `12px` | Cards, botones |
| Radio grande | `16px` | Cards principales, modales |
| Radio extra | `20–24px` | Cards hero, bottom sheet |
| Gap entre items | `8–12px` | Listas, grids |
| Padding de card | `16–20px` | Padding interno de tarjetas |
| Shadow card | `0 2px 8px rgba(0,0,0,0.06)` | Sombra suave en cards con hover |

---

## 5. Vistas / Pantallas

### 5.1 Flujo de usuario

```
Login
  └── Registro (link en login)
  └── Home (después de autenticarse)
        ├── Menú (vista principal con categorías y platos)
        ├── Carrito (bottom sheet / modal)
        │     └── Checkout
        └── Cuenta (perfil, historial de pedidos, cerrar sesión)
```

### 5.2 Flujo de administrador

```
Login (usuario: admin / contraseña: 123)
  └── Panel Admin
        ├── Dashboard
        ├── Pedidos
        ├── Menú / Catálogo
        ├── Ofertas
        ├── Usuarios
        ├── Analíticas
        ├── Notificaciones
        ├── Reseñas
        └── Configuración
```

---

## 6. Navegación

### 6.1 Vista usuario — Bottom Navigation (mobile)

Barra inferior con 3 ítems:

| Ícono | Label | Vista |
|---|---|---|
| `Home` | Inicio | Menú principal |
| `ShoppingCart` | Carrito | Carrito de compras |
| `User` | Cuenta | Perfil de usuario |

- **Fondo:** `#1E1E1E` (negro)
- **Ícono activo:** `#E13642` (rojo)
- **Ícono inactivo:** gris suave `#9CA3AF`
- En **tablet/desktop** (`md:` en adelante) mostrar sidebar lateral en lugar del bottom nav

### 6.2 Vista admin — Sidebar Navigation (desktop)

Sidebar fijo a la izquierda, fondo `#1E1E1E`:

| Ícono | Label | Módulo |
|---|---|---|
| `LayoutDashboard` | Dashboard | dashboard |
| `ClipboardList` | Pedidos | pedidos |
| `ChefHat` | Menú | menu |
| `Tag` | Ofertas | ofertas |
| `Users` | Usuarios | usuarios |
| `BarChart2` | Analíticas | analiticas |
| `Bell` | Notificaciones | notificaciones |
| `Star` | Reseñas | resenas |
| `Settings` | Configuración | configuracion |

- **Header del sidebar:** Logo R (sin fondo) + texto "Rooster Admin"
- **Ítem activo:** fondo `#E13642`, texto blanco
- **Ítem inactivo:** texto `#9CA3AF`, hover fondo `rgba(255,255,255,0.05)`
- En **mobile** mostrar como drawer o bottom tab

---

## 7. Componentes

### 7.1 Botón primario (CTA)

```
Fondo:    #E13642
Texto:    #FFFFFF  |  Peso: 700
Radio:    12px
Padding:  12px 24px
Hover:    opacity 0.9
```

Uso: "Agregar al carrito", "Ver todos los pedidos", acciones principales.

### 7.2 Botón secundario

```
Fondo:    transparent
Borde:    1px solid rgba(168,137,94,0.25)
Texto:    #1E1E1E  |  Peso: 600
Radio:    12px
```

### 7.3 Tarjeta de plato (DishCard)

```
Fondo:      #FFFFFF
Radio:      16px
Sombra:     0 2px 8px rgba(0,0,0,0.06)
Imagen:     aspect-ratio 4/3, object-fit cover, radio superior 16px
Precio:     #E13642, Nunito 700
Nombre:     #1E1E1E, Nunito 700, 14px
Descripción: #6b6b6b, Nunito 400, 11px
```

### 7.4 Chip de categoría

```
Activo:   fondo #E13642, texto blanco, radio 20px
Inactivo: fondo #FAF7F2, borde rgba(168,137,94,0.25), texto #1E1E1E
Imagen:   miniatura circular de 28px a la izquierda del label
```

### 7.5 StatusBadge (admin)

Pill redondeado con punto indicador y texto:

| Estado | Texto | Color fondo | Color texto/punto |
|---|---|---|---|
| `process` | En proceso | `#F59E0B1f` | `#F59E0B` |
| `completed` | Completado | `#16A34A1a` | `#16A34A` |
| `cancelled` | Cancelado | `#DC26261a` | `#DC2626` |
| `pending` | Pendiente | `#E5E7EB` | `#6B7280` |

### 7.6 ModalityPill (admin)

Pill neutral para modalidad de pedido:

| Modalidad | Texto | Color |
|---|---|---|
| `aqui` | Comer aquí | `#374151` |
| `llevar` | Para llevar | `#374151` |

Fondo siempre `#E5E7EB` (neutral1), sin color semántico.

### 7.7 KPI Card (admin)

```
Fondo:       #FFFFFF
Borde:       1px solid #E5E7EB
Radio:       12px
Ícono:       34x34px, fondo con opacidad del color semántico
Valor:       22px, Nunito 700
Label:       11px, #6B7280
Sub-texto:   10px, color semántico (verde/rojo/ámbar según tendencia)
```

### 7.8 Carrito (CartItem)

Cada ítem del carrito muestra:
- Imagen miniatura (48x48px, radio 8px)
- Nombre del plato + descripción de opciones elegidas
- Controles de cantidad (−/+) con total por ítem
- Precio en `#E13642`

### 7.9 Modal de detalle de plato

Bottom sheet o modal que incluye:
- Imagen hero (altura ~220px)
- Nombre (Playfair Display, 22px, 700)
- Precio base en rojo
- Selector de tamaño (chips)
- Selector de variante (chips)
- Extras (checkboxes con precio adicional)
- Notas adicionales (textarea)
- Botón "Agregar al carrito" fijo en la parte inferior

---

## 8. Gráficos

### 8.1 BarChart — Gráfico de barras vertical

Usado en: **Pedidos** (pedidos por día) y **Analíticas** (ventas por día, horas pico).

**Especificaciones:**
- Eje Y izquierdo con 5 niveles (0%, 25%, 50%, 75%, 100% del máximo)
- Líneas de grilla horizontales punteadas (`#E5E7EB`)
- Barras: radio superior `4px`, fondo `#E5E7EB` (neutral)
- **Barra máxima:** fondo `#E13642` (accent) + badge con valor encima
- Tooltip al hover en barras no-máximas (fondo `#1E1E1E`, texto blanco)
- Etiquetas de eje X debajo de cada barra (día, hora, etc.)
- Altura recomendada: `140–150px`

### 8.2 AreaChart — Gráfico de área

Usado en: **Dashboard** (ventas de la semana).

**Especificaciones:**
- Eje Y: porcentaje 20%–100% (cada 20%)
- Eje X: valores monetarios 5k–60k (cada 5k)
- Líneas de grilla horizontales punteadas
- Línea SVG principal en `#E13642`
- Gradiente de relleno: `#E1364240` (arriba) → `transparent` (abajo)
- Marcadores circulares en cada punto de datos (radio 3px, relleno blanco, borde rojo)
- Tooltip flotante en el punto máximo: fondo `#1E1E1E`, texto blanco

### 8.3 DonutChart — Gráfico de dona

Usado en: **Pedidos** (modalidad hoy) y **Analíticas** (modalidad de pedido).

**Especificaciones:**
- SVG con `strokeLinecap: round`
- Color primario: `#E13642` (porcentaje principal)
- Color secundario: `#9CA3AF` (resto)
- Centro: porcentaje en 18px/800 rojo + label en 8px/gris
- Tamaño: 100–110px de diámetro
- Leyenda lateral con pills de color

---

## 9. Módulos de administración

Cada módulo incluye:
1. `AdminPageHeader` — Logo R + título + subtítulo con ruta (breadcrumb) + acción derecha opcional
2. Fila de KPI Cards (2 columnas mobile, 4 columnas desktop)
3. Sección de gráficos o tabla principal
4. Acciones de gestión (crear, editar, filtrar)

### Módulos y sus características principales

| Módulo | Descripción |
|---|---|
| **Dashboard** | KPIs generales + AreaChart de ventas + card de pedidos nuevos con alerta pulsante |
| **Pedidos** | KPIs + BarChart semanal + DonutChart de modalidad + tabla con filtros de estado |
| **Menú / Catálogo** | Grid de productos con toggle disponible/no disponible, badge "Destacado", filtro por categoría |
| **Ofertas** | Lista de ofertas activas con badge de descuento, fechas de vigencia, toggle activo/inactivo |
| **Usuarios** | Tabla de clientes con fecha de registro, pedidos totales, estado de cuenta |
| **Analíticas** | KPIs del mes + BarChart ventas + BarChart horas pico + ranking productos + DonutChart modalidad |
| **Notificaciones** | Lista cronológica con íconos semánticos, badge sin leer, acción "marcar todas leídas" |
| **Reseñas** | Lista de reseñas con rating stars, respuesta del restaurante, filtro por puntuación |
| **Configuración** | Toggles de funciones, datos del restaurante, configuración de notificaciones |

---

## 10. Patrones UX

### 10.1 Responsive

| Breakpoint | Comportamiento |
|---|---|
| `< 768px` (mobile) | Bottom nav, 1 columna, tarjetas apiladas |
| `768px–1024px` (tablet) | 2 columnas en grids, sidebar colapsado |
| `> 1024px` (desktop) | Sidebar fijo visible, 4 columnas en KPIs, 5 columnas en charts |

### 10.2 Estados de carga

- Usar skeleton screens con fondo `#E5E7EB` y animación pulse
- No usar spinners en el centro de pantalla

### 10.3 Feedback de interacción

- Botones: `opacity: 0.9` en hover, `scale: 0.97` en press
- Cards: `box-shadow` más pronunciado en hover
- Toggles (disponibilidad de platos): transición suave 200ms

### 10.4 Carrito

- Badge rojo con conteo sobre el ícono del carrito en el bottom nav
- Al agregar un plato: animación breve de confirmación (toast o micro-animación)
- El total del carrito siempre visible en el footer del bottom sheet

### 10.5 Notificaciones de pedidos nuevos (admin)

- Card en dashboard con **punto rojo pulsante** (`animate-ping`) en el ícono de campana
- Badge contador con fondo `#E1364215`, texto `#E13642`
- Al entrar un pedido nuevo: push notification vía Capacitor

### 10.6 Tablas admin

- Cabecera: fondo `#F7F5F2`, texto uppercase 9px, `#6B7280`
- Filas: hover `#F9FAFB`, borde inferior `#E5E7EB`
- Cada fila clickeable → abre modal de detalle
- Paginación: botón activo fondo `#E13642`, texto blanco

---

## 11. Implementación en Ionic

### Variables CSS globales recomendadas

```css
:root {
  /* Brand */
  --color-red:    #E13642;
  --color-orange: #F58220;
  --color-gold:   #F2B134;
  --color-brown:  #A8895E;
  --color-dark:   #1E1E1E;
  --color-bg:     #FAF7F2;

  /* Admin */
  --color-panel:      #F7F5F2;
  --color-border:     #E5E7EB;
  --color-text-muted: #6B7280;
  --color-text-soft:  #9CA3AF;

  /* Semantic */
  --color-success: #16A34A;
  --color-warning: #F59E0B;
  --color-danger:  #DC2626;

  /* Typography */
  --font-sans:  'Nunito', sans-serif;
  --font-serif: 'Playfair Display', serif;

  /* Ionic overrides */
  --ion-font-family:        var(--font-sans);
  --ion-background-color:   var(--color-bg);
  --ion-text-color:         var(--color-dark);
  --ion-color-primary:      var(--color-red);
  --ion-color-primary-rgb:  225, 54, 66;
  --ion-toolbar-background: var(--color-dark);
  --ion-toolbar-color:      #FFFFFF;
  --ion-tab-bar-background: var(--color-dark);
  --ion-tab-bar-color:      #9CA3AF;
  --ion-tab-bar-color-selected: var(--color-red);
}
```

### Cargar Ionic puro (Web Components standalone)

Ionic puro usa los componentes `<ion-*>` como Web Components, sin framework. Se cargan vía CDN o npm (`@ionic/core`):

```html
<!-- index.html -->
<head>
  <!-- Ionic core como Web Components -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js"></script>
  <script nomodule src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css" />

  <!-- Fuentes del diseño -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />

  <!-- Variables de marca + estilos propios -->
  <link rel="stylesheet" href="theme/variables.css" />
  <link rel="stylesheet" href="theme/app.css" />
</head>
```

> Los íconos del prototipo son de `lucide-react`. En Ionic puro se reemplazan por **Ionicons** (`<ion-icon name="...">`), que ya vienen incluidos. Ver tabla de equivalencias en la sección 13.5.

### Estructura de archivos sugerida (sin framework)

```
src/
  index.html              ← shell de la app, carga Ionic + tabs
  theme/
    variables.css         ← variables CSS de marca (sección 11)
    app.css               ← clases utilitarias propias (.dish-card, .status-badge, etc.)
  pages/
    login.html
    register.html
    home.html             ← menú principal
    cart.html             ← carrito y checkout
    account.html          ← perfil de usuario
    admin/
      dashboard.html
      pedidos.html
      menu.html
      ofertas.html
      usuarios.html
      analiticas.html
      notificaciones.html
      resenas.html
      configuracion.html
  js/
    data.js               ← seed data (sección 12): DISHES, CATEGORIES, OPTIONS, etc.
    components.js          ← funciones que generan HTML (renderDishCard, renderStatusBadge…)
    charts.js             ← BarChart / AreaChart / DonutChart (SVG generado por JS)
    auth.js               ← login y verificación admin (admin / 123)
    router.js             ← navegación entre páginas / ion-router-outlet
  assets/
    rooster-logo.png
```

---

## 12. Contenido de prueba (seed data)

### Categorías
- Todos, Pizza, Grill, Pasta

### Platos de ejemplo

| Nombre | Categoría | Precio (₡) |
|---|---|---|
| Pizza Pepperoni | pizza | 155 |
| Pizza 4 Quesos | pizza | 165 |
| Pizza Margarita | pizza | 140 |
| Costillas BBQ | grill | 210 |
| Filete a la Parrilla | grill | 245 |
| Pollo a las Brasas | grill | 178 |
| Pasta Carbonara | pasta | 138 |
| Fettuccine Alfredo | pasta | 132 |
| Penne Arrabbiata | pasta | 125 |

### Opciones por categoría

**Pizza:** Tamaños (Personal / Mediana +200 / Grande +400), Masa (Tradicional / Delgada / Integral +80), Extras (Extra queso +90, Hongos +70, Jalapeño +50, Aceitunas +60)

**Grill:** Porciones (Individual / Doble +180), Término (Rojo / Medio / 3/4 / Bien cocido), Extras (Papas +80, Ensalada +60, Salsa +40, Pan de ajo +50)

**Pasta:** Porciones (Media / Completa +100), Tipo (Spaghetti / Fettuccine / Penne / Sin gluten +90), Extras (Parmesano +70, Pollo +120, Tocino +80, Champiñones +60)

---

## 13. Traducción de componentes a Ionic puro

> Esta sección toma los componentes reales del prototipo (React + Tailwind) y los traduce a **Ionic puro**: HTML con Web Components `<ion-*>`, CSS con variables de marca, y JavaScript vanilla para listas dinámicas. Los valores (colores, tamaños, pesos) son exactamente los del diseño original.

### 13.0 Clases utilitarias base (`theme/app.css`)

```css
/* Tipografía base */
body { font-family: var(--font-sans); color: var(--color-dark); background: var(--color-bg); }
.font-serif { font-family: var(--font-serif); }

/* Card genérica del diseño */
.card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  border: 1px solid rgba(0,0,0,0.05);
}

/* Card admin (SaaS) */
.admin-card {
  background: var(--color-panel-card, #FFFFFF);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
}
```

### 13.1 Botones

**Original (React):** `AdminBtn` / botón CTA con fondo `#E13642`, texto blanco, radio 12px.

```jsx
// React + Tailwind (prototipo)
<button style={{ background: A.accent, color: "#fff", padding: "9px 16px",
  borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
  Agregar al carrito
</button>
```

```html
<!-- Ionic puro -->
<!-- Primario (usa --ion-color-primary = #E13642) -->
<ion-button color="primary" expand="block">
  <ion-icon slot="start" name="cart-outline"></ion-icon>
  Agregar al carrito
</ion-button>

<!-- Secundario / outline -->
<ion-button fill="outline" color="medium">
  Cancelar
</ion-button>

<!-- Pequeño -->
<ion-button size="small" color="primary">Exportar</ion-button>
```

```css
/* Ajuste fino para igualar el radio del diseño (12px) */
ion-button { --border-radius: 12px; font-family: var(--font-sans); font-weight: 700; text-transform: none; }
```

### 13.2 Tarjeta de plato (DishCard)

**Original:** card blanca, imagen 4/3, nombre 700, descripción en `brown`, precio en `red`.

```html
<!-- Plantilla Ionic puro -->
<ion-card class="dish-card" button>
  <img class="dish-card__img" src="" alt="" />
  <ion-card-content class="dish-card__body">
    <h3 class="dish-card__name"></h3>
    <p class="dish-card__desc"></p>
    <span class="dish-card__price"></span>
  </ion-card-content>
</ion-card>
```

```css
.dish-card { border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); margin: 0; }
.dish-card__img  { width: 100%; height: 176px; object-fit: cover; }
.dish-card__name { font: 700 16px var(--font-sans); color: var(--color-dark); margin: 0; }
.dish-card__desc { font: 400 13px var(--font-sans); color: var(--color-brown); margin: 4px 0; }
.dish-card__price{ font: 700 18px var(--font-sans); color: var(--color-red); }
```

```js
// js/components.js — render dinámico desde DISHES (data.js)
function renderDishCard(dish) {
  return `
    <ion-card class="dish-card" button onclick="openDish(${dish.id})">
      <img class="dish-card__img" src="${dish.img}" alt="${dish.name}" />
      <ion-card-content class="dish-card__body">
        <h3 class="dish-card__name">${dish.name}</h3>
        <p class="dish-card__desc">${dish.desc}</p>
        <span class="dish-card__price">₡${dish.price}</span>
      </ion-card-content>
    </ion-card>`;
}

// Pintar el grid:
document.querySelector('#dishGrid').innerHTML =
  DISHES.filter(d => activeCat === 'todos' || d.category === activeCat)
        .map(renderDishCard).join('');
```

### 13.3 Chip de categoría

**Original:** miniatura circular + label; activo con borde rojo `#E13642`.

```html
<div class="cat-chip cat-chip--active" onclick="setCategory('pizza')">
  <div class="cat-chip__img"><img src="..." alt="Pizza" /></div>
  <span class="cat-chip__label">Pizza</span>
</div>
```

```css
.cat-chip { display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer; }
.cat-chip__img { width:80px; height:80px; border-radius:50%; overflow:hidden;
  border:2.5px solid transparent; transition:.2s; }
.cat-chip__img img { width:100%; height:100%; object-fit:cover; }
.cat-chip__label { font:500 13px var(--font-sans); color: var(--color-dark); }

.cat-chip--active .cat-chip__img { border-color:#E13642; box-shadow:0 0 0 2px rgba(225,54,66,.15); }
.cat-chip--active .cat-chip__label { color:#E13642; font-weight:700; }
```

### 13.4 StatusBadge (admin)

**Original:** pill con punto indicador, mapa de estados a colores semánticos.

```html
<span class="status-badge status-badge--process">
  <span class="status-badge__dot"></span> En proceso
</span>
```

```css
.status-badge { display:inline-flex; align-items:center; gap:6px;
  border-radius:9999px; padding:3px 9px; font:600 9px var(--font-sans); white-space:nowrap; }
.status-badge__dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

/* Estados (bg / texto / punto) — valores exactos del prototipo */
.status-badge--completed { background:#DCFCE7; color:#15803D; }
.status-badge--completed .status-badge__dot { background:#16A34A; }
.status-badge--process   { background:#FEF3C7; color:#92400E; }
.status-badge--process   .status-badge__dot { background:#F59E0B; }
.status-badge--cancelled { background:#FEE2E2; color:#991B1B; }
.status-badge--cancelled .status-badge__dot { background:#DC2626; }
.status-badge--inactive  { background:#F3F4F6; color:#374151; }
.status-badge--inactive  .status-badge__dot { background:#6B7280; }
```

```js
const STATUS_LABELS = {
  completed:'Completado', process:'En proceso', cancelled:'Cancelado',
  active:'Activo', inactive:'Inactivo', expired:'Vencida', cooking:'En cocina'
};
function renderStatusBadge(type) {
  return `<span class="status-badge status-badge--${type}">
    <span class="status-badge__dot"></span>${STATUS_LABELS[type]}</span>`;
}
```

### 13.5 KPI Card (admin)

```html
<div class="kpi-card">
  <div class="kpi-card__icon" style="background:#6B72801f">
    <ion-icon name="receipt-outline" style="color:#374151"></ion-icon>
  </div>
  <p class="kpi-card__label">Pedidos hoy</p>
  <p class="kpi-card__value">47</p>
  <p class="kpi-card__sub" style="color:#16A34A">↑ 12% vs ayer</p>
</div>
```

```css
.kpi-card { background:#FFF; border:1px solid var(--color-border); border-radius:12px; padding:16px; }
.kpi-card__icon { width:34px; height:34px; border-radius:8px; display:flex;
  align-items:center; justify-content:center; margin-bottom:12px; font-size:16px; }
.kpi-card__label { font:500 11px var(--font-sans); color:var(--color-text-muted); margin:0; }
.kpi-card__value { font:700 22px var(--font-sans); color:var(--color-dark); margin:4px 0 0; }
.kpi-card__sub   { font:500 10px var(--font-sans); margin:4px 0 0; }
```

### 13.6 Bottom Navigation → `ion-tab-bar`

**Original:** barra inferior negra, ícono activo rojo, badge de carrito.

```html
<!-- Ionic puro: tabs nativos -->
<ion-tab-bar slot="bottom" class="rooster-tabs" selected-tab="inicio">
  <ion-tab-button tab="inicio">
    <ion-icon name="home-outline"></ion-icon>
    <ion-label>Inicio</ion-label>
  </ion-tab-button>

  <ion-tab-button tab="carrito">
    <ion-icon name="cart-outline"></ion-icon>
    <ion-label>Carrito</ion-label>
    <ion-badge color="danger">3</ion-badge>
  </ion-tab-button>

  <ion-tab-button tab="cupones">
    <ion-icon name="pricetag-outline"></ion-icon>
    <ion-label>Cupones</ion-label>
  </ion-tab-button>

  <ion-tab-button tab="cuenta">
    <ion-icon name="person-circle-outline"></ion-icon>
    <ion-label>Mi cuenta</ion-label>
  </ion-tab-button>
</ion-tab-bar>
```

```css
/* Negro con acento rojo, igual al prototipo */
.rooster-tabs { --background:#FFFFFF; border-top:1px solid rgba(0,0,0,.07); }
.rooster-tabs ion-tab-button { --color:#A8895E; --color-selected:#E13642; }
```

### 13.7 Gráfico de barras (BarChart) en JS vanilla

**Original:** componente React con eje Y, grilla punteada, barra máxima en rojo. En Ionic puro se genera el SVG/HTML por JS.

```js
// js/charts.js
function renderBarChart(containerId, data, { height = 150 } = {}) {
  const maxVal = Math.max(...data.map(d => d.val));
  const yTop   = Math.ceil(maxVal / 10) * 10;
  const steps  = [0, .25, .5, .75, 1].map(f => Math.round(yTop * f));
  const barH   = height - 22;

  const yAxis = `<div class="bar-y" style="height:${height}px">
    ${steps.slice().reverse().map(s => `<span>${s}</span>`).join('')}</div>`;

  const grid = steps.slice(1)
    .map(s => `<div class="bar-grid" style="bottom:${(s/yTop)*100}%"></div>`).join('');

  const bars = data.map(d => {
    const pct = (d.val / yTop) * 100, isMax = d.val === maxVal;
    return `<div class="bar-col">
      ${isMax ? `<span class="bar-badge">${d.val}</span>` : ''}
      <div class="bar ${isMax ? 'bar--max' : ''}" style="height:${pct}%"></div>
    </div>`;
  }).join('');

  const labels = data.map(d => `<span class="bar-label">${d.day}</span>`).join('');

  document.getElementById(containerId).innerHTML = `
    <div class="bar-chart">
      ${yAxis}
      <div class="bar-body">
        <div class="bar-plot" style="height:${barH}px">${grid}${bars}</div>
        <div class="bar-labels">${labels}</div>
      </div>
    </div>`;
}

// Uso (módulo Pedidos):
const WEEKLY_ORDERS = [
  {day:'L',val:18},{day:'M',val:24},{day:'M',val:21},{day:'J',val:32},
  {day:'V',val:27},{day:'S',val:42},{day:'D',val:47}
];
renderBarChart('ordersChart', WEEKLY_ORDERS);
```

```css
.bar-chart { display:flex; gap:8px; }
.bar-y { display:flex; flex-direction:column-reverse; justify-content:space-between;
  padding-bottom:22px; min-width:20px; font:600 8px var(--font-sans); color:var(--color-text-soft); }
.bar-body { flex:1; display:flex; flex-direction:column; }
.bar-plot { position:relative; display:flex; align-items:flex-end; gap:6px; }
.bar-grid { position:absolute; left:0; right:0; border-top:1px dashed var(--color-border); }
.bar-col  { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; position:relative; }
.bar      { width:100%; min-height:4px; background:#E5E7EB; border-radius:4px 4px 0 0; transition:.15s; }
.bar--max { background:#E13642; }                 /* único uso del rojo: barra máxima */
.bar-badge{ margin-bottom:4px; background:#E13642; color:#fff; border-radius:4px;
  padding:2px 6px; font:700 8px var(--font-sans); }
.bar-labels{ display:flex; gap:6px; margin-top:6px; }
.bar-label { flex:1; text-align:center; font:600 9px var(--font-sans); color:var(--color-text-muted); }
```

> El mismo patrón aplica a **AreaChart** (sección 8.2) y **DonutChart** (8.3): generar el `<svg>` por JS y colorear con las variables de marca, reservando `#E13642` solo para el dato más importante.

### 13.8 Equivalencia de íconos (lucide-react → Ionicons)

El prototipo usa `lucide-react`; Ionic puro trae **Ionicons** integrados (`<ion-icon name="...">`).

| Prototipo (lucide) | Ionicons (`name`) | Uso |
|---|---|---|
| `Home` | `home-outline` | Inicio (nav) |
| `ShoppingCart` | `cart-outline` | Carrito |
| `Tag` | `pricetag-outline` | Cupones / ofertas |
| `CircleUserRound` | `person-circle-outline` | Mi cuenta |
| `LayoutDashboard` | `grid-outline` | Dashboard admin |
| `ClipboardList` | `receipt-outline` | Pedidos |
| `ChefHat` | `restaurant-outline` | Menú / cocina |
| `Users` | `people-outline` | Usuarios |
| `BarChart2` | `bar-chart-outline` | Analíticas |
| `Bell` | `notifications-outline` | Notificaciones |
| `Star` | `star-outline` / `star` | Reseñas / rating |
| `Settings` | `settings-outline` | Configuración |
| `Search` | `search-outline` | Buscador |
| `SlidersHorizontal` | `options-outline` | Filtros |
| `Download` | `download-outline` | Exportar |
| `Plus` | `add-outline` | Nuevo / agregar |
| `X` | `close-outline` | Cerrar modal |
| `CheckCircle` | `checkmark-circle-outline` | Completado |
| `Clock` | `time-outline` | En proceso |
| `AlertTriangle` | `warning-outline` | Alerta |

### 13.9 Mapa de equivalencias generales

| Prototipo (React/Tailwind) | Ionic puro |
|---|---|
| `<div className="card">` | `<ion-card>` / `.card` con CSS |
| `<button onClick>` CTA | `<ion-button color="primary">` |
| Bottom nav custom | `<ion-tab-bar>` + `<ion-tab-button>` |
| Modal (`fixed inset-0`) | `<ion-modal>` |
| Bottom sheet (filtro/detalle) | `<ion-modal>` con `breakpoints` (sheet) |
| `<input>` búsqueda | `<ion-searchbar>` |
| Toggle disponibilidad | `<ion-toggle>` |
| Tabs de filtro (FilterTab) | `<ion-segment>` + `<ion-segment-button>` |
| Lista de pedidos/usuarios | `<ion-list>` + `<ion-item>` |
| Badge contador | `<ion-badge color="danger">` |
| Toast de confirmación | `ionToast` (controller) |
| Loading skeleton | `<ion-skeleton-text animated>` |
| Estilos `style={{ }}` inline | clases en `theme/app.css` con variables |
| `useState` / re-render | funciones `render*()` que reescriben `innerHTML` |

---

*Guía generada a partir del prototipo Figma — Rooster Restaurant App — Junio 2026*
