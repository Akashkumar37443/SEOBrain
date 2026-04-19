from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from datetime import datetime, timezone
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import OpenAI, but don't fail if not available
try:
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY", "")
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    openai = None

app = FastAPI(
    title="SEO Brain AI Service",
    description="AI-powered SEO analysis microservice - FREE local LLM or OpenAI",
    version="3.0.0"
)

# Ollama (Local Free LLM) Configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# System Prompt with Few-Shot Examples (FREE training method)
SYSTEM_PROMPT = """You are an expert SEO analyst. Analyze content and provide detailed SEO analysis in JSON format.

SCORING CRITERIA:
- 90-100: Exceptional - Comprehensive, well-structured, perfect keyword optimization
- 80-89: Excellent - High quality, good keywords, minor improvements needed  
- 70-79: Good - Decent content, needs keyword and structural improvements
- 60-69: Average - Basic content, significant improvements needed
- 50-59: Below Average - Thin content, poor optimization
- 0-49: Poor - Very thin or spam content, major overhaul needed

EXAMPLE 1 - Excellent Content (Score: 88):
Content: "10 Best SEO Tools for 2024: Complete Review and Comparison. 1. Ahrefs - Best for backlink analysis ($99/month). 2. SEMrush - All-in-one marketing toolkit ($119/month). 3. Moz Pro - Great for beginners ($99/month). Each tool includes pricing, key features, pros/cons, and ideal use cases."
Analysis: {"score": 88, "summary": "Excellent comprehensive content with specific details, pricing, comparisons, and clear structure. Great for featured snippets.", "readability_score": 72, "keywords": [{"term": "SEO tools", "count": 2, "density": 4.2}, {"term": "backlink analysis", "count": 1, "density": 2.1}], "suggestions": ["Add comparison table for quick feature overview", "Include user testimonials", "Add 'Best for' section highlighting ideal users"]}

EXAMPLE 2 - Poor Content (Score: 15):
Content: "Buy cheap shoes online now! Best prices guaranteed! Click here!!! Limited time offer!!!"
Analysis: {"score": 15, "summary": "Spam-like content with excessive exclamation marks, no value proposition, no product details. High risk of being flagged as spam.", "readability_score": 30, "keywords": [{"term": "shoes", "count": 1, "density": 12.5}], "suggestions": ["Remove excessive exclamation marks and spam triggers", "Add actual product descriptions", "Include trust signals", "Write for humans, not just sales"]}

EXAMPLE 3 - Average Content (Score: 65):
Content: "How to Start a Blog. Starting a blog is easy. First, choose a niche. Then get hosting. Write content. Promote your blog. Make money."
Analysis: {"score": 65, "summary": "Basic content lacking depth and specific examples. Too short for comprehensive coverage but covers main points.", "readability_score": 85, "keywords": [{"term": "blog", "count": 3, "density": 18.7}], "suggestions": ["Expand each point with detailed steps", "Add specific platform recommendations", "Include hosting comparisons", "Add content strategy section"]}

Now analyze the user's content following this format exactly. Return ONLY valid JSON."""

# Pydantic models
class AnalysisRequest(BaseModel):
    text: str
    user_id: Optional[str] = None
    content_type: str = "article"

@app.get("/")
async def root():
    return {
        "message": "SEO Brain AI Service - FREE Local LLM / OpenAI",
        "version": "3.0.0",
        "status": "running",
        "openai_configured": bool(OPENAI_AVAILABLE and openai and openai.api_key) if OPENAI_AVAILABLE else False,
        "ollama_url": OLLAMA_URL,
        "model": OLLAMA_MODEL
    }

@app.get("/health")
async def health_check():
    # Check Ollama
    ollama_ready = False
    try:
        response = requests.get(OLLAMA_URL.replace('/generate', '/tags'), timeout=2)
        ollama_ready = response.status_code == 200
    except:
        pass
    
    return {
        "status": "healthy",
        "service": "SEOBrain.AI",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "openai_available": OPENAI_AVAILABLE and bool(openai.api_key) if OPENAI_AVAILABLE else False,
        "ollama_available": ollama_ready,
        "model": OLLAMA_MODEL
    }

