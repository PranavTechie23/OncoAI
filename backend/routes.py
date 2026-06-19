from flask import Blueprint, request, jsonify, current_app
from flask_sqlalchemy import SQLAlchemy
from ml_service import ml_service
import json
from datetime import datetime, timedelta
from functools import wraps
import jwt
import os

# These will be imported from app after it's initialized
# We use a function to get them to avoid circular imports
db = None
User = None
Patient = None
Appointment = None
Report = None

def init_routes(db_instance, User_model, Patient_model, Appointment_model, Report_model, Outcome_model):
    """Initialize route dependencies"""
    global db, User, Patient, Appointment, Report, Outcome
    db = db_instance
    User = User_model
    Patient = Patient_model
    Appointment = Appointment_model
    Report = Report_model
    Outcome = Outcome_model

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            # Debug: log received Authorization header (masked)
            try:
                masked = auth_header[:10] + '...' if auth_header else 'None'
            except Exception:
                masked = str(auth_header)
            print(f"[Auth] Received Authorization header: {masked}")
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, current_app.config.get('SECRET_KEY', os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')), algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Optional authentication decorator - allows access with or without token
def optional_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                pass
        
        if token:
            try:
                data = jwt.decode(token, current_app.config.get('SECRET_KEY', os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')), algorithms=['HS256'])
                current_user = User.query.get(data['user_id'])
            except jwt.ExpiredSignatureError:
                # If auth enforcement is active, return 401
                enforce_until = current_app.config.get('ENFORCE_AUTH_UNTIL')
                if enforce_until and datetime.utcnow() < enforce_until:
                    return jsonify({'message': 'Token has expired'}), 401
                # otherwise proceed without auth (demo)
                pass
            except Exception:
                pass
        
        # If no user, create or get default demo user
        if not current_user:
            # if auth enforcement is active and there's no valid user, raise to force 401
            enforce_until = current_app.config.get('ENFORCE_AUTH_UNTIL')
            if enforce_until and datetime.utcnow() < enforce_until:
                return jsonify({'message': 'Authentication required'}), 401
            # Get or create default demo user
            default_user = User.query.filter_by(email='demo@oncoai.com').first()
            if not default_user:
                default_user = User(
                    email='demo@oncoai.com',
                    name='Demo Doctor',
                    role='doctor'
                )
                default_user.set_password('demo123')
                db.session.add(default_user)
                db.session.commit()
            current_user = default_user
        
        return f(current_user, *args, **kwargs)
    return decorated

# Auth Blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'User already exists'}), 400
        
        user = User(
            email=data['email'],
            name=data.get('name', 'User'),
            role=data.get('role', 'doctor'),
            phone=data.get('phone'),
            institution=data.get('institution'),
            department=data.get('department'),
            license=data.get('license'),
            npi=data.get('npi'),
            specialty=data.get('specialty'),
            subspecialty=data.get('subspecialty'),
            location=data.get('location'),
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@optional_auth
def get_current_user(current_user):
    """Return current authenticated (or demo) user"""
    try:
        return jsonify({'user': current_user.to_dict()}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500


@auth_bp.route('/me', methods=['PUT'])
@optional_auth
def update_current_user(current_user):
    """Update current authenticated (or demo) user profile"""
    try:
        data = request.get_json() or {}
        # Accept common profile fields
        if 'name' in data:
            current_user.name = data['name']
        if 'email' in data:
            current_user.email = data['email']
        if 'role' in data:
            current_user.role = data['role']
        # Optional profile fields
        # store additional metadata in a JSON column or extend model; for now attach attributes
        for field in ['phone', 'institution', 'department', 'license', 'npi', 'specialty', 'subspecialty']:
            if field in data:
                try:
                    setattr(current_user, field, data[field])
                except Exception:
                    pass

        db.session.commit()
        return jsonify({'message': 'Profile updated', 'user': current_user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()

        if not user:
            # Auto-create the demo account during development if it is missing.
            if data['email'] == 'demo@oncoai.com' and data['password'] == 'demo123':
                user = User(
                    email='demo@oncoai.com',
                    name='Demo Doctor',
                    role='doctor'
                )
                user.set_password('demo123')
                db.session.add(user)
                db.session.commit()

        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Generate JWT token
        import jwt
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'exp': datetime.utcnow() + timedelta(hours=24)  # 24 hours
        }, current_app.config.get('SECRET_KEY', os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')), algorithm='HS256')
        # Debug: log successful login and token length (do not print token value)
        try:
            tlen = len(token)
        except Exception:
            tlen = 'unknown'
        print(f"[Auth] Login successful for {user.email} (id={user.id}), token length={tlen}")

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Patients Blueprint
patients_bp = Blueprint('patients', __name__)

@patients_bp.route('', methods=['GET'])
@optional_auth
def get_patients(current_user):
    """Get all patients for the current user"""
    try:
        patients = Patient.query.filter_by(doctor_id=current_user.id).all()
        return jsonify({
            'patients': [p.to_dict() for p in patients]
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@patients_bp.route('/<int:patient_id>', methods=['GET'])
@optional_auth
def get_patient(current_user, patient_id):
    """Get patient by ID"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        return jsonify(patient.to_dict()), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@patients_bp.route('', methods=['POST'])
@optional_auth
def create_patient(current_user):
    """Create a new patient"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'message': 'Name is required'}), 400
        if not data.get('age'):
            return jsonify({'message': 'Age is required'}), 400
        if not data.get('cancer_type'):
            return jsonify({'message': 'Cancer type is required'}), 400
        if not data.get('stage'):
            return jsonify({'message': 'Stage is required'}), 400
        
        # Calculate risk score using ML service
        patient_data = {
            'age': data.get('age', 50),
            'gender': data.get('gender', ''),
            'cancer_type': data.get('cancer_type', ''),
            'stage': data.get('stage', ''),
            'clinical_data': data.get('clinical_data', {})
        }
        
        risk_score = ml_service.calculate_risk_score(patient_data)
        
        # Parse diagnosis date safely
        diagnosis_date = None
        if data.get('diagnosis_date'):
            try:
                diagnosis_date = datetime.strptime(data['diagnosis_date'], '%Y-%m-%d').date()
            except ValueError:
                # Try alternative date format
                try:
                    diagnosis_date = datetime.strptime(data['diagnosis_date'], '%d-%m-%Y').date()
                except ValueError:
                    pass
        
        patient = Patient(
            name=data['name'],
            age=int(data['age']),
            gender=data.get('gender', 'unknown'),
            email=data.get('email'),
            phone=data.get('phone'),
            cancer_type=data['cancer_type'],
            cancer_subtype=data.get('cancer_subtype'),
            stage=data.get('stage'),
            diagnosis_date=diagnosis_date,
            doctor_id=current_user.id,
            risk_score=risk_score,
            clinical_data=json.dumps(data.get('clinical_data', {})) if data.get('clinical_data') is not None else None
        )
        patient.calculate_risk_level()
        
        db.session.add(patient)
        db.session.commit()
        
        return jsonify({
            'message': 'Patient created successfully',
            'patient': patient.to_dict()
        }), 201
    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Error creating patient: {traceback.format_exc()}")
        return jsonify({'message': f'Error creating patient: {str(e)}'}), 500

@patients_bp.route('/<int:patient_id>', methods=['PUT'])
@optional_auth
def update_patient(current_user, patient_id):
    """Update patient"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        data = request.get_json()
        
        # Update standard fields
        if 'name' in data: patient.name = data['name']
        if 'age' in data: patient.age = int(data['age'])
        if 'gender' in data: patient.gender = data['gender']
        if 'email' in data: patient.email = data['email']
        if 'phone' in data: patient.phone = data['phone']
        if 'address' in data: patient.address = data['address']
        if 'cancer_type' in data: patient.cancer_type = data['cancer_type']
        if 'cancer_subtype' in data: patient.cancer_subtype = data['cancer_subtype']
        if 'stage' in data: patient.stage = data['stage']
        if 'status' in data: patient.status = data['status']
        if 'avatar_url' in data: patient.avatar_url = data['avatar_url']
        
        if 'diagnosis_date' in data:
            if data['diagnosis_date']:
                try:
                    patient.diagnosis_date = datetime.strptime(data['diagnosis_date'], '%Y-%m-%d').date()
                except ValueError:
                    pass
            else:
                patient.diagnosis_date = None
        
        if 'clinical_data' in data:
            patient.set_clinical_data(data['clinical_data'])
        
        # Recalculate risk score if core attributes changed
        trigger_fields = ['age', 'gender', 'cancer_type', 'stage', 'clinical_data']
        if any(field in data for field in trigger_fields):
            patient_data = {
                'age': patient.age,
                'gender': patient.gender,
                'cancer_type': patient.cancer_type,
                'stage': patient.stage,
                'clinical_data': patient.get_clinical_data()
            }
            patient.risk_score = ml_service.calculate_risk_score(patient_data)
            patient.calculate_risk_level()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Patient updated successfully',
            'patient': patient.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Error updating patient: {traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@patients_bp.route('/<int:patient_id>', methods=['DELETE'])
@token_required
def delete_patient(current_user, patient_id):
    """Delete patient"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        db.session.delete(patient)
        db.session.commit()
        
        return jsonify({'message': 'Patient deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Recommendations Blueprint
recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('', methods=['GET'])
@optional_auth
def list_recommendations(current_user):
    """List AI recommendations for all patients of the current (or demo) doctor"""
    try:
        patients = Patient.query.filter_by(doctor_id=current_user.id).all()
        items = []
        for p in patients:
            rec = p.get_ml_recommendations() if hasattr(p, "get_ml_recommendations") else {}
            if not rec:
                continue

            # Map risk level to priority
            priority = "Low"
            if p.risk_level == "high":
                priority = "High"
            elif p.risk_level == "medium":
                priority = "Medium"

            confidence = int(rec.get("confidence", p.risk_score or 75))
            status = rec.get("status", "Pending Review")
            impact = rec.get("impact", "High" if p.risk_level == "high" else "Medium")

            items.append({
                "id": p.id,
                "patientName": p.name,
                "priority": priority,
                "title": rec.get("title", "Personalized Treatment Plan"),
                "description": rec.get("summary", "AI-generated treatment optimization based on latest patient data."),
                "confidence": confidence,
                "impact": impact,
                "category": rec.get("category", "Treatment"),
                "benefits": rec.get("benefits", []),
                "risks": rec.get("risks", []),
                "status": status,
            })

        return jsonify({"recommendations": items}), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@recommendations_bp.route('/patient/<int:patient_id>', methods=['GET'])
@optional_auth
def get_recommendations(current_user, patient_id):
    """Get AI recommendations for a patient"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        # Extract clinical data for ML model
        clinical_data = patient.get_clinical_data()
        
        # Map patient data to ML model expected format
        # The new model expects: age, stage, targetable_mutation, comorbidity_score
        patient_data = {
            'age': patient.age,
            'stage': patient.stage or 'II',  # Default to stage II if not set
            'targetable_mutation': clinical_data.get('targetable_mutation', False),
            'comorbidity_score': clinical_data.get('comorbidity_score', 0.3)
        }
        
        recommendations = ml_service.generate_treatment_recommendations(patient_data)
        
        # Save recommendations to patient
        patient.set_ml_recommendations(recommendations)
        # Update risk score based on ML model output
        patient.risk_score = ml_service.calculate_risk_score(patient_data)
        patient.calculate_risk_level()
        db.session.commit()
        
        return jsonify({
            'patient_id': patient_id,
            'recommendations': recommendations
        }), 200
    except Exception as e:
        import traceback
        print(f"Error generating recommendations: {traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

# Reports Blueprint
reports_bp = Blueprint('reports', __name__)

@reports_bp.route('', methods=['GET'])
@token_required
def get_reports(current_user):
    """Get all reports for the current user"""
    try:
        reports = Report.query.filter_by(doctor_id=current_user.id).all()
        return jsonify({
            'reports': [r.to_dict() for r in reports]
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@reports_bp.route('/patient/<int:patient_id>', methods=['POST'])
@token_required
def generate_report(current_user, patient_id):
    """Generate a report for a patient"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        report_data = {
            'patient_info': patient.to_dict(),
            'risk_assessment': {
                'score': patient.risk_score,
                'level': patient.risk_level
            },
            'recommendations': patient.get_ml_recommendations(),
            'generated_at': datetime.utcnow().isoformat()
        }
        
        report = Report(
            patient_id=patient_id,
            doctor_id=current_user.id,
            report_type='comprehensive',
            report_data=report_data
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify({
            'message': 'Report generated successfully',
            'report': report.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@reports_bp.route('/patient/<int:patient_id>/download', methods=['GET'])
@token_required
def download_patient_report(current_user, patient_id):
    """Download a comprehensive report for a patient as JSON"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        # Get recommendations if available
        recommendations = patient.get_ml_recommendations()
        if not recommendations or not recommendations.get('treatments'):
            # Generate recommendations if not available
            from ml_service import ml_service
            clinical_data = patient.get_clinical_data()
            patient_data = {
                'age': patient.age,
                'stage': patient.stage or 'II',
                'targetable_mutation': clinical_data.get('targetable_mutation', False),
                'comorbidity_score': clinical_data.get('comorbidity_score', 0.3)
            }
            recommendations = ml_service.generate_treatment_recommendations(patient_data)
        
        report_data = {
            'patient_info': {
                'name': patient.name,
                'age': patient.age,
                'gender': patient.gender,
                'email': patient.email,
                'phone': patient.phone,
                'cancer_type': patient.cancer_type,
                'cancer_subtype': patient.cancer_subtype,
                'stage': patient.stage,
                'diagnosis_date': patient.diagnosis_date.isoformat() if patient.diagnosis_date else None,
            },
            'clinical_data': patient.get_clinical_data(),
            'risk_assessment': {
                'score': patient.risk_score,
                'level': patient.risk_level
            },
            'recommendations': recommendations,
            'generated_at': datetime.utcnow().isoformat(),
            'generated_by': current_user.name,
            'doctor_email': current_user.email
        }
        
        return jsonify(report_data), 200
    except Exception as e:
        import traceback
        print(f"Error generating download report: {traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

# Appointments Blueprint
appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('', methods=['GET'])
@optional_auth
def get_appointments(current_user):
    """Get all appointments for the current (or demo) doctor"""
    try:
        appointments = Appointment.query.filter_by(doctor_id=current_user.id).all()
        return jsonify({
            'appointments': [a.to_dict() for a in appointments]
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@appointments_bp.route('', methods=['POST'])
@optional_auth
def create_appointment(current_user):
    """Create a new appointment (works with demo user)"""
    try:
        data = request.get_json()
        
        appointment = Appointment(
            patient_id=data['patient_id'],
            doctor_id=current_user.id,
            appointment_date=datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00')),
            appointment_type=data.get('appointment_type', 'consultation'),
            notes=data.get('notes'),
            status=data.get('status', 'scheduled')
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment created successfully',
            'appointment': appointment.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
@optional_auth
def update_appointment(current_user, appointment_id):
    """Update appointment"""
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        data = request.get_json()
        
        if 'appointment_date' in data:
            appointment.appointment_date = datetime.fromisoformat(data['appointment_date'].replace('Z', '+00:00'))
        if 'status' in data:
            appointment.status = data['status']
        if 'notes' in data:
            appointment.notes = data['notes']
        if 'appointment_type' in data:
            appointment.appointment_type = data['appointment_type']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment updated successfully',
            'appointment': appointment.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['DELETE'])
@optional_auth
def delete_appointment(current_user, appointment_id):
    """Delete appointment"""
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'message': 'Appointment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Outcomes Blueprint
outcomes_bp = Blueprint('outcomes', __name__)

@outcomes_bp.route('/patient/<int:patient_id>', methods=['GET'])
@token_required
def get_patient_outcomes(current_user, patient_id):
    """Get all outcomes for a patient"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        outcomes = Outcome.query.filter_by(patient_id=patient_id).order_by(Outcome.created_at.desc()).all()
        
        return jsonify({
            'patient_id': patient_id,
            'outcomes': [o.to_dict() for o in outcomes]
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@outcomes_bp.route('/patient/<int:patient_id>', methods=['POST'])
@token_required
def create_outcome(current_user, patient_id):
    """Create or update an outcome record for a patient"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        data = request.get_json()
        
        # Check if outcome already exists for this treatment
        existing = Outcome.query.filter_by(
            patient_id=patient_id,
            treatment_type=data.get('treatment_type')
        ).first()
        
        if existing:
            # Update existing outcome
            outcome = existing
        else:
            # Create new outcome
            outcome = Outcome(
                patient_id=patient_id,
                doctor_id=current_user.id,
                treatment_type=data.get('treatment_type')
            )
            db.session.add(outcome)
        
        # Update predicted outcomes (from ML recommendations)
        if 'predicted_response_probability' in data:
            outcome.predicted_response_probability = data['predicted_response_probability']
        if 'predicted_survival_1yr' in data:
            outcome.predicted_survival_1yr = data['predicted_survival_1yr']
        if 'predicted_survival_3yr' in data:
            outcome.predicted_survival_3yr = data['predicted_survival_3yr']
        if 'predicted_survival_5yr' in data:
            outcome.predicted_survival_5yr = data['predicted_survival_5yr']
        if 'predicted_response_rate' in data:
            outcome.predicted_response_rate = data['predicted_response_rate']
        if 'predicted_remission_probability' in data:
            outcome.predicted_remission_probability = data['predicted_remission_probability']
        
        # Update actual outcomes
        if 'actual_response' in data:
            outcome.actual_response = data['actual_response']
        if 'actual_response_date' in data:
            outcome.actual_response_date = datetime.strptime(data['actual_response_date'], '%Y-%m-%d').date() if data['actual_response_date'] else None
        if 'actual_survival_status' in data:
            outcome.actual_survival_status = data['actual_survival_status']
        if 'actual_survival_months' in data:
            outcome.actual_survival_months = data['actual_survival_months']
        if 'actual_remission_status' in data:
            outcome.actual_remission_status = data['actual_remission_status']
        if 'actual_remission_date' in data:
            outcome.actual_remission_date = datetime.strptime(data['actual_remission_date'], '%Y-%m-%d').date() if data['actual_remission_date'] else None
        if 'treatment_start_date' in data:
            outcome.treatment_start_date = datetime.strptime(data['treatment_start_date'], '%Y-%m-%d').date() if data['treatment_start_date'] else None
        if 'treatment_end_date' in data:
            outcome.treatment_end_date = datetime.strptime(data['treatment_end_date'], '%Y-%m-%d').date() if data['treatment_end_date'] else None
        if 'notes' in data:
            outcome.notes = data['notes']
        if 'outcome_data' in data:
            outcome.set_outcome_data(data['outcome_data'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Outcome saved successfully',
            'outcome': outcome.to_dict()
        }), 200 if existing else 201
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Error saving outcome: {traceback.format_exc()}")
        return jsonify({'message': str(e)}), 500

@outcomes_bp.route('/<int:outcome_id>', methods=['PUT'])
@token_required
def update_outcome(current_user, outcome_id):
    """Update an outcome record"""
    try:
        outcome = Outcome.query.get(outcome_id)
        if not outcome:
            return jsonify({'message': 'Outcome not found'}), 404
        
        if outcome.doctor_id != current_user.id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update fields
        for key, value in data.items():
            if hasattr(outcome, key):
                if key in ['actual_response_date', 'actual_remission_date', 'treatment_start_date', 'treatment_end_date']:
                    if value:
                        setattr(outcome, key, datetime.strptime(value, '%Y-%m-%d').date())
                    else:
                        setattr(outcome, key, None)
                elif key == 'outcome_data':
                    outcome.set_outcome_data(value)
                else:
                    setattr(outcome, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Outcome updated successfully',
            'outcome': outcome.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@outcomes_bp.route('/comparison/patient/<int:patient_id>', methods=['GET'])
@token_required
def get_outcome_comparison(current_user, patient_id):
    """Get comparison between predicted and actual outcomes"""
    try:
        patient = Patient.query.filter_by(id=patient_id, doctor_id=current_user.id).first()
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        outcomes = Outcome.query.filter_by(patient_id=patient_id).all()
        
        comparisons = []
        for outcome in outcomes:
            comparison = {
                'treatment_type': outcome.treatment_type,
                'predicted': {
                    'response_probability': outcome.predicted_response_probability,
                    'survival_1yr': outcome.predicted_survival_1yr,
                    'survival_3yr': outcome.predicted_survival_3yr,
                    'survival_5yr': outcome.predicted_survival_5yr,
                    'response_rate': outcome.predicted_response_rate,
                    'remission_probability': outcome.predicted_remission_probability,
                },
                'actual': {
                    'response': outcome.actual_response,
                    'survival_status': outcome.actual_survival_status,
                    'survival_months': outcome.actual_survival_months,
                    'remission_status': outcome.actual_remission_status,
                },
                'treatment_dates': {
                    'start': outcome.treatment_start_date.isoformat() if outcome.treatment_start_date else None,
                    'end': outcome.treatment_end_date.isoformat() if outcome.treatment_end_date else None,
                }
            }
            comparisons.append(comparison)
        
        return jsonify({
            'patient_id': patient_id,
            'comparisons': comparisons
        }), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

