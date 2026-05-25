const securityRows = [
  { title: "Unknown gait in restricted zone", meta: "Server Wing · confidence 58%", risk: "High" },
  { title: "Tailgating movement pattern", meta: "Access Door 3 · confidence 73%", risk: "High" },
  { title: "New visitor gait profile", meta: "Lobby · confidence 81%", risk: "Medium" },
  { title: "Known profile verified", meta: "Gate A · confidence 96%", risk: "Low" }
];
const medicalRows = [
  { title: "Patient C", meta: "41/100 gait score · 21% asymmetry", risk: "High" },
  { title: "Patient B", meta: "63/100 gait score · 12% asymmetry", risk: "Medium" },
  { title: "Patient D", meta: "76/100 gait score · improving stability", risk: "Low" },
  { title: "Patient A", meta: "84/100 gait score · stable pattern", risk: "Low" }
];
const securityData = [12,18,14,21,28,16,11];
const medicalData = [56,61,68,73,78,84,88];
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
let mode = "security";
function draw(vals){
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 700;
  const h = 260;
  canvas.width = w*dpr; canvas.height = h*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1;
  for(let i=0;i<5;i++){let y=30+i*45;ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(w-20,y);ctx.stroke();}
  const min=Math.min(...vals)-5,max=Math.max(...vals)+5,step=(w-60)/(vals.length-1);
  const pts=vals.map((v,i)=>[30+i*step,h-35-((v-min)/(max-min))*(h-70)]);
  const grad=ctx.createLinearGradient(0,0,0,h); grad.addColorStop(0,"rgba(79,70,229,.25)"); grad.addColorStop(1,"rgba(79,70,229,0)");
  ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.lineTo(pts[pts.length-1][0],h-35); ctx.lineTo(pts[0][0],h-35); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.strokeStyle="#4f46e5"; ctx.lineWidth=4; ctx.stroke();
  pts.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle="#020617";ctx.fill();});
}
function rows(items){
  document.getElementById("queue").innerHTML = items.map(r => `<div class="queue-row"><div><strong>${r.title}</strong><span class="risk ${r.risk}">${r.risk}</span></div><p>${r.meta}</p></div>`).join("");
}
function setMode(next){
  mode = next;
  document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("active", b.dataset.mode===mode));
  if(mode==="security"){
    document.getElementById("m1Label").textContent="Identity confidence"; document.getElementById("m1").textContent="92%";
    document.getElementById("m2Label").textContent="High-risk alerts"; document.getElementById("m2").textContent="07";
    document.getElementById("m3Label").textContent="Weekly events"; document.getElementById("m3").textContent="1,284";
    document.getElementById("m4Label").textContent="Signal quality"; document.getElementById("m4").textContent="88%";
    document.getElementById("chartTitle").textContent="Risk signal trend"; document.getElementById("queueTitle").textContent="Security review queue";
    draw(securityData); rows(securityRows);
  } else {
    document.getElementById("m1Label").textContent="Gait health score"; document.getElementById("m1").textContent="76/100";
    document.getElementById("m2Label").textContent="Fall-risk alerts"; document.getElementById("m2").textContent="03";
    document.getElementById("m3Label").textContent="Rehab improvement"; document.getElementById("m3").textContent="+18%";
    document.getElementById("m4Label").textContent="Avg. cadence"; document.getElementById("m4").textContent="91/min";
    document.getElementById("chartTitle").textContent="Mobility improvement trend"; document.getElementById("queueTitle").textContent="Clinical priority queue";
    draw(medicalData); rows(medicalRows);
  }
}
document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
window.addEventListener("resize",()=>setMode(mode));
setMode("security");