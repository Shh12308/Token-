// src/components/AdminDashboard.jsx
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Home,
  Wallet,
  Activity,
  Settings,
  Users,
  TrendingUp,
  AlertCircle,
  Search,
  Bell,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

// --- Mock Data ---
const transactionVolumeData = [
  { name: 'Jan', volume: 4000, gas: 240 },
  { name: 'Feb', volume: 3000, gas: 139 },
  { name: 'Mar', volume: 5000, gas: 380 },
  { name: 'Apr', volume: 4780, gas: 390 },
  { name: 'May', volume: 5890, gas: 480 },
  { name: 'Jun', volume: 6390, gas: 380 },
  { name: 'Jul', volume: 7490, gas: 430 },
];

const networkActivityData = [
  { name: 'Mon', transactions: 4000, failed: 240 },
  { name: 'Tue', transactions: 3000, failed: 139 },
  { name: 'Wed', transactions: 5000, failed: 980 },
  { name: 'Thu', transactions: 2780, failed: 390 },
  { name: 'Fri', transactions: 6890, failed: 480 },
  { name: 'Sat', transactions: 4390, failed: 380 },
  { name: 'Sun', transactions: 3490, failed: 430 },
];

const recentTransactions = [
  { id: '0x1a2b...3c4d', user: 'alice.eth', amount: '1.25 ETH', status: 'Success', time: '2 mins ago' },
  { id: '0x5e6f...7g8h', user: 'bob.eth', amount: '0.50 ETH', status: 'Pending', time: '5 mins ago' },
  { id: '0x9i0j...1k2l', user: 'charlie.eth', amount: '10.00 ETH', status: 'Success', time: '12 mins ago' },
  { id: '0x3m4n...5o6p', user: 'dave.eth', amount: '0.05 ETH', status: 'Failed', time: '1 hour ago' },
  { id: '0x7q8r...9s0t', user: 'eve.eth', amount: '3.75 ETH', status: 'Success', time: '2 hours ago' },
];

const topAssets = [
  { asset: 'Ethereum', symbol: 'ETH', holders: '1.2M', value: '$2,500' },
  { asset: 'USD Coin', symbol: 'USDC', holders: '980K', value: '$1.00' },
  { asset: 'Wrapped Bitcoin', symbol: 'WBTC', holders: '450K', value: '$65,000' },
  { asset: 'Chainlink', symbol: 'LINK', holders: '600K', value: '$18.50' },
];

const kpiData = [
  { title: 'Total Users', value: '1,234,567', change: '+12.5%', icon: Users, trend: 'up' },
  { title: 'Transaction Vol. (24h)', value: '$45.6M', change: '+5.2%', icon: TrendingUp, trend: 'up' },
  { title: 'Active Wallets', value: '89,012', change: '-2.4%', icon: Wallet, trend: 'down' },
  { title: 'System Alerts', value: '3', change: '1 new', icon: AlertCircle, trend: 'up' },
];


// --- Main Component ---
const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">MetaPanel</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={24} /></button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${activeNav === item.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu size={24} /></button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-lg hover:bg-gray-700">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">{kpi.title}</p>
                  <kpi.icon className="text-gray-500" size={20} />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className={`flex items-center text-sm mt-2 ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {kpi.trend === 'up' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {kpi.change}
                </p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Transaction Volume & Gas Fees</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={transactionVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Line type="monotone" dataKey="volume" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="gas" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Network Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={networkActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Bar dataKey="transactions" fill="#8B5CF6" />
                  <Bar dataKey="failed" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Hash</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3 font-mono">{tx.id}</td>
                        <td className="py-3">{tx.user}</td>
                        <td className="py-3">{tx.amount}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${tx.status === 'Success' ? 'bg-green-900/50 text-green-400' : tx.status === 'Pending' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Top Assets</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Asset</th>
                      <th className="pb-3">Holders</th>
                      <th className="pb-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAssets.map(asset => (
                      <tr key={asset.symbol} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                            <span>{asset.asset}</span>
                          </div>
                        </td>
                        <td className="py-3">{asset.holders}</td>
                        <td className="py-3">{asset.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
