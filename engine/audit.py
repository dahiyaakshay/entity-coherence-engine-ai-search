import sys
import json
import requests
from bs4 import BeautifulSoup
import spacy
from collections import Counter, defaultdict
import re
from statistics import mean

# =========================================================
# Load spaCy
# =========================================================
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print(json.dumps({
        "error": "spaCy model not found. Run: python -m spacy download en_core_web_sm"
    }))
    sys.exit(1)

MIN_PARAGRAPH_LENGTH = 120
MIN_CLUSTER_FREQ = 6
MAX_CLUSTERS = 25

STOP_CLUSTER_WORDS = {
    "a","an","the","this","that","these","those",
    "way","time","year","month","thing","things",
    "people","content","example","examples",
    "addition","tools","developers","users",
    "information","details","overview","guide",
    "section","topic","article","page"
}

# =========================================================
# Utilities
# =========================================================

def scrape_paragraphs(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=15)
        r.raise_for_status()

        soup = BeautifulSoup(r.content, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        paragraphs = []
        for p in soup.find_all("p"):
            text = p.get_text().strip()
            if len(text) > MIN_PARAGRAPH_LENGTH:
                paragraphs.append(text)

        return paragraphs
    except:
        return []

# =========================================================
# Concept Extraction
# =========================================================

def extract_concepts(paragraphs):
    concept_freq = Counter()

    for paragraph in paragraphs:
        doc = nlp(paragraph)

        for chunk in doc.noun_chunks:
            tokens = [
                t.lemma_.lower()
                for t in chunk
                if not t.is_stop and t.is_alpha
            ]

            if len(tokens) < 2 or len(tokens) > 5:
                continue

            if any(token in STOP_CLUSTER_WORDS for token in tokens):
                continue

            concept = " ".join(tokens)

            if len(concept) < 6:
                continue

            concept_freq[concept] += 1

    return concept_freq

# =========================================================
# Cluster Builder
# =========================================================

def build_clusters(concept_freq):
    clusters = defaultdict(lambda: {
        "total_freq": 0,
        "concepts": []
    })

    for concept, freq in concept_freq.items():
        head = concept.split()[0]

        if len(head) < 4:
            continue

        clusters[head]["total_freq"] += freq
        clusters[head]["concepts"].append((concept, freq))

    return clusters

# =========================================================
# Scoring Helpers
# =========================================================

def calculate_semantic_score(freq, total):
    if total == 0:
        return 0.0

    normalized = (freq / total) * 100
    boosted = min(100, normalized * 2)
    return round(boosted, 2)

def calculate_dominance_score(my_freq, comp_freq):
    total = my_freq + comp_freq
    if total == 0:
        return 0.0

    # 0 → you dominant, 100 → competitor dominant
    dominance = (comp_freq / total) * 100
    return round(dominance, 2)

def classify_severity(gap):
    if gap > 25:
        return "critical"
    if gap > 12:
        return "high"
    if gap > 5:
        return "moderate"
    return "low"

# =========================================================
# Executive Summary
# =========================================================

def generate_executive_summary(clusters):
    if not clusters:
        return "No significant semantic gaps detected."

    critical = [c for c in clusters if c["severity_level"] == "critical"]

    if critical:
        topics = ", ".join([c["cluster_topic"] for c in critical[:3]])
        return f"Critical semantic gaps detected in {topics}. Immediate expansion recommended."

    return "Semantic positioning is competitive with targeted optimization opportunities."

# =========================================================
# Main Audit
# =========================================================

def run_audit(my_url, competitor_urls):

    my_paragraphs = scrape_paragraphs(my_url)
    if not my_paragraphs:
        return {"error": "Failed to process your page"}

    my_concepts = extract_concepts(my_paragraphs)
    my_clusters = build_clusters(my_concepts)

    comp_concepts = Counter()

    for url in competitor_urls:
        paragraphs = scrape_paragraphs(url)
        if paragraphs:
            comp_concepts.update(extract_concepts(paragraphs))

    comp_clusters = build_clusters(comp_concepts)

    total_comp_freq = sum(
        cluster["total_freq"] for cluster in comp_clusters.values()
    )

    results = []

    for head in set(my_clusters.keys()) | set(comp_clusters.keys()):

        my_total = my_clusters.get(head, {}).get("total_freq", 0)
        comp_total = comp_clusters.get(head, {}).get("total_freq", 0)

        if comp_total < MIN_CLUSTER_FREQ:
            continue

        gap = comp_total - my_total
        severity = classify_severity(gap)

        # Dynamic Insight & Recommendation
        if my_total == 0 and comp_total > 0:
            description = f"Your page has no meaningful coverage of '{head}', while competitors emphasize it heavily."
            recommendation = f"Create a dedicated section addressing '{head}' with structured headings and supporting entities."
        elif my_total < comp_total:
            description = f"Competitors provide deeper semantic coverage of '{head}' compared to your page."
            recommendation = f"Expand topical depth around '{head}' with additional examples and semantic reinforcement."
        elif my_total > comp_total:
            description = f"You demonstrate stronger coverage of '{head}' than competitors."
            recommendation = f"Strengthen authority signals by adding schema markup and contextual entity references."
        else:
            description = f"Coverage for '{head}' is competitively balanced."
            recommendation = f"Maintain depth while refining semantic clarity and internal linking."

        results.append({
            "cluster_topic": head,
            "my_total_frequency": my_total,
            "competitor_total_frequency": comp_total,
            "gap_score": gap,
            "weighted_gap_score": round(gap * 1.2, 2),
            "semantic_score": calculate_semantic_score(comp_total, total_comp_freq),
            "competitive_dominance_score": calculate_dominance_score(my_total, comp_total),
            "dominance_type": "competitor_dominant" if my_total < comp_total else "you_dominant" if my_total > comp_total else "competitive",
            "severity_level": severity,
            "is_missing_cluster": my_total == 0 and comp_total > 0,
            "cluster_description": description,
            "recommendation": recommendation
        })

    results.sort(key=lambda x: x["gap_score"], reverse=True)

    return {
        "executive_summary": generate_executive_summary(results),
        "semantic_authority_index": round(mean([r["semantic_score"] for r in results]) if results else 0, 2),
        "competitive_dominance_index": round(mean([r["competitive_dominance_score"] for r in results]) if results else 0, 2),
        "concept_clusters": results[:MAX_CLUSTERS]
    }

if __name__ == "__main__":
    try:
        input_data = json.load(sys.stdin)
        my_url = input_data.get("myUrl")
        competitor_urls = input_data.get("competitorUrls", [])

        if not my_url:
            print(json.dumps({"error": "Missing myUrl"}))
            sys.exit(1)

        print(json.dumps(run_audit(my_url, competitor_urls)))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
