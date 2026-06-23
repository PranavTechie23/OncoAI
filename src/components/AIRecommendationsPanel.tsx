import { Suspense, lazy, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pill,
  Activity,
  Zap,
  Loader2,
  X,
  Download,
  Share2,
  Info,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { TreatmentPathway } from "@/components/TreatmentPathway";
import { PatientTreatmentView } from "@/components/PatientTreatmentView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadReportAsPDF } from "@/utils/reportDownload";
const AIRecommendationsChart = lazy(() => import("@/components/AIRecommendationsChart").then((mod) => ({ default: mod.default })));

interface AIRecommendationsPanelProps {
  patientId: number;
  patientData: any;
  onClose?: () => void;
}

export function AIRecommendationsPanel({
  patientId,
  patientData,
  onClose,
}: AIRecommendationsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"clinical" | "patient">("clinical");

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getRecommendations(patientId);
      setRecommendations(response.recommendations || response);
      toast.success("AI recommendations generated successfully!");
    } catch (err: any) {
      console.error("Error generating recommendations:", err);
      setError(err.message || "Failed to generate recommendations");
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-generate recommendations when panel opens
    if (patientId) {
      generateRecommendations();
    }
  }, [patientId]);

  const handleDownloadReport = async () => {
    try {
      toast.info("Generating report...");
      const reportData = await apiService.downloadPatientReport(patientId);
      downloadReportAsPDF(reportData);
      toast.success("Report downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading report:", error);
      toast.error(error.message || "Failed to download report");
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 50) return "success";
    if (score <= 75) return "warning";
    return "destructive";
  };

  const getRiskLevel = (score: number) => {
    if (score <= 50) return "Low";
    if (score <= 75) return "Medium";
    return "High";
  };

  const formatTreatmentName = (treatment: string) => {
    const names: { [key: string]: string } = {
      chemo: "Chemotherapy",
      targeted: "Targeted Therapy",
      immuno: "Immunotherapy",
      radiation: "Radiation Therapy",
      surgery: "Surgery",
      combination: "Combination Therapy",
    };
    return names[treatment] || treatment.charAt(0).toUpperCase() + treatment.slice(1);
  };

  // Calculate risk score from best treatment (highest response probability)
  const riskScore = recommendations?.treatments?.[0]
    ? Math.round((1 - recommendations.treatments[0].response_probability) * 100)
    : 50;

  const riskLevel = getRiskLevel(riskScore);
  const riskColor = getRiskColor(riskScore);

  // Prepare chart data for treatment comparison
  const treatmentChartData =
    recommendations?.treatments?.map((t: any) => ({
      name: formatTreatmentName(t.treatment),
      probability: Math.round(t.response_probability * 100),
      response: t.predicted_response ? "Yes" : "No",
    })) || [];

  if (loading && !recommendations) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Analyzing patient data with AI...</p>
          <p className="text-sm text-muted-foreground mt-2">
            This may take a few moments
          </p>
        </div>
      </Card>
    );
  }

  if (error && !recommendations) {
    return (
      <Card className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={generateRecommendations} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  if (!recommendations) {
    return (
      <Card className="p-8">
        <div className="text-center py-8">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">AI Treatment Recommendations</h3>
          <p className="text-muted-foreground mb-6">
            Generate personalized treatment recommendations based on patient data
          </p>
          <Button onClick={generateRecommendations} size="lg" className="gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Recommendations
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              AI Treatment Recommendations
            </h2>
            <p className="text-sm text-muted-foreground">
              Personalized recommendations based on patient data analysis
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "clinical" | "patient")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clinical">Clinical View</TabsTrigger>
          <TabsTrigger value="patient">Patient View</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Patient-Friendly View */}
      {viewMode === "patient" && (
        <PatientTreatmentView recommendations={recommendations} patientData={patientData} />
      )}

      {/* Clinical View */}
      {viewMode === "clinical" && (
        <>
      {/* Risk Assessment */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-success/10 dark:from-primary/20 dark:via-primary/10 dark:to-success/20 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Risk Assessment
            </h3>
            <p className="text-sm text-muted-foreground">
              Calculated from treatment response probabilities
            </p>
          </div>
          <Badge
            className={`bg-${riskColor}/10 text-${riskColor} border-${riskColor}/20 text-lg px-4 py-2`}
          >
            {riskLevel.toUpperCase()}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Risk Score</span>
            <span className="font-bold text-foreground">{riskScore}%</span>
          </div>
          <Progress value={riskScore} className="h-3" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <Info className="h-3 w-3" />
            <span>
              Based on predicted treatment response:{" "}
              {Math.round((recommendations?.treatments?.[0]?.response_probability || 0) * 100)}%
            </span>
          </div>
        </div>
      </Card>

      {/* Treatment Comparison Chart */}
      {treatmentChartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Treatment Response Probability Comparison
          </h3>
          <Suspense fallback={<div className="h-64 rounded-3xl bg-muted animate-pulse" />}>
            <AIRecommendationsChart treatmentChartData={treatmentChartData} />
          </Suspense>
        </Card>
      )}

      {/* Recommended Treatments */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Treatment Recommendations
        </h3>
        <div className="space-y-6">
          {recommendations.treatments?.map((treatment: any, idx: number) => {
            const probPercent = Math.round(treatment.response_probability * 100);
            const isRecommended = treatment.predicted_response === 1;
            
            return (
              <div
                key={idx}
                className={`p-5 border-2 rounded-lg transition-all ${
                  idx === 0
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {/* Treatment Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-foreground text-xl">
                        {formatTreatmentName(treatment.treatment)}
                      </h4>
                      {idx === 0 && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Best Option
                        </Badge>
                      )}
                      {isRecommended ? (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Recommended
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Not Recommended
                        </Badge>
                      )}
                    </div>
                    
                    {/* Response Probability */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Response Probability</span>
                        <span className="font-bold text-foreground text-lg">
                          {probPercent}%
                        </span>
                      </div>
                      <Progress value={probPercent} className="h-3" />
                    </div>
                  </div>
                </div>

                {/* LLM Explanation */}
                {treatment.llm_explanation && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-start gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary mt-0.5" />
                      <h5 className="font-semibold text-foreground text-sm">
                        AI Explanation
                      </h5>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {treatment.llm_explanation}
                    </p>
                  </div>
                )}

                {/* SHAP Explanation */}
                {treatment.shap_explanation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Positive Factors */}
                    {treatment.shap_explanation.positive_factors &&
                      Object.keys(treatment.shap_explanation.positive_factors).length > 0 && (
                        <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                          <div className="flex items-center gap-2 mb-3">
                            <ArrowUp className="h-4 w-4 text-success" />
                            <h5 className="font-semibold text-success text-sm">
                              Positive Factors
                            </h5>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(
                              treatment.shap_explanation.positive_factors
                            ).map(([factor, value]: [string, any]) => (
                              <div
                                key={factor}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {factor.replace(/_/g, " ")}
                                </span>
                                <Badge variant="outline" className="bg-success/20 border-success/30">
                                  +{Number(value).toFixed(2)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Negative Factors */}
                    {treatment.shap_explanation.negative_factors &&
                      Object.keys(treatment.shap_explanation.negative_factors).length > 0 && (
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                          <div className="flex items-center gap-2 mb-3">
                            <ArrowDown className="h-4 w-4 text-destructive" />
                            <h5 className="font-semibold text-destructive text-sm">
                              Negative Factors
                            </h5>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(
                              treatment.shap_explanation.negative_factors
                            ).map(([factor, value]: [string, any]) => (
                              <div
                                key={factor}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {factor.replace(/_/g, " ")}
                                </span>
                                <Badge variant="outline" className="bg-destructive/20 border-destructive/30">
                                  {Number(value).toFixed(2)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Side Effects Prediction */}
                {treatment.side_effects && treatment.side_effects.common_side_effects && (
                  <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <h5 className="font-semibold text-foreground text-sm">
                          Predicted Side Effects
                        </h5>
                      </div>
                      {treatment.side_effects.risk_level && (
                        <Badge
                          variant={
                            treatment.side_effects.risk_level === "high"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {treatment.side_effects.risk_level === "high"
                            ? "High Risk"
                            : "Moderate Risk"}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {treatment.side_effects.common_side_effects.map(
                        (effect: any, idx: number) => {
                          const severityColors = {
                            mild: "text-blue-600 bg-blue-50 border-blue-200",
                            moderate: "text-warning bg-warning/10 border-warning/30",
                            severe: "text-destructive bg-destructive/10 border-destructive/30",
                          };
                          const severityColor =
                            severityColors[
                              effect.severity as keyof typeof severityColors
                            ] || severityColors.moderate;

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-background rounded border"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm text-foreground font-medium">
                                  {effect.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${severityColor}`}
                                >
                                  {effect.severity?.charAt(0).toUpperCase() +
                                    effect.severity?.slice(1) || "Unknown"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {Math.round((effect.probability || 0) * 100)}%
                                </span>
                                <div className="w-16">
                                  <Progress
                                    value={(effect.probability || 0) * 100}
                                    className="h-1.5"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                    {treatment.side_effects.monitoring_required && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Close monitoring recommended during treatment
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Outcome Predictions */}
                {treatment.outcomes && (
                  <div className="mt-4 p-4 bg-success/5 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <h5 className="font-semibold text-foreground text-sm">
                        Predicted Outcomes
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-background rounded border">
                        <p className="text-xs text-muted-foreground mb-1">1-Year Survival</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((treatment.outcomes.survival_1yr || 0) * 100)}%
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="text-xs text-muted-foreground mb-1">3-Year Survival</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((treatment.outcomes.survival_3yr || 0) * 100)}%
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="text-xs text-muted-foreground mb-1">5-Year Survival</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((treatment.outcomes.survival_5yr || 0) * 100)}%
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="text-xs text-muted-foreground mb-1">Response Rate</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((treatment.outcomes.response_rate || 0) * 100)}%
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="text-xs text-muted-foreground mb-1">Remission</p>
                        <p className="text-lg font-bold text-foreground">
                          {Math.round((treatment.outcomes.remission_probability || 0) * 100)}%
                        </p>
                      </div>
                      <div className="p-3 bg-background rounded border">
                        <p className="text-xs text-muted-foreground mb-1">PFS (Months)</p>
                        <p className="text-lg font-bold text-foreground">
                          {treatment.outcomes.progression_free_survival_months || 0}
                        </p>
                      </div>
                    </div>
                    {treatment.outcomes.quality_of_life_impact && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Quality of Life Impact:{" "}
                          <span className="font-semibold capitalize">
                            {treatment.outcomes.quality_of_life_impact}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Outcome Predictions Comparison */}
      {recommendations.treatments?.some((t: any) => t.outcomes) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Outcome Predictions Comparison
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Survival Rates Chart */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Survival Rates by Treatment
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={recommendations.treatments.map((t: any) => ({
                    name: formatTreatmentName(t.treatment),
                    "1-Year": Math.round((t.outcomes?.survival_1yr || 0) * 100),
                    "3-Year": Math.round((t.outcomes?.survival_3yr || 0) * 100),
                    "5-Year": Math.round((t.outcomes?.survival_5yr || 0) * 100),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => `${value}%`}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="1-Year" fill="#10b981" />
                  <Bar dataKey="3-Year" fill="#3b82f6" />
                  <Bar dataKey="5-Year" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Response & Remission Rates Chart */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Response & Remission Rates
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={recommendations.treatments.map((t: any) => ({
                    name: formatTreatmentName(t.treatment),
                    "Response Rate": Math.round((t.outcomes?.response_rate || 0) * 100),
                    "Remission": Math.round((t.outcomes?.remission_probability || 0) * 100),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number) => `${value}%`}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="Response Rate" fill="#f59e0b" />
                  <Bar dataKey="Remission" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}

      {/* Treatment Pathway Visualization */}
      {recommendations.treatments && recommendations.treatments.length > 0 && (
        <TreatmentPathway
          recommendations={recommendations}
          patientData={patientData}
        />
      )}

      {/* Note */}
      {recommendations.note && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {recommendations.note}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex-1 gap-2" size="lg">
          <CheckCircle2 className="h-5 w-5" />
          Accept Recommendations
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 gap-2" 
          size="lg"
          onClick={handleDownloadReport}
          disabled={!recommendations}
        >
          <Download className="h-5 w-5" />
          Download Report
        </Button>
      </div>
        </>
      )}
    </div>
  );
}
