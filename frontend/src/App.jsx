import {
  ShieldAlert,
  BrainCircuit,
  Route,
  Radio
} from "lucide-react";
import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { 
  Shield, AlertTriangle, Users, Compass, BarChart2, Settings, 
  MapPin, LogOut, CheckCircle, Clock, Volume2, Image, Send, FileText, Globe,
  Bell, Trash2
} from 'lucide-react';

import InteractiveMap from './components/InteractiveMap';
import RoutePlanner from './components/RoutePlanner';
import AnalyticsCharts from './components/AnalyticsCharts';
import CameraUpload from './components/CameraUpload';
import Chatbot from './components/Chatbot';

// Translation strings dictionary for English, Hindi, and Marathi
const TRANSLATIONS = {
  en: {
    title: "Monitor. Protect. Respond.",
    subtitle: "Real-time safety intelligence, smart route planning, and emergency coordination in a unified command center.",
    dashboard: "Dashboard",
    zoneMap: "Zone Map",
    routePlanner: "Route Planner",
    sosCenter: "SOS Center",
    incidents: "Incidents",
    analytics: "Analytics",
    settings: "Settings",
    activeIncidents: "Active Incidents",
    highRiskZones: "High Risk Zones",
    sosRequests: "SOS Requests",
    responseTeams: "Response Teams",
    liveFeed: "Live Incident Feed",
    reportIncident: "Report Incident",
    sendSos: "SEND SOS",
    emergencyType: "Emergency Type",
    location: "Location",
    severity: "Severity",
    description: "Description",
    submitReport: "Submit Incident Report",
    chatAssistant: "AI Safety Assistant",
    viewingAs: "Viewing as",
  },
  hi: {
    title: "निगरानी। सुरक्षा। त्वरित प्रतिक्रिया।",
    subtitle: "एक एकीकृत कमांड सेंटर में वास्तविक समय की सुरक्षा खुफिया जानकारी, स्मार्ट मार्ग योजना और आपातकालीन समन्वय।",
    dashboard: "डैशबोर्ड",
    zoneMap: "ज़ोन मानचित्र",
    routePlanner: "मार्ग योजनाकार",
    sosCenter: "एसओएस केंद्र",
    incidents: "घटनाएँ",
    analytics: "विश्लेषण",
    settings: "सेटिंग्स",
    activeIncidents: "सक्रिय मामले",
    highRiskZones: "उच्च जोखिम क्षेत्र",
    sosRequests: "एसओएस अनुरोध",
    responseTeams: "प्रतिक्रिया टीमें",
    liveFeed: "लाइव घटना फीड",
    reportIncident: "घटना की रिपोर्ट करें",
    sendSos: "एसओएस भेजें",
    emergencyType: "आपातकाल प्रकार",
    location: "स्थान",
    severity: "गंभीरता",
    description: "विवरण",
    submitReport: "घटना रिपोर्ट दर्ज करें",
    chatAssistant: "एआई सुरक्षा सहायक",
    viewingAs: "भूमिका",
  },
  mr: {
    title: "निगराणी। सुरक्षा। जलद प्रतिसाद।",
    subtitle: "एकात्मिक कमांड सेंटरमध्ये रिअल-टाइम सुरक्षा माहिती, स्मार्ट मार्ग नियोजन आणि आपत्कालीन समन्वय.",
    dashboard: "डॅशबोर्ड",
    zoneMap: "झोन नकाशा",
    routePlanner: "मार्ग नियोजक",
    sosCenter: "एसओएस केंद्र",
    incidents: "घटना",
    analytics: "विश्लेषण",
    settings: "सेटिंग्ज",
    activeIncidents: "सक्रिय घटना",
    highRiskZones: "उच्च जोखीम क्षेत्र",
    sosRequests: "एसओएस विनंत्या",
    responseTeams: "प्रतिसाद पथके",
    liveFeed: "थेट घटना फीड",
    reportIncident: "घटनेची नोंद करा",
    sendSos: "एसओएस पाठवा",
    emergencyType: "आपत्कालीन प्रकार",
    location: "स्थान",
    severity: "गंभीरता",
    description: "वर्णन",
    submitReport: "घटना अहवाल सादर करा",
    chatAssistant: "एआय सुरक्षा सहाय्यक",
    viewingAs: "भूमिका",
  }
};

