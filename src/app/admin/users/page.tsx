"use client";

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Shield,
  ShieldCheck,
  Crown,
  Sparkles,
  Eye,
  Edit2,
  Trash2,
  Coins,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const userList = Array.isArray(users) ? users : [];
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [premiumFilter, setPremiumFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [mascotModalUser, setMascotModalUser] = useState<any>(null);
  const [mascotOpen, setMascotOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    isPremium: false,
    studyHabit: 'Pomodoro',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    isPremium: false,
    password: '',
  });

  const [mascotFormData, setMascotFormData] = useState({
    coin: 100,
    streakShields: 1,
    level: 1,
    exp: 0,
    name: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        role: roleFilter,
        isPremium: premiumFilter,
      });

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể tải người dùng');
      const data = await res.json();
      const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
      setUsers(list);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, premiumFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenDetail = async (user: any) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      if (res.ok) {
        const full = await res.json();
        setDetailUser(full);
      } else {
        setDetailUser(user);
      }
      setDetailOpen(true);
    } catch {
      setDetailUser(user);
      setDetailOpen(true);
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      isPremium: Boolean(user.isPremium),
      password: '',
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      const body: any = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        isPremium: editFormData.isPremium,
      };
      if (editFormData.password.trim()) {
        body.password = editFormData.password.trim();
      }

      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Cập nhật thất bại');
      toast.success('Đã cập nhật thông tin người dùng');
      setEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleOpenMascot = (user: any) => {
    setMascotModalUser(user);
    const m = user.mascot || {};
    setMascotFormData({
      coin: m.coin ?? 100,
      streakShields: m.streakShields ?? 1,
      level: m.level ?? 1,
      exp: m.exp ?? 0,
      name: m.name ?? 'Mascot',
    });
    setMascotOpen(true);
  };

  const handleSaveMascot = async () => {
    if (!mascotModalUser) return;
    try {
      const res = await fetch(`/api/admin/users/${mascotModalUser.id}/mascot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mascotFormData),
      });

      if (!res.ok) throw new Error('Cập nhật Mascot thất bại');
      toast.success('Đã cập nhật Mascot');
      setMascotOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tạo người dùng');

      toast.success('Đã tạo tài khoản thành công!');
      setCreateOpen(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        isPremium: false,
        studyHabit: 'Pomodoro',
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tạo người dùng');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Không thể xóa người dùng này');
      toast.success('Đã xóa người dùng thành công');
      setDeleteId(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa người dùng');
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Quản Lý Người Dùng FocusMate</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng cộng: <span className="font-semibold text-slate-200">{totalCount}</span> tài khoản trên hệ thống
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs h-9 font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Người Dùng Mới</span>
        </Button>
      </div>

      <Card className="bg-slate-900/80 border-slate-800 text-slate-100">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Tìm theo họ tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500 rounded-xl text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800 text-xs h-9 rounded-xl">
                  <SelectValue placeholder="Phân quyền" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="all">Mọi phân quyền</SelectItem>
                  <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                  <SelectItem value="user">Học viên (User)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={premiumFilter} onValueChange={(val) => { setPremiumFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800 text-xs h-9 rounded-xl">
                  <SelectValue placeholder="Gói dịch vụ" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                  <SelectItem value="all">Mọi gói cước</SelectItem>
                  <SelectItem value="true">Premium VIP</SelectItem>
                  <SelectItem value="false">Miễn phí</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 rounded-xl text-xs h-9 px-3"
              >
                Tìm
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/80 border-slate-800 text-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Người Dùng</th>
                <th className="py-3 px-4">Quyền Hạn</th>
                <th className="py-3 px-4">Linh Vật Mascot</th>
                <th className="py-3 px-4">Gói Cước</th>
                <th className="py-3 px-4">Thống Kê</th>
                <th className="py-3 px-4">Ngày Tạo</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách học viên...</span>
                    </div>
                  </td>
                </tr>
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                userList.map((u) => {
                  const m = u.mascot;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700">
                            <AvatarFallback className="bg-indigo-950 text-indigo-300 font-bold text-xs">
                              {u.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 max-w-[180px]">
                            <p className="font-semibold text-slate-200 truncate">{u.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {u.role === 'admin' ? (
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] font-semibold gap-1">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 border-slate-700 text-[10px]">
                            User
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {m ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-medium text-slate-200">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span className="truncate max-w-[100px]">{m.name}</span>
                              <span className="text-[10px] text-indigo-400 font-mono">Lv.{m.level}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="flex items-center gap-0.5 text-amber-400">
                                <Coins className="w-2.5 h-2.5" />
                                {m.coin}
                              </span>
                              <span>•</span>
                              <span>{m.streakShields} khiên</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Chưa có</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {u.isPremium ? (
                          <div className="space-y-0.5">
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-semibold gap-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              VIP
                            </Badge>
                            {u.premiumExpiry && (
                              <p className="text-[9px] text-slate-400 font-mono">
                                Hết: {new Date(u.premiumExpiry).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-800 text-[10px]">
                            Free
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-400 space-y-0.5">
                          <p>{u._count?.sessions || 0} phiên học</p>
                          <p>{u._count?.deadlines || 0} deadline</p>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(u)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Sửa quyền / Premium"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenMascot(u)}
                            title="Cộng Coins / Khiên Mascot"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteId(u.id)}
                            title="Xóa người dùng"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Trang <span className="font-semibold text-slate-200">{page}</span> / {totalPages} (Tổng: {totalCount})
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="bg-slate-950 border-slate-800 text-slate-300 h-8 px-2 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="bg-slate-950 border-slate-800 text-slate-300 h-8 px-2 rounded-lg"
            >
              Sau
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
      {/* Modal 1: Create New User */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Thêm Tài Khoản Mới</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Tạo tài khoản học viên hoặc quản trị viên trực tiếp từ Admin
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Họ và tên</Label>
              <Input
                placeholder="Nguyễn Văn A"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mật khẩu</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Phân quyền</Label>
                <Select
                  value={newUserData.role}
                  onValueChange={(v) => setNewUserData({ ...newUserData, role: v })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="user">Học viên (User)</SelectItem>
                    <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Gói cước</Label>
                <Select
                  value={newUserData.isPremium ? 'true' : 'false'}
                  onValueChange={(v) => setNewUserData({ ...newUserData, isPremium: v === 'true' })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="false">Miễn phí</SelectItem>
                    <SelectItem value="true">Premium VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl"
              >
                Tạo Tài Khoản
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit User & Role */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Chỉnh Sửa Người Dùng & Phân Quyền</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Cập nhật thông tin, cấp quyền Admin hoặc VIP
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Họ và tên</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Phân quyền</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(v) => setEditFormData({ ...editFormData, role: v })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="user">Học viên (User)</SelectItem>
                    <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Trạng thái Premium</Label>
                <Select
                  value={editFormData.isPremium ? 'true' : 'false'}
                  onValueChange={(v) => setEditFormData({ ...editFormData, isPremium: v === 'true' })}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="false">Miễn phí</SelectItem>
                    <SelectItem value="true">Premium VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Đặt lại mật khẩu mới (Bỏ trống nếu giữ nguyên)</Label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu mới..."
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSaveEdit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl"
              >
                Lưu Thay Đổi
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Edit Mascot Stats */}
      <Dialog open={mascotOpen} onOpenChange={setMascotOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Chỉnh Sửa Mascot & Tài Nguyên</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Hỗ trợ học viên: cộng Coins, Khiên bảo vệ Streak, hoặc Level
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Tên Mascot</Label>
              <Input
                value={mascotFormData.name}
                onChange={(e) => setMascotFormData({ ...mascotFormData, name: e.target.value })}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-amber-400 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Coins
                </Label>
                <Input
                  type="number"
                  value={mascotFormData.coin}
                  onChange={(e) => setMascotFormData({ ...mascotFormData, coin: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-sky-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Khiên Streak
                </Label>
                <Input
                  type="number"
                  value={mascotFormData.streakShields}
                  onChange={(e) => setMascotFormData({ ...mascotFormData, streakShields: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Cấp Độ (Level)</Label>
                <Input
                  type="number"
                  value={mascotFormData.level}
                  onChange={(e) => setMascotFormData({ ...mascotFormData, level: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Điểm EXP</Label>
                <Input
                  type="number"
                  value={mascotFormData.exp}
                  onChange={(e) => setMascotFormData({ ...mascotFormData, exp: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-800 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMascotOpen(false)}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSaveMascot}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-xl"
              >
                Cập Nhật Mascot
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 4: User Full Details Drawer / Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailUser && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700/50">
                    <AvatarFallback className="bg-indigo-600 text-white font-bold">
                      {detailUser.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                      <span>{detailUser.name}</span>
                      {detailUser.role === 'admin' && (
                        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                          Admin
                        </Badge>
                      )}
                      {detailUser.isPremium && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                          VIP
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-400">
                      ID: <span className="font-mono text-slate-300">{detailUser.id}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid grid-cols-4 bg-slate-950 border border-slate-800 text-xs">
                  <TabsTrigger value="info">Hồ Sơ</TabsTrigger>
                  <TabsTrigger value="mascot">Linh Vật</TabsTrigger>
                  <TabsTrigger value="sessions">Phiên Học ({detailUser.sessions?.length || 0})</TabsTrigger>
                  <TabsTrigger value="payments">Thanh Toán ({detailUser.payments?.length || 0})</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="info" className="space-y-3 pt-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div>
                      <span className="text-slate-400">Email:</span>
                      <p className="font-semibold text-slate-200">{detailUser.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Ngày gia nhập:</span>
                      <p className="font-semibold text-slate-200">
                        {new Date(detailUser.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Thói quen học:</span>
                      <p className="font-semibold text-slate-200">{detailUser.studyHabit || 'Chưa thiết lập'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Mục tiêu:</span>
                      <p className="font-semibold text-slate-200">{detailUser.goal || 'Tập trung học tập'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Khung giờ vàng:</span>
                      <p className="font-semibold text-slate-200">{detailUser.preferredTime || 'Buổi tối'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Hoàn tất Onboarding:</span>
                      <p className="font-semibold text-slate-200">
                        {detailUser.onboardingComplete ? '✅ Đã hoàn thành' : '⏳ Chưa'}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Mascot Tab */}
                <TabsContent value="mascot" className="space-y-3 pt-3 text-xs">
                  {detailUser.mascot ? (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{detailUser.mascot.name}</p>
                          <p className="text-xs text-slate-400">
                            Persona #{detailUser.mascot.personaId} • Giai đoạn: {detailUser.mascot.stage}
                          </p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                          Level {detailUser.mascot.level}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 text-[10px]">Tiền Vàng (Coins)</p>
                          <p className="text-base font-bold text-amber-400">{detailUser.mascot.coin}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 text-[10px]">Khiên Streak</p>
                          <p className="text-base font-bold text-sky-400">{detailUser.mascot.streakShields}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 text-[10px]">EXP Hiện Tại</p>
                          <p className="text-base font-bold text-violet-400">
                            {detailUser.mascot.exp} / {detailUser.mascot.expToNextLevel}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-6">Người dùng chưa chọn Mascot</p>
                  )}
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="sessions" className="space-y-2 pt-3 text-xs">
                  {detailUser.sessions && detailUser.sessions.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {detailUser.sessions.map((s: any) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800"
                        >
                          <div>
                            <p className="font-semibold text-slate-200">{s.taskTitle}</p>
                            <p className="text-[11px] text-slate-400">
                              {s.actualMinutes} phút • {s.completionPct}% hoàn thành
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-mono">+{s.expEarned} EXP</span>
                            <p className="text-[10px] text-slate-500">{s.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-6">Chưa có phiên học nào</p>
                  )}
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-2 pt-3 text-xs">
                  {detailUser.payments && detailUser.payments.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {detailUser.payments.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800"
                        >
                          <div>
                            <span className="font-mono text-slate-300">#{p.orderCode}</span>
                            <p className="text-[11px] text-slate-400">
                              Gói {p.planId} • {p.amount.toLocaleString('vi-VN')}₫
                            </p>
                          </div>
                          <Badge
                            className={`text-[10px] ${
                              p.status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {p.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-6">Chưa có giao dịch nào</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 5: Delete Confirmation */}
      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>Xác Nhận Xóa Người Dùng</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Hành động này sẽ xóa toàn bộ dữ liệu (Mascot, phiên học, lịch trình) của người dùng này và không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="bg-slate-950 border-slate-800 text-xs rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleDeleteUser}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-xl"
            >
              Xác Nhận Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
