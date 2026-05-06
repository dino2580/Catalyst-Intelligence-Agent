from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


SCENARIO_LABELS = {
    "overall": "Best Overall",
    "high_temperature_allowed": "High Temperature Allowed",
    "mild_conditions": "Mild Conditions",
    "max_conversion": "Maximum CO2 Conversion",
    "max_selectivity": "Maximum Methanol Selectivity",
    "low_pressure": "Low Pressure",
    "balanced_conversion_selectivity": "Balanced Conversion and Selectivity",
    "low_temperature": "Low Temperature",
    "stable_catalyst": "Stable Catalyst",
}


@dataclass(frozen=True)
class ScenarioConfig:
    weights: dict[str, float]
    explanation: str
    logic_details: str
    required_fields: tuple[str, ...]


SCENARIO_CONFIGS: dict[str, ScenarioConfig] = {
    "overall": ScenarioConfig(
        weights={
            "conversion_norm": 0.35,
            "selectivity_norm": 0.35,
            "yield_norm": 0.15,
            "productivity_norm": 0.05,
            "data_quality_score": 0.10,
            "temperature_penalty": -0.05,
            "pressure_penalty": -0.05,
        },
        explanation=(
            "Overall ranking rewards conversion, methanol selectivity, yield, productivity, "
            "and data completeness while lightly penalizing harsher temperature and pressure."
        ),
        logic_details=(
            "This scenario uses a balanced weighting of all performance metrics. It prioritizes "
            "Conversion and Selectivity equally (35% each) as they are the primary indicators of "
            "catalyst efficiency. Temperature and Pressure are given low penalty weights (-5%) "
            "to ensure they don't overshadow high performance, while still favoring more practical "
            "conditions. Secondary metrics like Yield and Productivity are included to break ties."
        ),
        required_fields=("conversion_pct", "selectivity_pct"),
    ),
    "high_temperature_allowed": ScenarioConfig(
        weights={
            "conversion_norm": 0.40,
            "selectivity_norm": 0.35,
            "yield_norm": 0.15,
            "productivity_norm": 0.05,
            "data_quality_score": 0.05,
            "pressure_penalty": -0.03,
        },
        explanation=(
            "This scenario does not penalize high reaction temperature and focuses on "
            "conversion, selectivity, yield, productivity, and pressure practicality."
        ),
        logic_details=(
            "Temperature penalties are completely removed here because the focus is on raw "
            "chemical performance regardless of heat requirements. Pressure is still lightly "
            "penalized (-3%) as high-pressure equipment remains a cost factor. Conversion is "
            "weighted higher (40%) to reward catalysts that push the thermodynamic limits."
        ),
        required_fields=("conversion_pct", "selectivity_pct"),
    ),
    "mild_conditions": ScenarioConfig(
        weights={
            "conversion_norm": 0.25,
            "selectivity_norm": 0.35,
            "yield_norm": 0.10,
            "productivity_norm": 0.10,
            "data_quality_score": 0.10,
            "temperature_penalty": -0.15,
            "pressure_penalty": -0.15,
        },
        explanation=(
            "Mild-condition ranking strongly penalizes higher temperature and pressure "
            "while still rewarding strong methanol selectivity and useful conversion."
        ),
        logic_details=(
            "Operational sustainability is the priority. Temperature and Pressure penalties are "
            "increased significantly (-15% each) to filter out catalysts that only perform under "
            "extreme conditions. Conversion weight is lowered (25%) because high conversion is "
            "often traded off for lower temperatures in industrial pilot settings."
        ),
        required_fields=("conversion_pct", "selectivity_pct", "temperature_c", "pressure_bar"),
    ),
    "max_conversion": ScenarioConfig(
        weights={
            "conversion_norm": 0.80,
            "selectivity_norm": 0.10,
            "yield_norm": 0.05,
            "data_quality_score": 0.05,
        },
        explanation="This ranking mainly selects catalysts with the highest CO2 conversion.",
        logic_details=(
            "Single-metric focus: 80% weight is placed on Conversion. Selectivity and Yield are "
            "kept as minor factors (10%, 5%) just to provide context. Operational factors like "
            "Temp/Pressure are ignored (0% weight) to ensure the ranking reflects the absolute "
            "maximum conversion potential of the catalyst material."
        ),
        required_fields=("conversion_pct",),
    ),
    "max_selectivity": ScenarioConfig(
        weights={
            "selectivity_norm": 0.80,
            "conversion_norm": 0.10,
            "yield_norm": 0.05,
            "data_quality_score": 0.05,
        },
        explanation="This ranking mainly selects catalysts with the highest methanol selectivity.",
        logic_details=(
            "Single-metric focus: 80% weight is placed on Selectivity. Conversion and Yield are "
            "minor factors. Penalties are removed to identify catalysts with perfect product "
            "specificity, which is critical for reducing downstream separation costs."
        ),
        required_fields=("selectivity_pct",),
    ),
    "low_pressure": ScenarioConfig(
        weights={
            "conversion_norm": 0.30,
            "selectivity_norm": 0.35,
            "yield_norm": 0.10,
            "data_quality_score": 0.10,
            "pressure_penalty": -0.25,
        },
        explanation=(
            "Low-pressure ranking penalizes high pressure heavily while keeping conversion "
            "and selectivity central to the recommendation."
        ),
        logic_details=(
            "The Pressure penalty is maximized (-25%) to prioritize catalysts that work at "
            "near-ambient or low industrial pressures. Temperature is ignored to isolate the "
            "pressure-dependent performance. Conversion and Selectivity remain important (30%, 35%) "
            "to ensure the chosen catalysts are still productive at low pressure."
        ),
        required_fields=("conversion_pct", "selectivity_pct", "pressure_bar"),
    ),
    "balanced_conversion_selectivity": ScenarioConfig(
        weights={
            "conversion_norm": 0.45,
            "selectivity_norm": 0.45,
            "data_quality_score": 0.10,
        },
        explanation=(
            "Balanced ranking gives equal priority to CO2 conversion and methanol selectivity, "
            "with a small data-quality contribution."
        ),
        logic_details=(
            "To maximize Yield indirectly, we place equal 45% weights on both Conversion and "
            "Selectivity. All other factors (Temp, Pressure, Productivity) are ignored (0%) to "
            "provide a pure 'chemistry-first' ranking based on the two core efficiency metrics."
        ),
        required_fields=("conversion_pct", "selectivity_pct"),
    ),
    "low_temperature": ScenarioConfig(
        weights={
            "conversion_norm": 0.30,
            "selectivity_norm": 0.35,
            "yield_norm": 0.10,
            "data_quality_score": 0.10,
            "temperature_penalty": -0.25,
        },
        explanation=(
            "Low-temperature ranking penalizes high temperature heavily to find catalysts "
            "that operate efficiently under thermal constraints."
        ),
        logic_details=(
            "The Temperature penalty is maximized (-25%) to identify catalysts that maintain "
            "high conversion and selectivity at the lower end of the experimental range. "
            "Pressure is ignored to isolate the temperature-dependent performance. Conversion "
            "and Selectivity remain central (30%, 35%) to ensure the chosen catalysts are "
            "still efficient at lower heat."
        ),
        required_fields=("conversion_pct", "selectivity_pct", "temperature_c"),
    ),
    "stable_catalyst": ScenarioConfig(
        weights={
            "conversion_norm": 0.25,
            "selectivity_norm": 0.25,
            "stability_score": 0.30,
            "yield_norm": 0.10,
            "data_quality_score": 0.10,
        },
        explanation=(
            "Stable-catalyst ranking uses stability/deactivation text where available, "
            "then combines it with conversion, selectivity, yield, and data quality."
        ),
        logic_details=(
            "Stability/Deactivation keywords are analyzed and given a high 30% weight. This "
            "favors catalysts that mention being 'stable' or 'long-term' over those with "
            "higher raw conversion but reported deactivation. Yield and Quality break ties, "
            "ensuring the stable catalyst is also efficient."
        ),
        required_fields=("stability_text",),
    ),
}


