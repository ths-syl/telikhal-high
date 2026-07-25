/**
 * তেলিখাল উচ্চ বিদ্যালয় — অনলাইন ফলাফল ব্যাকএন্ড (Google Apps Script)
 * ==========================================================================
 * সেটআপ নির্দেশনা:
 * 1. এই স্প্রেডশিটে script এডিটর খুলুন: Extensions > Apps Script
 * 2. এই পুরো কোডটা Code.gs ফাইলে পেস্ট করুন
 * 3. Deploy > New deployment > Type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 4. Deploy করার পর যে /exec URL পাবেন সেটাই result.js এর APPS_SCRIPT_URL এ বসবে
 * 5. প্রতিটা পরীক্ষার জন্য নিচের নিয়মে একটা করে Sheet ট্যাব বানাবেন:
 *      {year}_Class_{classNo}_{Group}_{examTag}   (৯ম/১০ম, গ্রুপসহ)
 *      {year}_Class_{classNo}_{examTag}           (৬ষ্ঠ-৮ম, গ্রুপ ছাড়া)
 *    উদাহরণ: 2026_Class_9_Science_HalfYearly
 *
 * ==========================================================================
 * ★ নম্বর বিভাজন (Full Marks Split) — অনুমিত মান, প্রয়োজনে GRADE/SPLIT কনস্ট্যান্ট বদলান ★
 *   CQ+MCQ (প্র্যাকটিক্যাল নেই): CQ ৭০ + MCQ ৩০ = ১০০
 *      (বাংলা, গণিত, ধর্ম, বাংলাদেশ ও বিশ্বপরিচয়/সাধারণ বিজ্ঞান, বিজ্ঞান(৬-৮), কৃষি(৬-৮),
 *       মানবিক/ব্যবসায় শিক্ষার গ্রুপ সাবজেক্ট)
 *   ইংরেজি: CQ ১০০ (MCQ নেই)
 *   ICT: MCQ ২৫ + Practical ২৫ (থাকলে) = ৫০, অথবা শুধু MCQ ২৫
 *   প্র্যাকটিক্যালসহ বিজ্ঞান বিষয় (পদার্থ, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত, কৃষি(৯-১০)):
 *      CQ ৫০ + MCQ ২৫ + Practical ২৫ = ১০০
 *   কোন সাবজেক্টে প্র্যাকটিক্যাল আছে তা শীটে সংশ্লিষ্ট _Practical কলামে মান
 *   থাকা/না-থাকা দেখেই স্বয়ংক্রিয়ভাবে ধরা হয় — আলাদা করে বলার দরকার নেই।
 *
 * ==========================================================================
 * ★ ধারাবাহিক মূল্যায়ন (CA) ও পাস/ফেল নিয়ম ★
 *   ১) প্রতিটা বিষয়ের চূড়ান্ত নম্বর = (পরীক্ষার নম্বর% × ৮০%) + CA (/২০)
 *   ২) চূড়ান্ত নম্বর ৩৩%-এর কম হলে সেই বিষয়ে ফেল (স্বাভাবিক গ্রেড টেবিল অনুযায়ী)
 *   ৩) *এছাড়াও* — পরীক্ষার যেকোনো একটা অংশে (যেমন শুধু MCQ, বা শুধু Practical)
 *      আলাদাভাবে ৩৩%-এর কম পেলেও সম্পূর্ণ বিষয়ে ফেল, ব্লেন্ডেড নম্বর যতই ভালো হোক।
 *      ধারাবাহিক মূল্যায়ন (CA) এই অংশ-ভিত্তিক ৩৩% নিয়মের আওতায় পড়ে না।
 * ==========================================================================
 *
 * ৬ষ্ঠ-৮ম শ্রেণির কলাম (গ্রুপ নেই):
 *    Name, Roll, PIN, Section
 *    Bangla1_CQ, Bangla1_MCQ, Bangla2_CQ, Bangla2_MCQ, Bangla_CA
 *    English1_CQ, English2_CQ, English_CA                    (ইংরেজিতে MCQ নেই)
 *    Math_CQ, Math_MCQ, Math_CA
 *    Science_CQ, Science_MCQ, Science_CA
 *    Religion_Type, Religion_CQ, Religion_MCQ, Religion_CA
 *    BGS_CQ, BGS_MCQ, BGS_CA                                 (বাংলাদেশ ও বিশ্বপরিচয়)
 *    Agriculture_CQ, Agriculture_MCQ, Agriculture_CA         (কৃষি শিক্ষা)
 *    ICT_MCQ, ICT_Practical, ICT_CA
 *
 * ৯ম-১০ম শ্রেণির কলাম (সব বিভাগে অভিন্ন অংশ):
 *    Name, Roll, PIN, Section
 *    Bangla1_CQ, Bangla1_MCQ, Bangla2_CQ, Bangla2_MCQ, Bangla_CA
 *    English1_CQ, English2_CQ, English_CA
 *    Math_CQ, Math_MCQ, Math_CA
 *    ICT_MCQ, ICT_Practical, ICT_CA
 *    Religion_Type, Religion_CQ, Religion_MCQ, Religion_CA
 *    BGS_GenSci_CQ, BGS_GenSci_MCQ, BGS_GenSci_CA
 *      (বিজ্ঞান বিভাগে "বাংলাদেশ ও বিশ্বপরিচয়"; মানবিক/ব্যবসায় শিক্ষায় "সাধারণ বিজ্ঞান")
 *
 *    --- বিজ্ঞান বিভাগ: Physics+Chemistry সবসময় কম্পালসরি (GroupSub1/2, প্র্যাকটিক্যালসহ), তারপর
 *        {জীববিজ্ঞান, কৃষি শিক্ষা, উচ্চতর গণিত} থেকে ২টা — ১টা কম্পালসরি(Subject3) + ১টা ঐচ্ছিক(Subject4),
 *        দুটোতেই প্র্যাকটিক্যাল আছে ---
 *    GroupSub1_Name(="পদার্থবিজ্ঞান"), GroupSub1_CQ, GroupSub1_MCQ, GroupSub1_Practical, GroupSub1_CA
 *    GroupSub2_Name(="রসায়ন"), GroupSub2_CQ, GroupSub2_MCQ, GroupSub2_Practical, GroupSub2_CA
 *    Subject3_Name, Subject3_CQ, Subject3_MCQ, Subject3_Practical, Subject3_CA
 *
 *    --- মানবিক/ব্যবসায় শিক্ষা: ৩টা বিষয়ের মধ্যে ২টা কম্পালসরি (GroupSub1/2, প্র্যাকটিক্যাল নেই,
 *        তাই ঐ কলাম ফাঁকা রাখবেন), Subject3 ফাঁকা রাখবেন (ব্যবহার হয় না) ---
 *    GroupSub1_Name, GroupSub1_CQ, GroupSub1_MCQ, GroupSub1_CA
 *    GroupSub2_Name, GroupSub2_CQ, GroupSub2_MCQ, GroupSub2_CA
 *
 *    --- সবার জন্য, ঐচ্ছিক ৪র্থ বিষয় (খালি রাখলে নেওয়া হয়নি ধরা হবে; বিজ্ঞানের প্রার্থীতে
 *        প্র্যাকটিক্যাল থাকবে, মানবিক/ব্যবসায়ে থাকবে না) ---
 *    Subject4_Name, Subject4_CQ, Subject4_MCQ, Subject4_Practical, Subject4_CA
 * ==========================================================================
 */

