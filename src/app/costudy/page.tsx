"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMascot } from '@/store/AppContext';
import { PERSONAS } from '@/lib/mascotData';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, LogIn, Clock, Star } from 'lucide-react';

export default function CoStudyLobbyPage() {
  const router = useRouter();
  const mascot = useMascot();
  const [roomName, setRoomName] = useState('');
  const [maxMembers, setMaxMembers] = useState('4');
  const [checkInInterval, setCheckInInterval] = useState('30');
  const [joinCode, setJoinCode] = useState('');
  
  interface ActiveRoom { id: string; name: string; maxMembers: number; checkInIntervalMinutes: number; sharedMinutes: number; members: Record<string, unknown>; }
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/costudy/rooms');
        if (response.ok) {
            const rooms = await response.json();
            setActiveRooms(rooms || []);
        }
      } catch (err) {
        console.error("Failed to fetch active rooms:", err);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // refresh every 5s

    return () => clearInterval(interval);
  }, []);

  const handleCreate = () => {
    if (!roomName.trim()) return;
    const state = {
      id: Date.now().toString(),
      name: roomName.trim(),
      maxMembers: parseInt(maxMembers),
      isHost: true,
      checkInInterval: parseInt(checkInInterval)
    };
    router.push(`/costudy/room?state=${encodeURIComponent(JSON.stringify(state))}`);
  };

  const handleJoin = (roomId: string, roomName: string) => {
    const state = { id: roomId, name: roomName, isHost: false };
    router.push(`/costudy/room?state=${encodeURIComponent(JSON.stringify(state))}`);
  };

  const handleJoinByCode = () => {
    if (joinCode.trim().length >= 4) {
      const state = { id: joinCode.trim(), name: 'Phòng Ẩn', isHost: false };
      router.push(`/costudy/room?state=${encodeURIComponent(JSON.stringify(state))}`);
    }
  };

  return (
    <AppLayout mascotState="idle">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: 'hsl(var(--sky))' }} />
            Co-Study Rooms
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Học cùng nhau, cùng nhau lớn lên</p>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Create room */}
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Tạo phòng mới
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Tên phòng</Label>
                  <Input placeholder="Phòng học Toán..." value={roomName} onChange={(e) => setRoomName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Số thành viên tối đa</Label>
                  <Select value={maxMembers} onValueChange={setMaxMembers}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8].map((n) => <SelectItem key={n} value={String(n)}>{n} người</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Khoảng check-in</Label>
                  <Select value={checkInInterval} onValueChange={setCheckInInterval}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 phút</SelectItem>
                      <SelectItem value="30">30 phút</SelectItem>
                      <SelectItem value="45">45 phút</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!roomName.trim()}
                  className="w-full rounded-xl"
                  style={{ background: 'hsl(var(--sky))', color: 'white' }}
                >
                  Tạo phòng
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-fm-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Tham gia bằng mã
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Nhập ID phòng..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="rounded-xl text-center tracking-widest font-mono"
                />
                <Button onClick={handleJoinByCode} variant="outline" className="w-full rounded-xl" disabled={joinCode.length < 4}>
                  Tham gia
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Room list */}
          <div className="col-span-2 space-y-3">
            <p className="text-sm font-semibold text-foreground">Phòng đang mở ({activeRooms.length})</p>
            {activeRooms.map((room) => {
               const memberCount = Object.keys(room.members || {}).length;
               return (
              <Card key={room.id} className="rounded-2xl shadow-fm-sm hover:shadow-fm-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">{room.name}</p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {memberCount}/{room.maxMembers}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Check-in {room.checkInIntervalMinutes}ph
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" /> {(room.sharedMinutes / 60).toFixed(1)}h chung
                        </span>
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">ID: {room.id}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoin(room.id, room.name)}
                      disabled={memberCount >= room.maxMembers}
                      className="rounded-xl shrink-0"
                      style={memberCount < room.maxMembers ? { background: 'hsl(var(--sky))', color: 'white' } : {}}
                    >
                      {memberCount >= room.maxMembers ? 'Đầy' : 'Tham gia'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )})}
            {activeRooms.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed rounded-2xl text-muted-foreground text-sm">
                 Hiện chưa có phòng nào đang mở. Hãy là người đầu tiên tạo phòng nhé!
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
