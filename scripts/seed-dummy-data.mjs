/**
 * Seed the database with realistic dummy data (photos included) for demos:
 * students + sponsorships, Annadhana Sevai campaigns with bookings across
 * past AND future days, day-wise photo updates, homepage banners, and a
 * donor wall.
 *
 * Photos use stable placeholder services (randomuser.me portraits,
 * picsum.photos scenery) — replace with real Cloudinary photos later.
 *
 * Idempotent: every seeded document carries `isSeed: true` and is deleted
 * before re-inserting, so the script can be re-run safely. Real data is
 * never touched.
 *
 * Run:  node scripts/seed-dummy-data.mjs
 * Env:  MONGODB_URI (+ optional MONGODB_DB) from .env.local/.env.development
 */
import { readFileSync, existsSync } from "node:fs";
import { MongoClient } from "mongodb";

// ---------- env ----------

function loadEnv() {
  for (const file of [".env.local", ".env.development"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
      }
    }
  }
}

loadEnv();
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found in .env.local/.env.development");
  process.exit(1);
}

// ---------- helpers ----------

const SEED = { isSeed: true };
const now = new Date();

/** Midnight UTC for today+`offset` days (matches the app's day handling). */
function dayUTC(offset) {
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offset,
    ),
  );
}

function picsum(seed, w = 1200, h = 800) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const pick = (list, i) => list[i % list.length];

// ---------- data ----------

const DONOR_NAMES = [
  "Ramesh Kumar",
  "Anitha Srinivasan",
  "Vijay Prakash",
  "Lakshmi Narayanan",
  "Divya Bharathi",
  "Karthik Raja",
  "Meena Sundaram",
  "Suresh Babu",
  "Priya Dharshini",
  "Arun Vijay",
  "Kavitha Mani",
  "Senthil Nathan",
];

const STUDENTS = [
  [
    "Priya Selvam",
    "Female",
    "College",
    "Anna University",
    "Computer Science",
    "Semester 5",
    null,
    null,
    45000,
    "Lost her father during COVID; mother works as a domestic helper. Priya topped her district in Class 12 and dreams of becoming a software engineer.",
  ],
  [
    "Karthik Murugan",
    "Male",
    "School",
    null,
    null,
    null,
    "Chennai Corporation Hr. Sec. School",
    "Class 11",
    18000,
    "Son of a daily-wage fisherman in Kottivakkam. Consistently first in class; needs support for books, uniforms and coaching.",
  ],
  [
    "Divya Lakshmi",
    "Female",
    "College",
    "Madras Medical College",
    "MBBS",
    "Year 2",
    null,
    null,
    60000,
    "First in her family to reach college. Cleared NEET from a government school with the help of our free coaching volunteers.",
  ],
  [
    "Arun Prasath",
    "Male",
    "College",
    "Government College of Technology",
    "Mechanical Engineering",
    "Semester 3",
    null,
    null,
    40000,
    "Raised by his grandmother in Thiruvanmiyur. Works weekends at a workshop; sponsorship keeps him from dropping out.",
  ],
  [
    "Sneha Radhakrishnan",
    "Female",
    "School",
    null,
    null,
    null,
    "Government Girls Hr. Sec. School, Adyar",
    "Class 12",
    15000,
    "Daughter of a widowed flower seller. School topper aiming for engineering; needs help with exam fees and study materials.",
  ],
  [
    "Manikandan Velu",
    "Male",
    "College",
    "Presidency College",
    "B.Com",
    "Semester 1",
    null,
    null,
    30000,
    "Single-parent family affected by the 2015 floods. A district-level athlete who wants to become a chartered accountant.",
  ],
  [
    "Keerthana Anand",
    "Female",
    "College",
    "Ethiraj College",
    "B.Sc Mathematics",
    "Semester 4",
    null,
    null,
    32000,
    "Orphaned young and raised in a children's home we support. Wants to become a teacher and give back.",
  ],
  [
    "Vignesh Subramani",
    "Male",
    "School",
    null,
    null,
    null,
    "St. Joseph's Hr. Sec. School",
    "Class 10",
    12000,
    "Father is a auto driver with a heart condition. Bright student who loves science exhibitions.",
  ],
  [
    "Nandhini Ravi",
    "Female",
    "College",
    "SRM Arts & Science",
    "B.C.A",
    "Semester 2",
    null,
    null,
    35000,
    "Mother stitches clothes for a living. Nandhini learned coding at our weekend classes and won a state-level app contest.",
  ],
  [
    "Santhosh Pandian",
    "Male",
    "Alumni",
    "Loyola College",
    "M.Sc Physics",
    "Semester 1",
    null,
    null,
    50000,
    "Sponsored through B.Sc by Maatram donors; now needs support for postgraduate studies while he tutors juniors for free.",
  ],
  [
    "Abinaya Chandran",
    "Female",
    "School",
    null,
    null,
    null,
    "Panchayat Union School, Kelambakkam",
    "Class 9",
    10000,
    "Farm labourer's daughter from a village we run clinics in. Walks 4 km to school and hasn't missed a day.",
  ],
  [
    "Dinesh Kannan",
    "Male",
    "College",
    "Pachaiyappa's College",
    "B.A Economics",
    "Semester 6",
    null,
    null,
    28000,
    "Final-year student supporting two younger siblings. A sponsorship this year sees him through to graduation.",
  ],
];

