# SEO-Brain 🧠

AI-powered SEO content analysis platform with subscription management, real-time analytics, and intelligent content optimization.

![SEO-Brain Dashboard](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![.NET Core](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Subscription Tiers](#subscription-tiers)
- [Docker Deployment](#docker-deployment)
- [Development](#development)

## ✨ Features

- **AI-Powered SEO Analysis** - Analyze content for SEO score, keyword detection, readability metrics
- **Content Editor** - Rich text editor with real-time analysis
- **Subscription Management** - Free, Pro, and Enterprise tiers with Stripe integration
- **Analytics Dashboard** - Track analysis history, scores, and usage statistics
- **User Authentication** - JWT-based auth with refresh tokens
- **Real-time Insights** - AI-generated suggestions and content improvements
- **Responsive Design** - Beautiful glassmorphism UI with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  .NET Core API   │────▶│  Python AI      │
│   (Port 5173)   │     │  (Port 5120)     │     │  (Port 8000)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │   SQL Server    │
         │              │   (Port 1433)   │
         │              └─────────────────┘
         │
    ┌────┴────┐
    │  Stripe │
    │ Payments│
    └─────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework with hooks
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Axios** - HTTP client

### Backend (Core API)
- **.NET 8** - Web API framework
- **Entity Framework Core** - ORM for database access
- **ASP.NET Core Identity** - Authentication & user management
- **JWT Bearer** - Token-based authentication
- **Stripe.net** - Payment processing
- **SQL Server** - Primary database
- **Redis** - Caching layer

### AI Service
- **Python 3.11** - Runtime environment
- **FastAPI** - High-performance API framework
- **spaCy / NLP** - Text analysis and keyword extraction
- **Transformers** - AI-powered content suggestions

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Nginx** - Reverse proxy (production)

## 🚀 Getting Started

### Prerequisites
- Docker Desktop
- Node.js 18+ (for local client development)
- .NET 8 SDK (for local API development)
- Python 3.11+ (for local AI service)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   

2. **Configure environment variables**
   ```bash
   # Copy and edit the configuration files
   cp server-ai/.env.example server-ai/.env
   # Edit appsettings.json for Stripe keys
   ```

3. **Start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Core API: http://localhost:5120
   - AI Service: http://localhost:8000

### Manual Development Setup

#### 1. Database (SQL Server)
```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 --name sqlserver \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

#### 2. Core API (.NET)
```bash
cd server-core/SEOBrain.API
dotnet restore
dotnet ef database update
dotnet run
```

#### 3. AI Service (Python)
```bash
cd server-ai
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### 4. Client (React)
```bash
cd client
npm install
npm run dev
```

## ⚙️ Configuration

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Dashboard
3. Create products and prices in Stripe
4. Configure `appsettings.json`:

```json
"Stripe": {
  "SecretKey": "sk_test_...",
  "PublishableKey": "pk_test_...",
  "WebhookSecret": "whsec_...",
  "PriceIds": {
    "Pro": "price_1...",
    "Enterprise": "price_1..."
  }
}
```

### Database Connection

Update `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=SEOBrainDB;Trusted_Connection=true;TrustServerCertificate=True;",
  "Redis": "localhost:6379"
}
```

### JWT Configuration
```json
"Jwt": {
  "Key": "your-super-secret-key-here-min-32-chars-long!",
  "Issuer": "SEOBrain",
  "Audience": "SEOBrain-Client"
}
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Content Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis` | Analyze content |
| GET | `/api/analysis/history` | Get analysis history |

### Subscription
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription/tiers` | Get pricing tiers |
| POST | `/api/subscription/checkout` | Create checkout session |
| GET | `/api/subscription/status` | Get subscription status |
| POST | `/api/subscription/webhook` | Stripe webhook |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Get dashboard stats |

## 💳 Subscription Tiers

| Tier | Price | Analyses/Month | Features |
|------|-------|----------------|----------|
| **Free** | $0 | 10 | Basic SEO score, keyword detection, readability metrics |
| **Pro** | $29.99 | 100 | AI deep analysis, content enhancement, competitor insights, priority support |
| **Enterprise** | $99.99 | 500 | API access, team collaboration, custom integrations, dedicated support, white-label |

## 🐳 Docker Deployment

### Production Build
```bash
docker-compose -f docker-compose.yml up --build -d
```

### Services
| Service | Image | Port | Description |
|---------|-------|------|-------------|
| client | windsurf-client | 5173 | React frontend |
| server-core | windsurf-api | 5120 | .NET Core API |
| server-ai | windsurf-ai | 8000 | Python AI service |
| sqlserver | mssql/server | 1433 | SQL Server database |

### Environment Variables

Create `.env` files for each service:

**server-ai/.env**
```env
AI_MODEL_PATH=/app/models
LOG_LEVEL=INFO
```

## 💻 Development

### Project Structure
```
windsurf-project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # Auth context
│   │   └── App.jsx         # Main app
│   └── package.json
├── server-core/            # .NET Core API
│   └── SEOBrain.API/
│       ├── Controllers/    # API controllers
│       ├── Models/         # Entity models
│       ├── DTOs/           # Data transfer objects
│       └── Program.cs
├── server-ai/              # Python AI service
│   ├── main.py
│   └── requirements.txt
└── docker-compose.yml
```

### Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: EditorConfig + dotnet format
- **AI Service**: Black + isort

### Testing
```bash
# Frontend
cd client
npm run test

# Backend
cd server-core/SEOBrain.API
dotnet test

# AI Service
cd server-ai
pytest
```

## 🔒 Security

- JWT tokens with refresh mechanism
- Password hashing with ASP.NET Identity
- Stripe webhook signature verification
- Rate limiting on API endpoints
- HTTPS in production

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and feature requests, please use GitHub Issues.

---

Made with ❤️ using React, .NET, and Python
