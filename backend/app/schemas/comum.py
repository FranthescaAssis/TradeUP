"""Pedaços reaproveitados pelos esquemas: lista de UFs e funções de limpeza/validação."""
import re

UFS = set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split())

PADRAO_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PADRAO_CIDADE = re.compile(r"^[^\W\d_]+(?:[ '\-.]+[^\W\d_]+)*\.?$")


def compactar(texto: str) -> str:
    """Tira espaços das pontas e junta espaços repetidos."""
    return re.sub(r"\s+", " ", texto).strip()


def validar_email(valor: str, checar_tamanho: bool = True) -> str:
    email = valor.strip().lower()
    if not email:
        raise ValueError("Informe seu e-mail.")
    if checar_tamanho and len(email) > 100:
        raise ValueError("O e-mail pode ter no máximo 100 caracteres.")
    if not PADRAO_EMAIL.match(email):
        raise ValueError("Informe um e-mail válido, como voce@email.com.")
    return email
