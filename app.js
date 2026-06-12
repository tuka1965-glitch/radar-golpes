const seedReports = [
  { date: "2026-06-12 10:20", uf: "SP", city: "Sao Paulo", category: "Falso banco", indicatorType: "site", indicator: "seguranca-banco-validar.com", risk: "alto", loss: 1800, company: "Banco", profile: "aposentado", channel: "WhatsApp", growth: 230 },
  { date: "2026-06-12 09:14", uf: "RJ", city: "Rio de Janeiro", category: "Falso advogado", indicatorType: "telefone", indicator: "+55 21 98822-4401", risk: "alto", loss: 4200, company: "Escritorio de advocacia", profile: "juridico", channel: "Telefone", growth: 190 },
  { date: "2026-06-11 18:35", uf: "MG", city: "Belo Horizonte", category: "Falso frete", indicatorType: "site", indicator: "rastreio-entrega24.net", risk: "medio", loss: 240, company: "Correios", profile: "universitario", channel: "SMS", growth: 82 },
  { date: "2026-06-11 16:02", uf: "PR", city: "Curitiba", category: "Marketplace", indicatorType: "chave pix", indicator: "pix-33990011", risk: "medio", loss: 650, company: "Loja ou marketplace", profile: "empreendedor", channel: "Marketplace", growth: 64 },
  { date: "2026-06-11 13:45", uf: "PE", city: "Recife", category: "Falso INSS", indicatorType: "telefone", indicator: "+55 81 97770-1221", risk: "alto", loss: 1100, company: "INSS", profile: "aposentado", channel: "WhatsApp", growth: 156 },
  { date: "2026-06-10 21:30", uf: "GO", city: "Goiania", category: "Falso leilao", indicatorType: "site", indicator: "leilaobr-oficial.com", risk: "alto", loss: 7600, company: "Empresa de leilao", profile: "empreendedor", channel: "Site", growth: 110 },
  { date: "2026-06-10 12:20", uf: "BA", city: "Salvador", category: "Golpe do amor", indicatorType: "perfil em rede social", indicator: "perfil_marcelo_78", risk: "medio", loss: 900, company: "Outra empresa", profile: "todos", channel: "Rede social", growth: 45 },
  { date: "2026-06-09 19:17", uf: "CE", city: "Fortaleza", category: "Emprestimo fraudulento", indicatorType: "site", indicator: "credito-facil-ja.org", risk: "alto", loss: 2300, company: "Banco", profile: "empreendedor", channel: "Anuncio", growth: 138 },
  { date: "2026-06-09 15:48", uf: "SP", city: "Sao Paulo", category: "Falso Pix", indicatorType: "chave pix", indicator: "pix-11940027788", risk: "alto", loss: 530, company: "Banco", profile: "universitario", channel: "WhatsApp", growth: 98 },
  { date: "2026-06-08 11:05", uf: "DF", city: "Brasilia", category: "Falso imposto", indicatorType: "site", indicator: "gov-regularizacao.info", risk: "medio", loss: 370, company: "Receita Federal", profile: "empreendedor", channel: "E-mail", growth: 74 },
  { date: "2026-06-08 08:33", uf: "RS", city: "Porto Alegre", category: "Fraude do CEO", indicatorType: "e-mail", indicator: "financeiro-pagamentos@corp-mail.net", risk: "alto", loss: 12800, company: "Outra empresa", profile: "empreendedor", channel: "E-mail", growth: 88 },
  { date: "2026-06-07 17:42", uf: "AM", city: "Manaus", category: "Falsa loja", indicatorType: "site", indicator: "ofertas-relampago-br.com", risk: "baixo", loss: 180, company: "Loja ou marketplace", profile: "universitario", channel: "Site", growth: 22 }
];

const STORAGE_KEY = "radar-golpes-user-reports-v1";
let userReports = [];
let reports = [];
let knownFrauds = [];
let taxonomy = null;

const cityPositions = {
  "Manaus": [22, 30],
  "Fortaleza": [74, 29],
  "Recife": [78, 42],
  "Salvador": [71, 53],
  "Brasilia": [55, 55],
  "Goiania": [50, 61],
  "Belo Horizonte": [60, 69],
  "Rio de Janeiro": [64, 77],
  "Sao Paulo": [56, 80],
  "Curitiba": [51, 88],
  "Porto Alegre": [47, 96]
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const $ = (selector) => document.querySelector(selector);

function loadUserReports() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    userReports = Array.isArray(stored) ? stored : [];
  } catch (error) {
    userReports = [];
  }
  reports = [...userReports, ...seedReports];
}

