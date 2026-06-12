import argparse
import html
import json
import re
import ssl
import time
import unicodedata
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


BASE_URL = "https://catalogodefraudes.rnp.br"
STOPWORDS = {
    "para", "com", "uma", "por", "que", "dos", "das", "este", "esta", "esse",
    "essa", "seu", "sua", "seus", "suas", "como", "mais", "pela", "pelo",
    "nas", "nos", "aos", "aqui", "sobre", "mensagem", "fraude", "atencao",
    "cais", "rnp", "centro", "atendimento", "incidentes", "seguranca",
}


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self._current = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self._current = {"href": attrs["href"], "text": ""}
            self.links.append(self._current)

    def handle_data(self, data):
        if self._current is not None:
            self._current["text"] += data

    def handle_endtag(self, tag):
        if tag == "a":
            self._current = None


def fetch(url, opener, delay):
    time.sleep(delay)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "RadarGolpesPrototype/0.1 (+https://github.com/tuka1965-glitch/radar-golpes)",
        },
    )
    with opener.open(req, timeout=45) as response:
        return response.read().decode("utf-8", "ignore")


def normalize_space(value):
    value = html.unescape(value or "")
    value = value.replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def strip_tags(value):
    value = re.sub(r"<br\s*/?>", "\n", value or "", flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    return normalize_space(value)


def clean_message_text(value):
    value = normalize_space(value)
    header_mark = "###############################################################################"
    if value.startswith(header_mark) and value.count(header_mark) >= 2:
        value = value[value.rfind(header_mark) + len(header_mark):]
    value = re.sub(
        r"^.*?CENTRO DE ATENDIMENTO A INCIDENTES DE SEGURANCA \(CAIS\).*?RNP\)\s*#+\s*",
        "",
        value,
        flags=re.S,
    )
    return normalize_space(value)


def first_match(pattern, text):
    match = re.search(pattern, text, flags=re.I | re.S)
    return strip_tags(match.group(1)) if match else ""


def all_matches(pattern, text):
    return [strip_tags(match) for match in re.findall(pattern, text, flags=re.I | re.S)]


def normalize_for_tokens(value):
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.lower()
    return re.sub(r"[^a-z0-9]+", " ", value)


def keywords(*parts):
    tokens = normalize_for_tokens(" ".join(parts)).split()
    seen = []
    for token in tokens:
        if len(token) < 4 or token in STOPWORDS or token in seen:
            continue
        seen.append(token)
        if len(seen) >= 35:
            break
    return seen


def classify_type(text):
    normalized = normalize_for_tokens(text)
    rules = [
        (("inss", "previdencia"), "Falso INSS"),
        (("advogado", "processo", "indenizacao"), "Falso advogado"),
        (("pix", "banco", "conta", "agencia"), "Falso banco"),
        (("detran", "multa", "cnh"), "Falso Detran"),
        (("receita", "irpf", "imposto", "simples", "mei"), "Falso imposto"),
        (("correios", "frete", "entrega", "rastreamento"), "Falso frete"),
        (("curriculo", "documento", "download"), "Documentos para download"),
        (("pontos", "resgate", "milhas"), "Resgate de pontos"),
        (("boleto", "fatura"), "Falso boleto"),
        (("leilao",), "Falso leilao"),
    ]
    for terms, label in rules:
        if any(term in normalized for term in terms):
            return label
    return "Phishing"


def classify_company(text):
    normalized = normalize_for_tokens(text)
    rules = [
        (("inss", "previdencia"), "INSS"),
        (("detran", "cnh", "multa"), "Detran"),
        (("receita", "irpf", "imposto", "simples", "mei"), "Receita Federal"),
        (("correios", "frete", "entrega"), "Correios"),
        (("advogado", "processo"), "Escritorio de advocacia"),
        (("banco", "pix", "conta"), "Banco"),
        (("loja", "marketplace", "compra"), "Loja ou marketplace"),
        (("leilao",), "Empresa de leilao"),
    ]
    for terms, label in rules:
        if any(term in normalized for term in terms):
            return label
    return "Outra empresa"


def extract_indicators(text):
    urls = sorted(set(re.findall(r"https?://[^\s<>()\"']+", text, flags=re.I)))
    emails = sorted(set(re.findall(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", text)))
    phones = sorted(set(re.findall(r"(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-.\s]?\d{4}", text)))
    domains = sorted(set(re.findall(r"\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b", text, flags=re.I)))
    return {
        "urls": urls[:12],
        "emails": emails[:12],
        "phones": [normalize_space(phone) for phone in phones[:12]],
        "domains": domains[:12],
    }


def parse_index(html_text):
    parser = LinkParser()
    parser.feed(html_text)
    fraud_ids = []
    for link in parser.links:
        match = re.search(r"/frauds/(\d+)", link["href"])
        if match and match.group(1) not in fraud_ids:
            fraud_ids.append(match.group(1))
    return fraud_ids


def parse_detail(fraud_id, html_text):
    title = first_match(r"<h2>(.*?)</h2>", html_text)
    subject = first_match(r"<h4>\s*Assunto da mensagem:\s*(.*?)</h4>", html_text)
    included_at = first_match(r"<h4>\s*Data de inclus(?:ão|&atilde;o|ao):\s*(.*?)</h4>", html_text)
    description = first_match(r"<h4>\s*Data de inclus(?:ão|&atilde;o|ao):\s*.*?</h4>\s*<p>(.*?)</p>", html_text)
    message = clean_message_text(first_match(r"<pre>(.*?)</pre>", html_text))
    tags = all_matches(r'<a href="/frauds/tags/\d+"><i class="fa fa-tags"></i>(.*?)</a>', html_text)
    combined = "\n".join([title, subject, description, message, " ".join(tags)])
    source_url = f"{BASE_URL}/frauds/{fraud_id}"
    item = {
        "id": fraud_id,
        "source": "RNP/CAIS - Catalogo de Fraudes",
        "sourceUrl": source_url,
        "title": title,
        "subject": subject,
        "includedAt": included_at,
        "description": description,
        "messageText": message[:2200],
        "excerpt": normalize_space(message)[:360],
        "tags": tags,
        "scamType": classify_type(combined),
        "company": classify_company(combined),
        "indicators": extract_indicators(combined),
        "keywords": keywords(title, subject, description, message, " ".join(tags)),
    }
    return item


def build(args):
    context = ssl._create_unverified_context() if args.insecure_tls else None
    opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=context)) if context else urllib.request.build_opener()

    ids = []
    page = 1
    while len(ids) < args.limit and page <= args.max_pages:
        url = BASE_URL if page == 1 else f"{BASE_URL}/?page={page}"
        index_html = fetch(url, opener, args.delay)
        for fraud_id in parse_index(index_html):
            if fraud_id not in ids:
                ids.append(fraud_id)
                if len(ids) >= args.limit:
                    break
        page += 1

    items = []
    for position, fraud_id in enumerate(ids, start=1):
        detail_html = fetch(f"{BASE_URL}/frauds/{fraud_id}", opener, args.delay)
        item = parse_detail(fraud_id, detail_html)
        if item["title"] or item["messageText"]:
            items.append(item)
        if args.progress_every and (position == 1 or position % args.progress_every == 0 or position == len(ids)):
            print(f"{position}/{len(ids)} {fraud_id} {item['title']}")

    output = {
        "source": "https://catalogodefraudes.rnp.br/",
        "sourceName": "RNP/CAIS - Catalogo de Fraudes",
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "limit": args.limit,
        "items": items,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=True, indent=2), encoding="utf-8")
    print(f"Wrote {len(items)} fraud records to {args.output}")


def main():
    parser = argparse.ArgumentParser(description="Build a compact RNP fraud catalog JSON for the Radar de Golpes prototype.")
    parser.add_argument("--limit", type=int, default=2000, help="Maximum number of fraud records to collect.")
    parser.add_argument("--max-pages", type=int, default=300, help="Maximum catalog pages to scan for IDs.")
    parser.add_argument("--delay", type=float, default=0.2, help="Delay in seconds between HTTP requests.")
    parser.add_argument("--insecure-tls", action="store_true", help="Disable TLS certificate verification for environments with local CA issues.")
    parser.add_argument("--output", type=Path, default=Path("data/fraudes-rnp.json"))
    parser.add_argument("--progress-every", type=int, default=25, help="Print progress every N records. Use 0 to disable progress.")
    args = parser.parse_args()
    build(args)


if __name__ == "__main__":
    main()
