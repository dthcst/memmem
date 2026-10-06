/**
 * Pedidos Soneira SD × Death Coast — Google Apps Script
 *
 * Pégase na folla de cálculo: Extensións > Apps Script.
 * Fai tres cousas con cada pedido que chega da web:
 *   1. Garda unha fila por liña de pedido na pestana "Pedidos".
 *   2. Manda un email a EMAIL_PEDIDOS con todos os datos.
 *   3. Recalcula a pestana "Resumo" (unidades por cor e talla, por tanda).
 *
 * Instrucións completas no README.md.
 */

// ---------- AXUSTES DO SERVIDOR ----------
// O enderezo vai aquí (e non na web) para que ninguén poida usar o formulario para mandar emails a outros.
var EMAIL_PEDIDOS = 'pedidos@costa-da-morte.com';
var NOME_REMITENTE = 'Pedidos Soneira SD × Death Coast';
var FOLLA_PEDIDOS = 'Pedidos';
var FOLLA_RESUMO = 'Resumo';
var MAX_LINAS = 20;
var MAX_CANTIDADE = 10;
var ESTADOS = ['pendente', 'pagado', 'entregado', 'anulado'];

var CABECEIRA = ['fecha', 'número de pedido', 'nombre', 'apellidos', 'teléfono', 'email',
  'color', 'talla', 'cantidad', 'importe', 'estado', 'tanda', 'observaciones'];

// ---------- WEB ----------

function doGet() {
  return json_({ ok: true, servizo: 'pedidos' });
}

function doPost(e) {
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Campo trampa cuberto = bot. Respondemos "ok" sen gardar nada.
    if (d.web) return json_({ ok: true, numero: 'OK' });

    var pedido = validar_(d);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var folla = prepararFollaPedidos_(ss);

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    var numero;
    try {
      numero = seguinteNumero_(pedido.prefixo);
      var agora = new Date();
      var filas = pedido.linas.map(function (l) {
        return [agora, numero, limpar_(pedido.nome), limpar_(pedido.apelidos), pedido.telefono, pedido.email,
          limpar_(l.cor), limpar_(l.talla), l.cantidade, l.cantidade * pedido.prezo, 'pendente',
          limpar_(pedido.tanda), limpar_(pedido.observacions)];
      });
      var inicio = folla.getLastRow() + 1;
      folla.getRange(inicio, 1, filas.length, CABECEIRA.length).setValues(filas);
      gardarOrde_(d.ordeTallas, 'ORDE_TALLAS');
      gardarOrde_(d.ordeCores, 'ORDE_CORES');
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    try { mandarEmail_(numero, pedido); } catch (err) { console.error('Email: ' + err); }
    try { actualizarResumo(); } catch (err) { console.error('Resumo: ' + err); }

    return json_({ ok: true, numero: numero });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, erro: String(err && err.message || err) });
  }
}

// ---------- VALIDACIÓN ----------

function validar_(d) {
  var texto = function (v, max) { return String(v == null ? '' : v).trim().slice(0, max); };
  var p = {
    nome: texto(d.nome, 60),
    apelidos: texto(d.apelidos, 80),
    telefono: String(d.telefono || '').replace(/\D/g, ''),
    email: texto(d.email, 120),
    observacions: texto(d.observacions, 500),
    tanda: texto(d.tanda, 40) || 'Sen tanda',
    prefixo: String(d.prefixo || 'PED').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'PED',
    prezo: Number(d.prezo),
    linas: []
  };
  if (!p.nome || !p.apelidos) throw new Error('Faltan nome ou apelidos');
  if (!/^[67]\d{8}$/.test(p.telefono)) throw new Error('Móbil non válido');
  p.telefono = p.telefono.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)) throw new Error('Email non válido');
  if (!(p.prezo > 0 && p.prezo < 1000)) throw new Error('Prezo non válido');
  if (!Array.isArray(d.linas) || !d.linas.length || d.linas.length > MAX_LINAS) throw new Error('Liñas non válidas');
  d.linas.forEach(function (l) {
    var q = Math.floor(Number(l.cantidade));
    var cor = texto(l.cor, 30), talla = texto(l.talla, 20);
    if (!cor || !talla || !(q >= 1 && q <= MAX_CANTIDADE)) throw new Error('Liña non válida');
    p.linas.push({ cor: cor, talla: talla, cantidade: q });
  });
  return p;
}

// Evita que un texto que empece por = + - @ se interprete como fórmula.
function limpar_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// ---------- FOLLAS ----------

