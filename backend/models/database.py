from sqlalchemy import (
    Column, Integer, Float, String, Boolean, ForeignKey, create_engine
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Lap(Base):
    __tablename__ = "laps"
    id = Column(Integer, primary_key=True)
    race_id = Column(ForeignKey("races.id"), nullable= False)
    driver_id = Column(ForeignKey("drivers.id"), nullable= False)

class Race(Base):
    __tablename__ = "races"
    id = Column(Integer, primary_key=True)

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True)    
