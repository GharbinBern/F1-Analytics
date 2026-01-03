"""
drivers.py
Driver-related API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import SessionLocal, Race, Driver, Lap, Result

router = APIRouter(prefix="/drivers", tags=["drivers"])

# Simple parser so non-numeric positions do not break stats.
def _to_int_or_none(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
    if isinstance(value, str):
        stripped = value.strip()
        return int(stripped) if stripped.isdigit() else None
    return None

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_all_drivers(db: Session = Depends(get_db)):
    """
    Get all drivers
    
    Returns list of all drivers in database
    """
    drivers = db.query(Driver).all()
    
    return {
        "count": len(drivers),
        "drivers": [
            {
                "id": driver.id,
                "code": driver.driver_code,
                "name": driver.driver_name,
                "number": driver.driver_number
            }
            for driver in drivers
        ]
    }


@router.get("/compare")
def compare_driver(
    driver1: str = Query(..., description="First driver code"),
    driver2: str = Query(..., description="Second driver code"),
    season: int = Query(2024, description="Season year"),
    db: Session = Depends(get_db)
):
    """
    Get stats for a drivers in a season
    
    Args:
        driver1: Driver code for first driver
        driver2: Driver code for the second driver
        season: Season year
    """
    driver1_code = driver1
    driver2_code = driver2
    
    driver1 = db.query(Driver).filter(Driver.driver_code == driver1_code).first()
    driver2 = db.query(Driver).filter(Driver.driver_code == driver2_code).first()

    if not driver1:
        raise HTTPException(status_code=404, detail=f"Driver {driver1_code} not found")
    if not driver2:
        raise HTTPException(status_code=404, detail=f"Driver {driver2_code} not found")
    
    # Get races in season
    races = db.query(Race).filter(Race.year == season).all()
    race_ids = [race.id for race in races]
    
    if not race_ids:
        return {
            "season": season,
            "message": f"No races found for season {season}",
            "drivers": None
        }
    
    # Helper function to get driver stats
    def get_driver_comparison_stats(driver, race_ids):
        results = db.query(Result).filter(
            Result.driver_id == driver.id,
            Result.race_id.in_(race_ids)
        ).all()
        
        laps = db.query(Lap).filter(
            Lap.driver_id == driver.id,
            Lap.race_id.in_(race_ids),
            Lap.lap_time_seconds.isnot(None)
        ).all()
        
        total_points = sum(r.points for r in results if r.points)
        
        finishes = []
        for r in results:
            pos = _to_int_or_none(r.position)
            if pos is not None:
                finishes.append(pos)
        avg_finish = sum(finishes) / len(finishes) if finishes else None
        
        lap_times = [l.lap_time_seconds for l in laps]
        avg_lap_time = sum(lap_times) / len(lap_times) if lap_times else None
        fastest_lap = min(lap_times) if lap_times else None
        
        return {
            "code": driver.driver_code,
            "name": driver.driver_name,
            "number": driver.driver_number,
            "races_entered": len(results),
            "total_points": round(total_points, 1) if total_points else 0,
            "average_finish_position": round(avg_finish, 2) if avg_finish else None,
            "total_laps": len(laps),
            "average_lap_time": round(avg_lap_time, 3) if avg_lap_time else None,
            "fastest_lap": round(fastest_lap, 3) if fastest_lap else None
        }
    
    stats1 = get_driver_comparison_stats(driver1, race_ids)
    stats2 = get_driver_comparison_stats(driver2, race_ids)
    
    return {
        "season": season,
        "drivers": {
            "driver1": stats1,
            "driver2": stats2
        }
    }

@router.get("/{driver_code}")
def get_driver(driver_code: str, db: Session = Depends(get_db)):
    """
    Get driver by code
    
    Args:
        driver_code: Driver code (e.g., VER, HAM, LEC)
    """
    driver = db.query(Driver).filter(Driver.driver_code == driver_code).first()
    
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver {driver_code} not found")
    
    return {
        "id": driver.id,
        "code": driver.driver_code,
        "name": driver.driver_name,
        "number": driver.driver_number
    }

@router.get("/{driver_code}/stats")
def get_driver_stats(
    driver_code: str,
    season: int = Query(2024, description="Season year"),
    db: Session = Depends(get_db)
):
    """
    Get driver statistics for a season
    
    Args:
        driver_code: Driver code (e.g., VER, HAM)
        season: Season year (default: 2024)
    
    Returns:
        Driver statistics including points, average position, lap times
    """
    # Get driver
    driver = db.query(Driver).filter(Driver.driver_code == driver_code).first()
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver {driver_code} not found")
    
    # Get races in season
    races = db.query(Race).filter(Race.year == season).all()
    race_ids = [race.id for race in races]
    
    if not race_ids:
        return {
            "driver": {
                "code": driver.driver_code,
                "name": driver.driver_name,
                "number": driver.driver_number
            },
            "season": season,
            "message": f"No races found for season {season}",
            "stats": None
        }
    
    # Get driver's results
    results = db.query(Result).filter(
        Result.driver_id == driver.id,
        Result.race_id.in_(race_ids)
    ).all()
    
    # Get driver's laps
    laps = db.query(Lap).filter(
        Lap.driver_id == driver.id,
        Lap.race_id.in_(race_ids),
        Lap.lap_time_seconds.isnot(None)
    ).all()
    
    # Calculate statistics
    total_points = sum(r.points for r in results if r.points)
    
    finishes = []
    for r in results:
        pos = _to_int_or_none(r.position)
        if pos is not None:
            finishes.append(pos)
    avg_finish = sum(finishes) / len(finishes) if finishes else None
    
    lap_times = [l.lap_time_seconds for l in laps]
    avg_lap_time = sum(lap_times) / len(lap_times) if lap_times else None
    fastest_lap = min(lap_times) if lap_times else None
    
    return {
        "driver": {
            "code": driver.driver_code,
            "name": driver.driver_name,
            "number": driver.driver_number
        },
        "season": season,
        "stats": {
            "races_entered": len(results),
            "total_points": round(total_points, 1) if total_points else 0,
            "average_finish_position": round(avg_finish, 2) if avg_finish else None,
            "total_laps": len(laps),
            "average_lap_time": round(avg_lap_time, 3) if avg_lap_time else None,
            "fastest_lap": round(fastest_lap, 3) if fastest_lap else None
        }
    }


@router.get("/{driver_code}/races")
def get_driver_races(
    driver_code: str,
    season: int = Query(2024, description="Season year"),
    db: Session = Depends(get_db)
):
    """
    Get all races for a driver in a season
    
    Args:
        driver_code: Driver code
        season: Season year
    """
    # Get driver
    driver = db.query(Driver).filter(Driver.driver_code == driver_code).first()
    if not driver:
        raise HTTPException(status_code=404, detail=f"Driver {driver_code} not found")
    
    # Get races with results
    results = db.query(Result, Race).join(Race).filter(
        Result.driver_id == driver.id,
        Race.year == season
    ).all()
    
    return {
        "driver": driver.driver_code,
        "season": season,
        "races": [
            {
                "race_name": race.race_name,
                "date": race.event_date.isoformat() if race.event_date else None,
                "position": result.position,
                "grid_position": result.grid_position,
                "points": result.points,
                "status": result.status
            }
            for result, race in results
        ]
    }

