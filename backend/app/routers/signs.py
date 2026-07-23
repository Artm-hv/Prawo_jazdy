from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/signs", tags=["Traffic Signs Dictionary"])

@router.get("", response_model=List[schemas.TrafficSignResponse])
def list_traffic_signs(
    category: Optional[str] = Query(None, description="Category filter e.g., Ostrzegawcze, Zakazu"),
    code: Optional[str] = Query(None, description="Sign code e.g., A-1"),
    db: Session = Depends(get_db)
):
    return crud.get_traffic_signs(db, category=category, code=code)
