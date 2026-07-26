/**
 * তেলিখাল উচ্চ বিদ্যালয় — অনলাইন ফলাফল ব্যাকএন্ড (Google Apps Script)
 * ==========================================================================
 * সেটআপ ও শীট কলাম লেআউট আগের ভার্সনের মতোই অপরিবর্তিত।
 *
 * ==========================================================================
 * ★ এই ভার্সনে দুইটা আলাদা "মোট" ধারণা স্পষ্টভাবে আলাদা করা হয়েছে ★
 *
 *   ১ গ্রেড/জিপিএ নির্ণয়ের জন্য (অপরিবর্তিত, আগের মতোই):
 *      finalMark = (পরীক্ষার নম্বর% × ৮০%) + CA(/২০), তারপর গ্রেড টেবিল থেকে গ্রেড/জিপিএ
 *      — এই সংখ্যাটা এখন আর আলাদা করে টেবিলে দেখানো হয় না, শুধু গ্রেড/জিপিএ বের করতে
 *        ভিতরে ভিতরে ব্যবহার হয়।
 *
 *   ২ প্রদর্শন ও merit/মোট-নম্বরের জন্য ("মোট নম্বর"):
 *      rawTotal = CQ + MCQ + Practical(থাকলে) + CA  — সরাসরি যোগফল, কোনো রিডাকশন/স্কেলিং নেই।
 *      - প্রতিটা বিষয়ের "সর্বোচ্চ নম্বর" = ক্লাসে ঐ বিষয়ে সবার rawTotal-এর মধ্যে সর্বোচ্চ
 *      - "সর্বমোট নম্বর" = সব মূল বিষয়ের rawTotal যোগফল (৪র্থ বিষয় বাদে)
 *      - "শ্রেণির সর্বোচ্চ মোট নম্বর" = ক্লাসের সবার (পাস/ফেল নির্বিশেষে) সর্বমোট নম্বরের মধ্যে সর্বোচ্চ
 *
 *   পাস/ফেল ও অংশ-ভিত্তিক ৩৩% নিয়ম অপরিবর্তিত (finalMark/examTotal দিয়েই যাচাই হয়)।
 *
 * ==========================================================================
 * ★ মেধাক্রম (শুধু পাস করা শিক্ষার্থীদের মধ্যে), টাই-ব্রেক অর্ডার: ★
 *   ১. ফাইনাল জিপিএ (বেশি আগে)
 *   ২. সমান হলে → সর্বমোট নম্বর (rawTotal ভিত্তিক, বেশি আগে)
 *   ৩. তাও সমান হলে → (গণিত + ইংরেজি) এর rawTotal যোগফল (বেশি আগে)
 * ==========================================================================
 */

const CLASS_NUMBER_MAP = { "৬ষ্ঠ": "6", "৭ম": "7", "৮ম": "8", "৯ম": "9", "১০ম": "10" };
const GROUP_TAG_MAP = { "বিজ্ঞান": "Science", "মানবিক": "Humanities", "ব্যবসায় শিক্ষা": "Business" };
const EXAM_TAG_MAP = {
  "অর্ধ-বার্ষিক পরীক্ষা": "HalfYearly",
  "নির্বাচনী পরীক্ষা": "Selection",
  "বার্ষিক পরীক্ষা": "Annual",
  "প্রাক-নির্বাচনী পরীক্ষা": "PreSelection",
};

const GRADE_TABLE = [
  { min: 80, grade: "A+", gpa: 5.0 },
  { min: 70, grade: "A", gpa: 4.0 },
  { min: 60, grade: "A-", gpa: 3.5 },
  { min: 50, grade: "B", gpa: 3.0 },
  { min: 40, grade: "C", gpa: 2.0 },
  { min: 33, grade: "D", gpa: 1.0 },
  { min: 0, grade: "F", gpa: 0.0 },
];
const MIN_COMPONENT_PERCENT = 33;

