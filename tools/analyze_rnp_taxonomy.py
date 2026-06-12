import json
import re
import unicodedata
from collections import Counter
from pathlib import Path


TAXONOMY_RULES = [
    ("Fiscal/tributario falso", [
        "simples nacional", "das mei", "darf", "irpf", "imposto",
        "receita federal", "cnpj", "nota fiscal", "nfe", "nf e", "sefaz",
        "icms", "mei", "tribut",
    ]),
    ("Cobranca/fatura/boleto falso", [
        "boleto", "fatura", "cobranca", "pagamento", "mensalidade", "netflix",
        "amazon prime", "vivo", "claro", "net", "sky", "amil", "nubank",
        "mercado pago", "porto seguro", "locaweb", "registro br", "globo",
        "globoplay", "spotify",
    ]),
    ("Banco/cartao/conta falsa", [
        "bradesco", "itau", "santander", "banco do brasil", "caixa economica",
        "nubank", "will bank", "bv financeira", "cartao", "conta", "token",
        "itoken", "pix", "ourocard", "personnalite", "prime", "private",
        "aeternum", "american express", "internet banking",
    ]),
    ("Documento/anexo/download malicioso", [
        "documentos para download", "documento assinado", "documento digital",
        "curriculo", "curriculo falso", "anexo", "assinatura eletronica",
        "perfil profissional", "documento disponivel", "comprovante",
        "orcamento",
    ]),
    ("Judicial/advocacia falsa", [
        "processo", "judicial", "intimacao", "notificacao extrajudicial",
        "audiencia", "trabalhista", "penhora", "bacen", "procon",
        "contestacao", "mandado", "cartorio", "protesto", "ministerio publico",
        "mpf",
    ]),
    ("Conta de email/webmail falsa", [
        "email", "e mail", "webmail", "zimbra", "outlook", "globomail",
        "yahoo", "armazenamento", "senha", "caixa postal",
        "limite de armazenamento", "validacao de e mail", "cota e mail",
    ]),
    ("Encomenda/frete falso", [
        "pedido retido", "pedio retido", "encomenda", "correios", "alfandega",
        "aduana", "rastreamento", "taxa de entrega", "jadlog", "dhl",
        "remessa", "produto correios", "fiscalizacao",
    ]),
    ("Transito/CNH/Detran falso", [
        "multa", "transito", "cnh", "senatran", "infracao", "licenciamento",
        "veiculo", "pedagio",
    ]),
    ("Pontos/milhas/recompensas falsas", [
        "pontos", "resgate", "milhas", "livelo", "bonus azul", "cashback",
        "smiles", "esfera", "fidelidade",
    ]),
    ("Doacao/premio/oferta falsa", [
        "doacao", "premio", "promocao", "convite", "valores a receber",
        "reembolso", "credito falso", "desconto via pix", "cupom", "smart tv",
        "smarttv",
    ]),
]


def normalize(value):
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.lower()
    return re.sub(r"[^a-z0-9]+", " ", value)


def classify(item):
    text = normalize(" ".join(str(item.get(key, "")) for key in ["title", "subject", "description", "excerpt"]))
    for label, terms in TAXONOMY_RULES:
        if any(normalize(term).strip() in text for term in terms):
            return label
    return "Outros/phishing generico"


def main():
    path = Path("data/fraudes-rnp.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data["items"]
    counts = Counter(classify(item) for item in items)
    for label, count in counts.most_common():
        percent = count / len(items) * 100
        print(f"{count:5d}  {percent:5.1f}%  {label}")


if __name__ == "__main__":
    main()
