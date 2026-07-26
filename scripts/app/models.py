import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    category = Column(String(10), default="B")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    progress_records = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    test_attempts = relationship("TestAttempt", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(10), default="B", index=True)
    description = Column(Text, nullable=True)

    modules = relationship("Module", back_populates="course", order_by="Module.order_index", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=1)
    title = Column(String(255), nullable=False)
    total_duration_seconds = Column(Integer, default=0)

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.order_index", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=1)
    title = Column(String(255), nullable=False)
    lesson_type = Column(String(50), default="lecture")  # lecture, quiz
    duration_seconds = Column(Integer, default=0)
    video_url = Column(String(500), nullable=True)
    instructor_notes = Column(Text, nullable=True)
    featured_sign_code = Column(String(20), nullable=True)

    module = relationship("Module", back_populates="lessons")
    progress_records = relationship("UserProgress", back_populates="lesson", cascade="all, delete-orphan")


class TrafficSign(Base):
    __tablename__ = "traffic_signs"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    svg_icon = Column(Text, nullable=True)


class TestQuestion(Base):
    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(10), default="B", index=True)
    question_type = Column(String(20), default="BASIC")
    question_text = Column(Text, nullable=False)
    media_url = Column(String(500), nullable=True)
    media_type = Column(String(20), default="image")
    answer_a = Column(String(255), nullable=True)
    answer_b = Column(String(255), nullable=True)
    answer_c = Column(String(255), nullable=True)
    correct_answer = Column(String(10), nullable=False)
    points = Column(Integer, default=2)
    explanation = Column(Text, nullable=True)
    sign_code = Column(String(20), nullable=True)


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    is_completed = Column(Boolean, default=False)
    watched_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress_records")
    lesson = relationship("Lesson", back_populates="progress_records")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    test_type = Column(String(50), default="EXAM")
    score = Column(Integer, nullable=False)
    max_score = Column(Integer, default=74)
    passed = Column(Boolean, nullable=False)
    total_questions = Column(Integer, default=35)
    correct_count = Column(Integer, default=0)
    attempted_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="test_attempts")
