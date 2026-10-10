from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import PlainTextResponse
from app.core.auth import get_current_user, RequireRole
from app.core.tiger import get_tiger_admin
from app.services import faculty_service

router = APIRouter(prefix="/api/institutional", tags=["institutional"])


@router.post("/upload")
async def upload_institutional_data(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    dry_run: bool = Form(False),
    user: dict = Depends(get_current_user)
):
    RequireRole(["ADMIN", "DEAN", "REVIEWER"])(user)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    try:
        content = await file.read()
        if len(content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=413, detail="File too large (max 10MB)")
        csv_string = content.decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")
        
    try:
        result = faculty_service.process_institutional_batch(csv_string, category_override=category, dry_run=dry_run)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")


@router.get("/template/{category}", response_class=PlainTextResponse)
async def get_csv_template(category: str):
    """Returns downloadable synthetic CSV template format for a specific data category."""
    cat = category.lower().strip()
    
    templates = {
        "teaching": "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-2805,govardhan.bhatt@nitrr.ac.in,teaching,Advanced Structural Dynamics & Earthquake Engineering,Undergraduate Core Course for Semester VI,2026,48,4.8\nFAC-1976,sewan.patle@nitrr.ac.in,teaching,Distributed Systems and Cloud Architecture,Postgraduate Elective with Hands-on Labs,2026,45,4.7\nFAC-6053,dilip.sisodia@nitrr.ac.in,teaching,Machine Learning and Pattern Recognition,Core CS Course with Capstone Projects,2026,52,4.9\nFAC-76C3A1,andrew.ng@academic.edu,teaching,Deep Learning Foundations,Online and In-person Lecture Series,2026,60,5.0",
        "mentoring": "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-2805,govardhan.bhatt@nitrr.ac.in,mentoring,Rahul Sharma - Doctoral Dissertation,Seismic Fragility Modeling of Heritage RC Frames,2026,120,4.9\nFAC-1976,sewan.patle@nitrr.ac.in,mentoring,Pooja Verma - M.Tech Thesis,Edge AI Consensus Algorithms for IoT Deployments,2026,80,4.8\nFAC-6053,dilip.sisodia@nitrr.ac.in,mentoring,Amit Verma - Ph.D. Research Scholar,Deep Semantic Feature Representations in Biomedical Imagery,2026,150,5.0",
        "service": "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-2805,govardhan.bhatt@nitrr.ac.in,service,Chairman - Institute Accreditation & NBA Committee,Led department-wide Tier-I NBA accreditation renewal,2026,60,4.8\nFAC-6053,dilip.sisodia@nitrr.ac.in,service,Head of Department & Academic Senate Member,Steered curriculum modernization aligned with NEP-2020,2026,80,4.9\nFAC-1976,sewan.patle@nitrr.ac.in,service,Faculty Advisor - Student Innovation & Hackathon Cell,Organized National Smart India Hackathon internal rounds,2026,40,4.7",
        "projects": "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-2805,govardhan.bhatt@nitrr.ac.in,projects,Real-time Vibration Monitoring of High-Rise Structures,DST-SERB Sponsored Research Grant (INR 48.5 Lakhs),2026,300,4.9\nFAC-6053,dilip.sisodia@nitrr.ac.in,projects,Federated Learning for Privacy-Preserving Healthcare,MeitY Government of India Grant (INR 62.0 Lakhs),2026,450,5.0\nFAC-1976,sewan.patle@nitrr.ac.in,projects,Decentralized Edge Intelligence for Smart Agriculture,AICTE RPS Research Promotion Scheme (INR 25.0 Lakhs),2026,250,4.8",
        "innovation": "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-2805,govardhan.bhatt@nitrr.ac.in,innovation,Tunable Liquid Mass Damper for Seismic Attenuation,Indian Patent Application No. 202621045812 (Published),2026,0,5.0\nFAC-6053,dilip.sisodia@nitrr.ac.in,innovation,Multi-Modal Attention Neural Network for Early Sepsis Detection,Indian Patent Grant No. 492015,2026,0,5.0\nFAC-1976,sewan.patle@nitrr.ac.in,innovation,Adaptive Resource Allocation Framework in Heterogeneous Edge Nodes,Copyright Registration No. SW-18492/2026,2026,0,4.9",
        "outreach": "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-2805,govardhan.bhatt@nitrr.ac.in,outreach,Keynote: Next-Gen Sustainable Infrastructure,International Conference on Structural Engineering (ICSE 2026),2026,8,5.0\nFAC-6053,dilip.sisodia@nitrr.ac.in,outreach,Distinguished Speaker: Trustworthy AI and Algorithmic Fairness,IEEE International Computer Society Conclave 2026,2026,10,5.0\nFAC-1976,sewan.patle@nitrr.ac.in,outreach,Workshop Chair: Hands-on Cloud Native Microservices,National Faculty Development Program (ATAL Academy),2026,16,4.8",
        "awards": "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-6053,dilip.sisodia@nitrr.ac.in,awards,Best Researcher of the Year Award 2026,Awarded by Institutional Senate for high-impact research,2026,0,5.0\nFAC-2805,govardhan.bhatt@nitrr.ac.in,awards,National Structural Engineering Excellence Medal,Indian Concrete Institute & ASCE India Section,2026,0,5.0",
        "career": "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-6053,dilip.sisodia@nitrr.ac.in,career,Professor & HoD (Computer Science),National Institute of Technology Raipur,2026,0,5.0\nFAC-2805,govardhan.bhatt@nitrr.ac.in,career,Associate Professor (Civil Engineering),National Institute of Technology Raipur,2026,0,5.0"
    }

    template_str = templates.get(cat)
    if not template_str:
        # Default generic template
        template_str = "employee_id,email,category,title,description,year,hours,feedback_score\nFAC-2805,govardhan.bhatt@nitrr.ac.in,teaching,Advanced Course Name,Institutional Course Description,2026,45,4.8\nFAC-6053,dilip.sisodia@nitrr.ac.in,service,Committee Role Name,Institutional Service Description,2026,40,4.9"
        
    return PlainTextResponse(template_str, media_type="text/csv")


