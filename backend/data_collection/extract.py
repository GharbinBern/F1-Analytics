""" Extract - Get data from FastF1 """
import fastf1

def extract_race(year, race_name):
    """
    Extract race data from FastF1
    
    Args:
        year (int): Season year
        race_name (str): Race name (e.g., 'Monaco', 'Bahrain')
    
    Returns:
        dict: Dictionary containing session and raw data
    """
    print(f"EXTRACT: Fetching {race_name} from FastF1") 

    fastf1.Cache.enable_cache('notebook/cache')

    session = fastf1.get_session(year, race_name, 'R')
    session.load()

    laps_raw = session.laps
    results_raw = session.results

    sprint_results_raw = None
    try:
        sprint_session = fastf1.get_session(year, race_name, 'S')
        sprint_session.load()
        sprint_results_raw = sprint_session.results
        print("EXTRACT: Sprint session found and loaded")
    except Exception:
        print("EXTRACT: No sprint session for this event")

    # Return everything as a dictionary
    return {
        'session': session,
        'laps_raw': laps_raw,
        'results_raw': results_raw,
        'sprint_results_raw': sprint_results_raw,
        'year': year,
        'race_name': race_name
    }

if __name__ == "__main__":
    # Test extraction
    data = extract_race(2024, 'Monaco')
    print(f"Session: {data['session'].event['EventName']}")
    print(f"Laps: {len(data['laps_raw'])}")

