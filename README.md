# 🎓 Smart College Attendance Predictor & Risk Analysis Engine

> **Hackathon Solution**  
> An intelligent, interactive, real-time web platform designed to analyze college student attendance, evaluate risk levels, predict safe bunk allowances, calculate defaulter recovery schedules, and simulate what-if scenarios.

---

## 📌 Problem Statement

College students often struggle to understand their attendance standing. Questions like:
- *"Am I currently in the safe zone or defaulter list?"*
- *"How many lectures can I safely miss without dropping below the mandatory 75% threshold?"*
- *"If I'm in the defaulter list, how many consecutive lectures MUST I attend to become eligible for exams?"*
- *"How will medical leave or official duty (OD) certificates adjust my eligibility?"*

Without clear predictions, students either accidentally fall into defaulter lists (leading to exam bans/debarment) or fail to leverage safe absent allowances effectively.

---

## 🚀 Key Solution Features

1. **Real-time Attendance Risk Classifier**:
   - Classifies student standing into 4 distinct risk zones:
     - 🟢 **SAFE ZONE** ($\ge T + 5\%$): Comfortable attendance margin.
     - 🟡 **WARNING EDGE** ($T\% \le \text{Attendance} < T + 5\%$): On the edge of target threshold.
     - 🔴 **CRITICAL DEFAULTER** ($T - 10\% \le \text{Attendance} < T\%$): Defaulter risk alert.
     - 🟣 **SEVERE CRISIS** ($< T - 10\%$): High risk of exam debarment.
   - Customizable college requirement thresholds ($75\%$, $80\%$, $85\%$, $90\%$).

2. **Safe Bunk Predictor**:
   - Calculates the exact number of upcoming lectures a student can skip while guaranteeing their attendance percentage remains above the target threshold.

3. **Defaulter Recovery Calculator**:
   - Calculates the exact number of consecutive upcoming lectures a student MUST attend to catch up and achieve the target percentage threshold.

4. **Interactive "What-If" Scenario Simulator**:
   - Real-time sliders allowing students to simulate future attendance outcomes (e.g., *attending $X$ lectures and missing $Y$ lectures*) before making real-world decisions.

5. **Subject-wise & Theory/Lab Distinction**:
   - Individual subject tracking with custom credits, theory vs lab type, and per-subject target criteria.

6. **Duty Leave & Medical Exemption Buffer**:
   - Logging official duty (OD) and medical leave certificates to adjust attendance scores without penalizing student records.

7. **Weekly Class Timetable & Quick Attendance Logger**:
   - Interactive weekly timetable grid with 1-click attendance marking (Attended / Missed).

8. **Interactive Visual Analytics**:
   - Canvas/SVG charts comparing subject percentages against threshold target lines and displaying risk distribution breakdown.

---

## 📐 Mathematical Formulas

### 1. Effective Attendance Percentage
$$\text{Attendance } \% = \frac{\text{Attended Lectures} + \text{Exempted Lectures}}{\text{Total Conducted Lectures}} \times 100$$

### 2. Safe Bunks Allowed ($B$)
To find maximum future missed lectures $B$ such that $\text{Attendance} \ge T\%$:
$$\frac{\text{Attended} + \text{Exempted}}{\text{Total Conducted} + B} \ge \frac{T}{100}$$
$$\implies B = \left\lfloor \frac{(\text{Attended} + \text{Exempted}) \times 100}{T} - \text{Total Conducted} \right\rfloor$$

### 3. Defaulter Recovery Lectures Required ($R$)
To find minimum consecutive future attended lectures $R$ such that $\text{Attendance} \ge T\%$:
$$\frac{\text{Attended} + \text{Exempted} + R}{\text{Total Conducted} + R} \ge \frac{T}{100}$$
$$\implies R = \left\lceil \frac{T \times \text{Total Conducted} - 100 \times (\text{Attended} + \text{Exempted})}{100 - T} \right\rceil$$

---

## 🛠️ Technology Stack

- **Frontend Core**: HTML5, Vanilla JavaScript (ES6+ Modules)
- **Styling & UI**: Custom CSS3 (Dark Theme, Glassmorphism Design System, CSS Grid & Flexbox)
- **Visual Analytics**: Chart.js (CDN)
- **Data Persistence**: LocalStorage & JSON Import/Export
- **Zero Heavy Build Dependencies**: Runs instantly in any web browser!

---

## 💻 How to Run / Test locally

1. Open a terminal in `d:\SmartCollegeAttendancePredictor`.
2. Start a simple web server (e.g., using Python or Node.js):
   ```bash
   # Option A: Using Python
   python -m http.server 8080

   # Option B: Using Node npx
   npx -y serve -l 8080
   ```
3. Open your browser and navigate to `http://localhost:8080`.
4. Try out the pre-loaded **Demo Presets**:
   - **CS Sem 5 (Standard)**
   - **Defaulter Recovery Case**
   - **High Attender Scholar**