// ফ্রন্টএন্ডের বাংলা মান থেকে শীট-ট্যাব নামের ইংরেজি ট্যাগে রূপান্তর
const CLASS_NUMBER_MAP = { "৬ষ্ঠ": "6", "৭ম": "7", "৮ম": "8", "৯ম": "9", "১০ম": "10" };
const GROUP_TAG_MAP = { "বিজ্ঞান": "Science", "মানবিক": "Humanities", "ব্যবসায় শিক্ষা": "Business" };
const EXAM_TAG_MAP = {
  "অর্ধ-বার্ষিক পরীক্ষা": "HalfYearly",
  "নির্বাচনী পরীক্ষা": "Selection",
  "বার্ষিক পরীক্ষা": "Annual",
  "প্রথম সাময়িক পরীক্ষা": "FirstTerm",
};

// SSC গ্রেডিং স্কেল (প্রয়োজনে ভবিষ্যতে এখানে বদলালেই সব রেজাল্টে প্রযোজ্য হবে)
const GRADE_TABLE = [
  { min: 80, grade: "A+", gpa: 5.0 },
  { min: 70, grade: "A", gpa: 4.0 },
  { min: 60, grade: "A-", gpa: 3.5 },
  { min: 50, grade: "B", gpa: 3.0 },
  { min: 40, grade: "C", gpa: 2.0 },
  { min: 33, grade: "D", gpa: 1.0 },
  { min: 0, grade: "F", gpa: 0.0 },
];

