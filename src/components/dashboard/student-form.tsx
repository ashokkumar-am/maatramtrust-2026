"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";

export interface StudentValues {
  id?: string;
  student_id?: string;
  name?: string;
  student_type?: string;
  amount?: number;
  originalAmount?: number;
  phonenumber?: string;
  gender?: string;
  blood_group?: string;
  reason?: string;
  marks?: string;
  school_name?: string;
  grade_level?: string;
  college_name?: string;
  department?: string;
  semester?: string;
  parenting_status?: string;
  photo?: string;
  aadhaar_number?: string;
  aadhaar_image?: string;
  pan_number?: string;
  pan_image?: string;
  mark_statement_image?: string;
  isDonate?: boolean;
  isStatus?: boolean;
}

interface Options {
  studentTypes: string[];
  genders: string[];
  bloodGroups: string[];
  parentingStatuses: string[];
}

const selectClass =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function StudentForm({
  initial,
  options,
}: {
  initial?: StudentValues;
  options: Options;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial?.id);

  // Booleans default to false so edit mode never sends `null` for them (only
  // optional text/image fields are clearable server-side).
  const [values, setValues] = useState<StudentValues>({
    student_type: options.studentTypes[0],
    isDonate: false,
    isStatus: false,
    ...initial,
  });

  function set<K extends keyof StudentValues>(key: K, value: StudentValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Alumni share the college fields (the institution they graduated from).
  const isCollege = values.student_type !== "School";

  function save() {
    if (!values.student_id?.trim() || !values.name?.trim()) {
      toast.error("Student ID and name are required.");
      return;
    }
    if (values.amount == null || Number.isNaN(Number(values.amount))) {
      toast.error("Enter a valid amount.");
      return;
    }

    // Drop empty strings so optional fields validate cleanly on the server.
    // When editing, an emptied optional field is sent as `null` instead so the
    // server clears the stored value ($unset) rather than leaving it untouched.
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (key === "id") continue;
      if (value === "" || value == null) {
        if (editing) payload[key] = null;
        continue;
      }
      payload[key] = value;
    }
    payload.amount = Number(values.amount);

    startTransition(async () => {
      const url = editing
        ? `/api/admin/students/${initial!.id}`
        : "/api/admin/students";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editing ? "Student updated." : "Student created.");
        router.push("/dashboard/students");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      toast.error(
        data.message === "Already exists"
          ? "A student with that ID already exists."
          : (data.message ?? "Could not save the student."),
      );
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Student ID">
          <Input
            value={values.student_id ?? ""}
            onChange={(e) => set("student_id", e.target.value)}
          />
        </Field>
        <Field label="Name">
          <Input
            value={values.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>

        <Field label="Type">
          <select
            className={selectClass}
            value={values.student_type ?? ""}
            onChange={(e) => set("student_type", e.target.value)}
          >
            {options.studentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount (₹)">
          <Input
            type="number"
            min={0}
            value={values.amount ?? ""}
            onChange={(e) =>
              set(
                "amount",
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />
        </Field>

        <Field label="Original amount (₹, optional)">
          <Input
            type="number"
            min={0}
            value={values.originalAmount ?? ""}
            onChange={(e) =>
              set(
                "originalAmount",
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />
        </Field>
        <Field label="Phone (optional)">
          <Input
            value={values.phonenumber ?? ""}
            onChange={(e) => set("phonenumber", e.target.value)}
          />
        </Field>

        <Field label="Gender (optional)">
          <select
            className={selectClass}
            value={values.gender ?? ""}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="">—</option>
            {options.genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Blood group (optional)">
          <select
            className={selectClass}
            value={values.blood_group ?? ""}
            onChange={(e) => set("blood_group", e.target.value)}
          >
            <option value="">—</option>
            {options.bloodGroups.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>

        {isCollege ? (
          <>
            <Field label="College name">
              <Input
                value={values.college_name ?? ""}
                onChange={(e) => set("college_name", e.target.value)}
              />
            </Field>
            <Field label="Department">
              <Input
                value={values.department ?? ""}
                onChange={(e) => set("department", e.target.value)}
              />
            </Field>
            <Field label="Semester">
              <Input
                value={values.semester ?? ""}
                onChange={(e) => set("semester", e.target.value)}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="School name">
              <Input
                value={values.school_name ?? ""}
                onChange={(e) => set("school_name", e.target.value)}
              />
            </Field>
            <Field label="Grade level">
              <Input
                value={values.grade_level ?? ""}
                onChange={(e) => set("grade_level", e.target.value)}
              />
            </Field>
          </>
        )}

        <Field label="Marks (optional)">
          <Input
            value={values.marks ?? ""}
            onChange={(e) => set("marks", e.target.value)}
          />
        </Field>
        <Field label="Parenting status (optional)">
          <select
            className={selectClass}
            value={values.parenting_status ?? ""}
            onChange={(e) => set("parenting_status", e.target.value)}
          >
            <option value="">—</option>
            {options.parentingStatuses.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Photo URL (optional)">
          <Input
            value={values.photo ?? ""}
            onChange={(e) => set("photo", e.target.value)}
          />
        </Field>

        <Field label="Aadhaar number (optional)">
          <Input
            inputMode="numeric"
            maxLength={12}
            value={values.aadhaar_number ?? ""}
            onChange={(e) => set("aadhaar_number", e.target.value)}
            placeholder="12-digit Aadhaar"
          />
        </Field>
        <Field label="PAN number (optional)">
          <Input
            maxLength={10}
            value={values.pan_number ?? ""}
            onChange={(e) => set("pan_number", e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ImageUploadField
          label="Aadhaar image (optional)"
          url={values.aadhaar_image ?? ""}
          onChange={(url) => set("aadhaar_image", url)}
        />
        <ImageUploadField
          label="PAN image (optional)"
          url={values.pan_image ?? ""}
          onChange={(url) => set("pan_image", url)}
        />
        <ImageUploadField
          label="Mark statement image (optional)"
          url={values.mark_statement_image ?? ""}
          onChange={(url) => set("mark_statement_image", url)}
        />
      </div>

      <Field label="Reason (optional)">
        <Input
          value={values.reason ?? ""}
          onChange={(e) => set("reason", e.target.value)}
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isDonate ?? false}
            onChange={(e) => set("isDonate", e.target.checked)}
            className="size-4 accent-[#0a7d3e]"
          />
          Open for donation
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.isStatus ?? false}
            onChange={(e) => set("isStatus", e.target.checked)}
            className="size-4 accent-[#0a7d3e]"
          />
          Active status
        </label>
      </div>

      <div className="mt-2 flex gap-2">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Create student"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/students")}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
