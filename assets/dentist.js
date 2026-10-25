/* =========================================================
   DENTISTS: roster + per-branch schedules (admin) · schedule-change
   requests (admin approves) · dentist role views (dashboard, my schedule)
========================================================= */
let dView='roster',rqTab='Pending',RQF=null;
const ORDER=[1,2,3,4,5,6,0];
const reqById=id=>S.reqs.find(r=>r.id===id);
const RQ_KIND={off:'Day off',move:'Move a working day',weekly:'Change weekly hours'};
const rqPill=s=>({Pending:'s-Pending',Approved:'s-Approved',Declined:'s-Rejected',Withdrawn:'s-Cancelled'}[s]||'s-Cancelled');
const canDecide=()=>['super','manager'].includes(curStaff()?.role);
function reqText(r){
  if(r.kind==='off')return `Day off on ${fmtD(r.date)}`;
  if(r.kind==='move')return `Move ${fmtD(r.date)} to ${fmtD(r.newDate)} at ${bShort(r.branchId)}, ${fmtTs(r.start)} – ${fmtTs(r.end)}`;
  return r.on===false?`Stop working ${DAYS[r.day]}s at ${bShort(r.branchId)}`:`${DAYS[r.day]}s at ${bShort(r.branchId)}: ${fmtTs(r.start)} – ${fmtTs(r.end)}`}
/* future appointments of this dentist that the change would leave without a dentist */
function reqImpact(r){
  const ap=S.appts.filter(a=>a.dentistId===r.dentistId&&a.date>=TODAY&&['Pending','Approved'].includes(a.status)&&(a.visit||'Scheduled')==='Scheduled');
  if(r.kind==='off'||r.kind==='move')return sortAppts(ap.filter(a=>a.date===r.date));
  return sortAppts(ap.filter(a=>a.branchId===r.branchId&&dow(a.date)===r.day&&(r.on===false||mins(a.time)<mins(r.start)||endOf(a)>mins(r.end))));
}
function applyReq(r){const d=dById(r.dentistId);d.extra=d.extra||[];
  if(r.kind==='off')d.blocked.push({date:r.date,reason:r.reason||'Day off'});
  else if(r.kind==='move'){d.blocked.push({date:r.date,reason:'Moved to '+fmtDs(r.newDate)});d.extra.push({date:r.newDate,branchId:r.branchId,start:r.start,end:r.end})}
  else{d.sched[r.branchId]=d.sched[r.branchId]||schedFor([]);const s=d.sched[r.branchId][r.day];s.on=r.on!==false;if(s.on){s.start=r.start;s.end=r.end}}
  d.blocked.sort((a,b)=>a.date.localeCompare(b.date))}
const unassign=(list,why)=>list.forEach(a=>{a.dentistId='';logH(a,why)});
const rqScope=r=>{const d=dById(r.dentistId);if(!d)return false;const ids=scopeIds();return ids.some(b=>dentAt(d,b))||(r.branchId&&ids.includes(r.branchId))};
const rqPending=()=>{const u=curStaff();if(!u||!['super','manager'].includes(u.role))return [];return S.reqs.filter(r=>r.status==='Pending'&&rqScope(r))};