function saveUserReports() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userReports));
}

function normalizeSearchText(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@./:+-]+/g, " ");
}

function searchTokens(value) {
  const stopwords = new Set(["para", "com", "uma", "por", "que", "dos", "das", "este", "esta", "como", "mais", "mensagem", "fraude"]);
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !stopwords.has(token));
}

function filteredReports() {
  return reports;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function renderMetrics(data) {
  const highRisk = data.filter((report) => report.risk === "alto").length;
  const loss = data.reduce((sum, report) => sum + report.loss, 0);
  const pix = data.filter((report) => /pix/i.test(report.indicator) || /pix/i.test(report.category)).length;
  const brands = new Set(data.map((report) => report.company).filter((company) => company !== "todos")).size;
  const emerging = data.filter((report) => report.growth >= 100).length;

  $("#reportsTotal").textContent = data.length;
  $("#riskHigh").textContent = highRisk;
  $("#emergingCount").textContent = emerging;
  $("#metric48h").textContent = data.filter((report) => report.date >= "2026-06-11").length;
  $("#metric48hDelta").textContent = emerging ? `+${Math.max(...data.map((report) => report.growth))}% no pico` : "Sem pico detectado";
  $("#metricLoss").textContent = money.format(loss);
  $("#metricPix").textContent = pix;
  $("#metricBrands").textContent = brands;
}

function renderAlerts(data) {
  const alerts = [...data]
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 4)
    .map((report) => {
      const severity = report.growth >= 100 ? "alto" : "medio";
      const text = report.growth >= 100
        ? `Aumento de ${report.growth}% em denuncias de ${report.category.toLowerCase()} em ${report.city}.`
        : `${report.category} segue ativo em ${report.city}, com reincidencia em ${report.channel}.`;
      return `<article class="alert-item ${severity === "medio" ? "medium" : ""}">
        <strong>${report.category}</strong>
        <span>${text}</span>
      </article>`;
    })
    .join("");

  $("#alertList").innerHTML = alerts || `<article class="alert-item medium"><strong>Nenhum alerta</strong><span>Os filtros atuais nao retornaram sinais relevantes.</span></article>`;
}

function renderMap(data) {
  const counts = countBy(data, "city");
  const max = Math.max(1, ...Object.values(counts));
  $("#mapGrid").innerHTML = Object.entries(counts).map(([city, count]) => {
    const [left, top] = cityPositions[city] || [50, 50];
    const size = 34 + (count / max) * 50;
    return `<button class="city-node" data-label="${city}" style="left:${left}%; top:${top}%; --size:${size}px" title="${city}: ${count} denuncias" type="button"></button>`;
  }).join("");
}

function renderBars(data) {
  const counts = countBy(data, "category");
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  $("#categoryBars").innerHTML = entries.map(([category, count]) => `
    <div class="bar-row">
      <strong>${category}</strong>
      <div class="bar-track"><div class="bar-fill" style="--value:${(count / max) * 100}%"></div></div>
      <span>${count}</span>
    </div>
  `).join("");
}

function renderRows(data) {
  $("#reportRows").innerHTML = data.slice(0, 8).map((report) => `
    <tr>
      <td>${report.date}</td>
      <td>${report.city}${report.uf ? `/${report.uf}` : ""}</td>
      <td>${report.category}</td>
      <td>${report.indicator}</td>
      <td><span class="risk ${report.risk}">${report.risk}</span></td>
    </tr>
  `).join("");
}

