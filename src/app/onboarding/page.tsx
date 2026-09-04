"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/store/AppContext';
import { PERSONAS } from '@/lib/mascotData';
import { MascotPersonaId } from '@/types';
import MascotEgg from '@/components/mascot/MascotEgg';
import MascotSVG from '@/components/mascot/MascotSVG';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

type Step = 'role' | 'habits' | 'goal' | 'time' | 'egg' | 'intro';
const STEPS: Step[] = ['role', 'habits', 'goal', 'time', 'egg', 'intro'];

const ROLE_OPTIONS = [
  { value: 'student', label: 'Học sinh' },
  { value: 'uni_student', label: 'Sinh viên' },
  { value: 'worker', label: 'Người đi làm' },
  { value: 'other', label: 'Khác' },
];

const HABIT_OPTIONS = [
  { value: 'pomodoro', label: 'Học theo Pomodoro' },
  { value: 'marathon', label: 'Học marathon dài' },
  { value: 'random', label: 'Học lúc nào có hứng' },
  { value: 'daily', label: 'Học đều đặn mỗi ngày' },
];

const GOAL_OPTIONS = [
  { value: 'exam', label: 'Chuẩn bị kỳ thi' },
  { value: 'deadline', label: 'Đuổi kịp deadline' },
  { value: 'habit', label: 'Xây dựng thói quen học' },
  { value: 'career', label: 'Phát triển kỹ năng' },
];

const TIME_OPTIONS = [
  { value: 'morning' as const, label: 'Buổi Sáng', desc: '6:00 – 12:00', emoji: '🌅' },
  { value: 'afternoon' as const, label: 'Buổi Chiều', desc: '12:00 – 18:00', emoji: '☀️' },
  { value: 'evening' as const, label: 'Buổi Tối', desc: '18:00 – 22:00', emoji: '🌙' },
  { value: 'night' as const, label: 'Đêm Khuya', desc: '22:00 – 2:00', emoji: '⭐' },
];

