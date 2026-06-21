import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Incident, RiskZone, SOSRequest
from backend.auth import get_current_user
from fpdf import FPDF
from datetime import datetime

router = APIRouter(prefix="/pdf", tags=["PDF Generation"])

class APSASPDFReport(FPDF):
    def header(self):
        # Title banner
        self.set_fill_color(11, 16, 32)
        self.rect(0, 0, 210, 35, "F")
        self.set_text_color(255, 255, 255)
        self.set_font("helvetica", "B", 18)
        self.cell(0, 5, "APSAS 2.0 - PUBLIC SAFETY AGENCY REPORT", ln=True, align="C")
        self.set_font("helvetica", "", 10)
        self.set_text_color(154, 165, 200)
        self.cell(0, 10, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | status: ACTIVE", ln=True, align="C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}} - APSAS Command Systems Confidential", align="C")

@router.get("/incidents")
def download_incidents_pdf(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    
    pdf = APSASPDFReport()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(33, 33, 33)
    pdf.cell(0, 10, "City-wide Active Incidents Report", ln=True)
    pdf.ln(5)
    
    # Table headers
    pdf.set_font("helvetica", "B", 10)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(15, 8, "ID", 1, fill=True)
    pdf.cell(40, 8, "Type", 1, fill=True)
    pdf.cell(35, 8, "Severity", 1, fill=True)
    pdf.cell(35, 8, "Status", 1, fill=True)
    pdf.cell(65, 8, "Reported Time (UTC)", 1, fill=True, ln=True)
    
    pdf.set_font("helvetica", "", 9)
    for idx, inc in enumerate(incidents):
        pdf.cell(15, 8, str(inc.id), 1)
        pdf.cell(40, 8, inc.type, 1)
        pdf.cell(35, 8, inc.severity.capitalize(), 1)
        pdf.cell(35, 8, inc.status.upper(), 1)
        pdf.cell(65, 8, inc.created_at.strftime("%Y-%m-%d %H:%M"), 1, ln=True)
        
    pdf_buffer = io.BytesIO()
    pdf_output = pdf.output(dest='S')
    pdf_buffer.write(pdf_output)
    pdf_buffer.seek(0)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=apsas_incidents_report.pdf"}
    )

@router.get("/analytics")
def download_analytics_pdf(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    total_incidents = db.query(Incident).count()
    active_incidents = db.query(Incident).filter(Incident.status != "resolved").count()
    resolved_incidents = db.query(Incident).filter(Incident.status == "resolved").count()
    total_sos = db.query(SOSRequest).count()
    total_zones = db.query(RiskZone).count()
    
    pdf = APSASPDFReport()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(33, 33, 33)
    pdf.cell(0, 10, "Operational Metrics Summary", ln=True)
    pdf.ln(5)
    
    pdf.set_font("helvetica", "", 11)
    pdf.cell(100, 10, f"Total Safety Incidents Logged: {total_incidents}")
    pdf.cell(100, 10, f"Active SOS Distress Alerts: {total_sos}", ln=True)
    pdf.cell(100, 10, f"Resolved Incident Cases: {resolved_incidents}")
    pdf.cell(100, 10, f"Monitored Risk Sectors: {total_zones}", ln=True)
    pdf.cell(100, 10, f"Active Threat Investigations: {active_incidents}", ln=True)
    pdf.ln(10)
    
    # Risk Zone Summary Section
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(0, 10, "Risk Score Breakdown by Zone", ln=True)
    pdf.ln(3)
    
    pdf.set_font("helvetica", "B", 10)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(60, 8, "Zone Name", 1, fill=True)
    pdf.cell(40, 8, "Risk Score (0-100)", 1, fill=True)
    pdf.cell(40, 8, "Risk Level Rating", 1, fill=True)
    pdf.cell(50, 8, "Active Incidents Count", 1, fill=True, ln=True)
    
    zones = db.query(RiskZone).all()
    pdf.set_font("helvetica", "", 9)
    for z in zones:
        pdf.cell(60, 8, z.name, 1)
        pdf.cell(40, 8, f"{z.risk_score}%", 1)
        pdf.cell(40, 8, z.risk_level.capitalize(), 1)
        pdf.cell(50, 8, str(z.active_incidents_count), 1, ln=True)
        
    pdf_buffer = io.BytesIO()
    pdf_output = pdf.output(dest='S')
    pdf_buffer.write(pdf_output)
    pdf_buffer.seek(0)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=apsas_analytics_report.pdf"}
    )
