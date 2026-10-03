import { PrismaClient, Category, ProductStatus, Role, LeadSource, LeadStage } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const toKobo = (naira: number) => Math.round(naira * 100);

type SeedProduct = {
  name: string;
  subtitle: string;
  description: string;
  category: Category;
  fabric: string;
  colourways: string[];
  sizes: string[];
  styleCode: string;
  retail: number;
  wholesale: number;
  wholesaleMinQty?: number;
  compareAt?: number;
  stock: number;
  featured?: boolean;
  tags: string[];
  bespoke?: boolean;
  images: string[];
};

const PRODUCTS: SeedProduct[] = [
  {
    name: "Iwe Royal Gown",
    subtitle: "Floor-length beaded occasion gown",
    description:
      "Our signature royal blue gown. Cut on the bias so it skims the body rather than clinging, with a hand-beaded bodice worked panel by panel in our Yenagoa workshop. Fully lined, concealed side zip, and a train detachable with hooks so you can change the look in seconds. Built for weddings, engagements and naming ceremonies.",
    category: "DRESSES",
    fabric: "Silk-lace blend with hand-applied glass beads",
    colourways: ["Royal Blue", "Deep Wine", "Emerald"],
    sizes: ["UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "Custom"],
    styleCode: "PSL-IW-001",
    retail: 285_000,
    wholesale: 168_000,
    compareAt: 320_000,
    stock: 24,
    featured: true,
    tags: ["signature", "bridal-adjacent", "beaded", "bestseller"],
    images: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&q=80",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80",
    ],
  },
  {
    name: "Buchi Aso-Eke Two-Piece",
    subtitle: "Iro, buba and gele starter set",
    description:
      "The complete traditional outfit for a wedding guest or the bride's family. Crisp handwoven aso-oke, tailored buba with mother-of-pearl buttons, and a matching gele that holds a pleat all day. Sold as a set so nothing has to be sourced separately.",
    category: "TWO_PIECE",
    fabric: "Handwoven aso-oke with silk blend",
    colourways: ["Gold & Royal Blue", "Ivory & Gold", "Wine & Gold"],
    sizes: ["S/M", "L/XL", "XXL", "Custom"],
    styleCode: "PSL-BU-002",
    retail: 165_000,
    wholesale: 98_000,
    stock: 40,
    featured: true,
    tags: ["aso-oke", "wedding", "traditional"],
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80",
      "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1200&q=80",
    ],
  },
  {
    name: "Yenagoa Bouye Capsule",
    subtitle: "Off-shoulder bouye two-piece",
    description:
      "Bouye is the fabric everyone photographs, and this is our cleanest cut of it. Off-shoulder bodice, structured peplum at the waist, and a skirt with enough weight to hold its shape while you dance. One of our most reordered wholesale pieces.",
    category: "CAPSULES",
    fabric: "Stiff silk bouye",
    colourways: ["Royal Blue", "Coral", "Butter Yellow"],
    sizes: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "Custom"],
    styleCode: "PSL-YN-003",
    retail: 210_000,
    wholesale: 124_000,
    stock: 32,
    featured: true,
    tags: ["bouye", "capsule", "restock"],
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&q=80",
      "https://images.unsplash.com/photo-1529900748604-07564a03e7f6?w=1200&q=80",
    ],
  },
  {
    name: "Chidi Senator Three-Piece",
    subtitle: "Senator style shirt, senator trouser, cap",
    description:
      "Sharp enough for a boardroom and traditional enough for a chief's visit. The senator shirt has a structured collar that holds its shape after washing, and the trouser has a clean break with no flare. Sold as a complete three-piece.",
    category: "THREE_PIECE",
    fabric: "Fine cotton twill",
    colourways: ["Royal Blue", "White", "Charcoal", "Sand"],
    sizes: ["UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "Custom"],
    styleCode: "PSL-CD-004",
    retail: 98_000,
    wholesale: 57_000,
    stock: 65,
    featured: true,
    tags: ["men", "senator", "three-piece"],
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=80",
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&q=80",
    ],
  },
  {
    name: "Amina Lace Midi",
    subtitle: "Fit-and-flare lace midi dress",
    description:
      "The one people ask for by name. All-over French lace with a fitted bodice and a controlled flare below the hip. Fully lined in silk so there is no see-through, which is the reason most of our customers pick it.",
    category: "DRESSES",
    fabric: "French lace over silk lining",
    colourways: ["Royal Blue", "Black", "Dusty Rose"],
    sizes: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16"],
    styleCode: "PSL-AM-005",
    retail: 145_000,
    wholesale: 84_000,
    stock: 28,
    tags: ["lace", "bestseller", "everyday-luxury"],
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80",
    ],
  },
  {
    name: "Adire Indigo Shirt Dress",
    subtitle: "Stitched plain shirt dress",
    description:
      "Kente-stitched Adire on a classic shirt dress block. Cut generously through the body with a proper sleeve, so it works for work, for church and for a market run. Indigo is dyed in small batches, so patterns vary slightly between pieces.",
    category: "DRESSES",
    fabric: "Adire cotton",
    colourways: ["Indigo", "Faded Indigo"],
    sizes: ["UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18"],
    styleCode: "PSL-AD-006",
    retail: 62_000,
    wholesale: 34_000,
    stock: 75,
    tags: ["adire", "everyday", "ready-stock"],
    images: [
      "https://images.unsplash.com/photo-1485462537746-965f33f7f6a3?w=1200&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&q=80",
    ],
  },
  {
    name: "Zainab Cape Jumpsuit",
    subtitle: "Floor-length cape over a tailored jumpsuit",
    description:
      "A cape that transforms a plain jumpsuit into an entrance piece. The cape is detachable, so you wear it for the photographs and take it off for the dancing. Tailored through the body with a wide leg and a high waist.",
    category: "OUTERWEAR",
    fabric: "Crepe with satin lining",
    colourways: ["Royal Blue", "Black", "Gold"],
    sizes: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14"],
    styleCode: "PSL-ZA-007",
    retail: 175_000,
    wholesale: 102_000,
    stock: 18,
    featured: true,
    tags: ["cape", "evening", "statement"],
    images: [
      "https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?w=1200&q=80",
      "https://images.unsplash.com/photo-1548624149-f6c27d5e5b47?w=1200&q=80",
    ],
  },
  {
    name: "Amina Evening Jumpsuit",
    subtitle: "Wide-leg satin evening jumpsuit",
    description:
      "Wide leg, high waist, deep neckline. Cut to skim rather than cling so it stays flattering through an evening. Fully lined, with covered buttons at the back so nothing catches on the seat.",
    category: "TWO_PIECE",
    fabric: "Duchess satin",
    colourways: ["Royal Blue", "Emerald", "Black"],
    sizes: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16"],
    styleCode: "PSL-AN-008",
    retail: 132_000,
    wholesale: 77_000,
    stock: 30,
    tags: ["evening", "satin"],
    images: [
      "https://images.unsplash.com/photo-1551803091-e20673f15770?w=1200&q=80",
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=1200&q=80",
    ],
  },
  {
    name: "Okrika Wrap Skirt & Blouse",
    subtitle: "Wax-print wrap skirt with matching blouse",
    description:
      "A wrap skirt cut on a true bias so it falls in soft folds, with a blouse that is fitted through the waist and roomy at the shoulder. Wax print is chosen by the metre, so the pattern on your piece will be close to, but not identical with, the photographs.",
    category: "TWO_PIECE",
    fabric: "Quality wax print",
    colourways: ["Royal Blue Wax", "Gold Wax", "Green Wax"],
    sizes: ["UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18"],
    styleCode: "PSL-OK-009",
    retail: 78_000,
    wholesale: 44_000,
    stock: 88,
    tags: ["wax", "everyday", "value"],
    images: [
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1200&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80",
    ],
  },
  {
    name: "Rita Occasion Gown",
    subtitle: "Structured occasion gown with corsetry",
    description:
      "A gown with real structure: boned bodice, internal corset belt, and a skirt panel that opens for movement. Made for brides' mothers and for anyone who wants a silhouette that holds all evening. Comes with our fitting session included.",
    category: "DRESSES",
    fabric: "Crepe with boned bodice",
    colourways: ["Royal Blue", "Burgundy", "Emerald"],
    sizes: ["UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "Custom"],
    styleCode: "PSL-RI-010",
    retail: 340_000,
    wholesale: 205_000,
    stock: 12,
    featured: true,
    tags: ["gown", "corsetry", "fitting-included"],
    images: [
      "https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=1200&q=80",
      "https://images.unsplash.com/photo-1502716119720-b23a1e3b9d0f?w=1200&q=80",
    ],
  },
  {
    name: "Efe Beaded Kaftan",
    subtitle: "Kaftan with hand-beaded yoke",
    description:
      "A long kaftan with a hand-beaded yoke that takes a full day to complete by hand. Cut loose through the body with a generous sleeve, worn over a base and trousers in the traditional way.",
    category: "DRESSES",
    fabric: "Crepe with glass beadwork",
    colourways: ["Royal Blue", "Ivory", "Rose Gold"],
    sizes: ["S/M", "L/XL", "XXL", "Custom"],
    styleCode: "PSL-EF-011",
    retail: 195_000,
    wholesale: 116_000,
    stock: 22,
    tags: ["kaftan", "beaded", "traditional"],
    images: [
      "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=1200&q=80",
      "https://images.unsplash.com/photo-1611073767359-0f51e0b8e0a4?w=1200&q=80",
    ],
  },
  {
    name: "Comfort Khadi Set",
    subtitle: "Unisex khadi two-piece",
    description:
      "Our everyday line. Khadi, a breathable handwoven cotton, cut into a relaxed shirt and wide trouser. This is the piece our own team wears to work, and the one we recommend for anyone starting a boutique because it moves fast.",
    category: "TWO_PIECE",
    fabric: "Handwoven khadi cotton",
    colourways: ["Natural", "Indigo", "Royal Blue"],
    sizes: ["UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18", "UK 20"],
    styleCode: "PSL-CM-012",
    retail: 48_000,
    wholesale: 26_000,
    stock: 120,
    tags: ["khadi", "unisex", "everyday", "fast-moving"],
    images: [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80",
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200&q=80",
    ],
  },
  {
    name: "Zuri Corset & Skirt Set",
    subtitle: "Structured corset paired with column skirt",
    description:
      "A boned corset with a matching column skirt that falls straight to the ankle. Made for the woman who wants a silhouette without a full gown. Lace-up or concealed zip at the back, your choice.",
    category: "TWO_PIECE",
    fabric: "Duchess satin with boning",
    colourways: ["Royal Blue", "Black", "Wine"],
    sizes: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14"],
    styleCode: "PSL-ZU-013",
    retail: 158_000,
    wholesale: 92_000,
    stock: 20,
    tags: ["corset", "structured", "evening"],
    images: [
      "https://images.unsplash.com/photo-1585488434455-1e7b6b53ad9c?w=1200&q=80",
      "https://images.unsplash.com/photo-1542295669-4a0d0e5cdb95?w=1200&q=80",
    ],
  },
  {
    name: "Fatima Prayer Set",
    subtitle: "Modest long-sleeve two-piece",
    description:
      "A long-sleeve blouse with a full-length skirt, cut loose and lined. Modest without looking severe, and the cut is generous through the arms so you can pray and move freely. Often bought alongside the kaftan.",
    category: "TWO_PIECE",
    fabric: "Soft crepe",
    colourways: ["Royal Blue", "Black", "Sand", "Dusty Lilac"],
    sizes: ["UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18"],
    styleCode: "PSL-FT-014",
    retail: 88_000,
    wholesale: 51_000,
    stock: 44,
    tags: ["modest", "long-sleeve", "everyday"],
    images: [
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1200&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80",
    ],
  },
  {
    name: "Community Gele & Shawl",
    subtitle: "Hand-pleated gele with matching shawl",
    description:
      "Hand-pleated by a team in Bayelsa, and stiff enough to hold a fold for a full wedding without collapsing. Comes with a matching hand-tied shawl. Sold individually or as an add-on to any kaftan order.",
    category: "ACCESSORIES",
    fabric: "Pleated silk blend",
    colourways: ["Royal Blue", "Gold", "Ivory", "Rose Gold"],
    sizes: ["One size"],
    styleCode: "PSL-CM-015",
    retail: 72_000,
    wholesale: 38_000,
    stock: 36,
    tags: ["gele", "accessory", "hand-pleated", "upsell"],
    images: [
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=1200&q=80",
      "https://images.unsplash.com/photo-1595475207225-428b62bda831?w=1200&q=80",
    ],
  },
  {
    name: "Bespoke Commission",
    subtitle: "Cut and stitched to your measurements",
    description:
      "Our flagship service. You bring the occasion, the fabric or let us source it, and your measurements. We make a toile, you approve the fit, and we cut the final in the real fabric. Includes a fitting session in Yenagoa or measurements taken by a trusted tailor anywhere in the world. From NGN 180,000 depending on fabric and beadwork.",
    category: "CUSTOM_BESPOKE",
    fabric: "Your choice, or we source it",
    colourways: ["Any"],
    sizes: ["Made to measure"],
    styleCode: "PSL-BS-000",
    retail: 180_000,
    wholesale: 180_000,
    wholesaleMinQty: 1,
    stock: 999,
    bespoke: true,
    tags: ["bespoke", "made-to-measure", "flagship", "service"],
    images: [
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80",
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=1200&q=80",
    ],
  },
];

