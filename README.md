# Radar de Golpes

Prototipo estatico do conceito de um "Waze dos Golpes": denuncias colaborativas, consulta preventiva, alertas regionais, mapa de concentracao e frente corporativa.

## Como abrir

Abra `index.html` diretamente no navegador ou sirva a pasta com:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory .\radar-golpes
```

Depois acesse `http://127.0.0.1:8765/`.

## O que esta implementado

- Painel com metricas, alertas, mapa simplificado, ranking de golpes e feed de denuncias.
- Painel consolidado com as informacoes coletadas no formulario de denuncia.
- Consulta preventiva por telefone, chave Pix, URL, CPF/CNPJ ou texto suspeito.
- Base inicial de 500 fraudes conhecidas da RNP/CAIS em `data/fraudes-rnp.json`, gerada por `tools/build_rnp_fraud_base.py`.
- Formulario de denuncia com UF, cidade aberta, idade, sexo, escolaridade, empresa, tipo de golpe, tipo de identificador e prejuizo estimado.
- Classificacao simulada por regras para sugerir o enquadramento do texto e alimentar o painel.
- Visao corporativa com monitoramento de marca, relatorios e API de risco.

Os dados sao simulados e ficam apenas no navegador.

## Atualizar base RNP

Para coletar uma amostra do Catalogo de Fraudes da RNP:

```powershell
python .\tools\build_rnp_fraud_base.py --limit 500 --max-pages 80 --delay 0.25 --insecure-tls
```

Use `--insecure-tls` apenas quando o ambiente local nao validar a cadeia de certificados HTTPS da fonte. O coletor grava um JSON compacto com metadados, indicadores, palavras-chave e trechos limitados, sempre preservando o link da fonte original.

O repositorio tambem possui o workflow `.github/workflows/update-rnp-fraud-base.yml`, que atualiza essa base automaticamente toda segunda-feira e permite execucao manual pelo GitHub Actions.
