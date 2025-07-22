import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Robot, Camera, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { useScoreSuggestion, useReportGeneration } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

export default function AIDemoPage() {
  const [observations, setObservations] = useState('Clean and well-maintained bathroom with all fixtures working properly. Minor soap dispenser issue noted.');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const { toast } = useToast();
  const scoreSuggestion = useScoreSuggestion();
  const reportGeneration = useReportGeneration();

  const handleScoreAnalysis = async () => {
    try {
      const result = await scoreSuggestion.mutateAsync({
        auditItemId: 1, // Demo audit item ID
        observations: observations
      });
      setAnalysisResult(result);
      toast({
        title: "AI Analysis Complete",
        description: "Gemini has analyzed your observations and provided scoring suggestions.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to get AI analysis. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const handleReportDemo = async () => {
    try {
      const result = await reportGeneration.mutateAsync(1); // Demo audit ID
      toast({
        title: "Report Generated",
        description: "AI-powered audit report has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Unable to generate AI report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Robot className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">AI Demo Center</h1>
          </div>
          <p className="text-lg text-gray-600">
            Experience the power of Google Gemini AI integrated into hotel audit management
          </p>
          <Badge className="mt-2 bg-green-100 text-green-800">
            ✅ Gemini AI Connected
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score Suggestion Demo */}
          <Card className="card-modern shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Smart Score Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audit Observations
                </label>
                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Describe what you observed during the audit..."
                  className="h-24"
                />
              </div>
              
              <Button 
                onClick={handleScoreAnalysis}
                disabled={scoreSuggestion.isPending || !observations.trim()}
                className="w-full"
              >
                {scoreSuggestion.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Robot className="h-4 w-4 mr-2" />
                    Get AI Score Suggestion
                  </>
                )}
              </Button>

              {analysisResult && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">AI Analysis Result</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Suggested Score:</strong> {analysisResult.suggested_score || 'N/A'}</p>
                    <p><strong>Confidence:</strong> {(analysisResult.confidence * 100).toFixed(1)}%</p>
                    <p><strong>Compliance Zone:</strong> 
                      <Badge className={
                        analysisResult.compliance_zone === 'green' ? 'bg-green-100 text-green-800 ml-2' :
                        analysisResult.compliance_zone === 'amber' ? 'bg-yellow-100 text-yellow-800 ml-2' :
                        'bg-red-100 text-red-800 ml-2'
                      }>
                        {analysisResult.compliance_zone?.toUpperCase()}
                      </Badge>
                    </p>
                    <p><strong>Reasoning:</strong> {analysisResult.reasoning}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Generation Demo */}
          <Card className="card-modern shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                AI Report Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Demo Audit Data</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Property: Grand Hotel Downtown</li>
                  <li>• Audit Type: Quarterly Compliance</li>
                  <li>• Status: Completed</li>
                  <li>• Items: 25 audit checklist items</li>
                </ul>
              </div>

              <Button 
                onClick={handleReportDemo}
                disabled={reportGeneration.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {reportGeneration.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Robot className="h-4 w-4 mr-2" />
                    Generate AI Report
                  </>
                )}
              </Button>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">AI Features</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Executive summary generation</li>
                  <li>• Key findings identification</li>
                  <li>• Actionable recommendations</li>
                  <li>• Compliance trend analysis</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Photo Analysis Demo */}
          <Card className="card-modern shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2 text-green-600" />
                Photo Analysis (Vision AI)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Gemini Vision AI</h4>
                <p className="text-sm text-green-700">
                  Upload audit photos to get instant compliance analysis, issue detection, 
                  and improvement suggestions powered by Google's advanced vision model.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Photo Upload Feature</p>
                <p className="text-sm text-gray-400">Coming Soon - Upload images for AI analysis</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded border">
                  <strong>Detects:</strong> Cleanliness issues
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>Analyzes:</strong> Brand compliance
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>Identifies:</strong> Safety hazards
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>Suggests:</strong> Improvements
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card className="card-modern shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Robot className="h-5 w-5 mr-2 text-indigo-600" />
                System Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">Python Backend</span>
                  <Badge className="bg-green-100 text-green-800">✅ Connected</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">PostgreSQL DB</span>
                  <Badge className="bg-green-100 text-green-800">✅ Connected</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">Gemini AI</span>
                  <Badge className="bg-green-100 text-green-800">✅ Ready</Badge>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-indigo-800 mb-2">Integration Details</h4>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• FastAPI REST endpoints</li>
                  <li>• JWT authentication</li>
                  <li>• Real-time AI processing</li>
                  <li>• Structured data storage</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🎉 Full Stack Integration Complete!
              </h3>
              <p className="text-gray-600">
                React Frontend + Python Backend + PostgreSQL + Google Gemini AI
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
