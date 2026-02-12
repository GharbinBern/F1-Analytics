"""
team.py
Team-related API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import SessionLocal, Race, Driver, Lap, Result

router = APIRouter(prefix="/team", tags=["teams"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{team}/performance")
def get_team_performance(
    team: str,
    season: int = Query(2024, description="Season year"),
    db: Session = Depends(get_db)
):
    """
    Get team performance statistics for a season
    
    Args:
        team: Team name (e.g., "Red Bull", "Mercedes")
        season: Season year (default: 2024)
    
    Returns:
        Team stats including total points, average position, races entered
    """
    # Get races in season
    race_ids = [race_id for (race_id,) in db.query(Race.id).filter(Race.year == season).all()]
    
    if not race_ids:
        return {
            "team": team,
            "season": season,
            "message": f"No races found for season {season}",
            "stats": None
        }
    
    team_driver_ids = [
        driver_id
        for (driver_id,) in db.query(Lap.driver_id)
        .filter(
            Lap.team == team,
            Lap.race_id.in_(race_ids)
        )
        .distinct()
        .all()
    ]

    if not team_driver_ids:
        return {
            "team": team,
            "season": season,
            "message": f"No data found for team {team} in season {season}",
            "stats": None
        }

    total_points, races_entered, avg_position = db.query(
        func.coalesce(func.sum(Result.points), 0),
        func.count(func.distinct(Result.race_id)),
        func.avg(Result.position)
    ).filter(
        Result.driver_id.in_(team_driver_ids),
        Result.race_id.in_(race_ids)
    ).one()

    total_laps, avg_lap_time = db.query(
        func.count(Lap.id),
        func.avg(Lap.lap_time_seconds)
    ).filter(
        Lap.team == team,
        Lap.race_id.in_(race_ids)
    ).one()
    
    return {
        "team": team,
        "season": season,
        "stats": {
            "races_entered": races_entered,
            "total_points": round(total_points, 1) if total_points else 0,
            "average_position": round(avg_position, 2) if avg_position else None,
            "total_laps": total_laps,
            "average_lap_time": round(avg_lap_time, 3) if avg_lap_time else None,
            "drivers_count": len(team_driver_ids)
        }
    }


@router.get("/{team}/pit-stops")
def get_team_pit_stops(
    team: str,
    season: int = Query(2024, description="Season year"),
    db: Session = Depends(get_db)
):
    """
    Get pit stop analysis for a team in a season
    
    Args:
        team: Team name
        season: Season year (default: 2024)
    
    Returns:
        Pit stop statistics including counts and timing
    """
    # Get races in season
    race_ids = [race_id for (race_id,) in db.query(Race.id).filter(Race.year == season).all()]
    
    if not race_ids:
        return {
            "team": team,
            "season": season,
            "message": f"No races found for season {season}",
            "stats": None
        }
    
    total_pit_stops, avg_pit_time, fastest_pit_time, slowest_pit_time, races_with_pit_stops = db.query(
        func.count(Lap.id),
        func.avg(Lap.pit_in_time),
        func.min(Lap.pit_in_time),
        func.max(Lap.pit_in_time),
        func.count(func.distinct(Lap.race_id))
    ).filter(
        Lap.team == team,
        Lap.race_id.in_(race_ids),
        Lap.pit_in_time.isnot(None)
    ).one()

    if not total_pit_stops:
        return {
            "team": team,
            "season": season,
            "message": f"No pit stop data found for team {team} in season {season}",
            "stats": None
        }

    avg_stops_per_race = (
        total_pit_stops / races_with_pit_stops if races_with_pit_stops else 0
    )
    
    return {
        "team": team,
        "season": season,
        "stats": {
            "total_pit_stops": total_pit_stops,
            "races_with_pit_stops": races_with_pit_stops,
            "average_stops_per_race": round(avg_stops_per_race, 2),
            "average_pit_time_seconds": round(avg_pit_time, 3) if avg_pit_time else None,
            "fastest_pit_time_seconds": round(fastest_pit_time, 3) if fastest_pit_time else None,
            "slowest_pit_time_seconds": round(slowest_pit_time, 3) if slowest_pit_time else None
        }
    }


@router.get("/{team}/points-per-race")
def get_team_points_per_race(
    team: str,
    season: int = Query(2024, description="Season year"),
    db: Session = Depends(get_db)
):
    """
    Get team points per race across a season

    Args:
        team: Team name
        season: Season year (default: 2024)

    Returns:
        List of races with total team points
    """
    race_ids = [race_id for (race_id,) in db.query(Race.id).filter(Race.year == season).all()]

    if not race_ids:
        return {
            "team": team,
            "season": season,
            "message": f"No races found for season {season}",
            "points": []
        }

    team_drivers = db.query(Lap.driver_id, Lap.race_id).filter(
        Lap.team == team,
        Lap.race_id.in_(race_ids)
    ).distinct().subquery()

    rows = db.query(
        Race.id,
        Race.race_name,
        Race.event_date,
        func.coalesce(func.sum(Result.points), 0)
    ).join(
        team_drivers,
        team_drivers.c.race_id == Race.id
    ).join(
        Result,
        (Result.race_id == Race.id) & (Result.driver_id == team_drivers.c.driver_id)
    ).filter(
        Race.year == season,
        or_(Result.session_type == 'R', Result.session_type.is_(None))
    ).group_by(
        Race.id
    ).order_by(
        Race.event_date
    ).all()

    return {
        "team": team,
        "season": season,
        "points": [
            {
                "race_id": race_id,
                "race_name": race_name,
                "date": event_date.isoformat() if event_date else None,
                "points": float(points or 0)
            }
            for race_id, race_name, event_date, points in rows
        ]
    }