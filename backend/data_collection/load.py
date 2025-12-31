""" Load - Insert into database """ 
import sys
import pandas as pd

sys.path.append('./backend/')

from models.database import SessionLocal, Race, Driver, Lap, Result

def add_driver(db, driver_code, driver_number, driver_name=None):
    #check if driver exists 
    existing_driver = db.query(Driver).filter(
        Driver.driver_code == driver_code
    ).first()

    if existing_driver:
        print(f"    Driver already exists (ID: {existing_driver.id}). Skipping...")
        return existing_driver
  
    # LOAD driver
    print("  - Loading drivers...")
    driver = Driver(
        driver_code = driver_code,
        driver_name = driver_name,
        driver_number = driver_number
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)

    print(f"Driver loaded (CODE: {driver_code})")

    return driver    

def add_race(db, race_info):
    # check if race already exists
    existing_race = db.query(Race).filter(
        Race.year == race_info["year"],
        Race.race_name == race_info["race_name"]
    ).first()

    if existing_race:
        print(f"    Race already exists (ID: {existing_race.id}). Skipping...")
        return existing_race, False
    
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
    
    print(f"Race loaded (ID: {race.id})")

    return race, True

def add_result(db, race_id, driver_id, position, grid_position, points, status):
    # check if race already exists
    existing_results = db.query(Result).filter(
        Result.race_id == race_id,
        Result.driver_id == driver_id
    ).first()

    if existing_results:
        print(f"    Results already exists (ID: {existing_results.id}). Skipping...")
        return False

    # LOAD results
    result = Result(
            race_id=race_id,
            driver_id=driver_id,
            position= position,
            grid_position= grid_position,
            points= points,
            status= status
        )
    db.add(result)
    db.flush()  # ensure ID is available before logging

    return result

def add_lap(db, race_id, driver_id, lap_data):
    # check if lap already exists
    existing_lap = db.query(Lap).filter(
        Lap.race_id == race_id,
        Lap.driver_id == driver_id,
        Lap.lap_number == lap_data['LapNumber']
    ).first()

    if existing_lap:
        return None  # Skip if lap already exists

    # LOAD laps
    lap = Lap(
        race_id=race_id,
        driver_id=driver_id,
        lap_number=lap_data['LapNumber'],             
        lap_time_seconds=lap_data['LapTimeSeconds'],    
        compound=lap_data['Compound'],
        tyre_life=lap_data['TyreLife'],              
        stint=lap_data['Stint'],                       
        team=lap_data['Team'],
        is_personal_best=lap_data['IsPersonalBest']
    )
    db.add(lap)
    
    return lap

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
        # 1. LOAD race
        race, is_new = add_race(db, race_info)
        
        # If race already exists, check if we need to reload data
        if not is_new:
            print("    Race already exists. Skipping data load.")
            return True
    

        # 2. LOAD drivers
        driver_map = {}  # Map driver_code -> driver object
        
        # Get unique drivers from results (has full names)
        for _, result_row in results_clean.iterrows():
            driver_code = result_row['Abbreviation']
            
            if driver_code not in driver_map:
                driver_map[driver_code] = add_driver(
                    db, 
                    driver_code, 
                    result_row['DriverNumber'], 
                    result_row['BroadcastName']
                )
                
        print(f"    Processed {len(driver_map)} drivers")


        # 3. LOAD results
        print("  - Loading race results...")
        result_count = 0

        for _, result_row in results_clean.iterrows():
            driver_code = result_row['Abbreviation']
            driver = driver_map[driver_code]

            add_result(
                db, 
                race.id, 
                driver.id, 
                result_row['ClassifiedPosition'],
                result_row['GridPosition'],
                result_row['Points'] or 0.0,
                result_row['Status']
            )
            result_count += 1

        # Commit all results at once
        db.commit()
        print(f"    Loaded {result_count} results")
        
        # 4. LOAD laps
        print(f"  - Loading laps...")
        lap_count = 0
        
        for _, lap_row in laps_clean.iterrows():
            driver_code = lap_row['Driver']
            
            # Get driver 
            if driver_code not in driver_map:
                # Fallback: create driver if somehow not in results
                driver_map[driver_code] = add_driver(
                    db, driver_code, int(lap_row['DriverNumber'])
                )
            
            driver = driver_map[driver_code]
            
            add_lap(db, race.id, driver.id, lap_row)
            lap_count += 1
            
            # Commit in batches every 100 laps for performance
            if lap_count % 100 == 0:
                db.commit()
                print(f"    - {lap_count} laps loaded...")
        
        # Final commit for remaining laps
        db.commit()
        print(f"    Loaded {lap_count} laps")
        print(f"SUCCESS: {race_info['race_name']} loaded!")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()
    
if __name__ == "__main__":
    # Testing
    from extract import extract_race
    from transform import transform_race_data

    print("Testing ETL pipeline...")
    print("="*100)

    extracted = extract_race(2025, 'Austin')
    transformed = transform_race_data(extracted)
    success = load_race_data(transformed)

    print("="*100)
    print(f"\nPipeline completed: {success}")