const MIN_COMPONENT_PERCENT = 33; // প্রতিটা অংশে (CQ/MCQ/Practical) ন্যূনতম পাস %

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

    let matchedRow = null;
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (String(row[rollIdx]).trim() === String(p.roll).trim() && String(row[pinIdx]).trim() === String(p.pin).trim()) {
        matchedRow = row;
        break;
      }
    }

    if (!matchedRow) {
      // নিরাপত্তার জন্য জেনেরিক এরর — রোল ভুল নাকি পিন ভুল তা আলাদা করে বলা হয় না
      return jsonResponse({ success: false, message: "রোল নম্বর অথবা পিন সঠিক নয়।" });
    }

    const record = {};
    headers.forEach((h, idx) => (record[h] = matchedRow[idx]));
    delete record.PIN; // নিরাপত্তা: পিন কখনো ফেরত পাঠানো হয় না

    const result = buildMarksheet(record, hasGroup, p.group || null);
    return jsonResponse({
      success: true,
      meta: { year: p.year, exam: p.exam, class: p.studentClass, group: p.group || null },
      student: { name: record.Name, roll: record.Roll, section: record.Section },
      subjects: result.subjects,
      finalGPA: result.finalGPA,
      status: result.status,
    });
  } catch (err) {
    return jsonResponse({ success: false, message: "সার্ভার ত্রুটি হয়েছে। পরে আবার চেষ্টা করুন।" });
  }
}

/**
 * একটা বিষয়ের অংশভিত্তিক (CQ/MCQ/Practical) নম্বর থেকে চূড়ান্ত গ্রেড বের করে।
 * components: [{ value, max }, ...] — শুধু যেসব অংশ প্রযোজ্য সেগুলোই দিতে হবে।
 * নিয়ম:
 *   - যেকোনো একটা component আলাদাভাবে ৩৩%-এর কম হলে → পুরো বিষয়ে F (ব্লেন্ডেড নম্বর যাই হোক)
 *   - নাহলে: (মোট exam% × ৮০%) + CA(/২০) থেকে স্বাভাবিক গ্রেড টেবিল প্রযোজ্য
 */
function makeGrade(name, components, ca) {
  const validComponents = components.filter((c) => c.max > 0);
  const examTotal = validComponents.reduce((sum, c) => sum + Number(c.value || 0), 0);
  const examMax = validComponents.reduce((sum, c) => sum + c.max, 0);

  const componentFail = validComponents.some((c) => (Number(c.value || 0) / c.max) * 100 < MIN_COMPONENT_PERCENT);

  const examPercentOf80 = (examTotal / examMax) * 80;
  const caMarks = Number(ca) || 0;
  const finalMark = Math.round((examPercentOf80 + caMarks) * 100) / 100;

  let g = getGrade(finalMark);
  if (componentFail) {
    g = { grade: "F", gpa: 0 }; // অংশ-ভিত্তিক ৩৩% নিয়ম ভঙ্গ হলে ব্লেন্ডেড গ্রেড উপেক্ষা করে ফেল
  }

  return {
    name: name,
    examTotal: Math.round(examTotal * 100) / 100,
    examMax: examMax,
    ca: caMarks,
    finalMark: finalMark,
    grade: g.grade,
    gpa: g.gpa,
    componentFail: componentFail,
  };
}

