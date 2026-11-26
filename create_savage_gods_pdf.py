import os
import re
import base64
import io
from PIL import Image as PILImage

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

REPO_DIR = r"C:\Users\pisco\.gemini\antigravity\scratch\las-cuatro-casas"
BRAIN_DIR = r"C:\Users\pisco\.gemini\antigravity\brain\0db2cd87-73ce-4f6d-ab4b-4dad8b52f377"
EMBLEMS_TS = os.path.join(REPO_DIR, "apps", "web", "src", "utils", "emblemsData.ts")
OUTPUT_PDF_REPO = os.path.join(REPO_DIR, "Savage_Gods_Manual_Oficial.pdf")
OUTPUT_PDF_BRAIN = os.path.join(BRAIN_DIR, "Savage_Gods_Manual_Oficial.pdf")

# 1. Parse base64 emblems
emblems_data = {}
with open(EMBLEMS_TS, "r", encoding="utf-8") as f:
    ts_code = f.read()

matches = re.findall(r'([A-Z]{2}):\s*\{\s*white:\s*"data:image/png;base64,([^"]+)"', ts_code)
for key, b64_str in matches:
    img_bytes = base64.b64decode(b64_str)
    # create a dark badge with the white emblem for high contrast
    pil_img = PILImage.open(io.BytesIO(img_bytes)).convert("RGBA")
    
    # Create dark rounded background canvas
    badge_size = 180
    badge = PILImage.new("RGBA", (badge_size, badge_size), (15, 23, 42, 255)) # Dark slate
    
    # Resize emblem to fit inside badge
    pil_img.thumbnail((130, 130), PILImage.Resampling.LANCZOS)
    offset_x = (badge_size - pil_img.width) // 2
    offset_y = (badge_size - pil_img.height) // 2
    badge.paste(pil_img, (offset_x, offset_y), pil_img)
    
    out_io = io.BytesIO()
    badge.save(out_io, format="PNG")
    out_io.seek(0)
    emblems_data[key] = out_io.getvalue()

print(f"Extracted and generated badges for: {list(emblems_data.keys())}")

