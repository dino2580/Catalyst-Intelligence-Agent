from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


STANDARD_COLUMNS = [
    "catalyst_name",
    "support",
    "promoter",
    "temperature_c",
    "pressure_bar",
    "ghsv",
    "h2_co2_ratio",
    "conversion_pct",
    "selectivity_pct",
    "yield_pct",
    "productivity",
    "stability_text",
    "patent_number",
    "evidence",
    "original_row_index",
    "data_quality_score",
]


COLUMN_KEYWORDS: dict[str, list[str]] = {
    "catalyst_name": [
        "catalyst",
        "catalyst name",
        "catalyst composition",
        "composition",
        "material",
    ],
    "support": ["support", "support material", "catalyst support"],
    "promoter": ["promoter", "dopant", "modifier", "additive"],
    "temperature_c": [
        "temperature",
        "temp",
        "reaction temperature",
        "temperature c",
        "temp c",
        "reaction temp",
    ],
    "pressure_bar": ["pressure", "reaction pressure", "bar", "mpa", "atm"],
    "ghsv": [
        "ghsv",
        "lhsv",
        "gas hourly space velocity",
        "liquid hourly space velocity",
        "space velocity",
        "flow rate",
    ],
    "h2_co2_ratio": [
        "h2 co2 ratio",
        "h2/co2",
        "h2:co2",
        "h2 to co2",
        "hydrogen co2 ratio",
        "feed ratio",
    ],
    "conversion_pct": [
        "conversion",
        "co2 conversion",
        "co2_conversion",
        "co2 conversion %",
        "carbon dioxide conversion",
    ],
    "selectivity_pct": [
        "selectivity",
        "methanol selectivity",
        "meoh selectivity",
        "ch3oh selectivity",
        "methanol sel",
    ],
    "yield_pct": ["yield", "methanol yield", "meoh yield", "ch3oh yield"],
    "productivity": [
        "productivity",
        "sty",
        "space time yield",
        "space-time yield",
        "methanol productivity",
    ],
    "stability_text": [
        "stability",
        "deactivation",
        "time on stream",
        "tos",
        "durability",
    ],
    "patent_number": ["patent", "patent number", "source", "document", "reference"],
    "evidence": ["evidence", "extracted text", "remarks", "notes", "observation"],
}


TEXT_COLUMNS = {
    "catalyst_name",
    "support",
    "promoter",
    "stability_text",
    "patent_number",
    "evidence",
}


