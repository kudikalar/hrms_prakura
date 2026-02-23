import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  CalendarCheck,
  Gift,
  Sun,
  Snowflake,
  Heart,
  Star,
  PartyPopper
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const EmployeeHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i + 1;
    return { value: year.toString(), label: year.toString() };
  });

  const holidayIcons = [Gift, Sun, Star, Heart, PartyPopper, Snowflake];

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/employee/holidays?year=${selectedYear}`,
        getAuthHeaders()
      );
      setHolidays(response.data);
    } catch (error) {
      toast.error('Failed to fetch holidays');
    }
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
      full: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };
  };

  const isPast = (dateStr) => new Date(dateStr) < new Date();
  const isUpcoming = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  };

  const upcomingHolidays = holidays.filter(h => !isPast(h.date));
  const pastHolidays = holidays.filter(h => isPast(h.date));

  const getRandomIcon = (index) => {
    const Icon = holidayIcons[index % holidayIcons.length];
    return Icon;
  };

  const getRandomColor = (index) => {
    const colors = [
      { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
      { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
      { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
      { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6" data-testid="employee-holidays-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <CalendarCheck className="h-7 w-7 mr-3" />
              Company Holidays
            </h1>
            <p className="text-orange-100 mt-1">
              {holidays.length} holidays in {selectedYear}
            </p>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px] bg-white/20 border-white/30 text-white" data-testid="year-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <>
          {/* Upcoming Holidays */}
          {upcomingHolidays.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PartyPopper className="h-5 w-5 mr-2 text-orange-500" />
                Upcoming Holidays
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingHolidays.map((holiday, index) => {
                  const date = formatDate(holiday.date);
                  const Icon = getRandomIcon(index);
                  const color = getRandomColor(index);
                  const upcoming = isUpcoming(holiday.date);

                  return (
                    <div
                      key={holiday.id}
                      className={`bg-white rounded-xl p-5 shadow-sm border ${color.border} hover:shadow-md transition-all hover:-translate-y-1`}
                      data-testid={`holiday-card-${holiday.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-16 h-16 ${color.bg} rounded-xl flex flex-col items-center justify-center`}>
                          <span className={`text-xs font-medium ${color.text}`}>{date.month}</span>
                          <span className={`text-2xl font-bold ${color.text}`}>{date.day}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{holiday.name}</h3>
                            {upcoming && (
                              <Badge className="bg-green-100 text-green-700 text-xs">Soon</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{date.weekday}</p>
                          {holiday.description && (
                            <p className="text-sm text-gray-600 mt-2">{holiday.description}</p>
                          )}
                        </div>
                        <Icon className={`h-5 w-5 ${color.text}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Holidays */}
          {pastHolidays.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">Past Holidays</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {pastHolidays.map((holiday, index) => {
                  const date = formatDate(holiday.date);
                  return (
                    <div
                      key={holiday.id}
                      className="p-4 flex items-center gap-4 opacity-60"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-500">{date.month}</span>
                        <span className="text-lg font-bold text-gray-600">{date.day}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-700">{holiday.name}</h3>
                        <p className="text-sm text-gray-400">{date.weekday}</p>
                      </div>
                      <Badge className="bg-gray-100 text-gray-500">Past</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {holidays.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <CalendarCheck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Holidays Found</h3>
              <p className="text-gray-500 mt-1">There are no holidays configured for {selectedYear}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeHolidays;
