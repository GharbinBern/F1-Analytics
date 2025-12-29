from sqlalchemy import (
    Column, Integer, Float, String, Boolean, ForeignKey,DateTime ,  create_engine
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

#SCHEMA
Base = declarative_base()

class Lap(Base):        
    """Stores individual lap data"""    
    __tablename__ = "laps"

    id = Column(Integer, primary_key=True, index= True)
    race_id = Column(ForeignKey("races.id"), nullable= False)
    driver_id = Column(ForeignKey("drivers.id"), nullable= False)

    lap_number = Column(Integer, nullable= False)
    lap_time_seconds = Column(Float, nullable= True)
    compound = Column(String, nullable= True)
    tyre_life = Column(Integer, nullable= True)
    stint = Column(Integer, nullable= True)
    pit_in_time = Column(Float, nullable=True)

    team = Column(String, nullable= False)
    is_personal_best = Column(Boolean, default= False)

    # Relationships
    driver = relationship("Driver", back_populates="laps")
    race = relationship("Race", back_populates="laps")

    def __repr__(self):
        return f"<Lap Race:{self.race_id} Driver:{self.driver_id} Lap:{self.lap_number}>"



class Race(Base):
    """Stores information about each Grand Prix"""
    __tablename__ = "races"

    id = Column(Integer, primary_key=True, index= True)

    year = Column(Integer, nullable= False)
    race_name = Column(String,  nullable= False)
    event_date = Column(DateTime, nullable= True)
    location = Column(String, nullable= True)
    country = Column(String, nullable= True)

    # Relationships
    laps = relationship("Lap", back_populates="race")
    results = relationship("Result", back_populates="race")

    def __repr__(self):
        return f"<Race {self.year} {self.race_name}>"

    

class Driver(Base):
    """Stores driver information"""
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index= True)    

    driver_code = Column(String, unique= True, nullable= False)
    driver_name = Column(String, nullable= False)
    driver_number = Column(Integer, nullable= False)

    results = relationship("Result", back_populates = "driver")
    laps = relationship("Lap", back_populates="driver")

    def __repr__(self):
        return f"<Driver {self.driver_code} - {self.driver_name}>"

class Result(Base):
    """Stores final race results"""
    __tablename__ = 'results'

    id = Column(Integer, primary_key=True, index= True)

    race_id = Column(ForeignKey("races.id"), nullable= False)
    driver_id = Column(ForeignKey("drivers.id"), nullable= False)
    position = Column(Integer, nullable= True)
    grid_position = Column(Integer, nullable= True)
    points = Column(Float, nullable=True)
    status = Column(String, nullable=True)

    driver = relationship("Driver", back_populates="results")
    race = relationship("Race", back_populates="results")

    def __repr__(self):
        return f"<Result Race:{self.race_id} P{self.position} Driver:{self.driver_id}>"




# DATABASE SETUP
DATABASE_URL = "sqlite:///data/database.db"
engine = create_engine(DATABASE_URL, echo=False)

# CREATE SessionLocal HERE - This was missing!
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_database():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

def get_db():
    """Get database session (for later use)"""
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    # Test for database creation
    print("Creating database...")
    init_database()
    
    # Verify tables were created
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\nTables created: {tables}")
    
    # Show table columns
    for table in tables:
        print(f"\n{table.upper()} table columns:")
        columns = inspector.get_columns(table)
        for col in columns:
            nullable = "NULL" if col['nullable'] else "NOT NULL"
            print(f"  - {col['name']:20s} {str(col['type']):15s} {nullable}")