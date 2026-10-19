// Student Attendance & Engagement Dashboard
// Data is stored in this browser only (LocalStorage). This is a demo, not a server database.

const STORAGE_KEY = "campusPulseBcaDashboard_v1";
const LOW_ATTENDANCE_LIMIT = 75;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let students = [];
let attendance = []; // { date: "YYYY-MM-DD", studentId: "..." , status: "Present"|"Absent" }
let engagement = {}; // studentId: { participation: number, assignment: boolean, activity: number }
let pendingDeleteId = null;
let toastTimer = null;

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const dateOffsetISO = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const formatDate = (iso) => {
  if (!iso) return "—";
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
};
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[ch]));
const initials = (name) => name.trim().split(/\s+/).slice(0,2).map(p=>p[0]||"").join("").toUpperCase();
const avg = (nums) => nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length) : 0;
const uniqueDates = () => [...new Set(attendance.map(r=>r.date))].sort((a,b)=>b.localeCompare(a));
const getStudentAttendance = (id) => {
  const records = attendance.filter(r=>r.studentId===id);
  const present = records.filter(r=>r.status==="Present").length;
  return { present, absent: records.length-present, total: records.length, rate: records.length ? Math.round(present/records.length*100) : 0 };
};
const getOverallAttendance = () => {
  const present = attendance.filter(r=>r.status==="Present").length;
  return attendance.length ? Math.round(present/attendance.length*100) : 0;
};
const getStudentEngagement = (id) => {
  const e = engagement[id] || {participation:0,assignment:false,activity:0};
  return Math.round((Number(e.participation||0)+Number(e.activity||0)+(e.assignment?100:0))/3);
};
const getAverageEngagement = () => avg(students.map(s=>getStudentEngagement(s.id)));
const currentDayRecords = (date) => attendance.filter(r=>r.date===date);

