import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "prawo_jazdy.db")

class Settings:
    PROJECT_NAME: str = "Prawo Jazdy 360 LMS"
    API_V1_STR: str = "/api/v1"
    
    # Absolute path database configuration (SQLite default fallback)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{DB_PATH}"
    )
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_lms_key_prawo_jazdy_360_2026")

settings = Settings()