async function loadTaxonomy() {
  try {
    const response = await fetch("data/taxonomy.json", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    taxonomy = await response.json();
    renderTaxonomy();
  } catch (error) {
    taxonomy = null;
  }
}

function renderTaxonomy() {
  if (!taxonomy) {
    return;
  }
  const categories = Array.isArray(taxonomy.categories) ? taxonomy.categories : [];
  const totalCases = categories.reduce((sum, item) => sum + Number(item.knownCases || 0), 0);
  const sourceNames = (taxonomy.sources || []).map((source) => source.name).join(", ");

  $("#taxonomyNote").textContent = taxonomy.note || "";
  $("#taxonomySummary").innerHTML = `
    <span><strong>${categories.length}</strong> tipos</span>
    <span><strong>${totalCases.toLocaleString("pt-BR")}</strong> casos catalogados</span>
    <span><strong>${sourceNames || "Fontes em expansao"}</strong></span>
  `;
  $("#taxonomyList").innerHTML = categories.map((category) => `
    <article class="taxonomy-card">
      <div class="taxonomy-card-header">
        <div>
          <span class="eyebrow">${category.knownCases.toLocaleString("pt-BR")} casos conhecidos</span>
          <h3>${category.name}</h3>
        </div>
        <strong>${Number(category.share || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
      </div>
      <p>${category.description}</p>
      <div class="taxonomy-bar" aria-hidden="true"><span style="width:${category.share}%"></span></div>
      <div class="taxonomy-detail">
        <div>
          <strong>Sinais comuns</strong>
          <p>${(category.signals || []).join(", ")}</p>
        </div>
        <div>
          <strong>Exemplos</strong>
          <p>${(category.examples || []).join(", ")}</p>
        </div>
      </div>
      <p class="bias-text">${category.sourceBias}</p>
    </article>
  `).join("");
}

async function loadKnownFrauds() {
  try {
    const response = await fetch("data/fraudes-rnp.json", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const catalog = await response.json();
    knownFrauds = Array.isArray(catalog.items) ? catalog.items : [];
    renderLookup();
  } catch (error) {
    knownFrauds = [];
  }
}

function matchKnownFrauds(value) {
  if (!knownFrauds.length) {
    return [];
  }
  const normalized = normalizeSearchText(value);
  const tokens = new Set(searchTokens(value));

  return knownFrauds
    .map((fraud) => {
      const indicators = fraud.indicators || {};
      const indicatorValues = [
        ...(indicators.urls || []),
        ...(indicators.emails || []),
        ...(indicators.phones || []),
        ...(indicators.domains || []),
      ];
      const indicatorHit = indicatorValues.some((indicator) => indicator && normalized.includes(normalizeSearchText(indicator).trim()));
      const keywordHits = (fraud.keywords || []).filter((keyword) => tokens.has(normalizeSearchText(keyword).trim()));
      const sourceText = normalizeSearchText(`${fraud.title || ""} ${fraud.subject || ""} ${fraud.description || ""} ${fraud.excerpt || ""}`);
      const tokenHits = [...tokens].filter((token) => sourceText.includes(token)).slice(0, 12);
      const score = (indicatorHit ? 8 : 0) + keywordHits.length * 2 + tokenHits.length;
      return {
        fraud,
        score,
        indicatorHit,
        hits: [...new Set([...keywordHits, ...tokenHits])].slice(0, 8),
      };
    })
    .filter((match) => match.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function render() {
  const data = filteredReports();
  renderMetrics(data);
  renderAlerts(data);
  renderMap(data);
  renderBars(data);
  renderRows(data);
}

function riskLookup(value) {
  const normalized = value.toLowerCase();
  const knownMatches = matchKnownFrauds(value);
  const matches = reports.filter((report) => {
    const corpus = `${report.indicator} ${report.indicatorType || ""} ${report.category} ${report.company} ${report.channel}`.toLowerCase();
    return normalized.includes(report.indicator.toLowerCase()) || corpus.split(/[\s.-]+/).some((token) => token.length > 4 && normalized.includes(token));
  });

  const keywordHits = [
    ["bloqueada", "Pressao de urgencia para regularizar conta"],
    ["pix", "Pedido ou chave Pix no fluxo"],
    ["link", "Uso de link externo"],
    ["banco", "Uso de marca financeira"],
    ["inss", "Possivel golpe governamental"],
    ["advogado", "Possivel falso profissional"]
  ].filter(([keyword]) => normalized.includes(keyword));

  const baseScore = matches.length || knownMatches.length ? 58 + matches.length * 10 + knownMatches.length * 6 : 24;
  const score = Math.min(96, baseScore + keywordHits.length * 8);
  const label = score >= 75 ? "Alto risco" : score >= 45 ? "Risco medio" : "Risco baixo";

  return {
    score,
    label,
    matches,
    knownMatches,
    keywordHits
  };
}

function renderLookup() {
  const result = riskLookup($("#lookupInput").value);
  const findings = [
    ...result.matches.slice(0, 3).map((match) => `<div class="finding"><strong>${match.indicator}</strong><p>Ja apareceu em ${match.city} como ${match.category.toLowerCase()}.</p></div>`),
    ...result.knownMatches.map(({ fraud, hits }) => `<div class="finding"><strong>${fraud.scamType || fraud.title}</strong><p>Similar ao catalogo RNP: ${fraud.subject || fraud.title}. ${hits.length ? `Sinais: ${hits.join(", ")}.` : ""} <a href="${fraud.sourceUrl}" target="_blank" rel="noopener">Fonte</a></p></div>`),
    ...result.keywordHits.map((hit) => `<div class="finding"><strong>${hit[0]}</strong><p>${hit[1]}.</p></div>`)
  ];

  $("#lookupResult").innerHTML = `
    <div class="score-ring" style="--score:${result.score}%"><strong>${result.score}</strong></div>
    <h2>${result.label}</h2>
    <p>${result.matches.length || result.knownMatches.length ? `Encontramos ${result.matches.length + result.knownMatches.length} ocorrencia(s) relacionadas nas bases.` : "Nao ha denuncia igual, mas os sinais do texto ainda foram analisados."}</p>
    ${findings.join("") || `<div class="finding"><strong>Sem reincidencia</strong><p>O identificador ainda nao aparece na base simulada.</p></div>`}
  `;
}

function classifyReport(text) {
  const normalized = text.toLowerCase();
  const rules = [
    [/banco|conta|pix|gerente/, "Golpes Bancarios"],
    [/advogado|processo|forum|indenizacao/, "Golpes Profissionais"],
    [/inss|imposto|receita|gov/, "Golpes Governamentais"],
    [/frete|loja|entrega|marketplace/, "Golpes de Consumo"],
    [/amor|relacionamento|foto|video/, "Golpes Afetivos"],
    [/ceo|fornecedor|nota fiscal|financeiro/, "Golpes Empresariais"]
  ];
  const match = rules.find(([regex]) => regex.test(normalized));
  return match ? match[1] : "Golpe emergente";
}

function addReport(event) {
  event.preventDefault();
  const submitButton = $("#reportSubmit");
  const status = $("#reportStatus");
  const text = $("#reportText").value;
  const selectedCategory = $("#reportScamType").value;
  const suggestedCategory = classifyReport(text);
  const indicator = $("#reportIndicator").value;
  const city = $("#reportCity").value;
  const loss = Number($("#reportLoss").value || 0);
  const category = selectedCategory || suggestedCategory;
  const newReport = {
    date: new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    uf: $("#reportUf").value,
    city,
    category,
    indicatorType: $("#reportIndicatorType").value,
    indicator,
    risk: /pix|banco|bloqueada|advogado|inss|detran|boleto/i.test(`${text} ${category}`) ? "alto" : "medio",
    loss,
    company: $("#reportCompany").value,
    profile: "todos",
    age: $("#reportAge").value,
    sex: $("#reportSex").value,
    education: $("#reportEducation").value,
    channel: /whatsapp/i.test(text) ? "WhatsApp" : "Texto",
    growth: 121
  };
  userReports.unshift(newReport);
  saveUserReports();
  reports = [...userReports, ...seedReports];
  render();
  submitButton.classList.add("is-success");
  submitButton.textContent = "Denuncia enviada";
  status.textContent = `Denuncia registrada com sucesso para ${newReport.city}/${newReport.uf}.`;
  $("#classificationResult").innerHTML = `
    <div class="finding"><strong>${category}</strong><p>Tipo informado na denuncia. Sugestao automatica pelo texto: ${suggestedCategory}.</p></div>
    <div class="finding"><strong>${newReport.indicatorType}</strong><p>${newReport.indicator} registrado para ${newReport.company} em ${newReport.city}/${newReport.uf}.</p></div>
    <div class="finding"><strong>${newReport.risk.toUpperCase()}</strong><p>O caso foi adicionado ao painel e passa a influenciar alertas, mapa e consulta preventiva.</p></div>
  `;
  window.setTimeout(() => {
    submitButton.classList.remove("is-success");
    submitButton.textContent = "Enviar denuncia";
  }, 2600);
  $("#reportForm").reset();
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.view}`).classList.add("active");
    });
  });

  $("#lookupButton").addEventListener("click", renderLookup);
  $("#reportForm").addEventListener("submit", addReport);
}

loadUserReports();
bindEvents();
render();
loadTaxonomy();
renderLookup();
loadKnownFrauds();
