"use client";

import React, { useState } from 'react';
import { useApp } from '@/store/AppContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Bell, Clock, Settings as SettingsIcon, Volume2, Smartphone, Mail, CalendarPlus, Monitor, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { isPomodoroSoundEnabled, setPomodoroSoundEnabled, playTimerFinishSound } from '@/lib/sound';
import { usePushNotifications, getPushStatus } from '@/hooks/usePushNotifications';

const REMINDER_OPTIONS = [
  { value: 4320, label: '3 ngày trước' },
  { value: 1440, label: '1 ngày trước' },
  { value: 60, label: '1 giờ trước' },
  { value: 0, label: 'Khi bắt đầu' },
];

interface NotifSettings {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  gcalEnabled: boolean;
  minutesBefore: number[];
}

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { status: pushStatus, enablePush, disablePush } = usePushNotifications();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notif, setNotif] = useState<NotifSettings>({
    inAppEnabled: true,
    pushEnabled: false,
    emailEnabled: false,
    gcalEnabled: false,
    minutesBefore: [1440, 60],
  });
  const [testing, setTesting] = useState(false);

  const loadSettings = React.useCallback(async () => {
    if (!state.user) return;
    try {
      const res = await fetch(`/api/notification-settings?userId=${state.user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotif({
          inAppEnabled: data.inAppEnabled,
          pushEnabled: data.pushEnabled,
          emailEnabled: data.emailEnabled,
          gcalEnabled: data.gcalEnabled,
          minutesBefore: Array.isArray(data.minutesBefore) ? data.minutesBefore : [1440, 60],
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [state.user]);

  React.useEffect(() => {
    setSoundEnabled(isPomodoroSoundEnabled());
    loadSettings();
  }, [loadSettings]);

  const saveSetting = async (patch: Partial<NotifSettings>) => {
    if (!state.user) return;
    const next = { ...notif, ...patch };
    setNotif(next);
    try {
      await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user.id, ...next }),
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Lỗi', description: 'Không lưu được cài đặt thông báo.', variant: 'destructive' });
    }
  };

  const handleToggleInApp = (val: boolean) => {
    saveSetting({ inAppEnabled: val });
    toast({
      title: val ? 'Đã bật In-app notification' : 'Đã tắt In-app notification',
      description: val ? 'Sẽ hiện chuông 🔔 và toast trên web.' : 'Không còn nhắc trong web.',
    });
  };

  const handleTogglePush = async (val: boolean) => {
    if (!state.user) return;
    if (val) {
      const result = await enablePush(state.user.id);
      if (result.ok) {
        saveSetting({ pushEnabled: true });
        toast({ title: 'Đã bật Web Push 🔔', description: 'Bạn sẽ nhận thông báo ngay cả khi không mở web.' });
      } else {
        toast({ title: 'Không bật được Push', description: result.error, variant: 'destructive' });
      }
    } else {
      await disablePush(state.user.id);
      saveSetting({ pushEnabled: false });
      toast({ title: 'Đã tắt Web Push', description: 'Không còn nhận push notification.' });
    }
  };

  const handleToggleEmail = (val: boolean) => {
    saveSetting({ emailEnabled: val });
    if (val && state.user) {
      toast({
        title: 'Đã bật Email reminder 📧',
        description: `Email nhắc sẽ gửi tới ${state.user.email} (server cần GMAIL_USER + GMAIL_APP_PASSWORD).`,
      });
    } else {
      toast({ title: 'Đã tắt Email reminder' });
    }
  };

  const handleToggleGcal = (val: boolean) => {
    saveSetting({ gcalEnabled: val });
    if (val) {
      toast({
        title: 'Đã bật Google Calendar 📅',
        description: 'Nút "Add to Google Calendar" sẽ xuất hiện trên từng phiên học trong AI Planner.',
      });
    } else {
      toast({ title: 'Đã tắt Google Calendar' });
    }
  };

  const handleToggleReminderTime = (minutes: number, checked: boolean) => {
    const set = new Set(notif.minutesBefore);
    if (checked) set.add(minutes);
    else set.delete(minutes);
    const sorted = Array.from(set).sort((a, b) => b - a);
    saveSetting({ minutesBefore: sorted });
  };

  const handleTestNotification = async () => {
    if (!state.user) return;
    setTesting(true);
    try {
      const res = await fetch('/api/notification/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Đã gửi notification test',
          description: `Qua các kênh: ${data.sentVia.join(' • ')}`,
        });
      } else {
        toast({ title: 'Gửi test thất bại', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleSound = (val: boolean) => {
    setSoundEnabled(val);
    setPomodoroSoundEnabled(val);
    toast({
      title: val ? 'Đã bật âm thanh' : 'Đã tắt âm thanh',
      description: val ? 'Chuông sẽ reo khi kết thúc phiên Pomodoro.' : 'Đã tắt chuông báo Pomodoro.',
    });
  };

  const handleTestSound = () => {
    playTimerFinishSound('focus');
    toast({
      title: 'Đang phát chuông thử nghiệm',
      description: 'Âm thanh báo hiệu kết thúc Pomodoro.',
    });
  };

  if (!state.user) return null;

  const handleSavePomodoro = (session: number, breakLen: number) => {
    dispatch({
      type: 'UPDATE_PLANNER_PREFS',
      payload: { sessionLengthPref: session, breakLengthPref: breakLen }
    });
    toast({
      title: 'Đã lưu cài đặt',
      description: `Đã cập nhật Pomodoro: ${session} phút học / ${breakLen} phút nghỉ.`,
    });
  };

  return (
    <AppLayout mascotState="idle">
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
            <p className="text-muted-foreground text-sm">Quản lý trải nghiệm học tập của bạn</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Settings */}
          <Card className="rounded-2xl shadow-fm-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-sky-500" /> Tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Tên hiển thị</Label>
                <div className="font-medium">{state.user.name}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Email</Label>
                <div className="font-medium">{state.user.email}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Vai trò</Label>
                <div className="font-medium capitalize">
                  {state.user.role === 'student' ? 'Học sinh' : 
                   state.user.role === 'uni_student' ? 'Sinh viên' : 
                   state.user.role === 'worker' ? 'Người đi làm' : 'Khác'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pomodoro Settings */}
          <Card className="rounded-2xl shadow-fm-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-peach-500" /> Thời gian học (Pomodoro)
              </CardTitle>
              <CardDescription>Thời gian học mặc định cho các phiên học mới.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Độ dài một phiên học</Label>
                <Select 
                  value={state.plannerState.userPrefs.sessionLengthPref.toString()}
                  onValueChange={(val) => handleSavePomodoro(parseInt(val), state.plannerState.userPrefs.breakLengthPref)}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Chọn thời gian học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 phút</SelectItem>
                    <SelectItem value="25">25 phút (Tiêu chuẩn)</SelectItem>
                    <SelectItem value="45">45 phút</SelectItem>
                    <SelectItem value="60">60 phút (Tập trung sâu)</SelectItem>
                    <SelectItem value="90">90 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Độ dài giờ giải lao</Label>
                <Select 
                  value={state.plannerState.userPrefs.breakLengthPref.toString()}
                  onValueChange={(val) => handleSavePomodoro(state.plannerState.userPrefs.sessionLengthPref, parseInt(val))}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Chọn thời gian nghỉ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 phút</SelectItem>
                    <SelectItem value="10">10 phút</SelectItem>
                    <SelectItem value="15">15 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="rounded-2xl shadow-fm-sm border-border/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-butter-500" /> Thông báo & Nhắc nhở
              </CardTitle>
              <CardDescription>Chọn kênh nhận thông báo và thời điểm nhắc trước mỗi phiên học trong AI Planner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channels */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Kênh thông báo</Label>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-sky-500" />
                      <Label className="text-base font-medium">In-app notification</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Chuông 🔔 trên web + toast khi đang mở FocusMate.</p>
                  </div>
                  <Switch checked={notif.inAppEnabled} onCheckedChange={handleToggleInApp} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                      <Label className="text-base font-medium">Web Push</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Thông báo hệ điều hành ngay cả khi không mở web.
                      {pushStatus === 'denied' && (
                        <span className="text-destructive"> — Bạn đã chặn quyền thông báo trong trình duyệt.</span>
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={notif.pushEnabled && pushStatus === 'granted'}
                    disabled={pushStatus === 'unsupported' || pushStatus === 'denied'}
                    onCheckedChange={handleTogglePush}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-rose-500" />
                      <Label className="text-base font-medium">Email</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Gửi email nhắc nhở tới {state.user.email}.</p>
                  </div>
                  <Switch checked={notif.emailEnabled} onCheckedChange={handleToggleEmail} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CalendarPlus className="w-4 h-4 text-indigo-500" />
                      <Label className="text-base font-medium">Google Calendar</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">Thêm nút "Add to Google Calendar" trên từng phiên học — Google Calendar app sẽ nhắc trên điện thoại của bạn.</p>
                  </div>
                  <Switch checked={notif.gcalEnabled} onCheckedChange={handleToggleGcal} />
                </div>
              </div>

              {/* Reminder time */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Nhắc trước bao lâu?</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {REMINDER_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Checkbox
                        id={`reminder-${opt.value}`}
                        checked={notif.minutesBefore.includes(opt.value)}
                        onCheckedChange={(checked) => handleToggleReminderTime(opt.value, checked === true)}
                      />
                      <Label htmlFor={`reminder-${opt.value}`} className="text-sm font-normal cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test button */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Kiểm tra thông báo</Label>
                  <p className="text-sm text-muted-foreground">Gửi 1 notification test qua tất cả kênh đang bật để kiểm tra.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg flex items-center gap-1.5"
                  disabled={testing}
                  onClick={handleTestNotification}
                >
                  <Send className="w-3.5 h-3.5 text-sky-500" />
                  {testing ? 'Đang gửi...' : 'Gửi test'}
                </Button>
              </div>

              {/* Mascot + Sound */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Nhắc nhở từ Mascot</Label>
                  <p className="text-sm text-muted-foreground">Mascot sẽ hiện lên nhắc nhở nếu bạn chưa học trong ngày.</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Âm thanh Pomodoro</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-lg px-2 flex items-center gap-1.5 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                      onClick={handleTestSound}
                      title="Nghe thử âm thanh chuông báo hiệu"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-sky-500" />
                      Nghe thử
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Phát âm thanh chuông khi kết thúc mỗi phiên học và nghỉ.</p>
                </div>
                <Switch 
                  checked={soundEnabled}
                  onCheckedChange={handleToggleSound}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
