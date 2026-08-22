import io
import logging
from datetime import date
from decimal import Decimal
from typing import Optional, Dict

logger = logging.getLogger(__name__)


def generate_payslip_pdf(
    employee_name: str,
    employee_code: str,
    month: str,  # e.g. "2024-03"
    basic: Decimal,
    hra: Decimal,
    allowances: Dict[str, float],
    deductions: Dict[str, float],
    net_salary: Decimal,
) -> bytes:
    """
    Generate a PDF payslip using ReportLab.
    Returns PDF bytes.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.colors import HexColor, white, black
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, HRFlowable
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm)

        INDIGO = HexColor("#4F46E5")
        LIGHT_GRAY = HexColor("#F8FAFC")
        DARK = HexColor("#0F172A")

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("Title", fontSize=20, textColor=white, alignment=TA_CENTER, fontName="Helvetica-Bold")
        sub_style = ParagraphStyle("Sub", fontSize=10, textColor=HexColor("#E0E7FF"), alignment=TA_CENTER)
        label_style = ParagraphStyle("Label", fontSize=9, textColor=HexColor("#64748B"))
        value_style = ParagraphStyle("Value", fontSize=10, textColor=DARK, fontName="Helvetica-Bold")

        elements = []

        # Header
        header_data = [[
            Paragraph("DAYFLOW HRMS", title_style),
        ]]
        header_table = Table(header_data, colWidths=[doc.width])
        header_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), INDIGO),
            ("TOPPADDING", (0, 0), (-1, -1), 20),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
            ("ROUNDEDCORNERS", [6, 6, 6, 6]),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.5*cm))
        elements.append(Paragraph(f"PAYSLIP — {month}", ParagraphStyle("Month", fontSize=14, textColor=DARK, alignment=TA_CENTER, fontName="Helvetica-Bold")))
        elements.append(Spacer(1, 0.5*cm))

        # Employee Info
        info_data = [
            ["Employee Name", employee_name, "Employee Code", employee_code],
            ["Pay Period", month, "", ""],
        ]
        info_table = Table(info_data, colWidths=[4*cm, 7*cm, 4*cm, 5*cm])
        info_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (0, -1), HexColor("#64748B")),
            ("TEXTCOLOR", (2, 0), (2, -1), HexColor("#64748B")),
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GRAY, white]),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.5*cm))
        elements.append(HRFlowable(width="100%", thickness=1, color=HexColor("#E2E8F0")))
        elements.append(Spacer(1, 0.3*cm))

        # Earnings vs Deductions
        earnings = [("Basic Salary", float(basic)), ("HRA", float(hra))] + list(allowances.items())
        deduction_list = list(deductions.items())
        total_earnings = float(basic) + float(hra) + sum(allowances.values())
        total_deductions = sum(deductions.values())

        max_rows = max(len(earnings), len(deduction_list)) + 1
        table_data = [["EARNINGS", "Amount (₹)", "DEDUCTIONS", "Amount (₹)"]]
        for i in range(max_rows - 1):
            e_label = earnings[i][0].replace("_", " ").title() if i < len(earnings) else ""
            e_val = f"{earnings[i][1]:,.2f}" if i < len(earnings) else ""
            d_label = deduction_list[i][0].replace("_", " ").title() if i < len(deduction_list) else ""
            d_val = f"{deduction_list[i][1]:,.2f}" if i < len(deduction_list) else ""
            table_data.append([e_label, e_val, d_label, d_val])

        table_data.append(["Total Earnings", f"{total_earnings:,.2f}", "Total Deductions", f"{total_deductions:,.2f}"])

        sal_table = Table(table_data, colWidths=[5*cm, 4*cm, 5*cm, 4*cm])
        sal_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (1, 0), HexColor("#EEF2FF")),
            ("BACKGROUND", (2, 0), (3, 0), HexColor("#FEF2F2")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -2), [white, LIGHT_GRAY]),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("ALIGN", (3, 0), (3, -1), "RIGHT"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E2E8F0")),
            ("BACKGROUND", (0, -1), (1, -1), HexColor("#EEF2FF")),
            ("BACKGROUND", (2, -1), (3, -1), HexColor("#FEF2F2")),
        ]))
        elements.append(sal_table)
        elements.append(Spacer(1, 0.5*cm))

        # Net Salary
        net_data = [["NET SALARY", f"₹ {float(net_salary):,.2f}"]]
        net_table = Table(net_data, colWidths=[14*cm, 5*cm])
        net_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), INDIGO),
            ("TEXTCOLOR", (0, 0), (-1, -1), white),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (0, 0), 12),
            ("FONTSIZE", (1, 0), (1, 0), 14),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))
        elements.append(net_table)

        elements.append(Spacer(1, 1*cm))
        elements.append(Paragraph(
            "This is a computer-generated payslip and does not require a signature.",
            ParagraphStyle("Footer", fontSize=8, textColor=HexColor("#94A3B8"), alignment=TA_CENTER)
        ))

        doc.build(elements)
        return buffer.getvalue()

    except ImportError:
        logger.error("ReportLab not installed. Cannot generate PDF.")
        return b""
