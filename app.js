/* ==========================================================================
   Smart College Attendance Predictor Engine
   ========================================================================== */

class AttendancePredictorApp {
  constructor() {
    this.currentPresetId = "cs_sem5";
    this.targetPercentage = 75;
    this.subjects = [];
    this.exemptions = [];
    this.timetable = {};

    // Chart.js instances
    this.chartSubjectComp = null;
    this.chartRiskDist = null;

    this.init();
  }

  init() {
    // 1. Load initial data (from localStorage or default preset)
    this.loadState();

    // 2. Bind DOM elements and events
    this.bindEvents();

    // 3. Render all UI components
    this.renderAll();

    // 4. Show welcome toast
    this.showToast("🎓 Welcome to Smart Attendance Predictor!", "info");
  }

  /* ==========================================================================
     State Management & Presets
     ========================================================================== */

  loadState() {
    const saved = localStorage.getItem("attendance_app_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentPresetId = parsed.currentPresetId || "cs_sem5";
        this.targetPercentage = parsed.targetPercentage || 75;
        this.subjects = parsed.subjects || [];
        this.exemptions = parsed.exemptions || [];
        this.timetable = parsed.timetable || {};

        document.getElementById("targetThreshold").value = this.targetPercentage;
        this.updatePresetBanner();
        return;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    this.loadPreset("cs_sem5", false);
  }

  saveState() {
    const state = {
      currentPresetId: this.currentPresetId,
      targetPercentage: this.targetPercentage,
      subjects: this.subjects,
      exemptions: this.exemptions,
      timetable: this.timetable
    };
    localStorage.setItem("attendance_app_state", JSON.stringify(state));
  }

  loadPreset(presetKey, notify = true) {
    if (!DEMO_PRESETS[presetKey]) return;
    const p = DEMO_PRESETS[presetKey];
    this.currentPresetId = p.id;
    this.targetPercentage = p.targetPercentage;
    this.subjects = JSON.parse(JSON.stringify(p.subjects));
    this.exemptions = JSON.parse(JSON.stringify(p.exemptions));
    this.timetable = JSON.parse(JSON.stringify(p.timetable));

    document.getElementById("targetThreshold").value = this.targetPercentage;
    document.getElementById("presetSelect").value = p.id;

    this.updatePresetBanner();
    this.saveState();
    this.renderAll();

    if (notify) {
      this.showToast(`Loaded Preset: ${p.name}`, "success");
    }
  }

  updatePresetBanner() {
    const p = DEMO_PRESETS[this.currentPresetId] || { name: "Custom Student Profile", description: "Custom dataset created by user." };
    document.getElementById("presetTitle").textContent = `Active Dataset: ${p.name}`;
    document.getElementById("presetDesc").textContent = p.description;
  }

  /* ==========================================================================
     Mathematical Attendance Engine
     ========================================================================== */

  getExemptionCountForSubject(subjectId) {
    return this.exemptions
      .filter(ex => ex.subjectId === subjectId)
      .reduce((sum, ex) => sum + (parseInt(ex.count) || 0), 0);
  }

  calculateSubjectStats(subject) {
    const exempted = this.getExemptionCountForSubject(subject.id);
    const effectiveAttended = (parseInt(subject.attended) || 0) + exempted;
    const total = parseInt(subject.total) || 0;
    const target = parseInt(subject.target) || this.targetPercentage;

    const percentage = total > 0 ? (effectiveAttended / total) * 100 : 0;

    let safeBunks = 0;
    let recoveryNeeded = 0;

    if (percentage >= target) {
      // Safe Bunks Formula: (Attended * 100 / Target) - Total
      if (target > 0) {
        safeBunks = Math.floor((effectiveAttended * 100 / target) - total);
        if (safeBunks < 0) safeBunks = 0;
      }
    } else {
      // Recovery Formula: (Target * Total - 100 * Attended) / (100 - Target)
      if (target < 100) {
        recoveryNeeded = Math.ceil((target * total - 100 * effectiveAttended) / (100 - target));
        if (recoveryNeeded < 0) recoveryNeeded = 0;
      }
    }

    // Risk Classification
    let riskLevel = "SAFE";
    if (percentage < target - 10) {
      riskLevel = "SEVERE";
    } else if (percentage < target) {
      riskLevel = "CRITICAL";
    } else if (percentage < target + 5) {
      riskLevel = "WARNING";
    }

    return {
      effectiveAttended,
      exempted,
      total,
      target,
      percentage,
      safeBunks,
      recoveryNeeded,
      riskLevel
    };
  }

  calculateOverallStats() {
    let totalAttended = 0;
    let totalExempted = 0;
    let totalConducted = 0;

    this.subjects.forEach(sub => {
      const stats = this.calculateSubjectStats(sub);
      totalAttended += parseInt(sub.attended) || 0;
      totalExempted += stats.exempted;
      totalConducted += parseInt(sub.total) || 0;
    });

    const totalEffective = totalAttended + totalExempted;
    const overallPct = totalConducted > 0 ? (totalEffective / totalConducted) * 100 : 0;
    const target = this.targetPercentage;

    let overallSafeBunks = 0;
    let overallRecoveryNeeded = 0;

    if (overallPct >= target) {
      overallSafeBunks = Math.floor((totalEffective * 100 / target) - totalConducted);
      if (overallSafeBunks < 0) overallSafeBunks = 0;
    } else {
      if (target < 100) {
        overallRecoveryNeeded = Math.ceil((target * totalConducted - 100 * totalEffective) / (100 - target));
        if (overallRecoveryNeeded < 0) overallRecoveryNeeded = 0;
      }
    }

    let riskLevel = "SAFE";
    if (overallPct < target - 10) {
      riskLevel = "SEVERE";
    } else if (overallPct < target) {
      riskLevel = "CRITICAL";
    } else if (overallPct < target + 5) {
      riskLevel = "WARNING";
    }

    return {
      totalAttended,
      totalExempted,
      totalConducted,
      totalEffective,
      overallPct,
      overallSafeBunks,
      overallRecoveryNeeded,
      riskLevel
    };
  }

  /* ==========================================================================
     UI Rendering Methods
     ========================================================================== */

  renderAll() {
    this.renderOverviewStats();
    this.renderSubjectTable();
    this.renderSimulatorSelect();
    this.updateSimulation();
    this.renderTimetable();
    this.renderExemptions();
    this.renderCharts();
  }

  renderOverviewStats() {
    const stats = this.calculateOverallStats();

    // 1. Overall Pct
    const statPct = document.getElementById("statOverallPct");
    statPct.textContent = `${stats.overallPct.toFixed(1)}%`;
    statPct.style.color = this.getRiskColor(stats.riskLevel);

    document.getElementById("statConductedSubtext").textContent = 
      `${stats.totalEffective} Attended (${stats.totalExempted} Exempt) / ${stats.totalConducted} Conducted`;

    // 2. Risk Badge
    const badge = document.getElementById("statRiskBadge");
    badge.className = `risk-badge ${this.getRiskBadgeClass(stats.riskLevel)}`;
    badge.textContent = this.getRiskLabel(stats.riskLevel);

    const subtext = document.getElementById("statRiskSubtext");
    subtext.textContent = this.getRiskDescription(stats.riskLevel, stats.overallPct, this.targetPercentage);

    // 3. Safe Bunks
    document.getElementById("statBunksLeft").textContent = stats.overallSafeBunks;
    document.getElementById("calcSafeBunkResult").textContent = `${stats.overallSafeBunks} Lectures`;

    // 4. Recovery Target
    document.getElementById("statRecoveryNeeded").textContent = stats.overallRecoveryNeeded;
    document.getElementById("calcRecoveryResult").textContent = `${stats.overallRecoveryNeeded} Consecutive Classes`;

    // 5. Theory vs Lab count
    const theoryCount = this.subjects.filter(s => s.type === "theory").length;
    const labCount = this.subjects.filter(s => s.type === "lab").length;
    document.getElementById("lblTheoryCount").textContent = theoryCount;
    document.getElementById("lblLabCount").textContent = labCount;
  }

  renderSubjectTable() {
    const tbody = document.getElementById("subjectTableBody");
    tbody.innerHTML = "";

    if (this.subjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">No subjects added yet. Click "+ Add Subject" to start tracking!</td></tr>`;
      return;
    }

    this.subjects.forEach(sub => {
      const stats = this.calculateSubjectStats(sub);
      const tr = document.createElement("tr");
      tr.className = "subject-row";

      const typeBadge = sub.type === "lab" ? `<span class="type-pill type-lab">LAB</span>` : `<span class="type-pill type-theory">THEORY</span>`;
      const riskClass = this.getRiskBadgeClass(stats.riskLevel);
      const riskLabel = this.getRiskLabel(stats.riskLevel);

      let safeOrRecoveryText = "";
      if (stats.percentage >= stats.target) {
        safeOrRecoveryText = `<span style="color: var(--status-warning); font-weight: 700;">🏖️ ${stats.safeBunks} Bunks</span>`;
      } else {
        safeOrRecoveryText = `<span style="color: var(--status-critical); font-weight: 700;">🚨 ${stats.recoveryNeeded} Catch-up</span>`;
      }

      tr.innerHTML = `
        <td>
          <div class="subject-code">${sub.code}</div>
          <div class="subject-name">${sub.name}</div>
        </td>
        <td>${typeBadge}</td>
        <td>
          <strong>${stats.effectiveAttended}</strong> / ${stats.total}
          ${stats.exempted > 0 ? `<div style="font-size:0.75rem; color:var(--accent-cyan);">+${stats.exempted} OD/Med</div>` : ''}
        </td>
        <td>
          <div style="font-weight: 800; color: ${this.getRiskColor(stats.riskLevel)};">${stats.percentage.toFixed(1)}%</div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.min(stats.percentage, 100)}%; background: ${this.getRiskColor(stats.riskLevel)};"></div>
          </div>
        </td>
        <td><span class="risk-badge ${riskClass}">${riskLabel}</span></td>
        <td>${safeOrRecoveryText}</td>
        <td>
          <div class="counter-controls">
            <button class="btn-counter" title="Attended class (+1 Attended, +1 Total)" onclick="app.quickLog('${sub.id}', true)">+</button>
            <button class="btn-counter" title="Missed class (+1 Total)" onclick="app.quickLog('${sub.id}', false)">-</button>
          </div>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="app.openEditSubjectModal('${sub.id}')">✏️</button>
          <button class="btn btn-outline-danger btn-sm" onclick="app.deleteSubject('${sub.id}')">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  renderSimulatorSelect() {
    const sel = document.getElementById("simSubjectSelect");
    sel.innerHTML = `<option value="all">Entire Semester (Overall Attendance)</option>`;
    this.subjects.forEach(sub => {
      const opt = document.createElement("option");
      opt.value = sub.id;
      opt.textContent = `${sub.code} - ${sub.name}`;
      sel.appendChild(opt);
    });
  }

  updateSimulation() {
    const subjectId = document.getElementById("simSubjectSelect").value;
    const futureAttend = parseInt(document.getElementById("simAttendRange").value) || 0;
    const futureMiss = parseInt(document.getElementById("simMissRange").value) || 0;

    document.getElementById("lblSimAttendVal").textContent = futureAttend;
    document.getElementById("lblSimMissVal").textContent = futureMiss;

    let currentAttended = 0;
    let currentTotal = 0;
    let target = this.targetPercentage;

    if (subjectId === "all") {
      const overall = this.calculateOverallStats();
      currentAttended = overall.totalEffective;
      currentTotal = overall.totalConducted;
    } else {
      const sub = this.subjects.find(s => s.id === subjectId);
      if (sub) {
        const stats = this.calculateSubjectStats(sub);
        currentAttended = stats.effectiveAttended;
        currentTotal = stats.total;
        target = stats.target;
      }
    }

    const currentPct = currentTotal > 0 ? (currentAttended / currentTotal) * 100 : 0;
    const newAttended = currentAttended + futureAttend;
    const newTotal = currentTotal + futureAttend + futureMiss;
    const projectedPct = newTotal > 0 ? (newAttended / newTotal) * 100 : 0;

    let riskLevel = "SAFE";
    if (projectedPct < target - 10) riskLevel = "SEVERE";
    else if (projectedPct < target) riskLevel = "CRITICAL";
    else if (projectedPct < target + 5) riskLevel = "WARNING";

    const projEl = document.getElementById("simProjectedPct");
    projEl.textContent = `${projectedPct.toFixed(1)}%`;
    projEl.style.color = this.getRiskColor(riskLevel);

    const badge = document.getElementById("simRiskBadge");
    badge.className = `risk-badge ${this.getRiskBadgeClass(riskLevel)}`;
    badge.textContent = this.getRiskLabel(riskLevel);

    document.getElementById("lblSimCurrent").textContent = `${currentPct.toFixed(1)}%`;
    document.getElementById("lblSimProjected").textContent = `${projectedPct.toFixed(1)}%`;
  }

  renderTimetable() {
    const grid = document.getElementById("timetableGrid");
    grid.innerHTML = "";

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    days.forEach(day => {
      const slots = this.timetable[day] || [];
      const col = document.createElement("div");
      col.className = "day-column";

      let slotsHTML = "";
      if (slots.length === 0) {
        slotsHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:10px;">No Classes Scheduled</div>`;
      } else {
        slots.forEach((subId, idx) => {
          const sub = this.subjects.find(s => s.id === subId);
          if (sub) {
            slotsHTML += `
              <div class="slot-item">
                <div style="font-weight:700; color:var(--accent-cyan);">${sub.code}</div>
                <div style="font-size:0.8rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${sub.name}</div>
                <div class="slot-actions">
                  <button class="btn-slot btn-present" onclick="app.quickLog('${sub.id}', true)">Attended</button>
                  <button class="btn-slot btn-absent" onclick="app.quickLog('${sub.id}', false)">Missed</button>
                </div>
              </div>
            `;
          }
        });
      }

      col.innerHTML = `
        <div class="day-header">${day}</div>
        ${slotsHTML}
      `;

      grid.appendChild(col);
    });
  }

