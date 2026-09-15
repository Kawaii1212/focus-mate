"use client";

import React, { useState } from 'react';
import { useApp, useMascot } from '@/store/AppContext';
import { SHOP_ITEMS, PERSONAS } from '@/lib/mascotData';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PackageOpen, Coffee, HardHat, Gem, Sofa, Flower, Palette, Sparkles, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MascotSVG from '@/components/mascot/MascotSVG';
import SpeechBubble from '@/components/mascot/SpeechBubble';

const CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'snack', label: 'Đồ ăn' },
  { value: 'hat', label: 'Mũ' },
  { value: 'accessory', label: 'Phụ kiện' },
  { value: 'furniture', label: 'Nội thất' },
  { value: 'decor', label: 'Trang trí' },
  { value: 'theme', label: 'Theme' },
  { value: 'skin', label: 'Skin' },
];

export default function InventoryPage() {
  const { state } = useApp();
  const mascot = useMascot();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState('all');
  const [usingItem, setUsingItem] = useState<string | null>(null);

  // Filter items that the user actually owns
  const ownedItemsData = SHOP_ITEMS.filter((item) => state.ownedItems.includes(item.id));

  // Further filter by category
  const filteredItems = ownedItemsData.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  const persona = mascot ? PERSONAS[mascot.personaId] : null;

  const handleUseItem = (item: typeof SHOP_ITEMS[0]) => {
    setUsingItem(item.id);
    
    // Simulate using or equipping the item
    let actionText = "Đã trang bị";
    if (item.category === 'snack') {
      actionText = "Đã cho ăn";
    }

    toast({
      title: 'Thành công!',
      description: `${actionText} ${item.name} cho mascot.`,
    });

    // Reset animation state after a short delay
    setTimeout(() => {
      setUsingItem(null);
    }, 2500);
  };

  return (
    <AppLayout mascotState={usingItem ? 'happy' : 'idle'}>
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <PackageOpen className="w-6 h-6" style={{ color: 'hsl(var(--sky))' }} />
              Tủ đồ
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">Sử dụng và trang bị các vật phẩm bạn đã mua</p>
          </div>
        </div>

        {/* Mascot reaction panel when using item */}
        {usingItem && mascot && (
          <div
            className="flex items-center gap-4 p-4 rounded-2xl animate-slide-in-up"
            style={{ background: `${persona?.colors.primary}15`, border: `1px solid ${persona?.colors.primary}40` }}
          >
            <MascotSVG personaId={mascot.personaId} stage={mascot.stage} mascotState="happy" size={70} animate />
            <SpeechBubble text="Thích quá đi! Cảm ơn bạn nha!" />
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
            {ownedItemsData.length === 0 ? (
              <div className="text-center py-12">
                <PackageOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Tủ đồ trống</h3>
                <p className="text-muted-foreground text-sm">Bạn chưa có vật phẩm nào. Hãy ghé Cửa hàng để mua sắm nhé!</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Không có vật phẩm nào trong danh mục này.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                  const isUsing = usingItem === item.id;

                  return (
                    <Card
                      key={item.id}
                      className="rounded-2xl shadow-fm-sm overflow-hidden hover:shadow-fm-md transition-all"
                      style={isUsing ? { border: `2px solid ${persona?.colors.primary}` } : {}}
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

                        <div className="p-3 space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>

                          <Button
                            size="sm"
                            className="w-full rounded-xl text-xs"
                            onClick={() => handleUseItem(item)}
                            disabled={isUsing}
                            style={{ background: 'hsl(var(--sky))', color: 'white' }}
                          >
                            {isUsing ? 'Đang dùng...' : item.category === 'snack' ? 'Cho ăn' : 'Sử dụng'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
