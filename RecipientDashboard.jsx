import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Droplet, LogOut, Search, MapPin, Phone, Mail, Heart, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const RecipientDashboard = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [donors, setDonors] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    blood_type: '',
    location: ''
  });
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [requestForm, setRequestForm] = useState({
    blood_type: '',
    location: user?.location || '',
    urgency: 'medium',
    message: ''
  });

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [donorsRes, requestsRes] = await Promise.all([
        axios.get(`${API}/donors?available=true`, { headers }),
        axios.get(`${API}/blood-requests`, { headers })
      ]);
      
      setDonors(donorsRes.data);
      setMyRequests(requestsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const searchDonors = async () => {
    try {
      const params = new URLSearchParams();
      if (searchParams.blood_type) params.append('blood_type', searchParams.blood_type);
      if (searchParams.location) params.append('location', searchParams.location);
      params.append('available', 'true');

      const response = await axios.get(`${API}/donors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDonors(response.data);
      toast.success(`Found ${response.data.length} donor(s)`);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleRequestBlood = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...requestForm,
        donor_id: selectedDonor?.id || null
      };

      await axios.post(`${API}/blood-requests`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Blood request submitted successfully!');
      setShowRequestDialog(false);
      setSelectedDonor(null);
      setRequestForm({
        blood_type: '',
        location: user?.location || '',
        urgency: 'medium',
        message: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  const openRequestDialog = (donor = null) => {
    setSelectedDonor(donor);
    if (donor) {
      setRequestForm({
        ...requestForm,
        blood_type: donor.blood_type,
        location: donor.location
      });
    }
    setShowRequestDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LifeFlow</h1>
                <p className="text-sm text-gray-600">Recipient Portal</p>
              </div>
            </div>
            <Button 
              data-testid="logout-btn"
              onClick={logout} 
              variant="outline" 
              className="border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Find blood donors near you</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Card */}
            <Card className="shadow-lg border-0" data-testid="search-donors-card">
              <CardHeader className="bg-gradient-teal text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Search Blood Donors
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Select 
                      value={searchParams.blood_type} 
                      onValueChange={(value) => setSearchParams({...searchParams, blood_type: value})}
                    >
                      <SelectTrigger data-testid="search-blood-type-select">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        {BLOOD_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      data-testid="search-location-input"
                      placeholder="Enter city"
                      value={searchParams.location}
                      onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button 
                      data-testid="search-btn"
                      onClick={searchDonors} 
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    data-testid="general-request-btn"
                    onClick={() => openRequestDialog(null)} 
                    variant="outline" 
                    className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Make General Blood Request
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Donors List */}
            <Card className="shadow-lg border-0" data-testid="available-donors-card">
              <CardHeader className="border-b border-gray-200">
                <CardTitle>Available Donors ({donors.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {donors.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No donors found. Try adjusting your search.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {donors.map((donor) => (
                      <div 
                        key={donor.id} 
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all card-hover"
                        data-testid={`donor-${donor.id}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg mb-1">{donor.name}</h4>
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              {donor.blood_type}
                            </Badge>
                          </div>
                          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                            <Droplet className="w-6 h-6 text-teal-600" fill="currentColor" />
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {donor.location}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {donor.phone}
                          </div>
                        </div>

                        <Button 
                          data-testid={`request-from-donor-${donor.id}-btn`}
                          onClick={() => openRequestDialog(donor)}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          Request Blood
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* My Requests Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 sticky top-6" data-testid="my-requests-card">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-teal-600" />
                  My Requests ({myRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {myRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {myRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className={`rounded-xl p-4 border-2 ${
                          request.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                          request.status === 'accepted' ? 'bg-green-50 border-green-200' :
                          request.status === 'completed' ? 'bg-blue-50 border-blue-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                        data-testid={`my-request-${request.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={`${
                            request.status === 'pending' ? 'bg-yellow-600' :
                            request.status === 'accepted' ? 'bg-green-600' :
                            request.status === 'completed' ? 'bg-blue-600' :
                            'bg-gray-600'
                          } text-white hover:bg-current`}>
                            {request.status}
                          </Badge>
                          <Badge variant="outline" className="border-red-500 text-red-700">
                            {request.blood_type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            {request.location}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                          {request.donor_name && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <p className="text-xs text-gray-600">Donor</p>
                              <p className="font-semibold text-gray-900">{request.donor_name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent data-testid="request-blood-dialog">
          <DialogHeader>
            <DialogTitle>
              {selectedDonor ? `Request Blood from ${selectedDonor.name}` : 'Make Blood Request'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleRequestBlood} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Blood Type Needed</Label>
              <Select 
                value={requestForm.blood_type} 
                onValueChange={(value) => setRequestForm({...requestForm, blood_type: value})}
                required
              >
                <SelectTrigger data-testid="request-blood-type-select">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                data-testid="request-location-input"
                value={requestForm.location}
                onChange={(e) => setRequestForm({...requestForm, location: e.target.value})}
                required
                placeholder="Hospital or location"
              />
            </div>

            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <Select 
                value={requestForm.urgency} 
                onValueChange={(value) => setRequestForm({...requestForm, urgency: value})}
              >
                <SelectTrigger data-testid="request-urgency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Message (Optional)</Label>
              <Textarea
                data-testid="request-message-textarea"
                value={requestForm.message}
                onChange={(e) => setRequestForm({...requestForm, message: e.target.value})}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                data-testid="submit-request-btn"
                type="submit" 
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                Submit Request
              </Button>
              <Button 
                type="button"
                onClick={() => setShowRequestDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipientDashboard;
