"""
BrandForge AI - Full-Stack Generative AI Branding Platform
A Streamlit-based application for AI-powered brand identity generation
"""

import streamlit as st
import json
import os
from datetime import datetime
from pathlib import Path
import base64
from io import BytesIO
from typing import Dict, List, Optional, Tuple
import re

# Third-party imports
from passlib.hash import bcrypt
from dotenv import load_dotenv
import requests
from PIL import Image
from fpdf import FPDF
from textblob import TextBlob
from langdetect import detect

# Load environment variables
load_dotenv()

# ==================== CONFIGURATION ====================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")

# File paths
USERS_FILE = "users.json"
PROJECTS_FILE = "projects.json"

# Supported languages
LANGUAGES = {
    "English": "en",
    "Hindi": "hi",
    "Telugu": "te",
    "Tamil": "ta",
    "Spanish": "es",
    "French": "fr",
    "German": "de"
}

# Color palette styles
COLOR_PALETTE_STYLES = {
    "Pastel": "soft, muted pastel colors with gentle tones",
    "Bold Modern": "vibrant, high-contrast modern colors",
    "Luxury": "sophisticated, premium colors like deep blues, golds, blacks",
    "Earthy": "natural, organic earth tones and greens",
    "Monochrome": "grayscale with subtle variations",
    "Vibrant": "bright, energetic, attention-grabbing colors",
    "Neutral": "balanced, professional neutral tones"
}

# Font categories
FONT_CATEGORIES = {
    "Logo Fonts": ["Montserrat", "Playfair Display", "Bebas Neue", "Raleway", "Oswald"],
    "Heading Fonts": ["Poppins", "Roboto", "Open Sans", "Lato", "Merriweather"],
    "Body Fonts": ["Inter", "Source Sans Pro", "Nunito", "Work Sans", "Karla"]
}

# Logo types
LOGO_TYPES = ["Lettermark", "Wordmark", "Symbol-based", "Combination Mark"]

# ==================== UTILITY FUNCTIONS ====================

def load_json_file(filepath: str) -> Dict:
    """Load JSON file or return empty dict if not exists"""
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_json_file(filepath: str, data: Dict):
    """Save data to JSON file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def init_session_state():
    """Initialize session state variables"""
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    if 'user_email' not in st.session_state:
        st.session_state.user_email = None
    if 'current_project' not in st.session_state:
        st.session_state.current_project = None
    if 'language' not in st.session_state:
        st.session_state.language = "English"
    if 'theme' not in st.session_state:
        st.session_state.theme = "light"
    if 'chat_open' not in st.session_state:
        st.session_state.chat_open = False
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    if 'brand_data' not in st.session_state:
        st.session_state.brand_data = {}
    if 'selected_palette_style' not in st.session_state:
        st.session_state.selected_palette_style = "Pastel"
    if 'logo_customization_mode' not in st.session_state:
        st.session_state.logo_customization_mode = False

# ==================== AUTHENTICATION ====================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.verify(password, hashed)

def signup_user(email: str, password: str) -> Tuple[bool, str]:
    """Register new user"""
    users = load_json_file(USERS_FILE)
    
    if email in users:
        return False, "Email already registered. Please login."
    
    users[email] = {
        "password": hash_password(password),
        "created_at": datetime.now().isoformat(),
        "projects": []
    }
    
    save_json_file(USERS_FILE, users)
    return True, "Signup successful! Please login."

def login_user(email: str, password: str) -> Tuple[bool, str]:
    """Authenticate user"""
    users = load_json_file(USERS_FILE)
    
    if email not in users:
        return False, "Account not found. Please signup first."
    
    if verify_password(password, users[email]["password"]):
        st.session_state.authenticated = True
        st.session_state.user_email = email
        return True, "Login successful!"
    
    return False, "Incorrect password."

def logout_user():
    """Logout current user"""
    st.session_state.authenticated = False
    st.session_state.user_email = None
    st.session_state.current_project = None
    st.session_state.brand_data = {}
    st.session_state.chat_history = []

# ==================== AI INTEGRATION ====================

def call_groq_api(prompt: str, language: str = "en") -> str:
    """Call Groq LLaMA API"""
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)
        
        language_instruction = f"Respond in {language} language." if language != "en" else ""
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": f"You are a creative branding expert. {language_instruction}"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.9,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"Error calling Groq API: {str(e)}"

def generate_brand_names(business_description: str, industry: str, language: str, count: int = 10) -> List[str]:
    """Generate creative brand names using advanced linguistic techniques"""
    
    lang_code = LANGUAGES.get(language, "en")
    lang_instruction = f"Generate all names in {language} language." if language != "English" else ""
    
    prompt = f"""Generate {count} highly creative, distinctive, and emotionally engaging brand names for a business with the following details:

Business Description: {business_description}
Industry: {industry}

{lang_instruction}

Use advanced techniques:
1. Linguistic Blending: Merge meaningful words in unexpected ways
2. Metaphorical Framing: Use evocative metaphors related to the business value
3. Phonetic Rhythm: Create names with pleasing sound patterns
4. Industry Relevance: Reflect the industry while being unique
5. Emotional Resonance: Names should evoke positive feelings

Avoid:
- Generic compound words
- Overused suffixes like "-ly", "-ify"
- Common dictionary words without modification