/* ---------- Dentist schedules (admin): roster + edit ---------- */
function vDent(){
  const tabs=`<div class="tabsx">${[['roster','Weekly roster'],['edit','Edit schedules']].map(t=>`<button class="chip ${dView===t[0]?'on':''}" data-act="d-view" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>`;
  return tabs+(dView==='roster'?vRoster():vDentEdit());
}
function vRoster(){
  const ids=scopeIds();const list=S.dents.filter(d=>d.active!==false);const duty=dutyOn(TODAY,ids);
  const cell=(d,i)=>{const parts=ids.map(bid=>{const ds=(d.sched[bid]||{})[i],bh=bById(bid).hours[i];if(!ds||!ds.on||!bh||!bh.on)return '';const st=tstr(Math.max(mins(ds.start),mins(bh.start))),en=tstr(Math.min(mins(ds.end),mins(bh.end)));return `<div class="rc">${showBr()?bChip(bid):''}<small>${fmtTs(st)}–${fmtTs(en)}</small></div>`}).join('');return parts||'<span class="rc-off">–</span>'};
  const specials=d=>{const bl=d.blocked.filter(x=>x.date>=TODAY&&x.date<=addDays(TODAY,45)).map(x=>`<span class="tg2 off">Off ${fmtDs(x.date)}</span>`);const ex=(d.extra||[]).filter(x=>x.date>=TODAY).map(x=>`<span class="tg2 on">Extra ${fmtDs(x.date)} · ${esc(bShort(x.branchId))}</span>`);return bl.concat(ex).join('')};
  return `<div class="panel" data-note="List of dentists scheduled"><div style="padding:16px 20px 8px"><b>On duty today</b> <small style="color:var(--muted)">${fmtD(TODAY)}</small></div>${duty.length?`<div class="dutylist">${duty.map(x=>`<div class="dp-duty"><span class="av sm">${initials(x.d.name.replace('Dr. ',''))}</span><span><b>${esc(x.d.name)}</b> ${showBr()?bChip(x.bid):''}<br><small>${fmtTs(tstr(x.st))} – ${fmtTs(tstr(x.en))} · ${S.appts.filter(a=>a.dentistId===x.d.id&&a.date===TODAY&&['Approved','Completed'].includes(a.status)).length} patients today</small></span></div>`).join('')}</div>`:'<div class="empty" style="padding:20px">No dentist is on duty today.</div>'}</div>
  <div class="panel" style="margin-top:18px"><div style="padding:16px 20px 8px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><b>Weekly roster</b><br><small style="color:var(--muted)">${aBranch==='all'?'All branches':esc(bName(aBranch))} · times are inside branch hours</small></div><button class="btn btn-o btn-sm" data-act="d-view" data-v="edit">${ic('edit')}Edit schedules</button></div>
  <div style="overflow-x:auto"><table class="tbl roster"><thead><tr><th>Dentist</th>${ORDER.map(i=>`<th class="${i===dow(TODAY)?'today':''}">${DAYS3[i]}</th>`).join('')}</tr></thead><tbody>${list.map(d=>`<tr style="cursor:default"><td><b>${esc(d.name)}</b><small>${esc(d.role)}</small><div class="rc-sp">${specials(d)}</div></td>${ORDER.map(i=>`<td class="${i===dow(TODAY)?'today':''}">${cell(d,i)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
function vDentEdit(){
  const mine=myBranches();const selBr=d=>dSel[d.id]&&mine.some(b=>b.id===dSel[d.id])?dSel[d.id]:(aBranch!=='all'?aBranch:(mine.find(b=>dentAt(d,b.id))||mine[0])?.id);
  const list=aBranch==='all'?S.dents:S.dents.slice().sort((a,b)=>(dentAt(b,aBranch)?1:0)-(dentAt(a,aBranch)?1:0));
  return `<div class="tools" style="background:#fff;border:1px solid var(--line);border-radius:16px;margin-bottom:18px"><b>${list.length} dentist${list.length===1?'':'s'}</b>${aBranch!=='all'?`<span class="hint">${S.dents.filter(d=>dentAt(d,aBranch)).length} scheduled at ${esc(bName(aBranch))}. Turn on days below to assign any dentist to this branch.</span>`:''}<button class="btn btn-p btn-sm" style="margin-left:auto" data-act="dn-add">${ic('plus')}Add dentist</button></div>`+list.map(d=>{
    const bid=selBr(d),b=bById(bid);if(!b)return '';const sch=(d.sched[bid]=d.sched[bid]||schedFor([]));
    return `<div class="panel dcard" data-note="Module: Dentist Schedule Management"><div class="dh2"><span class="av">${initials(d.name.replace('Dr. ',''))}</span><div style="flex:1;min-width:180px"><h3 style="font-family:var(--font);font-size:1.1rem">${esc(d.name)} ${d.active===false?'<span class="tag off">Inactive</span>':''}</h3><small style="color:var(--muted)">${esc(d.role)}</small><div class="dbr">${S.branches.filter(x=>dentAt(d,x.id)).map(x=>bChip(x.id)).join('')||'<span class="hint">Not scheduled at any branch</span>'}</div></div><button class="btn btn-o btn-sm" data-act="dn-edit" data-id="${d.id}">${ic('edit')}Edit</button></div>
    ${mine.length>1?`<div class="tabs-lite">${mine.map(x=>`<button class="chip ${x.id===bid?'on':''}" data-act="d-branch" data-id="${d.id}" data-b="${x.id}">${esc(x.short)}</button>`).join('')}</div>`:''}
    <p class="hint" style="margin-bottom:10px">Schedule at <b>${esc(b.name)}</b> · branch hours: ${esc(hoursText(b))}</p>
    <div class="sched">${[1,2,3,4,5,6,0].map(i=>{const s=sch[i],bh=b.hours[i];if(!bh.on)return `<div class="sr off"><b>${DAYS[i]}</b><span></span><span class="hint" style="grid-column:3/5">Branch closed <button class="linkbtn" data-act="d-openday" data-b="${bid}" data-day="${i}">Open this day</button></span></div>`;const st=tstr(Math.max(mins(s.start),mins(bh.start))),en=tstr(Math.min(mins(s.end),mins(bh.end)));return `<div class="sr ${s.on?'':'off'}"><b>${DAYS[i]}</b><label class="sw"><input type="checkbox" ${s.on?'checked':''} data-act="d-day" data-id="${d.id}" data-b="${bid}" data-day="${i}" aria-label="${DAYS[i]} working"><i></i></label><select class="inp" data-act="d-time" data-id="${d.id}" data-b="${bid}" data-day="${i}" data-k="start" aria-label="Start">${timeOpts(bh.start,tstr(mins(bh.end)-30),st)}</select><select class="inp" data-act="d-time" data-id="${d.id}" data-b="${bid}" data-day="${i}" data-k="end" aria-label="End">${timeOpts(tstr(mins(bh.start)+30),bh.end,en)}</select></div>`}).join('')}</div>
    <div style="margin-top:18px"><b style="font-size:.9rem">Days off / blocked dates</b> <span class="hint">(all branches)</span><div class="blk">${d.blocked.length?d.blocked.map((x,i)=>`<span>${fmtD(x.date,{month:'short',day:'numeric',year:'numeric'})} · ${esc(x.reason||'Blocked')}<button data-act="d-unblock" data-id="${d.id}" data-i="${i}" aria-label="Remove">×</button></span>`).join(''):'<small style="color:var(--muted)">None</small>'}</div>
    <div class="blkrow"><div class="field"><label for="bd_${d.id}">Date</label><input type="date" class="inp" id="bd_${d.id}" min="${TODAY}"></div><div class="field"><label for="br_${d.id}">Reason</label><input class="inp" id="br_${d.id}" placeholder="e.g. Leave, seminar"></div><button class="btn btn-o" data-act="d-block" data-id="${d.id}">${ic('plus')}Block date</button></div></div>
    <p class="hint" style="margin-top:14px">Changes apply to future booking slots immediately. Existing bookings are not moved automatically.</p></div>`}).join('')||'<div class="panel empty">No dentists yet.</div>';
}
function dentForm(id){const d=id?dById(id):{name:'',role:'',active:true};
  openModal(id?'Edit dentist':'Add a dentist',`<div class="mform"><div class="form-grid" style="grid-template-columns:1fr"><div class="field"><label for="dn_n">Name <span class="req">*</span></label><input class="inp" id="dn_n" value="${esc(d.name)}" placeholder="Dr. First Last"><div class="err" data-e="n"></div></div><div class="field"><label for="dn_r">Role / specialty</label><input class="inp" id="dn_r" value="${esc(d.role)}" placeholder="e.g. Orthodontics"></div>${id?`<label class="chk2" style="justify-self:start"><input type="checkbox" id="dn_a" ${d.active!==false?'checked':''}> Active (bookable)</label>`:'<input type="hidden" id="dn_a" value="1">'}</div><p class="hint">After saving, set the weekly schedule for each branch in the card below. To let this dentist sign in, add a staff account with the Dentist role in Staff &amp; roles.</p><div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="dn-save" data-id="${id||''}">${id?'Save changes':'Add dentist'}</button></div></div>`);
}

/* ---------- Schedule requests (admin) ---------- */
function rqCard(r,decide){
  const d=dById(r.dentistId);if(!d)return '';const imp=r.status==='Pending'?reqImpact(r):[];
  return `<div class="rqcard"><div class="rqh"><span class="av sm">${initials(d.name.replace('Dr. ',''))}</span><div style="flex:1;min-width:0"><b>${esc(d.name)}</b><br><small style="color:var(--muted)">${RQ_KIND[r.kind]} · requested ${ago(r.created)}</small></div><span class="pill ${rqPill(r.status)}">${r.status}</span></div><p class="rqt">${esc(reqText(r))}</p>${r.reason?`<p class="rqr">“${esc(r.reason)}”</p>`:''}
  ${imp.length?`<div class="note" style="background:var(--warn-bg);color:#6F4500"><svg class="ic"><use href="#i-bell"/></svg><span><b>${imp.length} appointment${imp.length>1?'s':''}</b> now assigned to this dentist would need a new dentist: ${imp.slice(0,3).map(a=>esc(patName(a))+' ('+fmtDs(a.date)+', '+fmtT(a.time)+')').join(', ')}${imp.length>3?' and more':''}.</span></div>`:''}
  ${r.note?`<p class="hint">Admin note: ${esc(r.note)}${r.decidedBy?' · '+esc(r.decidedBy):''}</p>`:''}
  ${decide&&r.status==='Pending'?`<div class="qa"><button class="btn btn-p btn-sm" data-act="rq-open" data-id="${r.id}" data-s="Approved">${ic('check')}Approve</button><button class="btn btn-o btn-sm" style="color:var(--bad)" data-act="rq-open" data-id="${r.id}" data-s="Declined">Decline</button></div>`:''}
  ${!decide&&r.status==='Pending'?`<div class="qa"><button class="btn btn-o btn-sm" data-act="rq-withdraw" data-id="${r.id}">Withdraw request</button></div>`:''}</div>`;
}
function vRq(){
  const L=S.reqs.filter(rqScope).slice().sort((a,b)=>b.created.localeCompare(a.created));
  const pend=L.filter(r=>r.status==='Pending'),dec=L.filter(r=>r.status!=='Pending');const show=rqTab==='Pending'?pend:dec;
  return `<div class="tabsx"><button class="chip ${rqTab==='Pending'?'on':''}" data-act="rq-tab" data-t="Pending">Waiting for approval (${pend.length})</button><button class="chip ${rqTab==='Decided'?'on':''}" data-act="rq-tab" data-t="Decided">Decided (${dec.length})</button></div>
  <div class="note" style="margin-bottom:16px" data-note="Dentists request, admin approves"><svg class="ic"><use href="#i-refresh"/></svg><span>Dentists send requests from their own sign-in (<b>My schedule</b>). Approving a request updates the dentist's schedule and the booking slots straight away. Patients already assigned to that dentist on the affected day are unassigned so staff can give them a new dentist.</span></div>
  ${show.length?show.map(r=>rqCard(r,true)).join(''):`<div class="panel empty">${rqTab==='Pending'?'No requests are waiting.':'Nothing decided yet.'}</div>`}`;
}

/* ---------- Dentist role: dashboard ---------- */
function vDashDent(){
  const d=myDent();if(!d)return '<div class="panel empty">This account is not linked to a dentist.</div>';
  const A=scAppts(),ids=scopeIds();const today=sortAppts(A.filter(a=>a.date===TODAY&&['Approved','Completed','No-show'].includes(a.status)));
  const inTx=today.filter(a=>a.status==='Approved'&&a.visit==='On-going').length;
  const waiting=today.filter(a=>a.status==='Approved'&&['Scheduled','Late','Arrived'].includes(a.visit||'Scheduled')).length;
  const doneN=today.filter(a=>a.status==='Completed').length;
  const wkEnd=addDays(TODAY,7);const up=sortAppts(A.filter(a=>a.date>TODAY&&a.date<=wkEnd&&a.status==='Approved'));
  const duty=dutyOn(TODAY,S.branches.map(b=>b.id)).filter(x=>x.d.id===d.id);
  const k=[['Today',today.length,'my patients'],['Waiting',waiting,'expected or checked in'],['In treatment',inTx,'on-going now'],['Completed today',doneN,'visits finished']];
  const wk=weeklyData(8,ids,d.id),mx=Math.max(1,...wk.map(w=>w.n));
  const days=[0,1,2,3,4,5,6].map(i=>addDays(TODAY,i));
  const myReq=S.reqs.filter(r=>r.dentistId===d.id).sort((a,b)=>b.created.localeCompare(a.created)).slice(0,3);
  return `<div class="note" style="margin-bottom:16px" data-note="Dentist role: own dashboard"><svg class="ic"><use href="#i-user"/></svg><span>${duty.length?`<b>You are on duty today</b> at ${duty.map(x=>esc(bShort(x.bid))+' ('+fmtTs(tstr(x.st))+' – '+fmtTs(tstr(x.en))+')').join(' and ')}.`:'<b>You are not scheduled today.</b> You can still see your upcoming patients below.'} Staff check patients in and assign you when treatment starts.</span></div>
  <div class="kpis">${k.map(x=>`<div class="kpi"><span>${x[0]}</span><b>${x[1]}</b><small style="color:var(--muted)">${x[2]}</small></div>`).join('')}</div>
  <div class="a-cols"><div class="panel"><div style="padding:18px 20px"><b>My patients today</b><br><small style="color:var(--muted)">${fmtD(TODAY)}</small></div>${today.length?`<div class="agenda" style="padding-top:0">${today.map(a=>qRow(a)).join('')}</div>`:'<div class="empty">No patients assigned to you today yet.</div>'}</div>
  <div class="panel"><div style="padding:18px 20px;display:flex;justify-content:space-between;align-items:center"><b>Coming up this week</b><button class="btn btn-o btn-sm" data-act="a-tab" data-tab="appts">All appointments</button></div>${up.length?`<div class="agenda" style="padding-top:0">${up.slice(0,6).map(a=>`<div class="ag" data-act="a-open" data-ref="${a.ref}" role="button" tabindex="0"><time>${fmtDs(a.date)}<small>${fmtT(a.time)}</small></time><div><b>${esc(patName(a))}</b> ${showBr()?bChip(a.branchId):''}<br><small style="color:var(--muted)">${esc(svcName(a.service))} · ${fmtDur(apptDur(a))}</small></div></div>`).join('')}</div>`:'<div class="empty">Nothing booked for you in the next 7 days.</div>'}</div></div>
  <div class="a-cols" style="margin-top:18px"><div class="panel"><div style="padding:18px 20px 6px"><b>My week</b> <small style="color:var(--muted)">patients per day</small></div><div class="weekstrip">${days.map(s=>{const n=A.filter(a=>a.date===s&&!['Rejected','Cancelled'].includes(a.status)).length;const w=dutyOn(s,S.branches.map(b=>b.id)).filter(x=>x.d.id===d.id);return `<div class="wsd ${s===TODAY?'today':''} ${w.length?'':'off'}"><small>${DAYS3[dow(s)]} ${parse(s).getDate()}</small><b>${n}</b><span>${w.length?w.map(x=>esc(bShort(x.bid))).join(', '):'Off'}</span></div>`}).join('')}</div></div>
  <div class="panel"><div style="padding:18px 20px 6px"><b>My schedule requests</b></div><div style="padding:0 20px 18px">${myReq.length?myReq.map(r=>`<div class="rqmini"><span class="pill ${rqPill(r.status)}">${r.status}</span><span>${esc(reqText(r))}</span></div>`).join(''):'<p class="hint">No requests yet.</p>'}<button class="btn btn-o btn-sm" style="margin-top:12px" data-act="a-tab" data-tab="myschd">Open my schedule</button></div></div></div>
  <div class="panel" style="margin-top:18px"><div style="padding:18px 20px 6px"><b>My appointments per week</b> <small style="color:var(--muted)">(8 weeks up to this week)</small></div><div class="wk" role="img" aria-label="My weekly appointments">${wk.map(w=>`<div class="col" title="${w.n}"><b>${w.n}</b><i style="height:${w.n/mx*80}%"></i><span>${w.label}</span></div>`).join('')}</div></div>`;
}

/* ---------- Dentist role: my schedule + requests ---------- */
function vMySched(){
  const d=myDent();if(!d)return '<div class="panel empty">This account is not linked to a dentist.</div>';
  const brs=S.branches.filter(b=>b.status!=='inactive'&&dentAt(d,b.id));const mine=S.reqs.filter(r=>r.dentistId===d.id).sort((a,b)=>b.created.localeCompare(a.created));
  const row=bid=>{const b=bById(bid),sch=d.sched[bid]||{};return `<div class="panel" style="padding:20px;margin-bottom:16px"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><b>${esc(b.name)}</b>${bChip(bid)}<small style="color:var(--muted)">Branch hours: ${esc(hoursText(b))}</small></div><div class="wkrow">${ORDER.map(i=>{const s=sch[i],bh=b.hours[i];const on=s&&s.on&&bh.on;const t=on?`${fmtTs(tstr(Math.max(mins(s.start),mins(bh.start))))}–${fmtTs(tstr(Math.min(mins(s.end),mins(bh.end))))}`:(bh.on?'Off':'Closed');return `<div class="wkd ${on?'on':''}"><b>${DAYS3[i]}</b><span>${t}</span></div>`}).join('')}</div></div>`};
  const sp=[...d.blocked.filter(x=>x.date>=TODAY).map(x=>`<span class="tg2 off">Off ${fmtD(x.date,{month:'short',day:'numeric',year:'numeric'})} · ${esc(x.reason||'')}</span>`),...(d.extra||[]).filter(x=>x.date>=TODAY).map(x=>`<span class="tg2 on">Extra day ${fmtD(x.date,{month:'short',day:'numeric'})} · ${esc(bShort(x.branchId))} ${fmtTs(x.start)}–${fmtTs(x.end)}</span>`)];
  return `<div class="tools" style="background:#fff;border:1px solid var(--line);border-radius:16px;margin-bottom:18px"><b>${esc(d.name)}</b><span class="hint">Your working days are set by the clinic. To change them, send a request. An admin approves it before anything changes.</span><button class="btn btn-p btn-sm" style="margin-left:auto" data-act="rq-new">${ic('plus')}Request a schedule change</button></div>
  ${brs.length?brs.map(b=>row(b.id)).join(''):'<div class="panel empty">You are not scheduled at any branch yet.</div>'}
  <div class="panel" style="padding:20px;margin-bottom:16px"><b>Upcoming days off and extra days</b><div class="blk" style="margin-top:10px">${sp.join('')||'<small style="color:var(--muted)">None</small>'}</div></div>
  <div class="panel" style="padding:20px" data-note="Dentist requests a schedule change; admin approves"><b>My requests</b><div style="display:grid;gap:12px;margin-top:12px">${mine.length?mine.map(r=>rqCard(r,false)).join(''):'<p class="hint">You have not sent any requests.</p>'}</div></div>`;
}
function rqRead(){const g=id=>{const e=$('#'+id);return e?e.value:undefined};const set=(k,id)=>{const v=g(id);if(v!==undefined)RQF[k]=v};
  set('kind','rq_k');set('date','rq_d');set('newDate','rq_n');set('branch','rq_b');set('day','rq_w');set('start','rq_s');set('end','rq_e');set('reason','rq_r');const o=$('#rq_o');if(o)RQF.on=!o.checked}
function rqForm(){const brs=myBranches();RQF={kind:'off',date:'',newDate:'',branch:brs[0]?.id||'',day:'1',on:true,start:S.settings.defOpen,end:S.settings.defClose,reason:''};drawRqForm(true)}
function drawRqForm(first){
  const k=RQF.kind,brs=myBranches();const dayNo=k==='move'&&RQF.newDate?dow(RQF.newDate):+RQF.day;const b=bById(RQF.branch);const bh=b&&(k==='move'?(RQF.newDate?b.hours[dayNo]:null):b.hours[dayNo]);
  const times=bh&&bh.on?{from:bh.start,to:bh.end}:null;
  if(times){if(mins(RQF.start)<mins(times.from)||mins(RQF.start)>=mins(times.to))RQF.start=times.from;if(mins(RQF.end)<=mins(RQF.start)||mins(RQF.end)>mins(times.to))RQF.end=times.to}
  const brSel=`<div class="field"><label for="rq_b">Branch</label><select class="inp" id="rq_b" data-act="rq-upd">${brs.map(x=>`<option value="${x.id}" ${RQF.branch===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>`;
  const timeSel=times?`<div class="field"><label for="rq_s">From</label><select class="inp" id="rq_s" data-act="rq-upd">${timeOpts(times.from,tstr(mins(times.to)-30),RQF.start)}</select></div><div class="field"><label for="rq_e">Until</label><select class="inp" id="rq_e" data-act="rq-upd">${timeOpts(tstr(mins(RQF.start)+30),times.to,RQF.end)}</select></div>`:`<div class="field full"><div class="hint" style="color:var(--bad)">${bh===null?'Choose the new date first.':esc(b?.short||'The branch')+' is closed that day.'}</div></div>`;
  const html=`<div class="mform"><div class="field"><label for="rq_k">What do you need?</label><select class="inp" id="rq_k" data-act="rq-upd"><option value="off" ${k==='off'?'selected':''}>Day off / leave on a date</option><option value="move" ${k==='move'?'selected':''}>Move a working day to another date</option><option value="weekly" ${k==='weekly'?'selected':''}>Change my weekly working hours</option></select></div>
  <div class="form-grid">${k==='off'?`<div class="field"><label for="rq_d">Date <span class="req">*</span></label><input class="inp" type="date" id="rq_d" min="${TODAY}" value="${RQF.date}"></div>`:''}
  ${k==='move'?`<div class="field"><label for="rq_d">Working day to move <span class="req">*</span></label><input class="inp" type="date" id="rq_d" min="${TODAY}" value="${RQF.date}"></div><div class="field"><label for="rq_n">Move it to <span class="req">*</span></label><input class="inp" type="date" id="rq_n" min="${TODAY}" value="${RQF.newDate}" data-act="rq-upd"></div>${brSel}${timeSel}`:''}
  ${k==='weekly'?`${brSel}<div class="field"><label for="rq_w">Day of the week</label><select class="inp" id="rq_w" data-act="rq-upd">${ORDER.map(i=>`<option value="${i}" ${+RQF.day===i?'selected':''}>${DAYS[i]}</option>`).join('')}</select></div><label class="chk2 full" style="justify-self:start"><input type="checkbox" id="rq_o" data-act="rq-upd" ${RQF.on===false?'checked':''}>I will not work this day at this branch</label>${RQF.on===false?'':timeSel}`:''}
  <div class="field full"><label for="rq_r">Reason <span class="hint">(helps the admin decide)</span></label><textarea class="inp" id="rq_r" placeholder="e.g. Conference, personal leave, teaching schedule">${esc(RQF.reason)}</textarea></div></div>
  <p class="hint">An admin must approve this before your schedule changes. Patients already assigned to you on an affected day will be given a new dentist by staff.</p><div class="err" id="rqErr"></div>
  <div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="rq-save">Send request</button></div></div>`;
  if(first)openModal('Request a schedule change',html,true);else $('#mbody').innerHTML=html;
}

Object.assign(ACT,{
 'd-view':el=>{dView=el.dataset.v;drawAdmin()},
 'd-branch':el=>{dSel[el.dataset.id]=el.dataset.b;drawAdmin()},
 'd-openday':el=>{const b=bById(el.dataset.b),day=+el.dataset.day;b.hours[day]={on:true,start:S.settings.defOpen,end:S.settings.defClose};save();drawAdmin();toast(`${b.short} is now open on ${DAYS[day]}s (${fmtT(S.settings.defOpen)} – ${fmtT(S.settings.defClose)}). Turn the dentist on for that day below.`)},
 'd-day':el=>{const d=dById(el.dataset.id),day=+el.dataset.day,bid=el.dataset.b;
   if(el.checked){const other=S.branches.find(x=>x.id!==bid&&d.sched[x.id]&&d.sched[x.id][day]?.on);if(other){el.checked=false;toast(`${d.name} already works at ${other.short} on ${DAYS[day]}.`);return}
     const bh=bById(bid).hours[day];const s=d.sched[bid][day];s.start=bh.start;s.end=bh.end}
   d.sched[bid][day].on=el.checked;save();drawAdmin();toast('Schedule updated')},
 'd-time':el=>{const s=dById(el.dataset.id).sched[el.dataset.b][el.dataset.day];s[el.dataset.k]=el.value;if(mins(s.end)<=mins(s.start)){toast('End time must be after start time');if(el.dataset.k==='end')s.end=tstr(mins(s.start)+60);else s.start=tstr(mins(s.end)-60);save();drawAdmin();return}save();toast('Schedule updated')},
 'd-block':el=>{const id=el.dataset.id,v=$('#bd_'+id).value;if(!v){toast('Pick a date to block');return}const d=dById(id);d.blocked.push({date:v,reason:$('#br_'+id).value.trim()});d.blocked.sort((a,b)=>a.date.localeCompare(b.date));
   const aff=S.appts.filter(a=>a.dentistId===id&&a.date===v&&['Pending','Approved'].includes(a.status)&&(a.visit||'Scheduled')==='Scheduled');unassign(aff,`Dentist unassigned: ${d.name} is off that day. Needs a new dentist`);
   save();drawAdmin();toast(aff.length?`Date blocked. ${aff.length} appointment${aff.length>1?'s are':' is'} now without a dentist.`:'Date blocked')},
 'd-unblock':el=>{dById(el.dataset.id).blocked.splice(+el.dataset.i,1);save();drawAdmin()},
 'dn-add':()=>dentForm(''),'dn-edit':el=>dentForm(el.dataset.id),
 'dn-save':el=>{const id=el.dataset.id,f=$('.mform');const n=$('#dn_n').value.trim(),r=$('#dn_r').value.trim();setE(f,'n','');if(!n){setE(f,'n','Enter the dentist\'s name');return}
   if(id){const d=dById(id);d.name=n;d.role=r;d.active=$('#dn_a').checked;toast('Dentist updated')}else{const nd={id:nextId('d',S.dents),name:n,role:r||'Dentist',active:true,sched:{},blocked:[],extra:[]};S.dents.push(nd);if(aBranch!=='all')dSel[nd.id]=aBranch;dView='edit';toast('Dentist added. Set their weekly schedule per branch.')}
   save();closeModal();drawAdmin()},
 /* schedule-change requests */
 'rq-tab':el=>{rqTab=el.dataset.t;drawAdmin()},
 'rq-open':el=>{if(!canDecide()){toast('Only admins can decide requests.');return}const r=reqById(el.dataset.id),ok=el.dataset.s==='Approved',imp=ok?reqImpact(r):[];
   openModal(ok?'Approve schedule change':'Decline request',`<div class="mform"><p class="rqt"><b>${esc(dById(r.dentistId).name)}</b><br>${esc(reqText(r))}</p>${imp.length?`<div class="note" style="background:var(--warn-bg);color:#6F4500"><svg class="ic"><use href="#i-bell"/></svg><span><b>${imp.length} patient${imp.length>1?'s':''}</b> will be left without a dentist and need reassigning: ${imp.slice(0,4).map(a=>esc(patName(a))+' ('+fmtDs(a.date)+', '+fmtT(a.time)+')').join(', ')}${imp.length>4?' and more':''}.</span></div>`:''}<div class="field"><label for="rqN">Note to the dentist <span class="hint">(optional)</span></label><textarea class="inp" id="rqN" placeholder="${ok?'e.g. Approved. Enjoy the conference.':'e.g. We are short-staffed that day. Can you move it by a week?'}"></textarea></div><div class="foot"><button class="btn btn-o" data-act="close-modal">Back</button><button class="btn btn-p" ${ok?'':'style="background:var(--bad)"'} data-act="rq-go" data-id="${r.id}" data-s="${el.dataset.s}">${ok?'Approve change':'Decline request'}</button></div></div>`)},
 'rq-go':el=>{if(!canDecide())return;const r=reqById(el.dataset.id);if(!r||r.status!=='Pending'){closeModal();return}const ok=el.dataset.s==='Approved',d=dById(r.dentistId);
   if(ok){const imp=reqImpact(r);applyReq(r);unassign(imp,`Dentist unassigned: ${d.name}'s schedule change was approved. Needs a new dentist`)}
   r.status=el.dataset.s;r.decidedAt=nowIso();r.decidedBy=curStaff().name;r.note=($('#rqN').value||'').trim();save();closeModal();drawAdmin();toast(ok?'Approved. The dentist\'s schedule and booking slots are updated.':'Declined. The dentist can see your note.')},
 'rq-new':()=>{if(!isDentist())return;rqForm()},
 'rq-upd':el=>{rqRead();if(el.id==='rq_k')RQF.on=true;drawRqForm()},
 'rq-save':()=>{if(!isDentist())return;rqRead();const d=myDent(),err=$('#rqErr');const E=m=>{err.textContent=m};const k=RQF.kind;const r={id:nextId('r',S.reqs),dentistId:d.id,kind:k,reason:(RQF.reason||'').trim(),status:'Pending',created:nowIso()};
   if(k==='off'){if(!RQF.date)return E('Choose the date.');if(RQF.date<TODAY)return E('Choose today or a future date.');if(d.blocked.some(x=>x.date===RQF.date))return E('That date is already marked as a day off.');r.date=RQF.date}
   else if(k==='move'){if(!RQF.date||!RQF.newDate)return E('Choose both dates.');if(RQF.date===RQF.newDate)return E('Choose a different date to move to.');
     if(!S.branches.some(b=>windows(b.id,RQF.date,d.id).length))return E('You are not scheduled to work on the first date.');
     const b=bById(RQF.branch),h=b.hours[dow(RQF.newDate)];if(!h.on)return E(b.short+' is closed on the new date.');if(mins(RQF.end)<=mins(RQF.start))return E('The end time must be after the start time.');
     Object.assign(r,{date:RQF.date,newDate:RQF.newDate,branchId:RQF.branch,start:RQF.start,end:RQF.end})}
   else{const day=+RQF.day,b=bById(RQF.branch);if(RQF.on!==false){if(!b.hours[day].on)return E(b.short+' is closed on '+DAYS[day]+'s.');if(mins(RQF.end)<=mins(RQF.start))return E('The end time must be after the start time.');
       const other=S.branches.find(x=>x.id!==RQF.branch&&d.sched[x.id]&&d.sched[x.id][day]?.on);if(other)return E(`You already work at ${other.short} on ${DAYS[day]}s.`)}
     Object.assign(r,{branchId:RQF.branch,day,on:RQF.on!==false,start:RQF.start,end:RQF.end})}
   if(S.reqs.some(x=>x.dentistId===d.id&&x.status==='Pending'&&reqText(x)===reqText(r)))return E('You already sent this request. It is waiting for approval.');
   S.reqs.unshift(r);save();closeModal();drawAdmin();toast('Request sent. An admin will review it.')},
 'rq-withdraw':el=>{const r=reqById(el.dataset.id);if(!r||r.dentistId!==curStaff()?.dentistId||r.status!=='Pending')return;r.status='Withdrawn';save();drawAdmin();toast('Request withdrawn')}
});