function getGrade(marksOutOf100) {
  for (const row of GRADE_TABLE) {
    if (marksOutOf100 >= row.min) return row;
  }
  return GRADE_TABLE[GRADE_TABLE.length - 1];
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const p = e.parameter;
    const required = ["year", "exam", "studentClass", "roll", "pin"];
    for (const key of required) {
      if (!p[key]) return jsonResponse({ success: false, message: "সব তথ্য পূরণ করুন।" });
    }

    const classNo = CLASS_NUMBER_MAP[p.studentClass];
    const examTag = EXAM_TAG_MAP[p.exam];
    if (!classNo || !examTag) {
      return jsonResponse({ success: false, message: "ভুল শ্রেণি বা পরীক্ষার নাম।" });
    }

    const hasGroup = classNo === "9" || classNo === "10";
    let sheetName;
    if (hasGroup) {
      const groupTag = GROUP_TAG_MAP[p.group];
      if (!groupTag) return jsonResponse({ success: false, message: "৯ম/১০ম শ্রেণির জন্য বিভাগ আবশ্যক।" });
      sheetName = `${p.year}_Class_${classNo}_${groupTag}_${examTag}`;
    } else {
      sheetName = `${p.year}_Class_${classNo}_${examTag}`;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ success: false, message: "এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি, অথবা তথ্য ভুল।" });
    }

    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const rollIdx = headers.indexOf("Roll");
    const pinIdx = headers.indexOf("PIN");

    const allResults = [];
    const subjectMaxMap = {};
    let requestedResult = null;
    let requestedRecord = null;
    let matchedRowIndex = -1;

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const record = {};
      headers.forEach((h, idx) => (record[h] = row[idx]));

      const built = buildMarksheet(record, hasGroup, p.group || null);
      const grandTotal = sumCoreRawTotals(built);
      const mathEnglishTotal = tieBreakMathEnglish(built);

      allResults.push({ rowIndex: i, gpa: built.finalGPA, status: built.status, grandTotal: grandTotal, mathEnglishTotal: mathEnglishTotal });

      built.subjects.forEach((s) => {
        if (!subjectMaxMap[s.name] || s.rawTotal > subjectMaxMap[s.name]) {
          subjectMaxMap[s.name] = s.rawTotal;
        }
      });

      if (String(row[rollIdx]).trim() === String(p.roll).trim() && String(row[pinIdx]).trim() === String(p.pin).trim()) {
        requestedResult = built;
        requestedRecord = record;
        matchedRowIndex = i;
      }
    }

    if (!requestedResult) {
      return jsonResponse({ success: false, message: "রোল নম্বর অথবা পিন সঠিক নয়।" });
    }

    // ক্লাস-সর্বোচ্চ মোট নম্বর — সবার মধ্যে (পাস/ফেল নির্বিশেষে) সর্বোচ্চ সর্বমোট নম্বর
    const classTopperTotal = Math.max(...allResults.map((r) => r.grandTotal));

    // মেধাক্রম — শুধু পাস করা শিক্ষার্থীদের মধ্যে; GPA → সর্বমোট নম্বর → (গণিত+ইংরেজি) টাই-ব্রেক
    const passedRanked = allResults
      .filter((r) => r.status === "Pass")
      .sort((a, b) => b.gpa - a.gpa || b.grandTotal - a.grandTotal || b.mathEnglishTotal - a.mathEnglishTotal);

    let merit = "প্রযোজ্য নয়";
    if (requestedResult.status === "Pass") {
      const rankIndex = passedRanked.findIndex((r) => r.rowIndex === matchedRowIndex);
      merit = rankIndex >= 0 ? rankIndex + 1 : "প্রযোজ্য নয়";
    }

    const subjectsWithMax = requestedResult.subjects.map((s) => ({
      ...s,
      classMax: subjectMaxMap[s.name] || s.rawTotal,
    }));

    delete requestedRecord.PIN;

    return jsonResponse({
      success: true,
      meta: { year: p.year, exam: p.exam, class: p.studentClass, group: hasGroup ? p.group : null },
      student: { name: requestedRecord.Name, roll: requestedRecord.Roll, section: requestedRecord.Section },
      subjects: subjectsWithMax,
      finalGPA: requestedResult.finalGPA,
      status: requestedResult.status,
      grandTotal: sumCoreRawTotals(requestedResult),
      classTopperTotal: classTopperTotal,
      merit: merit,
      comment: requestedRecord.Comment || "",
    });
  } catch (err) {
    return jsonResponse({ success: false, message: "সার্ভার ত্রুটি হয়েছে। পরে আবার চেষ্টা করুন।" });
  }
}

