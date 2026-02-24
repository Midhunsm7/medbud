'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { format } from 'date-fns';
import { Eye, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user: {
    email: string;
    full_name: string;
  };
}

export default function UserActivityTable() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchActivities();
    
    const subscription = supabase
      .channel('activity-logs')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'user_activity_logs' }, 
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [sortColumn, sortDirection]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          *,
          user:users(email, full_name)
        `)
        .order(sortColumn, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const filteredActivities = activities.filter(activity =>
    activity.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.activity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'reminder_created': return 'bg-blue-100 text-blue-800';
      case 'notification_sent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-4">
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Activity Types</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="reminder_created">Reminder Created</option>
            <option value="notification_sent">Notification Sent</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                { key: 'user', label: 'User' },
                { key: 'activity_type', label: 'Activity' },
                { key: 'ip_address', label: 'IP Address' },
                { key: 'user_agent', label: 'Device/Browser' },
                { key: 'created_at', label: 'Time' }
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {sortColumn === key && (
                      sortDirection === 'asc' ? 
                      <ChevronUp className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredActivities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">
                      {activity.user?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.user?.email || 'No email'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(activity.activity_type)}`}>
                    {activity.activity_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.ip_address || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 truncate max-w-xs">
                    {activity.user_agent || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(activity.created_at), 'PPpp')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredActivities.length)}</span> of{' '}
          <span className="font-medium">{filteredActivities.length}</span> results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage * itemsPerPage >= filteredActivities.length}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}