const DashboardApp = () => {
  const { 
    user, token, logout, API_URL, updateProfile,
    getUsers, updateUserRole, updateUserStatus, deleteUser,
    getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications,
    getCitizenAnalytics, getOperatorAnalytics, getSystemAnalytics, getAuditLogs,
    createZone, updateZone, deleteZone
  } = useContext(AuthContext);
  
  // App UI State
  const [lang, setLang] = useState('en'); // en, hi, mr
  const [activeSection, setActiveSection] = useState('overview');
  const [incidents, setIncidents] = useState([]);
  const [zones, setZones] = useState([]);
  const [teams, setTeams] = useState([]);
  const [sosRequests, setSosRequests] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [feedItems, setFeedItems] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Role Specific Analytics States
  const [citizenAnalytics, setCitizenAnalytics] = useState(null);
  const [operatorAnalytics, setOperatorAnalytics] = useState(null);
  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  // Zone Form states
  const [zoneName, setZoneName] = useState('');
  const [zonePolygonCoords, setZonePolygonCoords] = useState('[[24.580,78.910],[24.585,78.915],[24.580,78.920]]');
  const [zoneRiskScore, setZoneRiskScore] = useState(50);
  const [zoneRiskLevel, setZoneRiskLevel] = useState('medium');
  const [editingZoneId, setEditingZoneId] = useState(null);

  // Admin user list states
  const [usersList, setUsersList] = useState([]);

  // Form states for Citizen Reporting
  const [incidentType, setIncidentType] = useState('Fire');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [citizenLat, setCitizenLat] = useState(24.585);
  const [citizenLng, setCitizenLng] = useState(78.912);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Settings form state
  const [settingsName, setSettingsName] = useState(user?.full_name || '');
  const [settingsPhone, setSettingsPhone] = useState(user?.phone || '');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Map layer toggles
  const [mapLayers, setMapLayers] = useState({
    zones: true,
    incidents: true,
    sos: true,
    teams: true
  });

  // Incident filter & details popup
  const [activeIncidentId, setActiveIncidentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for tracking elements
  const wsRef = useRef(null);
  const t = TRANSLATIONS[lang];

  const renderSidebarLinks = () => {
    if (user?.role === 'citizen') {
      return (
        <>
          <button 
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'overview' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" /> {t.dashboard}
          </button>
          <button 
            onClick={() => setActiveSection('report-incident')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'report-incident' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Report Incident
          </button>
          <button 
            onClick={() => setActiveSection('my-reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'my-reports' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> My Reports
          </button>
          <button 
            onClick={() => setActiveSection('routes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'routes' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" /> {t.routePlanner}
          </button>
          <button 
            onClick={() => setActiveSection('sos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'sos' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> {t.sosCenter}
          </button>
        </>
      );
    } else if (user?.role === 'operator') {
      return (
        <>
          <button 
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'overview' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" /> {t.dashboard}
          </button>
          <button 
            onClick={() => setActiveSection('incidents')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'incidents' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Live Incident Queue
          </button>
          <button 
            onClick={() => setActiveSection('sos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'sos' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> SOS Center
          </button>
          <button 
            onClick={() => setActiveSection('zonemap')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'zonemap' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" /> {t.zoneMap}
          </button>
        </>
      );
    } else if (user?.role === 'admin') {
      return (
        <>
          <button 
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'overview' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" /> Executive Dashboard
          </button>
          <button 
            onClick={() => setActiveSection('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'analytics' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> {t.analytics}
          </button>
          <button 
            onClick={() => setActiveSection('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'users' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>
          <button 
            onClick={() => setActiveSection('zones')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'zones' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" /> Zone Management
          </button>
          <button 
            onClick={() => setActiveSection('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'system' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" /> System Monitoring
          </button>
          <button 
            onClick={() => setActiveSection('audit-logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'audit-logs' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> Audit Logs
          </button>
          <button 
            onClick={() => setActiveSection('routes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
              activeSection === 'routes' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" /> {t.routePlanner}
          </button>
        </>
      );
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // Fetch role-specific analytics and audit logs
  const fetchAnalyticsAndLogs = async () => {
    if (!token || !user) return;
    try {
      if (user.role === 'citizen') {
        const data = await getCitizenAnalytics();
        setCitizenAnalytics(data);
      } else if (user.role === 'operator') {
        const data = await getOperatorAnalytics();
        setOperatorAnalytics(data);
      } else if (user.role === 'admin') {
        const sysData = await getSystemAnalytics();
        setSystemAnalytics(sysData);
        const logsData = await getAuditLogs();
        setAuditLogs(logsData);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  // Fetch initial database records
  const fetchAllData = async () => {
    if (!token) return;
    try {
      const [incRes, zoneRes, teamRes, sosRes] = await Promise.all([
        axios.get('/incidents'),
        axios.get('/zones'),
        axios.get('/teams'),
        axios.get('/sos')
      ]);
      setIncidents(incRes.data);
      setZones(zoneRes.data);
      setTeams(teamRes.data);
      setSosRequests(sosRes.data);

      fetchNotifications();
      fetchAnalyticsAndLogs();

      if (user?.role === 'admin') {
        try {
          const analyticsRes = await axios.get('/analytics/dashboard');
          setAnalyticsData(analyticsRes.data);
        } catch (err) {
          console.error('Error fetching analytics dashboard:', err);
        }
      }
      
      // Seed live feed initially with some incidents
      const initialFeed = incRes.data.slice(0, 8).map(i => ({
        t: new Date(i.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: `${i.type} Alert`,
        loc: `Sector: ${i.zone?.name || 'Downtown'}`,
        color: i.severity === 'critical' ? 'var(--red)' : i.severity === 'high' ? 'var(--amber)' : 'var(--indigo)'
      }));
      setFeedItems(initialFeed);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
    }
  };

  const fetchAllUsers = async () => {
    if (user?.role !== 'admin') return;
    try {
      const data = await getUsers();
      setUsersList(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // Notification Action Handlers
  const handleMarkNotificationRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications();
      showToast("All alerts marked as read.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await clearAllNotifications();
      fetchNotifications();
      showToast("All notifications cleared.");
    } catch (err) {
      console.error(err);
    }
  };

  // Zone CRUD Operations
  const handleZoneSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate polygon coords json
      try {
        JSON.parse(zonePolygonCoords);
      } catch (err) {
        showToast("Invalid coordinates JSON format. Must be [[lat, lng], ...]");
        return;
      }

      const payload = {
        name: zoneName,
        polygon_coords_json: zonePolygonCoords,
        risk_score: parseFloat(zoneRiskScore),
        risk_level: zoneRiskLevel,
        active_incidents_count: 0
      };

      if (editingZoneId) {
        await updateZone(editingZoneId, payload);
        showToast("Risk zone updated successfully.");
        setEditingZoneId(null);
      } else {
        await createZone(payload);
        showToast("Risk zone created successfully.");
      }

      setZoneName('');
      setZonePolygonCoords('[[24.580,78.910],[24.585,78.915],[24.580,78.920]]');
      setZoneRiskScore(50);
      setZoneRiskLevel('medium');
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Zone action failed.");
    }
  };

  const handleEditZoneClick = (zone) => {
    setEditingZoneId(zone.id);
    setZoneName(zone.name);
    setZonePolygonCoords(zone.polygon_coords_json);
    setZoneRiskScore(zone.risk_score);
    setZoneRiskLevel(zone.risk_level);
    setActiveSection('zones'); // transition to zones view if not there
  };

  const handleDeleteZoneClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this risk zone?")) return;
    try {
      await deleteZone(id);
      showToast("Zone deleted successfully.");
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete zone.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      showToast(`User role updated successfully.`);
      fetchAllUsers();
      fetchAnalyticsAndLogs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to update role.");
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      showToast(`User status updated to ${newStatus}.`);
      fetchAllUsers();
      fetchAnalyticsAndLogs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to update status.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      await deleteUser(userId);
      showToast("User deleted successfully.");
      fetchAllUsers();
      fetchAnalyticsAndLogs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  // Route guards redirection
  useEffect(() => {
    if (!user) return;
    if (user.role === 'citizen') {
      const allowed = ['overview', 'report-incident', 'my-reports', 'routes', 'sos', 'settings'];
      if (!allowed.includes(activeSection)) {
        setActiveSection('overview');
      }
    } else if (user.role === 'operator') {
      const allowed = ['overview', 'zonemap', 'incidents', 'sos', 'settings'];
      if (!allowed.includes(activeSection)) {
        setActiveSection('overview');
      }
    } else if (user.role === 'admin') {
      const allowed = ['overview', 'analytics', 'users', 'zones', 'system', 'audit-logs', 'routes', 'settings'];
      if (!allowed.includes(activeSection)) {
        setActiveSection('overview');
      }
    }
  }, [activeSection, user]);

  useEffect(() => {
    if (token) {
      fetchAllData();
      if (user?.role === 'admin') {
        fetchAllUsers();
      }
      
      // Initialize WebSocket connection
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = API_URL.replace('http://', '').replace('https://', '').replace('/api/v1', '');
      const wsUrl = `${wsProtocol}//${wsHost}/api/v1/ws?user_id=${user?.id || 0}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket event received:', data);
        
        // Refresh notifications and stats on any WebSocket broadcast
        fetchNotifications();
        fetchAnalyticsAndLogs();
        
        if (data.event === 'new_incident') {
          showToast(`🚨 NEW INCIDENT: ${data.incident.type} reported!`);
          setIncidents(prev => [data.incident, ...prev]);
          setFeedItems(prev => [
            {
              t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: `${data.incident.type} Alert`,
              loc: `Lat/Lng: ${data.incident.location_lat.toFixed(3)}, ${data.incident.location_lng.toFixed(3)}`,
              color: 'var(--red)'
            },
            ...prev.slice(0, 7)
          ]);
          // Refresh analytics
          axios.get('/analytics/dashboard').then(res => setAnalyticsData(res.data));
        } else if (data.event === 'incident_updated') {
          showToast(`🔧 INCIDENT UPDATE: Case #${data.incident.id} is now ${data.incident.status.toUpperCase()}`);
          setIncidents(prev => prev.map(inc => inc.id === data.incident.id ? { ...inc, ...data.incident } : inc));
          axios.get('/analytics/dashboard').then(res => setAnalyticsData(res.data));
        } else if (data.event === 'new_sos') {
          showToast(`🆘 CRITICAL DISTRESS: SOS triggered by ${data.sos.citizen_name || 'Citizen'}!`);
          setSosRequests(prev => [data.sos, ...prev]);
          setFeedItems(prev => [
            {
              t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: `SOS Distress`,
              loc: `Lat/Lng: ${data.sos.location_lat.toFixed(3)}, ${data.sos.location_lng.toFixed(3)}`,
              color: 'var(--red)'
            },
            ...prev.slice(0, 7)
          ]);
        } else if (data.event === 'sos_updated') {
          showToast(`🚑 SOS UPDATE: distress signal #${data.sos.id} is now ${data.sos.status}`);
          setSosRequests(prev => prev.map(sos => sos.id === data.sos.id ? { ...sos, ...data.sos } : sos));
        } else if (data.event === 'team_location_updated') {
          setTeams(prev => prev.map(t => t.id === data.team.id ? { ...t, ...data.team } : t));
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed. Reconnecting...');
      };

      return () => {
        if (wsRef.current) wsRef.current.close();
      };
    }
  }, [token, API_URL]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Locate citizen GPS location
  const handleLocateCitizen = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCitizenLat(pos.coords.latitude);
          setCitizenLng(pos.coords.longitude);
          showToast("GPS Coordinate synchronized successfully.");
        },
        (err) => {
          showToast("Geolocation access denied. Using Sector center defaults.");
        }
      );
    }
  };

  // Submit Incident Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('type', incidentType);
    formData.append('description', incidentDesc);
    formData.append('location_lat', citizenLat);
    formData.append('location_lng', citizenLng);
    if (evidenceFile) {
      formData.append('media', evidenceFile);
    }
    if (audioFile) {
      formData.append('audio', audioFile);
    }

    try {
      const res = await axios.post('/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg(`Incident reported successfully (Case ID: INC-${res.data.id}). Severity scored: ${res.data.severity.toUpperCase()}.`);
      setIncidentDesc('');
      setEvidenceFile(null);
      setAudioFile(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast("Submission failed. Verify connection.");
    } finally {
      setSubmittingReport(false);
    }
  };

  // Trigger Immediate SOS Distress
  const handleTriggerSOS = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await axios.post('/sos', {
            location_lat: pos.coords.latitude,
            location_longitude: pos.coords.longitude, // API schema expects location_lat, location_lng
            location_lng: pos.coords.longitude
          });
          showToast(`SOS transmitted. Dispatching emergency response team to (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}).`);
          fetchAllData();
        } catch (err) {
          console.error(err);
          showToast("SOS failed to send.");
        }
      });
    } else {
      alert("GPS not supported. SOS cannot locate coordinate.");
    }
  };

  // Operator Action: Assign dispatcher team / Change status
  const handleUpdateIncidentStatus = async (id, status, teamId = null, eta = null) => {
    try {
      await axios.put(`/incidents/${id}`, {
        status,
        assigned_team_id: teamId || undefined,
        eta_minutes: eta !== null ? parseInt(eta) : undefined
      });
      fetchAllData();
      showToast(`Incident INC-${id} status successfully updated.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSOSStatus = async (id, status, teamId = null) => {
    try {
      await axios.put(`/sos/${id}`, {
        status,
        assigned_team_id: teamId || undefined
      });
      fetchAllData();
      showToast(`SOS distress signal #${id} updated.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess(false);
    try {
      await updateProfile(settingsName, settingsPhone, settingsPassword || null);
      setSettingsSuccess(true);
      setSettingsPassword('');
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      showToast("Profile update failed.");
    }
  };

  // Export report downloads
  const handleDownloadPDF = (type) => {
    window.open(`${axios.defaults.baseURL}/pdf/${type}?token=${token}`, '_blank');
  };

  // Filtered Incidents List
  const filteredIncidents = incidents.filter(inc => {
    const term = searchQuery.toLowerCase();
    return (
      inc.type.toLowerCase().includes(term) ||
      (inc.description && inc.description.toLowerCase().includes(term)) ||
      inc.status.toLowerCase().includes(term) ||
      inc.severity.toLowerCase().includes(term) ||
      `inc-${inc.id}`.includes(term)
    );
  });

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden">
      {/* Real-time notification Toast Overlays */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-card-2 border border-rose-500/40 text-text p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-red animate-ping"></span>
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Main Dashboard Sidebar Layout */}
      <aside className="w-64 bg-bg-2 border-r border-border flex flex-col justify-between shrink-0 p-6">
        <div>
          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo to-cyan flex items-center justify-center shadow-lg shadow-indigo/40">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white uppercase">Smart Public Alert & Safety System</h1>
              <span className="text-[10px] font-semibold text-text-faint tracking-wider uppercase block">Safety OS</span>
            </div>
          </div>

          <div className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-3">Main Console</div>
          <nav className="space-y-1">
            {renderSidebarLinks()}
            <button 
              onClick={() => setActiveSection('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border border-transparent transition ${
                activeSection === 'settings' ? 'bg-indigo-soft text-indigo border-indigo/20' : 'text-text-dim hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" /> {t.settings}
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          {/* Multi-language Selector */}
          <div className="bg-card-2 border border-border p-3.5 rounded-xl">
            <label className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-2 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Language / भाषा
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['en', 'hi', 'mr'].map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-[10px] font-extrabold py-1 rounded transition uppercase ${
                    lang === l ? 'bg-indigo text-white' : 'bg-slate-800 text-text-dim hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* User Account Info card */}
          <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo to-magenta text-xs font-extrabold flex items-center justify-center text-white">
                {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-text truncate">{user?.full_name}</div>
                <div className="text-[10px] text-text-faint capitalize">{user?.role}</div>
              </div>
            </div>
            <button onClick={logout} className="text-text-faint hover:text-red transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar navigation panel */}
        <header className="h-16 border-b border-border bg-bg-2/60 backdrop-blur-md px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-4 w-96">
            <input 
              type="text" 
              placeholder="Search active incidents, coordinates, zones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-2 text-xs text-text outline-none focus:border-indigo"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald rounded-full pulse-dot"></span>
              <span className="text-[10px] font-mono text-emerald tracking-wider uppercase font-semibold">Live Feed Connected</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative p-2 text-text-dim hover:text-white hover:bg-white/5 rounded-xl transition flex items-center"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-extrabold text-white flex items-center justify-center animate-pulse">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {showNotifPanel && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-border rounded-2xl shadow-2xl z-[999] overflow-hidden flex flex-col max-h-96">
                  <div className="p-4 border-b border-border bg-slate-950 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">In-App Alerts</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[10px] font-semibold text-indigo hover:underline"
                      >
                        Read All
                      </button>
                      <button 
                        onClick={handleClearAllNotifications}
                        className="text-[10px] font-semibold text-red hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-72">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-text-faint italic">
                        No alerts logged.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-3 text-xs leading-relaxed transition ${
                            notif.is_read ? 'opacity-60 hover:opacity-100' : 'bg-indigo-soft/10 border-l-2 border-indigo'
                          } flex justify-between items-start gap-2`}
                        >
                          <div className="flex-1 cursor-pointer" onClick={() => handleMarkNotificationRead(notif.id)}>
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                notif.type === 'critical' ? 'bg-rose-500 animate-ping' : 'bg-indigo'
                              }`}></span>
                              <strong className="text-text font-bold uppercase text-[9px] tracking-wide">{notif.title || notif.type || 'Alert'}</strong>
                            </div>
                            <p className="text-text-dim text-[11px]">{notif.message}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteNotification(notif.id)}
                            className="text-text-faint hover:text-red p-1 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick emergency SOS for citizens */}
            {user?.role === 'citizen' && (
              <button 
                onClick={handleTriggerSOS}
                className="bg-red hover:bg-red-600 text-white font-bold text-xs tracking-wider uppercase px-4 py-2 rounded-xl shadow-lg shadow-red/20 transition animate-pulse"
              >
                🆘 {t.sendSos}
              </button>
            )}
          </div>
        </header>

        {/* View switching logic */}
        <div className="p-8 flex-1 space-y-6">
          
          {/* ================= SECTION: OVERVIEW ================= */}
          {activeSection === 'overview' && (
            <>
              {user?.role === 'citizen' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white">Citizen Dashboard</h2>
                    <p className="text-xs text-text-dim mt-1">Personal safety overview, reported incidents, and community alerts</p>
                  </div>
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-indigo-soft rounded-lg"><FileText className="w-5 h-5 text-indigo" /></div>
                        <span className="text-[10px] text-indigo font-bold bg-indigo-soft px-2 py-0.5 rounded-full">My Incidents</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{citizenAnalytics?.incidents_count || 0}</div>
                        <div className="text-xs text-text-dim font-medium">Reported by Me</div>
                      </div>
                    </div>
                    
                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-red-soft rounded-lg"><AlertTriangle className="w-5 h-5 text-red" /></div>
                        <span className="text-[10px] text-red font-bold bg-red-soft px-2 py-0.5 rounded-full">My SOS Alerts</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{citizenAnalytics?.sos_count || 0}</div>
                        <div className="text-xs text-text-dim font-medium">SOS distress signals sent</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Recent Notifications */}
                    <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col h-[400px] overflow-hidden">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-border shrink-0">
                        <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">Recent In-App Safety Alerts</h3>
                        <span className="w-2 h-2 rounded-full bg-indigo animate-pulse"></span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
                        {citizenAnalytics?.recent_notifications && citizenAnalytics.recent_notifications.length > 0 ? (
                          citizenAnalytics.recent_notifications.map((notif, idx) => (
                            <div key={idx} className="flex gap-3 text-xs leading-relaxed py-2.5 border-b border-white/5 last:border-b-0">
                              <span className="font-mono text-text-faint shrink-0">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-indigo"></span>
                              <div>
                                <strong className="text-text font-bold block">{notif.title}</strong>
                                <span className="text-[11px] text-text-dim block">{notif.message}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-text-faint italic p-6 text-center">No recent alerts found.</div>
                        )}
                      </div>
                    </div>

                    {/* Safety Advisories Column */}
                    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-[400px] overflow-y-auto space-y-4">
                      <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider mb-2 pb-2 border-b border-border">🚨 Emergency Guidelines</h3>
                      <div className="space-y-3 text-xs leading-relaxed">
                        <div className="p-3 bg-red-soft/10 border border-red/20 rounded-xl">
                          <strong className="text-red block mb-1">Evacuation</strong>
                          In case of fire, evacuate immediately. Do not use elevators. Call 101.
                        </div>
                        <div className="p-3 bg-amber-soft/10 border border-amber/20 rounded-xl">
                          <strong className="text-amber block mb-1">First Aid</strong>
                          Keep pressure on bleeding wounds. Perform CPR if breathing ceases. Call 102.
                        </div>
                        <div className="p-3 bg-indigo-soft/10 border border-indigo/20 rounded-xl">
                          <strong className="text-indigo block mb-1">Police Dispatch</strong>
                          For crimes in progress or threat events, call 100 or send instant SOS signal.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'operator' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-black text-white">Operator Command Center</h2>
                      <p className="text-xs text-text-dim mt-1">Real-time Public Safety Operations and Crisis Management Desk</p>
                    </div>
                    <div className="text-xs text-text-faint font-mono">Updated: Just now</div>
                  </div>

                  {/* KPI cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-red-soft rounded-lg"><AlertTriangle className="w-5 h-5 text-red" /></div>
                        <span className="text-[10px] text-red-400 font-bold bg-red-soft px-2 py-0.5 rounded-full">Live Monitor</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{operatorAnalytics?.active_incidents || 0}</div>
                        <div className="text-xs text-text-dim font-medium">{t.activeIncidents}</div>
                      </div>
                    </div>

                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-amber-soft rounded-lg"><MapPin className="w-5 h-5 text-amber" /></div>
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-soft px-2 py-0.5 rounded-full">AI Predictions</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{zones.filter(z => z.risk_level === 'critical' || z.risk_level === 'high').length}</div>
                        <div className="text-xs text-text-dim font-medium">{t.highRiskZones}</div>
                      </div>
                    </div>

                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-indigo-soft rounded-lg"><Shield className="w-5 h-5 text-indigo" /></div>
                        <span className="text-[10px] text-emerald font-bold bg-emerald-soft px-2 py-0.5 rounded-full">SOS Active</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{operatorAnalytics?.active_sos || 0}</div>
                        <div className="text-xs text-text-dim font-medium">{t.sosRequests}</div>
                      </div>
                    </div>

                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-emerald-soft rounded-lg"><Users className="w-5 h-5 text-emerald" /></div>
                        <span className="text-[10px] text-text-faint font-semibold">Active dispatch</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{operatorAnalytics?.available_teams || 0}</div>
                        <div className="text-xs text-text-dim font-medium">Ready Teams</div>
                      </div>
                    </div>
                  </div>

                  {/* Live Maps & Feed grids */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Maps panel */}
                    <div className="xl:col-span-2 bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[520px]">
                      <div className="p-4 border-b border-border bg-slate-900/40 flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">🗺 Dynamic Operations City Map</h3>
                        <div className="flex gap-2">
                          {Object.keys(mapLayers).map(layer => (
                            <button
                              key={layer}
                              onClick={() => setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
                              className={`text-[9px] font-bold px-2.5 py-1 rounded-md border transition uppercase ${
                                mapLayers[layer] ? 'bg-indigo/10 border-indigo/40 text-indigo' : 'bg-slate-800 border-border text-text-dim'
                              }`}
                            >
                              {layer}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 w-full relative">
                        <InteractiveMap 
                          zones={zones} 
                          incidents={incidents} 
                          sosRequests={sosRequests} 
                          teams={teams}
                          layers={mapLayers}
                        />
                      </div>
                    </div>

                    {/* Feed container */}
                    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-[520px] overflow-hidden">
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-border shrink-0">
                        <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">{t.liveFeed}</h3>
                        <span className="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
                        {feedItems.map((item, idx) => (
                          <div key={idx} className="flex gap-3 text-xs leading-relaxed py-2 border-b border-white/5 last:border-b-0">
                            <span className="font-mono text-text-faint shrink-0">{item.t}</span>
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }}></span>
                            <div>
                              <strong className="text-text font-bold block">{item.type}</strong>
                              <span className="text-[11px] text-text-faint block">{item.loc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'admin' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-black text-white">Administrator Command Center</h2>
                      <p className="text-xs text-text-dim mt-1">System monitoring, user accounts security audits, and risk modeling</p>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-indigo-soft rounded-lg"><Users className="w-5 h-5 text-indigo" /></div>
                        <span className="text-[10px] text-indigo font-bold bg-indigo-soft px-2 py-0.5 rounded-full">Database Users</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{usersList.length}</div>
                        <div className="text-xs text-text-dim font-medium">Registered Accounts</div>
                      </div>
                    </div>

                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-red-soft rounded-lg"><AlertTriangle className="w-5 h-5 text-red" /></div>
                        <span className="text-[10px] text-red font-bold bg-red-soft px-2 py-0.5 rounded-full">All Incidents</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{incidents.length}</div>
                        <div className="text-xs text-text-dim font-medium">Total Cases Registered</div>
                      </div>
                    </div>

                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-amber-soft rounded-lg"><Shield className="w-5 h-5 text-amber" /></div>
                        <span className="text-[10px] text-amber font-bold bg-amber-soft px-2 py-0.5 rounded-full">All SOS Alerts</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{sosRequests.length}</div>
                        <div className="text-xs text-text-dim font-medium">Total distress broadcasts</div>
                      </div>
                    </div>

                    <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="p-2.5 bg-emerald-soft rounded-lg"><Radio className="w-5 h-5 text-emerald" /></div>
                        <span className="text-[10px] text-emerald font-bold bg-emerald-soft px-2 py-0.5 rounded-full">WebSockets</span>
                      </div>
                      <div>
                        <div className="text-3xl font-black font-mono text-white">{systemAnalytics?.active_sessions || 0}</div>
                        <div className="text-xs text-text-dim font-medium">Active sessions count</div>
                      </div>
                    </div>
                  </div>

                  {/* System & Telemetry block */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Brief System Health */}
                    <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider pb-2 border-b border-border">🌐 Telemetry</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-dim">API Health Endpoint:</span>
                          <span className="font-semibold text-emerald flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald"></span> Online
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-dim">Database Session status:</span>
                          <span className={`font-semibold ${systemAnalytics?.db_status === 'connected' ? 'text-emerald' : 'text-rose-500'} flex items-center gap-1.5`}>
                            <span className={`w-2 h-2 rounded-full ${systemAnalytics?.db_status === 'connected' ? 'bg-emerald' : 'bg-rose-500'}`}></span>
                            {systemAnalytics?.db_status === 'connected' ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-dim">Active WebSocket connections:</span>
                          <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded font-bold">
                            {systemAnalytics?.active_sessions || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Brief Audit Logs */}
                    <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl flex flex-col h-[220px] overflow-hidden">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border shrink-0">
                        <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">Latest Activity Log</h3>
                        <button onClick={() => setActiveSection('audit-logs')} className="text-[11px] text-indigo hover:underline font-semibold">View All Logs</button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                        {auditLogs.slice(0, 5).map((log, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <div className="truncate pr-4">
                              <span className="font-bold text-white mr-2">{log.user_name || 'System'}:</span>
                              <span className="font-mono text-text-dim">{log.action}</span>
                            </div>
                            <span className="text-[10px] text-text-faint shrink-0 font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= SECTION: REPORT INCIDENT (CITIZEN) ================= */}
          {activeSection === 'report-incident' && user?.role === 'citizen' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Report New Incident</h2>
                <p className="text-xs text-text-dim mt-1">Submit high-priority safety incident directly to operator dispatch</p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl max-w-2xl space-y-4">
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Emergency Category</label>
                      <select 
                        value={incidentType}
                        onChange={(e) => setIncidentType(e.target.value)}
                        className="w-full bg-slate-800/40 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-indigo"
                      >
                        <option value="Fire">Fire</option>
                        <option value="Medical Emergency">Medical Emergency</option>
                        <option value="Crime">Crime</option>
                        <option value="Accident">Accident</option>
                        <option value="Disaster">Disaster</option>
                        <option value="Women Safety">Women Safety</option>
                        <option value="Missing Person">Missing Person</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">GPS Coordinates</label>
                      <button 
                        type="button" 
                        onClick={handleLocateCitizen}
                        className="w-full bg-slate-800 border border-border rounded-lg py-2 text-xs text-text hover:bg-slate-700 transition"
                      >
                        📍 Synchronize Position ({citizenLat.toFixed(3)}, {citizenLng.toFixed(3)})
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-1">Incident Details & Evacuation notes</label>
                    <textarea
                      value={incidentDesc}
                      onChange={(e) => setIncidentDesc(e.target.value)}
                      placeholder="Explain what is happening. Include details about injuries, smoke density, or physical threats..."
                      className="w-full bg-slate-800/40 border border-border rounded-lg px-3 py-2 text-xs text-text h-28 outline-none resize-none focus:border-indigo"
                    />
                  </div>

                  {/* Camera snapshot capture */}
                  <CameraUpload onCapture={(file) => setEvidenceFile(file)} />

                  {/* Audio memo recording */}
                  <div className="bg-slate-800/20 border border-border p-4 rounded-xl space-y-2">
                    <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider">Voice Emergency Memo (Optional)</label>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={(e) => setAudioFile(e.target.files[0])}
                      className="w-full text-xs text-text-dim"
                    />
                    <p className="text-[10px] text-text-faint">Upload a short audio note. APSAS will extract key phrases using AI NLP.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="btn btn-primary w-full py-2.5 rounded-lg text-xs text-white transition font-bold"
                  >
                    {submittingReport ? 'Triage priority engine running...' : 'Transmit Emergency Report'}
                  </button>
                </form>

                {successMsg && (
                  <div className="bg-emerald-soft border border-emerald/40 text-emerald p-3.5 rounded-xl text-xs leading-normal">
                    {successMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SECTION: MY REPORTS (CITIZEN) ================= */}
          {activeSection === 'my-reports' && user?.role === 'citizen' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">My Emergency Reports</h2>
                <p className="text-xs text-text-dim mt-1">Lifecycle progress timeline tracking for incidents reported by you</p>
              </div>

              <div className="space-y-4">
                {incidents.filter(i => i.citizen_id === user.id).length === 0 ? (
                  <div className="bg-card border border-border p-8 rounded-2xl text-center text-xs text-text-dim italic">
                    You have not submitted any incident reports.
                  </div>
                ) : (
                  incidents.filter(i => i.citizen_id === user.id).map(inc => (
                    <div key={inc.id} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-start flex-wrap gap-2 border-b border-white/5 pb-3">
                        <div>
                          <span className="text-[10px] font-mono text-text-faint">CASE ID: INC-{inc.id}</span>
                          <h3 className="text-md font-bold text-white mt-0.5">{inc.type}</h3>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.severity === 'critical' ? 'bg-red-soft text-red' : inc.severity === 'high' ? 'bg-amber-soft text-amber' : 'bg-indigo-soft text-indigo'
                          }`}>
                            {inc.severity.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.status === 'resolved' ? 'bg-emerald-soft text-emerald' : 'bg-slate-800 text-text-dim'
                          }`}>
                            {inc.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <p className="text-text-dim"><strong className="text-white">Description:</strong> {inc.description}</p>
                          <p className="text-text-faint"><strong className="text-text-dim">Coordinates:</strong> ({inc.location_lat.toFixed(4)}, {inc.location_lng.toFixed(4)})</p>
                          <p className="text-text-faint"><strong className="text-text-dim">Reported At:</strong> {new Date(inc.created_at).toLocaleString()}</p>
                        </div>
                        <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-border flex flex-col justify-center">
                          <div className="font-semibold text-white">Emergency Response Status:</div>
                          {inc.status === 'resolved' ? (
                            <div className="text-emerald text-[11px]">✔ Case resolved successfully. Response team completed dispatch operation.</div>
                          ) : inc.team ? (
                            <div className="text-cyan text-[11px] space-y-1">
                              <div>🚒 Team <strong className="text-white">{inc.team.name}</strong> has been dispatched.</div>
                              {inc.eta_minutes && <div>Estimated ETA: <strong className="text-white">{inc.eta_minutes} minutes</strong></div>}
                            </div>
                          ) : (
                            <div className="text-text-faint text-[11px]">Pending operator triage. APSAS will notify you once a response team is assigned.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= SECTION: ZONE MAP ================= */}
          {activeSection === 'zonemap' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">{t.zoneMap} Heatmap</h2>
                <p className="text-xs text-text-dim mt-1">Dynamic safety score ratings calculated across monitored city sectors</p>
              </div>
              
              <div className="bg-card border border-border rounded-2xl overflow-hidden h-[600px] w-full relative flex flex-col">
                <div className="p-4 border-b border-border bg-slate-900/40">
                  <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">Predictive Safety Scores Map</h3>
                </div>
                <div className="flex-1 relative">
                  <InteractiveMap 
                    zones={zones} 
                    incidents={incidents} 
                    sosRequests={sosRequests} 
                    teams={teams}
                    layers={{ zones: true, incidents: false, sos: false, teams: false }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: ROUTE PLANNER ================= */}
          {activeSection === 'routes' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">{t.routePlanner} Desk</h2>
                <p className="text-xs text-text-dim mt-1">Calculates optimal safety-weighted routes to navigate surrounding threats</p>
              </div>
              <RoutePlanner />
            </div>
          )}

          {/* ================= SECTION: SOS CENTER ================= */}
          {activeSection === 'sos' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">{t.sosCenter}</h2>
                <p className="text-xs text-text-dim mt-1">Distress signal broadcasts and direct dispatch responses</p>
              </div>

              {user?.role === 'citizen' ? (
                <div className="grid grid-cols-1 gap-6">
                  {/* Citizen distress triggering panel */}
                  <div className="bg-card border border-border p-8 rounded-2xl text-center space-y-6 flex flex-col items-center justify-center">
                    <h3 className="text-xl font-extrabold text-white">In an active emergency?</h3>
                    <p className="text-xs text-text-dim max-w-sm">
                      Pressing the SOS button transmits your active GPS coordinates to our 24/7 command center and dispatches the closest Response Team.
                    </p>
                    <button
                      onClick={handleTriggerSOS}
                      className="w-48 h-48 rounded-full bg-red border-8 border-red-950 text-white font-extrabold text-2xl tracking-widest flex items-center justify-center hover:scale-105 shadow-2xl shadow-red/40 transition duration-300"
                    >
                      🆘 SOS
                    </button>
                    <span className="text-[10px] text-text-faint uppercase font-mono">Location auto-attached</span>
                  </div>
                </div>
              ) : (
                /* Operator active SOS list view */
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border bg-slate-900/40 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">Active distress signals requesting dispatch</h3>
                    <span className="text-[10px] text-red font-bold font-mono">{sosRequests.filter(s => s.status !== 'resolved').length} PENDING</span>
                  </div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-slate-900/10">
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">ID</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Citizen</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">GPS Location</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Time</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Status</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Dispatch Team</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sosRequests.map((sos) => (
                        <tr key={sos.id} className="hover:bg-white/5 transition duration-150">
                          <td className="py-3 px-4 font-mono text-xs text-text">SOS-{sos.id}</td>
                          <td className="py-3 px-4 text-xs font-bold text-text">{sos.citizen?.full_name || 'Anonymous'}</td>
                          <td className="py-3 px-4 text-xs text-text-dim">({sos.location_lat.toFixed(3)}, {sos.location_lng.toFixed(3)})</td>
                          <td className="py-3 px-4 text-xs text-text-faint">{new Date(sos.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-3 px-4 text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sos.status === 'resolved' ? 'bg-emerald-soft text-emerald' : 'bg-red-soft text-red animate-pulse'
                            }`}>
                              {sos.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-text-dim">
                            {sos.team ? (
                              <span className="font-semibold text-text">{sos.team.name}</span>
                            ) : (
                              <span className="text-text-faint">None</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {sos.status !== 'resolved' && (
                              <div className="flex gap-2 justify-center">
                                <select
                                  onChange={(e) => handleUpdateSOSStatus(sos.id, 'acknowledged', e.target.value)}
                                  className="bg-slate-800 border border-border rounded text-[11px] p-1 outline-none text-text"
                                >
                                  <option value="">Dispatch team...</option>
                                  {teams.filter(t => t.status === 'ready').map(team => (
                                    <option key={team.id} value={team.id}>{team.name} ({team.type})</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleUpdateSOSStatus(sos.id, 'resolved')}
                                  className="bg-emerald text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-emerald-600"
                                >
                                  Resolve
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION: INCIDENTS ================= */}
          {activeSection === 'incidents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Incident Management Queue</h2>
                  <p className="text-xs text-text-dim mt-1">Lifecycle tracking and dispatch management across all registered cases</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDownloadPDF('incidents')}
                    className="bg-card border border-border hover:border-indigo text-text-dim hover:text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <FileText className="w-4 h-4 text-indigo" /> Export Incidents PDF
                  </button>
                </div>
              </div>

              {/* Incidents Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-slate-900/10">
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">ID</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Type</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Coordinates</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Severity</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Status</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Dispatch Team</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-center py-3 px-4">Details</th>
                      {user?.role !== 'citizen' && (
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-center py-3 px-4">Triage Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredIncidents.map((inc) => (
                      <React.Fragment key={inc.id}>
                        <tr className="hover:bg-white/5 transition duration-150">
                          <td className="py-3.5 px-4 font-mono text-xs text-text">INC-{inc.id}</td>
                          <td className="py-3.5 px-4 text-xs font-bold text-text">{inc.type}</td>
                          <td className="py-3.5 px-4 text-xs text-text-dim">({inc.location_lat.toFixed(3)}, {inc.location_lng.toFixed(3)})</td>
                          <td className="py-3.5 px-4 text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inc.severity === 'critical' ? 'bg-red-soft text-red animate-ping' : inc.severity === 'high' ? 'bg-amber-soft text-amber' : 'bg-indigo-soft text-indigo'
                            }`}>
                              {inc.severity.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inc.status === 'resolved' ? 'bg-emerald-soft text-emerald' : 'bg-slate-800 text-text-dim'
                            }`}>
                              {inc.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-text-dim">
                            {inc.team ? (
                              <span className="font-semibold text-text">{inc.team.name}</span>
                            ) : (
                              <span className="text-text-faint">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setActiveIncidentId(activeIncidentId === inc.id ? null : inc.id)}
                              className="text-xs font-semibold text-cyan hover:underline"
                            >
                              {activeIncidentId === inc.id ? 'Hide Details' : 'View Details'}
                            </button>
                          </td>
                          {user?.role !== 'citizen' && (
                            <td className="py-3.5 px-4 text-center">
                              {inc.status !== 'resolved' && (
                                <div className="flex gap-2 justify-center">
                                  <select
                                    onChange={(e) => handleUpdateIncidentStatus(inc.id, 'assigned', e.target.value)}
                                    className="bg-slate-800 border border-border rounded text-[11px] p-1 outline-none text-text"
                                  >
                                    <option value="">Dispatch team...</option>
                                    {teams.filter(t => t.status === 'ready').map(team => (
                                      <option key={team.id} value={team.id}>{team.name} ({team.type})</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleUpdateIncidentStatus(inc.id, 'resolved')}
                                    className="bg-emerald text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-emerald-600"
                                  >
                                    Resolve
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>

                        {/* Collapsible Details Row */}
                        {activeIncidentId === inc.id && (
                          <tr className="bg-slate-900/30">
                            <td colSpan={user?.role !== 'citizen' ? 8 : 7} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-xs font-bold text-text-dim uppercase tracking-wider">Report Description</h4>
                                    <p className="text-xs text-text mt-1 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-border">
                                      {inc.description || 'No description provided.'}
                                    </p>
                                  </div>

                                  {inc.audio_transcript && (
                                    <div>
                                      <h4 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-cyan" /> Voice transcript</h4>
                                      <p className="text-xs text-cyan mt-1 bg-slate-950/40 p-3 rounded-lg border border-cyan/20 italic">
                                        "{inc.audio_transcript}"
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {inc.media_url ? (
                                    <div>
                                      <h4 className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5 mb-2"><Image className="w-3.5 h-3.5 text-indigo" /> Uploaded Evidence</h4>
                                      <img 
                                        src={`${axios.defaults.baseURL.replace('/api/v1', '')}${inc.media_url}`} 
                                        alt="Incident evidence" 
                                        className="max-h-[160px] rounded-lg border border-border object-contain"
                                      />
                                      {inc.ai_confidence && (
                                        <div className="mt-2 text-xs font-semibold text-emerald flex items-center gap-1.5">
                                          <CheckCircle className="w-3.5 h-3.5" /> YOLOv8 Detected Threat Confidence: {Math.round(inc.ai_confidence * 100)}%
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-text-faint italic p-4 bg-slate-950/20 border border-border rounded-lg text-center">
                                      No media evidence attached.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION: ANALYTICS ================= */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Operational Analytics</h2>
                  <p className="text-xs text-text-dim mt-1">Data-driven performance metrics, risk scoring aggregates, and average response trends</p>
                </div>
                <button 
                  onClick={() => handleDownloadPDF('analytics')}
                  className="bg-card border border-border hover:border-indigo text-text-dim hover:text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-indigo" /> Export Analytics PDF
                </button>
              </div>

              <AnalyticsCharts data={analyticsData} />
            </div>
          )}

          {/* ================= SECTION: SETTINGS ================= */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">{t.settings}</h2>
                <p className="text-xs text-text-dim mt-1">Configure account profile details and notification channels</p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl max-w-lg space-y-4">
                <h3 className="text-md font-bold text-white">Update Account Profile</h3>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-dim mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-2 text-xs text-text outline-none focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim mb-1">Contact Phone</label>
                    <input 
                      type="text" 
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-2 text-xs text-text outline-none focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-dim mb-1">New Password (leave blank to keep current)</label>
                    <input 
                      type="password" 
                      value={settingsPassword}
                      onChange={(e) => setSettingsPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary px-5 py-2 text-xs font-bold text-white rounded-lg transition"
                  >
                    Save profile changes
                  </button>
                </form>

                {settingsSuccess && (
                  <div className="bg-emerald-soft border border-emerald/40 text-emerald p-3.5 rounded-xl text-xs">
                    ✔ Account settings updated successfully.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= SECTION: USER MANAGEMENT (ADMIN) ================= */}
          {activeSection === 'users' && user?.role === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-white">User Accounts Database</h2>
                  <p className="text-xs text-text-dim mt-1">Manage user security credentials, promoting roles, account suspension, and removals</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-slate-900/10">
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Name</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Email</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Phone</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Role</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Status</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Joined Date</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-center py-3 px-4">Triage Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-white/5 transition duration-150">
                        <td className="py-3 px-4 text-xs font-bold text-white">{usr.full_name}</td>
                        <td className="py-3 px-4 text-xs text-text-dim font-mono">{usr.email}</td>
                        <td className="py-3 px-4 text-xs text-text-dim">{usr.phone || 'N/A'}</td>
                        <td className="py-3 px-4 text-xs capitalize">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            usr.role === 'admin' ? 'bg-red-soft text-red' : 
                            usr.role === 'operator' ? 'bg-cyan-soft text-cyan' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            usr.status === 'suspended' ? 'bg-red-soft text-red animate-pulse' : 'bg-emerald-soft text-emerald'
                          }`}>
                            {usr.status?.toUpperCase() || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-faint">{new Date(usr.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <select
                              value={usr.role}
                              onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                              disabled={usr.id === user.id}
                              className="bg-slate-800 border border-border rounded text-[11px] p-1 text-text outline-none focus:border-indigo"
                            >
                              <option value="citizen">Citizen</option>
                              <option value="operator">Operator</option>
                              <option value="admin">Admin</option>
                            </select>

                            {usr.status === 'suspended' ? (
                              <button
                                onClick={() => handleStatusChange(usr.id, 'active')}
                                className="bg-emerald text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-emerald-600 transition"
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(usr.id, 'suspended')}
                                disabled={usr.id === user.id}
                                className="bg-amber text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-amber-600 transition disabled:opacity-50"
                              >
                                Suspend
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteUser(usr.id)}
                              disabled={usr.id === user.id}
                              className="bg-red text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-red-600 transition disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION: ZONE MANAGEMENT (ADMIN) ================= */}
          {activeSection === 'zones' && user?.role === 'admin' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">Risk Zone Management</h2>
                <p className="text-xs text-text-dim mt-1">Create, update, and remove predictive risk polygon zones in the database</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Creator Form */}
                <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                  <h3 className="text-md font-bold text-white">{editingZoneId ? 'Update Risk Zone' : 'Create New Risk Zone'}</h3>
                  <form onSubmit={handleZoneSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-dim mb-1">Zone Name</label>
                      <input 
                        type="text" 
                        required
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        placeholder="Sector 7 - Central Hub"
                        className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-2 text-xs text-text outline-none focus:border-indigo"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-dim mb-1">Polygon Coordinates JSON</label>
                      <textarea
                        required
                        value={zonePolygonCoords}
                        onChange={(e) => setZonePolygonCoords(e.target.value)}
                        placeholder="[[24.580,78.910],[24.585,78.915],[24.580,78.920]]"
                        className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-2 text-xs text-text h-24 font-mono outline-none resize-none focus:border-indigo"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-dim mb-1">Risk Score (0-100)</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          required
                          value={zoneRiskScore}
                          onChange={(e) => setZoneRiskScore(e.target.value)}
                          className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-2 text-xs text-text outline-none focus:border-indigo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-dim mb-1">Risk Level</label>
                        <select
                          value={zoneRiskLevel}
                          onChange={(e) => setZoneRiskLevel(e.target.value)}
                          className="w-full bg-slate-800/40 border border-border rounded-xl px-3 py-2 text-xs text-text outline-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="btn btn-primary flex-1 py-2 rounded-lg text-xs text-white font-bold transition"
                      >
                        {editingZoneId ? 'Save Changes' : 'Create Zone'}
                      </button>
                      {editingZoneId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingZoneId(null);
                            setZoneName('');
                            setZonePolygonCoords('[[24.580,78.910],[24.585,78.915],[24.580,78.920]]');
                            setZoneRiskScore(50);
                            setZoneRiskLevel('medium');
                          }}
                          className="bg-slate-800 border border-border text-text px-4 py-2 rounded-lg text-xs hover:bg-slate-700 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List Table */}
                <div className="xl:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-slate-900/10">
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Name</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Level</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Score</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Active Incidents</th>
                        <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-center py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {zones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-white/5 transition duration-150">
                          <td className="py-3 px-4 text-xs font-bold text-white">{zone.name}</td>
                          <td className="py-3 px-4 text-xs capitalize">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              zone.risk_level === 'critical' ? 'bg-red-soft text-red' : 
                              zone.risk_level === 'high' ? 'bg-amber-soft text-amber' : 
                              zone.risk_level === 'medium' ? 'bg-indigo-soft text-indigo' : 'bg-emerald-soft text-emerald'
                            }`}>
                              {zone.risk_level}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-text-dim font-mono">{zone.risk_score}%</td>
                          <td className="py-3 px-4 text-xs text-text-dim font-mono">{zone.active_incidents_count}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEditZoneClick(zone)}
                                className="bg-indigo text-white px-2.5 py-1 rounded text-[11px] font-bold hover:bg-indigo-600 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteZoneClick(zone.id)}
                                className="bg-red text-white px-2.5 py-1 rounded text-[11px] font-bold hover:bg-red-600 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: SYSTEM MONITORING ================= */}
          {activeSection === 'system' && user?.role === 'admin' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">System Monitoring & Telemetry</h2>
                <p className="text-xs text-text-dim mt-1">Live health statuses, API responsiveness, database status, and WebSocket manager connection telemetry</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] text-text-faint font-bold uppercase tracking-wider">FastAPI Status</span>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-emerald rounded-full pulse-dot"></span>
                    <span className="text-lg font-black text-white capitalize">{systemAnalytics?.api_status || 'online'}</span>
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] text-text-faint font-bold uppercase tracking-wider">SQLAlchemy SQLite</span>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 ${systemAnalytics?.db_status === 'connected' ? 'bg-emerald' : 'bg-red'} rounded-full`}></span>
                    <span className="text-lg font-black text-white capitalize">{systemAnalytics?.db_status || 'connected'}</span>
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-2xl space-y-2">
                  <span className="text-[10px] text-text-faint font-bold uppercase tracking-wider">Active WebSocket Sessions</span>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-indigo rounded-full"></span>
                    <span className="text-lg font-black text-white font-mono">{systemAnalytics?.active_sessions || 0} Connected</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider pb-2 border-b border-border">Operational Environment Telemetry</h3>
                <div className="space-y-3 text-xs leading-relaxed max-w-xl">
                  <p className="text-text-dim">
                    Stateless JWT security validations are executed upon each API fetch. Live telemetry sessions represent current persistent channels routed through the Python ASGI server.
                  </p>
                  <p className="text-text-faint">
                    Simulated SMTP dispatch queues log all generated alerts to <code className="font-mono text-cyan">email_notifications.log</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: AUDIT LOGS ================= */}
          {activeSection === 'audit-logs' && user?.role === 'admin' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white">System Security Audit Logs</h2>
                <p className="text-xs text-text-dim mt-1">Unified register of joined user security and administrative actions</p>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-slate-900/10">
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Log ID</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Operator / User</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Email</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Action</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">IP Address</th>
                      <th className="text-[10px] text-text-faint font-semibold uppercase tracking-wider text-left py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition duration-150">
                        <td className="py-3.5 px-4 font-mono text-xs text-text-dim">#LOG-{log.id}</td>
                        <td className="py-3.5 px-4 text-xs font-bold text-white">{log.user_name || 'System / Guest'}</td>
                        <td className="py-3.5 px-4 text-xs text-text-dim font-mono">{log.user_email || 'N/A'}</td>
                        <td className="py-3.5 px-4 text-xs text-indigo font-semibold font-mono">{log.action}</td>
                        <td className="py-3.5 px-4 text-xs text-text-dim font-mono">{log.ip_address || '127.0.0.1'}</td>
                        <td className="py-3.5 px-4 text-xs text-text-faint">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent floating AI chat assistant drawer */}
      <aside className="w-80 border-l border-border bg-bg-2 flex flex-col justify-between shrink-0 p-4 h-full relative">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-4">
            <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan" /> {t.chatAssistant}
            </h3>
            <span className="text-[10px] text-text-faint font-semibold block">Local safety rules Q&A engine</span>
          </div>
          <Chatbot />
        </div>
      </aside>
    </div>
  );
};

// Core entry wrapping AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <MainFlowRouter />
    </AuthProvider>
  );
};

const MainFlowRouter = () => {
  const { token, login, signup, loading, forgotPassword, resetPassword } = useContext(AuthContext);
  const [screen, setScreen] = useState('landing'); // landing, login, signup, forgot-password, reset-password, dashboard
  
  // Form credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [showStaffModal, setShowStaffModal] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setResetToken(tokenParam);
      setScreen('reset-password');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token) {
      setScreen('dashboard');
    } else {
      setScreen('landing');
    }
  }, [token]);

  const handleCitizenLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoadingAction(true);
    try {
      await login(email, password, 'citizen');
      setScreen('dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setErrorMsg(err.response.data.detail || 'Your account has been suspended. Please contact support.');
      } else {
        setErrorMsg('Incorrect email address or password.');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOperatorLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoadingAction(true);
    try {
      await login(email, password, 'operator');
      setScreen('dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setErrorMsg(err.response.data.detail || 'Your account has been suspended. Please contact support.');
      } else {
        setErrorMsg('Incorrect email address or password.');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoadingAction(true);
    try {
      await login(email, password, 'admin');
      setScreen('dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setErrorMsg(err.response.data.detail || 'Your account has been suspended. Please contact support.');
      } else {
        setErrorMsg('Incorrect email address or password.');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    setLoadingAction(true);
    try {
      await signup(email, password, fullName, 'citizen', phone);
      await login(email, password);
      setScreen('dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg('Registration failed. Check if email is already taken.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoadingAction(true);
    try {
      const res = await forgotPassword(email);
      setSuccessMsg(res.message);
      if (res.debug_url) {
        setSuccessMsg(prev => `${prev}\n\n[Dev Environment Reset Link]: ${res.debug_url}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    setLoadingAction(true);
    try {
      await resetPassword(resetToken, password);
      setSuccessMsg('Your password has been successfully reset! Redirecting to login...');
      setTimeout(() => {
        setScreen('login');
        setSuccessMsg('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg text-text-dim text-sm">
        Verifying safety command session...
      </div>
    );
  }

  // Render dashboard directly if authenticated
  if (screen === 'dashboard' && token) {
    return <DashboardApp />;
  }

  // Landing Page Screen
  if (screen === 'landing') {
    return (
      <div className="min-h-screen bg-bg text-text flex flex-col justify-between">
        {/* Navbar */}
        <header className="px-8 md:px-16 h-20 border-b border-border bg-bg/75 backdrop-blur-md flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo to-cyan flex items-center justify-center shadow-lg shadow-indigo/40">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">Smart Public Alert & Safety System</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setScreen('login')} className="text-xs font-bold text-text hover:text-white px-4 py-2 rounded-xl transition border border-transparent hover:border-border">
              Login
            </button>
            <button onClick={() => setScreen('signup')} className="bg-indigo hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo/25">
              Sign Up
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-8 md:px-16 max-w-6xl mx-auto flex-1 flex flex-col items-center justify-center text-center space-y-8 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-strong bg-indigo/5 text-xs text-indigo-300 font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 bg-emerald rounded-full pulse-dot"></span> Active Systems Operational
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            Monitor. Protect. <span className="bg-gradient-to-r from-indigo to-cyan bg-clip-text text-transparent">Respond.</span>
          </h1>
          <p className="text-md md:text-xl text-text-dim max-w-2xl leading-relaxed">
            Predict risks. Coordinate responses. Protect lives.
          </p>
          <div className="flex gap-4">
            <button onClick={() => setScreen('signup')} className="bg-indigo hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl text-xs tracking-wider uppercase transition shadow-xl shadow-indigo/25">
              Launch Command Center →
            </button>
            <button onClick={() => setScreen('login')} className="bg-slate-800 hover:bg-slate-700 text-text font-bold py-3 px-8 rounded-xl text-xs tracking-wider uppercase transition border border-border">
              Request Operator Demo
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mt-12">
            <div className="bg-slate-900/70 backdrop-blur-lg border border-slate-800 hover:border-indigo-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] group">
              <div className="w-14 h-14 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5">
                <ShieldAlert size={30} className="text-indigo-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">AI Incident Detection</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automatically classify emergencies and assign priority levels using intelligent AI models.
              </p>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-lg border border-slate-800 hover:border-cyan-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] group">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-5">
                <BrainCircuit size={30} className="text-cyan-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Risk Prediction</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Predict high-risk zones using historical incidents, trends, and behavioral analytics.
              </p>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-lg border border-slate-800 hover:border-violet-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] group">
              <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                <Route size={30} className="text-violet-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Route Intelligence</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Generate optimized emergency routes using dynamic risk and traffic analysis.
              </p>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-lg border border-slate-800 hover:border-blue-500 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] group">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-5">
                <Radio size={30} className="text-blue-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Emergency Response</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Coordinate SOS alerts, response teams, and incident management from a unified platform.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Login Screen
  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="text-center">
            <button onClick={() => setScreen('landing')} className="text-xs text-text-faint hover:text-white transition">← Back to Homepage</button>
            <h2 className="text-2xl font-black text-white mt-4">Welcome back</h2>
            <p className="text-xs text-text-dim mt-1">Sign in to your command center account.</p>
          </div>

          <form onSubmit={handleCitizenLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.gov"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-text-dim">Password</label>
                <button 
                  type="button" 
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setScreen('forgot-password');
                  }} 
                  className="text-[11px] font-semibold text-indigo hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-red bg-red-soft/20 border border-red/20 p-3 rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAction}
              className="btn btn-primary w-full py-3 rounded-xl text-xs text-white transition font-bold"
            >
              {loadingAction ? 'Authenticating credentials...' : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-xs text-text-dim">
            Don't have an authorized account?{' '}
            <button onClick={() => { setErrorMsg(''); setScreen('signup'); }} className="text-indigo font-bold hover:underline">
              Create Account
            </button>
          </p>

          <div className="pt-5 border-t border-border mt-4">
            <div className="text-center">
              <span className="text-xs text-text-faint font-semibold block mb-2">Staff Access</span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setShowStaffModal(true);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-text font-bold py-2.5 px-4 rounded-xl text-xs transition border border-border flex items-center justify-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-indigo" /> Login as Staff
              </button>
            </div>
          </div>
        </div>

        {showStaffModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card border border-border-strong rounded-2xl p-6 space-y-6 shadow-2xl relative">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-soft flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-indigo" />
                </div>
                <h3 className="text-lg font-black text-white">Staff Access Portals</h3>
                <p className="text-xs text-text-dim mt-1">Select the staff login portal for your department.</p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffModal(false);
                    setErrorMsg('');
                    setEmail('');
                    setPassword('');
                    setScreen('login-operator');
                  }}
                  className="w-full bg-slate-800/60 hover:bg-slate-800 border border-border hover:border-cyan/40 p-4 rounded-xl flex items-center gap-3 transition cursor-pointer text-left group"
                >
                  <div className="p-2 bg-cyan-soft rounded-lg text-cyan">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan transition">Operator Login</div>
                    <div className="text-[10px] text-text-faint">For response team dispatching</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowStaffModal(false);
                    setErrorMsg('');
                    setEmail('');
                    setPassword('');
                    setScreen('login-admin');
                  }}
                  className="w-full bg-slate-800/60 hover:bg-slate-800 border border-border hover:border-indigo/40 p-4 rounded-xl flex items-center gap-3 transition cursor-pointer text-left group"
                >
                  <div className="p-2 bg-indigo-soft rounded-lg text-indigo">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo transition">Administrator Login</div>
                    <div className="text-[10px] text-text-faint">For system and user database command</div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="w-full text-center text-xs text-text-faint hover:text-white transition py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Operator Login Screen
  if (screen === 'login-operator') {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="text-center">
            <button 
              onClick={() => {
                setErrorMsg('');
                setEmail('');
                setPassword('');
                setScreen('login');
              }} 
              className="text-xs text-text-faint hover:text-white transition"
            >
              ← Back to Citizen Login
            </button>
            <div className="w-12 h-12 rounded-full bg-cyan-soft flex items-center justify-center mx-auto mt-4 mb-2 text-cyan">
              <Radio className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Operator Login</h2>
            <p className="text-xs text-text-dim mt-1">Authorized personnel emergency dispatch dashboard access.</p>
          </div>

          <form onSubmit={handleOperatorLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@apsas.city"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-cyan"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-text-dim">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-cyan"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-red bg-red-soft/20 border border-red/20 p-3 rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAction}
              className="btn btn-primary w-full py-3 rounded-xl text-xs text-white transition font-bold !bg-cyan hover:!bg-cyan-600"
            >
              {loadingAction ? 'Verifying operator security...' : 'Operator Sign In →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Login Screen
  if (screen === 'login-admin') {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="text-center">
            <button 
              onClick={() => {
                setErrorMsg('');
                setEmail('');
                setPassword('');
                setScreen('login');
              }} 
              className="text-xs text-text-faint hover:text-white transition"
            >
              ← Back to Citizen Login
            </button>
            <div className="w-12 h-12 rounded-full bg-indigo-soft flex items-center justify-center mx-auto mt-4 mb-2 text-indigo">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Administrator Login</h2>
            <p className="text-xs text-text-dim mt-1">System administrator console and user records login portal.</p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@apsas.city"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-text-dim">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-red bg-red-soft/20 border border-red/20 p-3 rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAction}
              className="btn btn-primary w-full py-3 rounded-xl text-xs text-white transition font-bold"
            >
              {loadingAction ? 'Verifying admin clearance...' : 'Administrator Sign In →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Forgot Password Screen
  if (screen === 'forgot-password') {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="text-center">
            <button onClick={() => setScreen('login')} className="text-xs text-text-faint hover:text-white transition">← Back to Login</button>
            <h2 className="text-2xl font-black text-white mt-4">Reset Password</h2>
            <p className="text-xs text-text-dim mt-1">Enter your registered email address and we'll send a password recovery link.</p>
          </div>

          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.gov"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>

            {errorMsg && <div className="text-xs text-red font-semibold">{errorMsg}</div>}
            
            {successMsg && (
              <div className="bg-emerald-soft border border-emerald/40 text-emerald p-3.5 rounded-xl text-xs whitespace-pre-line leading-normal">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAction}
              className="btn btn-primary w-full py-3 rounded-xl text-xs text-white transition font-bold"
            >
              {loadingAction ? 'Verifying email address...' : 'Send Recovery Link →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Reset Password Screen
  if (screen === 'reset-password') {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">Create New Password</h2>
            <p className="text-xs text-text-dim mt-1">Enter your secure new password below to finalize recovery.</p>
          </div>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>

            {errorMsg && <div className="text-xs text-red font-semibold">{errorMsg}</div>}
            
            {successMsg && (
              <div className="bg-emerald-soft border border-emerald/40 text-emerald p-3.5 rounded-xl text-xs leading-normal">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAction}
              className="btn btn-primary w-full py-3 rounded-xl text-xs text-white transition font-bold"
            >
              {loadingAction ? 'Updating security credentials...' : 'Reset Password →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Registration Screen
  if (screen === 'signup') {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6 shadow-2xl">
          <div className="text-center">
            <button onClick={() => setScreen('landing')} className="text-xs text-text-faint hover:text-white transition">← Back to Homepage</button>
            <h2 className="text-2xl font-black text-white mt-4">Create Account</h2>
            <p className="text-xs text-text-dim mt-1">Register credentials to log safety reports and trigger SOS.</p>
          </div>

          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aanya Singh"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aanya@gmail.com"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-dim mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-dim mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-dim mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/40 border border-border rounded-xl px-4 py-3 text-xs text-text outline-none focus:border-indigo"
              />
            </div>

            {errorMsg && <div className="text-xs text-red font-semibold">{errorMsg}</div>}

            <button
              type="submit"
              disabled={loadingAction}
              className="btn btn-primary w-full py-3 rounded-xl text-xs text-white transition font-bold"
            >
              {loadingAction ? 'Creating security profile...' : 'Register Profile →'}
            </button>
          </form>

          <p className="text-center text-xs text-text-dim">
            Already have a safety profile?{' '}
            <button onClick={() => setScreen('login')} className="text-indigo font-bold hover:underline">
              Log In
            </button>
          </p>
        </div>
      </div>
    );
  }
};

export default App;