// ---------- seeding ----------

async function seedStudents(db) {
  const col = db.collection("students");
  await col.deleteMany(SEED);

  const docs = STUDENTS.map((row, i) => {
    const [
      name,
      gender,
      type,
      college,
      dept,
      sem,
      school,
      grade,
      amount,
      reason,
    ] = row;
    return {
      ...SEED,
      student_id: `MT-2026-${String(i + 1).padStart(3, "0")}`,
      name,
      gender,
      student_type: type,
      // No photo: the site renders the Maatram logo as the placeholder.
      photo: undefined,
      reason,
      amount,
      college_name: college ?? undefined,
      department: dept ?? undefined,
      semester: sem ?? undefined,
      school_name: school ?? undefined,
      grade_level: grade ?? undefined,
      isStatus: true,
      isDonate: true,
      createdAt: new Date(now.getTime() - (30 - i) * 86400000),
      updatedAt: now,
    };
  });
  const { insertedIds } = await col.insertMany(docs);
  console.log(`students: ${docs.length}`);
  return docs.map((doc, i) => ({ ...doc, _id: insertedIds[i] }));
}

async function seedSponsorships(db, students) {
  const col = db.collection("studentpayments");
  await col.deleteMany(SEED);

  const docs = [];
  const year = now.getUTCFullYear();
  students.forEach((student, i) => {
    // Older years: most students have received history.
    for (const past of [year - 2, year - 1]) {
      if ((i + past) % 3 === 0) continue;
      docs.push(payment(student, past, student.amount, i + past));
    }
    // Current year: a third fully funded, a third partial, a third open.
    if (i % 3 === 0) docs.push(payment(student, year, student.amount, i));
    if (i % 3 === 1)
      docs.push(payment(student, year, Math.round(student.amount / 2), i + 1));
  });

  function payment(student, payYear, amount, seed) {
    const donor = pick(DONOR_NAMES, seed);
    return {
      ...SEED,
      studentId: student._id,
      studentName: student.name,
      year: payYear,
      donorName: donor,
      donorEmail: `${donor.split(" ")[0].toLowerCase()}@example.com`,
      amount,
      receivedAmt: amount,
      currency: "INR",
      status: "received",
      note: "Seeded demo sponsorship",
      createdAt: new Date(Date.UTC(payYear, 5, 10 + (seed % 15))),
      updatedAt: now,
    };
  }

  await col.insertMany(docs);
  console.log(`studentpayments: ${docs.length}`);
}