Return ONLY the {count} brand names, one per line, without numbering or explanations."""

    response = call_groq_api(prompt, lang_code)
    names = [name.strip() for name in response.split('\n') if name.strip() and not name.strip().startswith('#')]
    
    # Filter and ensure uniqueness
    unique_names = []
    seen = set()
    for name in names:
        # Remove numbering if present
        clean_name = re.sub(r'^\d+[\.\)]\s*', '', name).strip()
        if clean_name and clean_name.lower() not in seen:
            unique_names.append(clean_name)
            seen.add(clean_name.lower())
    
    return unique_names[:count]

def generate_taglines(brand_name: str, business_description: str, language: str, count: int = 3) -> List[str]:
    """Generate compelling taglines"""
    
    lang_code = LANGUAGES.get(language, "en")
    lang_instruction = f"Generate all taglines in {language} language." if language != "English" else ""
    
    prompt = f"""Create {count} memorable, impactful taglines for the brand "{brand_name}".

Business Description: {business_description}

{lang_instruction}

Each tagline should:
- Be concise (3-7 words)
- Evoke emotion
- Communicate unique value
- Be memorable and quotable

Return ONLY the {count} taglines, one per line."""

    response = call_groq_api(prompt, lang_code)
    taglines = [t.strip() for t in response.split('\n') if t.strip()]
    return taglines[:count]

def generate_brand_story(brand_name: str, business_description: str, industry: str, language: str) -> Dict[str, str]:
    """Generate compelling brand story with structured sections"""
    
    lang_code = LANGUAGES.get(language, "en")
    lang_instruction = f"Write the entire story in {language} language." if language != "English" else ""
    
    prompt = f"""Create a compelling, vivid, and emotionally persuasive brand story for "{brand_name}".

Business Description: {business_description}
Industry: {industry}

{lang_instruction}

Structure the story into these sections with rich storytelling:

**Vision**: Paint an aspirational picture of the future this brand is creating. Use sensory language and emotional appeal.

**Mission**: Describe the brand's purpose with clarity and passion. What drives this brand every day?

**Problem**: Articulate the pain points and challenges customers face. Make it relatable and emotionally resonant.

**Solution**: Explain how this brand uniquely solves the problem. Highlight differentiation and innovation.

**Positioning**: Define the brand's unique place in the market. What makes it distinctly different and valuable?

Use:
- Vivid, sensory language
- Emotional engagement
- Concrete examples
- Aspirational tone
- Clear differentiation

Format your response as:
VISION: [content]
MISSION: [content]
PROBLEM: [content]
SOLUTION: [content]
POSITIONING: [content]"""

    response = call_groq_api(prompt, lang_code)
    
    # Parse structured response
    story = {
        "vision": "",
        "mission": "",
        "problem": "",
        "solution": "",
        "positioning": ""
    }
    
    current_section = None
    for line in response.split('\n'):
        line = line.strip()
        if line.startswith('VISION:'):
            current_section = 'vision'
            story[current_section] = line.replace('VISION:', '').strip()
        elif line.startswith('MISSION:'):
            current_section = 'mission'
            story[current_section] = line.replace('MISSION:', '').strip()
        elif line.startswith('PROBLEM:'):
            current_section = 'problem'
            story[current_section] = line.replace('PROBLEM:', '').strip()
        elif line.startswith('SOLUTION:'):
            current_section = 'solution'
            story[current_section] = line.replace('SOLUTION:', '').strip()
        elif line.startswith('POSITIONING:'):
            current_section = 'positioning'
            story[current_section] = line.replace('POSITIONING:', '').strip()
        elif current_section and line:
            story[current_section] += ' ' + line
    
    return story

def generate_marketing_content(brand_name: str, business_description: str, language: str) -> Dict[str, str]:
    """Generate various marketing content"""
    
    lang_code = LANGUAGES.get(language, "en")
    lang_instruction = f"Write all content in {language} language." if language != "English" else ""
    
    prompt = f"""Create marketing content for "{brand_name}".

Business: {business_description}

{lang_instruction}

Generate:
1. SHORT_DESCRIPTION: 1-2 sentence elevator pitch
2. LONG_DESCRIPTION: Detailed 3-4 paragraph description
3. SOCIAL_CAPTION: Engaging social media caption with emojis
4. AD_COPY: Compelling 30-second ad script
5. EMAIL_COPY: Professional email introduction

Format as:
SHORT_DESCRIPTION: [content]
LONG_DESCRIPTION: [content]
SOCIAL_CAPTION: [content]
AD_COPY: [content]
EMAIL_COPY: [content]"""

    response = call_groq_api(prompt, lang_code)
    
    content = {
        "short_description": "",
        "long_description": "",
        "social_caption": "",
        "ad_copy": "",
        "email_copy": ""
    }
    
    current_section = None
    for line in response.split('\n'):
        line = line.strip()
        if line.startswith('SHORT_DESCRIPTION:'):
            current_section = 'short_description'
            content[current_section] = line.replace('SHORT_DESCRIPTION:', '').strip()
        elif line.startswith('LONG_DESCRIPTION:'):
            current_section = 'long_description'
            content[current_section] = line.replace('LONG_DESCRIPTION:', '').strip()
        elif line.startswith('SOCIAL_CAPTION:'):
            current_section = 'social_caption'
            content[current_section] = line.replace('SOCIAL_CAPTION:', '').strip()
        elif line.startswith('AD_COPY:'):
            current_section = 'ad_copy'
            content[current_section] = line.replace('AD_COPY:', '').strip()
        elif line.startswith('EMAIL_COPY:'):
            current_section = 'email_copy'
            content[current_section] = line.replace('EMAIL_COPY:', '').strip()
        elif current_section and line:
            content[current_section] += ' ' + line
    
    return content

def generate_color_palette(brand_name: str, industry: str, style: str) -> List[str]:
    """Generate color palette based on style"""
    
    prompt = f"""Generate a color palette for brand "{brand_name}" in the {industry} industry.

