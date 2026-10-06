/* Páxina de encargos. Toda a configuración está en config.js. */
(function () {
  "use strict";

  var C = window.SITE_CONFIG;
  var T = C.textos;
  var MESES = ["xaneiro", "febreiro", "marzo", "abril", "maio", "xuño", "xullo",
    "agosto", "setembro", "outubro", "novembro", "decembro"];

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function euros(n) {
    return (n % 1 ? n.toFixed(2).replace(".", ",") : String(n)) + " €";
  }

  /* ---------- Prezos ----------
   * Cada pack (p. ex. 2 camisetas) do pedido vai ao prezo do pack; as soltas, ao prezo normal.
   * Repártese por liñas na orde do pedido: as unidades que entran en pack levan o prezo do pack
   * dividido entre as súas unidades. A mesma conta faise no Apps Script. */
  var PACK = C.pack && C.pack.cantidade > 1 && C.pack.prezo > 0 ? C.pack : null;
  function redondear(n) { return Math.round(n * 100) / 100; }
  function calcularImportes(cantidades) {
    var unidades = cantidades.reduce(function (s, q) { return s + q; }, 0);
    var enPack = PACK ? Math.floor(unidades / PACK.cantidade) * PACK.cantidade : 0;
    var unidadePack = PACK ? PACK.prezo / PACK.cantidade : 0;
    var contadas = 0;
    var importes = cantidades.map(function (q) {
      var dePack = Math.max(0, Math.min(q, enPack - contadas));
      contadas += q;
      return redondear(dePack * unidadePack + (q - dePack) * C.prezo);
    });
    var total = redondear(importes.reduce(function (s, v) { return s + v; }, 0));
    return { importes: importes, total: total, aforro: redondear(unidades * C.prezo - total) };
  }

  /* ---------- Tallas ---------- */
  var TALLAS = [];
  C.tallas.forEach(function (g) {
    g.valores.forEach(function (v) { TALLAS.push(v + (g.sufixo || "")); });
  });

  /* ---------- Tanda ---------- */
  function finDoPeche() {
    var p = String(C.tanda.peche || "").split("-").map(Number);
    if (p.length !== 3 || p.some(isNaN)) return null;
    return new Date(p[0], p[1] - 1, p[2], 23, 59, 59);
  }
  var peche = finDoPeche();
  var aberta = !!C.tanda.aberta && (!peche || new Date() <= peche);

  /* ---------- Textos ---------- */
  document.title = T.tituloPaxina;
  document.querySelectorAll("[data-t]").forEach(function (n) {
    var v = T[n.getAttribute("data-t")];
    if (v != null) n.textContent = v;
  });
  document.querySelectorAll("[data-prezo]").forEach(function (n) { n.textContent = euros(C.prezo); });
  document.querySelectorAll("[data-prezo-pack]").forEach(function (n) {
    if (PACK) n.textContent = PACK.cantidade + " " + T.por + " " + euros(PACK.prezo);
    else n.hidden = true;
  });
  if (PACK) $("oferta-axuda").textContent = T.ofertaAxuda
    .replace("{cantidade}", PACK.cantidade).replace("{prezo}", euros(PACK.prezo));
  else $("oferta-axuda").hidden = true;

  var estado = $("estado");
  if (aberta) {
    estado.textContent = peche
      ? T.tandaAberta + " " + peche.getDate() + " de " + MESES[peche.getMonth()]
      : C.tanda.nome;
    if (C.tanda.entrega) estado.appendChild(el("small", { text: C.tanda.entrega }));
  } else {
    estado.textContent = T.tandaPechada;
    estado.classList.add("pechada");
    $("boton-hero").hidden = true;
  }
  $("pechada").hidden = aberta;
  $("formulario").hidden = !aberta;

  /* ---------- Imaxes ---------- */
  var hero = $("hero-foto");
  hero.alt = C.imaxes.equipoAlt || "";
  if (C.imaxes.equipoPequena && C.imaxes.equipo) {
    hero.srcset = C.imaxes.equipoPequena + " 800w, " + C.imaxes.equipo + " 1600w";
    hero.src = C.imaxes.equipoPequena;
  } else if (C.imaxes.equipo) {
    hero.removeAttribute("srcset");
    hero.src = C.imaxes.equipo;
  }

  C.cores.forEach(function (c) {
    if (!c.mockup) return;
    $("mockups").appendChild(el("figure", { class: "mockup" }, [
      el("img", { src: c.mockup, alt: "Camiseta " + c.nome.toLowerCase() + ": " +
        T.diante.toLowerCase() + " e " + T.detras.toLowerCase(), loading: "lazy", width: "992", height: "800" }),
      el("figcaption", null, [el("b", { text: c.nome }), el("span", { text: c.detalle || "" })])
    ]));
  });
  var galeria = C.imaxes.galeria || [];
  galeria.forEach(function (f) {
    $("galeria").appendChild(el("img", { src: f.src, alt: f.alt || "", loading: "lazy", width: "700", height: "1050" }));
  });
  if (!galeria.length) $("galeria").hidden = true;

  /* ---------- Pé ---------- */
  $("pe-empresa").textContent = C.pe.empresa;
  $("pe-email").textContent = C.pe.email;
  $("pe-email").href = "mailto:" + C.pe.email;
  C.pe.ligazons.forEach(function (l) {
    $("pe-ligazons").appendChild(el("li", null, [el("a", { href: l.url, rel: "noopener", text: l.texto })]));
  });

  if (!aberta) return;

  /* ---------- Liñas de pedido ---------- */
  var linas = $("linas");
  var seguinte = 0;

  function novaLina() {
    var n = ++seguinte;
    var opcions = el("div", { class: "cores-opcions" });
    var cores = el("fieldset", { class: "lina-cores" }, [el("legend", { text: T.cor }), opcions]);
    C.cores.forEach(function (c, i) {
      var input = el("input", { type: "radio", name: "cor-" + n, value: c.nome });
      if (i === 0) input.checked = true;
      var etiqueta = el("span", { text: c.nome });
      etiqueta.style.setProperty("--mostra", c.mostra || "#888");
      opcions.appendChild(el("label", { class: "cor" }, [input, etiqueta]));
    });

    var talla = el("select", { id: "talla-" + n, required: "", "aria-describedby": "talla-" + n + "-erro" });
    talla.appendChild(el("option", { value: "", text: T.escollerTalla }));
    C.tallas.forEach(function (g) {
      var og = el("optgroup", { label: g.grupo });
      g.valores.forEach(function (v) {
        var etiqueta = v + (g.sufixo || "");
        og.appendChild(el("option", { value: etiqueta, text: etiqueta }));
      });
      talla.appendChild(og);
    });

    var cantidade = el("select", { id: "cantidade-" + n });
    for (var q = 1; q <= C.cantidadeMaxima; q++) cantidade.appendChild(el("option", { value: q, text: q }));

    var quitar = el("button", { type: "button", class: "quitar", text: T.quitar });
    var lina = el("div", { class: "lina", "data-lina": n }, [
      cores,
      el("div", null, [el("label", { for: "talla-" + n, text: T.talla }), talla,
        el("p", { class: "erro", id: "talla-" + n + "-erro" })]),
      el("div", null, [el("label", { for: "cantidade-" + n, text: T.cantidade }), cantidade]),
      el("div", { class: "lina-pe" }, [el("span", { class: "lina-importe" }), quitar])
    ]);
    quitar.addEventListener("click", function () {
      lina.remove();
      actualizar();
      $("engadir").focus();
    });
    talla.addEventListener("change", function () { if (talla.value) marcarErro(talla, ""); });
    linas.appendChild(lina);
    actualizar();
    return lina;
  }

  function lerLinas() {
    return Array.prototype.map.call(linas.querySelectorAll(".lina"), function (l) {
      var cor = l.querySelector("input[type=radio]:checked");
      return {
        nodo: l,
        cor: cor ? cor.value : "",
        talla: l.querySelector("select[id^=talla]").value,
        cantidade: Number(l.querySelector("select[id^=cantidade]").value)
      };
    });
  }

  function actualizar() {
    var datos = lerLinas();
    var conta = calcularImportes(datos.map(function (d) { return d.cantidade; }));
    datos.forEach(function (d, i) {
      d.nodo.querySelector(".lina-importe").textContent = euros(conta.importes[i]);
    });
    // Con só unha liña non se pode quitar
    linas.querySelectorAll(".quitar").forEach(function (b) { b.hidden = datos.length < 2; });
    $("total").textContent = euros(conta.total);
    $("aforro").textContent = conta.aforro > 0 ? T.aforras + " " + euros(conta.aforro) : "";
    return conta.total;
  }

  linas.addEventListener("change", actualizar);
  $("engadir").addEventListener("click", function () {
    novaLina().querySelector("input[type=radio]").focus();
  });
  novaLina();

  /* ---------- Validación ---------- */
  function normalizarMobil(v) {
    var d = String(v).replace(/[\s.\-()]/g, "");
    d = d.replace(/^(\+|00)34/, "");
    if (d.length === 11 && d.indexOf("34") === 0) d = d.slice(2);
    return /^[67]\d{8}$/.test(d) ? d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6) : null;
  }
  function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function marcarErro(campo, msx) {
    var erro = $(campo.id + "-erro");
    if (erro) erro.textContent = msx;
    if (msx) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
    return !msx;
  }

  ["nome", "apelidos", "telefono", "email"].forEach(function (id) {
    $(id).addEventListener("input", function () {
      if ($(id).getAttribute("aria-invalid")) marcarErro($(id), "");
    });
  });
  $("rgpd").addEventListener("change", function () { if ($("rgpd").checked) marcarErro($("rgpd"), ""); });

  function validar() {
    var primeiro = null;
    function comprobar(campo, ok, msx) {
      marcarErro(campo, ok ? "" : msx);
      if (!ok && !primeiro) primeiro = campo;
    }
    comprobar($("nome"), $("nome").value.trim().length > 0, T.erroNome);
    comprobar($("apelidos"), $("apelidos").value.trim().length > 0, T.erroApelidos);
    comprobar($("telefono"), !!normalizarMobil($("telefono").value), T.erroTelefono);
    var email = $("email").value.trim();
    comprobar($("email"), !email || emailValido(email), T.erroEmail);
    lerLinas().forEach(function (d) {
      comprobar(d.nodo.querySelector("select[id^=talla]"), !!d.talla, T.erroTalla);
    });
    comprobar($("rgpd"), $("rgpd").checked, T.erroRgpd);
    return primeiro;
  }

  /* ---------- Envío ---------- */
  var formulario = $("formulario");
  var enviar = $("enviar");
  var enviandoAgora = false;

  function endpointListo() { return /^https:\/\/script\.google\.com\/.+\/exec$/.test(C.endpoint || ""); }
  function localhost() { return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname); }

  function mandar(datos) {
    if (!endpointListo()) {
      // Só para probar no propio ordenador antes de conectar o Apps Script.
      if (localhost()) {
        return new Promise(function (ok) {
          setTimeout(function () { ok({ ok: true, numero: C.prefixoPedido + "-PROBA" }); }, 600);
        });
      }
      return Promise.reject(new Error("Falta a URL do Apps Script en config.js"));
    }
    var control = "AbortController" in window ? new AbortController() : null;
    var temporizador = setTimeout(function () { if (control) control.abort(); }, 30000);
    // Sen cabeceiras propias: o navegador mándao como text/plain e Google acepta a petición sen CORS previo.
    return fetch(C.endpoint, {
      method: "POST",
      body: JSON.stringify(datos),
      redirect: "follow",
      signal: control ? control.signal : undefined
    }).then(function (r) { return r.json(); })
      .then(function (r) {
        clearTimeout(temporizador);
        if (!r || !r.ok) throw new Error((r && r.erro) || "Resposta incorrecta");
        return r;
      }, function (e) { clearTimeout(temporizador); throw e; });
  }

  formulario.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (enviandoAgora) return;
    $("erro-xeral").textContent = "";

    var primeiro = validar();
    if (primeiro) {
      $("erro-xeral").textContent = T.erroRevisa;
      primeiro.focus();
      return;
    }

    var pedido = lerLinas().map(function (d) {
      return { cor: d.cor, talla: d.talla, cantidade: d.cantidade };
    });
    var datos = {
      nome: $("nome").value.trim(),
      apelidos: $("apelidos").value.trim(),
      telefono: normalizarMobil($("telefono").value),
      email: $("email").value.trim(),
      observacions: $("observacions").value.trim(),
      linas: pedido,
      prezo: C.prezo,
      pack: PACK,
      tanda: C.tanda.nome,
      prefixo: C.prefixoPedido,
      ordeTallas: TALLAS,
      ordeCores: C.cores.map(function (c) { return c.nome; }),
      web: $("web").value // campo trampa
    };

    enviandoAgora = true;
    enviar.disabled = true;
    enviar.textContent = T.enviando;

    mandar(datos).then(function (r) {
      amosarConfirmacion(r.numero, datos);
    }).catch(function (e) {
      if (window.console) console.error(e);
      $("erro-xeral").textContent = T.erroEnvio;
      $("erro-xeral").scrollIntoView({ block: "center" });
    }).then(function () {
      enviandoAgora = false;
      enviar.disabled = false;
      enviar.textContent = T.enviar;
    });
  });

  function amosarConfirmacion(numero, datos) {
    var conta = calcularImportes(datos.linas.map(function (l) { return l.cantidade; }));
    var total = conta.total;
    var lista = $("resumo");
    lista.textContent = "";
    var linasTexto = datos.linas.map(function (l, i) {
      var importe = conta.importes[i];
      var texto = l.cantidade + " × " + l.cor + " · " + T.talla + " " + l.talla;
      lista.appendChild(el("li", null, [el("span", { text: texto }), el("span", { text: euros(importe) })]));
      return "- " + texto;
    });
    $("numero").textContent = numero;
    $("total-confirmado").textContent = euros(total);
    $("aforro-confirmado").textContent = conta.aforro > 0 ? T.aforras + " " + euros(conta.aforro) : "";

    var mensaxe = "Ola! Fixen o pedido " + numero + " da " + T.titulo + ":\n" +
      linasTexto.join("\n") + "\n" + T.total + ": " + euros(total) + "\n" +
      datos.nome + " " + datos.apelidos + " · " + datos.telefono;
    $("whatsapp").href = "https://wa.me/" + String(C.whatsapp || "").replace(/\D/g, "") +
      "?text=" + encodeURIComponent(mensaxe);

    formulario.hidden = true;
    $("t-pedido").hidden = true;
    $("confirmacion").hidden = false;
    $("confirmacion-titulo").focus();
    $("pedido").scrollIntoView({ block: "start" });
  }

  $("outro").addEventListener("click", function () {
    // Mantemos nome e teléfono (adoita ser a mesma familia); o resto vai en branco.
    $("observacions").value = "";
    $("rgpd").checked = false;
    linas.textContent = "";
    novaLina();
    $("confirmacion").hidden = true;
    $("t-pedido").hidden = false;
    formulario.hidden = false;
    $("nome").focus();
  });
})();