/** ৪র্থ বিষয় বাদে বাকি সব বিষয়ের rawTotal যোগফল ("সর্বমোট নম্বর") */
function sumCoreRawTotals(built) {
  const core = built._hasSubject4 ? built.subjects.slice(0, -1) : built.subjects;
  return Math.round(core.reduce((sum, s) => sum + s.rawTotal, 0) * 100) / 100;
}

/** টাই-ব্রেকের জন্য গণিত + ইংরেজির rawTotal যোগফল বের করা */
function tieBreakMathEnglish(built) {
  const math = built.subjects.find((s) => s.name === "গণিত");
  const english = built.subjects.find((s) => s.name === "ইংরেজি (১ম ও ২য় পত্র)");
  return (math ? math.rawTotal : 0) + (english ? english.rawTotal : 0);
}

function sumByLabel(parts, label) {
  return parts.filter((p) => p.label === label).reduce((sum, p) => sum + Number(p.value || 0), 0);
}

/**
 * একটা বিষয়ের CQ/MCQ/Practical/CA ভেঙে দেখায়, গ্রেড/জিপিএ বের করে (ব্লেন্ডেড ফর্মুলায়,
 * অপরিবর্তিত), এবং প্রদর্শনযোগ্য rawTotal (=CQ+MCQ+Practical+CA, সরাসরি যোগফল) রিটার্ন করে।
 * parts: [{ label: 'cq'|'mcq'|'practical', value, max }, ...]
 */
function makeGrade(name, parts, ca) {
  const validParts = parts.filter((p) => p.max > 0);
  const examTotal = validParts.reduce((sum, p) => sum + Number(p.value || 0), 0);
  const examMax = validParts.reduce((sum, p) => sum + p.max, 0);
  const componentFail = validParts.some((p) => (Number(p.value || 0) / p.max) * 100 < MIN_COMPONENT_PERCENT);

  const caMarks = Number(ca) || 0;
  const examPercentOf80 = (examTotal / examMax) * 80;
  const finalMark = Math.round((examPercentOf80 + caMarks) * 100) / 100; // শুধু গ্রেড/জিপিএ নির্ণয়ের জন্য

  let g = getGrade(finalMark);
  if (componentFail) g = { grade: "F", gpa: 0 };

  const cq = sumByLabel(validParts, "cq");
  const mcq = sumByLabel(validParts, "mcq");
  const practical = sumByLabel(validParts, "practical");
  const rawTotal = Math.round((cq + mcq + practical + caMarks) * 100) / 100;

  return {
    name: name,
    hasCq: validParts.some((p) => p.label === "cq"),
    hasMcq: validParts.some((p) => p.label === "mcq"),
    hasPractical: validParts.some((p) => p.label === "practical"),
    cq: cq,
    mcq: mcq,
    practical: practical,
    ca: caMarks,
    rawTotal: rawTotal,
    grade: g.grade,
    gpa: g.gpa,
    componentFail: componentFail,
  };
}

/** প্র্যাকটিক্যাল কলামে মান আছে কিনা দেখে CQ/MCQ/Practical এর max ও লেবেলড parts বানায় */
function cqMcqPracticalParts(r, prefix) {
  const practicalVal = r[prefix + "_Practical"];
  const hasPractical = practicalVal !== "" && practicalVal !== undefined && practicalVal !== null;
  const parts = [
    { label: "cq", value: r[prefix + "_CQ"], max: hasPractical ? 50 : 70 },
    { label: "mcq", value: r[prefix + "_MCQ"], max: hasPractical ? 25 : 30 },
  ];
  if (hasPractical) parts.push({ label: "practical", value: practicalVal, max: 25 });
  return parts;
}