Style: {style} - {COLOR_PALETTE_STYLES[style]}

Return exactly 5 HEX color codes (including #) that work harmoniously together.
Format: one HEX code per line, nothing else.

Example format:
#A8D5E2
#F9E4D4
#FFB6C1
#E6E6FA
#F0E68C"""

    response = call_groq_api(prompt, "en")
    
    # Extract HEX codes
    hex_codes = re.findall(r'#[0-9A-Fa-f]{6}', response)
    
    # Fallback palettes if API fails
    fallback_palettes = {
        "Pastel": ["#FFD6E8", "#C5E1F5", "#E8F5C8", "#FFF4E0", "#E5D4F0"],
        "Bold Modern": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"],
        "Luxury": ["#1C1C1C", "#D4AF37", "#2C3E50", "#8B7355", "#F8F8F8"],
        "Earthy": ["#8B7355", "#A0826D", "#C9B79C", "#E8DCC4", "#6B8E23"],
        "Monochrome": ["#2C2C2C", "#5A5A5A", "#8C8C8C", "#BEBEBE", "#E8E8E8"],
        "Vibrant": ["#FF1744", "#00E676", "#2979FF", "#FFEA00", "#E040FB"],
        "Neutral": ["#F5F5F5", "#E0E0E0", "#9E9E9E", "#616161", "#212121"]
    }
    
    if len(hex_codes) >= 3:
        return hex_codes[:5]
    else:
        return fallback_palettes.get(style, fallback_palettes["Pastel"])

def generate_font_pairing(brand_name: str, industry: str) -> Dict[str, str]:
    """Generate font pairing recommendations"""
    
    # For simplicity, use predefined pairings based on industry
    industry_pairings = {
        "Technology": {"logo": "Montserrat", "heading": "Poppins", "body": "Inter"},
        "Fashion": {"logo": "Playfair Display", "heading": "Lato", "body": "Source Sans Pro"},
        "Food": {"logo": "Bebas Neue", "heading": "Open Sans", "body": "Nunito"},
        "Health": {"logo": "Raleway", "heading": "Roboto", "body": "Work Sans"},
        "Finance": {"logo": "Oswald", "heading": "Merriweather", "body": "Karla"},
    }
    
    # Default pairing
    default = {"logo": "Montserrat", "heading": "Poppins", "body": "Inter"}
    
    for key in industry_pairings:
        if key.lower() in industry.lower():
            return industry_pairings[key]
    
    return default

def perform_sentiment_analysis(text: str) -> Dict:
    """Analyze sentiment of text"""
    try:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        # Determine tone
        if polarity > 0.3:
            tone = "Positive"
        elif polarity < -0.3:
            tone = "Negative"
        else:
            tone = "Neutral"
        
        # Confidence (based on subjectivity)
        confidence = abs(polarity) * 100
        
        return {
            "polarity": round(polarity, 2),
            "confidence": round(confidence, 1),
            "tone": tone,
            "alignment": "Good" if polarity > 0 else "Needs Improvement"
        }
    except:
        return {
            "polarity": 0.0,
            "confidence": 0.0,
            "tone": "Neutral",
            "alignment": "Unknown"
        }

def rewrite_for_sentiment(text: str, target_tone: str, language: str) -> str:
    """Rewrite text to match target sentiment"""
    
    lang_code = LANGUAGES.get(language, "en")
    lang_instruction = f"Write in {language} language." if language != "English" else ""
    
    prompt = f"""Rewrite the following text to have a {target_tone} tone while maintaining the core message:

Original text: {text}

{lang_instruction}

Return only the rewritten text."""

    return call_groq_api(prompt, lang_code)

def summarize_text(text: str, language: str) -> str:
    """Summarize long text"""
    
    lang_code = LANGUAGES.get(language, "en")
    lang_instruction = f"Summarize in {language} language." if language != "English" else ""
    
    prompt = f"""Summarize the following text concisely in 2-3 sentences:

{text}

{lang_instruction}

Return only the summary."""

    return call_groq_api(prompt, lang_code)

def generate_logo_prompt(brand_name: str, industry: str, colors: List[str], logo_type: str, sentiment: str) -> str:
    """Generate refined logo prompt for Stable Diffusion"""
    
    color_desc = ", ".join(colors[:3])
    
    sentiment_moods = {
        "Positive": "energetic, vibrant, uplifting",
        "Neutral": "balanced, professional, clean",
        "Negative": "serious, bold, impactful"
    }
    
    mood = sentiment_moods.get(sentiment, "professional")
    
    type_descriptions = {
        "Lettermark": f"lettermark logo using initials of {brand_name}",
        "Wordmark": f"wordmark logo with stylized text '{brand_name}'",
        "Symbol-based": f"abstract symbol logo representing {brand_name} concept",
        "Combination Mark": f"combination logo with both symbol and text '{brand_name}'"
    }
    
    type_desc = type_descriptions.get(logo_type, f"logo for {brand_name}")
    
    prompt = f"""Professional {type_desc}, {industry} industry, {mood} aesthetic, 
vector style, clean design, modern, colors: {color_desc}, 
flat design, minimalist, high quality, centered composition, 
white background, suitable for branding"""
    
    return prompt

def generate_logo_sdxl(prompt: str, seed: Optional[int] = None) -> Optional[Image.Image]:
    """Generate logo using Stable Diffusion XL via HuggingFace Inference API"""
    
    try:
        API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "num_inference_steps": 30,
                "guidance_scale": 7.5,
                "width": 1024,
                "height": 1024
            }
        }
        
        if seed:
            payload["parameters"]["seed"] = seed
        
        response = requests.post(API_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            image = Image.open(BytesIO(response.content))
            return image
        else:
            st.error(f"Logo generation failed: {response.status_code}")
            return None
            
    except Exception as e:
        st.error(f"Error generating logo: {str(e)}")
        return None

def chat_with_consultant(user_message: str, chat_history: List[Dict]) -> str:
    """AI Branding Consultant using Groq (fallback from IBM Granite)"""
    
    # Build conversation context
    context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history[-5:]])
    
    prompt = f"""You are an expert AI branding consultant helping users refine their business ideas before creating a brand.

Ask clarifying questions about:
- Target audience
- Unique value proposition
- Industry positioning
- Brand personality
- Business goals

Previous conversation:
{context}

User: {user_message}

Provide helpful, structured guidance. Ask one focused question at a time."""

    response = call_groq_api(prompt, "en")
    return response