function prepararFollaPedidos_(ss) {
  var folla = ss.getSheetByName(FOLLA_PEDIDOS);
  if (!folla) folla = ss.insertSheet(FOLLA_PEDIDOS, 0);
  if (folla.getLastRow() === 0) {
    folla.getRange(1, 1, 1, CABECEIRA.length).setValues([CABECEIRA]).setFontWeight('bold');
    folla.setFrozenRows(1);
    folla.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
    folla.getRange('E:E').setNumberFormat('@');           // teléfono como texto
    folla.getRange('J:J').setNumberFormat('#,##0.00 €');
    var regra = SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).build();
    folla.getRange('K2:K').setDataValidation(regra);
    folla.setColumnWidth(1, 130);
  }
  return folla;
}

function seguinteNumero_(prefixo) {
  var props = PropertiesService.getScriptProperties();
  var chave = 'CONTADOR_' + prefixo;
  var n = Number(props.getProperty(chave) || 0) + 1;
  props.setProperty(chave, String(n));
  return prefixo + '-' + ('000' + n).slice(-Math.max(4, String(n).length));
}

function gardarOrde_(lista, chave) {
  if (!Array.isArray(lista) || !lista.length) return;
  var limpa = lista.slice(0, 40).map(function (v) { return String(v).slice(0, 30); });
  PropertiesService.getScriptProperties().setProperty(chave, JSON.stringify(limpa));
}

function lerOrde_(chave) {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(chave) || '[]'); }
  catch (e) { return []; }
}

/**
 * Reconstrúe a pestana "Resumo": por cada tanda, unha táboa cor × talla
 * coas unidades a encargar á imprenta. Non conta as filas en estado "anulado".
 * Execútase soa con cada pedido e cando editas a pestana Pedidos.
 */
