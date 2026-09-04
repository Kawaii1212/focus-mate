import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Timer, Brain, Flame, Star, ChevronRight, Play } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-500">
              FocusMate
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-sky-500 transition-colors">
              Đăng nhập
            </Link>
            <Link href="/signup">
              <Button className="rounded-xl shadow-fm-sm bg-sky-500 hover:bg-sky-600 text-white">
                Bắt đầu ngay
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-20 md:py-32 text-center" style={{ background: 'var(--gradient-sky)' }}>
          <div className="container mx-auto max-w-4xl space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
              Học tập trung hơn,<br /> bớt trì hoãn với <span className="text-sky-600">Mascot ảo</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Không còn cảm giác cô đơn khi chạy deadline. FocusMate biến việc học thành một hành trình thú vị với phương pháp Pomodoro, quản lý tiến độ và người bạn đồng hành ảo đáng yêu.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="rounded-2xl h-14 px-8 text-lg font-bold shadow-fm-md bg-sky-500 hover:bg-sky-600 text-white w-full sm:w-auto">
                  Dùng thử ngay <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="rounded-2xl h-14 px-8 text-lg font-bold shadow-fm-sm bg-white text-slate-700 w-full sm:w-auto hover:bg-slate-50">
                  <Play className="ml-2 w-5 h-5 mr-2" /> Xem Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-20 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Tính năng nổi bật</h2>
              <p className="text-slate-600 mt-4">Mọi thứ bạn cần để tập trung học tập, tích hợp trong một nền tảng.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard 
                icon={<Timer className="w-8 h-8 text-sky-500" />}
                title="Pomodoro Tập Trung"
                description="Học 25 phút, nghỉ 5 phút. Chia nhỏ thời gian giúp não bộ duy trì sự tập trung tối đa mà không bị mệt mỏi."
                bg="bg-sky-50"
              />
              <FeatureCard 
                icon={<Brain className="w-8 h-8 text-indigo-500" />}
                title="AI Planner"
                description="Không biết bắt đầu từ đâu? AI sẽ tự động phân bổ deadline thành các phiên học nhỏ, vừa vặn với lịch của bạn."
                bg="bg-indigo-50"
              />
              <FeatureCard 
                icon={<Star className="w-8 h-8 text-amber-500" />}
                title="Mascot Đồng Hành"
                description="Nuôi dưỡng thú cưng ảo của riêng bạn. Mascot sẽ lớn lên và tiến hóa mỗi khi bạn hoàn thành nhiệm vụ."
                bg="bg-amber-50"
              />
              <FeatureCard 
                icon={<Flame className="w-8 h-8 text-rose-500" />}
                title="Chuỗi Ngày (Streak)"
                description="Xây dựng thói quen học tập đều đặn mỗi ngày. Thu thập huy hiệu và xu thưởng khi đạt cột mốc mới."
                bg="bg-rose-50"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20 bg-slate-50 border-t">
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-3xl font-bold text-slate-900">Sẵn sàng để chạy deadline hiệu quả hơn?</h2>
            <p className="text-lg text-slate-600">Đăng ký miễn phí chỉ trong 30 giây. Không cần thẻ tín dụng.</p>
            <Link href="/signup">
              <Button size="lg" className="rounded-2xl h-14 px-10 text-lg font-bold shadow-fm-md bg-sky-500 hover:bg-sky-600 text-white">
                Tạo tài khoản miễn phí
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-white text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} FocusMate. Built for students.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, bg }: { icon: React.ReactNode; title: string; description: string; bg: string }) {
  return (
    <div className="p-6 rounded-3xl border bg-white shadow-sm hover:shadow-fm-md transition-shadow duration-300 group">
      <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
