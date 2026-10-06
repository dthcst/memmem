# Soneira SD × Death Coast — página de encargos

Página de una sola pantalla (pensada para el móvil) donde jugadores, familias y afición encargan la camiseta. No cobra online: guarda el pedido en Google Sheets, manda un email a `pedidos@costa-da-morte.com` y muestra un número de pedido (`SSD-0001`, `SSD-0002`…).

```
soneira-sd/
├── site/                  ← lo que se publica (Cloudflare Pages / Netlify / Vercel)
│   ├── config.js          ← EL ÚNICO ARCHIVO QUE HAY QUE TOCAR (precio, tanda, textos…)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── _headers           ← cabeceras de seguridad y caché (Cloudflare Pages / Netlify)
│   ├── fonts/             ← Barlow Condensed alojada aquí (sin Google Fonts)
│   └── assets/            ← fotos y mockups
└── apps-script/
    ├── Code.gs            ← script de Google (Sheets + email + resumen)
    └── appsscript.json    ← zona horaria Europe/Madrid
```

Sin cookies, sin analítica, sin librerías externas. Peso total de la primera carga ≈ 200 KB en móvil.

---

## 1. Crear la hoja y el script de Google (10 min)

Hazlo con la cuenta de Google que quieres que sea la dueña de los pedidos (los emails saldrán desde ella).

