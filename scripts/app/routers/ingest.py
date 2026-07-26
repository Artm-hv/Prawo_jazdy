from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
import json

router = APIRouter(prefix="/admin", tags=["Data Ingestion & Admin"])

@router.post("/ingest/json")
def ingest_json_data(file: UploadFile = File(...), data_type: str = "signs", db: Session = Depends(get_db)):
    try:
        content = json.loads(file.file.read().decode("utf-8"))
        count = 0
        
        if data_type == "signs":
            for item in content:
                existing = db.query(models.TrafficSign).filter(models.TrafficSign.code == item.get("code")).first()
                if not existing:
                    sign = models.TrafficSign(
                        code=item.get("code"),
                        name=item.get("name"),
                        category=item.get("category", "Inne"),
                        description=item.get("description", ""),
                        image_url=item.get("image_url"),
                        svg_icon=item.get("svg_icon")
                    )
                    db.add(sign)
                    count += 1
                    
        elif data_type == "questions":
            for item in content:
                question = models.TestQuestion(
                    category=item.get("category", "B"),
                    question_type=item.get("question_type", "BASIC"),
                    question_text=item.get("question_text"),
                    media_url=item.get("media_url"),
                    media_type=item.get("media_type", "image"),
                    answer_a=item.get("answer_a"),
                    answer_b=item.get("answer_b"),
                    answer_c=item.get("answer_c"),
                    correct_answer=item.get("correct_answer"),
                    points=item.get("points", 2),
                    explanation=item.get("explanation"),
                    sign_code=item.get("sign_code")
                )
                db.add(question)
                count += 1

        db.commit()
        return {"status": "success", "imported_records": count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to ingest data: {str(e)}")
