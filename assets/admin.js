/* =========================================================
   ADMIN DASHBOARD: shell, dashboard, lists, setup modules
   (calendar → cal.js · visit workflow → visit.js · dentists → dentist.js)
========================================================= */
let aTab='dash',aBranch='all',aFilter={st:'All',dent:'',q:'',when:'all'},calState={view:'month',y:new Date().getFullYear(),m:new Date().getMonth(),sel:TODAY,dent:''},rangeD=90,emTab='log',dSel={};
const curStaff=()=>S.adm?stById(S.adm):null;
const isDentist=()=>curStaff()?.role==='dentist';
const isSuper=()=>curStaff()?.role==='super';
const myDent=()=>isDentist()?dById(curStaff().dentistId):null;
const sBranchIds=s=>{
  if(s.role==='dentist'){const d=dById(s.dentistId);const l=S.branches.filter(b=>b.status!=='inactive'&&d&&dentAt(d,b.id)).map(b=>b.id);return l.length?l:S.branches.filter(b=>b.status==='active').map(b=>b.id)}
  return s.branchIds==='all'?S.branches.map(b=>b.id):s.branchIds};
const myBranches=()=>{const u=curStaff();if(!u)return [];const ids=sBranchIds(u);return S.branches.filter(b=>ids.includes(b.id))};
const scopeIds=()=>{const mine=myBranches().map(b=>b.id);return aBranch==='all'?mine:mine.filter(x=>x===aBranch)};
const inScope=a=>scopeIds().includes(a.branchId);
const scAppts=()=>S.appts.filter(a=>inScope(a)&&(!isDentist()||a.dentistId===curStaff().dentistId));
const showBr=()=>scopeIds().length>1;
const patName=a=>uById(a.patientId)?.name||'Unknown';
const sortAppts=l=>l.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
const pendingN=()=>scAppts().filter(a=>a.status==='Pending').length;

const ALL4=['super','manager','staff','dentist'],OPS=['super','manager','staff'];
const TABS=[
 ['grp','Operations'],['dash','home','Dashboard',ALL4],['appts','cal','Appointments',ALL4],['cal','cc','Calendar',ALL4],['myschd','clock','My schedule',['dentist']],['pts','user','Patients',OPS],
 ['grp','Clinic setup'],['branches','branch','Branches',['super']],['dent','users','Dentist schedules',['super','manager']],['rq','refresh','Schedule requests',['super','manager']],['svc','svc','Services',['super']],
 ['grp','Insights'],['rep','chart','Reports & analytics',['super','manager']],
 ['grp','System'],['mail','bell','Email notifications',['super','manager']],['inq','msg','Inquiries',OPS],['staff','key','Staff & roles',['super']],['set','cog','Settings',['super']]
];
const canSee=t=>t[3].includes(curStaff().role);
const TITLES={dash:['Dashboard','Overview of your clinic today'],appts:['Appointments','Review, approve, reject or reschedule bookings'],cal:['Appointment calendar','Month, week and day views. Click a day for details'],myschd:['My schedule','Your working days per branch, and requests to change them'],pts:['Patients','Patients and their appointment history'],branches:['Branches','Add and manage clinic branches, hours and status'],dent:['Dentist schedules','Who is on duty, weekly availability per branch, and days off'],rq:['Schedule change requests','Requests from dentists, approved or declined by admin'],svc:['Services','Manage the services patients can book'],rep:['Reports & analytics','Appointment statistics and reporting'],mail:['Email notifications','Confirmations, status updates and reminders'],inq:['Website inquiries','Messages from the contact form'],staff:['Staff & roles','Who can sign in, and what they can access'],set:['Settings','Booking rules and defaults']};
const TITLES_D={dash:['My dashboard','Your patients and schedule today'],appts:['My appointments','Appointments assigned to you'],cal:['My calendar','Your appointments by month, week or day']};
const titleOf=t=>(isDentist()&&TITLES_D[t])||TITLES[t];

