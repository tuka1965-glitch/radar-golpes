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
- Base inicial de 2.000 fraudes conhecidas da RNP/CAIS em `data/fraudes-rnp.json`, gerada por `tools/build_rnp_fraud_base.py`.
- Aba "Tipos de Golpes" alimentada por `data/taxonomy.json`, separada das estatisticas de denuncias.
- Categoria "Phishing web" em `data/taxonomy.json` preparada para feeds de URLs suspeitas como OpenPhish e PhishTank, sem expor links ativos na pagina publica.
- Aba "Modus Operandi" alimentada por `data/modus-operandi.json`, com busca por palavras-chave, filtro por categoria de engenharia social e resumos baseados em exemplos publicos da Febraban.
- Formulario de denuncia com UF, cidade aberta, idade, sexo, escolaridade, empresa, tipo de golpe, tipo de identificador e prejuizo estimado.
- Denuncias feitas no formulario podem ser salvas no Supabase para aparecerem em todos os dispositivos; sem Supabase configurado, ficam no `localStorage` do navegador.
- Classificacao simulada por regras para sugerir o enquadramento do texto e alimentar o painel.
- Visao corporativa com monitoramento de marca, relatorios e API de risco.

Os dados iniciais sao simulados. As novas denuncias ficam no navegador quando o Supabase esta desativado, ou na tabela compartilhada quando ele esta configurado.

## Ativar Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor e rode o script `docs/supabase-schema.sql`.
3. No Supabase, copie a Project URL e a anon public key.
4. Edite `data/supabase-config.json`:

```json
{
  "enabled": true,
  "url": "https://SEU-PROJETO.supabase.co",
  "anonKey": "SUA_ANON_PUBLIC_KEY",
  "table": "reports"
}
```

Com `enabled: true`, novas denuncias entram na tabela `reports` e a pagina passa a carregar as denuncias compartilhadas. A chave anon e publica por natureza, mas a seguranca depende das politicas RLS do script SQL.

## Atualizar base RNP

Para coletar uma amostra do Catalogo de Fraudes da RNP:

```powershell
python .\tools\build_rnp_fraud_base.py --limit 2000 --max-pages 300 --delay 0.25 --insecure-tls
```

Use `--insecure-tls` apenas quando o ambiente local nao validar a cadeia de certificados HTTPS da fonte. O coletor grava um JSON compacto com metadados, indicadores, palavras-chave e trechos limitados, sempre preservando o link da fonte original.

O repositorio tambem possui o workflow `.github/workflows/update-rnp-fraud-base.yml`, que atualiza essa base automaticamente toda segunda-feira e permite execucao manual pelo GitHub Actions.