async function seedAnnadhana(db) {
  const campaigns = db.collection("annadhanacampaigns");
  const bookings = db.collection("annadhanabookings");
  const updates = db.collection("annadhanaupdates");
  await Promise.all([
    campaigns.deleteMany(SEED),
    bookings.deleteMany(SEED),
    updates.deleteMany(SEED),
  ]);

  const year = now.getUTCFullYear();
  const { insertedId: campaignId } = await campaigns.insertOne({
    ...SEED,
    title: `Annadhana Sevai ${year}`,
    slug: `annadhana-sevai-${year}`,
    description:
      "Fresh breakfast served every morning at our Thiruvanmiyur centre. Sponsor a day for a birthday, an anniversary, or in memory of a loved one — we cook, serve, and share photos from your day.",
    image: picsum("annadhana-hero", 1600, 900),
    minAmount: 1500,
    targetAmount: 500000,
    startDate: new Date(Date.UTC(year - 1, 10, 1)),
    endDate: new Date(Date.UTC(year, 11, 31)),
    order: 1,
    isActive: true,
    createdAt: new Date(Date.UTC(year, 0, 1)),
    updatedAt: now,
  });
  const campaignTitle = `Annadhana Sevai ${year}`;

  const occasions = [
    ["birthday", "Birthday of"],
    ["memorial", "In loving memory of"],
    ["anniversary", "Wedding anniversary of"],
    ["other", "Housewarming of"],
  ];
  const HONOREES = [
    "Master Aarav",
    "Smt. Kamala Devi",
    "Thiru Raghavan",
    "Baby Mithra",
    "Shri Krishnamoorthy",
    "Selvi Janani",
  ];

  const bookingDocs = [];
  const updateDocs = [];

  // Past 25 days: every day sponsored (busy days get two sponsors) and a
  // photo update posted for each served day.
  for (let offset = -25; offset < 0; offset++) {
    const date = dayUTC(offset);
    const sponsorCount = offset % 5 === 0 ? 2 : 1;
    for (let s = 0; s < sponsorCount; s++) {
      bookingDocs.push(
        booking(date, offset + s + 30, offset % 7 === 0 ? "manual" : "online"),
      );
    }
    updateDocs.push({
      ...SEED,
      campaignId,
      campaignTitle,
      date,
      title: "Morning breakfast served",
      description: `Hot pongal, vada and coffee served to ${80 + ((offset + 25) % 40)} neighbours at our Thiruvanmiyur centre.`,
      media: [1, 2, 3, 4].slice(0, 3 + (Math.abs(offset) % 2)).map((n) => ({
        url: picsum(`annadhana-day${Math.abs(offset)}-${n}`),
        mediaType: "image",
      })),
      isActive: true,
      createdAt: new Date(date.getTime() + 10 * 3600000),
      updatedAt: now,
    });
  }

  // Future 15 days: upcoming sponsored days (paid in advance).
  for (let offset = 0; offset < 15; offset++) {
    if (offset % 4 === 3) continue; // leave some days open to book
    bookingDocs.push(booking(dayUTC(offset), offset + 3, "online"));
  }

  // Older history so the feed archive spans months and years: three served
  // days per month from last November up to where the daily window begins.
  const dailyWindowStart = dayUTC(-25);
  const olderMonths = [
    [year - 1, 10],
    [year - 1, 11],
    ...Array.from({ length: now.getUTCMonth() + 1 }, (_, m) => [year, m]),
  ];
  let olderSeed = 100;
  for (const [y, m] of olderMonths) {
    for (const d of [5, 15, 25]) {
      const date = new Date(Date.UTC(y, m, d));
      if (date >= dailyWindowStart) continue;
      olderSeed += 1;
      bookingDocs.push(booking(date, olderSeed, "manual"));
      updateDocs.push({
        ...SEED,
        campaignId,
        campaignTitle,
        date,
        title: "Morning breakfast served",
        description: `Hot idli, sambar and coffee served to ${70 + ((olderSeed * 13) % 50)} neighbours at our Thiruvanmiyur centre.`,
        media: [1, 2, 3].map((n) => ({
          url: picsum(`annadhana-${y}-${m + 1}-${d}-${n}`),
          mediaType: "image",
        })),
        isActive: true,
        createdAt: new Date(date.getTime() + 10 * 3600000),
        updatedAt: now,
      });
    }
  }

  function booking(eventDate, seed, source) {
    const [occasion] = pick(occasions, seed);
    const donor = pick(DONOR_NAMES, seed);
    const honoree = pick(HONOREES, seed);
    const amount = 1500 + (seed % 4) * 500;
    return {
      ...SEED,
      campaignId,
      campaignTitle,
      occasion,
      occasionDetail: occasion === "other" ? "Housewarming" : undefined,
      honoreeName: honoree,
      eventDate,
      donorName: donor,
      donorEmail: `${donor.split(" ")[0].toLowerCase()}@example.com`,
      donorPhone: `98840${String(10000 + seed * 37).slice(0, 5)}`,
      amount,
      receivedAmt: amount,
      currency: "INR",
      status: "received",
      source,
      note: "Seeded demo booking",
      createdAt: new Date(eventDate.getTime() - 5 * 86400000),
      updatedAt: now,
    };
  }

  await bookings.insertMany(bookingDocs);
  await updates.insertMany(updateDocs);
  console.log(
    `annadhana: 1 campaign, ${bookingDocs.length} bookings (past + future), ${updateDocs.length} daily photo updates`,
  );
}

async function seedBanners(db) {
  const col = db.collection("banners");
  await col.deleteMany(SEED);

  const banners = [
    [
      "Every meal is a celebration",
      "Annadhana Sevai serves fresh breakfast every morning",
      "annadhana-banner",
      "/annadhana",
    ],
    [
      "Keep a dream in school",
      "Sponsor a student's year of education",
      "students-banner",
      "/students",
    ],
    [
      "4,500 volunteers strong",
      "Join the hands that carry Maatram",
      "volunteers-banner",
      "/contact",
    ],
  ];
  await col.insertMany(
    banners.map(([title, caption, seed, link], i) => ({
      ...SEED,
      title,
      caption,
      link,
      mediaType: "image",
      url: picsum(seed, 1920, 900),
      public_id: `seed/${seed}`,
      alt: title,
      order: i,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })),
  );
  console.log(`banners: ${banners.length}`);
}

