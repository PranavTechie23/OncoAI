from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.exceptions import Unauthorized
import os
import json
from dotenv import load_dotenv
import jwt
from werkzeug.exceptions import Unauthorized, InternalServerError

# Load environment variables
load_dotenv()

app = Flask(__name__, instance_relative_config=True)

# Ensure instance folder exists
os.makedirs(app.instance_path, exist_ok=True)

# Configuration
# Use instance folder for database (Flask standard practice)
db_path = os.path.join(app.instance_path, 'oncoai.db')
# Convert backslashes to forward slashes for SQLite URI (Windows compatibility)
db_path_uri = db_path.replace('\\', '/')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'sqlite:///{db_path_uri}')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
# Enforce authentication mode for a limited duration (in hours).
# Set ENFORCE_AUTH_HOURS to a positive integer to enable. Default 0 (disabled).
# IMPORTANT: This should be None (disabled) for normal development use.
try:
    enforce_hours_str = os.getenv('ENFORCE_AUTH_HOURS', '0').strip()
    enforce_hours = int(enforce_hours_str) if enforce_hours_str else 0
except (ValueError, TypeError):
    enforce_hours = 0
if enforce_hours > 0:
    from datetime import timedelta
    app.config['ENFORCE_AUTH_UNTIL'] = datetime.utcnow() + timedelta(hours=enforce_hours)
    print(f"[Config] Authentication enforcement enabled until {app.config['ENFORCE_AUTH_UNTIL']}")
else:
    app.config['ENFORCE_AUTH_UNTIL'] = None
    # Explicitly ensure it's None, not an empty string or other falsy value

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
# Configure CORS to allow Authorization header and credentials
CORS(app, 
     resources={r"/api/*": {
         "origins": "*",
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"],
         "expose_headers": ["Content-Type"],
         "supports_credentials": True
     }})

# Define models HERE after db is initialized to avoid circular import issues
class User(db.Model):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='doctor', nullable=False)
    # Additional profile fields for doctors
    phone = db.Column(db.String(50))
    institution = db.Column(db.String(200))
    department = db.Column(db.String(200))
    license = db.Column(db.String(100))
    npi = db.Column(db.String(50))
    specialty = db.Column(db.String(200))  # Primary specialty (required)
    subspecialty = db.Column(db.String(200))  # Subspecialty (optional)
    location = db.Column(db.String(200))  # Location (required)
    avatar_url = db.Column(db.String(400))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    patients = db.relationship('Patient', backref='doctor', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'institution': self.institution,
            'department': self.department,
            'license': self.license,
            'npi': self.npi,
            'specialty': self.specialty,
            'subspecialty': self.subspecialty,
            'location': self.location,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Patient(db.Model):
    """Patient model"""
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(300))
    status = db.Column(db.String(50))
    avatar_url = db.Column(db.Text)
    
    cancer_type = db.Column(db.String(100), nullable=False)
    cancer_subtype = db.Column(db.String(100))
    stage = db.Column(db.String(20))
    diagnosis_date = db.Column(db.Date)
    
    clinical_data = db.Column(db.Text)
    risk_score = db.Column(db.Float, default=0.0)
    risk_level = db.Column(db.String(20), default='low')
    ml_recommendations = db.Column(db.Text)
    treatment_protocol = db.Column(db.Text)
    
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    appointments = db.relationship('Appointment', backref='patient', lazy=True, cascade='all, delete-orphan')
    reports = db.relationship('Report', backref='patient', lazy=True, cascade='all, delete-orphan')
    
    def set_clinical_data(self, data):
        self.clinical_data = json.dumps(data) if data else None
    
    def get_clinical_data(self):
        return json.loads(self.clinical_data) if self.clinical_data else {}
    
    def set_ml_recommendations(self, recommendations):
        self.ml_recommendations = json.dumps(recommendations) if recommendations else None
    
    def get_ml_recommendations(self):
        return json.loads(self.ml_recommendations) if self.ml_recommendations else {}
    
    def set_treatment_protocol(self, protocol):
        self.treatment_protocol = json.dumps(protocol) if protocol else None
    
    def get_treatment_protocol(self):
        return json.loads(self.treatment_protocol) if self.treatment_protocol else {}
    
    def calculate_risk_level(self):
        if self.risk_score <= 50:
            self.risk_level = 'low'
        elif self.risk_score <= 75:
            self.risk_level = 'medium'
        else:
            self.risk_level = 'high'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'status': self.status,
            'avatar_url': self.avatar_url,
            'cancer_type': self.cancer_type,
            'cancer_subtype': self.cancer_subtype,
            'stage': self.stage,
            'diagnosis_date': self.diagnosis_date.isoformat() if self.diagnosis_date else None,
            'clinical_data': self.get_clinical_data(),
            'risk_score': self.risk_score,
            'risk_level': self.risk_level,
            'ml_recommendations': self.get_ml_recommendations(),
            'treatment_protocol': self.get_treatment_protocol(),
            'doctor_id': self.doctor_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Appointment(db.Model):
    """Appointment model"""
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    appointment_date = db.Column(db.DateTime, nullable=False)
    appointment_type = db.Column(db.String(50), default='consultation')
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='scheduled')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': self.patient.name if self.patient else None,
            'doctor_id': self.doctor_id,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'appointment_type': self.appointment_type,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Report(db.Model):
    """Report model"""
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)
    report_data = db.Column(db.Text)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_report_data(self, data):
        self.report_data = json.dumps(data) if data else None
    
    def get_report_data(self):
        return json.loads(self.report_data) if self.report_data else {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': self.patient.name if self.patient else None,
            'doctor_id': self.doctor_id,
            'report_type': self.report_type,
            'report_data': self.get_report_data(),
            'generated_at': self.generated_at.isoformat() if self.generated_at else None
        }

