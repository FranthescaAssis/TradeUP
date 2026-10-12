"""Gera app/data/municipios.json a partir da API oficial de localidades do IBGE.

Uso manual, só quando quiser atualizar a lista (nunca é executado na instalação nem ao iniciar o TradeUP):
    python scripts/gerar_municipios.py
"""
import gzip
import json
from datetime import date
from pathlib import Path
from urllib.request import urlopen

URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome"
DESTINO = Path(__file__).resolve().parents[1] / "app" / "data" / "municipios.json"


def main() -> None:
    with urlopen(URL, timeout=60) as resposta:
        conteudo = resposta.read()
    if conteudo[:2] == bytes([0x1F, 0x8B]):  # a resposta pode vir compactada (gzip)
        conteudo = gzip.decompress(conteudo)
    dados = json.loads(conteudo)
    por_uf: dict[str, list[str]] = {}
    for item in dados:
        # Alguns municípios vêm sem microrregião; a região imediata sempre traz a UF.
        uf = item["regiao-imediata"]["regiao-intermediaria"]["UF"]["sigla"]
        por_uf.setdefault(uf, []).append(item["nome"])
    por_uf = {uf: sorted(nomes) for uf, nomes in sorted(por_uf.items())}
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    DESTINO.write_text(json.dumps(por_uf, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    total = sum(len(n) for n in por_uf.values())
    print(f"{len(por_uf)} UFs, {total} municípios gravados em {DESTINO} ({date.today().isoformat()})")


if __name__ == "__main__":
    main()
