export interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description: string;
  tags: string[];
  category: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "시그니처 플래너",
    description: "[#🔥갓생🔥 #오차없는시간관리] 시간도둑 잡는, 10분 계획 위클리 플래너 세트 (4colors) 👑💖🎀",
    price: 12000,
    image_url: "/products/planner.jpg",
    tags: ["갓생", "시간관리", "위클리"],
    category: "Stationery",
  },
  {
    id: 2,
    name: "스터디용 타이머",
    description: "[#인스타감성📸 #뽀모도로꿀템⏱️] 미니멀 디자인, 무소음 집중력 강화 스마트 타이머 (3colors) 🚀💫✨",
    price: 9900,
    image_url: "/products/timer.jpg",
    tags: ["뽀모도로", "집중력", "스마트"],
    category: "Tech",
  },
  {
    id: 3,
    name: "굿노트/디지털 플래너",
    description: "[#아이패드필수💻 #깔끔함1등💯] 굿노트 전용! 하이퍼링크 탑재 갓생 속지 파일 (4ver.) 📝💖💡",
    price: 5000,
    image_url: "/products/digital-planner.jpg",
    tags: ["아이패드", "굿노트", "디지털"],
    category: "Digital",
  },
  {
    id: 4,
    name: "스터디 간식 키트",
    description: "[#시험기간구원🚨 #에너지급속충전⚡] 집중력 UP! 뇌가 좋아하는 큐레이션 간식 박스 (월별한정) 🍪🍬💪",
    price: 15900,
    image_url: "/products/snack-kit.jpg",
    tags: ["시험기간", "에너지", "간식"],
    category: "Food",
  },
  {
    id: 5,
    name: "계획/습관 포스터",
    description: "[#내방꾸미기🖼️ #인증샷맛집🌟] 목표달성 스티커 함께 증정! 위클리 습관 기록 대형 포스터 (A2/A3) 📌💖🎁",
    price: 8500,
    image_url: "/products/poster.jpg",
    tags: ["방꾸미기", "습관기록", "포스터"],
    category: "Living",
  },
];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("ko-KR").format(price) + "원";
};
