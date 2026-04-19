"""
Training Data Preparation Script for SEO-Brain AI
"""

import json
import requests
from datetime import datetime
from typing import List, Dict, Any

API_BASE_URL = "http://localhost:5120/api"

def fetch_high_quality_feedback(min_rating: int = 4, min_accuracy: int = 7, limit: int = 1000) -> List[Dict]:
    """Fetch high-quality feedback from the database"""
    try:
        response = requests.get(
            f"{API_BASE_URL}/feedback/training-data",
            params={"minRating": min_rating},
            headers={"Authorization": f"Bearer {get_admin_token()}"}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching feedback: {e}")
        return []

def get_admin_token() -> str:
    """Get admin JWT token - in production, use proper authentication"""
    # This should be replaced with actual admin login
    return "your-admin-token-here"

def create_training_example(feedback: Dict) -> Dict:
    """Convert feedback into OpenAI training format"""
    analysis = feedback.get("contentAnalysis", {})
    
    system_prompt = """You are an expert SEO analyst. Analyze content and provide SEO scores (0-100), keyword density analysis, readability scores, and actionable suggestions in JSON format.

Rules:
1. Score 0-100 based on content quality, keyword optimization, readability, and technical SEO
2. Provide 5-10 specific, actionable suggestions
3. Detect main keywords and calculate density
4. Calculate Flesch Reading Ease score (0-100)
5. Keep summary under 200 characters
6. Always return valid JSON

Output format:
{
    "score": 75,
    "summary": "Brief analysis summary",
    "readability_score": 68,
    "keyword_density": [{"term": "keyword", "count": 3, "density": 5.2}],
    "suggestions": ["Suggestion 1", "Suggestion 2", ...],
    "word_count": 150
}"""

    return {
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": f"Analyze this content: \"{analysis.get('rawText', '')}\""
            },
            {
                "role": "assistant",
                "content": json.dumps({
                    "score": analysis.get("score", 50),
                    "summary": analysis.get("summary", ""),
                    "readability_score": analysis.get("readabilityScore", 60),
                    "keyword_density": analysis.get("keywords", []),
                    "suggestions": json.loads(analysis.get("suggestionsJson", "[]")),
                    "word_count": len(analysis.get("rawText", "").split())
                })
            }
        ]
    }

def validate_training_data(data: List[Dict]) -> bool:
    """Validate training data format"""
    required_fields = ["messages"]
    required_roles = ["system", "user", "assistant"]
    
    for i, example in enumerate(data):
        if "messages" not in example:
            print(f"Example {i}: Missing 'messages' field")
            return False
        
        roles = [msg.get("role") for msg in example["messages"]]
        for role in required_roles:
            if role not in roles:
                print(f"Example {i}: Missing '{role}' message")
                return False
    
    print(f"✓ Validated {len(data)} training examples")
    return True

def save_to_jsonl(data: List[Dict], filename: str = "training_data.jsonl"):
    """Save training data to JSONL file"""
    with open(filename, 'w', encoding='utf-8') as f:
        for example in data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
    print(f"✓ Saved {len(data)} examples to {filename}")

def estimate_tokens(data: List[Dict]) -> int:
    """Estimate token count (rough approximation: 4 chars = 1 token)"""
    total_chars = 0
    for example in data:
        for msg in example["messages"]:
            total_chars += len(msg.get("content", ""))
    return total_chars // 4

def upload_to_openai(filename: str, api_key: str):
    """Upload training file to OpenAI"""
    from openai import OpenAI
    
    client = OpenAI(api_key=api_key)
    
    with open(filename, "rb") as f:
        file = client.files.create(file=f, purpose="fine-tune")
    
    print(f"✓ Uploaded file: {file.id}")
    return file.id

def start_fine_tuning(file_id: str, api_key: str, model: str = "gpt-4o-mini-2024-07-18"):
    """Start fine-tuning job"""
    from openai import OpenAI
    
    client = OpenAI(api_key=api_key)
    
    job = client.fine_tuning.jobs.create(
        training_file=file_id,
        model=model,
        suffix="seo-analyzer",
        hyperparameters={
            "n_epochs": 3,
            "batch_size": "auto",
            "learning_rate_multiplier": "auto"
        }
    )
    
    print(f"✓ Started fine-tuning job: {job.id}")
    return job.id

def main():
    print("=" * 60)
    print("SEO-Brain AI Training Data Preparation")
    print("=" * 60)
    
    # 1. Fetch high-quality feedback
    print("\n1. Fetching high-quality feedback...")
    feedback_data = fetch_high_quality_feedback(min_rating=4, min_accuracy=7, limit=1000)
    print(f"   Found {len(feedback_data)} high-quality feedback entries")
    
    if len(feedback_data) < 50:
        print("⚠️  Warning: Less than 50 examples. Need more user feedback for effective training.")
    
    # 2. Create training examples
    print("\n2. Creating training examples...")
    training_data = [create_training_example(f) for f in feedback_data]
    
    # 3. Validate data
    print("\n3. Validating training data...")
    if not validate_training_data(training_data):
        print("❌ Validation failed!")
        return
    
    # 4. Estimate tokens and cost
    tokens = estimate_tokens(training_data)
    estimated_cost = (tokens / 1000) * 0.008  # $0.008 per 1K tokens for GPT-3.5
    print(f"\n4. Estimation:")
    print(f"   Estimated tokens: ~{tokens:,}")
    print(f"   Estimated training cost: ${estimated_cost:.2f}")
    
    # 5. Save to file
    output_file = f"training_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
    print(f"\n5. Saving to {output_file}...")
    save_to_jsonl(training_data, output_file)
    
    print("\n" + "=" * 60)
    print("Next steps:")
    print("1. Review the training data file")
    print("2. Upload to OpenAI: python prepare_training_data.py --upload")
    print("3. Start fine-tuning: python prepare_training_data.py --finetune")
    print("=" * 60)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Prepare training data for SEO-Brain AI")
    parser.add_argument("--upload", action="store_true", help="Upload to OpenAI")
    parser.add_argument("--finetune", action="store_true", help="Start fine-tuning")
    parser.add_argument("--file", default="training_data.jsonl", help="Training data file")
    parser.add_argument("--api-key", help="OpenAI API key")
    parser.add_argument("--model", default="gpt-4o-mini-2024-07-18", help="Model to fine-tune")
    
    args = parser.parse_args()
    
    if args.upload:
        api_key = args.api_key or input("Enter OpenAI API key: ")
        file_id = upload_to_openai(args.file, api_key)
        print(f"File ID: {file_id}")
    elif args.finetune:
        api_key = args.api_key or input("Enter OpenAI API key: ")
        file_id = input("Enter file ID: ")
        job_id = start_fine_tuning(file_id, api_key, args.model)
        print(f"Job ID: {job_id}")
    else:
        main()