class Outcome(db.Model):
    """Outcome tracking model for real-world treatment outcomes"""
    __tablename__ = 'outcomes'
    
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    treatment_type = db.Column(db.String(50), nullable=False)  # chemo, targeted, immuno, etc.
    
    # Predicted outcomes (from ML model)
    predicted_response_probability = db.Column(db.Float)
    predicted_survival_1yr = db.Column(db.Float)
    predicted_survival_3yr = db.Column(db.Float)
    predicted_survival_5yr = db.Column(db.Float)
    predicted_response_rate = db.Column(db.Float)
    predicted_remission_probability = db.Column(db.Float)
    
    # Actual outcomes (recorded over time)
    actual_response = db.Column(db.String(20))  # complete, partial, stable, progression
    actual_response_date = db.Column(db.Date)
    actual_survival_status = db.Column(db.String(20))  # alive, deceased
    actual_survival_months = db.Column(db.Float)
    actual_remission_status = db.Column(db.String(20))  # in_remission, not_in_remission
    actual_remission_date = db.Column(db.Date)
    
    # Outcome data (JSON for flexible fields)
    outcome_data = db.Column(db.Text)  # Additional metrics, side effects, etc.
    
    treatment_start_date = db.Column(db.Date)
    treatment_end_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    patient = db.relationship('Patient', backref='outcomes')
    
    def set_outcome_data(self, data):
        self.outcome_data = json.dumps(data) if data else None
    
    def get_outcome_data(self):
        return json.loads(self.outcome_data) if self.outcome_data else {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'patient_name': self.patient.name if self.patient else None,
            'doctor_id': self.doctor_id,
            'treatment_type': self.treatment_type,
            'predicted_response_probability': self.predicted_response_probability,
            'predicted_survival_1yr': self.predicted_survival_1yr,
            'predicted_survival_3yr': self.predicted_survival_3yr,
            'predicted_survival_5yr': self.predicted_survival_5yr,
            'predicted_response_rate': self.predicted_response_rate,
            'predicted_remission_probability': self.predicted_remission_probability,
            'actual_response': self.actual_response,
            'actual_response_date': self.actual_response_date.isoformat() if self.actual_response_date else None,
            'actual_survival_status': self.actual_survival_status,
            'actual_survival_months': self.actual_survival_months,
            'actual_remission_status': self.actual_remission_status,
            'actual_remission_date': self.actual_remission_date.isoformat() if self.actual_remission_date else None,
            'outcome_data': self.get_outcome_data(),
            'treatment_start_date': self.treatment_start_date.isoformat() if self.treatment_start_date else None,
            'treatment_end_date': self.treatment_end_date.isoformat() if self.treatment_end_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
# Ensure database tables exist before importing routes or running any queries
from ml_service import ml_service

with app.app_context():
    # Create all tables defined by the models (idempotent)
    db.create_all()

# Import routes module and initialize it with models (avoids circular import)
import routes
# Initialize routes with db and models BEFORE importing blueprints
routes.init_routes(db, User, Patient, Appointment, Report, Outcome)

# Now import blueprints after initialization
from routes import auth_bp, patients_bp, recommendations_bp, reports_bp, appointments_bp, outcomes_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(patients_bp, url_prefix='/api/patients')
app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
app.register_blueprint(reports_bp, url_prefix='/api/reports')
app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
app.register_blueprint(outcomes_bp, url_prefix='/api/outcomes')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'ml_service': ml_service.is_available()
    }), 200

