export type MenuItem = {
  id: string;
  name: string;
  priceFrom: number;
  durationMin: number;
  description?: string;
  ja: string;
};
export const menus: MenuItem[] = [
  {
    id: "cut",
    name: "CUT",
    ja: "カット",
    priceFrom: 5500,
    durationMin: 60,
    description: "骨格と髪質に合わせたデザインカット",
  },
  {
    id: "color",
    name: "COLOR",
    ja: "カラー",
    priceFrom: 8800,
    durationMin: 90,
    description: "なりたい印象に合わせたカラー",
  },
  {
    id: "bleach",
    name: "BLEACH",
    ja: "ブリーチ",
    priceFrom: 15000,
    durationMin: 120,
    description: "明るさと透明感をつくるベース施術",
  },
  {
    id: "perm",
    name: "PERM",
    ja: "パーマ",
    priceFrom: 9900,
    durationMin: 90,
    description: "自然な動きと質感のデザイン",
  },
  {
    id: "treatment",
    name: "TREATMENT",
    ja: "トリートメント",
    priceFrom: 4400,
    durationMin: 30,
    description: "髪の状態に合わせた集中ケア",
  },
  {
    id: "head-spa",
    name: "HEAD SPA",
    ja: "ヘッドスパ",
    priceFrom: 3300,
    durationMin: 30,
    description: "頭皮ケアとリラクゼーション",
  },
];
export const timeBufferMin = 30;
export const yen = (amount: number) => "¥" + amount.toLocaleString("ja-JP");
export function estimate(ids: string[], nominationFee = 0) {
  const selected = menus.filter((menu) => ids.includes(menu.id));
  return {
    selected,
    total:
      selected.reduce((sum, item) => sum + item.priceFrom, 0) + nominationFee,
    minutes: selected.reduce((sum, item) => sum + item.durationMin, 0),
  };
}
