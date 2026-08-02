import { cache } from "react";
import { isValidObjectId } from "mongoose";
import connectMongoDB from "@/lib/mongoose";
import Student, { type STUDENT_TYPES } from "@/models/StudentModel";
import StudentPayment from "@/models/StudentPaymentModel";
import { getStudentSponsorshipsByYear } from "@/lib/sponsorships";

export type StudentType = (typeof STUDENT_TYPES)[number];

/** Public, serializable student core (no sponsorship aggregates). */
export interface StudentProfile {
  id: string;
  student_id: string;
  name: string;
  photo?: string;
  student_type: StudentType;
  reason?: string;
  amount: number;
  school_name?: string;
  grade_level?: string;
  college_name?: string;
  department?: string;
  semester?: string;
}

/** Public, serializable student shape (safe for Client Components). */
export interface StudentView extends StudentProfile {
  /** Amount received toward this student's goal in the current year. */
  receivedThisYear: number;
  /** True when this year's goal is met (fully sponsored). */
  funded: boolean;
  /** Confirmed sponsor names grouped by year (newest year first). */
  sponsorsByYear: { year: number; names: string[] }[];
}

interface YearAgg {
  year: number;
  total: number;
  names: string[];
}

interface StudentDoc {
  _id: unknown;
  student_id: string;
  name: string;
  photo?: string;
  student_type: StudentType;
  reason?: string;
  amount?: number;
  school_name?: string;
  grade_level?: string;
  college_name?: string;
  department?: string;
  semester?: string;
}

const PUBLIC_FIELDS =
  "student_id name photo student_type reason amount school_name grade_level college_name department semester";

function toProfile(doc: StudentDoc): StudentProfile {
  return {
    id: String(doc._id),
    student_id: doc.student_id,
    name: doc.name,
    photo: doc.photo,
    student_type: doc.student_type,
    reason: doc.reason,
    amount: doc.amount ?? 0,
    school_name: doc.school_name,
    grade_level: doc.grade_level,
    college_name: doc.college_name,
    department: doc.department,
    semester: doc.semester,
  };
}

function toView(
  doc: StudentDoc,
  years: YearAgg[],
  currentYear: number,
): StudentView {
  const profile = toProfile(doc);
  const receivedThisYear =
    years.find((y) => y.year === currentYear)?.total ?? 0;

  return {
    ...profile,
    receivedThisYear,
    funded: profile.amount > 0 && receivedThisYear >= profile.amount,
    sponsorsByYear: years
      .map((y) => ({ year: y.year, names: y.names }))
      .filter((y) => y.names.length > 0),
  };
}

/**
 * Confirmed (status: received) sponsorships aggregated per student and year:
 * total received + sponsor names. Keyed by student id, years newest-first.
 */
async function sponsorshipsByStudent(): Promise<Map<string, YearAgg[]>> {
  const rows = await StudentPayment.aggregate<{
    _id: { studentId: unknown; year: number };
    total: number;
    names: (string | null)[];
  }>([
    { $match: { status: "received" } },
    {
      $group: {
        _id: { studentId: "$studentId", year: "$year" },
        total: { $sum: "$receivedAmt" },
        names: { $push: "$donorName" },
      },
    },
    { $sort: { "_id.year": -1 } },
  ]);

  const byStudent = new Map<string, YearAgg[]>();
  for (const row of rows) {
    const key = String(row._id.studentId);
    const names = row.names.map((n) => n?.trim() || "Anonymous");
    const list = byStudent.get(key) ?? [];
    list.push({ year: row._id.year, total: row.total, names });
    byStudent.set(key, list);
  }
  return byStudent;
}

/**
 * Students shown publicly for sponsorship. Fully-funded students (this year's
 * goal met) sort to the bottom; within each group, newest first.
 */
export async function getPublicStudents(): Promise<StudentView[]> {
  await connectMongoDB();
  const currentYear = new Date().getFullYear();

  const [docs, sponsorships] = await Promise.all([
    Student.find()
      .sort({ createdAt: -1 })
      .select(PUBLIC_FIELDS)
      .lean<StudentDoc[]>()
      .exec(),
    sponsorshipsByStudent(),
  ]);

  const views = docs.map((doc) =>
    toView(doc, sponsorships.get(String(doc._id)) ?? [], currentYear),
  );

  // Stable sort keeps the newest-first order within the funded/unfunded groups.
  return views.sort((a, b) => Number(a.funded) - Number(b.funded));
}

export async function getPublicStudentById(
  id: string,
): Promise<StudentView | null> {
  await connectMongoDB();
  const doc = await Student.findById(id)
    .select(PUBLIC_FIELDS)
    .lean<StudentDoc>()
    .exec();
  if (!doc) return null;

  const currentYear = new Date().getFullYear();
  const sponsorships = await sponsorshipsByStudent();
  return toView(doc, sponsorships.get(String(doc._id)) ?? [], currentYear);
}

/**
 * Student core for the public detail page, without sponsorship aggregates.
 * Tolerates malformed ids (returns null). Request-scoped `cache` dedupes the
 * page + generateMetadata lookups.
 */
export const getPublicStudentProfile = cache(
  async (id: string): Promise<StudentProfile | null> => {
    if (!isValidObjectId(id)) return null;
    await connectMongoDB();
    const doc = await Student.findById(id)
      .select(PUBLIC_FIELDS)
      .lean<StudentDoc>()
      .exec();
    return doc ? toProfile(doc) : null;
  },
);

/** Public-safe slice of one year's sponsorships: names only, no contacts. */
export interface PublicYearSponsors {
  year: number;
  /** Confirmed sponsorship count for the year. */
  count: number;
  /** Total received for the year. */
  received: number;
  /** Confirmed sponsor names, newest first. */
  names: string[];
}

/**
 * Year-wise confirmed sponsor history for one student, stripped to what is
 * safe to show publicly (no donor emails/phones, no pending pledges).
 */
export async function getPublicSponsorYears(
  studentId: string,
): Promise<PublicYearSponsors[]> {
  if (!isValidObjectId(studentId)) return [];
  const years = await getStudentSponsorshipsByYear(studentId);

  return years
    .map((bucket) => {
      const names = bucket.sponsorships
        .filter((s) => s.status === "received")
        .map((s) => s.donorName?.trim() || "Anonymous");
      return {
        year: bucket.year,
        count: names.length,
        received: bucket.received,
        names,
      };
    })
    .filter((year) => year.count > 0);
}
