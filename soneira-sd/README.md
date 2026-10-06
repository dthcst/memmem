# Soneira SD × Death Coast — página de encargos

Página de una sola pantalla (pensada para el móvil) donde jugadores, familias y afición encargan la camiseta. No cobra online: guarda el pedido en Google Sheets, manda un email a `pedidos@costa-da-morte.com` y muestra un número de pedido (`SSD-0001`, `SSD-0002`…).

```
soneira-sd/
├── site/                  ← lo que se publica (Netlify / Vercel / GitHub Pages)
│   ├── config.js          ← EL ÚNICO ARCHIVO QUE HAY QUE TOCAR (precio, tanda, textos…)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── _headers           ← cabeceras de seguridad y caché (Netlify)
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
| 06/10/2026 18:02 | SSD-0042 | Ana | Lema Pose | 612 345 678 | | Branca | M | 2 | 30,00 € | pendente | Tanda 1 | |
| 06/10/2026 18:02 | SSD-0042 | Ana | Lema Pose | 612 345 678 | | Negra | 10 anos | 1 | 15,00 € | pendente | Tanda 1 | |

- La columna **estado** tiene desplegable: `pendente`, `pagado`, `entregado`, `anulado`. Cámbialo a mano cuando paguen o recojan.
- He añadido al final la columna **observaciones**, para que no se queden solo en el email.

**Pestaña `Resumo`** — se rehace sola con cada pedido y cada vez que editas `Pedidos`. Por cada tanda (la más reciente arriba), una tabla color × talla con las unidades para la imprenta, más nº de pedidos, importe, cobrado y pendiente. Las filas en estado `anulado` no cuentan. Si alguna vez no se actualiza: menú **Death Coast → Actualizar resumo** (aparece al abrir la hoja).

### Si cambias el script más adelante
**Implementar → Gestionar implementaciones → ✏️ editar → Versión: Nueva versión → Implementar.** Así la URL `/exec` no cambia. (Si haces «Nueva implementación» saldría otra URL y habría que cambiarla en `config.js`.)

### Límites
Una cuenta Gmail normal puede mandar 100 emails al día desde scripts (Google Workspace: 1.500). Para un pueblo, sobra. Si se pasara, el pedido se guarda igual en la hoja; solo faltaría el email.

---

## 2. Publicar la página en Netlify (gratis)

Recomendado: **conectarlo al repositorio de GitHub**, así abrir/cerrar tanda es editar `config.js` desde el móvil y en ~30 segundos está publicado.

1. Crea cuenta en [app.netlify.com](https://app.netlify.com) (puedes entrar con GitHub).
2. **Add new site → Import an existing project → GitHub** → elige este repositorio.
3. Configuración de build:
   - Branch to deploy: `main`
   - Base directory: `soneira-sd/site`
   - Build command: *(vacío)*
   - Publish directory: `soneira-sd/site`
4. **Deploy**. Te da una dirección tipo `nombre-raro.netlify.app`. Cámbiala en *Site configuration → Change site name* a, por ejemplo, `soneira-deathcoast` → `soneira-deathcoast.netlify.app`.
5. Prueba un pedido real de punta a punta (luego bórralo de la hoja o márcalo `anulado`).

> Alternativa rápida sin GitHub: [app.netlify.com/drop](https://app.netlify.com/drop) y arrastras la carpeta `site`. Funciona, pero cada cambio de `config.js` obliga a volver a arrastrarla.
>
> Vercel o GitHub Pages también sirven (todo es estático). En ese caso el archivo `_headers` no se aplica; la página funciona igual, solo pierdes las cabeceras de seguridad extra.

---

## 3. Apuntar `soneira.costa-da-morte.com` (sin romper la tienda Shopify)

La tienda usa el dominio raíz (`costa-da-morte.com`) y `www`. Un **subdominio nuevo** es un registro independiente: no toca los registros de Shopify ni el correo. Lo único que **no** hay que hacer es modificar o borrar los registros `A @` y `CNAME www` que ya existen.

### Paso A — en Netlify
*Domain management → Add a domain →* escribe `soneira.costa-da-morte.com` → *Verify → Add domain*. Netlify dirá que falta configurar el DNS y te mostrará el destino (`soneira-deathcoast.netlify.app`).

### Paso B — donde está el DNS del dominio

**Si compraste el dominio en Shopify** (lo más habitual):
1. Admin de Shopify → **Configuración → Dominios**.
2. Pulsa en `costa-da-morte.com` → **Configuración de dominio → Editar configuración de DNS**.
3. **Añadir registro personalizado → CNAME**:
   - Nombre / Host: `soneira`
   - Apunta a / Valor: `soneira-deathcoast.netlify.app` (el tuyo)
   - TTL: el que venga por defecto.
4. Guardar. **No toques** el registro `A` de `@` (23.227.38.65) ni el `CNAME www → shops.myshopify.com`, ni los `MX`/`TXT` del correo.

**Si el dominio está en otro registrador** (GoDaddy, Dinahosting, IONOS…) y solo lo conectaste a Shopify: haz exactamente lo mismo (añadir un CNAME `soneira`) en el panel DNS de ese registrador. En Shopify no hay que hacer nada.

### Paso C — esperar y HTTPS
En 5–60 minutos (a veces unas horas) `soneira.costa-da-morte.com` abre la página. Netlify pone el certificado HTTPS gratis él solo (*Domain management → HTTPS*; si tarda, pulsa *Verify DNS configuration*). Comprueba también que `costa-da-morte.com` sigue abriendo la tienda: debería, porque no se ha tocado.

---

## 4. Abrir y cerrar una tanda · cambiar el precio

Todo se hace en **`site/config.js`**. Desde el móvil: en github.com abre el archivo → ✏️ (*Edit*) → cambia → **Commit changes**. Netlify lo publica solo en menos de un minuto.

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

### Cambiar el precio
```js
prezo: 15,     // ← por ejemplo 18, o 14.5
```
Cambia el precio de la página, el total en directo, la confirmación, el email y el importe de la hoja. Lo único que no cambia solo es la vista previa al compartir el enlace por WhatsApp (`og:description` en las primeras líneas de `index.html`); edítala si quieres que diga el nuevo precio.

### Otros ajustes en el mismo archivo
- **Colores**: lista `cores`. Para añadir uno, copia una línea, cambia `id`, `nome`, `detalle`, `mostra` (color del circulito) y `mockup` (foto).
- **Tallas**: lista `tallas`. `sufixo: " anos"` hace que la talla 10 de niño aparezca como «10 anos».
- **Textos**: bloque `textos` (todo en gallego).
- **WhatsApp**: si pones el número de Death Coast en `whatsapp` (formato `34600111222`), el botón «Avisar por WhatsApp» abre el chat directo con el resumen escrito. Vacío, deja elegir contacto.
- **Fotos**: carpeta `assets/`. Para cambiar una, sustituye el archivo con el mismo nombre o cambia la ruta en `imaxes`.

---

## 5. Reutilizar con otro club

1. Copia la carpeta `site` (o crea otro sitio en Netlify apuntando a una copia).
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
