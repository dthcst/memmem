/*
 * ============================================================
 *  CONFIGURACIÓN DA PÁXINA DE ENCARGOS
 *  Este é o único ficheiro que hai que tocar para:
 *    - abrir ou pechar unha tanda
 *    - cambiar a data de peche
 *    - cambiar o prezo, as cores ou as tallas
 *    - cambiar os textos ou reutilizar a páxina con outro club
 *
 *  Regras para non rompelo:
 *    - Os textos van sempre entre comiñas "así".
 *    - Cada liña remata en coma, agás a última dun bloque.
 *    - true / false sen comiñas.
 * ============================================================
 */
window.SITE_CONFIG = {

  // ---------- TANDA ----------
  tanda: {
    aberta: true,                 // true = aberta · false = pechada
    nome: "Tanda 1",              // aparece na folla de cálculo e no email
    peche: "2026-10-26",          // último día para encargar (AAAA-MM-DD). Ese día aínda se pode.
    entrega: "Entrega no campo un día de partido" // texto curto baixo a data
  },

  // ---------- PRODUTO ----------
  prezo: 15,                      // euros por camiseta. Cámbiase só aquí.
  cantidadeMaxima: 10,            // máximo por liña
  prefixoPedido: "SSD",           // número de pedido: SSD-0001, SSD-0002...

  cores: [
    { id: "branca", nome: "Branca", detalle: "letras negras", mostra: "#ffffff", mockup: "assets/mockup-branca.jpg" },
    { id: "negra",  nome: "Negra",  detalle: "letras brancas", mostra: "#0a0a0a", mockup: "assets/mockup-negra.jpg" }
  ],

  tallas: [
    // "sufixo" engádese ao valor: a talla 10 de neno/a aparece como "10 anos".
    { grupo: "Neno/a", sufixo: " anos", valores: ["6", "8", "10", "12", "14"] },
    { grupo: "Adulto", sufixo: "",      valores: ["XS", "S", "M", "L", "XL", "XXL"] }
  ],

  // ---------- ENVÍO DO FORMULARIO ----------
  // URL do Google Apps Script (remata en /exec). Ver README.md, paso 2.
  endpoint: "PEGA_AQUI_A_URL_DO_APPS_SCRIPT",

  // WhatsApp para o botón "Avisar por WhatsApp".
  // Número con prefixo e sen espazos nin "+" (ex.: "34600111222").
  // Se o deixas baleiro (""), o botón abre WhatsApp para escoller a quen mandalo.
  whatsapp: "",

  // ---------- IMAXES ----------
  imaxes: {
    equipo: "assets/equipo-1600.jpg",
    equipoPequena: "assets/equipo-800.jpg",
    equipoAlt: "O equipo da Soneira SD coas camisetas Death Coast no campo",
    galeria: [
      { src: "assets/foto-diante-1.jpg", alt: "Xogador coa camiseta branca, vista de diante" },
      { src: "assets/foto-detras-1.jpg", alt: "Xogador coa camiseta branca, vista de detrás co texto Soneira SD" },
      { src: "assets/foto-diante-2.jpg", alt: "Xogadora coa camiseta branca, vista de diante" },
      { src: "assets/foto-detras-2.jpg", alt: "Xogadora coa camiseta branca, vista de detrás" }
    ]
  },

  // ---------- TEXTOS (galego) ----------
  textos: {
    tituloPaxina: "Camiseta oficial Soneira SD × Death Coast",
    marca: "Soneira SD × Death Coast",
    titulo: "Camiseta oficial Soneira SD × Death Coast",
    lema: "Viste a vila.",            // ao lado vai o prezo automaticamente
    intro: "Encárgaa a través do club. Ao pechar a tanda imprimímolas todas xuntas e entregámolas no campo.",
    botonHero: "Fai o teu pedido",

    tandaAberta: "Tanda aberta ata o",
    tandaPechada: "Tanda pechada. Pronto abrimos outra.",
    tandaPechadaSub: "Segue á Soneira SD en Instagram para saber cando.",

    tituloPrenda: "A camiseta",
    prenda: "Algodón. Diante, a caveira Death Coast. Detrás, SONEIRA SD e Est. 1966.",
    diante: "Diante",
    detras: "Detrás",

    tituloFormulario: "Fai o teu pedido",
    nome: "Nome",
    apelidos: "Apelidos",
    telefono: "Móbil",
    telefonoAxuda: "Chamámoste a este número cando estean listas.",
    email: "Email",
    opcional: "opcional",
    camisetas: "Camisetas",
    cor: "Cor",
    talla: "Talla",
    cantidade: "Cantidade",
    escollerTalla: "Escolle",
    quitar: "Quitar",
    engadir: "Engadir outra camiseta",
    total: "Total",
    observacions: "Observacións",
    rgpd: "Acepto que Death Coast use estes datos só para xestionar este pedido.",
    rgpdInfo: "Responsable: COSTA DA MORTE DEATH COAST, S.C. Só usamos os datos para este pedido e non os cedemos a ninguén. Para borralos, escribe a ola@costa-da-morte.com.",
    pago: "Pagas ao recoller: en man no campo ou por Bizum/transferencia.",
    enviar: "Enviar pedido",
    enviando: "Enviando…",

    erroNome: "Escribe o teu nome.",
    erroApelidos: "Escribe os teus apelidos.",
    erroTelefono: "Pon un móbil válido: 9 cifras que empecen por 6 ou 7.",
    erroEmail: "Ese email non parece correcto.",
    erroTalla: "Escolle a talla.",
    erroRgpd: "Tes que aceptar para enviar o pedido.",
    erroRevisa: "Revisa os campos marcados.",
    erroEnvio: "Non puidemos enviar o pedido. Téntao outra vez ou escríbenos a ola@costa-da-morte.com.",

    recibido: "Recibido! Chamámoste cando estean listas.",
    numeroPedido: "Número de pedido",
    gardaNumero: "Garda este número.",
    resumo: "Resumo",
    whatsapp: "Avisar por WhatsApp",
    outroPedido: "Facer outro pedido"
  },

  // ---------- PÉ ----------
  pe: {
    empresa: "COSTA DA MORTE DEATH COAST, S.C.",
    email: "ola@costa-da-morte.com",
    ligazons: [
      { texto: "Instagram Soneira SD", url: "https://www.instagram.com/soneirasd" },
      { texto: "Instagram Death Coast", url: "https://www.instagram.com/costadamorte.deathcoast" }
    ]
  }
};
