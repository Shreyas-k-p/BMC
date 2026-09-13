import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Theme Colors matching the PDF
    BG_BLUE_DARK = RGBColor(4, 8, 28)        # Deep navy/royal blue
    CARD_DARK_BLUE = RGBColor(14, 28, 76)    # Dark blue canvas card
    WHITE = RGBColor(255, 255, 255)
    OFF_WHITE = RGBColor(241, 245, 249)
    TEXT_MUTED = RGBColor(203, 213, 225)
    YELLOW_ACCENT = RGBColor(250, 204, 21)
    LIGHT_BLUE_BADGE = RGBColor(125, 211, 252)
    BADGE_TEXT = RGBColor(11, 23, 57)
    BORDER_WHITE = RGBColor(255, 255, 255)
    BORDER_GRAY = RGBColor(148, 163, 184)

    FONT_MAIN = "Arial"
    FONT_SERIF = "Georgia"

    assets_dir = os.path.join(os.path.dirname(__file__), "assets")

    def set_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_BLUE_DARK
        bg.line.fill.background()
        return bg

    def add_top_bar(slide, title_text, subtitle_text=None):
        box = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.733), Inches(1.2))
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = FONT_MAIN
        p.font.size = Pt(24)
        p.font.bold = True
        p.font.color.rgb = WHITE
        p.alignment = PP_ALIGN.CENTER
        
        if subtitle_text:
            p2 = tf.add_paragraph()
            p2.text = subtitle_text
            p2.font.name = FONT_MAIN
            p2.font.size = Pt(12)
            p2.font.color.rgb = LIGHT_BLUE_BADGE
            p2.alignment = PP_ALIGN.CENTER
            p2.space_before = Pt(4)

    # Grid Dimensions mathematically centered on 13.333" slide
    # Total width = 12.0 inches -> left margin = (13.333 - 12.0) / 2 = 0.666 inches
    TOTAL_W = Inches(12.0)
    X_START = Inches(0.666)
    Y_TOP = Inches(1.68)
    GAP = Inches(0.08)

    # 5 columns
    COL_W = (TOTAL_W - GAP * 4) / 5  # ~ 2.336 inches
    ROW_H = Inches(1.85)             # Top rows: 2 rows of 1.85" = 3.7"
    BOT_H = Inches(1.4)              # Bottom row = 1.4"
    Y_BOT = Y_TOP + ROW_H * 2 + GAP  # ~ 5.46 inches

    def draw_canvas_box(slide, left, top, width, height, title, badge_num=None, subtitle=None, body_items=None, is_white_bg=False):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        if is_white_bg:
            shape.fill.fore_color.rgb = WHITE
            shape.line.color.rgb = BORDER_GRAY
        else:
            shape.fill.fore_color.rgb = CARD_DARK_BLUE
            shape.line.color.rgb = BORDER_WHITE
        shape.line.width = Pt(1.5)

        tf = shape.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Inches(0.12)
        tf.margin_top = Inches(0.1)
        tf.margin_bottom = Inches(0.08)

        p = tf.paragraphs[0]
        p.text = title.upper()
        p.font.name = FONT_MAIN
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = RGBColor(15, 23, 42) if is_white_bg else WHITE
        p.alignment = PP_ALIGN.CENTER if badge_num else PP_ALIGN.LEFT

        if subtitle:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle
            p_sub.font.name = FONT_MAIN
            p_sub.font.size = Pt(9.2)
            p_sub.font.color.rgb = RGBColor(71, 85, 105) if is_white_bg else TEXT_MUTED
            p_sub.alignment = PP_ALIGN.LEFT
            p_sub.space_before = Pt(2)

        if body_items:
            for item in body_items:
                p_it = tf.add_paragraph()
                p_it.text = item
                p_it.font.name = FONT_MAIN
                p_it.font.size = Pt(9)
                p_it.font.bold = True
                p_it.font.color.rgb = RGBColor(15, 23, 42) if is_white_bg else OFF_WHITE
                p_it.space_before = Pt(2)

        if badge_num:
            b_size = Inches(0.52)
            bx = left + (width - b_size) / 2
            by = top + (height - b_size) / 2 + Inches(0.15)
            badge = slide.shapes.add_shape(MSO_SHAPE.OVAL, bx, by, b_size, b_size)
            badge.fill.solid()
            badge.fill.fore_color.rgb = LIGHT_BLUE_BADGE
            badge.line.fill.background()
            
            b_tf = badge.text_frame
            b_tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            bp = b_tf.paragraphs[0]
            bp.text = str(badge_num)
            bp.font.name = FONT_MAIN
            bp.font.size = Pt(16)
            bp.font.bold = True
            bp.font.color.rgb = BADGE_TEXT
            bp.alignment = PP_ALIGN.CENTER

        return shape

    # ==========================================
    # SLIDE 1: Title
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1)

    # Top Left: SNMIMT Engineering College
    hdr_box_l = s1.shapes.add_textbox(Inches(0.7), Inches(0.4), Inches(4.5), Inches(1.0))
    tf_hl = hdr_box_l.text_frame
    tf_hl.word_wrap = True
    p = tf_hl.paragraphs[0]
    p.text = "SNMIMT ENGINEERING COLLEGE"
    p.font.name = FONT_MAIN
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = WHITE

    p2 = tf_hl.add_paragraph()
    p2.text = "Maliankara p.o, Moothakunnam, Ernakulam Dt, Kerala - 683 516\nWebsite : www.snmimt.edu.in"
    p2.font.name = FONT_MAIN
    p2.font.size = Pt(8.5)
    p2.font.color.rgb = TEXT_MUTED
    p2.space_before = Pt(2)

    # Top Center: IEDC SNMIMT
    hdr_box_c = s1.shapes.add_textbox(Inches(5.0), Inches(0.4), Inches(4.0), Inches(1.0))
    tf_hc = hdr_box_c.text_frame
    tf_hc.word_wrap = True
    p = tf_hc.paragraphs[0]
    p.text = "IEDC SNMIMT"
    p.font.name = FONT_MAIN
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = LIGHT_BLUE_BADGE
    p.alignment = PP_ALIGN.CENTER

    p2 = tf_hc.add_paragraph()
    p2.text = "Kerala Startup Mission\nINNOVATION AND ENTREPRENEURSHIP DEVELOPMENT CENTRE"
    p2.font.name = FONT_MAIN
    p2.font.size = Pt(8.5)
    p2.font.color.rgb = TEXT_MUTED
    p2.alignment = PP_ALIGN.CENTER

    # Top Right: ed club
    hdr_box_r = s1.shapes.add_textbox(Inches(9.5), Inches(0.4), Inches(3.1), Inches(1.0))
    tf_hr = hdr_box_r.text_frame
    p = tf_hr.paragraphs[0]
    p.text = "ed\nclub"
    p.font.name = FONT_MAIN
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.RIGHT

    # Center Hero: BMC
    hero_box = s1.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(11.333), Inches(3.0))
    tf_hero = hero_box.text_frame
    tf_hero.word_wrap = True
    p_bmc = tf_hero.paragraphs[0]
    p_bmc.text = "BMC"
    p_bmc.font.name = FONT_SERIF
    p_bmc.font.size = Pt(110)
    p_bmc.font.bold = True
    p_bmc.font.color.rgb = RGBColor(225, 235, 248)
    p_bmc.alignment = PP_ALIGN.CENTER

    p_sub = tf_hero.add_paragraph()
    p_sub.text = "B U S I N E S S   M O D E L   C A N V A S"
    p_sub.font.name = FONT_MAIN
    p_sub.font.size = Pt(22)
    p_sub.font.bold = True
    p_sub.font.color.rgb = WHITE
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.space_before = Pt(4)

    # Footer Metadata
    ftr_l = s1.shapes.add_textbox(Inches(0.7), Inches(6.3), Inches(3.0), Inches(0.8))
    tf_fl = ftr_l.text_frame
    p = tf_fl.paragraphs[0]
    p.text = "16-09-2026\n2:00 PM - 4:00 PM"
    p.font.name = FONT_MAIN
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    ftr_c = s1.shapes.add_textbox(Inches(4.6), Inches(6.4), Inches(4.0), Inches(0.6))
    tf_fc = ftr_c.text_frame
    p = tf_fc.paragraphs[0]
    p.text = "IEDC SNMIMT"
    p.font.name = FONT_MAIN
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = LIGHT_BLUE_BADGE
    p.alignment = PP_ALIGN.CENTER

    ftr_r = s1.shapes.add_textbox(Inches(9.1), Inches(6.1), Inches(3.5), Inches(1.0))
    tf_fr = ftr_r.text_frame
    p = tf_fr.paragraphs[0]
    p.text = "HANDLED BY -"
    p.font.name = FONT_MAIN
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED
    p.alignment = PP_ALIGN.RIGHT

    p2 = tf_fr.add_paragraph()
    p2.text = "SHREYAS K P\nIPR & RESEARCH LEAD"
    p2.font.name = FONT_MAIN
    p2.font.size = Pt(11)
    p2.font.bold = True
    p2.font.color.rgb = WHITE
    p2.alignment = PP_ALIGN.RIGHT

    # ==========================================
    # SLIDE 2: Why do good products fail?
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2)

    t_box = s2.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.733), Inches(0.8))
    tf_t = t_box.text_frame
    p = tf_t.paragraphs[0]
    p.text = "WHY DO GOOD PRODUCTS FAIL?"
    p.font.name = FONT_MAIN
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = WHITE

    l_box = s2.shapes.add_textbox(Inches(0.8), Inches(1.7), Inches(4.8), Inches(3.8))
    tf_l = l_box.text_frame
    p = tf_l.paragraphs[0]
    p.text = "Some products have:"
    p.font.name = FONT_MAIN
    p.font.size = Pt(16)
    p.font.color.rgb = TEXT_MUTED
    p.space_after = Pt(12)

    features = [
        "✓ Great Technology",
        "✓ Innovative Features",
        "✓ Excellent Engineering",
        "✓ Strong Marketing"
    ]
    for feat in features:
        p = tf_l.add_paragraph()
        p.text = feat
        p.font.name = FONT_MAIN
        p.font.size = Pt(18)
        p.font.bold = True
        p.font.color.rgb = RGBColor(52, 211, 153)
        p.space_after = Pt(8)

    p_fail = tf_l.add_paragraph()
    p_fail.text = "BUT STILL FAIL."
    p_fail.font.name = FONT_MAIN
    p_fail.font.size = Pt(20)
    p_fail.font.bold = True
    p_fail.font.color.rgb = RGBColor(248, 113, 113)
    p_fail.space_before = Pt(16)

    # Product Images
    glass_img = os.path.join(assets_dir, "google_glass.jpg")
    if os.path.exists(glass_img):
        s2.shapes.add_picture(glass_img, Inches(6.8), Inches(1.3), width=Inches(4.2))

    phone_img = os.path.join(assets_dir, "windows_phone.jpg")
    if os.path.exists(phone_img):
        s2.shapes.add_picture(phone_img, Inches(5.8), Inches(3.4), width=Inches(2.5))

    quibi_img = os.path.join(assets_dir, "quibi.jpg")
    if os.path.exists(quibi_img):
        s2.shapes.add_picture(quibi_img, Inches(9.0), Inches(3.4), width=Inches(2.5))

    bot_box = s2.shapes.add_textbox(Inches(0.8), Inches(6.4), Inches(11.733), Inches(0.6))
    tf_b = bot_box.text_frame
    p = tf_b.paragraphs[0]
    p.text = "💡 A GREAT PRODUCT DOESN'T GUARANTEE A GREAT BUSINESS."
    p.font.name = FONT_MAIN
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = YELLOW_ACCENT
    p.alignment = PP_ALIGN.CENTER

    # ==========================================
    # SLIDE 3: Numbered 9 Building Blocks Canvas
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3)

    add_top_bar(
        s3, 
        "BUSINESS MODEL CANVAS",
        "It breaks a business idea into 9 building blocks (like puzzle pieces) so that anyone can easily understand the whole business in a simple way."
    )

    # Col 0: Key Partners (badge 8)
    draw_canvas_box(s3, X_START, Y_TOP, COL_W, ROW_H * 2 + GAP, "KEY PARTNERS", badge_num=8)

    # Col 1: Key Activities (7) & Key Resources (6)
    draw_canvas_box(s3, X_START + (COL_W + GAP), Y_TOP, COL_W, ROW_H, "KEY ACTIVITIES", badge_num=7)
    draw_canvas_box(s3, X_START + (COL_W + GAP), Y_TOP + ROW_H + GAP, COL_W, ROW_H, "KEY RESOURCES", badge_num=6)

    # Col 2: Value Proposition (2)
    draw_canvas_box(s3, X_START + (COL_W + GAP) * 2, Y_TOP, COL_W, ROW_H * 2 + GAP, "VALUE PROPOSITION", badge_num=2)

    # Col 3: Customer Relationships (4) & Channels (3)
    draw_canvas_box(s3, X_START + (COL_W + GAP) * 3, Y_TOP, COL_W, ROW_H, "CUSTOMER RELATIONSHIPS", badge_num=4)
    draw_canvas_box(s3, X_START + (COL_W + GAP) * 3, Y_TOP + ROW_H + GAP, COL_W, ROW_H, "CHANNELS", badge_num=3)

    # Col 4: Customer Segments (1)
    draw_canvas_box(s3, X_START + (COL_W + GAP) * 4, Y_TOP, COL_W, ROW_H * 2 + GAP, "CUSTOMER SEGMENTS", badge_num=1)

    # Bottom Row: Cost Structure (9) & Revenue Streams (5)
    HALF_BOT_W = (TOTAL_W - GAP) / 2
    draw_canvas_box(s3, X_START, Y_BOT, HALF_BOT_W, BOT_H, "COST STRUCTURE", badge_num=9)
    draw_canvas_box(s3, X_START + HALF_BOT_W + GAP, Y_BOT, HALF_BOT_W, BOT_H, "REVENUE STREAMS", badge_num=5)

    # ==========================================
    # SLIDE 4: Transition (BMC vs Lean Canvas)
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4)

    t_box = s4.shapes.add_textbox(Inches(1.0), Inches(2.6), Inches(11.333), Inches(2.2))
    tf_t = t_box.text_frame
    tf_t.word_wrap = True
    p = tf_t.paragraphs[0]
    p.text = "SO HOW IS BMC DIFFERENT\nFROM LEAN CANVA?"
    p.font.name = FONT_MAIN
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER

    sub_p = tf_t.add_paragraph()
    sub_p.text = "🤔 Thinking about when to use which framework..."
    sub_p.font.name = FONT_MAIN
    sub_p.font.size = Pt(16)
    sub_p.font.color.rgb = LIGHT_BLUE_BADGE
    sub_p.alignment = PP_ALIGN.CENTER
    sub_p.space_before = Pt(16)

    # ==========================================
    # SLIDE 5: Lean Canvas Grid
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5)
    add_top_bar(s5, "LEAN CANVAS")

    draw_canvas_box(s5, X_START, Y_TOP, COL_W, ROW_H, "PROBLEM", subtitle="List your top 1-3 problems.", is_white_bg=True)
    draw_canvas_box(s5, X_START, Y_TOP + ROW_H + GAP, COL_W, ROW_H, "EXISTING ALTERNATIVES", subtitle="List how these problems are solved today.", is_white_bg=True)

    draw_canvas_box(s5, X_START + (COL_W + GAP), Y_TOP, COL_W, ROW_H, "SOLUTION", subtitle="Outline a possible solution for each problem.", is_white_bg=True)
    draw_canvas_box(s5, X_START + (COL_W + GAP), Y_TOP + ROW_H + GAP, COL_W, ROW_H, "KEY METRICS", subtitle="List key numbers that tell you how business is doing.", is_white_bg=True)

    draw_canvas_box(s5, X_START + (COL_W + GAP) * 2, Y_TOP, COL_W, ROW_H, "UNIQUE VALUE PROPOSITION", subtitle="Single, clear, compelling message that states why you are different.", is_white_bg=True)
    draw_canvas_box(s5, X_START + (COL_W + GAP) * 2, Y_TOP + ROW_H + GAP, COL_W, ROW_H, "HIGH-LEVEL CONCEPT", subtitle="List your X for Y analogy e.g. YouTube = Flickr for videos.", is_white_bg=True)

    draw_canvas_box(s5, X_START + (COL_W + GAP) * 3, Y_TOP, COL_W, ROW_H, "UNFAIR ADVANTAGE", subtitle="Something that cannot easily be bought or copied.", is_white_bg=True)
    draw_canvas_box(s5, X_START + (COL_W + GAP) * 3, Y_TOP + ROW_H + GAP, COL_W, ROW_H, "CHANNELS", subtitle="List your path to customers (inbound or outbound).", is_white_bg=True)

    draw_canvas_box(s5, X_START + (COL_W + GAP) * 4, Y_TOP, COL_W, ROW_H, "CUSTOMER SEGMENTS", subtitle="List your target customers and users.", is_white_bg=True)
    draw_canvas_box(s5, X_START + (COL_W + GAP) * 4, Y_TOP + ROW_H + GAP, COL_W, ROW_H, "EARLY ADOPTERS", subtitle="List characteristics of your ideal customers.", is_white_bg=True)

    draw_canvas_box(s5, X_START, Y_BOT, HALF_BOT_W, BOT_H, "COST STRUCTURE", subtitle="List your fixed and variable costs.", is_white_bg=True)
    draw_canvas_box(s5, X_START + HALF_BOT_W + GAP, Y_BOT, HALF_BOT_W, BOT_H, "REVENUE STREAMS", subtitle="List your sources of revenue.", is_white_bg=True)

    # ==========================================
    # SLIDE 8: BMC vs Lean Canvas
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6)

    # Top Card: BMC (Soft Lavender)
    c_bmc = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(0.9), Inches(10.933), Inches(2.6))
    c_bmc.fill.solid()
    c_bmc.fill.fore_color.rgb = RGBColor(230, 224, 242)
    c_bmc.line.fill.background()
    tf_bmc = c_bmc.text_frame
    tf_bmc.margin_left = tf_bmc.margin_top = Inches(0.4)
    p = tf_bmc.paragraphs[0]
    p.text = "BMC IS USED TO:"
    p.font.name = FONT_MAIN
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = RGBColor(30, 27, 75)
    p.space_after = Pt(10)

    for item in [
        "◦ UNDERSTAND HOW A BUSINESS WORKS.",
        "◦ SHOW INVESTORS OR TEAM MEMBERS YOUR BUSINESS MODEL.",
        "◦ ANALYZE SUCCESSFUL COMPANIES."
    ]:
        p = tf_bmc.add_paragraph()
        p.text = item
        p.font.name = FONT_MAIN
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = RGBColor(30, 27, 75)
        p.space_after = Pt(6)

    # Bottom Card: Lean Canvas (Cyan)
    c_lean = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(3.9), Inches(10.933), Inches(2.6))
    c_lean.fill.solid()
    c_lean.fill.fore_color.rgb = RGBColor(70, 213, 240)
    c_lean.line.fill.background()
    tf_lean = c_lean.text_frame
    tf_lean.margin_left = tf_lean.margin_top = Inches(0.4)
    p = tf_lean.paragraphs[0]
    p.text = "LEAN CANVAS IS USED TO:"
    p.font.name = FONT_MAIN
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = RGBColor(3, 43, 56)
    p.space_after = Pt(10)

    for item in [
        "◦ QUICKLY TEST IF YOUR STARTUP IDEA MAKES SENSE.",
        "◦ FOCUS ON CUSTOMER PROBLEMS FIRST.",
        "◦ AVOID WASTING TIME BUILDING SOMETHING NOBODY WANTS."
    ]:
        p = tf_lean.add_paragraph()
        p.text = item
        p.font.name = FONT_MAIN
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = RGBColor(3, 43, 56)
        p.space_after = Pt(6)

    # ==========================================
    # SLIDE 7: Group Activity
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7)

    act_box = s7.shapes.add_textbox(Inches(1.5), Inches(2.6), Inches(10.333), Inches(2.2))
    tf_act = act_box.text_frame
    p = tf_act.paragraphs[0]
    p.text = "Group Activity"
    p.font.name = FONT_SERIF
    p.font.size = Pt(66)
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER

    output_path = os.path.join(os.path.dirname(__file__), "business_model_canvas_workshop.pptx")
    prs.save(output_path)
    print(f"Presentation successfully created at: {output_path}")

if __name__ == "__main__":
    create_presentation()
