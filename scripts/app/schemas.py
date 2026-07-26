from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: str
    full_name: str
    category: str = "B"

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Progress Schemas
class LessonProgressUpdate(BaseModel):
    watched_seconds: int
    is_completed: bool

class LessonProgressResponse(BaseModel):
    lesson_id: int
    is_completed: bool
    watched_seconds: int

    class Config:
        from_attributes = True

# Lesson Schemas
class LessonResponse(BaseModel):
    id: int
    order_index: int
    title: str
    lesson_type: str
    duration_seconds: int
    video_url: Optional[str] = None
    instructor_notes: Optional[str] = None
    featured_sign_code: Optional[str] = None
    is_completed: bool = False
    watched_seconds: int = 0

    class Config:
        from_attributes = True

# Module Schemas
class ModuleResponse(BaseModel):
    id: int
    order_index: int
    title: str
    total_duration_seconds: int
    completed_duration_seconds: int = 0
    lessons: List[LessonResponse] = []

    class Config:
        from_attributes = True

# Course Schemas
class CourseResponse(BaseModel):
    id: int
    title: str
    category: str
    description: Optional[str] = None
    overall_progress_percentage: float = 0.0
    modules: List[ModuleResponse] = []

    class Config:
        from_attributes = True

# Traffic Sign Schemas
class TrafficSignResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str
    description: str
    image_url: Optional[str] = None
    svg_icon: Optional[str] = None

    class Config:
        from_attributes = True

# Test Question Schemas
class TestQuestionResponse(BaseModel):
    id: int
    category: str
    question_type: str
    question_text: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    answer_a: Optional[str] = None
    answer_b: Optional[str] = None
    answer_c: Optional[str] = None
    points: int
    sign_code: Optional[str] = None

    class Config:
        from_attributes = True

class TestAnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str  # TAK, NIE, A, B, or C

class TestAnswerResult(BaseModel):
    question_id: int
    is_correct: bool
    correct_answer: str
    points_awarded: int
    explanation: Optional[str] = None

class TestSubmissionRequest(BaseModel):
    answers: List[TestAnswerSubmit]
    test_type: str = "EXAM"  # EXAM or PRACTICE

class TestAttemptResponse(BaseModel):
    id: int
    score: int
    max_score: int
    passed: bool
    total_questions: int
    correct_count: int
    attempted_at: datetime

    class Config:
        from_attributes = True

# Stats Dashboard Summary Schema
class StatsSummary(BaseModel):
    overall_course_progress: float
    completed_lessons: int
    total_lessons: int
    total_study_time_formatted: str
    tests_taken: int
    tests_passed: int
    average_score: float
    last_exam_passed: Optional[bool] = None
