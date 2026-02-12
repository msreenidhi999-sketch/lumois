# 🎨 BrandForge AI

**AI-Powered Brand Identity Generation Platform**

BrandForge AI is a comprehensive Streamlit-based web application that uses advanced AI models to generate complete brand identities including names, stories, visual elements, and logos.

## ✨ Features

### 🔐 Authentication
- Secure signup/login with password hashing
- Session-based access control
- JSON-based user storage

### 🎯 Brand Generation
- **10 Creative Brand Names** using advanced linguistic techniques
  - Metaphorical framing
  - Phonetic rhythm
  - Industry relevance
  - Anti-plagiarism filtering
- **3 Compelling Taglines**
- **Multilingual Support**: English, Hindi, Telugu, Tamil, Spanish, French, German

### 📖 Brand Story
- Structured narrative with:
  - Vision
  - Mission
  - Problem
  - Solution
  - Positioning
- Emotionally persuasive storytelling
- Sentiment analysis with tone alignment
- Marketing content generation (descriptions, captions, ads, email copy)

### 🎨 Visual Identity
- **Color Palettes** with 7 curated styles:
  - Pastel, Bold Modern, Luxury, Earthy, Monochrome, Vibrant, Neutral
- Dynamic palette switching
- Manual HEX code editing
- Real-time UI preview
- **Typography System**:
  - Independent logo, heading, and body font selection
  - Live font previews
  - Categorized font libraries

### 🖼️ Logo Studio
- **Intelligent Logo Generation** via Stable Diffusion XL
  - Lettermark, Wordmark, Symbol-based, Combination Mark
  - Sentiment-influenced design
  - Bright, attention-grabbing options
- **Customization Mode**:
  - Edit typography, spacing, icon style, layout
  - Color intensity adjustment
  - Non-destructive editing
- **Regeneration** with genuine variations
- Download support (PNG)

### 🤖 AI Consultant
- Floating chat widget (bottom-right corner)
- Helps refine business ideas before generation
- Powered by Groq LLaMA-3.3-70B

### 📦 Export Options
- PDF Brand Kit
- PNG Logo
- TXT Marketing Copy
- JSON Brand Data
- Project saving and versioning

### 🎨 UI/UX
- Muted pastel color scheme
- Glassmorphism cards with soft shadows
- Light/Dark theme toggle
- Language selector
- Responsive layout
- Smooth animations

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- API Keys:
  - [Groq API Key](https://console.groq.com/)
  - [HuggingFace Token](https://huggingface.co/settings/tokens)
  - [Stability AI Key](https://platform.stability.ai/) (optional)

### Installation

1. **Clone or navigate to the project directory**
```bash
cd "c:\Users\msree\Downloads\brandforge-ai (1)"
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables**

Edit `.env` file and add your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
HF_API_TOKEN=your_huggingface_token_here
STABILITY_API_KEY=your_stability_api_key_here
```

4. **Run the application**
```bash
streamlit run app.py
```

5. **Open in browser**
The app will automatically open at `http://localhost:8501`

## 📖 Usage Guide

### 1. Authentication
- **Sign Up**: Create a new account with email and password
- **Login**: Access your dashboard with credentials

### 2. Generate Brand
- Describe your business and industry
- Click "Generate Brand Names" to get 10 creative options
- Select your favorite name (previewed in logo font)
- Generate taglines for the selected brand

### 3. Create Brand Story
- Input business description and industry
- Click "Generate Story" for structured narrative
- Edit sections as needed
- Analyze sentiment and generate marketing content

### 4. Design Visual Identity
- Choose color palette style
- Generate and customize 5-color palette
- Select logo, heading, and body fonts
- Preview typography in real-time

### 5. Create Logo
- Select logo type (Lettermark, Wordmark, etc.)
- Generate logo with AI
- Regenerate for variations
- Customize typography, spacing, colors
- Download PNG

### 6. AI Consultant
- Click chat widget (💬) in bottom-right
- Discuss business ideas
- Get guidance before generation

### 7. Export
- Download PDF Brand Kit
- Export marketing copy as TXT
- Save brand data as JSON
- Save project for later editing

## 🛠️ Technology Stack

- **Frontend**: Streamlit
- **AI Models**:
  - Groq LLaMA-3.3-70B-Versatile (brand generation)
  - Stable Diffusion XL (logo generation)
  - IBM Granite 4.0 (consultant - fallback to Groq)
- **Authentication**: Passlib + Bcrypt
- **Storage**: JSON files
- **Image Processing**: Pillow
- **PDF Generation**: FPDF
- **Sentiment Analysis**: TextBlob

## 📁 Project Structure

```
brandforge-ai/
├── app.py              # Main application (single file)
├── requirements.txt    # Python dependencies
├── .env               # Environment configuration
├── users.json         # User database (auto-created)
└── projects.json      # Saved projects (auto-created)
```

## 🔒 Security Notes

- Passwords are hashed using bcrypt
- API keys stored in `.env` (never commit to version control)
- Session-based authentication
- Input validation on all forms

## 🌍 Multilingual Support

Supported languages:
- English
- Hindi (हिंदी)
- Telugu (తెలుగు)
- Tamil (தமிழ்)
- Spanish (Español)
- French (Français)
- German (Deutsch)

## 🐛 Troubleshooting

### Logo generation fails
- Verify `HF_API_TOKEN` is set correctly
- Check HuggingFace API status
- Ensure stable internet connection

### Groq API errors
- Verify `GROQ_API_KEY` is valid
- Check API rate limits
- Ensure sufficient credits

### Installation issues
- Use Python 3.8 or higher
- Install PyTorch separately if needed: `pip install torch --index-url https://download.pytorch.org/whl/cpu`

## 📝 License

This project is for educational and commercial use.

## 🤝 Support

For issues or questions, please check:
- API documentation: [Groq](https://console.groq.com/docs), [HuggingFace](https://huggingface.co/docs)
- Streamlit docs: [streamlit.io](https://docs.streamlit.io)

---

**Built with ❤️ using Streamlit and AI**
