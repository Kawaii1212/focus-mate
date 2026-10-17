"use client";

import React, { useEffect, useState } from 'react';
import {
  Video,
  Users,
  Timer,
  Trash2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Flame,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminRoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/admin/rooms');
      if (!res.ok) throw new Error('Không thể tải danh sách phòng');
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.rooms)
        ? data.rooms
        : [];
      setRooms(list);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải phòng học');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const res = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi dọn dẹp');
      toast.success(data.message || 'Đã dọn dẹp các phòng trống');
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi dọn dẹp');
    } finally {
      setCleaning(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    try {
      const res = await fetch(`/api/admin/rooms/${deleteRoomId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Không thể giải tán phòng');
      toast.success('Đã giải tán phòng thành công');
      setDeleteRoomId(null);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa phòng');
    }
  };

  const roomList = Array.isArray(rooms) ? rooms : [];
  const totalMembers = roomList.reduce((acc, r) => acc + (Array.isArray(r?.members) ? r.members.length : 0), 0);
  const activePomodoroCount = roomList.filter((r) => r?.pomodoroIsActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-400" />
            <span>Giám Sát Phòng Học Nhóm (Co-Study Rooms)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi phòng học trực tuyến, số lượng học viên và trạng thái Pomodoro dùng chung
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchRooms}
            variant="outline"
            size="sm"
            className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs h-9"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Làm mới
          </Button>

          <Button
            onClick={handleCleanup}
            disabled={cleaning}
            className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs h-9 font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{cleaning ? 'Đang dọn...' : 'Dọn Dẹp Phòng Trống'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng Phòng Đang Mở</p>
              <p className="text-2xl font-bold text-white mt-1">{roomList.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Học Viên Đang Trong Phòng</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{totalMembers} bạn</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Đang Chạy Đồng Hồ Pomodoro</p>
              <p className="text-2xl font-bold text-violet-400 mt-1">{activePomodoroCount} phòng</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Đang tải danh sách phòng trực tuyến...</p>
          </div>
        ) : roomList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Hiện không có phòng Co-Study nào đang mở
          </div>
        ) : (
          roomList.map((room) => {
            const memberCount = room.members?.length || 0;
            const minutesLeft = Math.floor((room.pomodoroTimeLeft || 0) / 60);
            const secondsLeft = (room.pomodoroTimeLeft || 0) % 60;
            const timeFormatted = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;

            return (
              <Card
                key={room.id}
                className="bg-slate-900/90 border-slate-800 text-slate-100 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                        <span>{room.name}</span>
                        {room.pomodoroIsActive && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Mã: {room.id}
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteRoomId(room.id)}
                      className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 h-auto rounded-lg"
                      title="Giải tán phòng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <Timer className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-slate-300">
                        {room.pomodoroMode === 'break' ? '☕ Giờ giải lao' : '🔥 Tập trung'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">{timeFormatted}</span>
                      <Badge
                        className={`text-[9px] px-1 py-0 ${
                          room.pomodoroIsActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {room.pomodoroIsActive ? 'Đang chạy' : 'Đang tạm dừng'}
                      </Badge>
                    </div>
                  </div>

                  {/* Members list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Thành viên trong phòng</span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {memberCount} / {room.maxMembers || 4}
                      </span>
                    </div>

                    {memberCount > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {room.members.map((m: any) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px]"
                          >
                            <Avatar className="w-4 h-4 bg-indigo-950">
                              <AvatarFallback className="bg-indigo-600 text-[9px] text-white">
                                {m.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-200 truncate max-w-[90px]">{m.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">Chưa có người tham gia</p>
                    )}
                  </div>

                  {/* Room Meta */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-slate-500" />
                      {room._count?.messages || 0} tin nhắn
                    </span>
                    <span>Chu kỳ: {room.checkInIntervalMinutes || 30}m</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Room Dialog */}
      <Dialog open={Boolean(deleteRoomId)} onOpenChange={() => setDeleteRoomId(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Giải Tán Phòng Co-Study</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Bạn có chắc chắn muốn buộc đóng phòng học này? Các thành viên đang trong phòng sẽ được ngắt kết nối.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteRoomId(null)}
              className="bg-slate-950 border-slate-800 text-xs rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleDeleteRoom}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-xl"
            >
              Đóng Phòng Ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
