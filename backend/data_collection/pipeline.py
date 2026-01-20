"""
pipeline.py
Main ETL pipeline 
"""

from extract import extract_race
from transform import transform_race_data
from load import load_race_data


def run_etl_pipeline(year, race_name):
    """
    Run complete ETL pipeline for a race
    
    Args:
        year (int): Season year
        race_name (str): Race name
    
    Returns:
        bool: Success status
    """
    print("="*100)
    print(f"ETL PIPELINE: {year} {race_name}")
    print("="*100)
    
    try:
        # Extract
        extracted_data = extract_race(year, race_name)
        
        # Transform
        transformed_data = transform_race_data(extracted_data)
        
        # Load
        success = load_race_data(transformed_data)
        
        print("="*100)
        if success:
            print("PIPELINE COMPLETED SUCCESSFULLY")
        else:
            print("PIPELINE COMPLETED WITH WARNINGS")
        print("="*100)
        
        return success
        
    except Exception as e:
        print("="*100)
        print(f"PIPELINE FAILED: {e}")
        print("="*100)
        import traceback
        traceback.print_exc()
        return False


def run_full_season(year, races=None):
    """
    Load full season or specific races
    
    Args:
        year (int): Season year
        races (list): List of race names, or None for all races
    """
    import fastf1
    
    # Get schedule
    fastf1.Cache.enable_cache('notebook/cache')
    schedule = fastf1.get_event_schedule(year)
    
    if races is None:
        # Load all races, excluding pre-season testing and non-GP events
        race_events = schedule[
            (schedule['EventFormat'] == 'conventional') &
            (~schedule['EventName'].str.contains('Testing|Test', case=False, na=False))
        ]
        race_list = race_events['EventName'].tolist()
        print(f"Filtered to {len(race_list)} races (excluded testing/non-GP events)")
    else:
        race_list = races
    
    print(f"\n{'='*100}")
    print(f"LOADING {len(race_list)} RACES FROM {year} SEASON")
    print(f"{'='*100}\n")
    
    results = []
    for race_name in race_list:
        success = run_etl_pipeline(year, race_name)
        results.append((race_name, success))
        print()  # Blank line between races
    
    # Summary
    print(f"\n{'='*100}")
    print("SUMMARY")
    print(f"{'='*100}")
    successful = sum(1 for _, s in results if s)
    print(f"Successful: {successful}/{len(results)}")
    print(f"Failed: {len(results) - successful}/{len(results)}")
    
    print("\nDetails:")
    for race_name, success in results:
        status = "SUCCESS" if success else "ERROR"
        print(f"  {status} {race_name}")


if __name__ == "__main__":
    # Test single race
    # run_etl_pipeline(2024, 'Monaco')
    
    # Or load specific races
    # run_full_season(2024, ['Bahrain', 'Saudi Arabia', 'Australia'])
    
    # Or load full season 
    run_full_season(2021)
