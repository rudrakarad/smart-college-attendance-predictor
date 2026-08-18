// Hackathon Demo Presets & Sample Data

const DEMO_PRESETS = {
  cs_sem5: {
    id: "cs_sem5",
    name: "CS Engineering - 5th Semester (Balanced)",
    description: "Standard course load with 5 theory subjects & 2 lab sessions. Moderate attendance level.",
    targetPercentage: 75,
    subjects: [
      { id: "sub_1", code: "CS501", name: "Database Management Systems", credits: 4, type: "theory", attended: 28, total: 34, target: 75 },
      { id: "sub_2", code: "CS502", name: "Operating Systems", credits: 4, type: "theory", attended: 22, total: 32, target: 75 },
      { id: "sub_3", code: "CS503", name: "Design & Analysis of Algorithms", credits: 4, type: "theory", attended: 30, total: 36, target: 75 },
      { id: "sub_4", code: "CS504", name: "Computer Networks", credits: 3, type: "theory", attended: 21, total: 30, target: 75 },
      { id: "sub_5", code: "CS505", name: "Software Engineering", credits: 3, type: "theory", attended: 25, total: 28, target: 75 },
      { id: "sub_6", code: "CS501L", name: "DBMS Laboratory", credits: 2, type: "lab", attended: 11, total: 12, target: 80 },
      { id: "sub_7", code: "CS502L", name: "OS Laboratory", credits: 2, type: "lab", attended: 9, total: 12, target: 80 }
    ],
    exemptions: [
      { id: "ex_1", date: "2026-08-05", subjectId: "sub_2", subjectName: "Operating Systems", reason: "Hackathon Participation (OD)", count: 2 },
      { id: "ex_2", date: "2026-08-12", subjectId: "sub_4", subjectName: "Computer Networks", reason: "Medical Certificate", count: 1 }
    ],
    timetable: {
      Monday: ["sub_1", "sub_2", "sub_3", "sub_6"],
      Tuesday: ["sub_4", "sub_5", "sub_1", "sub_7"],
      Wednesday: ["sub_2", "sub_3", "sub_4", "sub_6"],
      Thursday: ["sub_5", "sub_1", "sub_2", "sub_3"],
      Friday: ["sub_4", "sub_5", "sub_7", "sub_1"],
      Saturday: ["sub_3", "sub_2"]
    }
  },
  defaulter_demo: {
    id: "defaulter_demo",
    name: "Defaulter Recovery Scenario (High Risk)",
    description: "Low attendance profile requiring immediate recovery calculations to reach 75%. Perfect for demoing the recovery engine.",
    targetPercentage: 75,
    subjects: [
      { id: "sub_101", code: "MATH301", name: "Applied Mathematics III", credits: 4, type: "theory", attended: 16, total: 32, target: 75 },
      { id: "sub_102", code: "CS302", name: "Data Structures & Algorithms", credits: 4, type: "theory", attended: 18, total: 34, target: 75 },
      { id: "sub_103", code: "CS303", name: "Digital Logic Design", credits: 3, type: "theory", attended: 22, total: 30, target: 75 },
      { id: "sub_104", code: "CS304", name: "Object Oriented Tech", credits: 3, type: "theory", attended: 14, total: 28, target: 75 },
      { id: "sub_105", code: "CS302L", name: "DSA Lab", credits: 2, type: "lab", attended: 6, total: 12, target: 80 }
    ],
    exemptions: [
      { id: "ex_101", date: "2026-07-20", subjectId: "sub_101", subjectName: "Applied Mathematics III", reason: "Sports Meet (OD)", count: 2 }
    ],
    timetable: {
      Monday: ["sub_101", "sub_102", "sub_103"],
      Tuesday: ["sub_104", "sub_101", "sub_105"],
      Wednesday: ["sub_102", "sub_103", "sub_104"],
      Thursday: ["sub_101", "sub_102", "sub_105"],
      Friday: ["sub_103", "sub_104", "sub_101"]
    }
  },
  scholar_demo: {
    id: "scholar_demo",
    name: "Distinction Scholar (High Attendance)",
    description: "High attendance profile (>88%) demonstrating the Safe Bunk Predictor engine.",
    targetPercentage: 75,
    subjects: [
      { id: "sub_201", code: "AI601", name: "Artificial Intelligence", credits: 4, type: "theory", attended: 36, total: 38, target: 75 },
      { id: "sub_202", code: "AI602", name: "Machine Learning", credits: 4, type: "theory", attended: 34, total: 36, target: 75 },
      { id: "sub_203", code: "AI603", name: "Cloud Computing", credits: 3, type: "theory", attended: 28, total: 30, target: 75 },
      { id: "sub_204", code: "AI604", name: "Cyber Security", credits: 3, type: "theory", attended: 27, total: 29, target: 75 },
      { id: "sub_205", code: "AI602L", name: "ML Lab", credits: 2, type: "lab", attended: 12, total: 12, target: 80 }
    ],
    exemptions: [],
    timetable: {
      Monday: ["sub_201", "sub_202", "sub_205"],
      Tuesday: ["sub_203", "sub_204", "sub_201"],
      Wednesday: ["sub_202", "sub_203", "sub_205"],
      Thursday: ["sub_204", "sub_201", "sub_202"],
      Friday: ["sub_203", "sub_204"]
    }
  }
};