/* =========================================================
   SHELL
========================================================= */
function initAdmin(){
  const acc=$('#l_acct');acc.innerHTML=S.staff.filter(s=>s.active).map(s=>`<option value="${s.id}">${esc(s.name)} · ${esc(ROLES[s.role].name)}</option>`).join('');
  const d=()=>{const s=stById(acc.value);$('#l_desc').textContent=s?ROLES[s.role].desc+(s.branchIds==='all'?' · all branches':' · '+sBranchIds(s).map(bShort).join(', ')):''};acc.onchange=d;d();
  renderAdmin();
}
function renderAdmin(){const u=curStaff();if(u&&!u.active){S.adm=null}const on=!!curStaff();$('#login').hidden=on;$('#dash').hidden=!on;if(on){const mine=myBranches();if(aBranch!=='all'&&!mine.some(b=>b.id===aBranch))aBranch='all';if(mine.length===1)aBranch=mine[0].id;drawAdmin()}}
function drawAdmin(){
  const u=curStaff();if(!u)return renderAdmin();
  const tabs=TABS.filter(t=>t[0]==='grp'||canSee(t));if(!tabs.some(t=>t[0]===aTab))aTab='dash';
  const badge={appts:isDentist()?0:pendingN(),rq:rqPending().length};
  let nav=`<a class="logo" href="index.html"><span class="logo-mark"><img src="assets/logo.png" alt="Smile Matters logo" width="40" height="40"></span><span><b>Smile Matters</b><small>Admin</small></span></a>`;
  tabs.forEach((t,i)=>{if(t[0]==='grp'){const nx=tabs[i+1];if(nx&&nx[0]!=='grp')nav+=`<div class="grp">${t[1]}</div>`}else nav+=`<button class="${aTab===t[0]?'on':''}" data-act="a-tab" data-tab="${t[0]}">${ic(t[1])}${t[0]==='appts'&&isDentist()?'My appointments':t[2]}${badge[t[0]]?`<span class="cnt">${badge[t[0]]}</span>`:''}</button>`});
  nav+=`<div class="sp"></div><button data-act="a-logout">${ic('out')}Sign out</button>`;
  $('#admNav').innerHTML=nav;
  $('#aTitle').textContent=titleOf(aTab)[0];$('#aSub').textContent=titleOf(aTab)[1];
  $('#whoTag').innerHTML=`${ic('user')}${esc(u.name)} · ${esc(ROLES[u.role].name)}`;
  const mine=myBranches();
  $('#brSwitch').innerHTML=mine.length>1?`${ic('pin')}<select class="inp" id="aBr" aria-label="Branch filter"><option value="all" ${aBranch==='all'?'selected':''}>All branches</option>${mine.map(b=>`<option value="${b.id}" ${aBranch===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select>`:`<span class="who-tag">${ic('pin')}${esc(mine[0]?.name||'No branch')}</span>`;
  const sel=$('#aBr');if(sel)sel.onchange=e=>{aBranch=e.target.value;drawAdmin()};
  const V={dash:isDentist()?vDashDent:vDash,appts:vAppts,cal:vCal,myschd:vMySched,pts:vPts,branches:vBranches,dent:vDent,rq:vRq,svc:vSvc,rep:vRep,mail:vMail,inq:vInq,staff:vStaff,set:vSet}[aTab];
  $('#aView').innerHTML=V();
  if(aTab==='appts')bindAppts();
}
$('#notesToggle').onchange=e=>document.body.classList.toggle('notes',e.target.checked);
window.onReset=()=>{aTab='dash';aBranch='all';dSel={};calState.sel=TODAY;initAdmin()};
window.onDataChanged=()=>{if(curStaff())drawAdmin()};

/* =========================================================
   DASHBOARD
========================================================= */
function weeklyData(n,ids,mine){const out=[];let mon=TODAY;while(dow(mon)!==1)mon=addDays(mon,-1);for(let i=n-1;i>=0;i--){const s=addDays(mon,-7*i),e=addDays(s,6);out.push({label:fmtDs(s),n:S.appts.filter(a=>ids.includes(a.branchId)&&(!mine||a.dentistId===mine)&&a.date>=s&&a.date<=e&&!['Rejected','Cancelled'].includes(a.status)).length})}return out}
/* number of upcoming days where a branch has more patients booked than its per-slot limit */
function overCapDays(ids){let n=0;ids.forEach(bid=>{const cap=capOf(bid);const L=S.appts.filter(a=>a.branchId===bid&&a.date>=TODAY&&holds(a));[...new Set(L.map(a=>a.date))].forEach(date=>{const ms=new Set();L.filter(a=>a.date===date).forEach(a=>{for(let m=mins(a.time);m<mins(a.time)+apptDur(a);m+=15)ms.add(m)});for(const m of ms){if(occupancy(bid,date,m)>cap){n++;break}}})});return n}
function vDash(){
  const ids=scopeIds(),A=scAppts();const today=sortAppts(A.filter(a=>a.date===TODAY&&['Approved','Completed','No-show'].includes(a.status)));
  const inClinic=today.filter(a=>a.status==='Approved'&&['Arrived','On-going'].includes(a.visit)).length;
  const wkEnd=addDays(TODAY,7);const week=A.filter(a=>a.date>=TODAY&&a.date<=wkEnd&&['Approved','Pending'].includes(a.status)).length;
  const pend=sortAppts(A.filter(a=>a.status==='Pending'));
  const k=[['Today',today.length,'appointments'],['In clinic now',inClinic,'arrived or on-going'],['Pending approval',pend.length,'need your review'],['Next 7 days',week,'booked or pending']];
  const wk=weeklyData(8,ids);const mx=Math.max(1,...wk.map(w=>w.n));
  const al=[];
  myBranches().filter(b=>b.status==='active'&&ids.includes(b.id)).forEach(b=>{if(!dentsAt(b.id).length)al.push(['w',`${b.name} is active but has no dentist scheduled. Patients can't book there.`])});
  const old=pend.filter(a=>Date.now()-new Date(a.created)>864e5).length;if(old)al.push(['w',`${old} request${old>1?'s have':' has'} been waiting more than 24 hours.`]);
  const rq=rqPending().length;if(rq)al.push(['w',`${rq} dentist schedule change request${rq>1?'s are':' is'} waiting for approval.`]);
  const unas=A.filter(a=>a.status==='Approved'&&!a.dentistId&&a.date>=TODAY&&a.date<=wkEnd&&a.visit==='Scheduled').length;if(unas)al.push(['i',`${unas} approved appointment${unas>1?'s have':' has'} no dentist yet in the next 7 days. Staff assign one on arrival, or earlier.`]);
  const oc=overCapDays(ids);if(oc)al.push(['w',`${oc} upcoming day${oc>1?'s have':' has'} more patients in a slot than the branch limit. Open the calendar to review.`]);
  const soon=S.branches.filter(b=>b.status==='soon');if(soon.length&&isSuper())al.push(['i',`${soon.map(b=>b.name).join(', ')} is marked "coming soon" and hidden from booking.`]);
  if(!al.length)al.push(['g','Everything looks good. No issues need attention.']);
  const bcards=(aBranch==='all'&&myBranches().length>1)?`<div class="bcards" data-note="Multi-branch overview">${myBranches().map(b=>{const ba=S.appts.filter(a=>a.branchId===b.id);return `<button class="bcard" data-act="a-branch" data-id="${b.id}"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${bChip(b.id)} ${esc(b.name)}</b><span class="tag ${b.status==='active'?'':b.status==='soon'?'soon':'off'}">${b.status==='active'?'Active':b.status==='soon'?'Coming soon':'Inactive'}</span></div><div class="r"><span><b>${ba.filter(a=>a.date===TODAY&&['Approved','Completed','No-show'].includes(a.status)).length}</b>today</span><span><b>${ba.filter(a=>a.status==='Pending').length}</b>pending</span><span><b>${dentsOnDuty(b.id,TODAY).length}</b>on duty</span></div></button>`}).join('')}</div>`:'';
  return `${bcards}<div class="kpis" data-note="Module: Admin Dashboard">${k.map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b><small style="color:var(--muted)">${x[2]}</small></div>`).join('')}</div>
  <div class="a-cols"><div class="panel"><div style="padding:18px 20px;display:flex;justify-content:space-between;align-items:center"><b>Needs your review</b><button class="btn btn-o btn-sm" data-act="a-tab" data-tab="appts">View all</button></div>${pend.length?`<div class="agenda" style="padding-top:0">${pend.slice(0,5).map(a=>`<div class="ag" style="cursor:default"><time>${fmtDs(a.date)}<br><small style="color:var(--muted)">${fmtT(a.time)}</small></time><div><b>${esc(patName(a))}</b> ${showBr()?bChip(a.branchId):''}<br><small style="color:var(--muted)">${esc(svcName(a.service))} · ${esc(dentName(a))}</small></div><div class="qa"><button class="btn btn-y btn-sm" data-act="a-approve" data-ref="${a.ref}">Approve</button><button class="btn btn-o btn-sm" data-act="a-open" data-ref="${a.ref}">Details</button></div></div>`).join('')}</div>`:'<div class="empty">All caught up. No pending requests.</div>'}</div>
  <div class="panel" data-note="Visit progress: arrived, late, on-going, completed"><div style="padding:18px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><b>Today's queue</b><br><small style="color:var(--muted)">${fmtD(TODAY)}</small></div><button class="btn btn-p btn-sm" data-act="mf-open">${ic('plus')}New appointment</button></div>${today.length?`<div class="agenda" style="padding-top:0">${today.map(a=>qRow(a)).join('')}</div>`:'<div class="empty">No appointments today.</div>'}</div></div>
  <div class="a-cols" style="margin-top:18px"><div class="panel"><div style="padding:18px 20px 6px"><b>Appointments per week</b> <small style="color:var(--muted)">(8 weeks up to this week)</small></div><div class="wk" role="img" aria-label="Weekly appointments bar chart">${wk.map(w=>`<div class="col" title="${w.n} appointments"><b>${w.n}</b><i style="height:${w.n/mx*80}%"></i><span>${w.label}</span></div>`).join('')}</div></div>
  <div class="panel"><div style="padding:18px 20px 12px"><b>Attention</b></div><div class="alerts">${al.map(a=>`<div class="alert ${a[0]}">${ic(a[0]==='g'?'check':a[0]==='w'?'bell':'pin')}<span>${a[1]}</span></div>`).join('')}</div></div></div>`;
}

/* =========================================================
   APPOINTMENTS LIST + PATIENTS
========================================================= */
const WHEN=[['all','All dates'],['today','Today'],['upcoming','Upcoming'],['past','Past']];
const srcTag=a=>a.source&&a.source!=='Online'?`<small class="srctag">${esc(a.source)}</small>`:'';
function vAppts(){const dn=isDentist();
  return `<div class="panel" data-note="Module: Appointment Approval"><div class="tools"><input class="inp" id="aq" placeholder="Search patient or ref…" value="${esc(aFilter.q)}" aria-label="Search">${dn?'':`<select class="inp" id="aDent" style="min-width:170px" aria-label="Dentist"><option value="">All dentists</option>${S.dents.map(d=>`<option value="${d.id}" ${aFilter.dent===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select><button class="btn btn-p btn-sm" style="margin-left:auto" data-act="mf-open">${ic('plus')}New appointment</button>`}</div>
  <div class="tools" style="border-top:0;padding-top:0"><div style="display:flex;gap:6px;flex-wrap:wrap">${WHEN.map(w=>`<button class="chip ${aFilter.when===w[0]?'on':''}" data-act="a-when" data-w="${w[0]}">${w[1]}</button>`).join('')}</div><div style="display:flex;gap:6px;flex-wrap:wrap">${['All',...FILTERS].map(s=>`<button class="chip ${aFilter.st===s?'on':''}" data-act="a-st" data-st="${s}">${s}</button>`).join('')}</div></div>
  <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Ref</th><th>Patient</th><th>Service</th>${showBr()?'<th>Branch</th>':''}<th class="hide-s">Dentist</th><th>Schedule</th><th>Status</th></tr></thead><tbody id="aRows"></tbody></table></div><div class="empty" id="aNo" hidden>No appointments match your filters.</div></div>`}
function bindAppts(){
  const whenOK=a=>aFilter.when==='all'||(aFilter.when==='today'?a.date===TODAY:aFilter.when==='upcoming'?a.date>=TODAY:a.date<TODAY);
  const draw=()=>{const q=aFilter.q.toLowerCase();let L=sortAppts(scAppts().filter(a=>(aFilter.st==='All'||stLabel(a)===aFilter.st)&&(!aFilter.dent||a.dentistId===aFilter.dent)&&(!q||(patName(a)+a.ref).toLowerCase().includes(q))&&whenOK(a)));
   if(aFilter.when==='all'||aFilter.when==='past')L.reverse();
   $('#aRows').innerHTML=L.slice(0,80).map(a=>`<tr data-act="a-open" data-ref="${a.ref}"><td class="ref">${esc(a.ref)}${a.sample?'<small>sample</small>':''}</td><td><b>${esc(patName(a))}</b>${srcTag(a)}</td><td>${esc(svcName(a.service))}</td>${showBr()?`<td>${bChip(a.branchId)}</td>`:''}<td class="hide-s">${a.dentistId?esc(dentName(a)):'<span class="hint">Not assigned</span>'}</td><td>${fmtD(a.date)}<small>${fmtRange(a)}${a.durSet?'':' · est.'}</small></td><td><span class="pill ${sc(stLabel(a))}">${stLabel(a)}</span></td></tr>`).join('');$('#aNo').hidden=L.length>0};
  $('#aq').oninput=e=>{aFilter.q=e.target.value;draw()};const dd=$('#aDent');if(dd)dd.onchange=e=>{aFilter.dent=e.target.value;draw()};draw();
}
function vPts(){const ids=scopeIds();const L=S.users.map(u=>{const ap=S.appts.filter(a=>a.patientId===u.id&&ids.includes(a.branchId));const last=sortAppts(ap.filter(a=>a.status==='Completed')).pop();return {u,ap,n:ap.length,last}}).filter(x=>x.n||(aBranch==='all'&&isSuper()));
  return `<div class="panel" data-note="Module: Patient Appointment History"><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Patient</th><th>Contact</th><th>Appointments</th>${showBr()?'<th>Branches visited</th>':''}<th class="hide-s">Last visit</th></tr></thead><tbody>${L.map(x=>`<tr data-act="a-pt" data-id="${x.u.id}"><td><b>${esc(x.u.name)}</b>${x.u.walkin?'<small class="srctag">No online account</small>':''}${x.u.sample?'<small>sample</small>':''}</td><td>${esc(x.u.phone)}<small>${esc(x.u.email||'No email on file')}</small></td><td>${x.n}</td>${showBr()?`<td>${[...new Set(x.ap.map(a=>a.branchId))].map(bChip).join(' ')||'-'}</td>`:''}<td class="hide-s">${x.last?fmtD(x.last.date):'-'}</td></tr>`).join('')}</tbody></table></div>${L.length?'':'<div class="empty">No patients yet.</div>'}</div>`}

/* =========================================================
   SERVICES
========================================================= */
function vSvc(){return `<div class="panel"><div class="tools"><b>${S.services.length} services</b><button class="btn btn-p btn-sm" style="margin-left:auto" data-act="sv-add">${ic('plus')}Add service</button></div>${S.services.map(s=>{const used=S.appts.filter(a=>a.service===s.id).length;return `<div class="mcard"><span class="svc-thumb">${ic(s.icon)}</span><div class="grow"><h3>${esc(s.name)} ${s.active===false?'<span class="tag off">Hidden</span>':'<span class="tag">Visible</span>'} ${s.hl?'<span class="tag" style="background:var(--p100);color:var(--p800)">Specialty</span>':''}</h3><div style="font-size:.88rem;color:var(--muted);margin-top:4px">${esc(s.short)}</div><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="kicker">Default time allotted</span><span class="bchip">${fmtDur(s.dur||30)}</span>${S.branches.length>1?`<span class="kicker" style="margin-left:8px">Offered at</span>${s.branches==='all'?'<span class="bchip">All branches</span>':(s.branches||[]).map(bChip).join('')||'<span class="hint">No branch</span>'}`:''}</div><div class="qa" style="margin-top:12px"><button class="btn btn-o btn-sm" data-act="sv-edit" data-id="${s.id}">${ic('edit')}Edit</button><button class="btn btn-o btn-sm" data-act="sv-toggle" data-id="${s.id}">${s.active===false?'Show on website':'Hide from website'}</button>${used?`<span class="hint" style="align-self:center">${used} appointment${used>1?'s':''} use this</span>`:`<button class="btn btn-o btn-sm" style="color:var(--bad)" data-act="sv-del" data-id="${s.id}">Delete</button>`}</div></div></div>`}).join('')}</div>`}
function svcForm(id){
  const s=id?svById(id):{name:'',icon:'tooth',short:'',for:'',inc:[],note:'',hl:false,active:true,branches:'all',dur:30};const all=s.branches==='all';
  openModal(id?'Edit service':'Add a service',`<div class="mform"><div class="form-grid"><div class="field"><label for="sf_n">Service name <span class="req">*</span></label><input class="inp" id="sf_n" value="${esc(s.name)}"><div class="err" data-e="n"></div></div><div class="field"><label for="sf_i">Icon</label><select class="inp" id="sf_i">${ICONS.map(i=>`<option value="${i}" ${s.icon===i?'selected':''}>${i}</option>`).join('')}</select></div>
  <div class="field full"><label for="sf_s">Short description <span class="req">*</span></label><input class="inp" id="sf_s" value="${esc(s.short)}"><div class="err" data-e="s"></div></div>
  <div class="field"><label for="sf_d">Default time allotted</label><select class="inp" id="sf_d">${DUR_OPTS.map(n=>`<option value="${n}" ${(s.dur||30)===n?'selected':''}>${fmtDur(n)}</option>`).join('')}</select><div class="hint">Pre-selected when staff approve a booking. They can change it per patient.</div></div>
  <div class="field full"><label for="sf_f">Great for</label><input class="inp" id="sf_f" value="${esc(s.for)}"></div>
  <div class="field full"><label for="sf_inc">What's included <span class="hint">(one per line)</span></label><textarea class="inp" id="sf_inc">${esc((s.inc||[]).join('\n'))}</textarea></div>
  <div class="field full"><label for="sf_no">Highlight note</label><input class="inp" id="sf_no" value="${esc(s.note)}"></div></div>
  <div><b style="font-size:.9rem">Offered at</b><div class="chipset" style="margin-top:8px"><label class="chk2"><input type="checkbox" id="sf_all" ${all?'checked':''} data-act="sf-all"> All branches</label>${S.branches.map(b=>`<label class="chk2"><input type="checkbox" class="sf_b" value="${b.id}" ${all||(s.branches||[]).includes(b.id)?'checked':''} ${all?'disabled':''}> ${esc(b.short)}</label>`).join('')}</div></div>
  <div class="chipset"><label class="chk2"><input type="checkbox" id="sf_hl" ${s.hl?'checked':''}> Mark as specialty</label><label class="chk2"><input type="checkbox" id="sf_act" ${s.active!==false?'checked':''}> Visible on website</label></div>
  <div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="sv-save" data-id="${id||''}">${id?'Save changes':'Add service'}</button></div></div>`,true);
}

/* =========================================================
   REPORTS
========================================================= */
const denLabel=a=>a.dentistId?(dById(a.dentistId)?.name||'Dentist'):'Not assigned';
function statsFor(days){const ids=scopeIds();const from=days?addDays(TODAY,-days+1):'0000-00-00';const L=S.appts.filter(a=>ids.includes(a.branchId)&&a.date>=from&&a.date<=TODAY);const c=s=>L.filter(a=>a.status===s).length;
  const decided=c('Approved')+c('Completed')+c('No-show')+c('Rejected');const seen=c('Completed')+c('No-show');
  return {L,total:L.length,comp:c('Completed'),ns:c('No-show'),can:c('Cancelled'),rej:c('Rejected'),approval:decided?Math.round((decided-c('Rejected'))/decided*100):0,compRate:seen?Math.round(c('Completed')/seen*100):0,nsRate:seen?Math.round(c('No-show')/seen*100):0,uniq:new Set(L.map(a=>a.patientId)).size}}
const barList=(map,max)=>Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar" style="grid-template-columns:170px 1fr 34px"><span>${esc(k)}</span><div><i style="width:${v/max*100}%"></i></div><b>${v}</b></div>`).join('');
function vRep(){
  const st=statsFor(rangeD),L=st.L;const svc={},den={},wd={},br={},src={};L.forEach(a=>{svc[svcName(a.service)]=(svc[svcName(a.service)]||0)+1;den[denLabel(a)]=(den[denLabel(a)]||0)+1;const w=DAYS3[dow(a.date)];wd[w]=(wd[w]||0)+1;br[bName(a.branchId)]=(br[bName(a.branchId)]||0)+1;const sr=a.source||'Online';src[sr]=(src[sr]||0)+1});
  const mx=o=>Math.max(1,...Object.values(o));const col={Completed:'#2F5FBF',Approved:'#1E8A5B','No-show':'#A1306B',Cancelled:'#8D9CA8',Rejected:'#B3382C',Pending:'#D9A400'};
  const cnts=STATUSES.map(s=>[s,L.filter(a=>a.status===s).length]).filter(x=>x[1]);let acc=0;const grad=cnts.map(([s,n])=>{const a=acc/st.total*100;acc+=n;return `${col[s]} ${a}% ${acc/st.total*100}%`}).join(',');
  const wk=weeklyData(8,scopeIds()),wmx=Math.max(1,...wk.map(w=>w.n));const order=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const done=L.filter(a=>a.status==='Completed'),avgDur=done.length?Math.round(done.reduce((t,a)=>t+apptDur(a),0)/done.length):0;
  return `<div class="tools" style="background:#fff;border:1px solid var(--line);border-radius:16px;margin-bottom:18px" data-note="Module: Reports &amp; Analytics"><b>Period</b>${[[30,'Last 30 days'],[90,'Last 90 days'],[0,'All time']].map(r=>`<button class="chip ${rangeD===r[0]?'on':''}" data-act="rep-range" data-d="${r[0]}">${r[1]}</button>`).join('')}<div style="margin-left:auto;display:flex;gap:8px"><button class="btn btn-o btn-sm" data-act="rep-csv">${ic('dl')}Export CSV</button><button class="btn btn-o btn-sm" data-act="rep-print">Print</button></div></div>
  <div class="kpis"><div class="kpi"><span>Appointments</span><b>${st.total}</b><small style="color:var(--muted)">${st.uniq} unique patients</small></div><div class="kpi"><span>Approval rate</span><b>${st.approval}%</b><small style="color:var(--muted)">${st.rej} rejected</small></div><div class="kpi"><span>Completion rate</span><b>${st.compRate}%</b><small style="color:var(--muted)">${st.comp} completed · avg ${avgDur?fmtDur(avgDur):'n/a'}</small></div><div class="kpi"><span>No-show rate</span><b>${st.nsRate}%</b><small style="color:var(--muted)">${st.ns} no-shows · ${st.can} cancelled</small></div></div>
  <div class="g2"><div class="panel"><div style="padding:18px 20px 0"><b>Appointments per week</b></div><div class="wk" style="padding-top:14px" role="img" aria-label="Weekly appointments">${wk.map(w=>`<div class="col" title="${w.n}"><b>${w.n}</b><i style="height:${w.n/wmx*80}%"></i><span>${w.label}</span></div>`).join('')}</div></div>
  <div class="panel"><div style="padding:18px 20px 0"><b>Status breakdown</b></div><div class="donutwrap">${st.total?`<div class="donut" style="background:conic-gradient(${grad})" role="img" aria-label="Status breakdown"><b>${st.total}</b></div>`:''}<div class="dl2">${cnts.map(([s,n])=>`<div><i style="background:${col[s]}"></i>${s}<b>${n}</b></div>`).join('')||'<span class="hint">No data</span>'}</div></div></div></div>
  <div class="g2" style="margin-top:18px">${showBr()?`<div class="panel"><div style="padding:18px 20px 0"><b>By branch</b></div><div class="bars">${barList(br,mx(br))||'<span class="hint">No data</span>'}</div></div>`:''}<div class="panel"><div style="padding:18px 20px 0"><b>By service</b></div><div class="bars">${barList(svc,mx(svc))||'<span class="hint">No data</span>'}</div></div><div class="panel"><div style="padding:18px 20px 0"><b>By dentist</b></div><div class="bars">${barList(den,mx(den))||'<span class="hint">No data</span>'}</div></div><div class="panel"><div style="padding:18px 20px 0"><b>Booking source</b></div><div class="bars">${barList(src,mx(src))||'<span class="hint">No data</span>'}</div></div><div class="panel"><div style="padding:18px 20px 0"><b>Busiest days</b></div><div class="bars">${order.filter(d=>wd[d]).map(d=>`<div class="bar" style="grid-template-columns:170px 1fr 34px"><span>${d}</span><div><i style="width:${wd[d]/mx(wd)*100}%"></i></div><b>${wd[d]}</b></div>`).join('')||'<span class="hint">No data</span>'}</div></div></div>`;
}

/* =========================================================
   EMAIL, INQUIRIES, STAFF, SETTINGS
========================================================= */
function vMail(){
  const tabs=`<div class="tabsx">${[['log','Email log'],['tpl','Templates'],['set','Settings']].map(t=>`<button class="chip ${emTab===t[0]?'on':''}" data-act="em-tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>`;
  if(emTab==='log'){const ids=scopeIds();const L=S.mails.filter(m=>ids.includes(m.branchId));return tabs+`<div class="panel" data-note="Module: Email Notifications"><div class="msgs">${L.length?L.slice(0,60).map(m=>`<button class="mailrow" data-act="view-mail" data-id="${m.id}"><span class="mi">${ic('mail')}</span><span style="flex:1;min-width:0"><b style="display:block;font-size:.92rem">${esc(MAILNAMES[m.type]||m.type)} · ${esc(m.ref)} ${showBr()?bChip(m.branchId):''}</b><small style="color:var(--muted);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">To ${esc(m.to)} · ${esc(m.subject)}</small></span><small style="color:var(--muted);flex:none">${ago(m.at)}</small></button>`).join(''):'<div class="empty">No emails sent yet.</div>'}</div></div>`}
  if(emTab==='tpl'){const demo=scAppts().find(a=>a.status==='Approved')||S.appts[0];return tabs+`<div class="panel" data-note="Module: Email Notifications"><div class="tpl">${['received','approved','rejected','rescheduled','cancelled','reminder','nextvisit','admin_new'].map(t=>`<div class="card" style="padding:18px"><b>${MAILNAMES[t]}</b><p class="hint" style="margin:6px 0 12px">${{received:'Sent to patient right after booking',approved:'Sent when staff approves, with the time allotted',rejected:'Sent with the rejection reason',rescheduled:'Sent when the schedule changes',cancelled:'Sent when a booking is cancelled',reminder:'Sent before the visit',nextvisit:'Sent when a visit is completed and a next visit is recommended',admin_new:'Sent to the branch inbox'}[t]}</p><button class="btn btn-o btn-sm" data-act="tpl-view" data-t="${t}" data-ref="${demo.ref}">Preview</button></div>`).join('')}</div></div>`}
  return tabs+`<div class="panel" data-note="Module: Email Notifications">${[['confirm','Booking confirmation emails','Send a "booking received" email to the patient and a notification to the branch'],['status','Status update emails','Notify patients when a booking is approved, rejected, rescheduled or cancelled'],['reminder','Appointment reminders','Automatically remind patients before their visit']].map(r=>`<div class="setrow"><div><b>${r[1]}</b><small>${r[2]}</small></div><label class="sw"><input type="checkbox" data-act="set-toggle" data-k="${r[0]}" ${S.settings[r[0]]?'checked':''} aria-label="${r[1]}"><i></i></label></div>`).join('')}<div class="setrow"><div><b>Reminder timing</b><small>How long before the appointment</small></div><select class="inp" style="width:auto" data-act="set-hrs">${[[24,'24 hours before'],[48,'48 hours before'],[72,'3 days before']].map(o=>`<option value="${o[0]}" ${S.settings.reminderHrs===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div><div class="setrow"><div><b>Branch notification inboxes</b><small>New bookings go to the branch email set in Branches</small></div><div style="text-align:right">${S.branches.map(b=>`<div style="font-size:.86rem">${bChip(b.id)} <b>${esc(b.email||'-')}</b></div>`).join('')}</div></div></div><p class="hint" style="margin-top:12px">SMS reminders are not part of this package. Reminders are sent by email only. Patients without an email address (walk-ins) are not emailed.</p>`;
}
function vInq(){const ids=scopeIds();const L=S.msgs.filter(m=>!m.branchId||ids.includes(m.branchId));return `<div class="panel"><div class="msgs">${L.length?L.map(m=>`<div class="msg"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>${esc(m.subject||'(No subject)')} ${m.branchId&&showBr()?bChip(m.branchId):''}</b><small style="color:var(--muted)">${ago(m.created)}${m.sample?' · sample':''}</small></div><div style="color:var(--muted);font-size:.86rem;margin:2px 0 10px">${esc(m.name)} · ${esc(m.email)}</div><p style="font-size:.92rem">${esc(m.message)}</p><div style="margin-top:12px;display:flex;gap:8px"><a class="btn btn-o btn-sm" href="mailto:${esc(m.email)}">Reply by email</a></div></div>`).join(''):'<div class="empty">No inquiries yet.</div>'}</div></div>`}
/* y = full access, o = own data only, n = no access */
const PERMS=[['Dashboard','y','y','y','o'],['View appointments','y','y','y','o'],['Approve, reject, reschedule','y','y','y','n'],['Add appointments manually (walk-in, phone, Facebook)','y','y','y','n'],['Set the time allotted for a service','y','y','y','n'],['Process patient status (arrived, late, on-going, completed)','y','y','y','n'],['Calendar','y','y','y','o'],['Patients & history','y','y','y','n'],['Inquiries','y','y','y','n'],['Dentist schedules & roster','y','y','n','n'],['Request a schedule change','n','n','n','y'],['Approve schedule change requests','y','y','n','n'],['Reports & analytics','y','y','n','n'],['Email notifications & templates','y','y','n','n'],['Branches (add / edit / hours)','y','n','n','n'],['Services','y','n','n','n'],['Staff & roles','y','n','n','n'],['Settings','y','n','n','n'],['Access to all branches','y','n','n','n']];
const PMARK={y:'✓',o:'Own',n:'–'};
function vStaff(){
  const brCell=s=>s.role==='dentist'?`${esc(dById(s.dentistId)?.name||'No dentist linked')}<small>Branches follow their schedule</small>`:(s.branchIds==='all'?'<span class="bchip">All branches</span>':s.branchIds.map(bChip).join(' '));
  return `<div class="panel" data-note="Staff accounts &amp; role-based access"><div class="tools"><b>${S.staff.length} accounts</b><button class="btn btn-p btn-sm" style="margin-left:auto" data-act="st-add">${ic('plus')}Add staff account</button></div><div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Branches</th><th>Status</th><th></th></tr></thead><tbody>${S.staff.map(s=>`<tr style="cursor:default"><td><b>${esc(s.name)}</b><small>${esc(s.email)}</small></td><td>${esc(ROLES[s.role].name)}</td><td>${brCell(s)}</td><td><span class="pill ${s.active?'s-Approved':'s-Cancelled'}">${s.active?'Active':'Disabled'}</span></td><td><button class="btn btn-o btn-sm" data-act="st-edit" data-id="${s.id}">Edit</button></td></tr>`).join('')}</tbody></table></div></div>
  <div class="panel" style="margin-top:18px"><div style="padding:18px 20px 6px"><b>What each role can do</b></div><div style="overflow-x:auto"><table class="wf matrix"><thead><tr><th>Module</th><th>Super admin</th><th>Branch manager</th><th>Clinic staff</th><th>Dentist</th></tr></thead><tbody>${PERMS.map(p=>`<tr><td>${p[0]}</td>${[1,2,3,4].map(i=>`<td class="${p[i]}">${PMARK[p[i]]}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
function staffForm(id){
  const s=id?stById(id):{name:'',email:'',role:'staff',branchIds:[],dentistId:'',active:true};const all=s.branchIds==='all',dn=s.role==='dentist';
  const taken=S.staff.filter(x=>x.role==='dentist'&&x.id!==id).map(x=>x.dentistId);
  openModal(id?'Edit staff account':'Add staff account',`<div class="mform"><div class="form-grid"><div class="field"><label for="tf_n">Full name <span class="req">*</span></label><input class="inp" id="tf_n" value="${esc(s.name)}"><div class="err" data-e="n"></div></div><div class="field"><label for="tf_e">Email <span class="req">*</span></label><input class="inp" id="tf_e" type="email" value="${esc(s.email)}"><div class="err" data-e="e"></div></div>
  <div class="field full"><label for="tf_r">Role</label><select class="inp" id="tf_r" data-act="tf-role">${Object.entries(ROLES).map(([k,r])=>`<option value="${k}" ${s.role===k?'selected':''}>${r.name}: ${r.desc}</option>`).join('')}</select></div>
  <div class="field full" id="tfDent" ${dn?'':'hidden'}><label for="tf_d">Linked dentist <span class="req">*</span></label><select class="inp" id="tf_d"><option value="">Choose a dentist…</option>${S.dents.filter(d=>!taken.includes(d.id)).map(d=>`<option value="${d.id}" ${s.dentistId===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select><div class="hint">The dentist sees only their own appointments, calendar and dashboard. Branch access follows their schedule.</div><div class="err" data-e="d"></div></div></div>
  <div id="tfBrBox" ${dn?'hidden':''}><b style="font-size:.9rem">Branch access</b><div class="chipset" style="margin-top:8px" id="tfBr">${S.branches.map(b=>`<label class="chk2"><input type="checkbox" class="tf_b" value="${b.id}" ${all||(s.branchIds||[]).includes(b.id)?'checked':''} ${s.role==='super'?'disabled':''}> ${esc(b.short)}</label>`).join('')}</div><div class="err" data-e="b"></div><p class="hint" style="margin-top:6px">Super admins always see every branch, including branches added later.</p></div>
  <label class="chk2" style="justify-self:start"><input type="checkbox" id="tf_a" ${s.active?'checked':''}> Account is active</label>
  <div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="st-save" data-id="${id||''}">${id?'Save changes':'Add account'}</button></div></div>`,true);
}
function vSet(){const s=S.settings;return `<div class="g2" style="align-items:start"><div class="panel" style="padding:22px" data-note="Settings"><h3 style="font-family:var(--font);font-size:1.05rem;margin-bottom:14px">Clinic profile</h3><div class="form-grid" style="grid-template-columns:1fr"><div class="field"><label for="st_c">Clinic name</label><input class="inp" id="st_c" value="${esc(s.clinic)}"></div><div class="field"><label for="st_t">Tagline</label><input class="inp" id="st_t" value="${esc(s.tagline)}"></div><div><button class="btn btn-p" data-act="set-profile">Save profile</button></div></div></div>
  <div class="panel" style="padding:22px"><h3 style="font-family:var(--font);font-size:1.05rem;margin-bottom:14px">Booking rules</h3><div class="form-grid" style="grid-template-columns:1fr 1fr"><div class="field"><label for="st_adv">Book up to (days ahead)</label><input class="inp" id="st_adv" type="number" min="7" max="365" value="${s.advanceDays}"></div><div class="field"><label for="st_min">Minimum notice (hours)</label><input class="inp" id="st_min" type="number" min="0" max="72" value="${s.minNoticeHrs}"><div class="hint">Blocks same-day slots that are too soon</div></div><div class="field"><label for="st_sl">Time slot interval</label><select class="inp" id="st_sl">${[30,60].map(n=>`<option value="${n}" ${s.slotMin===n?'selected':''}>${fmtDur(n)}</option>`).join('')}</select><div class="hint">How often patients can start. The time allotted is set per appointment.</div></div><div class="field"><label for="st_cap">Default patients per slot</label><input class="inp" id="st_cap" type="number" min="1" max="20" value="${s.defCap}"><div class="hint">Pre-filled for new branches</div></div><div class="field full"><label class="chk2" style="justify-self:start;width:max-content"><input type="checkbox" id="st_rs" ${s.allowResched?'checked':''}> Patients can reschedule and cancel online</label></div><div class="full"><button class="btn btn-p" data-act="set-rules">Save rules</button></div></div></div>
  <div class="panel" style="padding:22px"><h3 style="font-family:var(--font);font-size:1.05rem;margin-bottom:6px">Default working hours</h3><p class="hint" style="margin-bottom:14px">Applied to every <b>new</b> branch (open every day; switch a day off in Branches if the branch is closed). Currently ${fmtT(s.defOpen)} – ${fmtT(s.defClose)}.</p><div class="form-grid"><div class="field"><label for="st_o">Opens</label><select class="inp" id="st_o">${timeOpts('06:00','14:00',s.defOpen)}</select></div><div class="field"><label for="st_cl">Closes</label><select class="inp" id="st_cl">${timeOpts('12:00','22:00',s.defClose)}</select></div><div class="full"><button class="btn btn-p" data-act="set-hours">Save default hours</button></div></div></div>
  <div class="panel" style="padding:22px"><h3 style="font-family:var(--font);font-size:1.05rem;margin-bottom:6px">Demo data</h3><p class="hint" style="margin-bottom:14px">This mock-up stores everything in your browser. Reset to restore the sample data.</p><button class="btn btn-o" data-act="reset">Reset demo data</button></div></div>`}

/* =========================================================
   BRANCHES  (multi-branch management)
========================================================= */
const timeOpts=(from,to,sel,step=30)=>{let o='';for(let m=mins(from);m<=mins(to);m+=step)o+=`<option value="${tstr(m)}" ${tstr(m)===sel?'selected':''}>${fmtT(tstr(m))}</option>`;return o};
function hoursGrid(prefix,h){return `<div class="hrs">${[1,2,3,4,5,6,0].map(i=>`<div class="hr ${h[i].on?'':'off'}"><b>${DAYS[i]}</b><label class="sw"><input type="checkbox" id="${prefix}_on_${i}" ${h[i].on?'checked':''} data-act="hr-toggle" aria-label="${DAYS[i]} open"><i></i></label><select class="inp" id="${prefix}_s_${i}" aria-label="Opens">${timeOpts('06:00','21:00',h[i].start)}</select><select class="inp" id="${prefix}_e_${i}" aria-label="Closes">${timeOpts('06:00','22:00',h[i].end)}</select></div>`).join('')}</div>`}
function readHours(prefix){const o={};for(let i=0;i<7;i++)o[i]={on:$('#'+prefix+'_on_'+i).checked,start:$('#'+prefix+'_s_'+i).value,end:$('#'+prefix+'_e_'+i).value};return o}
function branchStats(b){const dn=dentsAt(b.id).length;const wk=S.appts.filter(a=>a.branchId===b.id&&a.date>=TODAY&&a.date<=addDays(TODAY,7)&&['Approved','Pending'].includes(a.status)).length;return {dn,wk}}
function vBranches(){
  const stTag=b=>b.status==='active'?'<span class="tag">Active</span>':b.status==='soon'?'<span class="tag soon">Coming soon</span>':'<span class="tag off">Inactive</span>';
  return `<div class="note" style="margin-bottom:16px" data-note="Multi-branch support"><svg class="ic"><use href="#i-pin"/></svg><span>Branches added here appear <b>automatically</b> on the public website (home, contact, footer), in the booking wizard, dentist schedules, reports and emails. Nothing needs to be re-coded.</span></div>
  <div class="panel"><div class="tools"><b>${S.branches.length} branch${S.branches.length===1?'':'es'}</b><button class="btn btn-p btn-sm" style="margin-left:auto" data-act="b-add">${ic('plus')}Add branch</button></div>${S.branches.map(b=>{const st=branchStats(b);return `<div class="mcard"><span class="ico">${ic('branch')}</span><div class="grow"><h3>${esc(b.name)} ${stTag(b)} ${b.main?'<span class="tag" style="background:var(--p100);color:var(--p800)">Main</span>':''}</h3><div style="font-size:.88rem;color:var(--muted);margin-top:4px">${esc(b.address)}${b.landmark?' · '+esc(b.landmark):''}</div><div style="font-size:.86rem;margin-top:6px;display:flex;gap:16px;flex-wrap:wrap">${ic('phone','')}<span>${esc(b.phone)}${b.phone2?' · '+esc(b.phone2):''}</span>${ic('clock')}<span>${esc(hoursText(b))}</span>${ic('users')}<span>Up to <b>${capOf(b.id)}</b> patient${capOf(b.id)>1?'s':''} per time slot</span></div><div style="font-size:.82rem;color:var(--muted);margin-top:8px"><b style="color:var(--p900)">${st.dn}</b> dentist${st.dn===1?'':'s'} scheduled · <b style="color:var(--p900)">${st.wk}</b> appointments in the next 7 days</div><div class="qa" style="margin-top:12px"><button class="btn btn-o btn-sm" data-act="b-edit" data-id="${b.id}">${ic('edit')}Edit</button><button class="btn btn-o btn-sm" data-act="a-tab" data-tab="dent" data-branch="${b.id}">Dentist schedules</button>${!b.main&&b.status==='active'?`<button class="btn btn-o btn-sm" data-act="b-main" data-id="${b.id}">Make main</button>`:''}${b.status==='active'?`<button class="btn btn-o btn-sm" style="color:var(--bad)" data-act="b-status" data-id="${b.id}" data-s="inactive">Deactivate</button>`:`<button class="btn btn-o btn-sm" data-act="b-status" data-id="${b.id}" data-s="active">Activate</button>`}</div></div></div>`}).join('')}</div>`;
}
function branchForm(id){
  const b=id?bById(id):{name:'',short:'',address:'',landmark:'',phone:'',phone2:'',email:S.branches[0]?.email||'',map:'',status:'soon',capacity:S.settings.defCap,hours:schedFor([1,2,3,4,5,6,0],S.settings.defOpen,S.settings.defClose)};
  openModal(id?'Edit branch':'Add a branch',`<div class="mform"><div class="form-grid"><div class="field"><label for="bf_n">Branch name <span class="req">*</span></label><input class="inp" id="bf_n" value="${esc(b.name)}" placeholder="e.g. Quezon City Branch"><div class="err" data-e="n"></div></div><div class="field"><label for="bf_s">Short name <span class="req">*</span></label><input class="inp" id="bf_s" value="${esc(b.short)}" placeholder="e.g. Quezon City"><div class="err" data-e="s"></div></div>
  <div class="field full"><label for="bf_a">Address <span class="req">*</span></label><input class="inp" id="bf_a" value="${esc(b.address)}"><div class="err" data-e="a"></div></div>
  <div class="field"><label for="bf_l">Landmark</label><input class="inp" id="bf_l" value="${esc(b.landmark)}"></div><div class="field"><label for="bf_m">Google Maps search text</label><input class="inp" id="bf_m" value="${esc(b.map)}" placeholder="Used for the embedded map"></div>
  <div class="field"><label for="bf_p">Phone <span class="req">*</span></label><input class="inp" id="bf_p" value="${esc(b.phone)}"><div class="err" data-e="p"></div></div><div class="field"><label for="bf_p2">Second phone</label><input class="inp" id="bf_p2" value="${esc(b.phone2)}"></div>
  <div class="field"><label for="bf_e">Branch email (booking alerts)</label><input class="inp" id="bf_e" type="email" value="${esc(b.email)}"><div class="err" data-e="e"></div></div>
  <div class="field"><label for="bf_c">Patients per time slot</label><input class="inp" id="bf_c" type="number" min="1" max="20" value="${b.capacity||1}"><div class="hint">How many patients can share one time slot. Usually the number of dental chairs.</div><div class="err" data-e="c"></div></div>
  <div class="field"><label for="bf_st">Status</label><select class="inp" id="bf_st"><option value="active" ${b.status==='active'?'selected':''}>Active (open for booking)</option><option value="soon" ${b.status==='soon'?'selected':''}>Coming soon (hidden from booking)</option><option value="inactive" ${b.status==='inactive'?'selected':''}>Inactive (hidden everywhere)</option></select></div></div>
  <div><b style="font-size:.92rem">Working hours</b><p class="hint" style="margin:4px 0 12px">Default is ${fmtT(S.settings.defOpen)} – ${fmtT(S.settings.defClose)}. Dentist schedules can only fall inside these hours. Switch a day on to open it, including Sundays.</p>${hoursGrid('bh',b.hours)}<button class="btn btn-o btn-sm" style="margin-top:12px" type="button" data-act="hr-copy">Copy Monday to all open days</button></div>
  <div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="b-save" data-id="${id||''}">${id?'Save changes':'Add branch'}</button></div></div>`,true);
}

/* =========================================================
   ACTIONS
========================================================= */
const confirmed=new Set();
Object.assign(ACT,{
 'a-tab':el=>{aTab=el.dataset.tab;if(el.dataset.branch){aBranch=el.dataset.branch}drawAdmin();window.scrollTo(0,0)},
 'a-branch':el=>{aBranch=el.dataset.id;drawAdmin()},
 'a-logout':()=>{S.adm=null;save();closeDrawer();closeModal();$('#login').hidden=false;$('#dash').hidden=true;toast('Signed out')},
 'a-open':el=>openAppt(el.dataset.ref),
 'a-st':el=>{aFilter.st=el.dataset.st;drawAdmin()},
 'a-when':el=>{aFilter.when=el.dataset.w;drawAdmin()},
 'a-pt':el=>{const u=uById(el.dataset.id);const ap=sortAppts(S.appts.filter(a=>a.patientId===u.id&&scopeIds().includes(a.branchId))).reverse();const nx=ap.find(a=>a.next&&!a.next.ref);
   openDrawer(`<div class="dh"><div><small style="color:var(--muted)">Patient</small><h3 style="margin-top:2px">${esc(u.name)}</h3></div><button class="btn btn-o btn-sm" data-act="close-drawer">✕</button></div><div class="db"><dl class="dl"><dt>Email</dt><dd>${esc(u.email)||'<span class="hint">None on file</span>'}</dd><dt>Mobile</dt><dd>${esc(u.phone)}</dd><dt>Account</dt><dd>${u.walkin?'Added by staff (no online account)':'Online patient account'}</dd><dt>Registered</dt><dd>${ago(u.created)}</dd></dl>${canProcess()?`<div class="qa"><button class="btn btn-p btn-sm" data-act="mf-open" data-pt="${u.id}">${ic('plus')}New appointment</button></div>`:''}${nx?`<div class="note"><svg class="ic"><use href="#i-cal"/></svg><span><b>Next visit recommended:</b> ${esc(svcName(nx.next.service))}${nx.next.date?' around '+fmtD(nx.next.date):''}</span></div>`:''}<div><b style="font-size:.9rem">Appointment history (${ap.length})</b><div style="margin-top:10px;display:grid;gap:8px">${ap.map(a=>`<button class="ag" data-act="a-open" data-ref="${a.ref}"><time style="min-width:88px">${fmtDs(a.date)}<br><small style="color:var(--muted)">${fmtT(a.time)}</small></time><div><b style="font-size:.9rem">${esc(svcName(a.service))}</b> ${bChip(a.branchId)}<br><small style="color:var(--muted)">${esc(dentName(a))}</small></div><span class="pill ${sc(stLabel(a))}">${stLabel(a)}</span></button>`).join('')||'<span class="hint">No appointments</span>'}</div></div></div>`)},
 /* branches */
 'b-add':()=>branchForm(''),'b-edit':el=>branchForm(el.dataset.id),
 'hr-toggle':el=>{el.closest('.hr').classList.toggle('off',!el.checked)},
 'hr-copy':()=>{const s=$('#bh_s_1').value,e=$('#bh_e_1').value;[2,3,4,5,6,0].forEach(i=>{if($('#bh_on_'+i).checked){$('#bh_s_'+i).value=s;$('#bh_e_'+i).value=e}});toast('Copied Monday hours to other open days')},
 'b-save':el=>{
  const id=el.dataset.id,f=$('.mform');const g=k=>$('#'+k).value.trim();let bad=false;['n','s','a','p','e','c'].forEach(k=>setE(f,k,''));
  const name=g('bf_n'),short=g('bf_s'),cap=+g('bf_c');
  if(!name){setE(f,'n','Enter a branch name');bad=true}
  if(!short){setE(f,'s','Enter a short name');bad=true}else if(S.branches.some(b=>b.id!==id&&b.short.toLowerCase()===short.toLowerCase())){setE(f,'s','Another branch already uses this name');bad=true}
  if(!g('bf_a')){setE(f,'a','Enter the address');bad=true}
  if(!g('bf_p')){setE(f,'p','Enter a phone number');bad=true}
  if(g('bf_e')&&!okMail(g('bf_e'))){setE(f,'e','Enter a valid email');bad=true}
  if(!(cap>=1&&cap<=20&&Number.isInteger(cap))){setE(f,'c','Enter a whole number from 1 to 20');bad=true}
  const hours=readHours('bh');for(let i=0;i<7;i++)if(hours[i].on&&mins(hours[i].end)<=mins(hours[i].start)){toast(`${DAYS[i]}: closing time must be after opening time`);bad=true;break}
  if(!Object.values(hours).some(h=>h.on)){toast('Open at least one day');bad=true}
  if(bad)return;
  const data={name,short,address:g('bf_a'),landmark:g('bf_l'),map:g('bf_m'),phone:g('bf_p'),phone2:g('bf_p2'),email:g('bf_e'),status:$('#bf_st').value,capacity:cap,hours};
  if(id){Object.assign(bById(id),data);toast('Branch updated')}else{S.branches.push({id:nextId('b',S.branches),main:false,...data});toast('Branch added. Assign dentists in Dentist schedules to open bookings.')}
  if(!S.branches.some(b=>b.main&&b.status==='active')){const f2=S.branches.find(b=>b.status==='active');S.branches.forEach(b=>b.main=false);if(f2)f2.main=true}
  save();closeModal();drawAdmin();
 },
 'b-main':el=>{S.branches.forEach(b=>b.main=b.id===el.dataset.id);save();drawAdmin();toast('Main branch updated')},
 'b-status':el=>{const b=bById(el.dataset.id);const n=S.appts.filter(a=>a.branchId===b.id&&a.date>=TODAY&&['Pending','Approved'].includes(a.status)).length;
   if(el.dataset.s==='inactive'){if(activeBranches().length<=1&&b.status==='active'){toast('At least one branch must stay active');return}
     if(n&&!confirmed.has(b.id)){confirmed.add(b.id);toast(`${n} upcoming appointment${n>1?'s':''} still exist here. Click Deactivate again to confirm.`);return}}
   confirmed.delete(b.id);b.status=el.dataset.s;if(b.status!=='active'&&b.main){b.main=false;const nx=S.branches.find(x=>x.status==='active');if(nx)nx.main=true}
   if(b.status==='active'&&!S.branches.some(x=>x.main&&x.status==='active'))b.main=true;save();drawAdmin();toast(b.status==='active'?'Branch activated':'Branch deactivated. Hidden from the website and booking.')},
 /* services */
 'sv-add':()=>svcForm(''),'sv-edit':el=>svcForm(el.dataset.id),
 'sf-all':el=>{$$('.sf_b').forEach(c=>{c.disabled=el.checked;if(el.checked)c.checked=true})},
 'sv-save':el=>{const id=el.dataset.id,f=$('.mform');setE(f,'n','');setE(f,'s','');const n=$('#sf_n').value.trim(),sh=$('#sf_s').value.trim();let bad=false;
   if(!n){setE(f,'n','Enter a service name');bad=true}if(!sh){setE(f,'s','Enter a short description');bad=true}if(bad)return;
   const all=$('#sf_all').checked;const brs=all?'all':$$('.sf_b').filter(c=>c.checked).map(c=>c.value);
   const data={name:n,icon:$('#sf_i').value,short:sh,dur:+$('#sf_d').value,for:$('#sf_f').value.trim(),inc:$('#sf_inc').value.split('\n').map(x=>x.trim()).filter(Boolean),note:$('#sf_no').value.trim(),hl:$('#sf_hl').checked,active:$('#sf_act').checked,branches:brs};
   if(id)Object.assign(svById(id),data);else S.services.push({id:nextId('sv',S.services),...data});
   save();closeModal();drawAdmin();toast(id?'Service updated':'Service added. It is live on the website.')},
 'sv-toggle':el=>{const s=svById(el.dataset.id);s.active=s.active===false;save();drawAdmin();toast(s.active?'Service is visible on the website':'Service hidden from the website')},
 'sv-del':el=>{const s=svById(el.dataset.id);S.services.splice(S.services.indexOf(s),1);save();drawAdmin();toast('Service deleted')},
 /* reports */
 'rep-range':el=>{rangeD=+el.dataset.d;drawAdmin()},
 'rep-print':()=>window.print(),
 'rep-csv':()=>{const st=statsFor(rangeD);const rows=[['Reference','Date','Start','End','Time allotted (min)','Branch','Patient','Service','Dentist','Source','Status']].concat(sortAppts(st.L).map(a=>[a.ref,a.date,a.time,tstr(endOf(a)),apptDur(a),bName(a.branchId),patName(a),svcName(a.service),denLabel(a),a.source||'Online',stLabel(a)]));
   const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='smilematters-appointments.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500);toast('CSV exported')},
 /* email + settings */
 'em-tab':el=>{emTab=el.dataset.t;drawAdmin()},
 'tpl-view':el=>{let a=apptBy(el.dataset.ref);if(el.dataset.t==='nextvisit')a=Object.assign({},a,{next:{date:addDays(TODAY,30),service:a.service,time:''}});const c=mailContent(el.dataset.t,a);openModal('Template: '+MAILNAMES[el.dataset.t],`<div class="mail"><div class="meta"><div><b>To</b> ${esc(c.to)}</div><div><b>Subject</b> ${esc(c.subject)}</div></div>${c.body}</div>`)},
 'set-toggle':el=>{S.settings[el.dataset.k]=el.checked;save();toast('Setting saved')},
 'set-hrs':el=>{S.settings.reminderHrs=+el.value;save();toast('Setting saved')},
 'set-profile':()=>{S.settings.clinic=$('#st_c').value.trim()||S.settings.clinic;S.settings.tagline=$('#st_t').value.trim();save();toast('Profile saved')},
 'set-rules':()=>{const a=+$('#st_adv').value,m=+$('#st_min').value,c=+$('#st_cap').value;if(!(a>=7&&a<=365)||!(m>=0&&m<=72)){toast('Check the values: 7–365 days ahead, 0–72 hours notice');return}if(!(c>=1&&c<=20&&Number.isInteger(c))){toast('Patients per slot must be a whole number from 1 to 20');return}S.settings.advanceDays=a;S.settings.minNoticeHrs=m;S.settings.slotMin=+$('#st_sl').value;S.settings.defCap=c;S.settings.allowResched=$('#st_rs').checked;save();toast('Booking rules saved')},
 'set-hours':()=>{if(mins($('#st_cl').value)<=mins($('#st_o').value)){toast('Closing time must be after opening time');return}S.settings.defOpen=$('#st_o').value;S.settings.defClose=$('#st_cl').value;save();drawAdmin();toast('Default hours saved (used for new branches)')},
 /* staff */
 'st-add':()=>staffForm(''),'st-edit':el=>staffForm(el.dataset.id),
 'tf-role':el=>{const r=el.value,sup=r==='super',dn=r==='dentist';$('#tfDent').hidden=!dn;$('#tfBrBox').hidden=dn;$$('.tf_b').forEach(c=>{c.disabled=sup;if(sup)c.checked=true})},
 'st-save':el=>{const id=el.dataset.id,f=$('.mform');['n','e','b','d'].forEach(k=>setE(f,k,''));const n=$('#tf_n').value.trim(),em=$('#tf_e').value.trim().toLowerCase(),role=$('#tf_r').value;let bad=false;
   if(!n){setE(f,'n','Enter a name');bad=true}if(!okMail(em)){setE(f,'e','Enter a valid email');bad=true}else if(S.staff.some(s=>s.id!==id&&s.email.toLowerCase()===em)){setE(f,'e','This email already has an account');bad=true}
   const brs=$$('.tf_b').filter(c=>c.checked).map(c=>c.value);if(role!=='super'&&role!=='dentist'&&!brs.length){setE(f,'b','Choose at least one branch');bad=true}
   const dId=$('#tf_d').value;if(role==='dentist'&&!dId){setE(f,'d','Choose the dentist this account belongs to');bad=true}
   const active=$('#tf_a').checked;if(id){const supers=S.staff.filter(s=>s.role==='super'&&s.active&&s.id!==id).length;if((role!=='super'||!active)&&stById(id).role==='super'&&supers===0){toast('Keep at least one active super admin');return}if(id===S.adm&&!active){toast("You can't disable your own account");return}}
   if(bad)return;const data={name:n,email:em,role,branchIds:role==='super'?'all':role==='dentist'?[]:brs,dentistId:role==='dentist'?dId:'',active};
   if(id)Object.assign(stById(id),data);else S.staff.push({id:nextId('s',S.staff),...data});
   save();closeModal();if(id===S.adm)renderAdmin();else drawAdmin();initAdmin();toast(id?'Account updated':'Account added')}
});

/* login */
document.addEventListener('submit',e=>{if(e.target.id==='loginForm'){e.preventDefault();const s=stById($('#l_acct').value);if(!s)return;S.adm=s.id;const ids=sBranchIds(s);aBranch=ids.length===1?ids[0]:'all';aTab='dash';aFilter={st:'All',dent:'',q:'',when:s.role==='dentist'?'upcoming':'all'};calState.dent='';calState.view='month';calState.sel=TODAY;save();renderAdmin();toast('Signed in as '+s.name+' (demo)')}});
