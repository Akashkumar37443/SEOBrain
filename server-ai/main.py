from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
from datetime import datetime, timezone
import json
import re
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Configure Google Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_AVAILABLE = False

try:
    # pyrefly: ignore [missing-import]
    import google.generativeai as genai
    if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
        genai.configure(api_key=GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
        print(f"Google Gemini AI successfully configured with key: {GEMINI_API_KEY[:5]}...!")
    else:
        print("GEMINI_API_KEY not found or default placeholder. Running in heuristic/fallback mode.")
except ImportError:
    print("google-generativeai package not installed. Running in heuristic/fallback mode.")


# Fallback OpenAI
try:
    # pyrefly: ignore [missing-import]
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY", "")
    OPENAI_AVAILABLE = bool(openai.api_key and openai.api_key != "your_openai_api_key_here")
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None

app = FastAPI(
    title="SEOBrain Core AI Microservice",
    description="State-of-the-art AI SEO analysis microservice powered by proprietary SEOBrain Neuro-Engine.",
    version="4.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class AnalysisRequest(BaseModel):
    text: str
    user_id: Optional[str] = None
    content_type: str = "article"

class CompetitorRequest(BaseModel):
    your_content: str
    competitor_content: str
    target_keyword: str

class TechnicalAuditRequest(BaseModel):
    title: Optional[str] = None
    meta_description: Optional[str] = None
    h1: Optional[str] = None
    h2_count: int = 0
    h3_count: int = 0
    content: Optional[str] = None
    primary_keyword: Optional[str] = None

class MetaSchemaRequest(BaseModel):
    content: str
    primary_keyword: str
    schema_type: str = "Article" # Article, FAQPage, Product, Recipe, SoftwareApplication

class KeywordClusterRequest(BaseModel):
    topic: str
    target_audience: Optional[str] = "General"

def calculate_readability_score(text: str) -> int:
    """Calculate Flesch Reading Ease score"""
    sentences = max(1, len(re.split(r'[.!?]+', text)) - 1)
    words = max(1, len(text.split()))
    syllables = sum(max(1, len(word) // 3) for word in text.split())
    score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    return max(0, min(100, int(score)))

def extract_clean_json(raw_text: str) -> dict:
    """Extract and parse JSON from Markdown block or raw output"""
    try:
        # Find JSON block inside ```json ... ``` or ``` ... ```
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0]
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0]
        
        start = raw_text.find('{')
        end = raw_text.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(raw_text[start:end])
        return json.loads(raw_text)
    except Exception as e:
        print(f"JSON extract failed: {e}. Raw text: {raw_text[:200]}")
        raise ValueError("Invalid JSON structure")

def heuristic_analysis(text: str) -> dict:
    """Rich heuristic fallback when Gemini is unavailable"""
    word_count = len(text.split())
    readability = calculate_readability_score(text)
    
    words = [w.lower().strip('.,!?;:"()[]') for w in text.split()]
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'this', 'that'}
    freq = {}
    for w in words:
        if len(w) > 3 and w not in stop_words:
            freq[w] = freq.get(w, 0) + 1
            
    top_k = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:6]
    keywords = [
        {
            "keyword": k,
            "Keyword": k,
            "density": round((c / max(1, word_count)) * 100, 1),
            "Density": round((c / max(1, word_count)) * 100, 1),
            "importance": "High" if idx < 2 else "Medium",
            "Importance": "High" if idx < 2 else "Medium"
        }
        for idx, (k, c) in enumerate(top_k)
    ]
    
    score = 55
    if word_count > 500:
        score += 20
    elif word_count > 250:
        score += 10
    score += min(20, readability // 4)
    if len(top_k) > 3:
        score += 5
        
    suggestions = [
        f"Content length is {word_count} words. Ensure comprehensive topic coverage.",
        "Add distinct H2 and H3 headings to optimize scannability.",
        "Include relevant LSI keywords and maintain a keyword density around 1.5%.",
        "Add descriptive alt text to all embedded images.",
        "Include credible external links and relevant internal navigation links."
    ]
    
    # Return both snake_case and PascalCase/camelCase for C# compatibility
    return {
        "score": min(100, score),
        "Score": min(100, score),
        "seoScore": min(100, score),
        "SeoScore": min(100, score),
        "summary": f"Analyzed {word_count} words with readability score of {readability}/100. Detected {len(keywords)} primary keyword entities.",
        "Summary": f"Analyzed {word_count} words with readability score of {readability}/100. Detected {len(keywords)} primary keyword entities.",
        "suggestions": suggestions,
        "Suggestions": suggestions,
        "keywords": keywords,
        "Keywords": keywords,
        "readability_score": readability,
        "ReadabilityScore": readability
    }

@app.get("/")
async def root():
    return {
        "message": "SEOBrain Core AI Microservice - Neuro-Engine Edition",
        "version": "4.0.0",
        "status": "online",
        "ai_engine_available": GEMINI_AVAILABLE,
        "openai_available": OPENAI_AVAILABLE
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_engine_available": GEMINI_AVAILABLE,
        "model": "seobrain-neuro-v4"
    }

@app.post("/v1/analyze")
@app.post("/analyze")
async def analyze_content(request: AnalysisRequest):
    """Core analysis endpoint - Supports Gemini Flash with structured output"""
    if not request.text or len(request.text.strip()) < 30:
        raise HTTPException(status_code=400, detail="Text must be at least 30 characters.")
        
    text = request.text.strip()
    readability = calculate_readability_score(text)
    
    if not GEMINI_AVAILABLE:
        return heuristic_analysis(text)
        
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are an elite SEO analyst. Analyze the following content and output precisely formatted JSON matching this schema:
{{
  "score": integer (0 to 100 based on structure, depth, keyword usage, readability),
  "summary": string (executive summary of SEO strengths and weaknesses, 2-3 sentences),
  "suggestions": [array of 5-7 clear, actionable SEO improvement recommendations],
  "keywords": [
    {{
      "keyword": string (exact keyword),
      "Keyword": string (exact keyword),
      "density": float (percentage density in text),
      "Density": float (percentage density in text),
      "importance": string ("High", "Medium", or "Low"),
      "Importance": string ("High", "Medium", or "Low")
    }}
  ],
  "readability_score": {readability},
  "ReadabilityScore": {readability},
  "search_intent": string ("Informational", "Transactional", "Commercial", or "Navigational")
}}

Ensure all JSON keys exactly match. Return ONLY valid JSON without markdown wrapping or comments.

Content to analyze:
\"\"\"{text[:6000]}\"\"\"
"""
        response = model.generate_content(prompt, generation_config={"temperature": 0.2})
        data = extract_clean_json(response.text)
        
        # Ensure duplicate case keys for C# serializers
        data["Score"] = data.get("score", 70)
        data["SeoScore"] = data["Score"]
        data["Summary"] = data.get("summary", "")
        data["Suggestions"] = data.get("suggestions", [])
        data["Keywords"] = data.get("keywords", [])
        data["ReadabilityScore"] = data.get("readability_score", readability)
        
        return data
    except Exception as e:
        print(f"Gemini analysis failed: {e}. Using heuristic fallback.")
        return heuristic_analysis(text)

@app.post("/v1/enhance")
@app.post("/enhance")
async def enhance_content(request: AnalysisRequest):
    """Content Enhancement & Rewrite using Gemini Flash"""
    if not GEMINI_AVAILABLE:
        return {
            "enhanced": f"# Optimized Content\n\n{request.text}\n\n*Note: Add H2/H3 headers and LSI keywords to improve ranking.*",
            "improvements": ["Added header formatting", "Formatted for readability", "Heuristic enhancement applied"]
        }
        
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are an expert SEO copywriter and editor.
Rewrite and enhance the following text to maximize search engine rankings while keeping it engaging and natural for human readers.
Add professional Markdown headings (H1, H2, H3), bulleted lists where appropriate, and naturally weave in high-value LSI keywords.

Return valid JSON exactly matching this format:
{{
  "enhanced": "The fully formatted markdown string containing the rewritten article",
  "improvements": ["list of 3-5 specific improvements made"]
}}

Text to enhance:
\"\"\"{request.text[:5000]}\"\"\"
"""
        response = model.generate_content(prompt, generation_config={"temperature": 0.4})
        data = extract_clean_json(response.text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content enhancement failed: {str(e)}")

@app.post("/v1/competitor-insights")
async def competitor_insights(request: CompetitorRequest):
    """Side-by-side Competitor Analysis with Gemini Flash"""
    if not GEMINI_AVAILABLE:
        yw_count = len(request.your_content.split())
        cw_count = len(request.competitor_content.split())
        return {
            "your_metrics": {"word_count": yw_count, "readability": calculate_readability_score(request.your_content), "score": 75},
            "competitor_metrics": {"word_count": cw_count, "readability": calculate_readability_score(request.competitor_content), "score": 82},
            "comparison": {
                "word_count_diff": yw_count - cw_count,
                "winner": "You" if yw_count >= cw_count else "Competitor"
            },
            "recommendations": [
                f"Your competitor has {cw_count} words compared to your {yw_count} words.",
                f"Target keyword '{request.target_keyword}' should appear in your H1 and first paragraph.",
                "Add comparison tables and visual assets to increase dwell time."
            ],
            "content_gaps": ["Detailed FAQs", "Pricing or cost comparisons", "Step-by-step tutorial section"]
        }
        
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are a master SEO strategist. Perform a rigorous side-by-side gap analysis between Your Content and Competitor Content for the target keyword '{request.target_keyword}'.

Return valid JSON exactly matching this schema:
{{
  "your_metrics": {{"word_count": integer, "readability": integer, "score": integer}},
  "competitor_metrics": {{"word_count": integer, "readability": integer, "score": integer}},
  "comparison": {{"word_count_diff": integer, "winner": "You" or "Competitor"}},
  "recommendations": [array of 5 highly specific strategic recommendations to outrank the competitor],
  "content_gaps": [array of 4 specific topics or sub-sections the competitor covered that Your Content missed]
}}

Your Content:
\"\"\"{request.your_content[:3000]}\"\"\"

Competitor Content:
\"\"\"{request.competitor_content[:3000]}\"\"\"
"""
        response = model.generate_content(prompt, generation_config={"temperature": 0.2})
        return extract_clean_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Competitor analysis failed: {str(e)}")

@app.post("/v1/technical-audit")
async def technical_audit(request: TechnicalAuditRequest):
    """Technical Metadata & Heading Structure Audit with Gemini Flash"""
    if not GEMINI_AVAILABLE:
        return {
            "overall_score": 75,
            "summary": "Technical audit completed heuristics. Ensure Title and Meta tags contain primary keywords.",
            "priority_fixes": [
                "Optimize title tag length (keep between 50-60 characters)",
                "Add compelling meta description with call-to-action",
                "Ensure logical H1 -> H2 -> H3 heading progression"
            ],
            "schema_opportunities": ["Article", "FAQPage", "BreadcrumbList"]
        }
        
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are a Lead Technical SEO Engineer. Audit the following webpage elements for search engine indexability, CTR optimization, and structural perfection.
Target Keyword: {request.primary_keyword or 'None provided'}
Title Tag: {request.title or 'None provided'}
Meta Description: {request.meta_description or 'None provided'}
H1 Heading: {request.h1 or 'None provided'}
H2 Count: {request.h2_count}, H3 Count: {request.h3_count}
Content Snippet: {str(request.content)[:1500]}

Return valid JSON exactly matching this schema:
{{
  "overall_score": integer (0-100),
  "summary": string (concise expert evaluation),
  "priority_fixes": [array of 4-6 high-priority technical fixes],
  "title_analysis": {{"status": "Pass" or "Fail", "message": string, "suggested": string}},
  "meta_analysis": {{"status": "Pass" or "Fail", "message": string, "suggested": string}},
  "heading_analysis": {{"status": "Pass" or "Fail", "message": string}},
  "schema_opportunities": [array of 3 appropriate Schema.org types]
}}
"""
        response = model.generate_content(prompt, generation_config={"temperature": 0.2})
        return extract_clean_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Technical audit failed: {str(e)}")

@app.post("/v1/meta-schema")
async def generate_meta_schema(request: MetaSchemaRequest):
    """Title, Meta, OpenGraph & JSON-LD Structured Data Generator with Gemini Flash"""
    if not GEMINI_AVAILABLE:
        title = f"{request.primary_keyword.title()} - Complete Guide (2026)"
        meta = f"Discover everything you need to know about {request.primary_keyword}. Expert tips, tutorials, and insights for maximum results."
        return {
            "title": title,
            "meta_description": meta,
            "og_title": title,
            "og_description": meta,
            "url_slug": request.primary_keyword.lower().replace(' ', '-'),
            "schema_json": json.dumps({
                "@context": "https://schema.org",
                "@type": request.schema_type,
                "headline": title,
                "description": meta,
                "datePublished": datetime.now(timezone.utc).isoformat()[:10]
            }, indent=2)
        }
        
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are an elite SEO Specialist and Webmaster. Given the following content and primary keyword, generate highly optimized Title tags (CTR-focused, under 60 chars), Meta description (under 160 chars), OpenGraph tags, and valid JSON-LD schema markup for type '{request.schema_type}'.

Return valid JSON exactly matching this schema:
{{
  "title": "Optimized Title Tag under 60 chars",
  "meta_description": "Compelling meta description under 160 chars",
  "og_title": "OpenGraph title",
  "og_description": "OpenGraph description",
  "url_slug": "clean-seo-url-slug-with-hyphens",
  "schema_json": "A string formatted as beautifully indented valid JSON-LD suitable for placing inside <script type=\\"application/ld+json\\">"
}}

Primary Keyword: {request.primary_keyword}
Schema Type: {request.schema_type}
Content:
\"\"\"{request.content[:3000]}\"\"\"
"""
        response = model.generate_content(prompt, generation_config={"temperature": 0.2})
        return extract_clean_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Meta schema generation failed: {str(e)}")

@app.post("/v1/keyword-cluster")
async def keyword_cluster(request: KeywordClusterRequest):
    """Topical Authority & Keyword Cluster Mapping with Gemini Flash"""
    if not GEMINI_AVAILABLE:
        topic = request.topic.title()
        return {
            "topic": topic,
            "clusters": [
                {
                    "cluster_name": f"{topic} Fundamentals",
                    "intent": "Informational",
                    "keywords": [f"what is {request.topic}", f"how to learn {request.topic}", f"{request.topic} tips"],
                    "difficulty": "Medium",
                    "search_volume": "10k - 50k",
                    "suggested_title": f"The Ultimate Beginner's Guide to {topic}"
                },
                {
                    "cluster_name": f"Best {topic} Tools & Software",
                    "intent": "Commercial",
                    "keywords": [f"best {request.topic} software", f"{request.topic} tool comparison", f"top {request.topic} apps"],
                    "difficulty": "High",
                    "search_volume": "5k - 20k",
                    "suggested_title": f"Top 10 {topic} Tools Compared (2026 Edition)"
                }
            ]
        }
        
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = f"""You are a Senior SEO Director building a complete Topical Authority Map for the niche/topic: '{request.topic}'. Target Audience: '{request.target_audience}'.

Generate 4-5 distinct keyword clusters that cover the entire buyer journey (Informational, Transactional, Commercial, Navigational).

Return valid JSON exactly matching this schema:
{{
  "topic": "{request.topic}",
  "clusters": [
    {{
      "cluster_name": "Name of the topic pillar",
      "intent": "Informational", "Commercial", "Transactional", or "Navigational",
      "keywords": ["array of 4-6 specific long-tail keywords in this cluster"],
      "difficulty": "Easy", "Medium", or "Hard",
      "search_volume": "Estimated range e.g., 1k - 10k",
      "suggested_title": "A highly clickable, SEO-optimized blog article title for this cluster"
    }}
  ]
}}
"""
        response = model.generate_content(prompt, generation_config={"temperature": 0.3})
        return extract_clean_json(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Keyword cluster generation failed: {str(e)}")

@app.get("/v1/pricing")
async def get_pricing():
    return {
        "tiers": [
            {"id": "free", "name": "Free", "price": 0, "analysis_quota": 10},
            {"id": "pro", "name": "Pro", "price": 29.99, "analysis_quota": 100},
            {"id": "enterprise", "name": "Enterprise", "price": 99.99, "analysis_quota": 500}
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
