"use client";

import React, { useState } from 'react';
import { useApp } from '@/store/AppContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Bell, Clock, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [mascotReminders, setMascotReminders] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  const handleSaveNotifications = () => {
    toast({
      title: 'Đã cập nhật thông báo',
      description: 'Cài đặt thông báo đã được lưu (Demo).',
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
              <CardDescription>Tùy chỉnh cách FocusMate tương tác với bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Bật thông báo ứng dụng</Label>
                  <p className="text-sm text-muted-foreground">Nhận thông báo khi đến giờ học hoặc có deadline sắp tới.</p>
                </div>
                <Switch 
                  checked={notificationsEnabled}
                  onCheckedChange={(val) => { setNotificationsEnabled(val); handleSaveNotifications(); }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Nhắc nhở từ Mascot</Label>
                  <p className="text-sm text-muted-foreground">Mascot sẽ hiện lên nhắc nhở nếu bạn chưa học trong ngày.</p>
                </div>
                <Switch 
                  checked={mascotReminders}
                  onCheckedChange={(val) => { setMascotReminders(val); handleSaveNotifications(); }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Âm thanh Pomodoro</Label>
                  <p className="text-sm text-muted-foreground">Phát âm thanh khi kết thúc mỗi phiên học và nghỉ.</p>
                </div>
                <Switch 
                  checked={soundEnabled}
                  onCheckedChange={(val) => { setSoundEnabled(val); handleSaveNotifications(); }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