class ScenarioRankingEngine:
    def __init__(self, dataframe: pd.DataFrame):
        self.df = dataframe.copy()

    def rank(self, scenario: str = "overall", top_n: int = 10) -> dict[str, Any]:
        scenario_key = scenario if scenario in SCENARIO_CONFIGS else "overall"
        config = SCENARIO_CONFIGS[scenario_key]

        scored = self._prepare_features(self.df)
        scored["scenario_score"] = 0.0
        for feature, weight in config.weights.items():
            if feature not in scored.columns:
                scored[feature] = 0.0
            scored["scenario_score"] += scored[feature].fillna(0) * weight

        scored["scenario_score"] = scored["scenario_score"].clip(lower=0, upper=1).round(4)
        scored = scored.sort_values(
            by=["scenario_score", "conversion_pct", "selectivity_pct"],
            ascending=[False, False, False],
            na_position="last",
        ).head(top_n)
        scored = scored.reset_index(drop=True)
        scored["rank"] = scored.index + 1

        top_results = [self._row_to_result(row) for _, row in scored.iterrows()]
        best = top_results[0] if top_results else None

        return {
            "scenario": scenario_key,
            "scenario_label": SCENARIO_LABELS[scenario_key],
            "weights_used": config.weights,
            "top_results": top_results,
            "explanation": config.explanation,
            "logic_details": config.logic_details,
            "best_catalyst": best,
            "evidence_rows": top_results[:3],
            "missing_fields": self._missing_fields(config.required_fields),
        }

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        prepared = df.copy()
        prepared["conversion_norm"] = self._normalize_high(prepared.get("conversion_pct"))
        prepared["selectivity_norm"] = self._normalize_high(prepared.get("selectivity_pct"))
        prepared["yield_norm"] = self._normalize_high(prepared.get("yield_pct"))
        prepared["productivity_norm"] = self._normalize_high(prepared.get("productivity"))
        prepared["temperature_penalty"] = self._normalize_high(prepared.get("temperature_c"))
        prepared["pressure_penalty"] = self._normalize_high(prepared.get("pressure_bar"))
        prepared["data_quality_score"] = pd.to_numeric(
            prepared.get("data_quality_score", 0), errors="coerce"
        ).fillna(0)
        prepared["stability_score"] = prepared.get("stability_text", pd.Series(dtype=str)).apply(
            self._score_stability_text
        )
        return prepared

    @staticmethod
    def _normalize_high(series: pd.Series | None) -> pd.Series:
        if series is None:
            return pd.Series(dtype=float)

        numeric = pd.to_numeric(series, errors="coerce")
        result = pd.Series(0.0, index=numeric.index)
        non_null = numeric.dropna()
        if non_null.empty:
            return result

        min_value = non_null.min()
        max_value = non_null.max()
        if np.isclose(max_value, min_value):
            result.loc[non_null.index] = 1.0
            return result

        result.loc[non_null.index] = (non_null - min_value) / (max_value - min_value)
        return result.clip(0, 1).fillna(0)

    @staticmethod
    def _score_stability_text(value: Any) -> float:
        if value is None or (isinstance(value, float) and np.isnan(value)):
            return 0.0

        text = str(value).lower()
        positive_terms = [
            "stable",
            "no deactivation",
            "long-term",
            "long term",
            "maintained",
            "durable",
            "no loss",
            "steady",
            "sustained",
        ]
        negative_terms = [
            "deactivation",
            "loss",
            "decline",
            "unstable",
            "decrease",
            "dropped",
            "decay",
        ]

        positive = any(term in text for term in positive_terms)
        negative = any(term in text for term in negative_terms)

        if positive and not negative:
            return 1.0
        if positive and negative:
            return 0.65
        if negative:
            return 0.2
        return 0.45

    def _missing_fields(self, required_fields: tuple[str, ...]) -> list[str]:
        missing = []
        for field in required_fields:
            if field not in self.df.columns or self.df[field].dropna().empty:
                missing.append(field)
        return missing

    @staticmethod
    def _clean_value(value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, float) and np.isnan(value):
            return None
        if isinstance(value, (np.integer, np.floating)):
            return float(value)
        return value

    @classmethod
    def _row_to_result(cls, row: pd.Series) -> dict[str, Any]:
        quality = cls._clean_value(row.get("data_quality_score"))
        if quality is None:
            badge = "Low confidence"
        elif quality >= 0.8:
            badge = "High confidence"
        elif quality >= 0.55:
            badge = "Medium confidence"
        else:
            badge = "Low confidence"

        fields = [
            "rank",
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
            "scenario_score",
            "conversion_norm",
            "selectivity_norm",
            "yield_norm",
            "productivity_norm",
            "temperature_penalty",
            "pressure_penalty",
            "stability_score",
        ]
        result = {field: cls._clean_value(row.get(field)) for field in fields}
        result["confidence_badge"] = badge
        return result
