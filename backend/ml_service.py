import os

import joblib

import pandas as pd

try:
    import shap
    HAS_SHAP = True
except Exception as e:
    shap = None
    HAS_SHAP = False
    print(f"Warning: shap import failed; ML explainability disabled: {e}")



from typing import Dict, Optional

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    # Use langchain-openai package for OpenAI support.
    from langchain_openai import OpenAI
    HAS_LANGCHAIN = True
except ImportError as e:
    HAS_LANGCHAIN = False
    OpenAI = None
    print(f"Warning: langchain_openai import failed; install langchain-openai to enable OpenAI support: {e}")





CALIBRATION_THRESHOLD = 0.4





class MLService:

    """

    Base ML service class.

    Backend already expects this interface.

    """


    
    def __init__(self):

        self.models_path = os.path.join(os.path.dirname(__file__), "models")
    
    def is_available(self) -> bool:
        """Check if ML service is available"""
        return False
    
    def generate_treatment_recommendations(self, patient_data: Dict) -> Dict:
        """Generate treatment recommendations - override in subclass"""
        return {"treatments": [], "note": "ML service not available"}
    
    def calculate_risk_score(self, patient_data: Dict) -> float:
        """Calculate risk score - override in subclass"""
        return 50.0
    
    def _predict_side_effects(self, patient_data: Dict, treatment: str, response_prob: float) -> Dict:
        """Predict side effects - override in subclass"""
        # Return empty side effects if service not available
        return {
            "common_side_effects": [],
            "monitoring_required": False,
            "risk_level": "moderate"
        }
    
    def _predict_outcomes(self, patient_data: Dict, treatment: str, response_prob: float) -> Dict:
        """Predict outcomes - override in subclass"""
        # Return default outcomes if service not available
        return {
            "survival_1yr": 0.50,
            "survival_3yr": 0.35,
            "survival_5yr": 0.25,
            "response_rate": 0.50,
            "remission_probability": 0.40,
            "progression_free_survival_months": 10,
            "quality_of_life_impact": "moderate",
            "confidence_level": "low"
        }