function actualizarResumo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var pedidos = ss.getSheetByName(FOLLA_PEDIDOS);
  if (!pedidos || pedidos.getLastRow() < 2) return;
  var datos = pedidos.getRange(2, 1, pedidos.getLastRow() - 1, CABECEIRA.length).getValues();

  var tandas = {}, ordeTandas = [], tallasVistas = {}, coresVistas = {};
  datos.forEach(function (f) {
    var cor = String(f[6]), talla = String(f[7]), q = Number(f[8]) || 0;
    var est = String(f[10]).toLowerCase(), tanda = String(f[11] || 'Sen tanda');
    if (!cor || !talla || !q || est === 'anulado') return;
    if (!tandas[tanda]) {
      tandas[tanda] = { celas: {}, unidades: 0, importe: 0, pagado: 0, pedidos: {} };
      ordeTandas.push(tanda);
    }
    var t = tandas[tanda];
    var k = cor + '|' + talla;
    t.celas[k] = (t.celas[k] || 0) + q;
    t.unidades += q;
    t.importe += Number(f[9]) || 0;
    if (est === 'pagado' || est === 'entregado') t.pagado += Number(f[9]) || 0;
    t.pedidos[f[1]] = true;
    tallasVistas[talla] = true;
    coresVistas[cor] = true;
  });

  var tallas = ordenar_(Object.keys(tallasVistas), lerOrde_('ORDE_TALLAS'));
  var cores = ordenar_(Object.keys(coresVistas), lerOrde_('ORDE_CORES'));
  var ancho = tallas.length + 2;
  var filas = [], formatos = [];
  var baleira = function () { var r = []; for (var i = 0; i < ancho; i++) r.push(''); return r; };
  var fila = function (valores, tipo) {
    var r = baleira();
    valores.forEach(function (v, i) { r[i] = v; });
    filas.push(r); formatos.push(tipo || '');
  };

  fila(['Resumo para imprenta (sen anulados) · actualizado ' +
    Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm')], 'nota');
  fila([]);

  ordeTandas.slice().reverse().forEach(function (nome) {   // a tanda máis recente primeiro
    var t = tandas[nome];
    fila([nome], 'tanda');
    fila(['Cor'].concat(tallas, ['Total']), 'cabeceira');
    cores.forEach(function (cor) {
      var total = 0;
      var r = [cor].concat(tallas.map(function (ta) {
        var v = t.celas[cor + '|' + ta] || 0; total += v; return v || '';
      }));
      if (total) fila(r.concat([total]));
    });
    fila(['Total'].concat(tallas.map(function (ta) {
      return cores.reduce(function (s, c) { return s + (t.celas[c + '|' + ta] || 0); }, 0) || '';
    }), [t.unidades]), 'total');
    fila(['Pedidos: ' + Object.keys(t.pedidos).length + ' · Importe: ' + t.importe + ' € · Cobrado: ' +
      t.pagado + ' € · Pendente: ' + (t.importe - t.pagado) + ' €'], 'nota');
    fila([]);
  });

  var resumo = ss.getSheetByName(FOLLA_RESUMO) || ss.insertSheet(FOLLA_RESUMO);
  resumo.clear();
  resumo.getRange(1, 1, filas.length, ancho).setValues(filas);
  formatos.forEach(function (tipo, i) {
    var r = resumo.getRange(i + 1, 1, 1, ancho);
    if (tipo === 'tanda') r.setFontWeight('bold').setFontSize(14);
    if (tipo === 'cabeceira') r.setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    if (tipo === 'total') r.setFontWeight('bold').setBorder(true, null, null, null, null, null);
    if (tipo === 'nota') r.setFontColor('#666666');
  });
  resumo.getRange(1, 2, filas.length, ancho - 1).setHorizontalAlignment('center');
}

function ordenar_(valores, orde) {
  return valores.sort(function (a, b) {
    var ia = orde.indexOf(a), ib = orde.indexOf(b);
    if (ia === -1) ia = 999;
    if (ib === -1) ib = 999;
    return ia - ib || a.localeCompare(b);
  });
}

// ---------- EMAIL ----------

function mandarEmail_(numero, p) {
  var total = 0, unidades = 0;
  var filasHtml = p.linas.map(function (l) {
    var importe = l.cantidade * p.prezo;
    total += importe; unidades += l.cantidade;
    return '<tr><td>' + esc_(l.cor) + '</td><td>' + esc_(l.talla) + '</td><td align="right">' +
      l.cantidade + '</td><td align="right">' + importe + ' €</td></tr>';
  }).join('');
  var texto = p.linas.map(function (l) {
    return '- ' + l.cantidade + ' × ' + l.cor + ' · talla ' + l.talla;
  }).join('\n');

  var html =
    '<h2 style="margin:0">Pedido ' + esc_(numero) + '</h2>' +
    '<p>' + esc_(p.tanda) + '</p>' +
    '<p><b>' + esc_(p.nome) + ' ' + esc_(p.apelidos) + '</b><br>' +
    'Tel.: <a href="tel:+34' + p.telefono.replace(/\D/g, '') + '">' + esc_(p.telefono) + '</a><br>' +
    'Email: ' + (p.email ? esc_(p.email) : '—') + '</p>' +
    '<table cellpadding="6" style="border-collapse:collapse" border="1">' +
    '<tr><th>Cor</th><th>Talla</th><th>Cantidade</th><th>Importe</th></tr>' + filasHtml +
    '<tr><th colspan="2" align="left">Total</th><th align="right">' + unidades + '</th><th align="right">' +
    total + ' €</th></tr></table>' +
    (p.observacions ? '<p><b>Observacións:</b><br>' + esc_(p.observacions) + '</p>' : '') +
    '<p style="color:#666">Estado: pendente. Cambia o estado na folla cando pague ou recolla.</p>';

  var opcions = { name: NOME_REMITENTE, htmlBody: html };
  if (p.email) opcions.replyTo = p.email;

  MailApp.sendEmail(EMAIL_PEDIDOS,
    'Pedido ' + numero + ' · ' + unidades + (unidades === 1 ? ' camiseta' : ' camisetas') + ' · ' + total + ' €',
    'Pedido ' + numero + ' (' + p.tanda + ')\n' + p.nome + ' ' + p.apelidos + '\nTel.: ' + p.telefono +
    '\nEmail: ' + (p.email || '-') + '\n\n' + texto + '\n\nTotal: ' + total + ' €' +
    (p.observacions ? '\n\nObservacións: ' + p.observacions : ''),
    opcions);
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- MENÚ E ACTIVADORES DA FOLLA ----------

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Death Coast')
    .addItem('Actualizar resumo', 'actualizarResumo')
    .addItem('Preparar follas (primeira vez)', 'prepararFollas')
    .addItem('Enviar email de proba', 'emailDeProba')
    .addToUi();
}

// Ao cambiar un estado (p. ex. a "anulado") ou unha cantidade, o resumo actualízase só.
function onEdit(e) {
  if (e && e.range && e.range.getSheet().getName() === FOLLA_PEDIDOS) actualizarResumo();
}

/** Execútao unha vez a man: crea as pestanas e pide os permisos (Sheets + email). */
function prepararFollas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  prepararFollaPedidos_(ss);
  if (!ss.getSheetByName(FOLLA_RESUMO)) ss.insertSheet(FOLLA_RESUMO);
  var sobrante = ss.getSheetByName('Folla 1') || ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (sobrante && sobrante.getLastRow() === 0 && ss.getSheets().length > 2) ss.deleteSheet(sobrante);
  MailApp.getRemainingDailyQuota(); // forza que pida o permiso de email
}

function emailDeProba() {
  MailApp.sendEmail(EMAIL_PEDIDOS, 'Proba: pedidos Soneira SD × Death Coast',
    'Se recibes isto, os emails dos pedidos funcionan.', { name: NOME_REMITENTE });
}
