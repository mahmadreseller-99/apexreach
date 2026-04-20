import React, { useState, useEffect } from 'react';
import { auth } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await auth.updateMe({ full_name: name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h3 className="font-heading text-lg font-semibold text-foreground">Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user?.email || 'Loading...'}</p>
            <p className="text-xs text-muted-foreground">Member since {user?.created_date ? new Date(user.created_date).toLocaleDateString() : '—'}</p>
          </div>
        </div>
        <div>
          <Label>Full Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 bg-background border-border" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={user?.email || ''} disabled className="mt-1 bg-secondary border-border text-muted-foreground" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {saved ? <><Check className="w-4 h-4 mr-2" /> Saved</> : saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Plan */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground">Plan & Billing</h3>
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-foreground">Pro Plan</p>
            <p className="text-xs text-muted-foreground">$59/month • 10,000 emails/month</p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-3 py-1">Active</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground">Notification Preferences</h3>
        <div className="space-y-3">
          {['Campaign completed', 'New replies received', 'SMTP errors', 'Weekly report'].map((pref, i) => (
            <label key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer">
              <span className="text-sm text-foreground">{pref}</span>
              <input type="checkbox" defaultChecked className="rounded border-border" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}