#!/usr/bin/env python3
"""Télécharge les images d'œuvres (Wikipédia fr → Wikimedia Commons) avec leurs crédits.
Lancé par .github/workflows/art-images.yml (les sessions de développement n'ont pas accès à Wikimedia).
Sortie : img/arts/<id>.webp, img/arts/mots/<id>.webp, js/data/decouvrir/arts-images.js, tools/art-images-rapport.md
Seules les images hébergées sur Commons (donc sous licence libre ou domaine public) sont gardées.
"""
import html, io, json, re, time, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

UA = "BagaSchool-art-images/1.0 (https://github.com/antbaga/BagaSchool; educational web app)"
ROOT = Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "tools/art-images.json").read_text(encoding="utf-8"))


def get(url, tries=4):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:
            if k == tries - 1:
                raise
            time.sleep(3 * (k + 1))


def api(base, **params):
    params.update(format="json", formatversion="2")
    return json.loads(get(base + "?" + urllib.parse.urlencode(params)))


def brut(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def cherche(titres, largeur):
    for t in titres:
        j = api("https://fr.wikipedia.org/w/api.php", action="query", redirects="1", prop="pageimages", piprop="name", titles=t)
        pages = j.get("query", {}).get("pages", [])
        if not pages or pages[0].get("missing") or not pages[0].get("pageimage"):
            continue
        fichier = pages[0]["pageimage"]
        c = api("https://commons.wikimedia.org/w/api.php", action="query", prop="imageinfo",
                iiprop="url|size|extmetadata", iiurlwidth=str(largeur), titles="File:" + fichier)
        cp = c.get("query", {}).get("pages", [])
        if not cp or "imageinfo" not in cp[0]:
            continue  # fichier local à fr.wikipedia (souvent non libre) : ignoré
        ii = cp[0]["imageinfo"][0]
        m = ii.get("extmetadata", {})
        return {"article": pages[0]["title"], "fichier": fichier, "url": ii.get("thumburl") or ii["url"],
                "page": ii.get("descriptionurl"), "licence": brut(m.get("LicenseShortName", {}).get("value")),
                "licenceUrl": brut(m.get("LicenseUrl", {}).get("value")), "photo": brut(m.get("Artist", {}).get("value"))[:160]}
    return None


def traite(liste, dossier, largeur, qualite):
    out, rapport = {}, []
    (ROOT / dossier).mkdir(parents=True, exist_ok=True)
    for e in liste:
        try:
            info = cherche(e["wiki"], largeur)
            if not info:
                rapport.append(f"| {e['id']} | introuvable ({' / '.join(e['wiki'])}) | | | |")
                continue
            im = Image.open(io.BytesIO(get(info["url"]))).convert("RGB")
        except Exception as ex:
            rapport.append(f"| {e['id']} | ERREUR {ex} | | | |")
            continue
        if im.width > largeur:
            im = im.resize((largeur, round(im.height * largeur / im.width)), Image.LANCZOS)
        chemin = f"{dossier}/{e['id']}.webp"
        im.save(ROOT / chemin, "WEBP", quality=qualite, method=6)
        out[e["id"]] = {"src": chemin, "w": im.width, "h": im.height, "fichier": info["fichier"], "page": info["page"],
                        "licence": info["licence"], "licenceUrl": info["licenceUrl"], "photo": info["photo"], "article": info["article"]}
        ko = (ROOT / chemin).stat().st_size // 1024
        rapport.append(f"| {e['id']} | {info['article']} | {info['fichier']} | {info['licence']} · {info['photo'][:60]} | {im.width}×{im.height}, {ko} Ko |")
        time.sleep(0.5)
    return out, rapport


oe, r1 = traite(CFG["oeuvres"], "img/arts", 1280, 80)
mo, r2 = traite(CFG["mots"], "img/arts/mots", 900, 78)
js = ("// Généré par tools/fetch_art_images.py (workflow art-images) : ne pas modifier à la main.\n"
      "// Images : Wikimedia Commons, via l'image principale des articles de Wikipédia en français ; licence de chaque photo ci-dessous.\n"
      f"export const IMAGES_OEUVRES = {json.dumps(oe, ensure_ascii=False, indent=0)};\n"
      f"export const IMAGES_MOTS = {json.dumps(mo, ensure_ascii=False, indent=0)};\n")
(ROOT / "js/data/decouvrir/arts-images.js").write_text(js, encoding="utf-8")
entete = "| id | article | fichier Commons | licence · photo | taille |\n|---|---|---|---|---|\n"
(ROOT / "tools/art-images-rapport.md").write_text(
    "# Images d'œuvres\n\n## Œuvres\n\n" + entete + "\n".join(r1) + "\n\n## Mots\n\n" + entete + "\n".join(r2) + "\n", encoding="utf-8")
print("\n".join(r1 + r2))