class OncoAIMLAdapter(MLService):

    """

    Adapter integrating a calibrated, explainable ML model

    into the OncoAI backend without changing frontend or APIs.

    """



    def __init__(self):

        super().__init__()



        # -----------------------------

        # Load calibrated model

        # -----------------------------

        model_path = os.path.join(self.models_path, "model_calibrated.pkl")

        if not os.path.exists(model_path):

            raise FileNotFoundError("model_calibrated.pkl not found in backend/models")



        self.calibrated_model = joblib.load(model_path)



        # Extract pipeline components

        self.pipeline = self.calibrated_model.estimator

        self.preprocessor = self.pipeline.named_steps["preprocessor"]

        self.rf_model = self.pipeline.named_steps["model"]



        # SHAP explainer (loaded once) if available

        self.shap_explainer = None
        self.shap_available = False
        if HAS_SHAP:
            try:
                self.shap_explainer = shap.TreeExplainer(self.rf_model)
                self.shap_available = True
            except Exception as e:
                print(f"Warning: shap explainer failed to initialize; explainability disabled: {e}")
                self.shap_explainer = None
                self.shap_available = False



        # LLM (text-only, explanation only) - optional
        self.llm = None
        self.llm_disabled = False  # Track if LLM was disabled due to errors
        if HAS_LANGCHAIN:
            openai_key = os.getenv('OPENAI_API_KEY')
            if openai_key:
                try:
                    self.llm = OpenAI(temperature=0.2, openai_api_key=openai_key)
                except Exception as e:
                    # Silently disable LLM if initialization fails
                    self.llm = None
                    self.llm_disabled = True



    # --------------------------------------------------

    # Availability check

    # --------------------------------------------------
    
    def is_available(self) -> bool:
        """Check if ML service is available"""
        return True
    
    # --------------------------------------------------

    # Feature builder (MUST match training exactly)

    # --------------------------------------------------
    
    def _convert_stage_to_int(self, stage) -> int:
        """Convert stage from string format (I, II, III, IV) to integer (1, 2, 3, 4)"""
        if isinstance(stage, (int, float)):
            return int(stage)
        
        stage_map = {"I": 1, "II": 2, "III": 3, "IV": 4, 
                     "1": 1, "2": 2, "3": 3, "4": 4}
        stage_str = str(stage).strip().upper()
        return stage_map.get(stage_str, 2)  # Default to 2 if unknown

    def _build_input_df(self, patient_data: Dict, treatment: str) -> pd.DataFrame:

        return pd.DataFrame([{

            "age": patient_data["age"],

            "cancer_stage": self._convert_stage_to_int(patient_data.get("stage", "II")),

            "targetable_mutation": int(

                patient_data.get("targetable_mutation", False)

            ),

            "comorbidity_score": patient_data.get("comorbidity_score", 0.3),

            "treatment_type": treatment

        }])



    # --------------------------------------------------

    # SHAP explanation (ground truth reasoning)

    # --------------------------------------------------

    def _get_shap_explanation(self, input_df: pd.DataFrame, top_k: int = 4) -> Dict:
        if not self.shap_available or self.shap_explainer is None:
            return {
                "positive_factors": {},
                "negative_factors": {}
            }

        X_trans = self.preprocessor.transform(input_df)

        shap_values = self.shap_explainer.shap_values(X_trans)



        # Normalize SHAP output across versions

        if isinstance(shap_values, list):

            shap_vals = shap_values[1][0]

        else:

            shap_vals = shap_values[0]

            if shap_vals.ndim == 2:

                shap_vals = shap_vals[:, 1]



        feature_names = self.preprocessor.get_feature_names_out()

        contrib = pd.Series(shap_vals, index=feature_names)



        return {

            "positive_factors": contrib.sort_values(ascending=False)

                                       .head(top_k)

                                       .round(3)

                                       .to_dict(),

            "negative_factors": contrib.sort_values()

                                       .head(top_k)

                                       .round(3)

                                       .to_dict()

        }



    # --------------------------------------------------

    # LLM explanation (SHAP-grounded ONLY)

    # --------------------------------------------------

    def _generate_llm_explanation(

        self,

        patient_data: Dict,

        treatment: str,

        prob: float,

        shap_data: Dict

    ) -> str:



        prompt = f"""

You are an AI-powered clinical decision-support assistant for oncology.

Your role is to EXPLAIN model predictions, not to make medical decisions.



Patient profile:

- Age: {patient_data["age"]}

- Cancer stage: {patient_data["stage"]}



Treatment option evaluated:

- Treatment modality: {treatment}

- Predicted likelihood of favorable response: {prob}



Model-derived reasoning (do NOT invent new factors):



Positive contributors:

{shap_data["positive_factors"]}



Negative contributors:

{shap_data["negative_factors"]}



Instructions:

- Explain why this treatment has the predicted likelihood

- Use clear, clinician-friendly language

- Only reference the factors listed above

- Emphasize uncertainty and patient variability

- Do NOT recommend a treatment

- Do NOT provide medical advice

- Do NOT introduce new assumptions



Output:

- One concise paragraph (5–7 sentences)

- Neutral, factual tone

- Suitable for clinical dashboard display

"""



        if self.llm is not None and not self.llm_disabled:
            try:
                return self.llm(prompt)
            except Exception as e:
                # Silently disable LLM after first failure (e.g., quota exceeded)
                # This prevents repeated error messages
                error_msg = str(e).lower()
                if 'quota' in error_msg or 'rate limit' in error_msg or 'billing' in error_msg:
                    self.llm_disabled = True
                # Fall through to fallback (no error printed - it's optional functionality)
        
        # Fallback explanation if LLM is not available
        positive_factors = shap_data.get("positive_factors", {})
        negative_factors = shap_data.get("negative_factors", {})
        
        explanation_parts = []
        explanation_parts.append(f"Based on the model analysis, {treatment} therapy has a {prob:.1%} predicted likelihood of favorable response for this patient.")
        
        if positive_factors:
            top_positive = list(positive_factors.items())[0] if positive_factors else None
            if top_positive:
                explanation_parts.append(f"Factors supporting this prediction include {top_positive[0]}.")
        
        if negative_factors:
            top_negative = list(negative_factors.items())[0] if negative_factors else None
            if top_negative:
                explanation_parts.append(f"Factors that may reduce response likelihood include {top_negative[0]}.")
        
        explanation_parts.append("Individual patient responses may vary. This prediction is intended to support clinical decision-making and should be considered alongside clinical judgment and patient-specific factors.")
        
        return " ".join(explanation_parts)



    # --------------------------------------------------

    # Outcome predictions

    # --------------------------------------------------

    def _predict_outcomes(self, patient_data: Dict, treatment: str, response_prob: float) -> Dict:

        """

        Predict treatment outcomes including survival rates, response rates, and remission probability

        Returns dict with outcome predictions

        """

        age = patient_data.get("age", 50)

        stage = patient_data.get("stage", "II")

        comorbidity_score = patient_data.get("comorbidity_score", 0.3)

        targetable_mutation = patient_data.get("targetable_mutation", False)

        

        # Base outcome probabilities by treatment type (scaled by response_prob)

        treatment_base_outcomes = {

            "chemo": {

                "survival_1yr": 0.70,

                "survival_3yr": 0.50,

                "survival_5yr": 0.40,

                "response_rate": 0.60,

                "remission_probability": 0.45,

                "progression_free_survival_months": 12

            },

            "targeted": {

                "survival_1yr": 0.75,

                "survival_3yr": 0.55,

                "survival_5yr": 0.45,

                "response_rate": 0.70,

                "remission_probability": 0.50,

                "progression_free_survival_months": 15

            },

            "immuno": {

                "survival_1yr": 0.65,

                "survival_3yr": 0.45,

                "survival_5yr": 0.35,

                "response_rate": 0.55,

                "remission_probability": 0.40,

                "progression_free_survival_months": 10

            },
            
            "radiation": {
                "survival_1yr": 0.72,
                "survival_3yr": 0.52,
                "survival_5yr": 0.42,
                "response_rate": 0.65,
                "remission_probability": 0.48,
                "progression_free_survival_months": 14
            },
            
            "surgery": {
                "survival_1yr": 0.85,
                "survival_3yr": 0.70,
                "survival_5yr": 0.60,
                "response_rate": 0.80,
                "remission_probability": 0.65,
                "progression_free_survival_months": 24
            },
            
            "combination": {
                "survival_1yr": 0.68,
                "survival_3yr": 0.48,
                "survival_5yr": 0.38,
                "response_rate": 0.62,
                "remission_probability": 0.46,
                "progression_free_survival_months": 11
            }

        }

        

        base = treatment_base_outcomes.get(treatment, treatment_base_outcomes["chemo"])

        

        # Adjust outcomes based on response probability

        # Higher response_prob = better outcomes

        response_multiplier = response_prob / 0.5  # Normalize around 0.5

        if response_multiplier > 1.5:

            response_multiplier = 1.5  # Cap improvement

        elif response_multiplier < 0.5:

            response_multiplier = 0.5  # Cap decline

        

        # Adjust for patient factors

        age_factor = 1.0

        if age > 70:

            age_factor = 0.85

        elif age > 65:

            age_factor = 0.90

        elif age < 50:

            age_factor = 1.10

        

        stage_factor = {

            "I": 1.20,

            "II": 1.05,

            "III": 0.90,

            "IV": 0.75

        }.get(stage, 1.0)

        

        comorbidity_factor = 1.0 - (comorbidity_score * 0.2)  # Higher comorbidity = worse outcomes

        mutation_factor = 1.10 if targetable_mutation and treatment == "targeted" else 1.0

        

        # Calculate adjusted outcomes

        outcomes = {

            "survival_1yr": round(min(0.95, base["survival_1yr"] * response_multiplier * age_factor * stage_factor * comorbidity_factor * mutation_factor), 3),

            "survival_3yr": round(min(0.90, base["survival_3yr"] * response_multiplier * age_factor * stage_factor * comorbidity_factor * mutation_factor), 3),

            "survival_5yr": round(min(0.85, base["survival_5yr"] * response_multiplier * age_factor * stage_factor * comorbidity_factor * mutation_factor), 3),

            "response_rate": round(min(0.95, base["response_rate"] * response_multiplier * mutation_factor), 3),

            "remission_probability": round(min(0.90, base["remission_probability"] * response_multiplier * stage_factor * comorbidity_factor), 3),

            "progression_free_survival_months": round(base["progression_free_survival_months"] * response_multiplier * stage_factor)

        }

        

        # Quality of life impact (estimated)

        qol_impact = "moderate"

        if comorbidity_score > 0.6 or age > 75:

            qol_impact = "high"

        elif stage in ["I", "II"] and age < 60:

            qol_impact = "low"

        

        return {

            **outcomes,

            "quality_of_life_impact": qol_impact,

            "confidence_level": "moderate"  # Can be enhanced with model uncertainty

        }

    

    # --------------------------------------------------

    # Side effects prediction

    # --------------------------------------------------

    def _predict_side_effects(self, patient_data: Dict, treatment: str, response_prob: float) -> Dict:

        """

        Predict likely side effects based on treatment type and patient factors

        Returns dict with side effects and their likelihood/probability

        """

        age = patient_data.get("age", 50)

        comorbidity_score = patient_data.get("comorbidity_score", 0.3)

        stage = patient_data.get("stage", "II")

        

        # Base side effects by treatment type

        treatment_side_effects = {

            "chemo": [

                {"name": "Nausea and Vomiting", "severity": "moderate", "probability": 0.85},

                {"name": "Fatigue", "severity": "moderate", "probability": 0.90},

                {"name": "Hair Loss", "severity": "mild", "probability": 0.70},

                {"name": "Bone Marrow Suppression", "severity": "moderate", "probability": 0.75},

                {"name": "Mouth Sores", "severity": "mild", "probability": 0.40},

                {"name": "Peripheral Neuropathy", "severity": "moderate", "probability": 0.50},

                {"name": "Infection Risk", "severity": "severe", "probability": 0.60},

            ],

            "targeted": [

                {"name": "Skin Rash", "severity": "moderate", "probability": 0.70},

                {"name": "Diarrhea", "severity": "moderate", "probability": 0.65},

                {"name": "Fatigue", "severity": "mild", "probability": 0.50},

                {"name": "Liver Toxicity", "severity": "moderate", "probability": 0.40},

                {"name": "Hypertension", "severity": "mild", "probability": 0.35},

                {"name": "Cardiac Toxicity", "severity": "severe", "probability": 0.20},

                {"name": "Eye Problems", "severity": "mild", "probability": 0.30},

            ],

            "immuno": [

                {"name": "Immune-Related Adverse Events", "severity": "severe", "probability": 0.50},

                {"name": "Fatigue", "severity": "moderate", "probability": 0.60},

                {"name": "Skin Rash", "severity": "mild", "probability": 0.40},

                {"name": "Colitis", "severity": "severe", "probability": 0.25},

                {"name": "Pneumonitis", "severity": "severe", "probability": 0.20},

                {"name": "Thyroid Dysfunction", "severity": "moderate", "probability": 0.30},

                {"name": "Hepatitis", "severity": "moderate", "probability": 0.25},

                {"name": "Endocrinopathies", "severity": "moderate", "probability": 0.20},

            ],
            
            "radiation": [
                {"name": "Skin Irritation", "severity": "moderate", "probability": 0.85},
                {"name": "Fatigue", "severity": "moderate", "probability": 0.80},
                {"name": "Hair Loss (Localized)", "severity": "mild", "probability": 0.70},
                {"name": "Mouth/Throat Sores", "severity": "moderate", "probability": 0.60},
                {"name": "Difficulty Swallowing", "severity": "moderate", "probability": 0.50},
                {"name": "Lung Inflammation", "severity": "severe", "probability": 0.25},
                {"name": "Heart Problems", "severity": "severe", "probability": 0.15},
                {"name": "Secondary Cancers", "severity": "severe", "probability": 0.10},
            ],
            
            "surgery": [
                {"name": "Pain", "severity": "moderate", "probability": 0.90},
                {"name": "Infection Risk", "severity": "moderate", "probability": 0.30},
                {"name": "Bleeding", "severity": "moderate", "probability": 0.25},
                {"name": "Blood Clots", "severity": "severe", "probability": 0.20},
                {"name": "Anesthesia Complications", "severity": "severe", "probability": 0.15},
                {"name": "Scarring", "severity": "mild", "probability": 0.80},
                {"name": "Organ Function Changes", "severity": "moderate", "probability": 0.40},
            ],
            
            "combination": [
                {"name": "Increased Fatigue", "severity": "moderate", "probability": 0.90},
                {"name": "Nausea and Vomiting", "severity": "moderate", "probability": 0.85},
                {"name": "Bone Marrow Suppression", "severity": "severe", "probability": 0.70},
                {"name": "Infection Risk", "severity": "severe", "probability": 0.65},
                {"name": "Multiple Organ Toxicity", "severity": "severe", "probability": 0.50},
                {"name": "Immune System Suppression", "severity": "severe", "probability": 0.60},
            ]

        }

        

        base_effects = treatment_side_effects.get(treatment, [])

        

        # Adjust probabilities based on patient factors

        adjusted_effects = []

        for effect in base_effects:

            prob = effect["probability"]

            

            # Older patients and higher comorbidity = higher risk

            if age > 65:

                prob *= 1.2

            if age > 75:

                prob *= 1.3

            if comorbidity_score > 0.5:

                prob *= 1.15

            

            # Advanced stage may increase some side effects

            if stage in ["III", "IV"] and effect["severity"] == "severe":

                prob *= 1.1

            

            # Lower response probability might correlate with more side effects

            if response_prob < 0.5:

                prob *= 1.1

            

            # Cap probability at 0.95

            prob = min(0.95, prob)

            

            adjusted_effects.append({

                **effect,

                "probability": round(prob, 3)

            })

        

        # Sort by probability (highest first) and return top 6

        adjusted_effects.sort(key=lambda x: x["probability"], reverse=True)

        

        return {

            "common_side_effects": adjusted_effects[:6],

            "monitoring_required": True,

            "risk_level": "high" if any(e["severity"] == "severe" and e["probability"] > 0.3 for e in adjusted_effects[:3]) else "moderate"

        }

    

    # --------------------------------------------------

    # Core prediction for one treatment

    # --------------------------------------------------

    def _predict_for_treatment(self, patient_data: Dict, treatment: str) -> Dict:

        input_df = self._build_input_df(patient_data, treatment)



        prob = float(self.calibrated_model.predict_proba(input_df)[0][1])

        shap_data = self._get_shap_explanation(input_df)



        llm_text = self._generate_llm_explanation(

            patient_data, treatment, round(prob, 3), shap_data

        )



        # Predict side effects

        side_effects = self._predict_side_effects(patient_data, treatment, prob)

        

        # Predict outcomes

        outcomes = self._predict_outcomes(patient_data, treatment, prob)



        return {

            "treatment": treatment,

            "response_probability": round(prob, 3),

            "predicted_response": int(prob >= CALIBRATION_THRESHOLD),

            "shap_explanation": shap_data,

            "llm_explanation": llm_text,

            "side_effects": side_effects,

            "outcomes": outcomes

        }



    # --------------------------------------------------

    # Public API: treatment recommendations

    # --------------------------------------------------

    def generate_treatment_recommendations(self, patient_data: Dict) -> Dict:

        # Only use treatments that were in the training data
        # Update this list if you retrain the model with additional treatment types
        treatments = ["chemo", "targeted", "immuno"]



        results = [

            self._predict_for_treatment(patient_data, t)

            for t in treatments

        ]



        results = sorted(

            results,

            key=lambda x: x["response_probability"],

            reverse=True

        )



        return {

            "treatments": results,

            "note": "AI-generated decision support. Final decisions rest with clinicians."

        }



    # --------------------------------------------------

    # Public API: risk score (adapter logic)

    # --------------------------------------------------

    def calculate_risk_score(self, patient_data: Dict) -> float:

        recs = self.generate_treatment_recommendations(patient_data)

        best_prob = recs["treatments"][0]["response_probability"]



        # Risk = inverse likelihood of favorable response

        return round((1 - best_prob) * 100, 2)


# For backward compatibility, try to use OncoAIMLAdapter, fallback to base MLService
try:
    ml_service = OncoAIMLAdapter()
except FileNotFoundError as e:
    print(f"Warning: {e}")
    print("Using placeholder ML service. Please ensure model_calibrated.pkl exists in backend/models/")
    ml_service = MLService()
except Exception as e:
    print(f"Warning: Error loading ML model: {e}")
    print("Using placeholder ML service.")
    ml_service = MLService()