/**
 * প্র্যাকটিক্যাল কলামে মান আছে কিনা দেখে CQ/MCQ/Practical এর ম্যাক্স মার্ক ঠিক করে।
 *   প্র্যাকটিক্যাল থাকলে: CQ ৫০, MCQ ২৫, Practical ২৫
 *   না থাকলে: CQ ৭০, MCQ ৩০
 */
function cqMcqPracticalComponents(r, prefix) {
  const practicalVal = r[prefix + "_Practical"];
  const hasPractical = practicalVal !== "" && practicalVal !== undefined && practicalVal !== null;
  const components = [{ value: r[prefix + "_CQ"], max: hasPractical ? 50 : 70 }, { value: r[prefix + "_MCQ"], max: hasPractical ? 25 : 30 }];
  if (hasPractical) components.push({ value: practicalVal, max: 25 });
  return components;
}

/**
 * একটা ম্যাচড রেকর্ড থেকে বিষয়ভিত্তিক গ্রেড, চূড়ান্ত GPA (৪র্থ বিষয়ের বোনাসসহ),
 * ও পাস/ফেল স্ট্যাটাস বের করে।
 */
function buildMarksheet(r, hasGroup, group) {
  const subjects = [];

  // বাংলা: ২ পত্র, প্রতিটায় CQ ৭০ + MCQ ৩০
  subjects.push(
    makeGrade(
      "বাংলা (১ম ও ২য় পত্র)",
      [
        { value: r.Bangla1_CQ, max: 70 },
        { value: r.Bangla1_MCQ, max: 30 },
        { value: r.Bangla2_CQ, max: 70 },
        { value: r.Bangla2_MCQ, max: 30 },
      ],
      r.Bangla_CA
    )
  );

  // ইংরেজি: ২ পত্র, MCQ নেই, প্রতিটা CQ ১০০
  subjects.push(
    makeGrade(
      "ইংরেজি (১ম ও ২য় পত্র)",
      [
        { value: r.English1_CQ, max: 100 },
        { value: r.English2_CQ, max: 100 },
      ],
      r.English_CA
    )
  );

  // গণিত: CQ ৭০ + MCQ ৩০
  subjects.push(
    makeGrade("গণিত", [{ value: r.Math_CQ, max: 70 }, { value: r.Math_MCQ, max: 30 }], r.Math_CA)
  );

  // ধর্ম শিক্ষা: CQ ৭০ + MCQ ৩০
  const religionLabel = r.Religion_Type || "ধর্ম শিক্ষা";
  subjects.push(
    makeGrade(religionLabel, [{ value: r.Religion_CQ, max: 70 }, { value: r.Religion_MCQ, max: 30 }], r.Religion_CA)
  );

  // ICT: MCQ ২৫ + Practical ২৫ (থাকলে), নাহলে শুধু MCQ ২৫ — সব শ্রেণিতে প্র্যাকটিক্যাল সম্ভব
  const ictHasPractical = r.ICT_Practical !== "" && r.ICT_Practical !== undefined && r.ICT_Practical !== null;
  const ictComponents = [{ value: r.ICT_MCQ, max: 25 }];
  if (ictHasPractical) ictComponents.push({ value: r.ICT_Practical, max: 25 });
  subjects.push(makeGrade("তথ্য ও যোগাযোগ প্রযুক্তি", ictComponents, r.ICT_CA));

  let subject4Grade = null;

  if (!hasGroup) {
    // ===== ৬ষ্ঠ-৮ম: বিজ্ঞান, বাংলাদেশ ও বিশ্বপরিচয়, কৃষি শিক্ষা — সবই CQ৭০+MCQ৩০ =====
    subjects.push(makeGrade("বিজ্ঞান", [{ value: r.Science_CQ, max: 70 }, { value: r.Science_MCQ, max: 30 }], r.Science_CA));
    subjects.push(makeGrade("বাংলাদেশ ও বিশ্বপরিচয়", [{ value: r.BGS_CQ, max: 70 }, { value: r.BGS_MCQ, max: 30 }], r.BGS_CA));
    subjects.push(
      makeGrade("কৃষি শিক্ষা", [{ value: r.Agriculture_CQ, max: 70 }, { value: r.Agriculture_MCQ, max: 30 }], r.Agriculture_CA)
    );
  } else {
    // ===== ৯ম-১০ম: বাংলাদেশ ও বিশ্বপরিচয় (বিজ্ঞান) / সাধারণ বিজ্ঞান (মানবিক-ব্যবসায়) =====
    const bgsGenSciLabel = group === "বিজ্ঞান" ? "বাংলাদেশ ও বিশ্বপরিচয়" : "সাধারণ বিজ্ঞান";
    subjects.push(
      makeGrade(bgsGenSciLabel, [{ value: r.BGS_GenSci_CQ, max: 70 }, { value: r.BGS_GenSci_MCQ, max: 30 }], r.BGS_GenSci_CA)
    );

    // গ্রুপ সাবজেক্ট ১ ও ২ — প্র্যাকটিক্যাল আছে কিনা কলামের মান দেখেই ঠিক হয়
    subjects.push(makeGrade(r.GroupSub1_Name, cqMcqPracticalComponents(r, "GroupSub1"), r.GroupSub1_CA));
    subjects.push(makeGrade(r.GroupSub2_Name, cqMcqPracticalComponents(r, "GroupSub2"), r.GroupSub2_CA));

    // Subject3: শুধু বিজ্ঞান বিভাগে ব্যবহার হয় (মানবিক/ব্যবসায়ে খালি রাখলে বাদ পড়ে)
    if (r.Subject3_Name) {
      subjects.push(makeGrade(r.Subject3_Name, cqMcqPracticalComponents(r, "Subject3"), r.Subject3_CA));
    }

    // ৪র্থ বিষয় (ঐচ্ছিক) — মূল গড়ে না, শুধু বোনাস হিসেবে
    if (r.Subject4_Name) {
      subject4Grade = makeGrade(r.Subject4_Name, cqMcqPracticalComponents(r, "Subject4"), r.Subject4_CA);
      subjects.push(subject4Grade);
    }
  }

  // চূড়ান্ত GPA: ৪র্থ বিষয় বাদে বাকি সব বিষয়ের GPA-এর গড়
  const coreSubjects = subject4Grade ? subjects.slice(0, -1) : subjects;
  const avgGPA = coreSubjects.reduce((sum, s) => sum + s.gpa, 0) / coreSubjects.length;

  // ৪র্থ বিষয় বোনাস: (তার GPA - 2.00), সর্বোচ্চ ১.০০, সর্বনিম্ন ০
  let bonus = 0;
  if (subject4Grade) {
    bonus = Math.min(1, Math.max(0, subject4Grade.gpa - 2));
  }

  let finalGPA = Math.min(5, avgGPA + bonus);
  finalGPA = Math.round(finalGPA * 100) / 100;

  // পাস/ফেল: মূল (৪র্থ ছাড়া) যেকোনো বিষয়ে F পেলে ফেল (অংশ-ভিত্তিক ৩৩% ব্যর্থতা সহ)
  const failed = coreSubjects.some((s) => s.grade === "F");
  const status = failed ? "Fail" : "Pass";

  return { subjects, finalGPA: failed ? 0 : finalGPA, status };
}