function buildMarksheet(r, hasGroup, group) {
  const subjects = [];

  subjects.push(
    makeGrade(
      "বাংলা (১ম ও ২য় পত্র)",
      [
        { label: "cq", value: r.Bangla1_CQ, max: 70 },
        { label: "mcq", value: r.Bangla1_MCQ, max: 30 },
        { label: "cq", value: r.Bangla2_CQ, max: 70 },
        { label: "mcq", value: r.Bangla2_MCQ, max: 30 },
      ],
      r.Bangla_CA
    )
  );

  subjects.push(
    makeGrade(
      "ইংরেজি (১ম ও ২য় পত্র)",
      [
        { label: "cq", value: r.English1_CQ, max: 100 },
        { label: "cq", value: r.English2_CQ, max: 100 },
      ],
      r.English_CA
    )
  );

  subjects.push(makeGrade("গণিত", [{ label: "cq", value: r.Math_CQ, max: 70 }, { label: "mcq", value: r.Math_MCQ, max: 30 }], r.Math_CA));

  const religionLabel = r.Religion_Type || "ধর্ম শিক্ষা";
  subjects.push(
    makeGrade(religionLabel, [{ label: "cq", value: r.Religion_CQ, max: 70 }, { label: "mcq", value: r.Religion_MCQ, max: 30 }], r.Religion_CA)
  );

  const ictHasPractical = r.ICT_Practical !== "" && r.ICT_Practical !== undefined && r.ICT_Practical !== null;
  const ictParts = [{ label: "mcq", value: r.ICT_MCQ, max: 25 }];
  if (ictHasPractical) ictParts.push({ label: "practical", value: r.ICT_Practical, max: 25 });
  subjects.push(makeGrade("তথ্য ও যোগাযোগ প্রযুক্তি", ictParts, r.ICT_CA));

  let subject4Grade = null;
  let hasSubject4 = false;

  if (!hasGroup) {
    subjects.push(
      makeGrade("বিজ্ঞান", [{ label: "cq", value: r.Science_CQ, max: 70 }, { label: "mcq", value: r.Science_MCQ, max: 30 }], r.Science_CA)
    );
    subjects.push(
      makeGrade("বাংলাদেশ ও বিশ্বপরিচয়", [{ label: "cq", value: r.BGS_CQ, max: 70 }, { label: "mcq", value: r.BGS_MCQ, max: 30 }], r.BGS_CA)
    );
    subjects.push(
      makeGrade(
        "কৃষি শিক্ষা",
        [{ label: "cq", value: r.Agriculture_CQ, max: 70 }, { label: "mcq", value: r.Agriculture_MCQ, max: 30 }],
        r.Agriculture_CA
      )
    );
  } else {
    const bgsGenSciLabel = group === "বিজ্ঞান" ? "বাংলাদেশ ও বিশ্বপরিচয়" : "সাধারণ বিজ্ঞান";
    subjects.push(
      makeGrade(
        bgsGenSciLabel,
        [{ label: "cq", value: r.BGS_GenSci_CQ, max: 70 }, { label: "mcq", value: r.BGS_GenSci_MCQ, max: 30 }],
        r.BGS_GenSci_CA
      )
    );

    subjects.push(makeGrade(r.GroupSub1_Name, cqMcqPracticalParts(r, "GroupSub1"), r.GroupSub1_CA));
    subjects.push(makeGrade(r.GroupSub2_Name, cqMcqPracticalParts(r, "GroupSub2"), r.GroupSub2_CA));

    if (r.Subject3_Name) {
      subjects.push(makeGrade(r.Subject3_Name, cqMcqPracticalParts(r, "Subject3"), r.Subject3_CA));
    }

    if (r.Subject4_Name) {
      subject4Grade = makeGrade(r.Subject4_Name, cqMcqPracticalParts(r, "Subject4"), r.Subject4_CA);
      subjects.push(subject4Grade);
      hasSubject4 = true;
    }
  }

  const coreSubjects = subject4Grade ? subjects.slice(0, -1) : subjects;
  const avgGPA = coreSubjects.reduce((sum, s) => sum + s.gpa, 0) / coreSubjects.length;

  let bonus = 0;
  if (subject4Grade) bonus = Math.min(1, Math.max(0, subject4Grade.gpa - 2));

  let finalGPA = Math.min(5, avgGPA + bonus);
  finalGPA = Math.round(finalGPA * 100) / 100;

  const failed = coreSubjects.some((s) => s.grade === "F");
  const status = failed ? "Fail" : "Pass";

  return { subjects, finalGPA: failed ? 0 : finalGPA, status, _hasSubject4: hasSubject4 };
}
