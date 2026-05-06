from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from chatbot_engine import answer_question
from data_processor import dataframe_preview, process_dataset, read_uploaded_dataset
from ranking_engine import ScenarioRankingEngine
from llm_engine import get_or_create_summary
from dotenv import load_dotenv

load_dotenv()


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIST_DIR = BASE_DIR.parent / "frontend" / "dist"

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="Scenario-Based Catalyst Recommendation API",
    description="Rule-based catalyst processing, ranking, and chatbot API for CO2-to-methanol datasets.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


current_dataframe: pd.DataFrame | None = None
current_metadata: dict[str, Any] = {}
current_filename: str | None = None


class RankRequest(BaseModel):
    scenario: str = "overall"


class DatasetSelectRequest(BaseModel):
    filename: str


def _json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, (np.integer, np.floating)):
        value = float(value)
    if isinstance(value, float) and np.isnan(value):
        return None
    return value


def _get_dataframe() -> pd.DataFrame:
    global current_dataframe
    if current_dataframe is not None and not current_dataframe.empty:
        return current_dataframe
    raise HTTPException(status_code=404, detail="Please upload or select a dataset first.")


def _range_summary(df: pd.DataFrame, column: str) -> dict[str, float | None]:
    if column not in df.columns:
        return {"min": None, "max": None}
    numeric = pd.to_numeric(df[column], errors="coerce").dropna()
    if numeric.empty:
        return {"min": None, "max": None}
    return {"min": round(float(numeric.min()), 3), "max": round(float(numeric.max()), 3)}


def _dataset_summary(df: pd.DataFrame, filename: str | None = None) -> dict[str, Any]:
    numeric_fields = [
        column
        for column in df.columns
        if pd.api.types.is_numeric_dtype(pd.to_numeric(df[column], errors="coerce"))
        and pd.to_numeric(df[column], errors="coerce").notna().any()
    ]
    ranking = ScenarioRankingEngine(df).rank("overall", top_n=5)
    return {
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "number_of_catalysts": int(df["catalyst_name"].dropna().nunique())
        if "catalyst_name" in df.columns
        else 0,
        "available_numeric_fields": numeric_fields,
        "temperature_range": _range_summary(df, "temperature_c"),
        "pressure_range": _range_summary(df, "pressure_bar"),
        "conversion_range": _range_summary(df, "conversion_pct"),
        "selectivity_range": _range_summary(df, "selectivity_pct"),
        "column_names": list(df.columns),
        "top_catalysts": ranking["top_results"],
        "reaction_overview": get_or_create_summary(filename or "unknown", df),
    }


@app.get("/api")
def api_status() -> dict[str, Any]:
    return {
        "status": "ok",
        "message": "Catalyst recommendation API is running.",
        "dataset_loaded": current_dataframe is not None and not current_dataframe.empty,
    }


@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)) -> dict[str, Any]:
    global current_dataframe, current_metadata, current_filename

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".csv", ".xlsx", ".xls"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .csv, .xlsx, or .xls file.",
        )

    safe_name = Path(file.filename).name
    upload_path = UPLOAD_DIR / safe_name

    try:
        with upload_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        raw_df = read_uploaded_dataset(upload_path)
        if raw_df.empty:
            raise ValueError("The uploaded dataset is empty.")

        cleaned_df, metadata = process_dataset(raw_df)
        
        processed_file_path = DATA_DIR / f"processed_{upload_path.stem}.csv"
        cleaned_df.to_csv(processed_file_path, index=False)

        current_dataframe = cleaned_df
        current_metadata = metadata
        current_filename = safe_name

        response = {
            "message": "Dataset uploaded and processed successfully.",
            "filename": safe_name,
            "total_rows": int(raw_df.shape[0]),
            "total_columns": int(raw_df.shape[1]),
            "detected_columns": metadata["detected_columns"],
            "cleaned_columns": metadata["cleaned_columns"],
            "missing_value_summary": metadata["missing_value_summary"],
            "preview": dataframe_preview(cleaned_df),
            "summary": _dataset_summary(cleaned_df, safe_name),
        }
        return _json_safe(response)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - keep the API responsive for messy uploads.
        raise HTTPException(status_code=500, detail=f"Could not process dataset: {exc}") from exc
    finally:
        await file.close()


@app.get("/summary")
def summary() -> dict[str, Any]:
    df = _get_dataframe()
    return _json_safe(_dataset_summary(df, current_filename))


@app.post("/rank")
def rank_catalysts(request: RankRequest) -> dict[str, Any]:
    df = _get_dataframe()
    result = ScenarioRankingEngine(df).rank(request.scenario, top_n=10)
    return _json_safe(result)


@app.get("/datasets")
def list_datasets() -> dict[str, Any]:
    datasets = []
    for file in UPLOAD_DIR.iterdir():
        if file.is_file() and file.suffix.lower() in {".csv", ".xlsx", ".xls"}:
            datasets.append(file.name)
    return {"datasets": sorted(datasets)}


@app.post("/datasets/select")
def select_dataset(request: DatasetSelectRequest) -> dict[str, Any]:
    global current_dataframe, current_metadata, current_filename
    
    upload_path = UPLOAD_DIR / request.filename
    if not upload_path.exists():
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    processed_file_path = DATA_DIR / f"processed_{upload_path.stem}.csv"
    if processed_file_path.exists():
        cleaned_df = pd.read_csv(processed_file_path)
        current_dataframe = cleaned_df
        current_filename = request.filename
        return _json_safe({
            "message": "Dataset selected", 
            "summary": _dataset_summary(cleaned_df, request.filename)
        })
        
    raw_df = read_uploaded_dataset(upload_path)
    if raw_df.empty:
        raise HTTPException(status_code=400, detail="The uploaded dataset is empty.")
        
    cleaned_df, metadata = process_dataset(raw_df)
    cleaned_df.to_csv(processed_file_path, index=False)
    
    current_dataframe = cleaned_df
    current_metadata = metadata
    current_filename = request.filename
    return _json_safe({
        "message": "Dataset selected and processed", 
        "summary": _dataset_summary(cleaned_df, request.filename)
    })


@app.delete("/datasets/{filename}")
def delete_dataset(filename: str) -> dict[str, Any]:
    upload_path = UPLOAD_DIR / filename
    processed_path = DATA_DIR / f"processed_{Path(filename).stem}.csv"
    
    deleted = False
    if upload_path.exists():
        upload_path.unlink()
        deleted = True
    if processed_path.exists():
        processed_path.unlink()
        deleted = True
        
    if not deleted:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    return {"status": "ok", "message": f"Dataset {filename} deleted."}


@app.get("/processed-data")
def processed_data() -> dict[str, Any]:
    df = _get_dataframe()
    records = df.replace({np.nan: None}).to_dict(orient="records")
    return {"rows": _json_safe(records), "total_rows": len(records)}


@app.get("/download/processed")
def download_processed_dataset() -> FileResponse:
    # Deprecated/removed since there is no single PROCESSED_PATH
    raise HTTPException(status_code=404, detail="Endpoint removed. Please use specific dataset download if needed.")


if FRONTEND_DIST_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR, html=True), name="frontend")
