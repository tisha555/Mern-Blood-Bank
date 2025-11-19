import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Droplet, LogOut, Users, Heart, AlertCircle, TrendingUp, Activity, Award } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, requestsRes, leaderboardRes, activitiesRes] = await Promise.all([
        axios.get(`${API}/stats`, { headers }),
        axios.get(`${API}/blood-requests`, { headers }),
        axios.get(`${API}/donors/leaderboard`, { headers }),
        axios.get(`${API}/activities`, { headers })
      ]);
      
      setStats(statsRes.data);
      setRequests(requestsRes.data);
      setLeaderboard(leaderboardRes.data);
      setActivities(activitiesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
                <p className="text-sm text-gray-600">Admin Dashboard</p>
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
          <p className="text-gray-600">System overview and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Donors</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.total_donors || 0}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.available_donors || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                  <p className="text-3xl font-bold text-amber-600">{stats?.pending_requests || 0}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Donations</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.total_donations || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Alert */}
        {stats?.emergency_requests > 0 && (
          <Card className="shadow-lg border-2 border-red-500 bg-red-50 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-600 mr-4" />
                <div>
                  <h3 className="text-xl font-bold text-red-900 mb-1">🚨 Emergency Alert</h3>
                  <p className="text-red-700">{stats.emergency_requests} emergency blood request(s) require immediate attention!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Tabs */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <Tabs defaultValue="requests" className="w-full">
                <CardHeader className="border-b border-gray-200">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="requests">All Requests</TabsTrigger>
                    <TabsTrigger value="blood-types">Blood Types</TabsTrigger>
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="requests" className="p-6">
                  <div className="space-y-4">
                    {requests.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No requests found</p>
                    ) : (
                      requests.slice(0, 10).map((request) => (
                        <div 
                          key={request.id} 
                          className={`p-4 rounded-xl border-2 ${
                            request.is_emergency ? 'border-red-500 bg-red-50' :
                            request.status === 'pending' ? 'border-amber-200 bg-amber-50' :
                            'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-gray-900">{request.recipient_name}</h4>
                              <p className="text-sm text-gray-600">{request.location}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className="bg-red-100 text-red-700">
                                {request.blood_type}
                              </Badge>
                              <Badge className={`${
                                request.status === 'pending' ? 'bg-amber-600' :
                                request.status === 'completed' ? 'bg-green-600' :
                                'bg-gray-600'
                              } text-white`}>
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                          {request.is_emergency && (
                            <Badge className="bg-red-600 text-white">🚨 EMERGENCY</Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="blood-types" className="p-6">
                  <div className="space-y-4">
                    {stats?.blood_type_distribution?.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-red-600">{item._id}</span>
                          </div>
                          <span className="font-semibold text-gray-900">Blood Type {item._id}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                          <p className="text-sm text-gray-600">donors</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="leaderboard" className="p-6">
                  <div className="space-y-4">
                    {leaderboard.map((donor, index) => (
                      <div 
                        key={donor.id} 
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-700' :
                          'bg-teal-600'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{donor.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge className="bg-red-100 text-red-700">{donor.blood_type}</Badge>
                            {donor.achievements.length > 0 && (
                              <Badge className="bg-teal-100 text-teal-700">
                                {donor.achievements[donor.achievements.length - 1]}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-teal-600">{donor.total_donations}</p>
                          <p className="text-sm text-gray-600">donations</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar - Activity Feed */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 sticky top-6">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-teal-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'donation' ? 'bg-green-500' :
                        activity.type === 'request' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.user_name} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