# 2. Numbered Canvas for Running Headers and Footers
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip header and footer on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header
        self.drawString(40, 810, "SAVAGE GODS • REGLAMENTO OFICIAL DE JUEGO DE TABLERO")
        self.drawRightString(555, 810, "EDICIÓN DIGITAL & FÍSICA v0.4")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 804, 555, 804)

        # Footer
        self.line(40, 45, 555, 45)
        self.drawString(40, 32, "web-rho-khaki-68.vercel.app • Documento Oficial de Referencia")
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(555, 32, page_str)
        self.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PDF_REPO,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_cover_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=36,
        leading=42,
        textColor=colors.HexColor('#0f172a'),
        alignment=1, # Center
        spaceAfter=6
    )

    sub_cover_style = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#b45309'), # Deep amber/gold
        alignment=1,
        spaceAfter=15
    )

    desc_cover_style = ParagraphStyle(
        'CoverDesc',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor('#334155'),
        alignment=1,
        spaceAfter=25
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#0f172a')
    )

    piece_title_style = ParagraphStyle(
        'PieceTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0f172a')
    )

    piece_desc_style = ParagraphStyle(
        'PieceDesc',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0284c7'), # sky blue
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'THStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TDStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # ==========================================================
    # PÁGINA 1: PORTADA
    # ==========================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("⚔️ SAVAGE GODS ⚔️", title_cover_style))
    story.append(Paragraph("MANUAL OFICIAL DE REGLAS & COMPENDIO TÁCTICO", sub_cover_style))
    story.append(HRFlowable(width="40%", thickness=2.5, color=colors.HexColor('#d97706'), spaceAfter=20, spaceBefore=5))
    
    story.append(Paragraph(
        "El juego de estrategia abstracta definitiva sobre un tablero hexagonal orgánico e interconectado.<br/>"
        "Comanda una de las Cuatro Casas divinas, cerca al Soberano rival y domina la colonia primordial.",
        desc_cover_style
    ))

    # Ficha técnica table
    specs_data = [
        [
            Paragraph("<b>JUGADORES</b><br/>2 a 4 Casas", body_style),
            Paragraph("<b>DURACIÓN</b><br/>20 – 45 Minutos", body_style),
            Paragraph("<b>EDAD SUGERIDA</b><br/>A partir de 10 años", body_style),
            Paragraph("<b>COMPLEJIDAD</b><br/>Estratégica / Táctica", body_style)
        ]
    ]
    specs_table = Table(specs_data, colWidths=[125, 125, 125, 125])
    specs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(specs_table)
    story.append(Spacer(1, 30))

    # Box with lore and intro
    intro_box_data = [[
        Paragraph(
            "<b>EL CHOQUE DE LAS CUATRO CASAS DIVINAS:</b><br/>"
            "En un mundo donde los dioses descienden a la colmena de batalla, cuatro facciones combaten "
            "por la supremacía absoluta: la <b>Casa Roja</b> (Furia de la Guerra), la <b>Casa Azul</b> (Mareas y Flujo), "
            "la <b>Casa Verde</b> (Fuerza de la Tierra) y la <b>Casa Ámbar</b> (Astucia del Fuego Solar).<br/><br/>"
            "En <i>Savage Gods</i>, <b>no existe un tablero predefinido</b>: la propia formación de fichas es el terreno. "
            "Cada movimiento altera la topografía del campo, abre caminos aéreos para Cazadores y Bestias, "
            "o eleva Gigantes sobre las cabezas de sus enemigos.<br/><br/>"
            "<b>Tu misión:</b> Dirigir a tus 13 guerreros míticos, proteger a tu Soberano y rodear completamente al Soberano enemigo para desatar su caída definitiva.",
            callout_style
        )
    ]]
    intro_table = Table(intro_box_data, colWidths=[500])
    intro_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#3b82f6')),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 16),
        ('RIGHTPADDING', (0,0), (-1,-1), 16),
    ]))
    story.append(intro_table)
    
    story.append(Spacer(1, 40))
    story.append(Paragraph(
        "<b>Edición Oficial v0.4</b> • Aprobada para Partidas de Mesa y Competición Online<br/>"
        "Disponible para jugar en línea con multijugador P2P en: <b>https://web-rho-khaki-68.vercel.app/</b>",
        ParagraphStyle('FootNoteCover', parent=body_style, alignment=1, fontSize=8.5, textColor=colors.HexColor('#64748b'))
    ))

    # ==========================================================
    # PÁGINA 2: COMPONENTES Y LEYES FUNDAMENTALES
    # ==========================================================
    story.append(PageBreak())

    story.append(Paragraph("1. Componentes del Juego", h1_style))
    story.append(Paragraph(
        "El juego completo incluye <b>52 fichas hexagonales de alta densidad</b>, divididas en 4 ejércitos de 13 fichas por Casa. "
        "Cada Casa se identifica por su color representativo y contiene la misma dotación táctica simétrica:",
        body_style
    ))

    comp_table_data = [
        [Paragraph("Pieza", table_header_style), Paragraph("Cód.", table_header_style), Paragraph("Cant.", table_header_style), Paragraph("Rol Táctico Principal", table_header_style)],
        [Paragraph("<b>El Soberano</b>", table_cell_style), Paragraph("SO", table_cell_style), Paragraph("<b>1</b>", table_cell_style), Paragraph("Corona y vida de la Casa. Se desliza 1 paso. Si sus 6 casillas son cercadas, pierdes.", table_cell_style)],
        [Paragraph("<b>El Explorador</b>", table_cell_style), Paragraph("EX", table_cell_style), Paragraph("<b>3</b>", table_cell_style), Paragraph("Velocista perimetral. Se desliza libremente por el contorno exterior de la colonia.", table_cell_style)],
        [Paragraph("<b>El Cazador / Espadachín</b>", table_cell_style), Paragraph("CZ", table_cell_style), Paragraph("<b>3</b>", table_cell_style), Paragraph("Saltador acrobático. Salta en línea recta hasta 4 pasos en las 6 direcciones (horizontales/diagonales).", table_cell_style)],
        [Paragraph("<b>La Bestia Saltadora</b>", table_cell_style), Paragraph("BS", table_cell_style), Paragraph("<b>2</b>", table_cell_style), Paragraph("Ariete frontal. Salta sobre cualquier hilera continua de piezas al primer espacio libre.", table_cell_style)],
        [Paragraph("<b>El Gigante</b>", table_cell_style), Paragraph("GI", table_cell_style), Paragraph("<b>2</b>", table_cell_style), Paragraph("Dominador vertical. Mueve 1 paso o trepa a pilas, inmovilizando la pieza inferior.", table_cell_style)],
        [Paragraph("<b>El Hechicero de Cadenas</b>", table_cell_style), Paragraph("HE", table_cell_style), Paragraph("<b>1</b>", table_cell_style), Paragraph("Replicador arcano. Copia el movimiento de cualquier pieza contigua durante ese turno.", table_cell_style)],
        [Paragraph("<b>El Nigromante</b>", table_cell_style), Paragraph("NI", table_cell_style), Paragraph("<b>1</b>", table_cell_style), Paragraph("Canalizador de los muertos. Desliza 1, intercambia lugares o destierra fichas enemigas.", table_cell_style)],
    ]
    comp_table = Table(comp_table_data, colWidths=[120, 35, 45, 300])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("2. Las Tres Leyes Sagradas de la Colonia", h1_style))
    story.append(Paragraph(
        "En <i>Savage Gods</i>, el tablero no tiene bordes rígidos ni casillas fijas. Para garantizar la integridad estratégica, "
        "toda jugada debe cumplir estrictamente tres leyes físicas universales:",
        body_style
    ))

    # Law 1
    l1_data = [[
        Paragraph(
            "<b>LEY I: LA COLONIA UNIDA (ONE-HIVE RULE)</b><br/>"
            "En todo instante, todas las fichas presentes en el tablero deben formar un <b>único conjunto conexo e indivisible</b>. "
            "Está absolutamente prohibido realizar un movimiento, salto o destierro si con ello la colmena queda partida en dos o más islas separadas, "
            "ni siquiera por un instante fugaz durante el movimiento. Una pieza que sea el único puente entre dos sectores no puede moverse.",
            callout_style
        )
    ]]
    t_l1 = Table(l1_data, colWidths=[500])
    t_l1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef3c7')), # Amber light
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#d97706')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_l1)
    story.append(Spacer(1, 8))

    # Law 2
    l2_data = [[
        Paragraph(
            "<b>LEY II: EL PASO FÍSICO ESTRECHO (GATE RULE / DESLIZAMIENTO)</b><br/>"
            "Las piezas que se desplazan deslizándose a ras de suelo (Soberano, Explorador) requieren espacio físico real para deslizarse. "
            "Si el hueco entre dos fichas adyacentes es más angosto que el diámetro de la ficha, el paso está bloqueado. "
            "Las piezas saltadoras (Cazador, Bestia) y los Gigantes que trepan por arriba ignoran el paso estrecho.",
            callout_style
        )
    ]]
    t_l2 = Table(l2_data, colWidths=[500])
    t_l2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')), # Green light
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#16a34a')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_l2)
    story.append(Spacer(1, 8))

    # Law 3
    l3_data = [[
        Paragraph(
            "<b>LEY III: RUINAS PERMANENTES & CAÍDA DE LA CASA</b><br/>"
            "Cuando el Soberano de una Casa es cercado por completo en sus 6 casillas, esa Casa es eliminada inmediatamente. "
            "Sin embargo, <b>sus fichas no se retiran del tablero</b>: quedan petrificadas permanentemente como <b>Ruinas</b>. "
            "Las Ruinas conservan la conexión de la colonia, sirven de peldaño para saltos y pueden ser escaladas, pero jamás vuelven a moverse.",
            callout_style
        )
    ]]
    t_l3 = Table(l3_data, colWidths=[500])
    t_l3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fef2f2')), # Red light
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#dc2626')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_l3)

    # ==========================================================
    # PÁGINA 3: FLUJO DEL TURNO Y REGLAS DE COLOCACIÓN
    # ==========================================================
    story.append(PageBreak())

    story.append(Paragraph("3. Fases de la Partida & Dinámica del Turno", h1_style))
    story.append(Paragraph(
        "El juego transcurre por turnos alternados entre las Casas en sentido horario. En su turno, el jugador activo "
        "debe realizar exactamente <b>una acción</b>: colocar una ficha nueva de su reserva o mover una ficha que ya esté en el tablero.",
        body_style
    ))

    flow_table_data = [
        [Paragraph("Fase / Regla", table_header_style), Paragraph("Detalle de Ejecución y Restricciones", table_header_style)],
        [
            Paragraph("<b>1. Despliegue de Fichas (Reserva)</b>", table_cell_style),
            Paragraph(
                "• Al colocar una ficha nueva desde la reserva, debe situarse en una casilla vacía que esté en <b>contacto directo únicamente con fichas de su propio color</b>.<br/>"
                "• Está estrictamente prohibido colocar una ficha nueva tocando casillas de una Casa rival.<br/>"
                "• <i>Excepción inicial:</i> La primera ficha de la partida se ubica en el centro; la primera ficha del segundo jugador se ubica adyacente a ella.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>2. El Soberano Obligatorio</b>", table_cell_style),
            Paragraph(
                "• <b>Regla Mandatoria:</b> Tu Soberano debe ser colocado en el tablero en cualquiera de tus <b>primeros 3 turnos</b>.<br/>"
                "• <b>Bloqueo de Movimiento:</b> Mientras tu Soberano no esté en el tablero, <b>ninguna ficha de tu casa puede moverse</b> (solo puedes colocar fichas de la reserva).",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>3. Movimiento de Fichas</b>", table_cell_style),
            Paragraph(
                "• Una vez colocado tu Soberano, puedes elegir en cada turno mover una ficha propia ya presente en el tablero.<br/>"
                "• El movimiento debe obedecer el patrón de la pieza y respetar la regla de la colonia unida (One-Hive).",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>4. Excepción de la Sexta Casilla</b>", table_cell_style),
            Paragraph(
                "• <b>Prohibición de Asedio Directo:</b> Jamás se puede colocar una ficha de la reserva directamente en la sexta y última casilla que rodea a un Soberano vivo.<br/>"
                "• El cerco de victoria final <b>debe cerrarse siempre mediante el movimiento táctico</b> de una ficha ya en juego.",
                table_cell_style
            )
        ],
        [
            Paragraph("<b>5. Sin Jugada Legal (Pasar)</b>", table_cell_style),
            Paragraph(
                "• Si un jugador no puede realizar ninguna colocación legal ni mover legalmente ninguna ficha (por bloqueo o riesgo de romper la colonia), "
                "debe <b>pasar su turno</b> obligatoriamente.",
                table_cell_style
            )
        ]
    ]
    flow_table = Table(flow_table_data, colWidths=[140, 360])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("4. Condición de Victoria: El Cerco Multicolor", h1_style))
    story.append(Paragraph(
        "En <i>Savage Gods</i>, la victoria se obtiene conquistando a los Soberanos enemigos mediante su cerco total:",
        body_style
    ))

    vic_data = [[
        Paragraph(
            "👑 <b>CONDICIÓN DE CERCO TOTAL:</b><br/>"
            "Un Soberano cae en el instante en que <b>sus 6 casillas hexagonales adyacentes están ocupadas</b>.<br/>"
            "• Las 6 casillas pueden ser cubiertas por <b>cualquier mezcla de colores</b>: fichas enemigas, aliadas o ruinas petrificadas.<br/>"
            "• Si tu propio movimiento completa el cerco alrededor del Soberano enemigo, ganas la gloria de esa caída.<br/>"
            "• <b>Cuidado con el autosacrificio:</b> Rodear a tu propio Soberano por error causa tu propia eliminación inmediata.<br/>"
            "• En partidas a 3 o 4 jugadores, la partida continúa hasta que quede <b>un solo Soberano con vida</b>.",
            callout_style
        )
    ]]
    t_vic = Table(vic_data, colWidths=[500])
    t_vic.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#059669')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_vic)

    # ==========================================================
    # PÁGINA 4: COMPENDIO DE FICHAS (PARTE 1)
    # ==========================================================
    story.append(PageBreak())
    story.append(Paragraph("5. Compendio Oficial de Fichas (I)", h1_style))
    story.append(Paragraph(
        "Cada ficha de <i>Savage Gods</i> posee una personalidad militar única, identificada por su emblema blanco en alto contraste. "
        "A continuación se detallan las 7 clases de guerreros:",
        body_style
    ))

    # Helper function to create piece entry
    def make_piece_block(code, name, count, desc, rules_list):
        img_data = emblems_data.get(code)
        img_flowable = Image(io.BytesIO(img_data), width=48, height=48) if img_data else Paragraph(f"<b>{code}</b>", body_style)

        rules_html = "".join([f"• {r}<br/>" for r in rules_list])
        
        info_data = [
            [
                Paragraph(f"<b>{name.upper()}</b>", piece_title_style),
                Paragraph(f"<b>{count}x Por Casa</b>", ParagraphStyle('Badge', parent=body_style, alignment=2, textColor=colors.HexColor('#b45309'), fontName='Helvetica-Bold'))
            ],
            [
                Paragraph(desc, piece_desc_style),
                Paragraph(f"Código: <b>{code}</b>", ParagraphStyle('CodeTag', parent=body_style, alignment=2, fontSize=8, textColor=colors.HexColor('#64748b')))
            ],
            [
                Paragraph(rules_html, ParagraphStyle('Rules', parent=body_style, fontSize=8.5, leading=12)),
                ""
            ]
        ]
        info_table = Table(info_data, colWidths=[310, 110])
        info_table.setStyle(TableStyle([
            ('SPAN', (0,2), (1,2)),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))

        entry_data = [[img_flowable, info_table]]
        entry_table = Table(entry_data, colWidths=[60, 430])
        entry_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (0,0), (0,0), 'CENTER'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        return entry_table

    # Soberano
    p_so = make_piece_block(
        "SO", "El Soberano", 1,
        "La Corona y Vida de la Casa. Objetivo de asedio y victoria.",
        [
            "<b>Movimiento:</b> Se desliza exactamente <b>1 casilla</b> a un hexágono adyacente vacío a ras de suelo.",
            "<b>Paso Estrecho:</b> Respeta la regla física (no puede deslizarse entre dos piezas adyacentes estrechas).",
            "<b>Condición de Derrota:</b> Si sus 6 casillas adyacentes quedan ocupadas, la Casa cae al instante.",
            "<b>Inmovilismo Inicial:</b> Ninguna otra ficha puede moverse hasta que el Soberano esté en el tablero."
        ]
    )
    story.append(p_so)
    story.append(Spacer(1, 8))

    # Explorador
    p_ex = make_piece_block(
        "EX", "El Explorador", 3,
        "Corredor perimetral de velocidad extrema y cerco relámpago.",
        [
            "<b>Movimiento:</b> Se desliza <b>cualquier número de casillas</b> por el contorno exterior de la colonia.",
            "<b>Adherencia Obligatoria:</b> Debe bordear la formación sin despegarse de ella en ningún momento.",
            "<b>Paso Estrecho:</b> Debe haber paso físico libre en cada casilla transitada de su recorrido.",
            "No puede saltar, no puede subir a pilas ni penetrar en huecos cerrados de la colonia."
        ]
    )
    story.append(p_ex)
    story.append(Spacer(1, 8))

    # Cazador
    p_cz = make_piece_block(
        "CZ", "El Cazador / Espadachín", 3,
        "Saltador acrobático en línea recta. Asalto directo aéreo.",
        [
            "<b>Movimiento:</b> Salta en línea recta <b>hasta 4 pasos</b> en cualquiera de sus <b>6 direcciones</b> (horizontales este/oeste y diagonales).",
            "<b>Sobrevuelo Continuo:</b> Salta obligatoriamente sobre <b>1, 2 o hasta 3 fichas contiguas de altura 1</b> y aterriza en la casilla vacía inmediata.",
            "<b>Prohibición Absoluta:</b> Jamás salta sobre casillas vacías (cada hexágono sobrevolado debe tener una ficha contigua).",
            "<b>Corte por Pilas:</b> Cualquier pila de altura 2 o más en la trayectoria corta su salto por completo."
        ]
    )
    story.append(p_cz)
    story.append(Spacer(1, 8))

    # Bestia
    p_bs = make_piece_block(
        "BS", "La Bestia Saltadora", 2,
        "Carga lineal pesada capaz de atravesar enjambres completos.",
        [
            "<b>Movimiento:</b> Carga en línea recta sobre <b>cualquier número de fichas contiguas</b> sin límite de distancia.",
            "<b>Aterrizaje Forzoso:</b> Aterriza en la <b>primera casilla vacía</b> inmediatamente al otro lado de la formación.",
            "<b>Requisito:</b> Debe saltar al menos 1 ficha (no puede moverse sin saltar).",
            "<b>Ignora Paso Estrecho:</b> Al ser un salto parabólico, puede entrar y salir de huecos completamente rodeados."
        ]
    )
    story.append(p_bs)

    # ==========================================================
    # PÁGINA 5: COMPENDIO DE FICHAS (PARTE 2)
    # ==========================================================
    story.append(PageBreak())
    story.append(Paragraph("5. Compendio Oficial de Fichas (II)", h1_style))
    story.append(Paragraph(
        "Las tres fichas avanzadas de <i>Savage Gods</i> introducen dominación tridimensional de pilas, copia de poderes y manipulación de destierros:",
        body_style
    ))

    # Gigante
    p_gi = make_piece_block(
        "GI", "El Gigante", 2,
        "Coloso de dominación vertical y aplastamiento de pilas.",
        [
            "<b>Movimiento Terrestre:</b> Avanza 1 casilla a ras de suelo hacia un hexágono libre.",
            "<b>Escalar Pilas:</b> Puede <b>trepar sobre cualquier ficha adyacente</b> a ras de suelo, formando una pila de altura 2 o superior.",
            "<b>Inmovilización Total:</b> La pieza que queda atrapada debajo del Gigante <b>no puede moverse</b> mientras el Gigante siga encima.",
            "<b>Color Dominante:</b> La casilla adopta el color del Gigante superior para reglas de contacto y colocación de reserva.",
            "Desde la cima de una pila, puede caminar hacia otra pila adyacente o descender a un espacio libre."
        ]
    )
    story.append(p_gi)
    story.append(Spacer(1, 8))

    # Hechicero
    p_he = make_piece_block(
        "HE", "El Hechicero de Cadenas", 1,
        "Replicador táctico capaz de canalizar las habilidades de piezas vecinas.",
        [
            "<b>Copia de Poderes en Suelo:</b> Copia el movimiento de la ficha superior de cualquier pila que toque (viva o ruina), excepto al Nigromante. La copia es válida solo durante ese turno.",
            "<b>Trepar a Pilas:</b> Solo puede trepar a una pila si está copiando el poder de un <i>Gigante</i> adyacente.",
            "<b>Comportamiento en Cima:</b> Mientras esté en la cima de una pila, se mueve 1 paso como un Gigante y no copia nada.",
            "<b>Vulnerabilidad:</b> Si un Gigante rival o aliado trepa sobre él, el Hechicero queda inmovilizado."
        ]
    )
    story.append(p_he)
    story.append(Spacer(1, 8))

    # Nigromante
    p_ni = make_piece_block(
        "NI", "El Nigromante", 1,
        "Conector de los mundos. Realiza una de tres acciones exclusivas por turno:",
        [
            "<b>Acción A (Deslizar):</b> Avanza exactamente 1 casilla a un hexágono vacío vecino a ras de suelo.",
            "<b>Acción B (Intercambiar):</b> Cambia instantáneamente su lugar con la pieza superior de una pila adyacente (viva o ruina, <b>Soberanos incluidos</b>).",
            "<b>Acción C (Destierro):</b> Expulsa del tablero una ficha enemiga viva solitaria adyacente (no Soberanos y sin dividir la colonia). La ficha vuelve a la reserva de su dueño al final de su siguiente turno como ficha nueva.",
            "<b>Restricción Vital:</b> El Nigromante jamás puede ser copiado por el Hechicero."
        ]
    )
    story.append(p_ni)
    story.append(Spacer(1, 14))

    # Diagram box summary for vertical play
    pila_box_data = [[
        Paragraph(
            "<b>REGLAS CLAVE PARA PILAS Y ALTURAS:</b><br/>"
            "• <b>Altura 1:</b> Fichas a ras de suelo.<br/>"
            "• <b>Altura 2+:</b> Pilas creadas por Gigantes o Hechiceros escaladores.<br/>"
            "• La ficha superior es la <b>única activa</b>: otorga su color a la casilla e inmoviliza a las piezas inferiores.<br/>"
            "• Para calcular la conectividad de la colonia (One-Hive), la casilla cuenta como conectada independientemente de cuántas piezas estén apiladas en ella.",
            callout_style
        )
    ]]
    t_pila = Table(pila_box_data, colWidths=[500])
    t_pila.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f5f3ff')),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#7c3aed')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_pila)

    # ==========================================================
    # PÁGINA 6: PREGUNTAS FRECUENTES Y ESTRATEGIA
    # ==========================================================
    story.append(PageBreak())
    story.append(Paragraph("6. Preguntas Frecuentes (FAQ Oficial)", h1_style))
    story.append(Paragraph(
        "Resoluciones oficiales del motor de reglas para situaciones de combate complejas:",
        body_style
    ))

    faq_data = [
        [Paragraph("Situación Táctica", table_header_style), Paragraph("Resolución Oficial del Árbitro / Motor", table_header_style)],
        [
            Paragraph("<b>¿Puede el Cazador saltar en horizontal?</b>", table_cell_style),
            Paragraph("<b>SÍ.</b> El tablero hexagonal posee 6 ejes naturales (2 horizontales este/oeste y 4 diagonales). El Cazador puede saltar en cualquiera de las 6 direcciones.", table_cell_style)
        ],
        [
            Paragraph("<b>¿Puede el Cazador saltar sobre espacios vacíos?</b>", table_cell_style),
            Paragraph("<b>NO.</b> Cada casilla sobrevolada debe contener físicamente una ficha contigua de altura 1. Nunca puede volar sobre huecos vacíos.", table_cell_style)
        ],
        [
            Paragraph("<b>¿Qué ocurre si una pila de altura 2 está en el camino del Cazador?</b>", table_cell_style),
            Paragraph("La pila de altura 2 actúa como un muro infranqueable y <b>corta su trayectoria de salto por completo</b>.", table_cell_style)
        ],
        [
            Paragraph("<b>¿Puede el Soberano ser desterrado por el Nigromante?</b>", table_cell_style),
            Paragraph("<b>NO.</b> El Soberano está protegido contra el destierro directo. Sin embargo, el Nigromante sí puede <i>intercambiar lugares</i> con él.", table_cell_style)
        ],
        [
            Paragraph("<b>¿Qué sucede si un jugador no tiene jugadas legales?</b>", table_cell_style),
            Paragraph("Debe <b>pasar su turno</b> obligatoriamente. No pierde la partida; simplemente cede el turno a la siguiente Casa.", table_cell_style)
        ],
        [
            Paragraph("<b>¿Puedo colocar una ficha para cerrar el cerco de 6 del Soberano?</b>", table_cell_style),
            Paragraph("<b>NO.</b> La excepción de la 6ª casilla prohíbe cerrar el cerco mediante colocación directa de la reserva. Debe hacerse con movimiento táctico de una ficha en el tablero.", table_cell_style)
        ]
    ]
    faq_table = Table(faq_data, colWidths=[160, 340])
    faq_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(faq_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph("7. Consejos de Maestría Estratégica", h1_style))

    tips_data = [[
        Paragraph(
            "⚔️ <b>1. EL DILEMA DEL SOBERANO TEMPRANO:</b> No retrases la entrada de tu Soberano más allá del 2º turno. Desplegarlo temprano te desbloquea la movilidad del resto de tus piezas antes que tu rival.<br/><br/>"
            "🛡️ <b>2. CREACIÓN DE BOLSILLOS DEFENSIVOS:</b> Coloca tus primeras fichas formando una concavidad ('bolsillo') donde proteger a tu Soberano, obligando a los Exploradores enemigos a dar rodeos interminables.<br/><br/>"
            "⚡ <b>3. PUENTES AÉREOS CON EL CAZADOR:</b> Los Cazadores pueden cruzar sobre las líneas enemigas sin importar cuántas piezas rivales formen el muro, siempre que sean de altura 1 y contiguas.<br/><br/>"
            "🪨 <b>4. CONVERSIÓN EN RUINAS:</b> Cuando cae una casa, sus fichas se vuelven ruinas permanentes. Aprovecha esa masa neutra como escalón para tus Gigantes o escudo protector para tu Soberano.",
            callout_style
        )
    ]]
    t_tips = Table(tips_data, colWidths=[500])
    t_tips.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#2563eb')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_tips)

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "<b>Savage Gods</b> © 2026 • Diseñado para estrategas audaces.<br/>"
        "Juega gratis en cualquier navegador: <b>https://web-rho-khaki-68.vercel.app/</b>",
        ParagraphStyle('FinalFoot', parent=body_style, alignment=1, fontSize=9, textColor=colors.HexColor('#64748b'))
    ))

    # Build document with custom canvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {OUTPUT_PDF_REPO}")

    # Copy to brain
    import shutil
    shutil.copy2(OUTPUT_PDF_REPO, OUTPUT_PDF_BRAIN)
    print(f"Copied to brain: {OUTPUT_PDF_BRAIN}")

if __name__ == "__main__":
    build_pdf()
