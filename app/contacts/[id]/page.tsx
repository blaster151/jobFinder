'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useContactStore } from '@/stores/contactStore';
import { useScrollPositionPersistence } from '@/hooks/useScrollPositionPersistence';
import { Contact, Interaction } from '@/lib/schemas';
import { ArrowLeft, Mail, Phone, MapPin, Building, Calendar, Tag, Edit, Trash2, Clock, User, Briefcase } from 'lucide-react';
import { ContactForm } from '@/components/ContactForm';
import InteractionSection from '@/components/InteractionSection';
import { QuickActions } from '@/components/QuickActions';
import { AddReminderModal } from '@/components/AddReminderModal';
import { SmartContactSummary } from '@/components/SmartContactSummary';
import { format, formatDistanceToNow } from 'date-fns';

export default function ContactProfilePage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  
  const { contacts, interactions, isLoading } = useContactStore();
  const { saveScroll } = useScrollPositionPersistence({
    pageId: `contact-${contactId}`,
    enableScrollPersistence: true,
    enableFilterPersistence: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [isLogInteractionOpen, setIsLogInteractionOpen] = useState(false);

  // Find the current contact
  const contact = contacts.find(c => c.id === contactId);
  const contactInteractions = interactions.filter(i => i.contactId === contactId);

  // Save scroll position before navigation
  const handleBackNavigation = () => {
    saveScroll(window.scrollY);
    router.back();
  };

  // Get last contacted date
  const getLastContacted = () => {
    if (contactInteractions.length === 0) return null;
    
    const sortedInteractions = [...contactInteractions].sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
    
    return sortedInteractions[0].createdAt;
  };

  const lastContacted = getLastContacted();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading contact...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Contact Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The contact you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }



  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button
          onClick={handleBackNavigation}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contacts
        </Button>
      </div>

      {/* Enhanced Header Section */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            {/* Contact Avatar and Basic Info */}
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Contact Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold truncate">{contact.name}</h1>
                  {contact.flagged && (
                    <Badge variant="destructive" className="text-xs">
                      Flagged
                    </Badge>
                  )}
                </div>

                {/* Title and Company */}
                <div className="flex items-center gap-4 mb-3 text-muted-foreground">
                  {contact.role && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">{contact.role}</span>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span className="text-sm font-medium">{contact.company}</span>
                    </div>
                  )}
                </div>

                {/* Contact Methods */}
                <div className="flex items-center gap-4 mb-3">
                  {contact.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{contact.phone}</span>
                    </div>
                  )}
                </div>

                {/* Last Contacted */}
                {lastContacted && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <Clock className="w-4 h-4" />
                    <span>Last contacted {formatDistanceToNow(new Date(lastContacted), { addSuffix: true })}</span>
                  </div>
                )}

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => setIsDeleting(true)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Smart Contact Summary */}
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <SmartContactSummary 
            interactions={interactions}
            contactId={contactId}
            contactName={contact.name}
          />
        </CardContent>
      </Card>

      {/* Quick Actions Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <QuickActions
            contactId={contactId}
            contactName={contact.name}
            onAddReminder={() => setIsAddReminderOpen(true)}
            onLogInteraction={() => setIsLogInteractionOpen(true)}
            onEditContact={() => setIsEditing(true)}
          />
        </CardContent>
      </Card>

      {/* Contact Information Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Contact Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{contact.email}</span>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{contact.phone}</span>
                </div>
              )}
              
              {contact.company && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{contact.company}</span>
                </div>
              )}
              
              {contact.role && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{contact.role}</span>
                </div>
              )}
            </div>

            {contact.linkedin && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <a 
                  href={contact.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View LinkedIn Profile
                </a>
              </div>
            )}

            {contact.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Created {format(new Date(contact.createdAt!), 'MMM d, yyyy')}</span>
              {contact.updatedAt && contact.updatedAt !== contact.createdAt && (
                <>
                  <span>•</span>
                  <span>Updated {format(new Date(contact.updatedAt), 'MMM d, yyyy')}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Overview</CardTitle>
            <CardDescription>Key metrics and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Contact Status</span>
                <Badge variant={contact.flagged ? "destructive" : "secondary"}>
                  {contact.flagged ? "Flagged" : "Active"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Contact Status</span>
                <Badge variant={contact.flagged ? "destructive" : "secondary"}>
                  {contact.flagged ? "Flagged" : "Active"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total Interactions</span>
                <Badge variant="outline">
                  {contactInteractions.length}
                </Badge>
              </div>
            </div>

            {contact.flagged && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">
                    Flagged Contact
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  This contact has been flagged for special attention.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interactions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Interactions</CardTitle>
          <CardDescription>
            All interactions and follow-ups with {contact.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InteractionSection contactId={contactId} />
        </CardContent>
      </Card>

      {/* Edit Contact Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Contact</h2>
              <ContactForm
                contactToEdit={contact}
                onSubmit={() => setIsEditing(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Delete Contact</h2>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete "{contact.name}"? This action cannot be undone and will also delete all associated interactions.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleting(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    // TODO: Implement contact deletion
                    setIsDeleting(false);
                    router.push('/');
                  }}
                >
                  Delete Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      <AddReminderModal
        contactId={contactId}
        contactName={contact.name}
        isOpen={isAddReminderOpen}
        onClose={() => setIsAddReminderOpen(false)}
      />

      {/* Log Interaction Modal - This will be handled by the InteractionSection component */}
      {isLogInteractionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Log Interaction</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Add a new interaction with {contact.name}
              </p>
              <InteractionSection contactId={contactId} />
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setIsLogInteractionOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 