# ==================== UI COMPONENTS ====================

def apply_custom_css():
    """Apply custom CSS for pastel glassmorphism theme"""
    
    theme_colors = {
        "light": {
            "bg": "#F8F9FA",
            "card": "rgba(255, 255, 255, 0.7)",
            "text": "#2C3E50",
            "accent": "#A8D5E2",
            "border": "rgba(200, 200, 200, 0.3)"
        },
        "dark": {
            "bg": "#1A1A2E",
            "card": "rgba(40, 40, 60, 0.7)",
            "text": "#E8E8E8",
            "accent": "#7B68EE",
            "border": "rgba(100, 100, 120, 0.3)"
        }
    }
    
    colors = theme_colors[st.session_state.theme]
    
    css = f"""
    <style>
    /* Global Styles */
    .stApp {{
        background: linear-gradient(135deg, {colors['bg']} 0%, #E8E8F0 100%);
    }}
    
    /* Glassmorphism Cards */
    .glass-card {{
        background: {colors['card']};
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 25px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid {colors['border']};
        margin: 15px 0;
    }}
    
    /* Headers */
    h1, h2, h3 {{
        color: {colors['text']};
        font-family: 'Poppins', sans-serif;
    }}
    
    /* Buttons */
    .stButton>button {{
        background: linear-gradient(135deg, {colors['accent']} 0%, #C5E1F5 100%);
        color: {colors['text']};
        border: none;
        border-radius: 15px;
        padding: 12px 30px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }}
    
    .stButton>button:hover {{
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }}
    
    /* Input Fields */
    .stTextInput>div>div>input, .stTextArea>div>div>textarea {{
        border-radius: 12px;
        border: 1px solid {colors['border']};
        background: {colors['card']};
        backdrop-filter: blur(5px);
    }}
    
    /* Floating Chat Widget */
    .chat-widget {{
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #A8D5E2 0%, #7B68EE 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transition: all 0.3s ease;
    }}
    
    .chat-widget:hover {{
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
    }}
    
    .chat-container {{
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 350px;
        height: 500px;
        background: {colors['card']};
        backdrop-filter: blur(10px);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        border: 1px solid {colors['border']};
        z-index: 999;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }}
    
    /* Color Palette Preview */
    .color-box {{
        width: 60px;
        height: 60px;
        border-radius: 10px;
        display: inline-block;
        margin: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        border: 2px solid white;
    }}
    
    /* Font Preview */
    .font-preview {{
        padding: 15px;
        border-radius: 12px;
        background: {colors['card']};
        margin: 10px 0;
        border: 1px solid {colors['border']};
    }}
    
    /* Logo Container */
    .logo-container {{
        text-align: center;
        padding: 30px;
        background: {colors['card']};
        border-radius: 20px;
        margin: 20px 0;
    }}
    
    /* Responsive */
    @media (max-width: 768px) {{
        .chat-container {{
            width: 90%;
            right: 5%;
        }}
    }}
    </style>
    """
    
    st.markdown(css, unsafe_allow_html=True)

def render_auth_page():
    """Render authentication page"""
    
    st.markdown("<h1 style='text-align: center;'>🎨 BrandForge AI</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; font-size: 1.2em;'>Create Your Perfect Brand Identity with AI</p>", unsafe_allow_html=True)
    
    tab1, tab2 = st.tabs(["Login", "Sign Up"])
    
    with tab1:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.subheader("Login to Your Account")
        
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Password", type="password", key="login_password")
        
        if st.button("Login", key="login_btn"):
            if email and password:
                success, message = login_user(email, password)
                if success:
                    st.success(message)
                    st.rerun()
                else:
                    st.error(message)
            else:
                st.warning("Please enter both email and password")
        
        st.markdown("</div>", unsafe_allow_html=True)
    
    with tab2:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.subheader("Create New Account")
        
        new_email = st.text_input("Email", key="signup_email")
        new_password = st.text_input("Password", type="password", key="signup_password")
        confirm_password = st.text_input("Confirm Password", type="password", key="confirm_password")
        
        if st.button("Sign Up", key="signup_btn"):
            if new_email and new_password and confirm_password:
                if new_password == confirm_password:
                    success, message = signup_user(new_email, new_password)
                    if success:
                        st.success(message)
                    else:
                        st.error(message)
                else:
                    st.error("Passwords do not match")
            else:
                st.warning("Please fill all fields")
        
        st.markdown("</div>", unsafe_allow_html=True)

