# Entity Coherence Engine for AI Search

## Proof of Concept

A locally executed semantic intelligence engine that analyzes entity coverage, topic gaps, and competitive dominance between your content and competitor pages — without using external AI APIs.

---

## Why This Tool Exists

Modern AI-search systems (LLM-based answer engines, entity graphs, semantic retrieval layers) prioritize:

- Entity density
- Topic completeness
- Concept clustering
- Structured semantic coverage

Most SEO tools still focus on keywords.

This tool focuses on **entity coherence and semantic dominance.**

---

## Core Problem

When AI systems generate answers, they don’t rank pages by keyword frequency.

They prioritize:
- Concept coverage
- Structured topical depth
- Competitive semantic gaps

Content creators currently lack a lightweight way to:

- Measure entity cluster gaps
- Quantify semantic authority
- Detect competitor-dominant topic clusters
- Track topic-level trend performance over time

This proof of concept demonstrates that capability.

---

## What It Does

### 1️⃣ Extracts Concept Clusters
- Scrapes page paragraphs
- Uses NLP (spaCy)
- Builds head-word semantic clusters

### 2️⃣ Computes Semantic Metrics
- Gap Score
- Competitive Dominance
- Authority Weight
- Cluster Importance
- Severity Level
- Intent Classification

### 3️⃣ Generates Executive Summary
- Semantic Authority Index
- Competitive Dominance Index
- High Risk Clusters
- Opportunity Clusters

### 4️⃣ Trend Tracking
Stores audit snapshots and shows historical semantic gap performance.

### 5️⃣ PDF Report Export
Exports cluster intelligence breakdown as a downloadable report.

---

## Tech Stack

Frontend:
- React
- TypeScript
- TailwindCSS
- Custom SVG Trend Chart

Backend:
- Node.js
- Express
- PostgreSQL
- Python (spaCy NLP engine)

No external AI APIs used.

All scoring logic is deterministic and local.

---

## Architecture Overview

User → React UI  
→ Express API  
→ Python NLP Engine  
→ PostgreSQL storage  
→ Semantic Scoring + Cluster Intelligence  
→ Executive Dashboard  

This separation allows future replacement of:
- NLP engine with embeddings
- Deterministic scoring with ML-based scoring
- Static cluster similarity with vector search

---

## How To Run Locally

### 1️⃣ Install Dependencies
- npm install
- pip install -r engine/requirements.txt


### 2️⃣ Setup Database

Create PostgreSQL database and update `.env`.

Then:

node server/init-db.js


### 3️⃣ Run Backend

node server/index.js


### 4️⃣ Run Frontend

npm run dev

---

## Benefits

- AI-search oriented (not keyword SEO)
- Transparent scoring logic
- Fully local execution
- No API cost
- No dependency on external LLMs
- Structured semantic gap detection
- Competitive dominance visualization
- Historical topic tracking

---

## Who This Is For

- Technical SEO engineers
- AI-search researchers
- Content strategists
- Developers building retrieval systems
- Portfolio demonstration of applied NLP engineering

---

## Limitations (Intentional for POC)

- Uses spaCy noun chunk clustering (not embeddings)
- Deterministic scoring
- Basic intent classifier
- No distributed crawling
- No production auth layer

---

## Future Additions

- Vector embeddings for semantic similarity
- Multi-page crawl analysis
- SERP API integration
- AI-generated strategic recommendations
- Entity graph visualization
- Multi-competitor weighting models
- Cluster similarity heatmaps
- Deployment as SaaS dashboard

---

## Why This Matters

As AI-search replaces traditional SERPs, content evaluation must shift from keywords to semantic coherence.

This proof of concept demonstrates:

Entity-based competitive intelligence can be engineered without proprietary AI APIs.

---

## Author

Built as a semantic intelligence proof-of-concept demonstrating applied NLP engineering for AI-search era content evaluation.