const LEADS = [
  {
    fullName: "Adaeze Okonkwo",
    phone: "08031234567",
    email: "adaeze@example.com",
    city: "Port Harcourt",
    state: "Rivers",
    source: LeadSource.INSTAGRAM,
    stage: LeadStage.QUALIFIED,
    interestedIn: "Iwe Royal Gown for a December wedding",
    budgetRange: "NGN 250,000 - 400,000",
    timeline: "Buying this month",
    orderValueEstimate: toKobo(320_000),
    notes:
      "Wants the royal blue in a size UK 14. Asked whether we can deliver to Port Harcourt before 20 December. Sending a quote.",
    tags: ["bridal party", "referral"],
    ageDays: 6,
  },
  {
    fullName: "Bisi Afolayan",
    phone: "08097654321",
    email: "bisi@example.com",
    city: "Yenagoa",
    state: "Bayelsa",
    source: LeadSource.WHATSAPP,
    stage: LeadStage.NEGOTIATION,
    interestedIn: "Comfort Khadi Set x 12 for her boutique",
    budgetRange: "NGN 250,000 - 400,000",
    timeline: "This week",
    orderValueEstimate: toKobo(312_000),
    notes:
      "Boutique owner in Yenagoa. Wants to start with 12 pieces mixed across sizes. Negotiating 10 units to unlock wholesale on a first order.",
    tags: ["wholesale", "repeat", "high value"],
    ageDays: 11,
  },
  {
    fullName: "Chiamaka Nwosu",
    phone: "08123456789",
    email: "chiamaka@example.com",
    city: "Lagos",
    state: "Lagos",
    source: LeadSource.WEBSITE,
    stage: LeadStage.PROPOSAL_SENT,
    interestedIn: "Zainab Cape Jumpsuit",
    budgetRange: "NGN 100,000 - 150,000",
    timeline: "Within 2 weeks",
    orderValueEstimate: toKobo(175_000),
    notes: "Asked about delivery to Lagos and whether the cape detaches. Quote sent 4 days ago.",
    tags: ["lagos", "shipping"],
    ageDays: 4,
  },
  {
    fullName: "Hauwa Yusuf",
    phone: "07011223344",
    email: "hauwa@example.com",
    city: "Abuja",
    state: "FCT",
    source: LeadSource.REFERRAL,
    stage: LeadStage.CONTACTED,
    interestedIn: "Fatima Prayer Set x 2",
    budgetRange: "Under NGN 150,000",
    timeline: "This month",
    orderValueEstimate: toKobo(176_000),
    notes: "Referred by Adaeze. Wants modest pieces for her sisters.",
    tags: ["referral"],
    ageDays: 2,
  },
  {
    fullName: "Tunde Bakare",
    phone: "08155556666",
    email: "tunde@example.com",
    city: "Warri",
    state: "Delta",
    source: LeadSource.FACEBOOK,
    stage: LeadStage.NEW,
    interestedIn: "Chidi Senator Three-Piece x 3",
    budgetRange: "NGN 250,000 - 400,000",
    timeline: "Now",
    orderValueEstimate: toKobo(294_000),
    notes: "Came through a Facebook ad this morning. Has not been contacted.",
    tags: ["men", "urgent"],
    ageDays: 0,
  },
  {
    fullName: "Grace Eze",
    phone: "08190909090",
    email: "grace@example.com",
    city: "Enugu",
    state: "Enugu",
    source: LeadSource.MARKET,
    stage: LeadStage.NEW,
    interestedIn: "Amina Lace Midi",
    budgetRange: "NGN 100,000 - 150,000",
    timeline: "Within 2 weeks",
    orderValueEstimate: toKobo(145_000),
    notes: "Walked in during the New Culture market. Left her number for a call back.",
    tags: ["walk-in"],
    ageDays: 1,
  },
  {
    fullName: "Omolara Adeyemi",
    phone: "08044445555",
    email: "omolara@example.com",
    city: "Ibadan",
    state: "Oyo",
    source: LeadSource.INSTAGRAM,
    stage: LeadStage.WON,
    interestedIn: "Rita Occasion Gown",
    budgetRange: "Above NGN 400,000",
    timeline: "Buying now",
    orderValueEstimate: toKobo(340_000),
    notes: "Bought the Rita gown. Requested a fitting for her mother's dress next month.",
    tags: ["vip", "aftercare", "referral opportunity"],
    ageDays: 22,
  },
  {
    fullName: "Ibrahim Sule",
    phone: "08066778899",
    email: "ibrahim@example.com",
    city: "Kano",
    state: "Kano",
    source: LeadSource.WHATSAPP,
    stage: LeadStage.LOST,
    interestedIn: "Comfort Khadi Set x 6",
    budgetRange: "NGN 100,000 - 150,000",
    timeline: "This month",
    orderValueEstimate: toKobo(156_000),
    notes: "Went quiet after the quote. Said the delivery cost to Kano was too high.",
    tags: ["lost", "delivery cost"],
    ageDays: 34,
  },
];

