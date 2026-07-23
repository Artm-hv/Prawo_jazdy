from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import crud, schemas, models

router = APIRouter(prefix="/tests", tags=["Exam & Interactive Tests"])

@router.get("/questions", response_model=List[schemas.TestQuestionResponse])
def get_exam_questions(category: str = "B", limit: int = 35, db: Session = Depends(get_db)):
    questions = crud.get_test_questions(db, category=category, limit=limit)
    return questions

@router.post("/submit")
def submit_exam_attempt(payload: schemas.TestSubmissionRequest, db: Session = Depends(get_db)):
    user = crud.get_or_create_default_user(db)
    attempt, results = crud.evaluate_test_submission(db, user_id=user.id, payload=payload)
    
    return {
        "attempt_id": attempt.id,
        "score": attempt.score,
        "max_score": attempt.max_score,
        "passed": attempt.passed,
        "total_questions": attempt.total_questions,
        "correct_count": attempt.correct_count,
        "question_results": results
    }

@router.get("/attempts", response_model=List[schemas.TestAttemptResponse])
def get_user_test_history(db: Session = Depends(get_db)):
    user = crud.get_or_create_default_user(db)
    return db.query(models.TestAttempt).filter(models.TestAttempt.user_id == user.id).order_by(models.TestAttempt.attempted_at.desc()).all()