const BLOG_CATEGORIES = [
  "Animal Rescue",
  "COVID-19 Support",
  "Education",
  "Health & Free Clinic",
  "Women Empowerment",
  "Environment",
  "Disaster Relief",
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function seedBlog(db) {
  const categories = db.collection("categories");
  const posts = db.collection("blogposts");
  await posts.deleteMany(SEED);
  await categories.deleteMany(SEED);

  // Reuse the site's existing blog categories; create only the missing ones
  // from the standard set (real category data is never duplicated).
  const existing = await categories
    .find({ type: "blog", isActive: true })
    .project({ name: 1, slug: 1 })
    .toArray();
  const bySlug = new Map(existing.map((c) => [c.slug, c]));

  const missing = BLOG_CATEGORIES.map((name) => ({
    name,
    slug: slugify(name),
  })).filter((c) => !bySlug.has(c.slug));
  if (missing.length > 0) {
    const { insertedIds } = await categories.insertMany(
      missing.map((c, i) => ({
        ...SEED,
        name: c.name,
        slug: c.slug,
        type: "blog",
        order: existing.length + i,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })),
    );
    missing.forEach((c, i) =>
      bySlug.set(c.slug, { ...c, _id: insertedIds[i] }),
    );
  }

  const allCategories = [...bySlug.values()];
  const postDocs = [];
  allCategories.forEach(({ name, _id: categoryId }, i) => {
    for (let p = 0; p < 2; p++) {
      const title =
        p === 0
          ? `How our ${name.toLowerCase()} work changed lives this year`
          : `Volunteer diaries: a day with the ${name.toLowerCase()} team`;
      const publishedAt = new Date(
        now.getTime() - (i * 2 + p + 1) * 9 * 86400000,
      );
      postDocs.push({
        ...SEED,
        title,
        slug: slugify(title),
        category: categoryId,
        excerpt: `Stories from the field: what your support made possible in ${name.toLowerCase()} — in the words of the volunteers who were there.`,
        content: [
          `Every Maatram program begins with a phone call, and our ${name.toLowerCase()} work is no different. This season our volunteers answered dozens of them — and behind each one is a family whose day turned out different because someone gave.`,
          `From our centre in Thiruvanmiyur, teams headed out with supplies, medicines, and a plan. What follows are the moments they brought back: small victories, hard lessons, and the neighbours who joined in along the way.`,
          `None of this happens without our donors and 4,500+ volunteers. If these stories move you, there is always room for one more pair of hands — reach us through the contact page, or support the work directly on the donate page.`,
        ].join("\n\n"),
        coverImage: picsum(`blog-${slugify(name)}-${p}`, 1200, 675),
        tags: [name, "Maatram", p === 0 ? "Impact" : "Volunteers"],
        status: "published",
        publishedAt,
        createdAt: publishedAt,
        updatedAt: publishedAt,
      });
    }
  });
  await posts.insertMany(postDocs);
  console.log(
    `blog: ${allCategories.length} categories (${missing.length} created), ${postDocs.length} published posts`,
  );
}

async function seedDonations(db) {
  const col = db.collection("donations");
  await col.deleteMany(SEED);

  const categories = ["Education", "Annadhana Sevai", "Free Clinic", null];
  const docs = DONOR_NAMES.slice(0, 10).map((donorName, i) => {
    // Spread across the past few months so the wall's month filter has data.
    const createdAt = new Date(now.getTime() - (i * 13 + 1) * 86400000);
    const amountPaise = (500 + (i % 6) * 750) * 100;
    return {
      _id: `seed_order_${String(i + 1).padStart(3, "0")}`,
      ...SEED,
      orderId: `seed_order_${String(i + 1).padStart(3, "0")}`,
      paymentId: `seed_pay_${String(i + 1).padStart(3, "0")}`,
      amount: amountPaise,
      currency: "INR",
      status: "captured",
      donorName,
      email: `${donorName.split(" ")[0].toLowerCase()}@example.com`,
      anonymous: i % 5 === 4,
      categoryName: categories[i % categories.length] ?? undefined,
      source: "web",
      createdAt,
      updatedAt: createdAt,
      capturedAt: createdAt,
    };
  });
  await col.insertMany(docs);
  console.log(`donations: ${docs.length}`);
}

// ---------- main ----------

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);
  console.log(`Seeding dummy data into "${db.databaseName}"…`);

  const students = await seedStudents(db);
  await seedSponsorships(db, students);
  await seedAnnadhana(db);
  await seedBanners(db);
  await seedBlog(db);
  await seedDonations(db);

  console.log(
    "Done. Re-run any time — seeded rows are replaced, real data is untouched.",
  );
} finally {
  await client.close();
}
