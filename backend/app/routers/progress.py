from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/progress", tags=["Progress & Analytics"])

@router.post("/lesson/{lesson_id}", response_model=schemas.LessonProgressResponse)
def update_progress(lesson_id: int, payload: schemas.LessonProgressUpdate, db: Session = Depends(get_db)):
    user = crud.get_or_create_default_user(db)
    record = crud.update_lesson_progress(
        db, 
        user_id=user.id, 
        lesson_id=lesson_id, 
        watched_seconds=payload.watched_seconds, 
        is_completed=payload.is_completed
    )
    return record

@router.get("/summary", response_model=schemas.StatsSummary)
def get_user_statistics(db: Session = Depends(get_db)):
    user = crud.get_or_create_default_user(db)
    return crud.get_user_stats(db, user_id=user.id)