def render_floating_chat():
    """Render floating chat widget"""
    
    if st.session_state.chat_open:
        st.markdown("""
        <div class='chat-container'>
            <div style='padding: 20px; border-bottom: 1px solid rgba(200,200,200,0.3);'>
                <h3 style='margin: 0;'>🤖 AI Consultant</h3>
            </div>
            <div id='chat-messages' style='flex: 1; overflow-y: auto; padding: 15px;'>
        """, unsafe_allow_html=True)
        
        # Display chat history
        for msg in st.session_state.chat_history:
            role_emoji = "👤" if msg["role"] == "user" else "🤖"
            st.markdown(f"**{role_emoji} {msg['role'].title()}:** {msg['content']}")
        
        st.markdown("</div></div>", unsafe_allow_html=True)
        
        # Chat input
        with st.container():
            user_input = st.text_input("Ask the consultant...", key="chat_input")
            col1, col2 = st.columns([4, 1])
            
            with col1:
                if st.button("Send", key="chat_send"):
                    if user_input:
                        st.session_state.chat_history.append({"role": "user", "content": user_input})
                        response = chat_with_consultant(user_input, st.session_state.chat_history)
                        st.session_state.chat_history.append({"role": "assistant", "content": response})
                        st.rerun()
            
            with col2:
                if st.button("Close", key="chat_close"):
                    st.session_state.chat_open = False
                    st.rerun()
    else:
        if st.button("💬", key="chat_toggle", help="Open AI Consultant"):
            st.session_state.chat_open = True
            if not st.session_state.chat_history:
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": "Hello! I'm your AI branding consultant. Tell me about your business idea, and I'll help you refine it before we create your brand."
                })
            st.rerun()

def render_dashboard():
    """Render main dashboard"""
    
    # Header
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        st.title("🎨 BrandForge AI Dashboard")
    
    with col2:
        st.session_state.language = st.selectbox("Language", list(LANGUAGES.keys()), key="lang_select")
    
    with col3:
        if st.button("🌓 Toggle Theme"):
            st.session_state.theme = "dark" if st.session_state.theme == "light" else "light"
            st.rerun()
        
        if st.button("Logout"):
            logout_user()
            st.rerun()
    
    st.markdown("---")
    
    # Main content tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "🚀 Generate Brand",
        "📝 Brand Story",
        "🎨 Visual Identity",
        "🖼️ Logo Studio",
        "📦 Export"
    ])
    
    with tab1:
        render_brand_generation()
    
    with tab2:
        render_brand_story()
    
    with tab3:
        render_visual_identity()
    
    with tab4:
        render_logo_studio()
    
    with tab5:
        render_export_options()
    
    # Floating chat widget
    render_floating_chat()

def render_brand_generation():
    """Render brand generation section"""
    
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.header("Generate Your Brand")
    
    business_desc = st.text_area(
        "Describe your business",
        placeholder="What does your business do? What makes it unique?",
        height=100
    )
    
    industry = st.text_input("Industry", placeholder="e.g., Technology, Fashion, Food")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🎯 Generate Brand Names", use_container_width=True):
            if business_desc and industry:
                with st.spinner("Generating creative brand names..."):
                    names = generate_brand_names(
                        business_desc,
                        industry,
                        st.session_state.language,
                        count=10
                    )
                    st.session_state.brand_data['names'] = names
                    st.success("Brand names generated!")
                    st.rerun()
            else:
                st.warning("Please provide business description and industry")
    
    with col2:
        if st.button("💡 Generate Taglines", use_container_width=True):
            if 'selected_name' in st.session_state.brand_data and business_desc:
                with st.spinner("Creating taglines..."):
                    taglines = generate_taglines(
                        st.session_state.brand_data['selected_name'],
                        business_desc,
                        st.session_state.language,
                        count=3
                    )
                    st.session_state.brand_data['taglines'] = taglines
                    st.success("Taglines generated!")
                    st.rerun()
            else:
                st.warning("Please select a brand name first")
    
    # Display generated names
    if 'names' in st.session_state.brand_data:
        st.subheader("Generated Brand Names")
        
        # Get logo font for preview
        logo_font = st.session_state.brand_data.get('fonts', {}).get('logo', 'Montserrat')
        
        for i, name in enumerate(st.session_state.brand_data['names']):
            col1, col2 = st.columns([4, 1])
            
            with col1:
                st.markdown(f"""
                <div class='font-preview' style='font-family: {logo_font}, sans-serif; font-size: 24px; font-weight: bold;'>
                    {name}
                </div>
                """, unsafe_allow_html=True)
            
            with col2:
                if st.button("Select", key=f"select_name_{i}"):
                    st.session_state.brand_data['selected_name'] = name
                    st.success(f"Selected: {name}")
                    st.rerun()
    
    # Display selected name and taglines
    if 'selected_name' in st.session_state.brand_data:
        st.markdown("---")
        st.subheader(f"Selected Brand: {st.session_state.brand_data['selected_name']}")
        
        if 'taglines' in st.session_state.brand_data:
            st.write("**Taglines:**")
            for tagline in st.session_state.brand_data['taglines']:
                st.write(f"- {tagline}")
    
    st.markdown("</div>", unsafe_allow_html=True)

