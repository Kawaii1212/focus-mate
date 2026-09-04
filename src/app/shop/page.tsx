"use client";

import React, { useState } from 'react';
import { useApp, useMascot } from '@/store/AppContext';
import { SHOP_ITEMS, PERSONAS } from '@/lib/mascotData';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, Zap, Lock, Check, Coffee, HardHat, Gem, Sofa, Flower, Palette, Sparkles, Shield, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MascotSVG from '@/components/mascot/MascotSVG';
import SpeechBubble from '@/components/mascot/SpeechBubble';
import { getRandomSpeech } from '@/lib/mascotData';

const CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'snack', label: 'Đồ ăn' },
  { value: 'hat', label: 'Mũ' },
  { value: 'accessory', label: 'Phụ kiện' },
  { value: 'furniture', label: 'Nội thất' },
  { value: 'decor', label: 'Trang trí' },
  { value: 'theme', label: 'Theme' },
  { value: 'skin', label: 'Skin' },
  { value: 'streak-shield', label: 'Shield' },
];

export default function ShopPage() {
  const { state, dispatch } = useApp();
  const mascot = useMascot();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState('all');
  const [requestingItem, setRequestingItem] = useState<string | null>(null);

  const filteredItems = SHOP_ITEMS.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  const handleBuy = (item: typeof SHOP_ITEMS[0]) => {
    if (!mascot) return;
    if (mascot.coin < item.price) {
      toast({ title: 'Không đủ coin!', description: `Bạn cần thêm ${item.price - mascot.coin} coin.`, variant: 'destructive' });
      return;
    }
    if (state.ownedItems.includes(item.id)) {
      toast({ title: 'Đã sở hữu!', description: 'Bạn đã có item này rồi.' });
      return;
    }
    dispatch({ type: 'BUY_ITEM', payload: { itemId: item.id, price: item.price } });

    if (item.category === 'streak-shield') {
      const shields = item.id === 's12' ? 1 : 3;
      dispatch({ type: 'ADD_STREAK_SHIELD', payload: shields });
    }

    toast({ title: 'Mua thành công!', description: `${item.name} đã được thêm vào bộ sưu tập của bạn.` });
  };

  const handleMascotRequest = (itemId: string) => {
    setRequestingItem(itemId === requestingItem ? null : itemId);
  };

  const requestSpeech = mascot ? getRandomSpeech(mascot.personaId, 'itemRequest') : '';
  const persona = mascot ? PERSONAS[mascot.personaId] : null;

  return (
    <AppLayout mascotState={requestingItem ? 'itemRequest' : 'idle'}>
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" style={{ color: 'hsl(var(--sky))' }} />
              Cửa hàng
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Mua đồ cho mascot của bạn</p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold"
            style={{ background: 'hsl(var(--butter) / 0.2)' }}
          >
            <Zap className="w-4 h-4" style={{ color: 'hsl(var(--butter))' }} />
            <span className="text-foreground">{mascot?.coin ?? 0} coin</span>
          </div>
        </div>

        {/* Mascot request panel */}
        {requestingItem && mascot && (
          <div
            className="flex items-center gap-4 p-4 rounded-2xl animate-slide-in-up"
            style={{ background: `${persona?.colors.primary}15`, border: `1px solid ${persona?.colors.primary}40` }}
          >
            <MascotSVG personaId={mascot.personaId} stage={mascot.stage} mascotState="itemRequest" size={70} animate />
            <SpeechBubble text={requestSpeech} />
          </div>
        )}

        {/* Category tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex-wrap h-auto gap-1 rounded-xl p-1">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value} className="rounded-lg text-xs">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <div className="grid grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const owned = state.ownedItems.includes(item.id);
                const canAfford = (mascot?.coin ?? 0) >= item.price;
                const isRequesting = requestingItem === item.id;

                return (
                  <Card
                    key={item.id}
                    className="rounded-2xl shadow-fm-sm overflow-hidden hover:shadow-fm-md transition-all"
                    style={isRequesting ? { border: `2px solid ${persona?.colors.primary}` } : {}}
                  >
                    <CardContent className="p-0">
                      {/* Item visual */}
                      <div
                        className="h-28 flex items-center justify-center relative"
                        style={{ background: item.isPremium ? 'hsl(var(--lavender))' : 'hsl(var(--secondary))' }}
                      >
                        {item.isPremium && (
                          <Badge className="absolute top-2 right-2 text-xs" style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                            Premium
                          </Badge>
                        )}
                        {owned && (
                          <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--sky))' }}>
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className="w-12 h-12 flex items-center justify-center" style={{ color: item.isPremium ? 'hsl(var(--lilac))' : 'hsl(var(--sky))' }}>
                          {item.category === 'snack' ? <Coffee className="w-10 h-10" /> :
                           item.category === 'hat' ? <HardHat className="w-10 h-10" /> :
                           item.category === 'accessory' ? <Gem className="w-10 h-10" /> :
                           item.category === 'furniture' ? <Sofa className="w-10 h-10" /> :
                           item.category === 'decor' ? <Flower className="w-10 h-10" /> :
                           item.category === 'theme' ? <Palette className="w-10 h-10" /> :
                           item.category === 'skin' ? <Sparkles className="w-10 h-10" /> :
                           <Shield className="w-10 h-10" />}
                        </div>
                      </div>

                      <div className="p-3 space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            {item.isPremium ? (
                              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" style={{ color: 'hsl(var(--butter))' }} />
                            )}
                            <span className="text-sm font-bold text-foreground">{item.price}</span>
                          </div>

                          {!owned && !item.isPremium && (
                            <button
                              onClick={() => handleMascotRequest(item.id)}
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center"
                              title="Xin mascot"
                            >
                              <Heart className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className="w-full rounded-xl text-xs"
                          onClick={() => handleBuy(item)}
                          disabled={item.isPremium || owned}
                          style={
                            owned
                              ? { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                              : item.isPremium
                              ? {}
                              : !canAfford
                              ? { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                              : { background: 'hsl(var(--sky))', color: 'white' }
                          }
                        >
                          {owned ? 'Đã có' : item.isPremium ? <><Lock className="w-3 h-3 mr-1 inline" /> Premium</> : !canAfford ? 'Thiếu coin' : 'Mua'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