const RETAILERS = [
  {
    email: "bisi@afolayanboutique.com",
    fullName: "Bisi Afolayan",
    phone: "08097654321",
    businessName: "Afolayan Boutique",
    businessType: "Boutique",
    shopAddress: "14 Isaac Boro Road, Yenagoa",
    city: "Yenagoa",
    state: "Bayelsa",
    yearsInBusiness: 6,
    monthlyVolume: "40 - 80 pieces",
    categories: ["DRESSES", "TWO_PIECE", "CAPSULES"],
    discountPercent: 20,
    status: "APPROVED" as const,
    note: "Long-standing repeat buyer. Started as retail, now orders wholesale monthly.",
  },
  {
    email: "orders@zuriandsons.com",
    fullName: "Kelechi Uche",
    phone: "07022334455",
    businessName: "Zuri & Sons Collections",
    businessType: "Online store",
    shopAddress: "22 Awolowo Road, Ikoyi",
    city: "Lagos",
    state: "Lagos",
    yearsInBusiness: 3,
    monthlyVolume: "80 - 150 pieces",
    categories: ["CAPSULES", "DRESSES", "ACCESSORIES"],
    discountPercent: 25,
    status: "APPROVED" as const,
    note: "Ships nationwide from Lagos. Wants fast-moving bouye and everyday pieces.",
  },
  {
    email: "grace@enugugracefashions.com",
    fullName: "Grace Eze",
    phone: "08190909090",
    businessName: "Grace Fashions Enugu",
    businessType: "Boutique",
    shopAddress: "9 New Haven Road",
    city: "Enugu",
    state: "Enugu",
    yearsInBusiness: 9,
    monthlyVolume: "20 - 40 pieces",
    categories: ["TWO_PIECE", "THREE_PIECE"],
    discountPercent: 20,
    status: "PENDING" as const,
    note: "Long-running boutique, applying for wholesale prices for the first time.",
  },
  {
    email: "kemi@tailoringhub.ng",
    fullName: "Kemi Adebayo",
    phone: "08055556666",
    businessName: "Tailoring Hub NG",
    businessType: "Tailoring service",
    shopAddress: "3 Alausa Street, Ikeja",
    city: "Lagos",
    state: "Lagos",
    yearsInBusiness: 1,
    monthlyVolume: "Under 20 pieces",
    categories: ["CUSTOM_BESPOKE"],
    discountPercent: 15,
    status: "PENDING" as const,
    note: "New tailoring service. Mostly wants to buy fabric-ready panels and custom pieces.",
  },
];

