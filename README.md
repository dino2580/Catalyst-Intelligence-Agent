# Scenario-Based Catalyst Recommendation System for CO2 to Methanol

A complete college/research demo web application for uploading raw catalyst datasets, cleaning inconsistent catalyst and reaction-condition columns, ranking catalysts under scenario-specific assumptions, and answering dataset-bound chatbot questions.

This is a scenario-based ranking system, not a large-scale deep learning model. The chatbot is rule-based and uses only the currently uploaded dataset.

## Features

- Upload `.csv`, `.xlsx`, or `.xls` catalyst datasets.
- Detect messy patent-style columns such as catalyst, support, promoter, temperature, pressure, conversion, selectivity, yield, productivity, stability, patent/source, and evidence.
- Normalize values such as `250 C`, `250°C`, `200-300`, `3.0 MPa`, `30 bar`, and `>=90%`.
- Save the cleaned dataset to `backend/data/processed_dataset.csv`.
- Rank catalysts for:
  - Best overall
  - High temperature allowed
  - Mild conditions
  - Maximum CO2 conversion
  - Maximum methanol selectivity
  - Low pressure
  - Balanced conversion/selectivity
  - High productivity
  - Stable catalyst
- Ask rule-based chatbot questions using only uploaded data.
- View ranking table, score chart, confidence badge, evidence rows, detected column mapping, and missing-value summary.
- Download processed dataset and scenario ranking CSV.

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- Axios
- Recharts
- Lucide React

Backend:

- Python
- FastAPI
- Pandas
- OpenPyXL
- Uvicorn

Storage:

- Uploaded files in `backend/uploads/`
- Current processed data in memory
- Processed CSV saved at `backend/data/processed_dataset.csv`

## Folder Structure

```text
catalyst-recommendation-app/
├── backend/
│   ├── main.py
│   ├── ranking_engine.py
│   ├── data_processor.py
│   ├── chatbot_engine.py
│   ├── requirements.txt
│   ├── uploads/
│   └── data/
│       ├── processed_dataset.csv
│       └── sample_catalyst_dataset.csv
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       ├── components/
│       └── styles/
└── README.md
```

## Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Sample Dataset

A sample CSV is included at:

```text
backend/data/sample_catalyst_dataset.csv
```

It contains 8 catalyst rows with catalyst name, temperature, pressure, conversion, selectivity, yield, productivity, stability, patent/source, and evidence text.

## Example Chatbot Questions

- Which is the best catalyst overall?
- Which catalyst is best if high temperature is not an issue?
- Which catalyst is best under mild conditions?
- Which catalyst gives maximum CO2 conversion?
- Which catalyst gives maximum methanol selectivity?
- Which catalyst works best at low pressure?
- Which catalyst has best balance of conversion and selectivity?
- Which catalyst has the best productivity?
- Which catalyst is most stable?

## Scenario Scoring

All numeric performance fields are normalized between 0 and 1. Missing normalized values are safely filled with 0. Temperature and pressure penalties are normalized so harsher conditions receive larger penalties.

Overall:

```text
0.35 conversion
+ 0.35 selectivity
+ 0.15 yield
+ 0.05 productivity
+ 0.10 data quality
- 0.05 temperature penalty
- 0.05 pressure penalty
```

Mild conditions:

```text
0.25 conversion
+ 0.35 selectivity
+ 0.10 yield
+ 0.10 productivity
+ 0.10 data quality
- 0.15 temperature penalty
- 0.15 pressure penalty
```

Stable catalyst:

```text
0.25 conversion
+ 0.25 selectivity
+ 0.30 stability text score
+ 0.10 yield
+ 0.10 data quality
```

Other scenarios adjust the weights toward maximum conversion, maximum selectivity, low pressure, balanced performance, high productivity, or high-temperature operation.

## Notes and Limitations

- The chatbot is deterministic and rule-based. No external LLM API is used.
- Recommendations are only as reliable as the uploaded dataset.
- Column detection uses keyword/fuzzy matching and may need clearer column names for highly unusual datasets.
- The system does not perform chemistry validation; it ranks rows using the selected scenario scoring logic.
- For `.xls` files, the backend uses `xlrd` because OpenPyXL supports `.xlsx` but not old `.xls` files.
