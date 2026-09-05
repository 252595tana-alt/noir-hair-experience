import { styles } from "./styles";
export type Stylist = {
  id: string;
  slug: string;
  name: string;
  role: string;
  specialties: string[];
  instagram?: string;
  image: string;
  styleIds: string[];
  nominationFee?: number;
  speciality: string;
  initials: string;
};
const people = [
  {
    id: "takuya",
    name: "TAKUYA",
    role: "CREATIVE DIRECTOR",
    specialties: ["骨格に寄り添うレイヤー", "ウルフカット"],
    nominationFee: 1100,
  },
  {
    id: "yuki",
    name: "YUKI",
    role: "COLOR SPECIALIST",
    specialties: ["透明感カラー", "ブリーチデザイン"],
    nominationFee: 550,
  },
  {
    id: "ren",
    name: "REN",
    role: "HAIR DESIGNER",
    specialties: ["ニュアンスパーマ", "ショートデザイン"],
    nominationFee: 0,
  },
];
export const stylists: Stylist[] = people.map((person) => ({
  ...person,
  slug: person.id,
  initials: person.name[0],
  speciality: person.specialties.join(" / "),
  image: "/images/stylist-" + person.id + ".svg",
  styleIds: styles
    .filter((style) => style.stylistId === person.id)
    .map((style) => style.id),
}));
export const stylistById = (id: string | null) =>
  stylists.find((person) => person.id === id);
