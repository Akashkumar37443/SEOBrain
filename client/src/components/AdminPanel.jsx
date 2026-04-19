import { useState, useEffect } from 'react'
import { 
  Shield, 
  Users, 
  Activity, 
  Settings, 
  Database, 
  Server, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  RefreshCw,
  UserCog,
  Ban,
  Search
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// Admin Guard Component
export function AdminGuard({ children }) {
  const { user } = useAuth()
  
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center glass rounded-3xl p-12">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/60">You don't have permission to access this area.</p>
        </div>
      </div>
    )
  }
  
  return children
}

// System Status Card
function StatusCard({ title, status, icon: Icon, lastChecked }) {
  const getStatusColor = (s) => {
    switch (s) {
      case 'online': return 'text-green-400'
      case 'offline': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      default: return 'text-slate-400'
    }
  }
  
  const getStatusBg = (s) => {
    switch (s) {
      case 'online': return 'bg-green-500/20'
      case 'offline': return 'bg-red-500/20'
      case 'warning': return 'bg-yellow-500/20'
      default: return 'bg-slate-500/20'
    }
  }
  
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusBg(status)}`}>
            <Icon className={`w-6 h-6 ${getStatusColor(status)}`} />
          </div>
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-xs text-white/50">{lastChecked}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBg(status)} ${getStatusColor(status)}`}>
          {status === 'online' && <CheckCircle className="w-4 h-4" />}
          {status === 'offline' && <XCircle className="w-4 h-4" />}
          {status === 'warning' && <AlertTriangle className="w-4 h-4" />}
          <span className="capitalize">{status}</span>
        </div>
      </div>
    </div>
  )
}

// Stats Card
function AdminStatCard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-white/60 text-sm">{title}</p>
    </div>
  )
}

// User Management Row
function UserRow({ user, currentUser, onStatusChange, onRoleChange, onDelete }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">{user.firstName?.[0]}{user.lastName?.[0]}</span>
        </div>
        <div>
          <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-white/50 text-sm">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={user.role?.toLowerCase() || 'user'}
          onChange={(e) => onRoleChange(user.id, e.target.value)}
          disabled={user.id === currentUser?.id}
          className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white border-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
        >
          <option value="user" className="bg-slate-800">User</option>
          <option value="admin" className="bg-slate-800">Admin</option>
          <option value="premium" className="bg-slate-800">Premium</option>
        </select>
        <button
          onClick={() => onStatusChange(user.id, !user.isActive)}
          disabled={user.id === currentUser?.id}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
            user.isActive 
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </button>
        <button
          onClick={() => onDelete(user.id)}
          disabled={user.id === currentUser?.id}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-30"
          title={user.id === currentUser?.id ? "Cannot delete yourself" : "Delete user"}
        >
          <Ban className="w-5 h-5 text-red-400" />
        </button>
      </div>
    </div>
  )
}

// Add User Modal
function AddUserModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass rounded-3xl p-8 w-full max-w-md">
        <h3 className="text-2xl font-bold text-white mb-6">Add New User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/70 text-sm">First Name</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-4 py-2 bg-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Last Name</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="w-full px-4 py-2 bg-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 bg-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 bg-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="text-white/70 text-sm">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-4 py-2 bg-white/10 rounded-xl text-white border-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="user" className="bg-slate-800">User</option>
              <option value="admin" className="bg-slate-800">Admin</option>
              <option value="premium" className="bg-slate-800">Premium</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 glass rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main Admin Panel
