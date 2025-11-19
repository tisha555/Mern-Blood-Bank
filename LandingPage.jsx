import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Droplet, Users, Clock, Shield, MapPin } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '@/App';
import { useContext } from 'react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const LandingPage = () => {
  const { login, API } = useContext(AuthContext);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'donor',
    blood_type: '',
    location: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload);
      
      login(response.data.access_token, response.data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      setShowAuth(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">LifeFlow</span>
            </div>
            <Button 
              data-testid="get-started-btn"
              onClick={() => setShowAuth(true)} 
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full btn-hover-lift"
            >
              Get Started
            </Button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-block">
                <span className="bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold">
                  Saving Lives Together
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Every Drop
                <span className="text-teal-600"> Counts</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Connect blood donors with those in need. Join our community and make a difference today. 
                Your donation can save up to three lives.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  data-testid="donor-signup-btn"
                  onClick={() => { setIsLogin(false); setShowAuth(true); setFormData({...formData, role: 'donor'}); }} 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg rounded-full btn-hover-lift"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Become a Donor
                </Button>
                <Button 
                  data-testid="recipient-signup-btn"
                  onClick={() => { setIsLogin(false); setShowAuth(true); setFormData({...formData, role: 'recipient'}); }} 
                  variant="outline" 
                  className="border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-6 text-lg rounded-full btn-hover-lift"
                >
                  Find a Donor
                </Button>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1683791895200-201c0c40310f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxibG9vZCUyMGRvbmF0aW9uJTIwc2NlbmV8ZW58MHx8fHwxNzYzNTU1NjMyfDA&ixlib=rb-4.1.0&q=85" 
                  alt="Blood donation" 
                  className="rounded-3xl shadow-2xl w-full"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-teal-200 rounded-full blur-3xl opacity-40"></div>
              <div className="absolute -top-6 -left-6 w-64 h-64 bg-cyan-200 rounded-full blur-3xl opacity-40"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '10K+', label: 'Active Donors' },
              { icon: Droplet, value: '25K+', label: 'Lives Saved' },
              { icon: Clock, value: '24/7', label: 'Availability' },
              { icon: Shield, value: '100%', label: 'Secure & Safe' }
            ].map((stat, index) => (
              <div key={index} className="text-center space-y-3 animate-slide-in" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-2xl">
                  <stat.icon className="w-8 h-8 text-teal-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple steps to save lives</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Register',
                description: 'Sign up as a donor or recipient in just a few clicks'
              },
              {
                icon: MapPin,
                title: 'Find Match',
                description: 'Search for donors by blood type and location'
              },
              {
                icon: Heart,
                title: 'Save Lives',
                description: 'Connect instantly and coordinate blood donation'
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 shadow-lg card-hover"
              >
                <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-teal-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
            Join thousands of donors and recipients in our life-saving community
          </p>
          <Button 
            data-testid="cta-get-started-btn"
            onClick={() => setShowAuth(true)} 
            className="bg-white text-teal-600 hover:bg-gray-100 px-10 py-6 text-lg rounded-full btn-hover-lift"
          >
            Get Started Now
          </Button>
        </div>
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md" data-testid="auth-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {isLogin ? 'Welcome Back' : 'Join LifeFlow'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({...formData, role: value})}
                  >
                    <SelectTrigger data-testid="role-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="donor">Blood Donor</SelectItem>
                      <SelectItem value="recipient">Blood Recipient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    data-testid="name-input"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    data-testid="phone-input"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    data-testid="location-input"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="City, State"
                  />
                </div>

                {formData.role === 'donor' && (
                  <div className="space-y-2">
                    <Label htmlFor="blood_type">Blood Type</Label>
                    <Select 
                      value={formData.blood_type} 
                      onValueChange={(value) => setFormData({...formData, blood_type: value})}
                    >
                      <SelectTrigger data-testid="blood-type-select">
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                data-testid="email-input"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                data-testid="password-input"
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
              />
            </div>

            <Button 
              data-testid="auth-submit-btn"
              type="submit" 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 rounded-full"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                data-testid="toggle-auth-btn"
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-teal-600 font-semibold hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
