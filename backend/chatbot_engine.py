from __future__ import annotations

from typing import Any

import pandas as pd

from ranking_engine import ScenarioRankingEngine


def detect_scenario(message: str) -> str:
    text = message.lower()

    if any(term in text for term in ["low temperature", "cold", "minimal heat", "lower temp"]):
        return "low_temperature"
    if any(term in text for term in ["stable", "stability", "deactivation", "durable"]):
        return "stable_catalyst"
    if any(term in text for term in ["maximum conversion", "highest conversion", "best conversion"]):
        return "max_conversion"
    if any(term in text for term in ["maximum selectivity", "highest selectivity", "best selectivity"]):
        return "max_selectivity"
    if any(term in text for term in ["balance", "balanced", "conversion and selectivity"]):
        return "balanced_conversion_selectivity"
    if any(
        term in text
        for term in [
            "temperature not issue",
            "high temperature",
            "temperature is not a problem",
            "can maintain high temperature",
            "temperature not a problem",
        ]
    ):
        return "high_temperature_allowed"
    if "low pressure" in text or "pressure not high" in text:
        if any(term in text for term in ["mild", "easy condition", "less energy", "low temperature"]):
            return "mild_conditions"
        return "low_pressure"
    if any(term in text for term in ["mild", "low temperature", "easy condition", "less energy"]):
        return "mild_conditions"
    if any(term in text for term in ["overall", "best catalyst", "best overall"]):
        return "overall"
    return "overall"


def _fmt(value: Any, suffix: str = "", digits: int = 2) -> str:
    if value is None:
        return "not reported"
    if isinstance(value, float):
        return f"{value:.{digits}f}{suffix}"
    return f"{value}{suffix}"


def _short_result(result: dict[str, Any]) -> str:
    return (
        f"{result.get('rank')}. {result.get('catalyst_name', 'Unknown catalyst')} "
        f"(score {_fmt(result.get('scenario_score'), digits=3)}, "
        f"conversion {_fmt(result.get('conversion_pct'), '%')}, "
        f"selectivity {_fmt(result.get('selectivity_pct'), '%')})"
    )


def answer_question(message: str, dataframe: pd.DataFrame | None) -> dict[str, Any]:
    if dataframe is None or dataframe.empty:
        return {
            "answer": "Please upload a dataset first.",
            "scenario": None,
            "best": None,
            "top_results": [],
        }

    scenario = detect_scenario(message)
    ranking = ScenarioRankingEngine(dataframe).rank(scenario=scenario, top_n=10)
    best = ranking["best_catalyst"]

    if not best:
        return {
            "answer": (
                "I could not rank catalysts from the current dataset. Please check that the "
                "uploaded file contains catalyst names and at least one performance field."
            ),
            "scenario": scenario,
            "best": None,
            "top_results": [],
        }

    missing_note = ""
    if ranking.get("missing_fields"):
        missing = ", ".join(ranking["missing_fields"])
        missing_note = (
            f"\n\nData note: This scenario is missing one or more preferred fields: {missing}. "
            "The ranking still used the available uploaded data."
        )

    alternatives = ranking["top_results"][1:4]
    alternative_text = "\n".join(_short_result(item) for item in alternatives) or "No alternatives available."

    answer = f"""Based on the uploaded dataset, the best catalyst for this scenario is:

Catalyst: {best.get("catalyst_name", "Unknown catalyst")}
Scenario detected: {ranking["scenario_label"]}

Reason:
- CO2 conversion: {_fmt(best.get("conversion_pct"), "%")}
- Methanol selectivity: {_fmt(best.get("selectivity_pct"), "%")}
- Methanol yield: {_fmt(best.get("yield_pct"), "%")}
- Temperature: {_fmt(best.get("temperature_c"), " °C")}
- Pressure: {_fmt(best.get("pressure_bar"), " bar")}
- Scenario score: {_fmt(best.get("scenario_score"), digits=3)}
- Confidence: {best.get("confidence_badge", "Low confidence")}

Top alternatives:
{alternative_text}

Note:
This recommendation is based only on the uploaded dataset and the selected scenario scoring logic.{missing_note}"""

    return {
        "answer": answer,
        "scenario": scenario,
        "best": best,
        "top_results": ranking["top_results"],
    }
