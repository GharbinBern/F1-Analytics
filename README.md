# F1 Analytics

Track F1 race performance, compare drivers, and explore team trends from a single analytics dashboard. Full-stack Formula 1 analytics workspace with a FastAPI backend, a React + Vite frontend, and a FastF1-powered data pipeline.

## Features
- FastAPI API for drivers, races, laps, and team performance.
- React dashboard with comparison views, race calendar, and telemetry summaries.
- ETL pipeline that extracts data from FastF1 and loads it into SQLite.

## Tech Stack
- Backend: FastAPI, SQLAlchemy, SQLite
- Frontend: React 19, Vite, React Router
- Data: FastF1, Pandas

## Project Structure
```
backend/
  api/
    main.py
    routes/
      drivers.py
      races.py
      laps.py
      teams.py
  data_collection/
    extract.py
    transform.py
    load.py
    pipeline.py
  models/
    database.py
data/
frontend/
  src/
    components/
    pages/
    services/
    styles/
notebook/
  explore_data.ipynb
  cache/
```

## Quickstart

### 1) Backend (FastAPI)
Create a virtual environment, install dependencies, initialize the database, load data, then start the API:

```
python -m venv .venv
source .venv/bin/activate

pip install -r backend/requirements.txt
pip install -r requirements.txt  # optional: notebooks + data tooling

python backend/models/database.py
python backend/data_collection/pipeline.py

uvicorn backend.api.main:app --reload
```

The API runs at http://localhost:8000.

### 2) Frontend (React + Vite)
```
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:5173 by default.

### 3) Configure API Base URL (optional)
The frontend reads `VITE_API_URL` from your environment. If not set, it defaults to http://localhost:8000.


## Data Pipeline
The ETL pipeline pulls session data from FastF1, cleans it, and loads it into SQLite at `data/database.db`.

Run the pipeline:
```
python backend/data_collection/pipeline.py
```

The FastF1 cache is stored in `notebook/cache` to speed up repeated downloads.


## Notebooks
Exploratory analysis lives in `notebook/explore_data.ipynb`.







