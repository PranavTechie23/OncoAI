<p align="center">
  <img src="assets/OncoAI.png" alt="OncoAI Logo" height = "200" width="180" />
</p>

<h1 align="center">OncoAI — Personalized Cancer Treatment Planning Platform</h1>



> **An enterprise-grade, AI-powered clinical decision support system for precision oncology.**

---

## 🌟 Overview

OncoAI is a cutting-edge, full-stack healthcare platform designed to revolutionize cancer treatment planning through artificial intelligence. Built with modern web technologies, it provides oncologists and healthcare professionals with intelligent tools for personalized patient care, treatment recommendations, and comprehensive clinical data management.

## Features

- 🤖 **AI-Powered Recommendations** - ML-driven personalized treatment suggestions with risk assessment
- 🧠 **ML Model Integration** - Easy integration of your trained cancer treatment models
- 📊 **Analytics & Reports** - Comprehensive patient data analysis and visualization
- 👥 **Patient Management** - Complete patient records with clinical data storage
- 📅 **Appointment Scheduling** - Manage patient appointments and follow-ups
- 💬 **AI Chatbot** - Interactive assistant powered by OpenAI/Gemini
- 📈 **Treatment Pathways** - Visualize patient-specific treatment protocols
- 🎯 **Risk Assessment** - AI-calculated risk scores based on clinical factors
- 🌓 **Dark Mode** - Beautiful dark and light themes
- ✨ **Premium Aesthetics** - State-of-the-art glassmorphism UI with interactive micro-animations and dynamic canvas backgrounds
- 🔐 **Authentication** - Secure JWT-based login and user management


---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **Vite** | 5.4.19 | Build tool |
| **Tailwind CSS** | 3.4.17 | Styling |
| **shadcn/ui** | Latest | Component library |
| **React Router** | 6.30.1 | Routing |
| **Recharts** | 2.15.4 | Data visualization |
| **Framer Motion** | 12.23.26 | Animations |
| **React Query** | 5.83.0 | Data fetching |
| **OpenAI/Gemini** | Latest | AI chatbot |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask** | 3.0.0 | Web framework |
| **SQLAlchemy** | 3.1.1 | ORM |
| **Flask-CORS** | 4.0.0 | CORS handling |
| **PyJWT** | 2.8.0 | Authentication |
| **scikit-learn** | 1.3.2 | ML models |
| **pandas** | 2.1.3 | Data processing |
| **SHAP** | 0.43.0 | Model explainability |
| **SQLite/PostgreSQL** | - | Database |

---
## Features Overview

### Dashboard
- Real-time analytics and metrics
- Patient overview and trends
- Quick actions and shortcuts

### Patient Management
- Comprehensive patient records
- Risk score assessment
- Treatment history tracking
- Genomic profile analysis

### AI Recommendations
- Personalized treatment suggestions
- Confidence scoring
- Benefits and risk analysis
- Priority-based filtering

### Reports
- Interactive charts and visualizations
- Exportable reports (PDF, Excel)
- Custom date ranges
- Treatment outcome analysis


### Appointments
- Calendar view
- Schedule management
- Doctor assignment
- Status tracking

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.8+
- **pip** (Python package manager)
- **Git** (for cloning the repository)

### Quick Start (Both Servers)

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## 📁 Project Structure

```
.
├── backend/                    # Flask backend application
│   ├── app.py                 # Main Flask application
│   ├── routes.py              # API routes and endpoints
│   ├── ml_service.py          # ML model service integration
│   ├── models/                # Trained ML models
│   │   └── model_calibrated.pkl
│   ├── instance/              # Database instance
│   │   └── oncoai.db
│   ├── requirements.txt       # Python dependencies
│   └── seed_*.py              # Database seeding scripts
│
├── src/                        # React frontend source
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── Header.tsx        # Navigation header
│   │   ├── Footer.tsx        # Footer component
│   │   ├── ChatBot.tsx       # AI chatbot
│   │   └── ...               # Other components
│   ├── pages/                # Page components
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Patients.tsx      # Patient management
│   │   ├── Recommendations.tsx
│   │   └── ...               # Other pages
│   ├── services/             # API services
│   │   ├── api.ts           # Backend API client
│   │   └── chatService.ts   # Chat service
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utilities and configs
│
├── public/                    # Static assets
│   └── OncoAI.png           # Logo
│
├── package.json              # Frontend dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS config
└── README.md                # This file
```


### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=sqlite:///oncoai.db
SECRET_KEY=your-secret-key-here
ENFORCE_AUTH_HOURS=0
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-your-key-here
# OR
VITE_GEMINI_API_KEY=your-gemini-key-here
```

---

## 🏗️ Building for Production

### Frontend Build

```bash
npm run build
```

The production build will be in the `dist` directory.

### Backend Deployment

For production deployment:

1. Set `FLASK_ENV=production` in environment variables
2. Use a production WSGI server (e.g., Gunicorn)
3. Configure PostgreSQL instead of SQLite
4. Set secure `SECRET_KEY`
5. Enable HTTPS
6. Configure CORS for production domain

---

## 🧪 Testing

```bash
# Backend tests
cd backend
python test_clinical_data.py
python test_dashboard_api.py
python test_recommendations.py

# Frontend tests (if configured)
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow PEP 8 for Python code
- Use ESLint and Prettier for TypeScript/React code
- Write meaningful commit messages
- Add comments for complex logic



## 🔮 Roadmap (Suggested Enhancements)

* 🔬 Genomic variant interpretation (VCF support)
* 🧠 Deep learning models for survival analysis
* 📜 Clinical guideline alignment (NCCN / ESMO)
* 🏥 Hospital EMR integration (FHIR-ready)
* 🔒 HIPAA/GDPR compliance layer
* ☁️ Cloud deployment (Docker + AWS/GCP)



## 📄 License

**Private / Proprietary**
All rights reserved.


> ⚠️ **Disclaimer**: OncoAI is a decision-support tool and not a replacement for professional medical judgment.
>
> 
<div align="center">

**Made with ❤️ by Pranav Oswal**