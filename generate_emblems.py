import os
import base64

base_dir = r"C:\Users\pisco\.gemini\antigravity\scratch\las-cuatro-casas"
icons = ['SO', 'EX', 'CZ', 'BS', 'GI', 'HE', 'NI']
out = "export const EMBLEMS_BASE64: Record<string, { white: string; black: string }> = {\n"

for ic in icons:
    wpath = os.path.join(base_dir, f"apps/web/public/icons/{ic}_white.png")
    bpath = os.path.join(base_dir, f"apps/web/public/icons/{ic}.png")
    with open(wpath, "rb") as f:
        wb64 = base64.b64encode(f.read()).decode("ascii")
    with open(bpath, "rb") as f:
        bb64 = base64.b64encode(f.read()).decode("ascii")
    out += f'  {ic}: {{\n'
    out += f'    white: "data:image/png;base64,{wb64}",\n'
    out += f'    black: "data:image/png;base64,{bb64}",\n'
    out += "  },\n"

out += "};\n"

target_path = os.path.join(base_dir, "apps/web/src/utils/emblemsData.ts")
with open(target_path, "w", encoding="utf-8") as f:
    f.write(out)

print(f"Generated {target_path} successfully, size: {len(out)} bytes")
