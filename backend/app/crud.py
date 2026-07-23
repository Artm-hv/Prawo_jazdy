from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app import models, schemas

def get_or_create_default_user(db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.email == "demo@prawojazdy360.pl").first()
    if not user:
        user = models.User(
            email="demo@prawojazdy360.pl",
            full_name="Kierowca Testowy",
            category="B"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def get_courses_with_progress(db: Session, user_id: int, category: str = "B"):
    courses = db.query(models.Course).filter(models.Course.category == category).all()
    result = []
    
    for course in courses:
        total_course_lessons = 0
        completed_course_lessons = 0
        modules_list = []
        
        for module in course.modules:
            completed_module_time = 0
            lessons_list = []
            
            for lesson in module.lessons:
                total_course_lessons += 1
                progress = db.query(models.UserProgress).filter(
                    models.UserProgress.user_id == user_id,
                    models.UserProgress.lesson_id == lesson.id
                ).first()
                
                is_comp = progress.is_completed if progress else False
                watched_sec = progress.watched_seconds if progress else 0
                if is_comp:
                    completed_course_lessons += 1
                    completed_module_time += lesson.duration_seconds
                else:
                    completed_module_time += min(watched_sec, lesson.duration_seconds)
                
                lesson_dict = {
                    "id": lesson.id,
                    "order_index": lesson.order_index,
                    "title": lesson.title,
                    "lesson_type": lesson.lesson_type,
                    "duration_seconds": lesson.duration_seconds,
                    "video_url": lesson.video_url,
                    "instructor_notes": lesson.instructor_notes,
                    "featured_sign_code": lesson.featured_sign_code,
                    "is_completed": is_comp,
                    "watched_seconds": watched_sec
                }
                lessons_list.append(lesson_dict)
                
            modules_list.append({
                "id": module.id,
                "order_index": module.order_index,
                "title": module.title,
                "total_duration_seconds": module.total_duration_seconds,
                "completed_duration_seconds": completed_module_time,
                "lessons": lessons_list
            })
            
        progress_pct = (completed_course_lessons / total_course_lessons * 100.0) if total_course_lessons > 0 else 0.0
        
        result.append({
            "id": course.id,
            "title": course.title,
            "category": course.category,
            "description": course.description,
            "overall_progress_percentage": round(progress_pct, 2),
            "modules": modules_list
        })
        
    return result

def update_lesson_progress(db: Session, user_id: int, lesson_id: int, watched_seconds: int, is_completed: bool):
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.lesson_id == lesson_id
    ).first()
    
    if not progress:
        progress = models.UserProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            watched_seconds=watched_seconds,
            is_completed=is_completed,
            completed_at=datetime.utcnow() if is_completed else None
        )
        db.add(progress)
    else:
        progress.watched_seconds = max(progress.watched_seconds, watched_seconds)
        if is_completed and not progress.is_completed:
            progress.is_completed = True
            progress.completed_at = datetime.utcnow()
            
    db.commit()
    db.refresh(progress)
    return progress

def get_traffic_signs(db: Session, category: str = None, code: str = None):
    query = db.query(models.TrafficSign)
    if category:
        query = query.filter(models.TrafficSign.category.ilike(f"%{category}%"))
    if code:
        query = query.filter(models.TrafficSign.code == code)
    return query.all()

def get_test_questions(db: Session, category: str = "B", limit: int = 35):
    # Retrieve exam questions (20 basic + 15 specialist)
    basic_q = db.query(models.TestQuestion).filter(
        models.TestQuestion.category == category,
        models.TestQuestion.question_type == "BASIC"
    ).limit(20).all()
    
    specialist_q = db.query(models.TestQuestion).filter(
        models.TestQuestion.category == category,
        models.TestQuestion.question_type == "SPECIALIST"
    ).limit(15).all()
    
    return basic_q + specialist_q

def evaluate_test_submission(db: Session, user_id: int, payload: schemas.TestSubmissionRequest):
    total_score = 0
    max_possible_score = 0
    correct_count = 0
    results = []
    
    for item in payload.answers:
        question = db.query(models.TestQuestion).filter(models.TestQuestion.id == item.question_id).first()
        if not question:
            continue
            
        max_possible_score += question.points
        is_correct = (item.selected_answer.strip().upper() == question.correct_answer.strip().upper())
        
        pts_awarded = question.points if is_correct else 0
        if is_correct:
            correct_count += 1
            total_score += pts_awarded
            
        results.append({
            "question_id": question.id,
            "is_correct": is_correct,
            "correct_answer": question.correct_answer,
            "points_awarded": pts_awarded,
            "explanation": question.explanation
        })
        
    # Passing threshold is 68 / 74 points
    passed = total_score >= 68 if max_possible_score >= 68 else total_score == max_possible_score
    
    attempt = models.TestAttempt(
        user_id=user_id,
        test_type=payload.test_type,
        score=total_score,
        max_score=max_possible_score if max_possible_score > 0 else 74,
        passed=passed,
        total_questions=len(payload.answers),
        correct_count=correct_count,
        attempted_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return attempt, results

def get_user_stats(db: Session, user_id: int):
    # Total lessons & completed count
    total_lessons = db.query(models.Lesson).count()
    completed_records = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.is_completed == True
    ).all()
    completed_lessons = len(completed_records)
    
    overall_progress = round((completed_lessons / total_lessons * 100.0), 2) if total_lessons > 0 else 0.0
    
    # Study time calculation
    total_watched_sec = db.query(func.sum(models.UserProgress.watched_seconds)).filter(
        models.UserProgress.user_id == user_id
    ).scalar() or 0
    
    hours = total_watched_sec // 3600
    minutes = (total_watched_sec % 3600) // 60
    seconds = total_watched_sec % 60
    study_time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    # Test attempts analysis
    attempts = db.query(models.TestAttempt).filter(models.TestAttempt.user_id == user_id).all()
    tests_taken = len(attempts)
    tests_passed = len([a for a in attempts if a.passed])
    avg_score = round(sum([a.score for a in attempts]) / tests_taken, 1) if tests_taken > 0 else 0.0
    last_exam = attempts[-1].passed if attempts else None
    
    return {
        "overall_course_progress": overall_progress,
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
        "total_study_time_formatted": study_time_str,
        "tests_taken": tests_taken,
        "tests_passed": tests_passed,
        "average_score": avg_score,
        "last_exam_passed": last_exam
    }