async function main() {
  console.log("Seeding Patience Sewing Ltd ...");

  // --- settings ------------------------------------------------------------
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "Patience Sewing Ltd",
      tagline: "Bespoke Nigerian fashion, cut and stitched to measure",
      whatsappNumber: "2348000000000",
      supportEmail: "hello@patiencesewing.com",
      supportPhone: "+234 800 000 0000",
      instagramHandle: "@patiencesewing",
      facebookUrl: "https://facebook.com/patiencesewing",
      deliveryFee: toKobo(1_500),
      freeDeliveryThreshold: toKobo(20_000),
      bankName: "Patience Sewing Ltd",
      bankAccountNumber: "0123456789",
      bankAccountName: "Patience Sewing Ltd",
    },
  });

  // --- users ---------------------------------------------------------------
  // Demo accounts use published, weak passwords. Refuse to create them against a
  // production database so a seeded admin password can never reach a live site.
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && process.env.SEED_DEMO_ACCOUNTS !== "true") {
    throw new Error(
      "Refusing to seed demo accounts into production. Set SEED_DEMO_ACCOUNTS=true only on a " +
        "disposable database, or create your admin user directly.",
    );
  }
  if (isProduction) {
    console.warn("WARNING: seeding demo accounts into production because SEED_DEMO_ACCOUNTS=true.");
  }

  const adminPassword = await bcrypt.hash("admin1234", 12);
  const retailerPassword = await bcrypt.hash("retailer1234", 12);
  const customerPassword = await bcrypt.hash("customer1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@patiencesewing.com" },
    update: {},
    create: {
      email: "admin@patiencesewing.com",
      passwordHash: adminPassword,
      fullName: "Patience Okai",
      phone: "08000000001",
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "retailer@patiencesewing.com" },
    update: {},
    create: {
      email: "retailer@patiencesewing.com",
      passwordHash: retailerPassword,
      fullName: "Bisi Afolayan",
      phone: "08097654321",
      role: Role.RETAILER,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: customerPassword,
      fullName: "Adaeze Okonkwo",
      phone: "08031234567",
      role: Role.CUSTOMER,
    },
  });

  // --- retailer profiles ---------------------------------------------------
  for (const r of RETAILERS) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        passwordHash: retailerPassword,
        fullName: r.fullName,
        phone: r.phone,
        role: Role.RETAILER,
      },
    });

    await prisma.retailerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: r.businessName,
        businessType: r.businessType,
        shopAddress: r.shopAddress,
        city: r.city,
        state: r.state,
        yearsInBusiness: r.yearsInBusiness,
        monthlyVolume: r.monthlyVolume,
        productCategories: r.categories,
        status: r.status,
        discountPercent: r.discountPercent,
        creditLimit: toKobo(500_000),
        reviewedBy: r.status === "APPROVED" ? "admin@patiencesewing.com" : null,
        reviewedAt: r.status === "APPROVED" ? new Date() : null,
        reviewNote: r.note,
      },
    });
  }

  // --- products ------------------------------------------------------------
  for (const p of PRODUCTS) {
    const slug = p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        retailPrice: toKobo(p.retail),
        wholesalePrice: toKobo(p.wholesale),
        wholesaleMinQty: p.wholesaleMinQty ?? 6,
        stock: p.stock,
      },
      create: {
        slug,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description,
        category: p.category,
        fabric: p.fabric,
        colourways: p.colourways,
        sizes: p.sizes,
        styleCode: p.styleCode,
        bespoke: p.bespoke ?? false,
        retailPrice: toKobo(p.retail),
        wholesalePrice: toKobo(p.wholesale),
        wholesaleMinQty: p.wholesaleMinQty ?? 6,
        compareAtPrice: p.compareAt ? toKobo(p.compareAt) : null,
        stock: p.stock,
        lowStockAlert: 5,
        leadTimeDays: p.bespoke ? 21 : 14,
        status: ProductStatus.ACTIVE,
        featured: p.featured ?? false,
        tags: p.tags,
        seoTitle: `${p.name} | ${p.subtitle}`,
        seoDescription: p.description.slice(0, 160),
        images: {
          create: p.images.map((url, index) => ({
            url,
            position: index,
            alt: `${p.name} ${index === 0 ? "" : `view ${index + 1}`}`.trim(),
          })),
        },
      },
    });

    if (product.stock > 0) {
      await prisma.review.create({
        data: {
          productId: product.id,
          authorName: ["Ngozi A.", "Blessing E.", "Fatima S.", "Ijeoma N."][
            Math.floor(Math.random() * 4)
          ],
          rating: [5, 5, 4, 5][Math.floor(Math.random() * 4)],
          title: "Worth every naira",
          body:
            "The fit was perfect and the finish is far better than what I paid more for elsewhere. Patience Sewing answered every question on WhatsApp before I ordered.",
          isPublished: true,
        },
      });
    }
  }

  // --- sample orders -------------------------------------------------------
  const iwe = await prisma.product.findUnique({
    where: { slug: "iwe-royal-gown" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  const khadi = await prisma.product.findUnique({
    where: { slug: "comfort-khadi-set" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  const asoEke = await prisma.product.findUnique({
    where: { slug: "buchi-aso-eke-two-piece" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });

  if (iwe && !(await existingOrder("PSL-DEMO0001"))) {
    await prisma.order.create({
      data: {
        reference: "PSL-DEMO0001",
        userId: customer.id,
        status: "PAID",
        subtotalRetail: iwe.retailPrice,
        totalAmount: iwe.retailPrice + toKobo(1_500),
        deliveryFee: toKobo(1_500),
        pricingTier: "RETAIL",
        customerName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingLine1: "7 Doro Street",
        shippingCity: "Port Harcourt",
        shippingState: "Rivers",
        paystackReference: "PSK-DEMO0001",
        amountPaid: iwe.retailPrice + toKobo(1_500),
        paidAt: new Date(Date.now() - 86_400_000 * 3),
        createdAt: new Date(Date.now() - 86_400_000 * 4),
        items: {
          create: [
            {
              productId: iwe.id,
              name: iwe.name,
              slug: iwe.slug,
              imageUrl: iwe.images[0]?.url ?? null,
              size: "UK 12",
              colourway: "Royal Blue",
              quantity: 1,
              unitPrice: iwe.retailPrice,
              lineTotal: iwe.retailPrice,
              tier: "RETAIL",
            },
          ],
        },
      },
    });
  }

  if (asoEke && !(await existingOrder("PSL-DEMO0002"))) {
    await prisma.order.create({
      data: {
        reference: "PSL-DEMO0002",
        status: "IN_PRODUCTION",
        subtotalWholesale: asoEke.wholesalePrice * 6,
        totalAmount: asoEke.wholesalePrice * 6,
        pricingTier: "WHOLESALE",
        customerName: "Bisi Afolayan",
        customerEmail: "bisi@afolayanboutique.com",
        customerPhone: "08097654321",
        shippingLine1: "14 Isaac Boro Road",
        shippingCity: "Yenagoa",
        shippingState: "Bayelsa",
        paystackReference: "PSK-DEMO0002",
        amountPaid: asoEke.wholesalePrice * 6,
        paidAt: new Date(Date.now() - 86_400_000 * 8),
        createdAt: new Date(Date.now() - 86_400_000 * 9),
        items: {
          create: [
            {
              productId: asoEke.id,
              name: asoEke.name,
              slug: asoEke.slug,
              imageUrl: asoEke.images[0]?.url ?? null,
              size: "L/XL",
              colourway: "Gold & Royal Blue",
              quantity: 6,
              unitPrice: asoEke.wholesalePrice,
              lineTotal: asoEke.wholesalePrice * 6,
              tier: "WHOLESALE",
            },
          ],
        },
      },
    });
  }

  if (khadi && !(await existingOrder("PSL-DEMO0003"))) {
    await prisma.order.create({
      data: {
        reference: "PSL-DEMO0003",
        status: "SHIPPED",
        subtotalRetail: khadi.retailPrice * 2,
        totalAmount: khadi.retailPrice * 2,
        pricingTier: "RETAIL",
        customerName: "Hauwa Yusuf",
        customerEmail: "hauwa@example.com",
        customerPhone: "07011223344",
        shippingLine1: "22 Gana Street",
        shippingCity: "Abuja",
        shippingState: "FCT",
        paystackReference: "PSK-DEMO0003",
        amountPaid: khadi.retailPrice * 2,
        paidAt: new Date(Date.now() - 86_400_000 * 12),
        createdAt: new Date(Date.now() - 86_400_000 * 13),
        items: {
          create: [
            {
              productId: khadi.id,
              name: khadi.name,
              slug: khadi.slug,
              imageUrl: khadi.images[0]?.url ?? null,
              size: "UK 14",
              colourway: "Indigo",
              quantity: 2,
              unitPrice: khadi.retailPrice,
              lineTotal: khadi.retailPrice * 2,
              tier: "RETAIL",
            },
          ],
        },
      },
    });
  }

  // --- CRM leads -----------------------------------------------------------
  for (const lead of LEADS) {
    if (await existingLead(lead.phone)) continue;

    const created = await prisma.lead.create({
      data: {
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        state: lead.state,
        source: lead.source,
        stage: lead.stage,
        interestedIn: lead.interestedIn,
        budgetRange: lead.budgetRange,
        timeline: lead.timeline,
        orderValueEstimate: lead.orderValueEstimate,
        notes: lead.notes,
        tags: lead.tags,
        ownerId: lead.stage === "NEW" ? null : admin.id,
        createdAt: new Date(Date.now() - lead.ageDays * 86_400_000),
        lastContactedAt:
          lead.stage === "NEW" ? null : new Date(Date.now() - Math.max(1, lead.ageDays - 3) * 86_400_000),
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: created.id,
        actorId: lead.stage === "NEW" ? null : admin.id,
        type: "CREATED",
        summary: `Lead captured from ${lead.source.toLowerCase().replace(/_/g, " ")}`,
        createdAt: new Date(Date.now() - lead.ageDays * 86_400_000),
      },
    });
  }

  // --- retail applications -------------------------------------------------
  await prisma.retailerApplication.upsert({
    where: { id: "seed-pending-grace" },
    update: {},
    create: {
      id: "seed-pending-grace",
      email: "grace@enugugracefashions.com",
      fullName: "Grace Eze",
      phone: "08190909090",
      businessName: "Grace Fashions Enugu",
      businessType: "Boutique",
      shopAddress: "9 New Haven Road",
      city: "Enugu",
      state: "Enugu",
      yearsInBusiness: 9,
      monthlyVolume: "20 - 40 pieces",
      categories: ["TWO_PIECE", "THREE_PIECE"],
      note: "Long-running boutique, applying for wholesale prices for the first time.",
      status: "PENDING",
    },
  });

  await prisma.retailerApplication.upsert({
    where: { id: "seed-pending-kemi" },
    update: {},
    create: {
      id: "seed-pending-kemi",
      email: "kemi@tailoringhub.ng",
      fullName: "Kemi Adebayo",
      phone: "08055556666",
      businessName: "Tailoring Hub NG",
      businessType: "Tailoring service",
      shopAddress: "3 Alausa Street, Ikeja",
      city: "Lagos",
      state: "Lagos",
      yearsInBusiness: 1,
      monthlyVolume: "Under 20 pieces",
      categories: ["CUSTOM_BESPOKE"],
      note: "New tailoring service. Mostly wants to buy fabric-ready panels and custom pieces.",
      status: "PENDING",
    },
  });

  await prisma.contactMessage.create({
    data: {
      fullName: "Tobi Lawal",
      email: "tobi@example.com",
      phone: "08122223333",
      subject: "Fabric supplier referral",
      message:
        "I run a fabric store in Yenagoa and would like to discuss stocking your pieces as well. Please call me back on weekdays after 4pm.",
    },
  });

  console.log("Seed complete.");
  console.log("  Admin:    admin@patiencesewing.com / admin1234");
  console.log("  Retailer: bisi@afolayanboutique.com / retailer1234");
  console.log("  Customer: customer@example.com / customer1234");
}

function existingOrder(reference: string) {
  return prisma.order.findUnique({ where: { reference } }).then((o) => o !== null);
}

function existingLead(phone: string) {
  return prisma.lead.findFirst({ where: { phone } }).then((l) => l !== null);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });