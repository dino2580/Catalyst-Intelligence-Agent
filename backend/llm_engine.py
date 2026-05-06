import os
import json
from pathlib import Path
import pandas as pd
from openai import OpenAI

# Define the storage directory for metadata
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

def get_or_create_summary(filename: str, df: pd.DataFrame) -> str:
    """
    Checks for a persistent summary in a sidecar metadata file.
    If not found, generates one via LLM and saves it for future use.
    """
    if not filename:
        return "Dataset summary not available."

    # Define metadata path based on original filename
    safe_stem = Path(filename).stem
    metadata_path = DATA_DIR / f"processed_{safe_stem}.metadata.json"

    # 1. Check if persistent summary exists
    if metadata_path.exists():
        try:
            with metadata_path.open("r") as f:
                metadata = json.load(f)
                if "reaction_overview" in metadata:
                    return metadata["reaction_overview"]
        except Exception as e:
            print(f"Error reading metadata for {filename}: {e}")

    # 2. If not found, generate it
    summary = _generate_llm_summary(filename, df)

    # 3. Save it for next time
    try:
        metadata = {}
        if metadata_path.exists():
            with metadata_path.open("r") as f:
                metadata = json.load(f)
        
        metadata["reaction_overview"] = summary
        
        with metadata_path.open("w") as f:
            json.dump(metadata, f, indent=4)
    except Exception as e:
        print(f"Error saving metadata for {filename}: {e}")

    return summary

def _generate_llm_summary(filename: str, df: pd.DataFrame) -> str:
    """Internal function to call the LLM or fallback to heuristic."""
    api_key = os.environ.get("OPENAI_API_KEY")
    
    if not api_key:
        # Scientific heuristic fallback
        cols = [c.lower() for c in df.columns]
        if "co2" in cols and "methanol" in cols:
            return "This dataset analyzes CO2 hydrogenation to methanol, a critical technology for carbon capture and sustainable energy production."
        if "propane" in cols and "propylene" in cols:
            return "This dataset investigates Propane Dehydrogenation (PDH), a process for converting propane into propylene for the chemical and plastics industries."
        return f"Catalyst performance analysis for a reaction involving {', '.join(df.columns[:3])}."

    try:
        client = OpenAI(api_key=api_key)
        headers = ", ".join(df.columns)
        sample_data = df.head(5).to_csv(index=False)
        
        prompt = f"""You are an advanced chemical engineering assistant. Analyze the following catalyst dataset:

File Name: {filename}
Headers: {headers}

Sample Data:
{sample_data}

Task: Write a concise 1-2 line summary of the chemical reaction being studied.
1. Identify specific reactants/products.
2. Explain industrial significance.
Use professional language. Limit to 1-2 sentences.
"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional chemical engineering expert."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.4
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM Error during generation for {filename}: {e}")
        return "Chemical catalyst analysis dataset. Detailed summary requires an active LLM connection."