def render_brand_story():
    """Render brand story section"""
    
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.header("Brand Story")
    
    if 'selected_name' not in st.session_state.brand_data:
        st.info("Please generate and select a brand name first")
        st.markdown("</div>", unsafe_allow_html=True)
        return
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        business_desc = st.text_area("Business Description", height=100)
        industry = st.text_input("Industry")
    
    with col2:
        if st.button("✨ Generate Story", use_container_width=True):
            if business_desc and industry:
                with st.spinner("Crafting your brand story..."):
                    story = generate_brand_story(
                        st.session_state.brand_data['selected_name'],
                        business_desc,
                        industry,
                        st.session_state.language
                    )
                    st.session_state.brand_data['story'] = story
                    st.success("Brand story created!")
                    st.rerun()
    
    # Display story
    if 'story' in st.session_state.brand_data:
        story = st.session_state.brand_data['story']
        
        sections = [
            ("🔭 Vision", "vision"),
            ("🎯 Mission", "mission"),
            ("⚠️ Problem", "problem"),
            ("✅ Solution", "solution"),
            ("🏆 Positioning", "positioning")
        ]
        
        for title, key in sections:
            st.subheader(title)
            edited_text = st.text_area(
                f"Edit {key}",
                value=story.get(key, ""),
                height=100,
                key=f"story_{key}"
            )
            st.session_state.brand_data['story'][key] = edited_text
        
        # Sentiment Analysis
        st.markdown("---")
        st.subheader("📊 Sentiment Analysis")
        
        full_story = " ".join(story.values())
        sentiment = perform_sentiment_analysis(full_story)
        
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Polarity", sentiment['polarity'])
        col2.metric("Confidence", f"{sentiment['confidence']}%")
        col3.metric("Tone", sentiment['tone'])
        col4.metric("Alignment", sentiment['alignment'])
        
        if sentiment['polarity'] < 0:
            if st.button("🔄 Rewrite for Positive Tone"):
                with st.spinner("Rewriting..."):
                    rewritten = rewrite_for_sentiment(full_story, "positive", st.session_state.language)
                    st.write("**Rewritten Version:**")
                    st.write(rewritten)
    
    # Marketing Content
    st.markdown("---")
    st.subheader("📢 Marketing Content")
    
    if st.button("Generate Marketing Content"):
        if 'selected_name' in st.session_state.brand_data and business_desc:
            with st.spinner("Creating marketing content..."):
                content = generate_marketing_content(
                    st.session_state.brand_data['selected_name'],
                    business_desc,
                    st.session_state.language
                )
                st.session_state.brand_data['marketing'] = content
                st.success("Marketing content generated!")
                st.rerun()
    
    if 'marketing' in st.session_state.brand_data:
        marketing = st.session_state.brand_data['marketing']
        
        with st.expander("Short Description"):
            st.write(marketing.get('short_description', ''))
        
        with st.expander("Long Description"):
            st.write(marketing.get('long_description', ''))
        
        with st.expander("Social Media Caption"):
            st.write(marketing.get('social_caption', ''))
        
        with st.expander("Ad Copy"):
            st.write(marketing.get('ad_copy', ''))
        
        with st.expander("Email Copy"):
            st.write(marketing.get('email_copy', ''))
    
    st.markdown("</div>", unsafe_allow_html=True)

