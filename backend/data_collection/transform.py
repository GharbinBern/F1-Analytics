""" Transform - Clean and format """

import pandas as pd

def transform_race_data(extracted_data):
    """
    Transform raw race data
    
    Args:
        extracted_data (dict): Dictionary from extract_race()
    
    Returns:
        dict: Dictionary containing cleaned data
    """

    print(f"TRANSFORM: Cleaning and formatting data...")

    # Transform laps
    laps_raw = extracted_data['laps_raw']
    results_raw = extracted_data['results_raw']
    session = extracted_data['session']
    
    # Convert timedeltas to seconds
    laps_raw = laps_raw.copy()
    laps_raw['LapTimeSeconds'] = laps_raw['LapTime'].dt.total_seconds()

    # Select needed columns
    laps_clean = laps_raw[[
        'Driver', 'DriverNumber', 'LapNumber', 'LapTimeSeconds',
        'Compound', 'TyreLife', 'Stint', 'Team', 'IsPersonalBest'
    ]].copy()

    # Handle nulls
    for col in ['LapTimeSeconds', 'Compound', 'TyreLife', 'Stint']:
        if col in laps_clean.columns:
            laps_clean[col] = laps_clean[col].where(pd.notna(laps_clean[col]), None)


    # Transform results
    # Select needed columns
    results_clean = results_raw[[
        'DriverNumber', 'Abbreviation', 'BroadcastName',
        'ClassifiedPosition', 'GridPosition', 'Points', 'Status', 'TeamName'
    ]].copy()

    # Handle nulls
    for col in ['ClassifiedPosition', 'GridPosition', 'Points']:
        if col in results_clean.columns:
            results_clean[col] = results_clean[col].where(pd.notna(results_clean[col]), None)

    results_clean['ClassifiedPosition'] = (results_clean['ClassifiedPosition']
    .replace('R', None))

    race_info = {
        'year': extracted_data['year'],
        'race_name': extracted_data['race_name'],
        'event_name': session.event['EventName'],
        'event_date': session.event['EventDate'],
        'location': session.event.get('Location'),
        'country': session.event.get('Country')
    }

    print(f"Transformed {len(laps_clean)} laps, {len(results_clean)} results")

    return {
        'race_info': race_info,
        'laps_clean': laps_clean,
        'results_clean': results_clean
    }

if __name__ == "__main__":
    # Test transformation
    from extract import extract_race
    
    extracted = extract_race(2024, 'Monaco')
    transformed = transform_race_data(extracted)
    
    print(f"\nRace info: {transformed['race_info']}")
    print(f"Clean laps: {len(transformed['laps_clean'])}")
    print(f"Sample:\n{transformed['laps_clean'].head(10)}")
    print(f"Sample:\n{transformed['results_clean'].head(20)}")