"""Extract exact MCQ choices/keys from the repository's original PDFs.
Requires PyMuPDF 1.26.7. The source PDFs are not modified.
"""
import json
import re
import fitz
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = [(5,5),(2,1),(2,1),(2,1),(8,8),(8,8),(8,0),(4,2),(4,2),(4,2),(3,2)]
def clean(text):
    return re.sub(r"\s+", " ", text).strip()

def chapter_pdf(number):
    path = ROOT / "Materi" / f"bab{number}.pdf"
    with fitz.open(path) as pdf:
        text = "\n".join(page.get_text() for page in pdf)
    result = {}
    for phase, start, end in [
        ("pretest", r"^9\.\s*Pre\s*Test", r"^10\.\s*Langkah Praktikum"),
        ("posttest", r"^11\.\s*Post\s*Test", r"^12\.\s*"),
    ]:
        m = re.search(start, text, re.I | re.M)
        e = re.search(end, text[m.end():], re.I | re.M) if m else None
        if not m or not e:
            raise ValueError(f"Bab {number}: cannot find {phase} section")
        section = text[m.start():m.end()+e.start()]
        heading = re.search(r"^A\.\s*Pilihan Ganda[^\n]*", section, re.I | re.M)
        if not heading:
            result[phase] = []
            continue
        part = section[heading.end():]
        essay = re.search(r"^B\.\s*Esai", part, re.I | re.M)
        part = part[:essay.start()] if essay else part
        cursor, items = 0, []
        for key in re.finditer(r"^\s*Kunci\s*:\s*([A-E])\b[^\n]*", part, re.M | re.I):
            block = part[cursor:key.start()]
            cursor = key.end()
            options = list(re.finditer(r"^\s*([A-E])\.\s*", block, re.M))
            if len(options) < 2:
                raise ValueError(f"Bab {number}: incomplete options")
            question = clean(re.sub(r"^\s*\d+\.\s*", "", block[:options[0].start()]))
            choices = {o[1]:clean(block[o.end():options[i+1].start() if i+1<len(options) else len(block)]) for i,o in enumerate(options)}
            answer = key[1].upper()
            if not question or answer not in choices or any(not v for v in choices.values()):
                raise ValueError(f"Bab {number}: malformed question")
            item = {"question":question,"options":list(choices.values()),"answer":list(choices).index(answer)}
            if number == 5 and phase == "posttest" and not items:
                item["note"] = "Kunci mengasumsikan implicit/global usings tidak mengimpor System.Collections.Generic. Project .NET modern dapat mengaktifkannya secara otomatis."
            items.append(item)
        result[phase] = items
    count = tuple(len(result[k]) for k in ("pretest","posttest"))
    if count != EXPECTED[number-1]:
        raise ValueError(f"Bab {number}: expected {EXPECTED[number-1]}, got {count}")
    return result

def main():
    dest = ROOT / "dist/content/chapters/assessment-bank.json"
    bank = {str(n):chapter_pdf(n) for n in range(1,12)}
    count = sum(len(v) for ch in bank.values() for v in ch.values())
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(bank, ensure_ascii=False, indent=2),encoding="utf-8")
    print(f"Extracted {count} multiple-choice questions from 11 original PDFs.")
if __name__ == "__main__":
    main()
