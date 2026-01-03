"""
team.py
Team-related API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    races = db.query(Race).filter(Race.year == season).all()
    race_ids = [race.id for race in races]
    
    if not race_ids:
        return {
            "team": team,
            "season": season,
            "message": f"No races found for season {season}",
            "stats": None
        }
    
    # Get all results for drivers on this team
    results = db.query(Result, Driver).join(Driver).filter(
        Result.race_id.in_(race_ids)
    ).all()
    
    # Filter by team
    team_results = [r for r, d in results if db.query(Lap).filter(
        Lap.driver_id == d.id,
        Lap.race_id.in_(race_ids)
    ).first() and db.query(Lap).filter(
        Lap.driver_id == d.id,
        Lap.race_id.in_(race_ids),
        Lap.team == team
    ).first()]
    
    # Simpler approach: get laps for the team directly
    team_laps = db.query(Lap).filter(
        Lap.team == team,
        Lap.race_id.in_(race_ids)
    ).all()
    
    if not team_laps:
        return {
            "team": team,
            "season": season,
            "message": f"No data found for team {team} in season {season}",
            "stats": None
        }
    
    # Get drivers on this team
    team_driver_ids = list(set(lap.driver_id for lap in team_laps))
    team_results = db.query(Result).filter(
        Result.driver_id.in_(team_driver_ids),
        Result.race_id.in_(race_ids)
    ).all()
    
    # Calculate stats
    total_points = sum(r.points for r in team_results if r.points)
    races_entered = len(set(r.race_id for r in team_results))
    
    positions = [r.position for r in team_results if r.position and isinstance(r.position, int)]
    avg_position = sum(positions) / len(positions) if positions else None
    
    lap_times = [l.lap_time_seconds for l in team_laps if l.lap_time_seconds]
    avg_lap_time = sum(lap_times) / len(lap_times) if lap_times else None
    
    return {
        "team": team,
        "season": season,
        "stats": {
            "races_entered": races_entered,
            "total_points": round(total_points, 1) if total_points else 0,
            "average_position": round(avg_position, 2) if avg_position else None,
            "total_laps": len(team_laps),
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
    races = db.query(Race).filter(Race.year == season).all()
    race_ids = [race.id for race in races]
    
    if not race_ids:
        return {
            "team": team,
            "season": season,
            "message": f"No races found for season {season}",
            "stats": None
        }
    
    # Get pit stop data for team
    pit_stops = db.query(Lap).filter(
        Lap.team == team,
        Lap.race_id.in_(race_ids),
        Lap.pit_in_time.isnot(None)
    ).all()
    
    if not pit_stops:
        return {
            "team": team,
            "season": season,
            "message": f"No pit stop data found for team {team} in season {season}",
            "stats": None
        }
    
    # Calculate stats
    total_pit_stops = len(pit_stops)
    avg_pit_time = sum(p.pit_in_time for p in pit_stops) / len(pit_stops) if pit_stops else None
    
    # Group by race
    pit_stops_by_race = {}
    for pit in pit_stops:
        race_id = pit.race_id
        if race_id not in pit_stops_by_race:
            pit_stops_by_race[race_id] = 0
        pit_stops_by_race[race_id] += 1
    
    avg_stops_per_race = sum(pit_stops_by_race.values()) / len(pit_stops_by_race) if pit_stops_by_race else 0
    
    return {
        "team": team,
        "season": season,
        "stats": {
            "total_pit_stops": total_pit_stops,
            "races_with_pit_stops": len(pit_stops_by_race),
            "average_stops_per_race": round(avg_stops_per_race, 2),
            "average_pit_time_seconds": round(avg_pit_time, 3) if avg_pit_time else None,
            "fastest_pit_time_seconds": round(min(p.pit_in_time for p in pit_stops), 3) if pit_stops else None,
            "slowest_pit_time_seconds": round(max(p.pit_in_time for p in pit_stops), 3) if pit_stops else None
        }
    }