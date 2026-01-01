# F1-Analytics

## Directory Structure
```
backend/
├── api/
│   ├── __init__.py
│   ├── main.py              = FastAPI app (imports all routers)
│   └── routes/
│       ├── __init__.py
│       ├── drivers.py       = Driver endpoints
│       ├── races.py         = Race endpoints
│       └── laps.py          = Lap endpoints
├── models/
│   └── database.py          = Database models
├── data_collection/
│   ├── __init__.py
│   ├── extract.py       = Extract logic
│   ├── transform.py     = Transform logic
│   ├── load.py          = Load logic
│   └── pipeline.py      = Main orchestrator
└── venv/