  renderExemptions() {
    const tbody = document.getElementById("exemptionTableBody");
    tbody.innerHTML = "";

    if (this.exemptions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">No duty/medical exemptions logged yet.</td></tr>`;
      return;
    }

    this.exemptions.forEach(ex => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ex.date}</td>
        <td><strong>${ex.subjectName}</strong></td>
        <td>${ex.reason}</td>
        <td><span class="type-pill type-theory">+${ex.count} Lecture(s)</span></td>
        <td>
          <button class="btn btn-outline-danger btn-sm" onclick="app.deleteExemption('${ex.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderCharts() {
    if (typeof Chart === 'undefined') return;

    // 1. Subject Comparison Bar Chart
    const ctxBar = document.getElementById("chartSubjectComparison").getContext("2d");
    const labels = this.subjects.map(s => s.code);
    const currentData = this.subjects.map(s => this.calculateSubjectStats(s).percentage);
    const targetData = this.subjects.map(s => s.target || this.targetPercentage);

    if (this.chartSubjectComp) {
      this.chartSubjectComp.destroy();
    }

    this.chartSubjectComp = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Current Attendance %',
            data: currentData,
            backgroundColor: currentData.map(val => val >= this.targetPercentage ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
            borderColor: currentData.map(val => val >= this.targetPercentage ? '#10b981' : '#ef4444'),
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Target Threshold %',
            data: targetData,
            type: 'line',
            borderColor: '#6366f1',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9ca3af' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#9ca3af' }
          }
        },
        plugins: {
          legend: { labels: { color: '#f9fafb' } }
        }
      }
    });

    // 2. Risk Distribution Pie Chart
    const ctxPie = document.getElementById("chartRiskDistribution").getContext("2d");
    let safeCount = 0, warnCount = 0, critCount = 0, sevCount = 0;

    this.subjects.forEach(s => {
      const risk = this.calculateSubjectStats(s).riskLevel;
      if (risk === "SAFE") safeCount++;
      else if (risk === "WARNING") warnCount++;
      else if (risk === "CRITICAL") critCount++;
      else if (risk === "SEVERE") sevCount++;
    });

    if (this.chartRiskDist) {
      this.chartRiskDist.destroy();
    }

    this.chartRiskDist = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['Safe Zone', 'Warning Edge', 'Critical Defaulter', 'Severe Crisis'],
        datasets: [{
          data: [safeCount, warnCount, critCount, sevCount],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#a855f7'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#f9fafb', padding: 15 } }
        }
      }
    });
  }

  /* ==========================================================================
     Actions & Event Handlers
     ========================================================================== */

  bindEvents() {
    // Target threshold dropdown
    document.getElementById("targetThreshold").addEventListener("change", (e) => {
      this.targetPercentage = parseInt(e.target.value);
      this.saveState();
      this.renderAll();
      this.showToast(`Target updated to ${this.targetPercentage}%`, "info");
    });

    // Preset dropdown
    document.getElementById("presetSelect").addEventListener("change", (e) => {
      this.loadPreset(e.target.value, true);
    });

    // Reset button
    document.getElementById("btnReset").addEventListener("click", () => {
      if (confirm("Reset all subjects and exemptions to default preset?")) {
        this.loadPreset("cs_sem5", true);
      }
    });

    // Tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        const targetTab = btn.getAttribute("data-tab");
        document.getElementById(targetTab).classList.add("active");

        if (targetTab === "tab-analytics") {
          setTimeout(() => this.renderCharts(), 50);
        }
      });
    });

    // Modals controls
    document.getElementById("btnOpenAddSubjectModal").addEventListener("click", () => this.openAddSubjectModal());
    document.getElementById("btnAddSubjectTop").addEventListener("click", () => this.openAddSubjectModal());
    document.getElementById("btnCloseSubjectModal").addEventListener("click", () => this.closeSubjectModal());
    document.getElementById("btnCancelSubjectModal").addEventListener("click", () => this.closeSubjectModal());

    document.getElementById("btnOpenExemptionModal").addEventListener("click", () => this.openExemptionModal());
    document.getElementById("btnAddExemptionTop").addEventListener("click", () => this.openExemptionModal());
    document.getElementById("btnCloseExemptionModal").addEventListener("click", () => this.closeExemptionModal());
    document.getElementById("btnCancelExemptionModal").addEventListener("click", () => this.closeExemptionModal());

    // Subject Form Submit
    document.getElementById("formSubject").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveSubjectFromModal();
    });

    // Exemption Form Submit
    document.getElementById("formExemption").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveExemptionFromModal();
    });

    // What-If Simulator Range Controls
    document.getElementById("simSubjectSelect").addEventListener("change", () => this.updateSimulation());
    document.getElementById("simAttendRange").addEventListener("input", () => this.updateSimulation());
    document.getElementById("simMissRange").addEventListener("input", () => this.updateSimulation());
    document.getElementById("btnResetSim").addEventListener("click", () => {
      document.getElementById("simAttendRange").value = 0;
      document.getElementById("simMissRange").value = 0;
      this.updateSimulation();
    });

    // Export & Import Buttons
    document.getElementById("btnExport").addEventListener("click", () => this.exportJSON());
    document.getElementById("btnImport").addEventListener("click", () => this.openImportModal());
    document.getElementById("btnCloseImportModal").addEventListener("click", () => this.closeImportModal());
    document.getElementById("btnCancelImportModal").addEventListener("click", () => this.closeImportModal());
    document.getElementById("btnConfirmImport").addEventListener("click", () => this.confirmImport());
  }

  quickLog(subjectId, attended) {
    const sub = this.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    sub.total = (parseInt(sub.total) || 0) + 1;
    if (attended) {
      sub.attended = (parseInt(sub.attended) || 0) + 1;
      this.showToast(`Marked ATTENDED for ${sub.code}`, "success");
    } else {
      this.showToast(`Marked MISSED for ${sub.code}`, "warning");
    }

    this.saveState();
    this.renderAll();
  }

  openAddSubjectModal() {
    document.getElementById("modalSubjectTitle").textContent = "Add New Subject";
    document.getElementById("subjectEditId").value = "";
    document.getElementById("formSubject").reset();
    document.getElementById("subTarget").value = this.targetPercentage;
    document.getElementById("modalSubject").classList.add("active");
  }

  openEditSubjectModal(subjectId) {
    const sub = this.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    document.getElementById("modalSubjectTitle").textContent = `Edit Subject: ${sub.code}`;
    document.getElementById("subjectEditId").value = sub.id;
    document.getElementById("subCode").value = sub.code;
    document.getElementById("subName").value = sub.name;
    document.getElementById("subType").value = sub.type;
    document.getElementById("subAttended").value = sub.attended;
    document.getElementById("subTotal").value = sub.total;
    document.getElementById("subTarget").value = sub.target || this.targetPercentage;
    document.getElementById("subCredits").value = sub.credits || 4;

    document.getElementById("modalSubject").classList.add("active");
  }

  closeSubjectModal() {
    document.getElementById("modalSubject").classList.remove("active");
  }

  saveSubjectFromModal() {
    const editId = document.getElementById("subjectEditId").value;
    const code = document.getElementById("subCode").value.trim();
    const name = document.getElementById("subName").value.trim();
    const type = document.getElementById("subType").value;
    const attended = parseInt(document.getElementById("subAttended").value) || 0;
    const total = parseInt(document.getElementById("subTotal").value) || 0;
    const target = parseInt(document.getElementById("subTarget").value) || 75;
    const credits = parseInt(document.getElementById("subCredits").value) || 4;

    if (editId) {
      const sub = this.subjects.find(s => s.id === editId);
      if (sub) {
        sub.code = code;
        sub.name = name;
        sub.type = type;
        sub.attended = attended;
        sub.total = total;
        sub.target = target;
        sub.credits = credits;
        this.showToast(`Updated subject ${code}`, "success");
      }
    } else {
      const newSub = {
        id: "sub_" + Date.now(),
        code,
        name,
        type,
        attended,
        total,
        target,
        credits
      };
      this.subjects.push(newSub);
      this.showToast(`Added new subject ${code}`, "success");
    }

    this.closeSubjectModal();
    this.saveState();
    this.renderAll();
  }

  deleteSubject(subjectId) {
    const sub = this.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    if (confirm(`Are you sure you want to delete ${sub.code} - ${sub.name}?`)) {
      this.subjects = this.subjects.filter(s => s.id !== subjectId);
      this.exemptions = this.exemptions.filter(ex => ex.subjectId !== subjectId);
      this.saveState();
      this.renderAll();
      this.showToast(`Deleted subject ${sub.code}`, "warning");
    }
  }

  openExemptionModal() {
    const sel = document.getElementById("exSubject");
    sel.innerHTML = "";
    this.subjects.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.code} - ${s.name}`;
      sel.appendChild(opt);
    });

    document.getElementById("exDate").value = new Date().toISOString().split('T')[0];
    document.getElementById("exCount").value = 1;
    document.getElementById("exReason").value = "";

    document.getElementById("modalExemption").classList.add("active");
  }

  closeExemptionModal() {
    document.getElementById("modalExemption").classList.remove("active");
  }

  saveExemptionFromModal() {
    const subjectId = document.getElementById("exSubject").value;
    const sub = this.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    const date = document.getElementById("exDate").value;
    const count = parseInt(document.getElementById("exCount").value) || 1;
    const reason = document.getElementById("exReason").value.trim();

    const ex = {
      id: "ex_" + Date.now(),
      date,
      subjectId: sub.id,
      subjectName: sub.name,
      reason,
      count
    };

    this.exemptions.push(ex);
    this.closeExemptionModal();
    this.saveState();
    this.renderAll();
    this.showToast(`Logged ${count} lecture exemption for ${sub.code}`, "success");
  }

  deleteExemption(exemptionId) {
    this.exemptions = this.exemptions.filter(ex => ex.id !== exemptionId);
    this.saveState();
    this.renderAll();
    this.showToast("Exemption removed", "warning");
  }

  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      targetPercentage: this.targetPercentage,
      subjects: this.subjects,
      exemptions: this.exemptions,
      timetable: this.timetable
    }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `attendance_profile_${Date.now()}.json`);
    dlAnchorElem.click();
    this.showToast("Profile data exported successfully!", "success");
  }

  openImportModal() {
    document.getElementById("importJsonArea").value = "";
    document.getElementById("modalImport").classList.add("active");
  }

  closeImportModal() {
    document.getElementById("modalImport").classList.remove("active");
  }

  confirmImport() {
    const jsonText = document.getElementById("importJsonArea").value.trim();
    if (!jsonText) return;

    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.subjects && Array.isArray(parsed.subjects)) {
        this.subjects = parsed.subjects;
        if (parsed.exemptions) this.exemptions = parsed.exemptions;
        if (parsed.targetPercentage) this.targetPercentage = parsed.targetPercentage;
        if (parsed.timetable) this.timetable = parsed.timetable;

        this.closeImportModal();
        this.saveState();
        this.renderAll();
        this.showToast("Profile imported successfully!", "success");
      } else {
        alert("Invalid JSON format. Expected subjects array.");
      }
    } catch (e) {
      alert("Failed to parse JSON string. Please check format.");
    }
  }

  /* ==========================================================================
     Helper Utility Methods
     ========================================================================== */

  getRiskColor(level) {
    switch (level) {
      case "SAFE": return "#10b981";
      case "WARNING": return "#f59e0b";
      case "CRITICAL": return "#ef4444";
      case "SEVERE": return "#a855f7";
      default: return "#9ca3af";
    }
  }

  getRiskBadgeClass(level) {
    switch (level) {
      case "SAFE": return "risk-safe";
      case "WARNING": return "risk-warning";
      case "CRITICAL": return "risk-critical";
      case "SEVERE": return "risk-severe";
      default: return "";
    }
  }

  getRiskLabel(level) {
    switch (level) {
      case "SAFE": return "SAFE ZONE";
      case "WARNING": return "WARNING EDGE";
      case "CRITICAL": return "CRITICAL DEFAULTER";
      case "SEVERE": return "SEVERE CRISIS";
      default: return "UNKNOWN";
    }
  }

  getRiskDescription(level, pct, target) {
    switch (level) {
      case "SAFE": return `Comfortable buffer (+${(pct - target).toFixed(1)}% above ${target}% requirement)`;
      case "WARNING": return `Near threshold (${(pct - target).toFixed(1)}% above ${target}%). Avoid missing next lectures.`;
      case "CRITICAL": return `Below ${target}% threshold! Immediate recovery lectures required to avoid defaulter list.`;
      case "SEVERE": return `Severe deficit (${(target - pct).toFixed(1)}% below ${target}%). High risk of exam debarment!`;
      default: return "";
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize Application on DOM Ready
let app = null;
document.addEventListener("DOMContentLoaded", () => {
  app = new AttendancePredictorApp();
});