export function AdminPanel() {
  const { api, user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [systemStatus, setSystemStatus] = useState({
    dotnetApi: { status: 'online', lastChecked: '2 mins ago' },
    fastApi: { status: 'online', lastChecked: '1 min ago' },
    sqlServer: { status: 'online', lastChecked: '5 mins ago' },
    aiService: { status: 'online', lastChecked: '30 secs ago' }
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAnalyses: 0,
    newUsersToday: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    emailNotificationsEnabled: true,
    requireTwoFactorForAdmin: false,
    maxLoginAttempts: 5,
    defaultFreeQuota: 10,
    defaultProQuota: 100,
    defaultEnterpriseQuota: 500
  })
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'SEOBrain',
    adminEmail: '',
    isConfigured: false
  })

  useEffect(() => {
    fetchAdminData()
    fetchSystemStatus()
    fetchSettings()
    fetchEmailSettings()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [usersRes, statsRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/stats')
      ])
      setUsers(usersRes.data.users || usersRes.data || [])
      setStats(statsRes.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemStatus = async () => {
    try {
      const res = await api.get('/api/admin/system/status')
      setSystemStatus(res.data)
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/admin/settings')
      setSettings(res.data)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const refreshStatus = async () => {
    await fetchSystemStatus()
  }

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      await api.put(`/api/admin/users/${userId}/status`, { isActive })
      await fetchAdminData()
    } catch (error) {
      console.error('Failed to update user status:', error)
      alert('Failed to update user status')
    }
  }

  const handleUserRoleChange = async (userId, role) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role })
      await fetchAdminData()
    } catch (error) {
      console.error('Failed to update user role:', error)
      alert('Failed to update user role')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      await api.delete(`/api/admin/users/${userId}`)
      await fetchAdminData()
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  const handleCreateUser = async (userData) => {
    try {
      await api.post('/api/admin/users', userData)
      setShowAddUser(false)
      await fetchAdminData()
    } catch (error) {
      console.error('Failed to create user:', error)
      alert(error.response?.data?.message || 'Failed to create user')
    }
  }

  const handleUpdateSettings = async (newSettings) => {
    try {
      await api.put('/api/admin/settings', newSettings)
      setSettings(newSettings)
    } catch (error) {
      console.error('Failed to update settings:', error)
      alert('Failed to update settings')
    }
  }

  const fetchEmailSettings = async () => {
    try {
      const res = await api.get('/api/admin/email-settings')
      setEmailSettings(res.data)
    } catch (error) {
      console.error('Failed to fetch email settings:', error)
    }
  }

  const handleUpdateEmailSettings = async (newEmailSettings) => {
    try {
      await api.put('/api/admin/email-settings', newEmailSettings)
      setEmailSettings({...emailSettings, ...newEmailSettings, isConfigured: true})
      alert('Email settings updated successfully')
    } catch (error) {
      console.error('Failed to update email settings:', error)
      alert('Failed to update email settings')
    }
  }

  const handleSendTestEmail = async (toEmail) => {
    try {
      await api.post('/api/admin/send-test-email', { toEmail })
      alert('Test email sent successfully!')
    } catch (error) {
      console.error('Failed to send test email:', error)
      alert('Failed to send test email: ' + (error.response?.data?.message || error.message))
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-12 h-12 text-pink-400 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">Admin Panel</h2>
            <p className="text-white/80 text-lg">Manage system, users, and monitor performance</p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'system', label: 'System Status', icon: Server },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                : 'glass text-white/70 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdminStatCard 
              title="Total Users" 
              value={stats.totalUsers} 
              icon={Users}
              trend="+12%"
              trendUp={true}
            />
            <AdminStatCard 
              title="Active Users" 
              value={stats.activeUsers} 
              icon={Activity}
              trend="+5%"
              trendUp={true}
            />
            <AdminStatCard 
              title="Total Analyses" 
              value={stats.totalAnalyses} 
              icon={BarChart3}
            />
            <AdminStatCard 
              title="New Users Today" 
              value={stats.newUsersToday} 
              icon={Database}
            />
          </div>

          <div className="glass rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">System backup completed</p>
                  <p className="text-white/50 text-sm">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">New user registered: john@example.com</p>
                  <p className="text-white/50 text-sm">3 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Security scan completed - no issues found</p>
                  <p className="text-white/50 text-sm">5 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">User Management</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-5 h-5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button 
                onClick={() => setShowAddUser(true)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                + Add User
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <UserRow 
                  key={user.id} 
                  user={user} 
                  currentUser={currentUser}
                  onStatusChange={handleUserStatusChange}
                  onRoleChange={handleUserRoleChange}
                  onDelete={handleDeleteUser}
                />
              ))
            ) : (
              <div className="text-center py-12 text-white/50">
                {searchQuery ? 'No users match your search' : 'No users found'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <AddUserModal 
          onClose={() => setShowAddUser(false)} 
          onCreate={handleCreateUser} 
        />
      )}

      {/* System Status Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">System Status</h3>
            <button 
              onClick={refreshStatus}
              className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-white/70 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusCard 
              title=".NET Core API" 
              status={systemStatus.dotnetApi.status}
              icon={Server}
              lastChecked={systemStatus.dotnetApi.lastChecked}
            />
            <StatusCard 
              title="FastAPI AI Service" 
              status={systemStatus.fastApi.status}
              icon={Activity}
              lastChecked={systemStatus.fastApi.lastChecked}
            />
            <StatusCard 
              title="SQL Server Database" 
              status={systemStatus.sqlServer.status}
              icon={Database}
              lastChecked={systemStatus.sqlServer.lastChecked}
            />
            <StatusCard 
              title="AI Model Service" 
              status={systemStatus.aiService.status}
              icon={Shield}
              lastChecked={systemStatus.aiService.lastChecked}
            />
          </div>

          <div className="glass rounded-3xl p-8">
            <h4 className="text-xl font-bold text-white mb-4">System Metrics</h4>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-1">98.5%</p>
                <p className="text-white/60 text-sm">API Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-1">245ms</p>
                <p className="text-white/60 text-sm">Avg Response Time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white mb-1">12</p>
                <p className="text-white/60 text-sm">Active Connections</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="glass rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Admin Settings</h3>
          
          <div className="space-y-6">
            <div className="p-6 bg-white/5 rounded-2xl">
              <h4 className="text-lg font-semibold text-white mb-4">General Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Maintenance Mode</p>
                    <p className="text-white/50 text-sm">Temporarily disable user access</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.maintenanceMode ? 'bg-green-500' : 'bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.maintenanceMode ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-white/50 text-sm">Send alerts for system events</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({...settings, emailNotificationsEnabled: !settings.emailNotificationsEnabled})}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.emailNotificationsEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.emailNotificationsEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl">
              <h4 className="text-lg font-semibold text-white mb-4">Security</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-white/50 text-sm">Require 2FA for all admin accounts</p>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({...settings, requireTwoFactorForAdmin: !settings.requireTwoFactorForAdmin})}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.requireTwoFactorForAdmin ? 'bg-green-500' : 'bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${settings.requireTwoFactorForAdmin ? 'right-0.5' : 'left-0.5'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Max Login Attempts</p>
                    <p className="text-white/50 text-sm">Lock accounts after failed attempts</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleUpdateSettings({...settings, maxLoginAttempts: parseInt(e.target.value) || 5})}
                    className="w-16 px-2 py-1 bg-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl">
              <h4 className="text-lg font-semibold text-white mb-4">Default Quotas</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Free Tier Quota</p>
                    <p className="text-white/50 text-sm">Monthly analyses for free users</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.defaultFreeQuota}
                    onChange={(e) => handleUpdateSettings({...settings, defaultFreeQuota: parseInt(e.target.value) || 10})}
                    className="w-20 px-2 py-1 bg-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Pro Tier Quota</p>
                    <p className="text-white/50 text-sm">Monthly analyses for pro users</p>
                  </div>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={settings.defaultProQuota}
                    onChange={(e) => handleUpdateSettings({...settings, defaultProQuota: parseInt(e.target.value) || 100})}
                    className="w-20 px-2 py-1 bg-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Enterprise Quota</p>
                    <p className="text-white/50 text-sm">Monthly analyses for enterprise</p>
                  </div>
                  <input
                    type="number"
                    min="100"
                    max="1000"
                    value={settings.defaultEnterpriseQuota}
                    onChange={(e) => handleUpdateSettings({...settings, defaultEnterpriseQuota: parseInt(e.target.value) || 500})}
                    className="w-20 px-2 py-1 bg-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className="p-6 bg-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Email Configuration</h4>
                <div className="flex items-center gap-2">
                  {emailSettings.isConfigured ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Configured</span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">Not Configured</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-sm">SMTP Host</label>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/70 text-sm">SMTP Port</label>
                    <input
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value) || 587})}
                      className="w-full px-3 py-2 bg-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm">From Name</label>
                    <input
                      type="text"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                      className="w-full px-3 py-2 bg-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/70 text-sm">SMTP User (Email)</label>
                  <input
                    type="email"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm">SMTP Password / App Password</label>
                  <input
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-white/40 text-xs mt-1">For Gmail, use an App Password from Google Account settings</p>
                </div>
                <div>
                  <label className="text-white/70 text-sm">Admin Notification Email</label>
                  <input
                    type="email"
                    value={emailSettings.adminEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, adminEmail: e.target.value})}
                    placeholder="admin@yourdomain.com"
                    className="w-full px-3 py-2 bg-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleUpdateEmailSettings(emailSettings)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    Save Email Settings
                  </button>
                  <button
                    onClick={() => {
                      const testEmail = prompt('Enter email address to send test to:', emailSettings.adminEmail || currentUser?.email)
                      if (testEmail) handleSendTestEmail(testEmail)
                    }}
                    disabled={!emailSettings.isConfigured}
                    className="px-4 py-2 glass rounded-xl text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
              <h4 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Clear All Data</p>
                  <p className="text-white/50 text-sm">Permanently delete all user data and analyses</p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm('WARNING: This will permanently delete ALL user data and analyses. This action cannot be undone. Are you sure?')) {
                      alert('Bulk delete functionality would be implemented here')
                    }
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
