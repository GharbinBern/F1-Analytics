"""
races.py
Race-related API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import sys
import os

# Add backend to path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, backend_dir)

from models.database import SessionLocal, Race, Result, Lap, Driver

router = APIRouter(prefix="/races", tags=["races"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_all_races(
    season: int = Query(2024, description="Season year"),
    db: Session = Depends(get_db)
):
    """
    Get all races for a season
    
    Args:
        season: Season year (default: 2024)
    
    Returns:
        List of races with basic info
    """
    races = db.query(Race).filter(Race.year == season).order_by(Race.event_date).all()
    
    return {
        "season": season,
        "count": len(races),
        "races": [
            {
                "id": race.id,
                "name": race.race_name,
                "date": race.event_date.isoformat() if race.event_date else None,
                "location": race.location,
                "country": race.country
            }
            for race in races
        ]
    }


@router.get("/{race_id}")
def get_race(race_id: int, db: Session = Depends(get_db)):
    """
    Get race details by ID
    
    Args:
        race_id: Race ID
    """
    race = db.query(Race).filter(Race.id == race_id).first()
    
    if not race:
        raise HTTPException(status_code=404, detail=f"Race {race_id} not found")
    
    return {
        "id": race.id,
        "name": race.race_name,
        "year": race.year,
        "date": race.event_date.isoformat() if race.event_date else None,
        "location": race.location,
        "country": race.country
    }


@router.get("/{race_id}/results")
def get_race_results(race_id: int, db: Session = Depends(get_db)):
    """
    Get race results (finishing order)
    
    Args:
        race_id: Race ID
    """
    race = db.query(Race).filter(Race.id == race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail=f"Race {race_id} not found")
    
    # Get results with driver info
    results = db.query(Result, Driver).join(Driver).filter(
        Result.race_id == race_id,
        or_(Result.session_type == 'R', Result.session_type.is_(None))
    ).order_by(Result.position).all()
    
    return {
        "race": {
            "id": race.id,
            "name": race.race_name,
            "date": race.event_date.isoformat() if race.event_date else None
        },
        "results": [
            {
                "position": result.position,
                "driver_code": driver.driver_code,
                "driver_name": driver.driver_name,
                "grid_position": result.grid_position,
                "points": result.points,
                "status": result.status
            }
            for result, driver in results
        ]
    }


@router.get("/{race_id}/laps")
def get_race_laps(
    race_id: int,
    driver_code: str = Query(None, description="Filter by driver code"),
    db: Session = Depends(get_db)
):
    """
    Get lap data for a race
    
    Args:
        race_id: Race ID
        driver_code: Optional - filter by specific driver
    """
    race = db.query(Race).filter(Race.id == race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail=f"Race {race_id} not found")
    
    # Build query
    query = db.query(Lap, Driver).join(Driver).filter(Lap.race_id == race_id)
    
    # Filter by driver if specified
    if driver_code:
        driver = db.query(Driver).filter(Driver.driver_code == driver_code).first()
        if not driver:
            raise HTTPException(status_code=404, detail=f"Driver {driver_code} not found")
        query = query.filter(Lap.driver_id == driver.id)
    
    laps = query.order_by(Lap.lap_number).limit(1000).all()  # Limit for performance
    
    return {
        "race": {
            "id": race.id,
            "name": race.race_name
        },
        "filter": {
            "driver_code": driver_code
        },
        "count": len(laps),
        "laps": [
            {
                "lap_number": lap.lap_number,
                "driver_code": driver.driver_code,
                "lap_time_seconds": lap.lap_time_seconds,
                "compound": lap.compound,
                "tyre_life": lap.tyre_life,
                "stint": lap.stint,
                "team": lap.team
            }
            for lap, driver in laps
        ]
    }