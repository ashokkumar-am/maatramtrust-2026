/**
 * Seed dummy students (one School, one College) plus a sponsorship for the
 * current year against each, into MongoDB (collections: `students`,
 * `studentpayments`).
 *
 * Idempotent: students upsert by `student_id`, sponsorships upsert by
 * (studentId, year, donorName). Re-running updates rather than duplicates.
 *
 * Run:  node --env-file=.env.local scripts/seed-students.mjs
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Run with --env-file=.env.local");
  process.exit(1);
}

const YEAR = new Date().getFullYear();

const studentSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    photo: String,
    public_id: String,
    dob: Date,
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    phonenumber: { type: String, trim: true },
    reason: String,
    student_type: { type: String, enum: ["School", "College"], required: true },
    blood_group: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    school_name: String,
    grade_level: String,
    college_name: String,
    department: String,
    semester: String,
    marks: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    parenting_status: {
      type: String,
      enum: [
        "orphan",
        "single-parent",
        "single-father",
        "single-mother",
        "family",
        "guardian",
      ],
    },
    isStatus: { type: Boolean, default: false },
    isDonate: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const studentPaymentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentName: { type: String, trim: true },
    year: { type: Number, required: true },
    donorName: { type: String, trim: true },
    donorEmail: { type: String, trim: true },
    donorPhone: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    receivedAmt: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "received", "failed"],
      default: "pending",
    },
    orderId: String,
    payId: String,
    note: String,
  },
  { timestamps: true },
);

const Student =
  mongoose.models.Student || mongoose.model("Student", studentSchema);
const StudentPayment =
  mongoose.models.StudentPayment ||
  mongoose.model("StudentPayment", studentPaymentSchema);

const students = [
  {
    student_id: "STU2026001",
    name: "Arjun Kumar",
    gender: "Male",
    phonenumber: "9000011111",
    reason:
      "From a single-mother family; needs support for school supplies, uniform and notebooks.",
    student_type: "School",
    blood_group: "B+",
    school_name: "Chennai Corporation Higher Secondary School",
    grade_level: "8th Std",
    amount: 2500,
    parenting_status: "single-mother",
  },
  {
    student_id: "STU2026002",
    name: "Priya Ramesh",
    gender: "Female",
    phonenumber: "9000022222",
    reason:
      "Orphan supported by a guardian; pursuing a nursing diploma and needs help with fees.",
    student_type: "College",
    blood_group: "O+",
    college_name: "Andhra Mahila Sabha College of Nursing",
    department: "Diploma in Nursing",
    semester: "2nd Year",
    marks: "445",
    amount: 15000,
    parenting_status: "guardian",
  },
  {
    student_id: "STU2026003",
    name: "Kavya Nataraj",
    gender: "Female",
    phonenumber: "9000033333",
    reason:
      "Father is a daily-wage worker; needs help with school fees, books and a uniform.",
    student_type: "School",
    blood_group: "A+",
    school_name: "Government Girls Higher Secondary School",
    grade_level: "10th Std",
    amount: 3000,
    parenting_status: "family",
  },
  {
    student_id: "STU2026004",
    name: "Suresh Babu",
    gender: "Male",
    phonenumber: "9000044444",
    reason:
      "First-generation college student from a single-father family; needs tuition support.",
    student_type: "College",
    blood_group: "AB+",
    college_name: "Government Arts and Science College",
    department: "B.Sc Computer Science",
    semester: "1st Year",
    marks: "410",
    amount: 18000,
    parenting_status: "single-father",
  },
];

// One sponsorship for this year per student (donor captured against student).
const sponsorships = [
  {
    student_id: "STU2026001",
    donorName: "Ravi Shankar",
    donorEmail: "ravi.shankar@example.com",
    donorPhone: "9876500001",
    amount: 2500,
    receivedAmt: 2500,
    note: `Full sponsorship for ${YEAR}`,
  },
  {
    student_id: "STU2026002",
    donorName: "Meena Iyer",
    donorEmail: "meena.iyer@example.com",
    donorPhone: "9876500002",
    amount: 15000,
    receivedAmt: 5000,
    note: `Partial sponsorship for ${YEAR}`,
  },
];

async function main() {
  await mongoose.connect(uri);

  for (const s of students) {
    await Student.updateOne(
      { student_id: s.student_id },
      { $set: s },
      { upsert: true },
    );
    console.log(`student upserted: ${s.student_id} (${s.student_type})`);
  }

  for (const sp of sponsorships) {
    const student = await Student.findOne({ student_id: sp.student_id })
      .select("_id name")
      .lean();
    if (!student) {
      console.warn(`skip sponsorship — student ${sp.student_id} not found`);
      continue;
    }
    await StudentPayment.updateOne(
      { studentId: student._id, year: YEAR, donorName: sp.donorName },
      {
        $set: {
          studentId: student._id,
          studentName: student.name,
          year: YEAR,
          donorName: sp.donorName,
          donorEmail: sp.donorEmail,
          donorPhone: sp.donorPhone,
          amount: sp.amount,
          receivedAmt: sp.receivedAmt,
          currency: "INR",
          status: "received",
          note: sp.note,
        },
      },
      { upsert: true },
    );
    console.log(
      `sponsorship upserted: ${student.name} <- ${sp.donorName} (${YEAR}, ₹${sp.receivedAmt}/${sp.amount})`,
    );
  }

  console.log(
    `done — ${students.length} students, ${sponsorships.length} sponsorships for ${YEAR}`,
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
