import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Droplet, LogOut, Heart, Clock, MapPin, Phone, Mail, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DonorDashboard = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [donorProfile, setDonorProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, requestsRes] = await Promise.all([
        axios.get(`${API}/donors/me`, { headers }),
        axios.get(`${API}/blood-requests`, { headers })
      ]);
      
      setDonorProfile(profileRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleAvailability = async () => {
    try {
      await axios.put(
        `${API}/donors/me/availability`,
        { available: !donorProfile.available },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDonorProfile({ ...donorProfile, available: !donorProfile.available });
      toast.success(`You are now ${!donorProfile.available ? 'available' : 'unavailable'} for donation`);
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.put(
        `${API}/blood-requests/${requestId}`,
        { status: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Request accepted! Please contact the recipient.');
      fetchData();
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const myRequests = requests.filter(r => r.donor_id === donorProfile?.id);

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
                <p className="text-sm text-gray-600">Donor Portal</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600">Thank you for being a lifesaver</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 card-hover" data-testid="donor-profile-card">
              <CardHeader className="bg-gradient-teal text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <span>Your Profile</span>
                  <div className={`w-3 h-3 rounded-full ${donorProfile?.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center pb-4 border-b border-gray-200">
                  <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl font-bold text-teal-600">{donorProfile?.blood_type}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{user?.name}</h3>
                  <Badge className="mt-2 bg-teal-100 text-teal-700 hover:bg-teal-100">
                    {donorProfile?.blood_type} Donor
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-teal-600" />
                    {user?.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-teal-600" />
                    {user?.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-teal-600" />
                    {donorProfile?.location}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Availability Status</p>
                      <p className="text-xs text-gray-500">
                        {donorProfile?.available ? 'You are visible to recipients' : 'You are hidden from search'}
                      </p>
                    </div>
                    <Switch 
                      data-testid="availability-switch"
                      checked={donorProfile?.available} 
                      onCheckedChange={toggleAvailability}
                      className="data-[state=checked]:bg-teal-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requests Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Requests */}
            <Card className="shadow-lg border-0" data-testid="pending-requests-card">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                  Blood Requests Near You ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending requests at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedRequest(request)}
                        data-testid={`request-${request.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">{request.recipient_name}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                {request.blood_type}
                              </Badge>
                              <Badge variant="outline" className={`
                                ${request.urgency === 'critical' ? 'border-red-500 text-red-700' : ''}
                                ${request.urgency === 'high' ? 'border-orange-500 text-orange-700' : ''}
                                ${request.urgency === 'medium' ? 'border-yellow-500 text-yellow-700' : ''}
                                ${request.urgency === 'low' ? 'border-blue-500 text-blue-700' : ''}
                              `}>
                                {request.urgency.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {request.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {request.message && (
                          <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            {request.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Accepted Requests */}
            {myRequests.length > 0 && (
              <Card className="shadow-lg border-0" data-testid="my-requests-card">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-teal-600" />
                    My Accepted Requests ({myRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {myRequests.map((request) => (
                      <div 
                        key={request.id} 
                        className="bg-teal-50 border border-teal-200 rounded-xl p-5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">{request.recipient_name}</h4>
                            <Badge className="bg-teal-600 text-white hover:bg-teal-600">
                              {request.status}
                            </Badge>
                          </div>
                          <Badge className="bg-red-100 text-red-700">
                            {request.blood_type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-700">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {request.recipient_phone}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {request.location}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Request Detail Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent data-testid="request-detail-dialog">
            <DialogHeader>
              <DialogTitle>Blood Request Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Recipient</label>
                <p className="text-base text-gray-900">{selectedRequest.recipient_name}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700">Blood Type Needed</label>
                <p className="text-base text-gray-900">{selectedRequest.blood_type}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700">Location</label>
                <p className="text-base text-gray-900">{selectedRequest.location}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700">Urgency</label>
                <Badge className={`
                  ${selectedRequest.urgency === 'critical' ? 'bg-red-600' : ''}
                  ${selectedRequest.urgency === 'high' ? 'bg-orange-600' : ''}
                  ${selectedRequest.urgency === 'medium' ? 'bg-yellow-600' : ''}
                  ${selectedRequest.urgency === 'low' ? 'bg-blue-600' : ''}
                  text-white
                `}>
                  {selectedRequest.urgency.toUpperCase()}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Contact</label>
                <p className="text-base text-gray-900">{selectedRequest.recipient_phone}</p>
              </div>
              
              {selectedRequest.message && (
                <div>
                  <label className="text-sm font-semibold text-gray-700">Message</label>
                  <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.message}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  data-testid="accept-request-btn"
                  onClick={() => handleAcceptRequest(selectedRequest.id)}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Accept Request
                </Button>
                <Button 
                  onClick={() => setSelectedRequest(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DonorDashboard;
