import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarDays, Users, TrendingUp, AlertCircle, Building, FileText, Robot } from 'lucide-react';
import { useProperties, useAudits, useHealthCheck } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { data: properties, isLoading: propertiesLoading, error: propertiesError } = useProperties();
  const { data: audits, isLoading: auditsLoading, error: auditsError } = useAudits();
  const { data: healthStatus } = useHealthCheck();

  if (propertiesLoading || auditsLoading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (propertiesError || auditsError) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Connection Error</span>
              </div>
              <p className="text-red-700 mt-2">
                Unable to connect to the backend API. Please ensure the Python backend is running on port 8000.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalProperties = properties?.length || 0;
  const totalAudits = audits?.length || 0;
  const pendingAudits = audits?.filter(audit => audit.status === 'scheduled' || audit.status === 'in_progress').length || 0;
  const completedAudits = audits?.filter(audit => audit.status === 'completed').length || 0;

  // Calculate compliance distribution
  const complianceStats = {
    green: audits?.filter(audit => audit.compliance_zone === 'green').length || 0,
    amber: audits?.filter(audit => audit.compliance_zone === 'amber').length || 0,
    red: audits?.filter(audit => audit.compliance_zone === 'red').length || 0,
  };

  const handleScheduleAudit = () => {
    setShowScheduleModal(true);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage properties, audits, and system configuration</p>
          
          {/* System Status */}
          {healthStatus && (
            <div className="mt-4 flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Backend Connected</span>
              </div>
              <Badge variant="outline" className="text-xs">
                <Robot className="w-3 h-3 mr-1" />
                Gemini AI Ready
              </Badge>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-modern shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Audits</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAudits}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Audits</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingAudits}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <CalendarDays className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedAudits}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="card-modern shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-800">Green Zone</span>
                  <Badge className="bg-green-100 text-green-800">{complianceStats.green}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="font-medium text-yellow-800">Amber Zone</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{complianceStats.amber}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-800">Red Zone</span>
                  <Badge className="bg-red-100 text-red-800">{complianceStats.red}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Robot className="h-5 w-5 mr-2" />
                AI Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm">Photo Analysis with Gemini Vision</span>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Automated Report Generation</span>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm">Smart Score Suggestions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Table */}
        <Card className="card-modern shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Properties</span>
              <Button onClick={handleScheduleAudit} className="btn-primary">
                Schedule New Audit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {properties && properties.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Property Name</th>
                      <th className="text-left py-2">Location</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Created</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{property.name}</td>
                        <td className="py-3 text-gray-600">{property.location}</td>
                        <td className="py-3 text-gray-600">{property.property_type}</td>
                        <td className="py-3 text-gray-600">
                          {new Date(property.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <Button size="sm" variant="outline">
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No properties found. Add your first property to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Audit Modal */}
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Audit</DialogTitle>
              <DialogDescription>
                Create a new audit for a property with AI-powered features.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <Robot className="h-4 w-4 mr-2" />
                  <span className="font-semibold">AI Features Available</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  This audit will include photo analysis, automated scoring, and intelligent reporting powered by Google Gemini.
                </p>
              </div>
              <Button onClick={() => setShowScheduleModal(false)} className="w-full">
                Create Audit (Coming Soon)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
