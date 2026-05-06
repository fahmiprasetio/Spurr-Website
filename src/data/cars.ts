export interface Car {
  id: string;
  name: string;
  brand: string;
  year: number;
  power: string;
  topSpeed: string;
  acceleration: string;
  description: string;
  color: string; // CSS gradient for the car silhouette
  bgGradient: string;
  baseImage?: string; // path inside public/car-image(based)/
  sequenceFolder?: string; // subfolder inside public/car-image(sequences)/
  sequenceCount?: number; // total number of frames
  sequencePrefix?: string; // filename prefix, e.g. "ezgif-frame-"
  sequenceExt?: string; // file extension, e.g. "webp"
}

export const cars: Car[] = [
  {
    id: "porsche-911",
    name: "911 GT3 RS",
    brand: "Porsche",
    year: 2024,
    power: "518 HP",
    topSpeed: "296 km/h",
    acceleration: "3.2s",
    description:
      "The most track-focused 911 ever, with motorsport-derived aerodynamics and a naturally aspirated flat-six.",
    color: "#F59E0B",
    bgGradient: "from-amber-50 to-white",
    baseImage: "porsche-911-gtr.webp",
    sequenceFolder: "porsche 911 sequence",
    sequenceCount: 99,
    sequencePrefix: "ezgif-frame-",
    sequenceExt: "webp",
  },
  {
    id: "bugatti-chiron",
    name: "Chiron Super Sport",
    brand: "Bugatti",
    year: 2024,
    power: "1,578 HP",
    topSpeed: "440 km/h",
    acceleration: "2.4s",
    description:
      "The ultimate expression of speed and luxury with a quad-turbo W16 engine.",
    color: "#1E40AF",
    bgGradient: "from-blue-50 to-white",
    baseImage: "Chiron Super Sport.webp",
    sequenceFolder: "Chiron Super Sport",
    sequenceCount: 31,
    sequencePrefix: "ezgif-frame-",
    sequenceExt: "webp",
  },
  {
    id: "ferrari-sf90",
    name: "SF90 Stradale",
    brand: "Ferrari",
    year: 2024,
    power: "986 HP",
    topSpeed: "340 km/h",
    acceleration: "2.5s",
    description:
      "Ferrari's first series-production plug-in hybrid, combining a twin-turbo V8 with three electric motors.",
    color: "#DC2626",
    bgGradient: "from-red-50 to-white",
    baseImage: "SF90 Stradale.webp",
    sequenceFolder: "SF90 Stradale sequence",
    sequenceCount: 30,
    sequencePrefix: "ezgif-frame-",
    sequenceExt: "webp",
  },
  {
    id: "lamborghini-revuelto",
    name: "Revuelto",
    brand: "Lamborghini",
    year: 2024,
    power: "1,001 HP",
    topSpeed: "350 km/h",
    acceleration: "2.5s",
    description:
      "Lamborghini's first V12 hybrid supercar, the successor to the legendary Aventador.",
    color: "#16A34A",
    bgGradient: "from-green-50 to-white",
  },
  {
    id: "bmw-m4",
    name: "M4 CSL",
    brand: "BMW",
    year: 2024,
    power: "543 HP",
    topSpeed: "307 km/h",
    acceleration: "3.7s",
    description:
      "The most powerful and focused M4 ever, stripped down for pure driving pleasure.",
    color: "#2563EB",
    bgGradient: "from-blue-50 to-white",
  },
  {
    id: "nissan-gtr",
    name: "GT-R Nismo",
    brand: "Nissan",
    year: 2024,
    power: "600 HP",
    topSpeed: "315 km/h",
    acceleration: "2.5s",
    description:
      "Godzilla — the iconic Japanese supercar that humbles exotics costing twice its price.",
    color: "#DC2626",
    bgGradient: "from-red-50 to-white",
  },
  {
    id: "toyota-supra",
    name: "GR Supra",
    brand: "Toyota",
    year: 2024,
    power: "382 HP",
    topSpeed: "250 km/h",
    acceleration: "3.9s",
    description:
      "The legendary nameplate reborn, blending Toyota reliability with pure driving excitement.",
    color: "#0A0A0A",
    bgGradient: "from-gray-50 to-white",
  },
  {
    id: "lexus-lfa",
    name: "LFA",
    brand: "Lexus",
    year: 2012,
    power: "552 HP",
    topSpeed: "325 km/h",
    acceleration: "3.7s",
    description:
      "A masterpiece of engineering with a Yamaha-tuned V10 that revs to 9,000 RPM.",
    color: "#F5F5F5",
    bgGradient: "from-gray-50 to-white",
  },
  {
    id: "pagani-huayra",
    name: "Huayra Roadster BC",
    brand: "Pagani",
    year: 2024,
    power: "791 HP",
    topSpeed: "370 km/h",
    acceleration: "2.8s",
    description:
      "A rolling work of art that combines a Mercedes-AMG twin-turbo V12 with artisanal craftsmanship.",
    color: "#7C3AED",
    bgGradient: "from-purple-50 to-white",
    baseImage: "Huayra Roadster BC.webp",
    sequenceFolder: "huayra roadster bc",
    sequenceCount: 21,
    sequencePrefix: "ezgif-frame-",
    sequenceExt: "webp",
  },
  {
    id: "koenigsegg-jesko",
    name: "Jesko Absolut",
    brand: "Koenigsegg",
    year: 2024,
    power: "1,600 HP",
    topSpeed: "531 km/h",
    acceleration: "2.5s",
    description:
      "Engineered to be the fastest car in the world, with a theoretical top speed over 530 km/h.",
    color: "#EA580C",
    bgGradient: "from-orange-50 to-white",
    baseImage: "Jesko Absolut.webp",
    sequenceFolder: "Jesko Absolut",
    sequenceCount: 29,
    sequencePrefix: "ezgif-frame-",
    sequenceExt: "webp",
  },
  {
    id: "mclaren-p1",
    name: "P1",
    brand: "McLaren",
    year: 2015,
    power: "903 HP",
    topSpeed: "350 km/h",
    acceleration: "2.8s",
    description:
      "One of the holy trinity of hypercars, blending F1 technology with road-car usability.",
    color: "#F97316",
    bgGradient: "from-orange-50 to-white",
    baseImage: "mclaren p1.webp",
    sequenceFolder: "mclaren p1",
    sequenceCount: 32,
    sequencePrefix: "ezgif-frame-",
    sequenceExt: "webp",
  },
  {
    id: "rimac-nevera",
    name: "Nevera",
    brand: "Rimac",
    year: 2024,
    power: "1,914 HP",
    topSpeed: "412 km/h",
    acceleration: "1.85s",
    description:
      "An all-electric hypercar delivering instant torque and record-breaking performance.",
    color: "#0EA5E9",
    bgGradient: "from-sky-50 to-white",
    baseImage: "Rimac Nevera.webp",
    sequenceFolder: "Rimac Nevera",
    sequenceCount: 32,
    sequencePrefix: "ezgif-frame-",
    sequenceExt: "webp",
  },
  {
    id: "aston-martin-valkyrie",
    name: "Valkyrie",
    brand: "Aston Martin",
    year: 2024,
    power: "1,139 HP",
    topSpeed: "402 km/h",
    acceleration: "2.5s",
    description:
      "Designed with Red Bull Racing's Adrian Newey, pushing the limits of what a road car can be.",
    color: "#065F46",
    bgGradient: "from-emerald-50 to-white",
  },
];

export const brands = [
  { name: "Ferrari", country: "Italy", founded: 1939, logo: "🏎️" },
  { name: "Bugatti", country: "France", founded: 1909, logo: "🏁" },
  { name: "Porsche", country: "Germany", founded: 1931, logo: "🏎️" },
  { name: "Lamborghini", country: "Italy", founded: 1963, logo: "🐂" },
  { name: "BMW", country: "Germany", founded: 1916, logo: "🏎️" },
  { name: "Nissan", country: "Japan", founded: 1933, logo: "🏎️" },
  { name: "Toyota", country: "Japan", founded: 1937, logo: "🏎️" },
  { name: "Lexus", country: "Japan", founded: 1989, logo: "🏎️" },
  { name: "Pagani", country: "Italy", founded: 1992, logo: "🏎️" },
  { name: "Koenigsegg", country: "Sweden", founded: 1994, logo: "👑" },
  { name: "McLaren", country: "UK", founded: 1963, logo: "🏎️" },
  { name: "Rimac", country: "Croatia", founded: 2009, logo: "⚡" },
  { name: "Aston Martin", country: "UK", founded: 1913, logo: "🏎️" },
];
