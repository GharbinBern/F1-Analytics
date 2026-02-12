# F1 Analytics

F1 Analytics is a full-stack dashboard for tracking race weekends, comparing drivers, and reviewing team performance. The backend is FastAPI + SQLite, the frontend is React + Vite, and the data pipeline is powered by FastF1.

## Features
- Season calendar tracking (next race, completed rounds, progress).
- Driver comparison with points, average finishes, wins, podiums, and total laps.
- Race results with finishing order, grid position, points, and status.
- Team performance and pit stop analytics.

## Demo
![F1 Analytics demo](frontend/public/assets/demo.gif)

## How it works
- **Data source:** FastF1 (session data cached locally).
- **Storage:** SQLite database at `data/database.db`.
- **Refresh cadence:** run the pipeline manually when you want fresh data; cached pulls live in `notebook/cache`.

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

## Notebooks
Exploratory analysis lives in `notebook/explore_data.ipynb`.










