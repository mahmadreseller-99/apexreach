import React, { useState } from 'react';
import { Calendar, Clock, Globe, Zap, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC — Coordinated Universal Time', offset: '+0:00' },
  { value: 'America/New_York', label: 'Eastern Time (ET) — New York', offset: '-5:00 / -4:00' },
  { value: 'America/Chicago', label: 'Central Time (CT) — Chicago', offset: '-6:00 / -5:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT) — Denver', offset: '-7:00 / -6:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) — Los Angeles', offset: '-8:00 / -7:00' },
  { value: 'America/Anchorage', label: 'Alaska Time — Anchorage', offset: '-9:00' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time — Honolulu', offset: '-10:00' },
  { value: 'America/Sao_Paulo', label: 'Brazil Time — São Paulo', offset: '-3:00' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina — Buenos Aires', offset: '-3:00' },
  { value: 'Europe/London', label: 'GMT/BST — London', offset: '+0:00 / +1:00' },
  { value: 'Europe/Paris', label: 'Central European (CET) — Paris', offset: '+1:00 / +2:00' },
  { value: 'Europe/Berlin', label: 'Central European (CET) — Berlin', offset: '+1:00 / +2:00' },
  { value: 'Europe/Moscow', label: 'Moscow Time — Moscow', offset: '+3:00' },
  { value: 'Africa/Cairo', label: 'Egypt Time — Cairo', offset: '+2:00' },
  { value: 'Africa/Johannesburg', label: 'South Africa — Johannesburg', offset: '+2:00' },
  { value: 'Africa/Lagos', label: 'West Africa — Lagos', offset: '+1:00' },
  { value: 'Africa/Nairobi', label: 'East Africa — Nairobi', offset: '+3:00' },
  { value: 'Asia/Dubai', label: 'Gulf Time — Dubai', offset: '+4:00' },
  { value: 'Asia/Karachi', label: 'Pakistan — Karachi', offset: '+5:00' },
  { value: 'Asia/Kolkata', label: 'India Standard — Mumbai/Delhi', offset: '+5:30' },
  { value: 'Asia/Dhaka', label: 'Bangladesh — Dhaka', offset: '+6:00' },
  { value: 'Asia/Bangkok', label: 'Indochina — Bangkok', offset: '+7:00' },
  { value: 'Asia/Singapore', label: 'Singapore — Singapore', offset: '+8:00' },
  { value: 'Asia/Shanghai', label: 'China Standard — Shanghai', offset: '+8:00' },
  { value: 'Asia/Tokyo', label: 'Japan — Tokyo', offset: '+9:00' },
  { value: 'Asia/Seoul', label: 'Korea — Seoul', offset: '+9:00' },
  { value: 'Australia/Sydney', label: 'Australia Eastern — Sydney', offset: '+10:00 / +11:00' },
  { value: 'Australia/Perth', label: 'Australia Western — Perth', offset: '+8:00' },
  { value: 'Pacific/Auckland', label: 'New Zealand — Auckland', offset: '+12:00 / +13:00' },
];

const BEST_TIMES = [
  { label: 'Tuesday 10am — Best open rates', time: '10:00' },
  { label: 'Wednesday 2pm — High engagement', time: '14:00' },
  { label: 'Thursday 10am — Strong replies', time: '10:00' },
];

function getLocalNow(tz) {
  try {
    const now = new Date();
    const str = now.toLocaleString('en-CA', { timeZone: tz, hour12: false });
    // en-CA gives YYYY-MM-DD, HH:MM:SS
    const [datePart, timePart] = str.split(', ');
    const [hour, minute] = timePart.split(':');
    const minDate = datePart; // already YYYY-MM-DD
    return { minDate, defaultTime: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` };
  } catch {
    return { minDate: new Date().toISOString().slice(0, 10), defaultTime: '09:00' };
  }
}

export default function CampaignScheduler({ scheduledAt, timezone, onScheduledAtChange, onTimezoneChange }) {
  const [enabled, setEnabled] = useState(!!scheduledAt);

  const handleToggle = (val) => {
    setEnabled(val);
    if (!val) {
      onScheduledAtChange('');
    } else {
      // default to tomorrow 9am
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);
      onScheduledAtChange(`${dateStr}T09:00`);
    }
  };

  const selectedTz = timezone || 'UTC';
  const { minDate } = getLocalNow(selectedTz);

  // Parse scheduledAt into date and time parts
  const scheduledDate = scheduledAt ? scheduledAt.slice(0, 10) : '';
  const scheduledTime = scheduledAt ? scheduledAt.slice(11, 16) : '';

  const handleDateChange = (date) => {
    onScheduledAtChange(`${date}T${scheduledTime || '09:00'}`);
  };
  const handleTimeChange = (time) => {
    onScheduledAtChange(`${scheduledDate || minDate}T${time}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Schedule Campaign</Label>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <div className="space-y-4 pl-1">
          {/* Best time tips */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5" /> Recommended Send Times
            </p>
            <div className="flex flex-wrap gap-2">
              {BEST_TIMES.map(t => (
                <button
                  key={t.label}
                  onClick={() => handleTimeChange(t.time)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3.5 h-3.5" /> Time Zone
            </Label>
            <select
              value={selectedTz}
              onChange={e => onTimezoneChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date
              </Label>
              <input
                type="date"
                value={scheduledDate}
                min={minDate}
                onChange={e => handleDateChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5" /> Time
              </Label>
              <input
                type="time"
                value={scheduledTime}
                onChange={e => handleTimeChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {scheduledDate && scheduledTime && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
              <span>
                Scheduled for <strong className="text-foreground">{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {scheduledTime}</strong> in <strong className="text-foreground">{selectedTz}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}