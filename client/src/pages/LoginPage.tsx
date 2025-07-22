import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { login, error } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      const success = await login(formData.username, formData.password);
      
      if (success) {
        console.log('Login successful');
        
        // Navigate to appropriate dashboard based on role
        const dashboardRoutes: Record<string, string> = {
          admin: '/admin',
          auditor: '/auditor',
          reviewer: '/reviewer',
          corporate: '/corporate',
          hotelgm: '/hotel-gm'
        };
        
        // Get user info from localStorage to determine role
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('User logged in:', user);
          console.log('Navigating to:', dashboardRoutes[user.role]);
          
          toast({
            title: "Login Successful",
            description: \`Welcome back, \${user.name}!\`,
          });
          
          // Add a small delay to ensure state is updated
          setTimeout(() => {
            setLocation(dashboardRoutes[user.role] || '/');
          }, 100);
        }
      } else {
        toast({
          title: "Login Failed",
          description: error || "Invalid username or password. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLogging(false);
    }
  };

  // Updated demo credentials to match Python backend setup
  const demoCredentials = [
    { role: 'Admin (System)', username: 'admin', password: 'admin123', color: 'bg-orange-100 text-orange-800' },
    { role: 'Auditor', username: 'sarah.johnson', password: 'auditor123', color: 'bg-green-100 text-green-800' },
    { role: 'Reviewer', username: 'lisa.thompson', password: 'reviewer123', color: 'bg-purple-100 text-purple-800' },
    { role: 'Corporate', username: 'raj.patel', password: 'corporate123', color: 'bg-amber-100 text-amber-800' },
    { role: 'Hotel GM', username: 'priya.sharma', password: 'hotelgm123', color: 'bg-blue-100 text-blue-800' }
  ];

  const handleDemoLogin = (username: string, password: string) => {
    setFormData({ username, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-hotel text-4xl text-blue-600 mr-3"></i>
            <h1 className="text-3xl font-bold text-gray-800">Hotel Audit Platform</h1>
          </div>
          <p className="text-gray-600">AI-Powered Audit Management with Gemini</p>
        </div>

        {/* Login Form */}
        <Card className="card-modern shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter your username"
                  className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full btn-primary text-lg py-3" 
                disabled={isLogging}
              >
                {isLogging ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="card-modern shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Demo Credentials</CardTitle>
            <p className="text-sm text-gray-600">Click any role to auto-fill credentials</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoCredentials.map((cred, index) => (
                <div 
                  key={index}
                  className="interactive-hover flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm transition-all duration-300 cursor-pointer"
                  onClick={() => handleDemoLogin(cred.username, cred.password)}
                >
                  <div>
                    <span className="font-semibold text-gray-900">{cred.role}</span>
                    <div className="text-sm text-gray-600 font-mono">
                      {cred.username} / {cred.password}
                    </div>
                  </div>
                  <span className={\`px-3 py-1 rounded-full text-xs font-semibold shadow-sm \${cred.color}\`}>
                    Demo
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center text-green-800">
                <i className="fas fa-robot mr-2"></i>
                <span className="font-semibold">AI Features Available</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Photo analysis, smart scoring, and automated reports powered by Google Gemini AI
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Selection Link */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/roles')}
            className="text-sm"
          >
            Or browse role descriptions
          </Button>
        </div>
      </div>
    </div>
  );
}
