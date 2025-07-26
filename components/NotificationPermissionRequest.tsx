'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';

interface NotificationPermissionRequestProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export function NotificationPermissionRequest({ 
  onPermissionGranted, 
  onPermissionDenied 
}: NotificationPermissionRequestProps) {
  const { permission, isSupported, isEnabled, requestPermission } = usePushNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        onPermissionGranted?.();
      } else {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show if notifications are not supported
  if (!isSupported) {
    return null;
  }

  // Don't show if permission is already granted
  if (isEnabled) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-lg">Notifications Enabled</CardTitle>
          <CardDescription>
            You'll receive push notifications for important reminders when the app is in the background.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Don't show if permission is denied (user explicitly denied)
  if (permission === 'denied') {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-lg text-red-800">Notifications Disabled</CardTitle>
          <CardDescription className="text-red-700">
            To receive reminder notifications, please enable notifications in your browser settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-red-600 mb-4">
            You can change this in your browser's site settings.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="text-red-700 border-red-300 hover:bg-red-100"
          >
            Refresh After Enabling
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show permission request
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Bell className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-lg">Enable Notifications</CardTitle>
        <CardDescription>
          Get notified about important reminders even when the app is in the background.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-sm text-gray-600 space-y-2">
          <p>• Overdue reminders</p>
          <p>• Reminders due within 1 hour</p>
          <p>• Click to open the app</p>
        </div>
        
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onPermissionDenied}
            disabled={isRequesting}
            className="flex items-center gap-2"
          >
            <BellOff className="w-4 h-4" />
            Not Now
          </Button>
        </div>
        
        <p className="text-xs text-gray-500">
          You can change this later in your browser settings.
        </p>
      </CardContent>
    </Card>
  );
} 