export default function OnboardingFlow() {
  const { dispatch } = useApp();
  const router = useRouter();

  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState('');
  const [habit, setHabit] = useState('');
  const [goal, setGoal] = useState('');
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('evening');
  const [selectedEgg, setSelectedEgg] = useState<MascotPersonaId | null>(null);
  const [mascotName, setMascotName] = useState('');

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleFinish = () => {
    if (selectedEgg === null) return;
    const persona = PERSONAS[selectedEgg];
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      payload: {
        personaId: selectedEgg,
        mascotName: mascotName.trim() || persona.defaultMascotName,
        role: role,
      },
    });
    router.push('/dashboard');
  };

  const canNext = () => {
    if (step === 'role') return !!role;
    if (step === 'habits') return !!habit;
    if (step === 'goal') return !!goal;
    if (step === 'time') return !!preferredTime;
    if (step === 'egg') return selectedEgg !== null;
    return true;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--gradient-sky)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        {step !== 'intro' && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Bước {stepIndex + 1}/{STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Steps */}
        {step === 'role' && (
          <OnboardingCard
            title="Bạn là..."
            subtitle="Để FocusMate điều chỉnh trải nghiệm phù hợp với bạn nhất."
          >
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  label={opt.label}
                  selected={role === opt.value}
                  onClick={() => setRole(opt.value)}
                />
              ))}
            </div>
          </OnboardingCard>
        )}

        {step === 'habits' && (
          <OnboardingCard
            title="Thói quen học hiện tại của bạn?"
            subtitle="Không có câu trả lời sai, cứ chọn cái phù hợp nhất nhé!"
          >
            <div className="grid grid-cols-2 gap-3">
              {HABIT_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  label={opt.label}
                  selected={habit === opt.value}
                  onClick={() => setHabit(opt.value)}
                />
              ))}
            </div>
          </OnboardingCard>
        )}

        {step === 'goal' && (
          <OnboardingCard
            title="Mục tiêu học tập của bạn?"
            subtitle="Mascot sẽ giúp bạn đạt được mục tiêu này!"
          >
            <div className="grid grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  label={opt.label}
                  selected={goal === opt.value}
                  onClick={() => setGoal(opt.value)}
                />
              ))}
            </div>
          </OnboardingCard>
        )}

        {step === 'time' && (
          <OnboardingCard
            title="Bạn thích học vào khung giờ nào?"
            subtitle="AI Planner sẽ ưu tiên xếp lịch vào giờ này cho bạn."
          >
            <div className="grid grid-cols-2 gap-3">
              {TIME_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  label={opt.label}
                  sublabel={opt.desc}
                  selected={preferredTime === opt.value}
                  onClick={() => setPreferredTime(opt.value)}
                />
              ))}
            </div>
          </OnboardingCard>
        )}

        {step === 'egg' && (
          <OnboardingCard
            title="Chọn người bạn đồng hành!"
            subtitle="Mỗi người bạn ẩn chứa một tính cách khác nhau. Chọn một người bạn phù hợp với bạn nhé!"
          >
            <div className="grid grid-cols-3 gap-4">
              {(PERSONAS.map((_, i) => i) as MascotPersonaId[]).map((id) => (
                <MascotEgg
                  key={id}
                  personaId={id}
                  selected={selectedEgg === id}
                  onClick={() => setSelectedEgg(id)}
                  size={100}
                />
              ))}
            </div>
            {selectedEgg !== null && (
              <div
                className="mt-4 p-4 rounded-2xl text-sm text-center animate-fade-in"
                style={{ background: 'hsl(var(--secondary))' }}
              >
                <p className="font-medium text-foreground">{PERSONAS[selectedEgg].name}</p>
                <p className="text-muted-foreground mt-1">{PERSONAS[selectedEgg].description}</p>
                <p className="text-sm italic mt-2 text-foreground/80">
                  "{PERSONAS[selectedEgg].speeches.idle[0]}"
                </p>
              </div>
            )}
          </OnboardingCard>
        )}

        {step === 'intro' && selectedEgg !== null && (
          <div className="text-center space-y-6">
            <div
              className="bg-card rounded-3xl p-8 shadow-fm-lg space-y-6"
              style={{ border: '1px solid hsl(var(--border))' }}
            >
                <div className="space-y-5 animate-slide-in-up">
                  <h2 className="text-2xl font-bold text-foreground">
                    Chào mừng đến với gia đình!
                  </h2>
                  <div className="flex justify-center">
                    <MascotSVG
                      personaId={selectedEgg}
                      stage="baby"
                      mascotState="happy"
                      size={160}
                      animate
                    />
                  </div>

                  <div
                    className="p-4 rounded-2xl"
                    style={{ background: 'hsl(var(--secondary))' }}
                  >
                    <p className="text-foreground font-medium">"{PERSONAS[selectedEgg].speeches.happy[0]}"</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mascotName">Đặt tên cho mascot của bạn:</Label>
                    <Input
                      id="mascotName"
                      placeholder={PERSONAS[selectedEgg].defaultMascotName}
                      value={mascotName}
                      onChange={(e) => setMascotName(e.target.value)}
                      className="rounded-xl text-center text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Để trống để dùng tên mặc định: {PERSONAS[selectedEgg].defaultMascotName}
                    </p>
                  </div>

                  <Button
                    onClick={handleFinish}
                    className="w-full py-3 rounded-2xl font-bold text-lg shadow-fm-md"
                    style={{ background: 'hsl(var(--sky))', color: 'white' }}
                  >
                    Bắt đầu hành trình!
                  </Button>
                </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step !== 'intro' && (
          <div className="flex justify-between mt-5">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
            </Button>

            {stepIndex < STEPS.length - 2 ? (
              <Button
                onClick={goNext}
                disabled={!canNext()}
                className="rounded-xl font-semibold px-6"
                style={{ background: canNext() ? 'hsl(var(--sky))' : undefined, color: canNext() ? 'white' : undefined }}
              >
                Tiếp theo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canNext()}
                className="rounded-xl font-semibold px-6"
                style={{ background: canNext() ? 'hsl(var(--sky))' : undefined, color: canNext() ? 'white' : undefined }}
              >
                Gặp mặt! <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OnboardingCard({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-3xl p-8 shadow-fm-lg space-y-5" style={{ border: '1px solid hsl(var(--border))' }}>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function OptionButton({ label, sublabel, selected, onClick }: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left font-medium text-sm ${
        selected
          ? 'border-sky text-sky bg-sky-light shadow-fm-sm'
          : 'border-border text-foreground hover:border-sky/50 hover:bg-secondary/50'
      }`}
      style={selected ? { borderColor: 'hsl(var(--sky))', color: 'hsl(var(--sky))', background: 'hsl(var(--sky-light))' } : {}}
    >
      <div>
        <div>{label}</div>
        {sublabel && <div className="text-xs opacity-70 mt-0.5">{sublabel}</div>}
      </div>
      {selected && <Check className="w-4 h-4 shrink-0 ml-2" />}
    </button>
  );
}
