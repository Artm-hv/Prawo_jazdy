import os
import json
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app import models, crud

def run_ingestion():
    print("Initializing Database Schemas...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        user = crud.get_or_create_default_user(db)
        print(f"Default user ensured: {user.email} (ID: {user.id})")
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, "data")
        
        # 1. Ingest Traffic Signs (Clear existing and re-insert 413 signs)
        signs_file = os.path.join(data_dir, "traffic_signs.json")
        if os.path.exists(signs_file):
            with open(signs_file, "r", encoding="utf-8") as f:
                signs_data = json.load(f)
                
                # Clear existing signs
                db.query(models.TrafficSign).delete()
                db.commit()
                
                imported_count = 0
                for item in signs_data:
                    sign = models.TrafficSign(
                        code=item.get("code", ""),
                        name=item.get("name", ""),
                        category=item.get("category", "Inne"),
                        description=item.get("description", ""),
                        image_url=item.get("image_url"),
                        svg_icon=item.get("svg_icon")
                    )
                    db.add(sign)
                    imported_count += 1
                db.commit()
                print(f"[SUCCESS] Ingested {imported_count} Traffic Signs.")

        # 2. Ingest Course Modules & Lessons
        courses_file = os.path.join(data_dir, "course_modules.json")
        if os.path.exists(courses_file):
            with open(courses_file, "r", encoding="utf-8") as f:
                courses_data = json.load(f)
                for c_item in courses_data:
                    course = db.query(models.Course).filter(
                        models.Course.title == c_item["course_title"],
                        models.Course.category == c_item["category"]
                    ).first()
                    if not course:
                        course = models.Course(
                            title=c_item["course_title"],
                            category=c_item["category"],
                            description=c_item.get("description")
                        )
                        db.add(course)
                        db.commit()
                        db.refresh(course)
                    
                    for m_item in c_item.get("modules", []):
                        module = db.query(models.Module).filter(
                            models.Module.course_id == course.id,
                            models.Module.order_index == m_item["order_index"]
                        ).first()
                        if not module:
                            module = models.Module(
                                course_id=course.id,
                                order_index=m_item["order_index"],
                                title=m_item["title"],
                                total_duration_seconds=m_item.get("total_duration_seconds", 0)
                            )
                            db.add(module)
                            db.commit()
                            db.refresh(module)
                        
                        for l_item in m_item.get("lessons", []):
                            lesson = db.query(models.Lesson).filter(
                                models.Lesson.module_id == module.id,
                                models.Lesson.order_index == l_item["order_index"]
                            ).first()
                            if not lesson:
                                lesson = models.Lesson(
                                    module_id=module.id,
                                    order_index=l_item["order_index"],
                                    title=l_item["title"],
                                    lesson_type=l_item.get("lesson_type", "lecture"),
                                    duration_seconds=l_item.get("duration_seconds", 0),
                                    video_url=l_item.get("video_url"),
                                    instructor_notes=l_item.get("instructor_notes"),
                                    featured_sign_code=l_item.get("featured_sign_code")
                                )
                                db.add(lesson)
                                db.commit()
                                db.refresh(lesson)
                                
                                if l_item.get("is_completed") or l_item.get("watched_seconds", 0) > 0:
                                    crud.update_lesson_progress(
                                        db,
                                        user_id=user.id,
                                        lesson_id=lesson.id,
                                        watched_seconds=l_item.get("watched_seconds", 0),
                                        is_completed=l_item.get("is_completed", False)
                                    )
                print("[SUCCESS] Ingested Course Modules & Lessons.")

        # 3. Ingest Test Questions
        questions_file = os.path.join(data_dir, "test_questions.json")
        if os.path.exists(questions_file):
            with open(questions_file, "r", encoding="utf-8") as f:
                questions_data = json.load(f)
                imported_q = 0
                for q in questions_data:
                    existing = db.query(models.TestQuestion).filter(
                        models.TestQuestion.question_text == q["question_text"]
                    ).first()
                    if not existing:
                        question = models.TestQuestion(
                            category=q.get("category", "B"),
                            question_type=q.get("question_type", "BASIC"),
                            question_text=q["question_text"],
                            media_url=q.get("media_url"),
                            media_type=q.get("media_type", "none"),
                            answer_a=q.get("answer_a"),
                            answer_b=q.get("answer_b"),
                            answer_c=q.get("answer_c"),
                            correct_answer=q["correct_answer"],
                            points=q.get("points", 2),
                            explanation=q.get("explanation"),
                            sign_code=q.get("sign_code")
                        )
                        db.add(question)
                        imported_q += 1
                db.commit()
                print(f"[SUCCESS] Ingested {imported_q} Exam Test Questions.")
                
        print("Data Ingestion Pipeline completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Data Ingestion failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_ingestion()