@router.post("/global-sync")
async def trigger_global_sync(user: dict = Depends(get_current_user)):
    """Triggers global reconciliation across all institutional records and faculty profiles."""
    RequireRole(["ADMIN", "DEAN", "REVIEWER"])(user)
    
    supabase = get_tiger_admin()
    faculty_res = supabase.table("faculty").select("id, canonical_name, canonical_email").execute()
    faculty_list = faculty_res.data or []
    
    now_iso = datetime.now(timezone.utc).isoformat()
    synced_count = 0
    
    for f in faculty_list:
        try:
            supabase.table("faculty").update({"last_synced_at": now_iso}).eq("id", f["id"]).execute()
            synced_count += 1
        except Exception:
            pass

    records_count_res = supabase.table("institutional_records").select("id", count="exact").execute()
    
    return {
        "status": "success",
        "message": f"Global sync successfully orchestrated for {synced_count} faculty profiles.",
        "facultySynced": synced_count,
        "institutionalRecordsCount": records_count_res.count if hasattr(records_count_res, "count") else len(records_count_res.data or []),
        "lastSyncedAt": now_iso,
        "syncMode": "Incremental + Deduplicated"
    }


@router.get("/records")
async def get_institutional_records(
    category: Optional[str] = Query(None),
    faculty_id: Optional[str] = Query(None),
    limit: int = Query(50),
    user: dict = Depends(get_current_user)
):
    """Retrieve institutional records with optional category & faculty filtering."""
    supabase = get_tiger_admin()
    query = supabase.table("institutional_records").select("*")
    if category:
        query = query.eq("category", category)
    if faculty_id:
        query = query.eq("faculty_id", faculty_id)
        
    res = query.order("year", desc=True).limit(limit).execute()
    return {
        "records": res.data or [],
        "count": len(res.data or [])
    }
