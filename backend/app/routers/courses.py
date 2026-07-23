from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import crud, schemas, models

router = APIRouter(prefix="/courses", tags=["Courses & Lectures"])

@router.get("", response_model=List[schemas.CourseResponse])
def read_courses(category: str = "B", db: Session = Depends(get_db)):
    user = crud.get_or_create_default_user(db)
    return crud.get_courses_with_progress(db, user_id=user.id, category=category)

@router.get("/lesson/{lesson_id}", response_model=schemas.LessonResponse)
def read_lesson(lesson_id: int, db: Session = Depends(get_db)):
    user = crud.get_or_create_default_user(db)
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user.id,
        models.UserProgress.lesson_id == lesson_id
    ).first()
    
    return {
        "id": lesson.id,
        "order_index": lesson.order_index,
        "title": lesson.title,
        "lesson_type": lesson.lesson_type,
        "duration_seconds": lesson.duration_seconds,
        "video_url": lesson.video_url,
        "instructor_notes": lesson.instructor_notes,
        "featured_sign_code": lesson.featured_sign_code,
        "is_completed": progress.is_completed if progress else False,
        "watched_seconds": progress.watched_seconds if progress else 0
    }
