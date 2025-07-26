'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { NotificationPermissionRequest } from '@/components/NotificationPermissionRequest';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, Settings, Shield, Clock, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { isEnabled, permission, isSupported } = usePushNotifications();
  const [showNotificationRequest, setShowNotificationRequest] = useState(false);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your notification preferences and app settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications about reminders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Push Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive system notifications when the app is in the background
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSupported ? (
                    <>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        isEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : permission === 'denied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isEnabled ? 'Enabled' : permission === 'denied' ? 'Denied' : 'Not Set'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNotificationRequest(true)}
                      >
                        {isEnabled ? 'Manage' : 'Enable'}
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not Supported</span>
                  )}
                </div>
              </div>

              {showNotificationRequest && (
                <div className="mt-4">
                  <NotificationPermissionRequest
                    onPermissionGranted={() => setShowNotificationRequest(false)}
                    onPermissionDenied={() => setShowNotificationRequest(false)}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* In-App Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show toast notifications when the app is active
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            {/* Notification Types */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Notification Types</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <Label className="font-medium">Overdue Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        When a reminder is past its due date
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <div>
                      <Label className="font-medium">Due Soon Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        When a reminder is due within 1 hour
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Manage your data and privacy settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Data Storage</Label>
                <p className="text-sm text-muted-foreground">
                  All data is stored locally on your device
                </p>
              </div>
              <span className="text-sm text-green-600 font-medium">Local Only</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve the app with anonymous usage data
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About JobFinder</CardTitle>
            <CardDescription>
              Your personal job search assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Build</span>
              <span className="text-sm font-medium">2024.1.0</span>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">
              JobFinder helps you stay organized during your job search by managing contacts, 
              tracking interactions, and ensuring you never miss important follow-ups.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 