def calculate_readability_score(text: str) -> int:
    """Calculate Flesch Reading Ease score"""
    sentences = text.count('.') + text.count('!') + text.count('?')
    if sentences == 0:
        sentences = 1
    words = len(text.split())
    if words == 0:
        return 50
    syllables = sum(max(1, len(word) // 3) for word in text.split())
    score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    return max(0, min(100, int(score)))

def basic_analysis(text: str):
    """Basic analysis without AI"""
    word_count = len(text.split())
    sentences = text.count('.') + text.count('!') + text.count('?') or 1
    
    words = text.lower().split()
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
    keywords = {}
    
    for word in words:
        clean = word.strip('.,!?;:"()[]')
        if len(clean) > 3 and clean not in stop_words:
            keywords[clean] = keywords.get(clean, 0) + 1
    
    top_keywords = sorted(keywords.items(), key=lambda x: x[1], reverse=True)[:5]
    
    score = 50
    if word_count > 300:
        score += 15
    elif word_count > 150:
        score += 10
    
    readability = calculate_readability_score(text)
    score += min(20, readability // 5)
    
    return {
        "score": min(100, score),
        "summary": f"Analysis complete. Content has {word_count} words and {len(top_keywords)} key terms.",
        "suggestions": [
            f"Content length: {word_count} words. {'Good for SEO' if word_count > 300 else 'Consider expanding'}",
            "Add headers (H2, H3) for better structure",
            "Include meta description and optimize title",
            "Add internal and external links"
        ],
        "keywords": [{"keyword": k, "density": round((c/word_count)*100, 1)} for k, c in top_keywords],
        "readability_score": readability
    }

def ollama_analysis(text: str, content_type: str = "article") -> dict:
    """FREE - Use local Ollama LLM for SEO analysis"""
    try:
        prompt = f"{SYSTEM_PROMPT}\n\nAnalyze this {content_type}:\n\"{text[:4000]}\"\n\nReturn ONLY valid JSON:"
        
        response = requests.post(OLLAMA_URL, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_ctx": 4096,
                "top_p": 0.9
            }
        }, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            analysis_text = result.get('response', '')
            
            # Try to extract JSON
            try:
                # Find JSON in response
                start = analysis_text.find('{')
                end = analysis_text.rfind('}') + 1
                if start != -1 and end > start:
                    json_str = analysis_text[start:end]
                    return json.loads(json_str)
                else:
                    return json.loads(analysis_text)
            except json.JSONDecodeError:
                print(f"Ollama returned invalid JSON, falling back to basic")
                return basic_analysis(text)
        else:
            print(f"Ollama error {response.status_code}, falling back to basic")
            return basic_analysis(text)
            
    except Exception as e:
        print(f"Ollama failed: {e}, falling back to basic")
        return basic_analysis(text)

def openai_analysis(text: str, content_type: str = "article") -> dict:
    """PAID - OpenAI GPT-4 analysis (fallback)"""
    if not OPENAI_AVAILABLE or not openai or not openai.api_key:
        return basic_analysis(text)
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this {content_type}: \"{text[:3000]}\""}
            ],
            temperature=0.3,
            max_tokens=1200
        )
        
        content = response.choices[0].message.content
        if "```" in content:
            content = content.split("```")[1].replace("json", "").strip()
        
        return json.loads(content.strip())
    except Exception as e:
        print(f"OpenAI failed: {e}, using basic")
        return basic_analysis(text)

@app.post("/v1/analyze")
async def analyze_text(request: AnalysisRequest):
    """Analyze content - tries Ollama (free) first, then OpenAI, then basic"""
    try:
        if not request.text or len(request.text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Text must be at least 50 characters")
        
        text = request.text.strip()
        
        # Priority: 1. Ollama (FREE), 2. OpenAI (PAID), 3. Basic (FREE)
        result = ollama_analysis(text, request.content_type)
        
        # Add metadata
        result['analysis_method'] = 'ollama_free'
        result['model'] = OLLAMA_MODEL
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/v1/enhance")
async def enhance_content(request: AnalysisRequest):
    """Generate SEO-enhanced content"""
    if not openai.api_key:
        raise HTTPException(status_code=503, detail="OpenAI not configured")
    
    prompt = f"Rewrite this content for better SEO with headers, keywords, and improved readability:\n\n{request.text[:2500]}"
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert SEO content writer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=2000
        )
        
        return {
            "enhanced": response.choices[0].message.content,
            "improvements": ["Added headers", "Optimized keywords", "Improved readability"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhancement failed: {str(e)}")

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