def normalize_header(value: Any) -> str:
    """Make raw column names comparable without hiding their meaning."""
    text = str(value).lower()
    replacements = {
        "co₂": "co2",
        "ch₃oh": "ch3oh",
        "h₂": "h2",
        "°": " ",
        "%": " percent ",
        "_": " ",
        "-": " ",
        "/": " ",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _match_score(column_name: Any, keyword: str) -> float:
    header = normalize_header(column_name)
    key = normalize_header(keyword)
    if not header or not key:
        return 0
    if header == key:
        return 100

    header_tokens = set(header.split())
    key_tokens = set(key.split())

    if key in header:
        if len(key) <= 3 and key not in header_tokens:
            return 0
        return 92 if len(key_tokens) > 1 else 78

    if header in key and len(header) > 3:
        return 68

    overlap = header_tokens.intersection(key_tokens)
    if not overlap:
        return 0

    precision = len(overlap) / max(len(header_tokens), 1)
    recall = len(overlap) / max(len(key_tokens), 1)
    return 55 * precision + 35 * recall


def detect_column_mapping(df: pd.DataFrame) -> dict[str, str]:
    mapping: dict[str, str] = {}
    used_columns: set[str] = set()

    # More specific fields get first choice of ambiguous columns.
    detection_order = [
        "h2_co2_ratio",
        "selectivity_pct",
        "conversion_pct",
        "yield_pct",
        "productivity",
        "temperature_c",
        "pressure_bar",
        "stability_text",
        "patent_number",
        "evidence",
        "promoter",
        "support",
        "ghsv",
        "catalyst_name",
    ]

    for standard_name in detection_order:
        best_column = None
        best_score = 0.0
        for column in df.columns:
            if str(column) in used_columns:
                continue
            score = max(
                _match_score(column, keyword)
                for keyword in COLUMN_KEYWORDS.get(standard_name, [])
            )
            if score > best_score:
                best_column = column
                best_score = score

        if best_column is not None and best_score >= 55:
            mapping[standard_name] = str(best_column)
            used_columns.add(str(best_column))

    return mapping


def _is_missing_text(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and np.isnan(value):
        return True
    text = str(value).strip().lower()
    return text in {
        "",
        "-",
        "--",
        "nan",
        "none",
        "null",
        "n/a",
        "na",
        "not available",
        "not reported",
        "nr",
    }


def _clean_text(value: Any) -> Any:
    if _is_missing_text(value):
        return np.nan
    text = re.sub(r"\s+", " ", str(value).strip())
    return text if text else np.nan


def extract_number(value: Any) -> float:
    if value is None:
        return np.nan
    if isinstance(value, (int, float, np.integer, np.floating)):
        return float(value) if not pd.isna(value) else np.nan

    text = str(value).strip().replace(",", "")
    if _is_missing_text(text):
        return np.nan

    range_match = re.search(
        r"([-+]?\d*\.?\d+)\s*(?:-|–|—|\bto\b)\s*([-+]?\d*\.?\d+)",
        text,
        flags=re.IGNORECASE,
    )
    if range_match:
        low, high = float(range_match.group(1)), float(range_match.group(2))
        return (low + high) / 2

    numbers = re.findall(r"[-+]?\d*\.?\d+", text)
    if not numbers:
        return np.nan
    return float(numbers[0])


def _number_before_unit(text: str, unit_pattern: str) -> float:
    match = re.search(
        r"([-+]?\d*\.?\d+(?:\s*(?:-|–|—|\bto\b)\s*[-+]?\d*\.?\d+)?)\s*"
        + unit_pattern,
        text,
        flags=re.IGNORECASE,
    )
    if not match:
        return np.nan
    return extract_number(match.group(1))


def convert_pressure_to_bar(value: Any) -> float:
    if value is None:
        return np.nan
    if isinstance(value, (int, float, np.integer, np.floating)):
        return float(value) if not pd.isna(value) else np.nan

    text = str(value).strip().replace(",", "")
    if _is_missing_text(text):
        return np.nan

    lower = text.lower()

    bar_value = _number_before_unit(lower, r"bar\b")
    if not pd.isna(bar_value):
        return bar_value

    mpa_value = _number_before_unit(lower, r"mpa\b")
    if not pd.isna(mpa_value):
        return mpa_value * 10

    kpa_value = _number_before_unit(lower, r"kpa\b")
    if not pd.isna(kpa_value):
        return kpa_value / 100

    atm_value = _number_before_unit(lower, r"atm\b|atmosphere")
    if not pd.isna(atm_value):
        return atm_value * 1.01325

    return extract_number(lower)


def normalize_percent(value: Any) -> float:
    return extract_number(value)


def extract_ratio(value: Any) -> float:
    if value is None:
        return np.nan
    if isinstance(value, (int, float, np.integer, np.floating)):
        return float(value) if not pd.isna(value) else np.nan

    text = str(value).strip().lower().replace(",", "")
    if _is_missing_text(text):
        return np.nan

    text_without_formula = re.sub(r"h\s*2\s*[/:\-]?\s*co\s*2", "ratio", text)
    ratio_match = re.search(r"(\d*\.?\d+)\s*[:/]\s*(\d*\.?\d+)", text_without_formula)
    if ratio_match:
        numerator = float(ratio_match.group(1))
        denominator = float(ratio_match.group(2))
        return numerator / denominator if denominator else np.nan

    return extract_number(text_without_formula)


def _series_from_mapping(df: pd.DataFrame, mapping: dict[str, str], standard_name: str) -> pd.Series:
    raw_column = mapping.get(standard_name)
    if raw_column and raw_column in df.columns:
        return df[raw_column]
    return pd.Series([np.nan] * len(df), index=df.index)


def _scale_fraction_percent(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce")
    non_null = numeric.dropna()
    if non_null.empty:
        return numeric
    if non_null.max() <= 1.0 and non_null.min() >= 0:
        return numeric * 100
    return numeric


def _calculate_data_quality(cleaned: pd.DataFrame) -> pd.Series:
    source_present = cleaned["evidence"].notna() | cleaned["patent_number"].notna()
    score = (
        cleaned["catalyst_name"].notna().astype(float) * 0.20
        + cleaned["conversion_pct"].notna().astype(float) * 0.20
        + cleaned["selectivity_pct"].notna().astype(float) * 0.20
        + cleaned["temperature_c"].notna().astype(float) * 0.15
        + cleaned["pressure_bar"].notna().astype(float) * 0.15
        + source_present.astype(float) * 0.10
    )
    return score.clip(0, 1).round(3)


def create_standard_columns(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, str]]:
    if df.empty:
        raise ValueError("The uploaded dataset is empty.")

    mapping = detect_column_mapping(df)
    cleaned = pd.DataFrame(index=df.index)

    for column_name in TEXT_COLUMNS:
        cleaned[column_name] = _series_from_mapping(df, mapping, column_name).apply(_clean_text)

    cleaned["temperature_c"] = pd.to_numeric(
        _series_from_mapping(df, mapping, "temperature_c").apply(extract_number),
        errors="coerce",
    )
    cleaned["pressure_bar"] = pd.to_numeric(
        _series_from_mapping(df, mapping, "pressure_bar").apply(convert_pressure_to_bar),
        errors="coerce",
    )
    cleaned["ghsv"] = pd.to_numeric(
        _series_from_mapping(df, mapping, "ghsv").apply(extract_number),
        errors="coerce",
    )
    cleaned["h2_co2_ratio"] = pd.to_numeric(
        _series_from_mapping(df, mapping, "h2_co2_ratio").apply(extract_ratio),
        errors="coerce",
    )

    for percent_column in ["conversion_pct", "selectivity_pct", "yield_pct"]:
        cleaned[percent_column] = _scale_fraction_percent(
            _series_from_mapping(df, mapping, percent_column).apply(normalize_percent)
        )

    cleaned["productivity"] = pd.to_numeric(
        _series_from_mapping(df, mapping, "productivity").apply(extract_number),
        errors="coerce",
    )
    cleaned["original_row_index"] = df.index.astype(int) + 1

    if "catalyst_name" not in mapping or cleaned["catalyst_name"].dropna().empty:
        raise ValueError(
            "No catalyst name/composition column was detected. Include a column such as "
            "'Catalyst', 'Catalyst name', 'Composition', or 'Material'."
        )

    performance_columns = ["conversion_pct", "selectivity_pct", "yield_pct", "productivity"]
    if all(cleaned[column].dropna().empty for column in performance_columns):
        raise ValueError(
            "Your dataset was uploaded, but no conversion/selectivity/yield/productivity "
            "columns were detected. Please check column names or include performance fields."
        )

    cleaned["data_quality_score"] = _calculate_data_quality(cleaned)
    cleaned = cleaned[STANDARD_COLUMNS]

    return cleaned, mapping


def read_uploaded_dataset(file_path: str | Path) -> pd.DataFrame:
    path = Path(file_path)
    suffix = path.suffix.lower()
    try:
        if suffix == ".csv":
            try:
                return pd.read_csv(path)
            except UnicodeDecodeError:
                return pd.read_csv(path, encoding="latin-1")
        if suffix == ".xlsx":
            return pd.read_excel(path, engine="openpyxl")
        if suffix == ".xls":
            return pd.read_excel(path, engine="xlrd")
    except Exception as exc:  # noqa: BLE001 - convert parser details into API-safe text.
        raise ValueError(f"Could not parse uploaded file: {exc}") from exc

    raise ValueError("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.")


def process_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    cleaned, mapping = create_standard_columns(df)
    metadata = {
        "detected_columns": mapping,
        "cleaned_columns": list(cleaned.columns),
        "missing_value_summary": {
            column: int(count) for column, count in cleaned.isna().sum().to_dict().items()
        },
    }
    return cleaned, metadata


def dataframe_preview(df: pd.DataFrame, rows: int = 5) -> list[dict[str, Any]]:
    preview = df.head(rows).replace({np.nan: None})
    return preview.to_dict(orient="records")