def render_visual_identity():
    """Render visual identity section"""
    
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.header("Visual Identity")
    
    # Color Palette
    st.subheader("🎨 Color Palette")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        palette_style = st.selectbox(
            "Palette Style",
            list(COLOR_PALETTE_STYLES.keys()),
            index=list(COLOR_PALETTE_STYLES.keys()).index(st.session_state.selected_palette_style)
        )
        st.session_state.selected_palette_style = palette_style
    
    with col2:
        if st.button("Generate Palette", use_container_width=True):
            if 'selected_name' in st.session_state.brand_data:
                industry = st.text_input("Industry for palette", key="palette_industry") or "General"
                with st.spinner("Creating color palette..."):
                    colors = generate_color_palette(
                        st.session_state.brand_data['selected_name'],
                        industry,
                        palette_style
                    )
                    st.session_state.brand_data['colors'] = colors
                    st.success("Palette generated!")
                    st.rerun()
    
    # Display and edit colors
    if 'colors' in st.session_state.brand_data:
        st.write("**Current Palette:**")
        
        # Visual preview
        color_html = ""
        for color in st.session_state.brand_data['colors']:
            color_html += f"<div class='color-box' style='background-color: {color};'></div>"
        
        st.markdown(color_html, unsafe_allow_html=True)
        
        # Manual editing
        st.write("**Edit Colors:**")
        cols = st.columns(5)
        
        for i, color in enumerate(st.session_state.brand_data['colors']):
            with cols[i]:
                new_color = st.color_picker(f"Color {i+1}", color, key=f"color_{i}")
                st.session_state.brand_data['colors'][i] = new_color
    
    st.markdown("---")
    
    # Typography
    st.subheader("✍️ Typography")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        logo_font = st.selectbox("Logo Font", FONT_CATEGORIES["Logo Fonts"], key="logo_font_select")
    
    with col2:
        heading_font = st.selectbox("Heading Font", FONT_CATEGORIES["Heading Fonts"], key="heading_font_select")
    
    with col3:
        body_font = st.selectbox("Body Font", FONT_CATEGORIES["Body Fonts"], key="body_font_select")
    
    # Save font selections
    st.session_state.brand_data['fonts'] = {
        "logo": logo_font,
        "heading": heading_font,
        "body": body_font
    }
    
    # Font Preview
    st.write("**Font Preview:**")
    
    brand_name = st.session_state.brand_data.get('selected_name', 'Your Brand')
    
    st.markdown(f"""
    <div class='font-preview'>
        <div style='font-family: {logo_font}, sans-serif; font-size: 36px; font-weight: bold; margin-bottom: 10px;'>
            {brand_name}
        </div>
        <div style='font-family: {heading_font}, sans-serif; font-size: 24px; font-weight: 600; margin-bottom: 10px;'>
            This is a Heading Example
        </div>
        <div style='font-family: {body_font}, sans-serif; font-size: 16px;'>
            This is body text. It should be easy to read and comfortable for longer content.
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("</div>", unsafe_allow_html=True)

def render_logo_studio():
    """Render logo generation and customization"""
    
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.header("Logo Studio")
    
    if 'selected_name' not in st.session_state.brand_data:
        st.info("Please generate and select a brand name first")
        st.markdown("</div>", unsafe_allow_html=True)
        return
    
    # Logo Type Selection
    col1, col2 = st.columns([2, 1])
    
    with col1:
        logo_type = st.selectbox("Logo Type", LOGO_TYPES, key="logo_type_select")
        industry = st.text_input("Industry", key="logo_industry")
    
    with col2:
        st.write("**Logo Type Guide:**")
        st.caption("**Lettermark**: Initials (e.g., IBM)")
        st.caption("**Wordmark**: Full name styled")
        st.caption("**Symbol**: Icon/abstract mark")
        st.caption("**Combination**: Symbol + text")
    
    # Generation Options
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🎨 Generate Logo", use_container_width=True):
            if industry:
                # Get sentiment for mood
                story_text = " ".join(st.session_state.brand_data.get('story', {}).values())
                sentiment = perform_sentiment_analysis(story_text) if story_text else {"tone": "Neutral"}
                
                # Get colors
                colors = st.session_state.brand_data.get('colors', ["#A8D5E2", "#FFD6E8", "#C5E1F5"])
                
                # Generate prompt
                prompt = generate_logo_prompt(
                    st.session_state.brand_data['selected_name'],
                    industry,
                    colors,
                    logo_type,
                    sentiment['tone']
                )
                
                with st.spinner("Generating logo... This may take a minute."):
                    logo_image = generate_logo_sdxl(prompt)
                    
                    if logo_image:
                        st.session_state.brand_data['logo'] = logo_image
                        st.session_state.brand_data['logo_prompt'] = prompt
                        st.success("Logo generated!")
                        st.rerun()
            else:
                st.warning("Please specify industry")
    
    with col2:
        if st.button("🔄 Regenerate", use_container_width=True):
            if 'logo_prompt' in st.session_state.brand_data:
                with st.spinner("Regenerating with variation..."):
                    # Use different seed for variation
                    import random
                    logo_image = generate_logo_sdxl(
                        st.session_state.brand_data['logo_prompt'],
                        seed=random.randint(1, 1000000)
                    )
                    
                    if logo_image:
                        st.session_state.brand_data['logo'] = logo_image
                        st.success("Logo regenerated!")
                        st.rerun()
    
    with col3:
        if st.button("⚙️ Customize", use_container_width=True):
            st.session_state.logo_customization_mode = not st.session_state.logo_customization_mode
            st.rerun()
    
    # Display Logo
    if 'logo' in st.session_state.brand_data:
        st.markdown("<div class='logo-container'>", unsafe_allow_html=True)
        st.image(st.session_state.brand_data['logo'], use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Customization Mode
        if st.session_state.logo_customization_mode:
            st.subheader("🎨 Customize Logo")
            
            st.write("**Adjust Parameters:**")
            
            col1, col2 = st.columns(2)
            
            with col1:
                color_intensity = st.slider("Color Intensity", 0.5, 1.5, 1.0, 0.1)
                spacing = st.slider("Spacing", 0.8, 1.2, 1.0, 0.1)
            
            with col2:
                icon_style = st.selectbox("Icon Style", ["Minimal", "Detailed", "Abstract"])
                layout = st.selectbox("Layout", ["Centered", "Left-aligned", "Stacked"])
            
            if st.button("Apply Customization"):
                # Update prompt with customization
                custom_prompt = st.session_state.brand_data['logo_prompt']
                custom_prompt += f", {icon_style.lower()} style, {layout.lower()} layout"
                
                with st.spinner("Applying customization..."):
                    logo_image = generate_logo_sdxl(custom_prompt)
                    
                    if logo_image:
                        st.session_state.brand_data['logo'] = logo_image
                        st.success("Customization applied!")
                        st.rerun()
        
        # Download Options
        st.markdown("---")
        st.subheader("📥 Download Logo")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # PNG Download
            buf = BytesIO()
            st.session_state.brand_data['logo'].save(buf, format="PNG")
            st.download_button(
                label="Download PNG",
                data=buf.getvalue(),
                file_name=f"{st.session_state.brand_data['selected_name']}_logo.png",
                mime="image/png"
            )
        
        with col2:
            # Transparent background version
            st.info("Transparent background processing available in full version")
    
    st.markdown("</div>", unsafe_allow_html=True)

def render_export_options():
    """Render export options"""
    
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.header("Export Brand Kit")
    
    if not st.session_state.brand_data:
        st.info("Generate your brand first to export")
        st.markdown("</div>", unsafe_allow_html=True)
        return
    
    st.subheader("Available Exports")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # JSON Export
        if st.button("📄 Export JSON Data", use_container_width=True):
            # Prepare data (exclude image objects)
            export_data = {k: v for k, v in st.session_state.brand_data.items() if k != 'logo'}
            export_data['exported_at'] = datetime.now().isoformat()
            export_data['user'] = st.session_state.user_email
            
            json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
            
            st.download_button(
                label="Download JSON",
                data=json_str,
                file_name=f"{st.session_state.brand_data.get('selected_name', 'brand')}_data.json",
                mime="application/json"
            )
    
    with col2:
        # Text Export
        if st.button("📝 Export Marketing Copy", use_container_width=True):
            marketing = st.session_state.brand_data.get('marketing', {})
            story = st.session_state.brand_data.get('story', {})
            
            text_content = f"""
BRAND: {st.session_state.brand_data.get('selected_name', 'N/A')}

TAGLINES:
{chr(10).join('- ' + t for t in st.session_state.brand_data.get('taglines', []))}

BRAND STORY:
Vision: {story.get('vision', '')}
Mission: {story.get('mission', '')}
Problem: {story.get('problem', '')}
Solution: {story.get('solution', '')}
Positioning: {story.get('positioning', '')}

MARKETING CONTENT:
Short Description: {marketing.get('short_description', '')}
Long Description: {marketing.get('long_description', '')}
Social Caption: {marketing.get('social_caption', '')}
Ad Copy: {marketing.get('ad_copy', '')}
Email Copy: {marketing.get('email_copy', '')}
"""
            
            st.download_button(
                label="Download TXT",
                data=text_content,
                file_name=f"{st.session_state.brand_data.get('selected_name', 'brand')}_copy.txt",
                mime="text/plain"
            )
    
    # PDF Export
    st.markdown("---")
    
    if st.button("📑 Generate PDF Brand Kit", use_container_width=True):
        with st.spinner("Creating PDF..."):
            try:
                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("Arial", "B", 24)
                
                # Title
                brand_name = st.session_state.brand_data.get('selected_name', 'Brand Kit')
                pdf.cell(0, 10, brand_name, ln=True, align="C")
                
                pdf.set_font("Arial", "", 12)
                pdf.ln(10)
                
                # Taglines
                pdf.set_font("Arial", "B", 16)
                pdf.cell(0, 10, "Taglines", ln=True)
                pdf.set_font("Arial", "", 12)
                
                for tagline in st.session_state.brand_data.get('taglines', []):
                    pdf.multi_cell(0, 10, f"- {tagline}")
                
                pdf.ln(5)
                
                # Story sections
                story = st.session_state.brand_data.get('story', {})
                sections = [
                    ("Vision", story.get('vision', '')),
                    ("Mission", story.get('mission', '')),
                    ("Problem", story.get('problem', '')),
                    ("Solution", story.get('solution', '')),
                    ("Positioning", story.get('positioning', ''))
                ]
                
                for title, content in sections:
                    if content:
                        pdf.set_font("Arial", "B", 14)
                        pdf.cell(0, 10, title, ln=True)
                        pdf.set_font("Arial", "", 11)
                        pdf.multi_cell(0, 8, content)
                        pdf.ln(3)
                
                # Colors
                if 'colors' in st.session_state.brand_data:
                    pdf.set_font("Arial", "B", 14)
                    pdf.cell(0, 10, "Color Palette", ln=True)
                    pdf.set_font("Arial", "", 11)
                    
                    for color in st.session_state.brand_data['colors']:
                        pdf.cell(0, 8, color, ln=True)
                    
                    pdf.ln(5)
                
                # Fonts
                if 'fonts' in st.session_state.brand_data:
                    pdf.set_font("Arial", "B", 14)
                    pdf.cell(0, 10, "Typography", ln=True)
                    pdf.set_font("Arial", "", 11)
                    
                    fonts = st.session_state.brand_data['fonts']
                    pdf.cell(0, 8, f"Logo Font: {fonts.get('logo', 'N/A')}", ln=True)
                    pdf.cell(0, 8, f"Heading Font: {fonts.get('heading', 'N/A')}", ln=True)
                    pdf.cell(0, 8, f"Body Font: {fonts.get('body', 'N/A')}", ln=True)
                
                # Save PDF
                pdf_output = pdf.output(dest='S').encode('latin-1')
                
                st.download_button(
                    label="Download PDF Brand Kit",
                    data=pdf_output,
                    file_name=f"{brand_name}_brandkit.pdf",
                    mime="application/pdf"
                )
                
                st.success("PDF generated successfully!")
                
            except Exception as e:
                st.error(f"Error generating PDF: {str(e)}")
    
    # Save Project
    st.markdown("---")
    st.subheader("💾 Save Project")
    
    project_name = st.text_input("Project Name", value=st.session_state.brand_data.get('selected_name', ''))
    
    if st.button("Save Project"):
        if project_name:
            projects = load_json_file(PROJECTS_FILE)
            
            project_id = f"{st.session_state.user_email}_{project_name}_{datetime.now().timestamp()}"
            
            # Prepare project data
            project_data = {k: v for k, v in st.session_state.brand_data.items() if k != 'logo'}
            project_data['project_name'] = project_name
            project_data['saved_at'] = datetime.now().isoformat()
            
            projects[project_id] = project_data
            save_json_file(PROJECTS_FILE, projects)
            
            # Update user's project list
            users = load_json_file(USERS_FILE)
            if st.session_state.user_email in users:
                if 'projects' not in users[st.session_state.user_email]:
                    users[st.session_state.user_email]['projects'] = []
                users[st.session_state.user_email]['projects'].append(project_id)
                save_json_file(USERS_FILE, users)
            
            st.success(f"Project '{project_name}' saved successfully!")
        else:
            st.warning("Please enter a project name")
    
    st.markdown("</div>", unsafe_allow_html=True)

# ==================== MAIN APPLICATION ====================

def main():
    """Main application entry point"""
    
    # Page config
    st.set_page_config(
        page_title="BrandForge AI",
        page_icon="🎨",
        layout="wide",
        initial_sidebar_state="collapsed"
    )
    
    # Initialize session state
    init_session_state()
    
    # Apply custom CSS
    apply_custom_css()
    
    # Check authentication
    if not st.session_state.authenticated:
        render_auth_page()
    else:
        render_dashboard()

if __name__ == "__main__":
    main()
