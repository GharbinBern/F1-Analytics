""" Load - Insert into database """ 
import sys
import os
import pandas as pd

sys.path.append('./backend/')

from models.database import SessionLocal, Race, Driver, Lap, Result

def add_driver(db, driver_code, driver_number, driver_name=None):
    """
    Get existing driver or create new one
    
    Args:
        db: Database session
        driver_code (str): Driver code (e.g., 'VER')
        driver_number (int): Driver number
        driver_name (str): Driver full name
    
    Returns:
        Driver: Driver object
    """

    #check if driver exists 
    driver = db.query(Driver).filter(Driver.driver_code == driver_code).first()

    if not driver:
        # add new driver
        driver = Driver(
            driver_code = driver_code,
            driver_name = driver_name,
            driver_number = driver_number
        )
        db.add(driver)
        db.commit()
        db.refresh(driver)

        print(f"Created driver: {driver_code}")

    return driver    


def load_race_data(transformed_data):
    """
    Load transformed data into database
    
    Args:
        transformed_data (dict): Dictionary from transform_race_data()
    
    Returns:
        bool: Success status
    """
    race_info = transformed_data["race_info"]
    laps_clean = transformed_data["laps_clean"]
    results_clean = transformed_data["results_clean"]

    print(f"LOAD: Inserting {race_info['race_name']} into database...")

    db = SessionLocal()

    try:
        # check if race already exists
        existing_race = db.query(Race).filter(
            Race.year == race_info["year"],
            Race.race_name == race_info["race_name"]
        ).first()

        if existing_race:
            print(f"Race already exists (ID: {existing_race.id}). Skipping...")
            return False
        

        # LOAD race
        print("  - Loading race record...")
        race = Race(
            year= race_info['year'],
            race_name= race_info['race_name'],
            event_date= race_info['event_date'],
            location= race_info['location'],
            country= race_info['country']
        )
        db.add(race)
        db.commit()
        db.refresh(race)
        
        print(f"Race created (ID: {race.id})")


        # LOAD drivers
        print("  - Loading drivers...")
        driver_map = {}  # Map driver_code -> driver object
        
        # Get unique drivers from results (has full names)
        for _, result_row in results_clean.iterrows():
            driver_code = result_row['Abbreviation']
            driver_number = int(result_row['DriverNumber'])
            driver_name = result_row['BroadcastName']
            
            if driver_code not in driver_map:
                driver_map[driver_code] = add_driver(
                    db, driver_code, driver_number, driver_name
                )
       
        print(f"Driver map {driver_map}")
        
        # LOAD results
        print("  - Loading race results...")
        for _, result_row in results_clean.iterrows():
            driver_code = result_row['Abbreviation']
            driver = driver_map[driver_code]
            
            result = Result(
                race_id=race.id,
                driver_id=driver.id,
                position=int(result_row['ClassifiedPosition']) if pd.notna(result_row['ClassifiedPosition']) else None,
                grid_position=int(result_row['GridPosition']) if pd.notna(result_row['GridPosition']) else None,
                points=float(result_row['Points']) if pd.notna(result_row['Points']) else None,
                status=result_row['Status']
            )
            db.add(result)
        
        db.commit()
        print(f"Loaded {len(results_clean)} results")
        
        # # LOAD laps
        # for _, lap_row in laps_clean.iterrows():
        #     lap = Lap(
        #         race_id=race.id,
        #         driver_id=driver.id,
        #         lap_number=lap_row['LapNumber'],
        #         lap_time_seconds=lap_row['LapTimeSeconds'],
        #         compound=lap_row['Compound'],
        #         tyre_life=lap_row['TyreLife'],
        #         stint=lap_row['Stint'],
        #         team=lap_row['Team'],
        #         is_personal_best=lap_row['IsPersonalBest']
        #     )
        #     db.add(lap)
        
        # db.commit()
        print(f"SUCCESS: {race_info['race_name']} loaded!")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        return False
    finally:
        db.close()
    
if __name__ == "__main__":
    # Testing
    from extract import extract_race
    from transform import transform_race_data

    extracted = extract_race(2025, 'Baku')
    transformed = transform_race_data(extracted)
    success = load_race_data(transformed)

    print(f"\nPipeline completed: {success}")