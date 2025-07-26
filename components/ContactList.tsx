// components/ContactList.tsx
import React, { useState, useMemo } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Flag,
  Plus,
  Users
} from 'lucide-react';
import Link from 'next/link';

export const ContactList = () => {
  const contacts = useContactStore((s) => s.contacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Filter contacts based on search and filters
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search query filter
      const matchesSearch = searchQuery === '' || 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Flagged filter
      const matchesFlagged = !showFlaggedOnly || contact.flagged;

      // Company filter
      const matchesCompany = companyFilter === '' || 
        contact.company?.toLowerCase().includes(companyFilter.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === '' || 
        contact.role?.toLowerCase().includes(roleFilter.toLowerCase());

      return matchesSearch && matchesFlagged && matchesCompany && matchesRole;
    });
  }, [contacts, searchQuery, showFlaggedOnly, companyFilter, roleFilter]);

  // Get unique companies and roles for filter options
  const companies = useMemo(() => {
    const uniqueCompanies = Array.from(new Set(contacts.map(c => c.company).filter(Boolean)));
    return uniqueCompanies.sort();
  }, [contacts]);

  const roles = useMemo(() => {
    const uniqueRoles = Array.from(new Set(contacts.map(c => c.role).filter(Boolean)));
    return uniqueRoles.sort();
  }, [contacts]);

  const flaggedCount = contacts.filter(c => c.flagged).length;
  const totalCount = contacts.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>Contacts</CardTitle>
            <Badge variant="secondary">{filteredContacts.length} of {totalCount}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>
            <Link href="/contacts/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Contact
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search contacts by name, company, role, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center space-x-2">
              <Switch
                id="flagged-only"
                checked={showFlaggedOnly}
                onCheckedChange={setShowFlaggedOnly}
              />
              <Label htmlFor="flagged-only" className="text-sm">
                Show flagged contacts only
                {flaggedCount > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {flaggedCount}
                  </Badge>
                )}
              </Label>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="company-filter" className="text-sm font-medium">
                  Company
                </Label>
                <select
                  id="company-filter"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">All Companies</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="role-filter" className="text-sm font-medium">
                  Role
                </Label>
                <select
                  id="role-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(searchQuery || showFlaggedOnly || companyFilter || roleFilter) && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchQuery}"
              </Badge>
            )}
            {showFlaggedOnly && (
              <Badge variant="secondary" className="text-xs">
                Flagged only
              </Badge>
            )}
            {companyFilter && (
              <Badge variant="secondary" className="text-xs">
                Company: {companyFilter}
              </Badge>
            )}
            {roleFilter && (
              <Badge variant="secondary" className="text-xs">
                Role: {roleFilter}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setShowFlaggedOnly(false);
                setCompanyFilter('');
                setRoleFilter('');
              }}
              className="text-xs h-auto p-1"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-2">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {contacts.length === 0 ? (
                <div>
                  <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No contacts yet</p>
                  <p className="text-sm">Get started by adding your first contact</p>
                  <Link href="/contacts/new">
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contact
                    </Button>
                  </Link>
                </div>
              ) : (
                <div>
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No contacts found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <Link key={contact.id} href={`/contacts/${contact.id}`}>
                <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{contact.name}</h3>
                        {contact.flagged && (
                          <Flag className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {contact.role && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {contact.role}
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {contact.company}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {contact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>

                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 