function makeSampleData() {
  const sampleStudents = [
    ["Aarav Sharma","BCA-001","BCA-5A","aarav.sharma@example.com"],
    ["Aditi Verma","BCA-002","BCA-5A","aditi.verma@example.com"],
    ["Kabir Singh","BCA-003","BCA-5A","kabir.singh@example.com"],
    ["Priya Gupta","BCA-004","BCA-5A","priya.gupta@example.com"],
    ["Rohan Mishra","BCA-005","BCA-5A","rohan.mishra@example.com"],
    ["Neha Yadav","BCA-006","BCA-5A","neha.yadav@example.com"],
    ["Arjun Patel","BCA-007","BCA-5A","arjun.patel@example.com"],
    ["Isha Khan","BCA-008","BCA-5A","isha.khan@example.com"],
    ["Vivaan Joshi","BCA-009","BCA-5A","vivaan.joshi@example.com"],
    ["Meera Das","BCA-010","BCA-5A","meera.das@example.com"],
    ["Dev Kumar","BCA-011","BCA-5B","dev.kumar@example.com"],
    ["Sana Ali","BCA-012","BCA-5B","sana.ali@example.com"]
  ].map((s,i)=>({id:`sample-${i+1}`,name:s[0],roll:s[1],className:s[2],email:s[3]}));
  const sampleAttendance = [];
  // Create 7 days of fictional sample records; the newest day is today.
  sampleStudents.forEach((student, i) => {
    for (let offset=-6; offset<=0; offset++) {
      // A few planned absences make the demo report look realistic.
      const isAbsent = ((i*3 + Math.abs(offset)*2) % 11 === 0) || (i===4 && offset===-2) || (i===9 && offset===-5);
      sampleAttendance.push({date:dateOffsetISO(offset),studentId:student.id,status:isAbsent?"Absent":"Present"});
    }
  });
  const sampleEngagement = {};
  sampleStudents.forEach((s,i)=>{
    sampleEngagement[s.id]={
      participation:[82,91,65,76,58,88,72,94,61,79,84,68][i],
      assignment:[true,true,false,true,false,true,true,true,false,true,true,false][i],
      activity:[78,86,69,82,55,91,73,89,64,77,80,71][i]
    };
  });
  return {students:sampleStudents,attendance:sampleAttendance,engagement:sampleEngagement};
}
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({students,attendance,engagement}));
    return true;
  } catch (err) {
    showToast("Could not save data. Browser storage may be full or disabled.", true);
    return false;
  }
}
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.students) && Array.isArray(data.attendance) && data.engagement) {
        students=data.students; attendance=data.attendance; engagement=data.engagement;
        // Remove orphan records left by manually edited demo storage.
        const ids = new Set(students.map(s=>s.id));
        attendance=attendance.filter(r=>ids.has(r.studentId));
        Object.keys(engagement).forEach(id=>{if(!ids.has(id)) delete engagement[id];});
        return;
      }
    }
  } catch (err) {
    console.warn("Saved demo data could not be read; restoring sample data.",err);
  }
  const sample=makeSampleData();
  students=sample.students; attendance=sample.attendance; engagement=sample.engagement;
  saveData();
}
function showToast(message, isError=false) {
  const toast=$("#toast");
  toast.textContent=message;
  toast.classList.toggle("error",isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove("show"),3000);
}
function emptyRow(cols, message, detail="") {
  return `<tr><td colspan="${cols}"><div class="empty-state"><strong>${escapeHTML(message)}</strong>${escapeHTML(detail)}</div></td></tr>`;
}
function attendancePill(rate) {
  const cls=rate>=LOW_ATTENDANCE_LIMIT?"good":rate>=60?"warning":"bad";
  return `<span class="status-pill ${cls}">${rate}%</span>`;
}
function studentCell(student) {
  return `<div class="student-cell"><span class="student-avatar">${escapeHTML(initials(student.name))}</span><div><strong>${escapeHTML(student.name)}</strong><small>${escapeHTML(student.email)}</small></div></div>`;
}
function renderAll() {
  renderDashboard(); renderStudents(); renderAttendance(); renderEngagement(); renderReports();
  if (window.lucide) window.lucide.createIcons();
}
function renderDashboard() {
  const date=$("#attendanceDate").value || todayISO();
  const records=currentDayRecords(date);
  const present=records.filter(r=>r.status==="Present").length;
  const absent=records.filter(r=>r.status==="Absent").length;
  $("#totalStudents").textContent=students.length;
  $("#presentToday").textContent=present;
  $("#absentToday").textContent=absent;
  $("#attendanceRate").textContent=`${getOverallAttendance()}%`;
  $("#attendanceProgress").style.width=`${getOverallAttendance()}%`;
  $("#avgEngagement").textContent=getAverageEngagement();
  $("#scoreRing").style.background=`conic-gradient(#8058e6 ${getAverageEngagement()*3.6}deg,#e9e1fc 0deg)`;
  const p=avg(students.map(s=>Number((engagement[s.id]||{}).participation||0)));
  const a=avg(students.map(s=>Number((engagement[s.id]||{}).activity||0)));
  const assign=students.length?Math.round(students.filter(s=>(engagement[s.id]||{}).assignment).length/students.length*100):0;
  $("#avgParticipation").textContent=`${p}/100`; $("#avgActivity").textContent=`${a}/100`; $("#assignmentRate").textContent=`${assign}%`;
  $("#engagementMessage").textContent=getAverageEngagement()>=80?"Great overall engagement in this sample class.":getAverageEngagement()>=60?"Good progress; keep encouraging participation.":"Review classroom engagement and assignment support.";
  renderAttendanceChart();
  const low=students.filter(s=>getStudentAttendance(s.id).total && getStudentAttendance(s.id).rate<LOW_ATTENDANCE_LIMIT)
    .sort((a,b)=>getStudentAttendance(a.id).rate-getStudentAttendance(b.id).rate).slice(0,5);
  $("#lowAttendancePreview").innerHTML=low.length?low.map(s=>`<tr><td>${studentCell(s)}</td><td>${escapeHTML(s.roll)}</td><td>${attendancePill(getStudentAttendance(s.id).rate)}</td><td><span class="status-pill bad">Needs attention</span></td></tr>`).join(""):emptyRow(4,"No low-attendance students","Students with recorded attendance below 75% appear here.");
}
function renderAttendanceChart() {
  const chart=$("#attendanceChart");
  const days=Array.from({length:7},(_,i)=>dateOffsetISO(i-6));
  chart.innerHTML=days.map(date=>{
    const records=currentDayRecords(date), present=records.filter(r=>r.status==="Present").length, absent=records.filter(r=>r.status==="Absent").length;
    const total=Math.max(students.length,1);
    const p=present/total*100, a=absent/total*100;
    const label=new Date(date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"}).slice(0,3);
    return `<div class="chart-day" title="${formatDate(date)}: ${present} present, ${absent} absent"><div class="chart-columns"><span class="chart-bar present" style="height:${p}%" title="Present: ${present}"></span><span class="chart-bar absent" style="height:${a}%" title="Absent: ${absent}"></span></div><small>${label}</small></div>`;
  }).join("");
}
function renderStudents() {
  const query=$("#studentSearch").value.trim().toLowerCase();
  const classVal=$("#classFilter").value;
  const classes=[...new Set(students.map(s=>s.className))].sort();
  const old=classVal;
  $("#classFilter").innerHTML='<option value="">All classes</option>'+classes.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
  if(classes.includes(old)) $("#classFilter").value=old;
  const filtered=students.filter(s=>(!classVal||s.className===classVal)&&[s.name,s.roll,s.email,s.className].some(v=>v.toLowerCase().includes(query)));
  $("#studentCountLabel").textContent=`Showing ${filtered.length} of ${students.length} students`;
  $("#studentsTable").innerHTML=filtered.length?filtered.map(s=>{
    const rate=getStudentAttendance(s.id).rate;
    return `<tr><td>${studentCell(s)}</td><td>${escapeHTML(s.roll)}</td><td>${escapeHTML(s.className)}</td><td>${escapeHTML(s.email)}</td><td>${getStudentAttendance(s.id).total?attendancePill(rate):'<span class="status-pill warning">No records</span>'}</td><td><div class="row-actions"><button class="row-action" data-edit="${escapeHTML(s.id)}" aria-label="Edit ${escapeHTML(s.name)}" title="Edit"><i data-lucide="pencil"></i></button><button class="row-action delete" data-delete="${escapeHTML(s.id)}" aria-label="Delete ${escapeHTML(s.name)}" title="Delete"><i data-lucide="trash-2"></i></button></div></td></tr>`;
  }).join(""):emptyRow(6,"No students found","Try another search or add a student.");
}
function renderAttendance() {
  const date=$("#attendanceDate").value||todayISO();
  $("#attendanceDateCaption").textContent=`Daily class register · ${formatDate(date)}`;
  const records=currentDayRecords(date);
  $("#attendanceMarkedCount").textContent=`${records.length} / ${students.length} marked`;
  $("#attendanceTable").innerHTML=students.length?students.map(s=>{
    const record=records.find(r=>r.studentId===s.id);
    const rate=getStudentAttendance(s.id);
    return `<tr><td>${studentCell(s)}</td><td>${escapeHTML(s.roll)}</td><td><div class="attendance-status"><button class="attendance-choice ${record?.status==="Present"?"selected present":""}" data-attendance="${escapeHTML(s.id)}" data-status="Present">Present</button><button class="attendance-choice ${record?.status==="Absent"?"selected absent":""}" data-attendance="${escapeHTML(s.id)}" data-status="Absent">Absent</button></div></td><td class="attendance-overall">${rate.total?rate.rate+"%":"—"}</td></tr>`;
  }).join(""):emptyRow(4,"No students in the class","Add students from the Students section.");
  const byDate=uniqueDates();
  $("#attendanceHistory").innerHTML=byDate.length?byDate.map(d=>{
    const rs=currentDayRecords(d),p=rs.filter(r=>r.status==="Present").length,a=rs.length-p;
    return `<tr><td>${formatDate(d)}</td><td><span class="status-pill good">${p}</span></td><td><span class="status-pill bad">${a}</span></td><td>${rs.length} / ${students.length}</td></tr>`;
  }).join(""):emptyRow(4,"No attendance saved","Mark attendance and click Save attendance.");
}
function renderEngagement() {
  $("#engagementTable").innerHTML=students.length?students.map(s=>{
    const e=engagement[s.id]||{participation:0,assignment:false,activity:0};
    const score=Math.round((Number(e.participation)+Number(e.activity)+(e.assignment?100:0))/3);
    return `<tr><td>${studentCell(s)}</td><td><input class="score-input" type="number" min="0" max="100" value="${Number(e.participation)||0}" data-engagement="${escapeHTML(s.id)}" data-metric="participation" aria-label="Participation score for ${escapeHTML(s.name)}"></td><td><select class="assignment-select" data-engagement="${escapeHTML(s.id)}" data-metric="assignment" aria-label="Assignment status for ${escapeHTML(s.name)}"><option value="yes" ${e.assignment?"selected":""}>Completed</option><option value="no" ${!e.assignment?"selected":""}>Pending</option></select></td><td><input class="score-input" type="number" min="0" max="100" value="${Number(e.activity)||0}" data-engagement="${escapeHTML(s.id)}" data-metric="activity" aria-label="Activity score for ${escapeHTML(s.name)}"></td><td><span class="average-chip">${score}/100</span></td></tr>`;
  }).join(""):emptyRow(5,"No students yet","Add students to track engagement.");
  const p=avg(students.map(s=>Number((engagement[s.id]||{}).participation||0)));
  const a=avg(students.map(s=>Number((engagement[s.id]||{}).activity||0)));
  const assign=students.length?Math.round(students.filter(s=>(engagement[s.id]||{}).assignment).length/students.length*100):0;
  $("#engagementBars").innerHTML=[["Participation",p],["Assignment completion",assign],["Class activity",a]].map(([label,value])=>`<div class="metric-row"><span>${label}</span><div class="metric-track"><span style="width:${value}%"></span></div><strong>${value}%</strong></div>`).join("");
}
function renderReports() {
  const dates=uniqueDates();
  $("#totalSessions").textContent=dates.length;
  $("#lowAttendanceCount").textContent=students.filter(s=>getStudentAttendance(s.id).total&&getStudentAttendance(s.id).rate<LOW_ATTENDANCE_LIMIT).length;
  $("#reportAttendanceRate").textContent=`${getOverallAttendance()}%`;
  $("#reportEngagement").textContent=getAverageEngagement();
  const q=$("#reportSearch").value.trim().toLowerCase();
  const filtered=students.filter(s=>[s.name,s.roll].some(v=>v.toLowerCase().includes(q)));
  $("#reportTable").innerHTML=filtered.length?filtered.map(s=>{
    const r=getStudentAttendance(s.id),low=r.total&&r.rate<LOW_ATTENDANCE_LIMIT;
    return `<tr><td>${studentCell(s)}</td><td>${escapeHTML(s.roll)}</td><td>${r.present}</td><td>${r.absent}</td><td>${r.total}</td><td>${r.total?attendancePill(r.rate):"—"}</td><td>${low?'<span class="warning-copy">Below 75%</span>':'<span class="status-pill good">OK</span>'}</td></tr>`;
  }).join(""):emptyRow(7,"No students match this search");
  $("#dailyReportTable").innerHTML=dates.length?dates.map(d=>{
    const rs=currentDayRecords(d),p=rs.filter(r=>r.status==="Present").length,a=rs.length-p;
    return `<tr><td>${formatDate(d)}</td><td>${p}</td><td>${a}</td><td>${rs.length?Math.round(p/rs.length*100):0}%</td></tr>`;
  }).join(""):emptyRow(4,"No daily reports available");
}
function switchView(view) {
  const names={dashboard:["Dashboard","Track attendance and classroom engagement in one place."],students:["Students","Manage the student roster, contact details, and class sections."],attendance:["Attendance","Record and review daily student attendance."],engagement:["Engagement","Track participation, assignment completion, and classroom activity."],reports:["Reports","Review attendance patterns and export records for your project."]};
  $$(".view").forEach(el=>el.classList.toggle("active",el.id===`view-${view}`));
  $$(".nav-link").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
  $("#pageTitle").textContent=names[view][0];$("#pageCrumb").textContent=names[view][0];$("#pageDescription").textContent=names[view][1];
  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
  if(window.lucide) window.lucide.createIcons();
}
function openStudentModal(student=null) {
  $("#studentForm").reset();$("#editStudentId").value=student?.id||"";
  $("#studentModalTitle").textContent=student?"Edit student":"Add student";
  if(student){$("#studentName").value=student.name;$("#studentRoll").value=student.roll;$("#studentClass").value=student.className;$("#studentEmail").value=student.email;}
  $("#studentModal").classList.add("open");$("#studentModal").setAttribute("aria-hidden","false");
  setTimeout(()=>$("#studentName").focus(),30);
}
function closeStudentModal() {$("#studentModal").classList.remove("open");$("#studentModal").setAttribute("aria-hidden","true");}
function handleStudentSave(event) {
  event.preventDefault();
  const id=$("#editStudentId").value;
  const student={name:$("#studentName").value.trim(),roll:$("#studentRoll").value.trim(),className:$("#studentClass").value.trim(),email:$("#studentEmail").value.trim()};
  if(!student.name||!student.roll||!student.className||!student.email){showToast("Please complete every field.",true);return;}
  const duplicate=students.find(s=>s.roll.toLowerCase()===student.roll.toLowerCase()&&s.id!==id);
  if(duplicate){showToast("That roll number is already in use.",true);$("#studentRoll").focus();return;}
  if(id){const existing=students.find(s=>s.id===id);if(!existing){showToast("Student was not found.",true);return;}Object.assign(existing,student);showToast("Student details updated.");}
  else {student.id=`student-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;students.push(student);engagement[student.id]={participation:0,assignment:false,activity:0};showToast("Student added successfully.");}
  saveData();closeStudentModal();renderAll();
}
function deleteStudent(id) {
  const s=students.find(student=>student.id===id);if(!s)return;
  students=students.filter(student=>student.id!==id);
  attendance=attendance.filter(record=>record.studentId!==id);
  delete engagement[id];saveData();renderAll();showToast(`${s.name} deleted from the demo roster.`);
}
function setAttendance(id,status) {
  const date=$("#attendanceDate").value||todayISO();
  // Upsert by (date, studentId): never add duplicate rows for the same student/date.
  const existing=attendance.find(r=>r.date===date&&r.studentId===id);
  if(existing) existing.status=status; else attendance.push({date,studentId:id,status});
  renderAttendance();renderDashboard();renderReports();
}
function saveAttendance() {
  const date=$("#attendanceDate").value;
  if(!date){showToast("Please choose an attendance date.",true);return;}
  if(date>todayISO()){showToast("Choose today or a past date for attendance.",true);return;}
  const marked=currentDayRecords(date).length;
  if(!students.length){showToast("Add students before marking attendance.",true);return;}
  if(!marked){showToast("Mark students Present or Absent before saving.",true);return;}
  saveData();renderAll();showToast(`Attendance saved for ${formatDate(date)} (${marked}/${students.length} marked).`);
}
function saveEngagement() {
  let invalid=false;
  students.forEach(s=>{
    const p=$(`[data-engagement="${s.id}"][data-metric="participation"]`);
    const a=$(`[data-engagement="${s.id}"][data-metric="activity"]`);
    const assignment=$(`[data-engagement="${s.id}"][data-metric="assignment"]`);
    const pv=Number(p?.value),av=Number(a?.value);
    if(!p||!a||!Number.isFinite(pv)||!Number.isFinite(av)||pv<0||pv>100||av<0||av>100){invalid=true;return;}
    engagement[s.id]={participation:Math.round(pv),activity:Math.round(av),assignment:assignment?.value==="yes"};
  });
  if(invalid){showToast("Scores must be between 0 and 100.",true);return;}
  saveData();renderAll();showToast("Engagement scores saved successfully.");
}
function exportCSV() {
  const rows=[["Student Name","Roll Number","Class","Email","Present","Absent","Recorded Sessions","Attendance Percentage","Low Attendance Warning","Participation Score","Assignment Completed","Class Activity Score","Engagement Average"]];
  students.forEach(s=>{
    const a=getStudentAttendance(s.id),e=engagement[s.id]||{participation:0,assignment:false,activity:0};
    rows.push([s.name,s.roll,s.className,s.email,a.present,a.absent,a.total,a.rate+"%",a.total&&a.rate<LOW_ATTENDANCE_LIMIT?"Below 75%":"No warning",e.participation,e.assignment?"Yes":"No",e.activity,getStudentEngagement(s)]);
  });
  // Quote CSV values safely so commas, quotes, and line breaks remain valid.
  const csv=rows.map(row=>row.map(value=>`"${String(value??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);const link=document.createElement("a");
  link.href=url;link.download=`student-attendance-report-${todayISO()}.csv`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  showToast("CSV report exported. Check your Downloads folder.");
}
function resetDemo() {
  const ok=window.confirm("Restore original fictional sample data? This will replace your current browser demo data.");
  if(!ok)return;
  localStorage.removeItem(STORAGE_KEY);loadData();
  $("#attendanceDate").value=todayISO();renderAll();showToast("Sample demo data restored.");
}

function attachEvents() {
  $$(".nav-link").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.view)));
  $$("[data-go]").forEach(btn=>btn.addEventListener("click",()=>switchView(btn.dataset.go)));
  $("#menuToggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#addStudentBtn").addEventListener("click",()=>openStudentModal());
  $("#closeStudentModal").addEventListener("click",closeStudentModal);
  $("#cancelStudent").addEventListener("click",closeStudentModal);
  $("#studentModal").addEventListener("click",e=>{if(e.target===$("#studentModal"))closeStudentModal();});
  $("#studentForm").addEventListener("submit",handleStudentSave);
  $("#studentSearch").addEventListener("input",renderStudents);
  $("#classFilter").addEventListener("change",renderStudents);
  $("#reportSearch").addEventListener("input",renderReports);
  $("#attendanceDate").addEventListener("change",()=>{renderAttendance();renderDashboard();});
  $("#saveAttendance").addEventListener("click",saveAttendance);
  $("#markAllPresent").addEventListener("click",()=>{
    const date=$("#attendanceDate").value||todayISO();
    if(date>todayISO()){showToast("Choose today or a past date for attendance.",true);return;}
    students.forEach(s=>{const r=attendance.find(r=>r.date===date&&r.studentId===s.id);if(r)r.status="Present";else attendance.push({date,studentId:s.id,status:"Present"});});
    renderAll();showToast("All students marked present. Click Save attendance to confirm.");
  });
  $("#saveEngagement").addEventListener("click",saveEngagement);
  $("#exportCsv").addEventListener("click",exportCSV);
  $("#resetDemo").addEventListener("click",resetDemo);
  $("#cancelDelete").addEventListener("click",()=>{$("#confirmBackdrop").classList.remove("open");$("#confirmBackdrop").setAttribute("aria-hidden","true");pendingDeleteId=null;});
  $("#confirmDelete").addEventListener("click",()=>{if(pendingDeleteId)deleteStudent(pendingDeleteId);pendingDeleteId=null;$("#confirmBackdrop").classList.remove("open");$("#confirmBackdrop").setAttribute("aria-hidden","true");});
  document.addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit]");if(edit){const s=students.find(s=>s.id===edit.dataset.edit);if(s)openStudentModal(s);return;}
    const del=e.target.closest("[data-delete]");if(del){pendingDeleteId=del.dataset.delete;$("#confirmBackdrop").classList.add("open");$("#confirmBackdrop").setAttribute("aria-hidden","false");return;}
    const att=e.target.closest("[data-attendance]");if(att){setAttendance(att.dataset.attendance,att.dataset.status);}
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closeStudentModal();$("#confirmBackdrop").classList.remove("open");$("#confirmBackdrop").setAttribute("aria-hidden","true");$("#sidebar").classList.remove("open");}
  });
}
function init() {
  $("#todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short",year:"numeric"});
  $("#attendanceDate").value=todayISO();
  loadData();attachEvents();renderAll();
}
document.addEventListener("DOMContentLoaded",init);
