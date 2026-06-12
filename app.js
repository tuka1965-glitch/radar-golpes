const reports = [
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

const state = {
  city: "todas",
  profile: "todos",
  company: "todos"
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const $ = (selector) => document.querySelector(selector);

function filteredReports() {
  return reports.filter((report) => {
    const cityMatch = state.city === "todas" || report.city === state.city;
    const profileMatch = state.profile === "todos" || report.profile === state.profile || report.profile === "todos";
    const companyMatch = state.company === "todos" || report.company === state.company || report.company === "todos";
    return cityMatch && profileMatch && companyMatch;
  });
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function setOptions() {
  const cities = [...new Set(reports.map((report) => report.city))].sort();
  const formCompanies = Array.from(document.querySelectorAll("#reportCompany option")).map((option) => option.value);
  const companies = [...new Set([...reports.map((report) => report.company), ...formCompanies].filter((company) => company !== "todos"))].sort();
  $("#cityFilter").insertAdjacentHTML("beforeend", cities.map((city) => `<option value="${city}">${city}</option>`).join(""));
  $("#companyFilter").insertAdjacentHTML("beforeend", companies.map((company) => `<option value="${company}">${company}</option>`).join(""));
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

  const baseScore = matches.length ? 58 + matches.length * 10 : 24;
  const score = Math.min(96, baseScore + keywordHits.length * 8);
  const label = score >= 75 ? "Alto risco" : score >= 45 ? "Risco medio" : "Risco baixo";

  return {
    score,
    label,
    matches,
    keywordHits
  };
}

function renderLookup() {
  const result = riskLookup($("#lookupInput").value);
  const findings = [
    ...result.matches.slice(0, 3).map((match) => `<div class="finding"><strong>${match.indicator}</strong><p>Ja apareceu em ${match.city} como ${match.category.toLowerCase()}.</p></div>`),
    ...result.keywordHits.map((hit) => `<div class="finding"><strong>${hit[0]}</strong><p>${hit[1]}.</p></div>`)
  ];

  $("#lookupResult").innerHTML = `
    <div class="score-ring" style="--score:${result.score}%"><strong>${result.score}</strong></div>
    <h2>${result.label}</h2>
    <p>${result.matches.length ? `Encontramos ${result.matches.length} ocorrencia(s) relacionadas na base.` : "Nao ha denuncia igual, mas os sinais do texto ainda foram analisados."}</p>
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
  const text = $("#reportText").value;
  const selectedCategory = $("#reportScamType").value;
  const suggestedCategory = classifyReport(text);
  const indicator = $("#reportIndicator").value;
  const city = $("#reportCity").value;
  const loss = Number($("#reportLoss").value || 0);
  const category = selectedCategory || suggestedCategory;
  const newReport = {
    date: "2026-06-12 15:30",
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
  reports.unshift(newReport);
  render();
  $("#classificationResult").innerHTML = `
    <div class="finding"><strong>${category}</strong><p>Tipo informado na denuncia. Sugestao automatica pelo texto: ${suggestedCategory}.</p></div>
    <div class="finding"><strong>${newReport.indicatorType}</strong><p>${newReport.indicator} registrado para ${newReport.company} em ${newReport.city}/${newReport.uf}.</p></div>
    <div class="finding"><strong>${newReport.risk.toUpperCase()}</strong><p>O caso foi adicionado ao painel e passa a influenciar alertas, mapa e consulta preventiva.</p></div>
  `;
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

  $("#cityFilter").addEventListener("change", (event) => {
    state.city = event.target.value;
    render();
  });
  $("#profileFilter").addEventListener("change", (event) => {
    state.profile = event.target.value;
    render();
  });
  $("#companyFilter").addEventListener("change", (event) => {
    state.company = event.target.value;
    render();
  });
  $("#resetFilters").addEventListener("click", () => {
    state.city = "todas";
    state.profile = "todos";
    state.company = "todos";
    $("#cityFilter").value = "todas";
    $("#profileFilter").value = "todos";
    $("#companyFilter").value = "todos";
    render();
  });
  $("#lookupButton").addEventListener("click", renderLookup);
  $("#reportForm").addEventListener("submit", addReport);
}

setOptions();
bindEvents();
render();
renderLookup();
