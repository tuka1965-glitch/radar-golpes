# Radar de Golpes

Protótipo estático do conceito de um "Waze dos Golpes": denúncias colaborativas, consulta preventiva, alertas regionais, mapa de concentração e frente corporativa.

## Como abrir

Abra `index.html` diretamente no navegador ou sirva a pasta com:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory .\radar-golpes
```

Depois acesse `http://127.0.0.1:8765/`.

## O que está implementado

- Painel com métricas, alertas, mapa simplificado, ranking de golpes e feed de denúncias.
- Filtros por cidade, perfil e banco.
- Consulta preventiva por telefone, chave Pix, URL, CPF/CNPJ ou texto suspeito.
- Formulário de denúncia com classificação automática simulada.
- Visão corporativa com monitoramento de marca, relatórios e API de risco.

Os dados são simulados e ficam apenas no navegador.
