import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Upload, Trash2, Search, ChevronDown, ChevronRight, Download, Flame } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import LeadQualityBadge from '@/components/shared/LeadQualityBadge';
import { motion, AnimatePresence } from 'framer-motion';

export default function Contacts() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [expandedList, setExpandedList] = useState(null);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [listForm, setListForm] = useState({ name: '', description: '' });
  const [contactForm, setContactForm] = useState({ email: '', name: '', company: '', phone: '', website: '', status: 'active', list_id: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importListId, setImportListId] = useState('');



  const { data: lists = [] } = useQuery({
    queryKey: ['contact-lists', currentUser?.email],
    queryFn: () => api.lists.list(),
    enabled: !!currentUser,
  });

  const { data: allContacts = [] } = useQuery({
    queryKey: ['contacts', currentUser?.email],
    queryFn: () => api.contacts.list(),
    enabled: !!currentUser,
  });

  const createListMutation = useMutation({
    mutationFn: (data) => api.lists.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact-lists'] }); setShowListDialog(false); setListForm({ name: '', description: '' }); },
  });

  const deleteListMutation = useMutation({
    mutationFn: (id) => api.lists.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact-lists'] }); queryClient.invalidateQueries({ queryKey: ['contacts'] }); },
  });

  const createContactMutation = useMutation({
    mutationFn: (data) => api.contacts.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); queryClient.invalidateQueries({ queryKey: ['contact-lists'] }); setShowContactDialog(false); setContactForm({ email: '', name: '', company: '', phone: '', website: '', status: 'active', list_id: '' }); },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id) => api.contacts.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); queryClient.invalidateQueries({ queryKey: ['contact-lists'] }); },
  });

  const handleImportCsv = async () => {
    if (!csvFile || !importListId) return;
    setImporting(true);
    
    try {
      await api.contacts.bulkCreate(importListId, csvFile);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    } catch (e) {
      console.error(e);
    }

    setImporting(false);
    setShowImportDialog(false);
    setCsvFile(null);
  };

  const exportListCsv = (list) => {
    const contacts = allContacts.filter(c => c.list_id === list.id);
    const headers = ['email', 'name', 'company', 'phone', 'website', 'status'];
    const rows = contacts.map(c => headers.map(h => `"${(c[h] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.name.replace(/\s+/g, '_')}_contacts.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredContacts = (listId) =>
    allContacts.filter(c => c.list_id === listId && (
      !searchQuery ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchQuery.toLowerCase())
    ));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">{lists.length} lists · {allContacts.length} total contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <Button variant="outline" onClick={() => setShowContactDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Contact
          </Button>
          <Button onClick={() => setShowListDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> New List
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {/* Lists */}
      {lists.length === 0 ? (
        <EmptyState icon={Users} title="No contact lists yet" description="Create a list to organize your contacts." action={<Button onClick={() => setShowListDialog(true)}><Plus className="w-4 h-4 mr-2" />New List</Button>} />
      ) : (
        <div className="space-y-3">
          {lists.map(list => {
            const contacts = filteredContacts(list.id);
            const isOpen = expandedList === list.id;
            return (
              <div key={list.id} className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-secondary/40 transition-colors" onClick={() => setExpandedList(isOpen ? null : list.id)}>
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <p className="font-semibold text-foreground">{list.name}</p>
                      {list.description && <p className="text-xs text-muted-foreground">{list.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{contacts.length} contacts</span>
                    <Button variant="ghost" size="icon" title="Export CSV" onClick={e => { e.stopPropagation(); exportListCsv(list); }}>
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteListMutation.mutate(list.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="border-t border-border">
                        {contacts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">No contacts in this list.</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="bg-secondary/30">
                              <tr>
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Email</th>
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Company</th>
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Lead Quality</th>
                                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {contacts.map(contact => (
                                <tr key={contact.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                                  <td className="px-4 py-2 text-foreground">{contact.email}</td>
                                  <td className="px-4 py-2 text-muted-foreground">{contact.name || '—'}</td>
                                  <td className="px-4 py-2 text-muted-foreground">{contact.company || '—'}</td>
                                  <td className="px-4 py-2"><LeadQualityBadge score={contact.lead_score || 0} showScore /></td>
                                  <td className="px-4 py-2"><StatusBadge status={contact.status} /></td>
                                  <td className="px-4 py-2 text-right">
                                    <Button variant="ghost" size="icon" onClick={() => deleteContactMutation.mutate(contact.id)}>
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* New List Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Contact List</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>List Name</Label>
              <Input placeholder="e.g. SaaS Founders" value={listForm.name} onChange={e => setListForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input placeholder="Short description" value={listForm.description} onChange={e => setListForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowListDialog(false)}>Cancel</Button>
            <Button onClick={() => createListMutation.mutate(listForm)} disabled={!listForm.name}>Create List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>List</Label>
              <Select value={contactForm.list_id} onValueChange={v => setContactForm(f => ({ ...f, list_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select a list" /></SelectTrigger>
                <SelectContent>{lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input placeholder="contact@example.com" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="Full name" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input placeholder="Company" value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="Phone" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input placeholder="https://..." value={contactForm.website} onChange={e => setContactForm(f => ({ ...f, website: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
            <Button onClick={() => createContactMutation.mutate(contactForm)} disabled={!contactForm.email || !contactForm.list_id}>Add Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import Contacts from CSV</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-secondary/40 border border-border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Required CSV format:</p>
              <p>Columns (any order): <code className="bg-secondary px-1 rounded">email</code>, <code className="bg-secondary px-1 rounded">name</code>, <code className="bg-secondary px-1 rounded">company</code>, <code className="bg-secondary px-1 rounded">phone</code>, <code className="bg-secondary px-1 rounded">website</code></p>
              <p>Only <code className="bg-secondary px-1 rounded">email</code> is required. Variables: <code className="bg-secondary px-1 rounded">{'{{name}}'}</code> <code className="bg-secondary px-1 rounded">{'{{company}}'}</code> <code className="bg-secondary px-1 rounded">{'{{phone}}'}</code> <code className="bg-secondary px-1 rounded">{'{{website}}'}</code></p>
            </div>
            <div className="space-y-1.5">
              <Label>Select List</Label>
              <Select value={importListId} onValueChange={setImportListId}>
                <SelectTrigger><SelectValue placeholder="Choose a list" /></SelectTrigger>
                <SelectContent>{lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CSV File</Label>
              <Input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onClick={handleImportCsv} disabled={!csvFile || !importListId || importing}>
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}