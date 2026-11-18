"""Lista las hojas de un archivo XLSX usando solo la librería estándar."""

import re
import sys
import zipfile

RUTA = sys.argv[1]

try:
    with zipfile.ZipFile(RUTA) as archivo:
        xml = archivo.read("xl/workbook.xml").decode("utf-8")
except (KeyError, OSError, zipfile.BadZipFile) as error:
    print(f"No se pudo leer el XLSX: {error}", file=sys.stderr)
    sys.exit(1)

hojas = re.findall(r'<sheet[^>]*name="([^"]+)"', xml)
if not hojas:
    print("El XLSX no contiene hojas", file=sys.stderr)
    sys.exit(1)

print("\n".join(hojas))
