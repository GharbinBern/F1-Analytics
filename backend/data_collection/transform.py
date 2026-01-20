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

    print(f"\nTRANSFORM: Cleaning and formatting data...")

    # Transform laps
    laps_raw = extracted_data['laps_raw']
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
            laps_clean[col] = laps_clean[col].astype(object).where(pd.notna(laps_clean[col]), None)


    # Transform results
    results_raw = extracted_data['results_raw']

    # Select needed columns
    results_clean = results_raw[[
        'DriverNumber', 'Abbreviation', 'BroadcastName',
        'ClassifiedPosition', 'GridPosition', 'Points', 'Status', 'TeamName'
    ]].copy()

    # Handle nulls - convert to object dtype to store Python None
    for col in ['ClassifiedPosition', 'GridPosition', 'Points']:
        if col in results_clean.columns:
            results_clean[col] = results_clean[col].astype(object).where(pd.notna(results_clean[col]), None)

    results_clean['ClassifiedPosition'] = (results_clean['ClassifiedPosition']
    .replace('R', None))

    # Convert to Python native types 
    laps_clean['LapNumber'] = laps_clean['LapNumber'].astype(int)
    laps_clean['LapTimeSeconds'] = laps_clean['LapTimeSeconds'].astype(float)
    # laps_clean['TyreLife'] = laps_clean['TyreLife'].astype(int)  
    # laps_clean['Stint'] = laps_clean['Stint'].astype(int)
    laps_clean['IsPersonalBest'] = laps_clean['IsPersonalBest'].astype(bool)
    # Convert nullable integers - handle NA values properly
    laps_clean['TyreLife'] = laps_clean['TyreLife'].apply(
        lambda x: int(x) if pd.notna(x) else None
    )
    laps_clean['Stint'] = laps_clean['Stint'].apply(
        lambda x: int(x) if pd.notna(x) else None
    )
    # Use EventName for consistency (e.g., "Australian Grand Prix" not "Australia")
    race_info = {
        'year': extracted_data['year'],
        'race_name': session.event['EventName'],  # Use full event name from FastF1
        'event_date': session.event['EventDate'],
        'location': session.event.get('Location'),
        'country': session.event.get('Country')
    }

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
    
    print(f"Race info: {transformed['race_info']}")
    print(f"Clean laps: {len(transformed['laps_clean'])}")
    print(f"Sample Laps:\n{transformed['laps_clean'].head(10)}")
    print(f"Sample Result:\n{transformed['results_clean'].head(20)}")