@app.route('/api', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'name': 'OncoAI API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'patients': '/api/patients',
            'recommendations': '/api/recommendations',
            'reports': '/api/reports',
            'appointments': '/api/appointments',
            'dashboard': '/api/dashboard/summary',
        }
    }), 200


# Debug endpoint to inspect request headers (development only)
@app.route('/api/debug/headers', methods=['GET'])
def debug_headers():
    try:
        # Return a small subset to avoid dumping sensitive info into logs
        auth = request.headers.get('Authorization')
        headers = {k: v for k, v in request.headers.items()}
        return jsonify({
            'authorization_present': bool(auth),
            'authorization_masked': (auth[:10] + '...') if auth else None,
            'headers': headers
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


def _get_dashboard_user():
    """Resolve current user from JWT if present, else return/create demo user."""
    token = None
    has_auth_header = 'Authorization' in request.headers
    
    if has_auth_header:
        auth_header = request.headers['Authorization']
        try:
            token = auth_header.split(' ')[1] if auth_header.startswith('Bearer ') else None
        except (IndexError, AttributeError):
            token = None

    if token:
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user_id = data.get('user_id')
            if user_id:
                user = User.query.get(user_id)
                if user:
                    print(f"[Dashboard] Authenticated user: {user.email} (ID: {user.id})")
                    return user
                else:
                    print(f"[Dashboard] User ID {user_id} from token not found in database")
        except jwt.ExpiredSignatureError:
            # If enforcement of auth is active, return 401 by raising a specific Exception
            if app.config.get('ENFORCE_AUTH_UNTIL') and datetime.utcnow() < app.config['ENFORCE_AUTH_UNTIL']:
                    raise Unauthorized('Authentication token expired (enforced)')
            # Otherwise silently fall back to demo user
            print(f"[Dashboard] Token expired, falling back to demo user")
            pass
        except jwt.InvalidTokenError as e:
            # Only log if auth is enforced, otherwise silently fall back
            if app.config.get('ENFORCE_AUTH_UNTIL') and datetime.utcnow() < app.config['ENFORCE_AUTH_UNTIL']:
                raise Unauthorized('Invalid authentication token (enforced)')
            print(f"[Dashboard] Invalid token: {e}, falling back to demo user")
            pass
        except Exception as e:
            # Only log unexpected errors, not normal fallback scenarios
            if app.config.get('ENFORCE_AUTH_UNTIL') and datetime.utcnow() < app.config['ENFORCE_AUTH_UNTIL']:
                raise Unauthorized(f'Authentication error: {str(e)} (enforced)')
            print(f"[Dashboard] Token decode error: {e}, falling back to demo user")
            pass
    else:
        # If enforcement of auth is active, raise to indicate no auth provided
        enforce_until = app.config.get('ENFORCE_AUTH_UNTIL')
        if enforce_until and datetime.utcnow() < enforce_until:
            raise Unauthorized('Authentication required (enforced)')
        # Otherwise silently proceed to demo user
        print(f"[Dashboard] No token provided, using demo user")

    # Fallback to shared demo user
    demo_email = 'demo@oncoai.com'
    user = User.query.filter_by(email=demo_email).first()
    if not user:
        user = User(email=demo_email, name='Demo Doctor', role='doctor')
        user.set_password('demo123')
        db.session.add(user)
        db.session.commit()
    print(f"[Dashboard] Using demo user: {user.email} (ID: {user.id})")
    return user


@app.route('/api/dashboard/summary', methods=['GET'])
def dashboard_summary():
    """Aggregate stats for dashboard cards & charts (per doctor/demo user)"""
    try:
        current_user = _get_dashboard_user()
    except Unauthorized as e:
        # If auth is enforced and required, return proper error response
        return jsonify({'message': str(e)}), 401
    except Exception as e:
        # For any other error, log and fall back to demo user
        print(f"[Dashboard] Error getting user, using demo: {e}")
        demo_email = 'demo@oncoai.com'
        current_user = User.query.filter_by(email=demo_email).first()
        if not current_user:
            current_user = User(email=demo_email, name='Demo Doctor', role='doctor')
            current_user.set_password('demo123')
            db.session.add(current_user)
            db.session.commit()
    
    try:
        # Filter all aggregates by current doctor's data
        from sqlalchemy import func, and_
        from collections import defaultdict
        
        range_type = request.args.get('range', '6months')
        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')

        now = datetime.utcnow()
        start_date = None
        
        if range_type == 'week':
            start_date = now - timedelta(days=7)
        elif range_type == 'month':
            start_date = now - timedelta(days=30)
        elif range_type == '3months':
            start_date = now - timedelta(days=90)
        elif range_type == '6months':
            start_date = now - timedelta(days=180)
        elif range_type == 'year':
            start_date = now - timedelta(days=365)
        elif range_type == 'custom' and start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            except:
                start_date = now - timedelta(days=180)

        print(f"[Dashboard] Fetching data for user: {current_user.email} (ID: {current_user.id}) with range: {range_type}")
        
        # Totals
        total_patients = Patient.query.filter_by(doctor_id=current_user.id).count()
        high_risk_patients = Patient.query.filter_by(doctor_id=current_user.id, risk_level='high').count()

        active_treatments = (
            Patient.query.filter(
                Patient.doctor_id == current_user.id,
                Patient.treatment_protocol.isnot(None)
            ).count()
        )

        ai_recommendations = (
            Patient.query.filter(
                Patient.doctor_id == current_user.id,
                Patient.ml_recommendations.isnot(None)
            ).count()
        )

        # Determine the timeline for padding
        timeline = []
        date_format = '%Y-%m-%d' if range_type in ['week', 'month'] else '%Y-%m'
        
        # DetermineGrouping & start_date
        now = datetime.utcnow()
        if not start_date:
            if range_type == 'week': start_date = now - timedelta(days=7)
            elif range_type == 'month': start_date = now - timedelta(days=30)
            elif range_type == '3months': start_date = now - timedelta(days=90)
            elif range_type == '6months': start_date = now - timedelta(days=180)
            elif range_type == 'year': start_date = now - timedelta(days=365)
            else: start_date = now - timedelta(days=180) # Default
            
        # Select grouping format based on range logic
        if range_type == 'custom' and start_date_str and end_date_str:
             try:
                sd = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                ed = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                diff = (ed - sd).days
                date_format = '%Y-%m-%d' if diff <= 45 else '%Y-%m'
                start_date = sd
             except: pass

        # Create the continuous timeline
        curr = start_date
        while curr <= now:
            timeline.append(curr.strftime(date_format))
            if date_format == '%Y-%m-%d':
                curr += timedelta(days=1)
            else:
                # Move to next month
                if curr.month == 12:
                    curr = curr.replace(year=curr.year + 1, month=1)
                else:
                    curr = curr.replace(month=curr.month + 1)
        
        print(f"[Dashboard] Timeline built with {len(timeline)} points for range {range_type}")

        # Growth Data
        growth_query = db.session.query(
            func.strftime(date_format, Patient.diagnosis_date).label('date_label'),
            func.count(Patient.id),
        ).filter(Patient.doctor_id == current_user.id, Patient.diagnosis_date >= start_date)
            
        growth_rows = growth_query.group_by('date_label').all()

        # Outcomes Data
        outcome_query = db.session.query(
            func.strftime(date_format, Report.generated_at).label('date_label'),
            func.count(Report.id),
        ).filter(Report.doctor_id == current_user.id, Report.generated_at >= start_date)
            
        outcome_rows = outcome_query.group_by('date_label').all()

        # Build map from existing data
        data_map = {label: count for label, count in growth_rows if label}
        outcome_map = {label: count for label, count in outcome_rows if label}

        # Merge statistics with padded timeline
        monthly_stats = []
        for label in timeline:
            m_stats = {
                'month': label,
                'patients': data_map.get(label, 0),
                'outcomes': outcome_map.get(label, 0),
                'treatments': outcome_map.get(label, 0) # Use outcomes as proxy for active engagement
            }
            
            # If data is monthly, convert raw YYYY-MM to nice names
            if date_format == '%Y-%m':
                try:
                    m_num = int(label.split('-')[1])
                    m_name = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m_num - 1]
                    # We append the year if it's over a year or we have multiple years
                    if range_type in ['year', 'custom']:
                        m_stats['month'] = f"{m_name} {label.split('-')[0][2:]}"
                    else:
                        m_stats['month'] = m_name
                except: pass
            
            monthly_stats.append(m_stats)

        top_patients_query = (
            Patient.query
            .filter_by(doctor_id=current_user.id)
            .order_by(Patient.risk_score.desc())
            .limit(6)
            .all()
        )
        top_patients = [{
            'id': p.id,
            'name': p.name,
            'riskScore': int(p.risk_score or 0),
            'risk_level': p.risk_level,
            'status': p.status or p.risk_level,
            'avatar_url': p.avatar_url,
            'cancer_type': p.cancer_type,
            'stage': p.stage,
            'change': 0,
        } for p in top_patients_query]

        recent_activities = []
        try:
          recent_appointments = (
              Appointment.query
              .filter_by(doctor_id=current_user.id)
              .order_by(Appointment.created_at.desc())
              .limit(6)
              .all()
          )
        except Exception:
          recent_appointments = []

        try:
          recent_reports = (
              Report.query
              .filter_by(doctor_id=current_user.id)
              .order_by(Report.generated_at.desc())
              .limit(6)
              .all()
          )
        except Exception:
          recent_reports = []

        for a in recent_appointments:
            recent_activities.append({
                'id': f'app-{a.id}',
                'type': 'appointment',
                'message': f'Appointment {a.status} for {a.patient.name if a.patient else "Unknown"}',
                'time': a.appointment_date.isoformat() if a.appointment_date else (a.created_at.isoformat() if a.created_at else None),
                'status': 'info',
            })

        for r in recent_reports:
            recent_activities.append({
                'id': f'rep-{r.id}',
                'type': 'report',
                'message': f'Report generated for {r.patient.name if r.patient else "Unknown"}',
                'time': r.generated_at.isoformat() if r.generated_at else None,
                'status': 'success',
            })

        try:
            recent_activities = sorted(
                [a for a in recent_activities if a.get('time')],
                key=lambda x: x['time'],
                reverse=True,
            )[:6]
        except Exception:
            pass

        def _pct_trend(current, previous, lower_is_better=False):
            if previous == 0:
                value = 100.0 if current > 0 else 0.0
            else:
                value = round(abs((current - previous) / previous) * 100, 1)
            is_positive = current >= previous
            if lower_is_better:
                is_positive = current <= previous
            return {'value': value, 'is_positive': is_positive}

        period_len = now - start_date
        prev_start = start_date - period_len

        curr_new_patients = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            Patient.created_at >= start_date,
        ).count()
        prev_new_patients = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            Patient.created_at >= prev_start,
            Patient.created_at < start_date,
        ).count()

        curr_treatments = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            Patient.treatment_protocol.isnot(None),
            Patient.updated_at >= start_date,
        ).count()
        prev_treatments = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            Patient.treatment_protocol.isnot(None),
            Patient.updated_at >= prev_start,
            Patient.updated_at < start_date,
        ).count()

        curr_high_risk = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            Patient.risk_level == 'high',
            Patient.updated_at >= start_date,
        ).count()
        prev_high_risk = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            Patient.risk_level == 'high',
            Patient.updated_at >= prev_start,
            Patient.updated_at < start_date,
        ).count()

        curr_ai = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            Patient.ml_recommendations.isnot(None),
            Patient.updated_at >= start_date,
        ).count()
        prev_ai = Patient.query.filter(
            Patient.doctor_id == current_user.id,
            Patient.ml_recommendations.isnot(None),
            Patient.updated_at >= prev_start,
            Patient.updated_at < start_date,
        ).count()

        trends = {
            'total_patients': _pct_trend(curr_new_patients, prev_new_patients),
            'active_treatments': _pct_trend(curr_treatments, prev_treatments),
            'high_risk_patients': _pct_trend(curr_high_risk, prev_high_risk, lower_is_better=True),
            'ai_recommendations': _pct_trend(curr_ai, prev_ai),
        }

        upcoming_appointments = []
        try:
            upcoming_rows = (
                Appointment.query
                .filter(
                    Appointment.doctor_id == current_user.id,
                    Appointment.appointment_date >= now,
                )
                .order_by(Appointment.appointment_date.asc())
                .limit(5)
                .all()
            )
            for apt in upcoming_rows:
                if (apt.status or '').lower() in ('cancelled', 'completed'):
                    continue
                upcoming_appointments.append({
                    'id': apt.id,
                    'patient_id': apt.patient_id,
                    'patient_name': apt.patient.name if apt.patient else 'Unknown',
                    'appointment_date': apt.appointment_date.isoformat() if apt.appointment_date else None,
                    'appointment_type': apt.appointment_type,
                    'status': apt.status,
                })
                if len(upcoming_appointments) >= 4:
                    break
        except Exception:
            upcoming_appointments = []

        ai_insights = []
        try:
            if high_risk_patients >= 3:
                ai_insights.append({
                    'id': 'multi-high-risk',
                    'type': 'alert',
                    'content': f'{high_risk_patients} patients are currently classified as high risk and need closer monitoring.',
                    'confidence': 90,
                })

            high_risk_rows = (
                Patient.query
                .filter_by(doctor_id=current_user.id, risk_level='high')
                .order_by(Patient.risk_score.desc())
                .limit(3)
                .all()
            )
            for patient in high_risk_rows:
                rec = patient.get_ml_recommendations() if hasattr(patient, 'get_ml_recommendations') else {}
                if rec:
                    ai_insights.append({
                        'id': f'rec-{patient.id}',
                        'type': 'recommendation',
                        'patient_name': patient.name,
                        'content': rec.get('summary', rec.get('title', 'Review AI treatment plan')),
                        'confidence': int(rec.get('confidence', patient.risk_score or 75)),
                        'patient_id': patient.id,
                    })
                else:
                    ai_insights.append({
                        'id': f'alert-{patient.id}',
                        'type': 'alert',
                        'patient_name': patient.name,
                        'content': f'High risk score ({int(patient.risk_score or 0)}). Review recommended.',
                        'confidence': int(patient.risk_score or 85),
                        'patient_id': patient.id,
                    })

            rec_patients = (
                Patient.query
                .filter(
                    Patient.doctor_id == current_user.id,
                    Patient.ml_recommendations.isnot(None),
                    Patient.risk_level != 'high',
                )
                .order_by(Patient.risk_score.desc())
                .limit(2)
                .all()
            )
            for patient in rec_patients:
                rec = patient.get_ml_recommendations()
                if not rec:
                    continue
                ai_insights.append({
                    'id': f'pred-{patient.id}',
                    'type': 'prediction',
                    'patient_name': patient.name,
                    'content': rec.get('summary', 'Positive treatment response predicted based on clinical markers.'),
                    'confidence': int(rec.get('confidence', patient.risk_score or 70)),
                    'patient_id': patient.id,
                })
        except Exception:
            ai_insights = ai_insights[:4]

        return jsonify({
            'total_patients': total_patients,
            'active_treatments': active_treatments,
            'high_risk_patients': high_risk_patients,
            'ai_recommendations': ai_recommendations,
            'monthly_stats': monthly_stats,
            'top_patients': top_patients,
            'recent_activities': recent_activities,
            'trends': trends,
            'upcoming_appointments': upcoming_appointments,
            'ai_insights': ai_insights[:4],
        }), 200
    except Unauthorized as ue:
        return jsonify({'message': str(ue)}), 401
    except Exception as e:
        import traceback
        print(f"Error in dashboard_summary: {traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("=" * 60)
        print("OncoAI Backend Server Starting...")
        print("=" * 60)
        print(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("Server: http://localhost:5000")
        print("Health Check: http://localhost:5000/api/health")
        print("=" * 60)
        print("Database initialized!")
        print("All routes registered!")
        print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
