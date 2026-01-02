'''
laps.py 
Laps-related API endpoints
'''

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import sys
import os

# Add backend to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

from models.database import SessionLocal, Race, Lap, Driver

router = APIRouter(prefix="/laps", tags=["laps"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/fastest")
def get_fastest_laps(
    season: int = Query(2024, description="Season year"),
    limit: int = Query(10, description="Number of results"),
    db: Session = Depends(get_db)
):
    """
    Get fastest laps of the season
    
    Args:
        season: Season year
        limit: Number of results to return
    """
    # Get races in season
    races = db.query(Race).filter(Race.year == season).all()
    race_ids = [race.id for race in races]
    
    # Get fastest laps
    fastest = db.query(Lap, Driver, Race).join(Driver).join(Race).filter(
        Lap.race_id.in_(race_ids),
        Lap.lap_time_seconds.isnot(None)
    ).order_by(Lap.lap_time_seconds).limit(limit).all()
    
    return {
        "season": season,
        "fastest_laps": [
            {
                "lap_time": lap.lap_time_seconds,
                "driver_code": driver.driver_code,
                "driver_name": driver.driver_name,
                "race": race.race_name,
                "lap_number": lap.lap_number
            }
            for lap, driver, race in fastest
        ]
    }