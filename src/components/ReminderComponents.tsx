import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Clock, X, CheckCircle2, Settings, TestTube } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UseRemindersReturn } from '@/hooks/useReminders';

interface ReminderBannerProps {
  onDismiss: () => void;
  onStartExercise: () => void;
}

export const ReminderBanner = ({ onDismiss, onStartExercise }: ReminderBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-r from-primary/20 to-amber-500/20 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">
                Time for your daily exercise! 🧘
              </h4>
              <p className="text-sm text-muted-foreground">
                Take a few minutes to ground yourself. Even a 3-minute breathing exercise can make a difference.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onStartExercise}>
                  Start Now
                </Button>
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Maybe Later
                </Button>
              </div>
            </div>
            <button 
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface CompletedTodayBannerProps {
  completionCount: number;
}

export const CompletedTodayBanner = ({ completionCount }: CompletedTodayBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">
                Great job today! 🎉
              </h4>
              <p className="text-sm text-muted-foreground">
                You've completed {completionCount} {completionCount === 1 ? 'exercise' : 'exercises'} today. Keep up the great work!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface ReminderSettingsDialogProps {
  reminders: UseRemindersReturn;
}

export const ReminderSettingsDialog = ({ reminders }: ReminderSettingsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    const permission = await reminders.requestNotificationPermission();
    if (permission === 'granted') {
      toast({
        title: 'Notifications enabled!',
        description: 'You\'ll receive reminders at your scheduled time.',
      });
    } else if (permission === 'denied') {
      toast({
        title: 'Notifications blocked',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleTestNotification = () => {
    if (reminders.settings.notificationsPermission === 'granted') {
      reminders.sendTestNotification();
      toast({
        title: 'Test notification sent!',
        description: 'Check your notifications.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          Reminders
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Daily Reminders
          </DialogTitle>
          <DialogDescription>
            Set up daily reminders to help you stay consistent with your exercises.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder-toggle" className="text-base">
                Enable Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to exercise daily
              </p>
            </div>
            <Switch
              id="reminder-toggle"
              checked={reminders.settings.enabled}
              onCheckedChange={(checked) => reminders.updateSettings({ enabled: checked })}
            />
          </div>

          {/* Reminder Time */}
          <div className="space-y-2">
            <Label htmlFor="reminder-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reminder Time
            </Label>
            <Input
              id="reminder-time"
              type="time"
              value={reminders.settings.time}
              onChange={(e) => reminders.updateSettings({ time: e.target.value })}
              disabled={!reminders.settings.enabled}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              You'll be reminded at this time if you haven't completed an exercise yet.
            </p>
          </div>

          {/* Browser Notifications */}
          <div className="space-y-3 pt-2 border-t border-border">
            <Label className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Browser Notifications
            </Label>

            {reminders.settings.notificationsPermission === 'granted' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Notifications are enabled
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleTestNotification}
                  disabled={!reminders.settings.enabled}
                  className="gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  Send Test Notification
                </Button>
              </div>
            ) : reminders.settings.notificationsPermission === 'denied' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <BellOff className="h-4 w-4" />
                  Notifications are blocked
                </div>
                <p className="text-xs text-muted-foreground">
                  Please enable notifications in your browser settings to receive reminders.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Enable browser notifications to get reminded even when you're not on this page.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEnableNotifications}
                  disabled={!reminders.settings.enabled}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Enable Notifications
                </Button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="p-3 rounded-lg bg-secondary/50 text-sm">
            <p className="font-medium mb-1">💡 Tip</p>
            <p className="text-muted-foreground">
              Consistency is key! Setting a reminder for the same time each day helps build a lasting habit.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