1. Entra en [sheets.new](https://sheets.new) y llama a la hoja, por ejemplo, **Pedidos Soneira SD**.
2. Menú **Extensiones → Apps Script**.
3. Borra lo que haya en `Código.gs` y pega todo el contenido de [`apps-script/Code.gs`](apps-script/Code.gs). Guarda (icono del disquete).
   - Revisa arriba del todo `EMAIL_PEDIDOS = 'pedidos@costa-da-morte.com'`. Es el destinatario de los avisos.
4. **Zona horaria**: rueda dentada ⚙ *Configuración del proyecto* → Zona horaria **(GMT+01:00) Madrid**. (Opcional: marca «Mostrar el archivo de manifiesto appsscript.json» y pega el de esta carpeta, que ya la trae.)
5. **Dar permisos**: en la barra de arriba elige la función `prepararFollas` y pulsa **Ejecutar**. Google pedirá permiso:
   *Revisar permisos → tu cuenta → «Google no ha verificado esta aplicación» → Configuración avanzada → Ir a (proyecto) → Permitir.*
   Es normal: el script es tuyo. Esto crea las pestañas **Pedidos** y **Resumo**.
6. (Opcional) Ejecuta `emailDeProba` y comprueba que llega el correo a pedidos@.
7. **Publicar como aplicación web**: botón azul **Implementar → Nueva implementación** → tipo (⚙) **Aplicación web**:
   - Descripción: `pedidos`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario** (en inglés *Anyone*)
   - **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
8. Abre esa URL en el navegador: debe salir `{"ok":true,"servizo":"pedidos"}`.
9. Pega la URL en `site/config.js`:
   ```js
   endpoint: "https://script.google.com/macros/s/AKfy.../exec",
   ```

### Qué hace la hoja

**Pestaña `Pedidos`** — una fila por cada línea del pedido:

| fecha | número de pedido | nombre | apellidos | teléfono | email | color | talla | cantidad | importe | estado | tanda | observaciones |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 06/10/2026 18:02 | SSD-0042 | Ana | Lema Pose | 612 345 678 | | Branca | M | 2 | 25,00 € | pendente | Tanda 1 | |
| 06/10/2026 18:02 | SSD-0042 | Ana | Lema Pose | 612 345 678 | | Negra | 10 anos | 1 | 15,00 € | pendente | Tanda 1 | |

- La columna **estado** tiene desplegable: `pendente`, `pagado`, `entregado`, `anulado`. Cámbialo a mano cuando paguen o recojan.
- He añadido al final la columna **observaciones**, para que no se queden solo en el email.

**Pestaña `Resumo`** — se rehace sola con cada pedido y cada vez que editas `Pedidos`. Por cada tanda (la más reciente arriba), una tabla color × talla con las unidades para la imprenta, más nº de pedidos, importe, cobrado y pendiente. Las filas en estado `anulado` no cuentan. Si alguna vez no se actualiza: menú **Death Coast → Actualizar resumo** (aparece al abrir la hoja).

### Si cambias el script más adelante
**Implementar → Gestionar implementaciones → ✏️ editar → Versión: Nueva versión → Implementar.** Así la URL `/exec` no cambia. (Si haces «Nueva implementación» saldría otra URL y habría que cambiarla en `config.js`.)

### Límites
Una cuenta Gmail normal puede mandar 100 emails al día desde scripts (Google Workspace: 1.500). Para un pueblo, sobra. Si se pasara, el pedido se guarda igual en la hoja; solo faltaría el email.

---

## 2. Publicar la página en Cloudflare Pages (gratis y automático)

Se conecta al repositorio de GitHub: **cada cambio que se guarde en GitHub se publica solo** en menos de un minuto (por ejemplo, abrir/cerrar tanda editando `config.js` desde el móvil). No hay que volver a subir nada a mano.

1. Haz merge del PR en `main` (o el que sea tu rama principal).
2. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
3. Autoriza GitHub y elige el repositorio `dthcst/memmem`.
4. Configuración:
   - Project name: `soneira-deathcoast` → la web queda en `soneira-deathcoast.pages.dev`
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: *(vacío)*
   - Build output directory: `soneira-sd/site`
5. **Save and Deploy**. Abre `soneira-deathcoast.pages.dev` y prueba un pedido de punta a punta.

El archivo `_headers` (seguridad y caché) lo aplica Cloudflare Pages tal cual.

> Alternativa sin GitHub: *Create → Pages → Upload assets* y arrastras la carpeta `site`. Funciona, pero cada cambio obliga a volver a subirla.

---

## 3. Apuntar `soneira.costa-da-morte.com` (DNS en Squarespace, sin romper la tienda Shopify)

El dominio está registrado en **Squarespace** y la tienda Shopify usa el dominio raíz y `www`. Un subdominio nuevo es un registro aparte: no toca la tienda ni el correo.

### Paso A — en Cloudflare (primero)
Proyecto `soneira-deathcoast` → **Custom domains → Set up a custom domain** → escribe `soneira.costa-da-morte.com` → *Continue*. Como el dominio no está en Cloudflare, te pedirá que añadas un CNAME en tu proveedor de DNS y te mostrará el valor (`soneira-deathcoast.pages.dev`).

> Hazlo en este orden: si creas el CNAME antes de añadir el dominio en Cloudflare, la web da error 522 hasta que lo añadas.

### Paso B — en Squarespace
1. [account.squarespace.com/domains](https://account.squarespace.com/domains) → `costa-da-morte.com` → **DNS** (o *DNS Settings*).
2. En **Custom records → Add record**:
   - Host: `soneira`
   - Type: `CNAME`
   - Priority: *(vacío)*
   - TTL: el que venga
   - Data / Alias: `soneira-deathcoast.pages.dev`
3. **Save**. **No toques** los registros de Shopify (`@` → 23.227.38.65 y `www` → shops.myshopify.com, a veces agrupados como «Shopify» en *Presets*) ni los `MX`/`TXT` del correo.

### Paso C — esperar y HTTPS
En 5–60 minutos (a veces unas horas) el dominio sale como **Active** en Cloudflare y `soneira.costa-da-morte.com` abre la página con HTTPS automático. Comprueba que `costa-da-morte.com` sigue abriendo la tienda.

> Netlify o Vercel también sirven: mismo esquema (conectar el repo, carpeta `soneira-sd/site`, CNAME `soneira` en Squarespace apuntando a la dirección que te den).

---

## 4. Abrir y cerrar una tanda · cambiar el precio

Todo se hace en **`site/config.js`**. Desde el móvil: en github.com abre el archivo → ✏️ (*Edit*) → cambia → **Commit changes**. Cloudflare lo publica solo en menos de un minuto.

### Cerrar la tanda
```js
tanda: {
  aberta: false,
  ...
```
El formulario desaparece y sale «Tanda pechada. Pronto abrimos outra.».
Además, **la página se cierra sola** cuando pasa la fecha `peche` (el día indicado todavía se puede pedir, hasta las 23:59). Si no cambias nada, el cierre es automático.

### Abrir una tanda nueva
```js
tanda: {
  aberta: true,
  nome: "Tanda 2",          // ← nuevo nombre: así la hoja y el resumen separan las tandas
  peche: "2026-11-23",      // ← último día para pedir (AAAA-MM-DD)
  entrega: "Entrega no campo un día de partido"
},
```
Los números de pedido siguen la serie (no vuelven a 0001).

### Cambiar el precio y la oferta
```js
prezo: 15,                          // ← precio de una camiseta suelta
pack: { cantidade: 2, prezo: 25 },  // ← cada 2 camisetas del pedido, 25 €
```
- La oferta cuenta **todas** las camisetas del pedido, mezclando colores y tallas: 1 = 15 €, 2 = 25 €, 3 = 40 €, 4 = 50 €…
- En la hoja, cada línea lleva su parte: las unidades que entran en pareja van a 12,50 € y la suelta a 15 €. Así la suma de las filas de un pedido es siempre su total.
- Para quitar la oferta: `pack: null,`

Cambia el precio de la página, el total en directo, el «Aforras X €», la confirmación, el email y el importe de la hoja. Lo único que no cambia solo es la vista previa al compartir el enlace por WhatsApp (`og:description` en las primeras líneas de `index.html`); edítala si quieres que diga el nuevo precio.

### Otros ajustes en el mismo archivo
- **Colores**: lista `cores`. Para añadir uno, copia una línea, cambia `id`, `nome`, `detalle`, `mostra` (color del circulito) y `mockup` (foto).
- **Tallas**: lista `tallas`. `sufixo: " anos"` hace que la talla 10 de niño aparezca como «10 anos».
- **Textos**: bloque `textos` (todo en gallego).
- **WhatsApp**: si pones el número de Death Coast en `whatsapp` (formato `34600111222`), el botón «Avisar por WhatsApp» abre el chat directo con el resumen escrito. Vacío, deja elegir contacto.
- **Fotos**: carpeta `assets/`. Para cambiar una, sustituye el archivo con el mismo nombre o cambia la ruta en `imaxes`.

---

## 5. Reutilizar con otro club

1. Copia la carpeta `site` y crea otro proyecto en Cloudflare Pages apuntando a la copia.
2. En `config.js` cambia `prefixoPedido` (p. ej. `"CDB"`), textos, tanda, colores, fotos y enlaces del pie.
3. En `index.html` cambia las 4 líneas `og:` / `<title>` / `description` del principio (vista previa al compartir).
4. Crea **otra hoja** con su propio Apps Script (sección 1) y pon su URL en `endpoint`. Así cada club tiene sus pedidos, su numeración y su resumen separados.

---

## Privacidad y seguridad

- Sin cookies, sin analítica, sin fuentes ni scripts de terceros. La única conexión externa es el envío del formulario a Google Apps Script.
- La casilla RGPD es obligatoria y hay una línea de información básica (responsable, finalidad, cómo pedir el borrado).
- Campo trampa invisible contra bots; validación otra vez en el servidor (móvil español, 1–10 unidades por línea, máximo 20 líneas).
- El destinatario del email está fijado en el script, no en la página, para que nadie pueda usar el formulario para enviar correos a terceros.
- Textos que empiezan por `=`, `+`, `-`, `@` se guardan como texto para que no se ejecuten como fórmulas en la hoja.

## Probar en local

```bash
npx serve soneira-sd/site      # o: python3 -m http.server -d soneira-sd/site
```
En `localhost`, si `endpoint` aún no está configurado, el envío se simula y devuelve `SSD-PROBA`, para ver la confirmación sin tocar la hoja. Publicada en internet sin `endpoint`, la página muestra un error en vez de fingir que el pedido se ha enviado.
