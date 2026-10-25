/* =========================================================
   APPOINTMENT DRAWER · APPROVAL (time allotted) · VISIT PROGRESS ·
   COMPLETION (next visit) · MANUAL APPOINTMENTS · RESCHEDULE
   Visit progress: Scheduled → Late (optional) → Arrived → On-going → Completed
========================================================= */
const canProcess=()=>!!curStaff()&&!isDentist();
const guard=fn=>el=>{if(!canProcess()){toast('Only clinic staff can do this.');return}fn(el)};
/* the single next step for a patient, shown as a quick button in lists */
const nextAct=a=>a.status!=='Approved'||a.date>TODAY?null:({Scheduled:['v-arrive','Arrived'],Late:['v-arrive','Arrived'],Arrived:['v-start','Start'],'On-going':['v-done','Complete']}[a.visit||'Scheduled']||null);
function qRow(a){const q=canProcess()?nextAct(a):null;
  return `<div class="ag" data-act="a-open" data-ref="${a.ref}" role="button" tabindex="0"><time>${fmtT(a.time)}<small>${fmtDur(apptDur(a))}</small></time><div><b>${esc(patName(a))}</b> ${showBr()?bChip(a.branchId):''}<br><small style="color:var(--muted)">${esc(svcName(a.service))} · ${a.dentistId?esc(dentName(a)):'No dentist yet'}</small></div><div class="qa"><span class="pill ${sc(stLabel(a))}">${stLabel(a)}</span>${q?`<button class="btn btn-y btn-sm" data-act="${q[0]}" data-ref="${a.ref}">${q[1]}</button>`:''}</div></div>`}
const VSTEPS=['Scheduled','Arrived','On-going','Completed'];
function stepper(a){const v=a.status==='Completed'?'Completed':(a.visit||'Scheduled');const idx=v==='Late'?0:Math.max(0,VSTEPS.indexOf(v));
  return `<div class="vsteps" role="img" aria-label="Visit progress: ${v}">${VSTEPS.map((s,i)=>`<div class="vs ${i<idx?'done':''} ${i===idx?'cur':''} ${i===0&&v==='Late'?'late':''}"><b>${i<idx?'✓':i+1}</b><span>${i===0&&v==='Late'?'Late':s}</span></div>`).join('')}</div>`}
function afterChange(ref){save();drawAdmin();if($('#drawer').classList.contains('open'))openAppt(ref)}
const nowIso=()=>new Date().toISOString();

/* ---------- drawer ---------- */
function openAppt(ref){
  const a=apptBy(ref);if(!a)return;const p=uById(a.patientId);const staff=canProcess();const v=a.visit||'Scheduled';const today=a.date<=TODAY;
  const B=(act,label,cls='btn-o',icon='',extra='')=>`<button class="btn ${cls}" data-act="${act}" data-ref="${ref}" ${extra}>${icon?ic(icon):''}${label}</button>`;
  let main=[],sec=[],extra='';
  if(staff){
    if(a.status==='Pending')main=[B('a-approve','Approve &amp; set time','btn-p','check'),B('a-resched','Reschedule','btn-o','refresh'),B('a-reject','Reject','btn-o','x','style="color:var(--bad)"')];
    else if(a.status==='Approved'){
      if(v==='Scheduled'||v==='Late'){
        if(today){main.push(B('v-arrive','Mark arrived','btn-p','check'));if(v==='Scheduled')main.push(B('v-late','Mark late (optional)'));if(a.date<TODAY)main.push(B('v-done','Mark completed'));main.push(B('a-status','No-show','btn-o','','data-s="No-show" style="color:var(--bad)"'))}
        else extra+=`<p class="hint">Check-in opens on the appointment day.</p>`;
      }else if(v==='Arrived')main.push(B('v-start','Start treatment · assign dentist','btn-p','user'));
      else if(v==='On-going')main.push(B('v-done','Complete visit','btn-p','check'));
      sec.push(B('a-edur','Edit time allotted','btn-o','clock'));
      if(['Scheduled','Late'].includes(v)){sec.push(B('a-resched','Reschedule','btn-o','refresh'));if(a.date>TODAY)sec.push(B('a-remind','Send reminder','btn-o','bell'));sec.push(B('a-cancel','Cancel','btn-o','','style="color:var(--bad)"'))}
    }
    if(!a.dentistId&&['Pending','Approved'].includes(a.status)&&v!=='On-going')sec.unshift(B('a-assign','Assign dentist','btn-o','user'));
    if(a.status==='Completed'&&!a.next)main.push(B('v-next','Set next visit','btn-p','cal'));
    if(['Rejected','Cancelled','No-show'].includes(a.status))extra+=`<p class="hint">This appointment is ${a.status.toLowerCase()}. No further actions.</p>`;
  }else extra=`<p class="hint">Patient check-in and visit status are handled by the clinic staff.</p>`;
  const nx=a.next?`<div class="note"><svg class="ic"><use href="#i-cal"/></svg><span><b>Next visit recommended:</b> ${esc(svcName(a.next.service))}${a.next.date?' around '+fmtD(a.next.date)+(a.next.time?', '+fmtT(a.next.time):''):''}${a.next.ref?`<br><button class="linkbtn" data-act="a-open" data-ref="${a.next.ref}">Reserved as ${esc(a.next.ref)}</button>`:(staff?`<br><button class="btn btn-o btn-sm" style="margin-top:8px" data-act="v-booknext" data-ref="${ref}">${ic('cal')}Reserve this visit</button> <button class="btn btn-o btn-sm" style="margin-top:8px" data-act="v-next" data-ref="${ref}">Change</button>`:'')}</span></div>`:'';
  const mails=S.mails.filter(m=>m.ref===ref);
  openDrawer(`<div class="dh"><div><small style="color:var(--muted)">${esc(a.ref)}</small><h3 style="margin-top:2px">${esc(p?.name||'')}</h3></div><button class="btn btn-o btn-sm" data-act="close-drawer" aria-label="Close">✕</button></div><div class="db"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="pill ${sc(stLabel(a))} lg">${stLabel(a)}</span>${a.source&&a.source!=='Online'?`<span class="bchip">${esc(a.source)}</span>`:''}</div>${a.status==='Approved'||a.status==='Completed'?stepper(a):''}
  <dl class="dl"><dt>Branch</dt><dd>${esc(bName(a.branchId))}</dd><dt>Service</dt><dd>${esc(svcName(a.service))}</dd><dt>Dentist</dt><dd>${a.dentistId?esc(dentName(a)):'<span class="hint">Not assigned yet</span>'}</dd><dt>Schedule</dt><dd>${fmtD(a.date)}<br><span style="font-weight:600">${fmtRange(a)}</span></dd><dt>Time allotted</dt><dd>${fmtDur(apptDur(a))}${a.durSet?'':' <span class="hint">(estimate, set on approval)</span>'}</dd><dt>Mobile</dt><dd><a href="tel:${esc(p?.phone||'')}" style="color:var(--p600)">${esc(p?.phone||'')}</a></dd><dt>Email</dt><dd>${esc(p?.email||'')||'<span class="hint">None on file</span>'}</dd><dt>Patient notes</dt><dd style="font-weight:500">${esc(a.notes)||'-'}</dd></dl>
  ${main.length?`<div><b style="font-size:.9rem">${a.status==='Approved'?'Visit progress':'Actions'}</b><div class="qa" style="margin-top:8px">${main.join('')}</div></div>`:''}${extra}${sec.length?`<div><b style="font-size:.9rem">More</b><div class="qa" style="margin-top:8px">${sec.join('')}</div></div>`:''}${nx}
  <div><b style="font-size:.9rem">History</b><div class="hist" style="margin-top:10px">${a.history.slice().reverse().map(h=>`<div>${esc(h.text)}<small>${ago(h.at)}</small></div>`).join('')}</div></div>
  ${mails.length?`<div><b style="font-size:.9rem">Emails sent</b><div style="margin-top:8px">${mailRows(mails)}</div></div>`:''}</div>`);
}

/* ---------- approval: set the time allotted ---------- */
let AP=null;
function openApprove(ref,edit){const a=apptBy(ref);AP={ref,edit:!!edit,dur:a.dur||svcDur(a.service),dent:a.dentistId||''};drawApprove(true)}
function apRead(){const e=$('#ap_t');if(e)AP.dent=e.value}
function drawApprove(first){
  const a=apptBy(AP.ref),p=uById(a.patientId);const fit=fitsDur(a,AP.dur);const used=occupancy(a.branchId,a.date,mins(a.time),a.ref),cap=capOf(a.branchId);
  const duty=dentsOnDuty(a.branchId,a.date,mins(a.time));
  const html=`<div class="mform"><dl class="dl"><dt>Patient</dt><dd>${esc(p?.name||'')}</dd><dt>Service</dt><dd>${esc(svcName(a.service))}</dd><dt>Branch</dt><dd>${esc(bName(a.branchId))}</dd><dt>Starts</dt><dd>${fmtD(a.date)}, ${fmtT(a.time)}</dd></dl>
  <div class="field"><label for="ap_d">Time allotted for this service</label><select class="inp" id="ap_d" data-act="ap-dur">${DUR_OPTS.map(n=>`<option value="${n}" ${n===AP.dur?'selected':''}>${fmtDur(n)}${fitsDur(a,n).ok?'':' (does not fit)'}</option>`).join('')}</select><div class="hint">Default for ${esc(svcName(a.service))} is ${fmtDur(svcDur(a.service))}. This visit will take <b>${fmtT(a.time)} – ${fmtT(tstr(Math.min(mins(a.time)+AP.dur,1439)))}</b>.</div></div>
  <div class="field"><label for="ap_t">Dentist <span class="hint">(optional now)</span></label><select class="inp" id="ap_t"><option value="">Assign later, when the patient arrives</option>${duty.map(d=>`<option value="${d.id}" ${AP.dent===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div>
  <div class="capline">${ic('users')}<span>${used} other patient${used===1?'':'s'} already booked at ${fmtT(a.time)} · limit ${cap} per slot at ${esc(bShort(a.branchId))}</span></div>
  <div class="err" id="apErr">${fit.ok?'':esc(fit.why+'. Pick a shorter time.')}</div>
  <div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="ap-go">${AP.edit?'Save time allotted':'Approve &amp; email patient'}</button></div></div>`;
  if(first)openModal(AP.edit?'Edit time allotted':'Approve appointment',html);else $('#mbody').innerHTML=html;
}

/* ---------- reschedule (staff) ---------- */
function openReschedModal(ref){const a=apptBy(ref);calInit('rs','');CAL.rs.ref=ref;CAL.rs.branch=a.branchId;CAL.rs.time='';openModal('Reschedule appointment',`<div style="padding:22px" id="rsBody"></div>`,true);drawResched()}
function drawResched(){const c=CAL.rs;const body=$('#rsBody');if(!body)return;const a=apptBy(c.ref);
  const sl=c.sel?staffSlots(c.sel,c.branch,c.ref):[];
  body.innerHTML=`<p style="margin-bottom:14px;color:var(--muted)">Currently <b style="color:var(--p900)">${fmtD(a.date)} · ${fmtRange(a)}</b> at ${esc(bName(a.branchId))}</p><div class="wz-two"><div>${calHTML('rs',s=>hasStaffSlot(s,c.branch,c.ref))}</div><div><b>Time slots${c.sel?' · '+fmtD(c.sel):''}</b><div style="margin-top:12px">${c.sel?(sl.length?`<div class="slots">${sl.map(x=>`<button type="button" class="slot ${c.time===x.time?'on':''}" ${x.used>=x.cap||slotPast(c.sel,x.time)?'disabled':''} data-act="rs-time" data-time="${x.time}">${fmtT(x.time)}<small>${x.used}/${x.cap} booked</small></button>`).join('')}</div>`:'<p class="hint">No dentist is scheduled that day.</p>'):'<p class="hint">Pick a date first.</p>'}</div></div></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="rs-confirm" ${c.time?'':'disabled style="opacity:.5"'}>Confirm new schedule</button></div>`}
window.onCalChange=id=>{if(id==='rs')drawResched()};
window.onCalPick=id=>{if(id==='rs'){CAL.rs.time='';drawResched()}};

/* ---------- choosing a dentist ---------- */
function dentOptions(a,sel){
  const duty=dentsOnDuty(a.branchId,a.date,mins(a.time)).map(d=>d.id);const all=S.dents.filter(d=>d.active!==false);
  const busy=d=>S.appts.filter(x=>x.dentistId===d.id&&x.date===a.date&&x.status==='Approved'&&x.visit==='On-going'&&x.ref!==a.ref).length;
  const opt=d=>`<option value="${d.id}" ${sel===d.id?'selected':''}>${esc(d.name)}${busy(d)?` · ${busy(d)} patient${busy(d)>1?'s':''} on-going`:''}</option>`;
  const on=all.filter(d=>duty.includes(d.id)),off=all.filter(d=>!duty.includes(d.id)&&dentAt(d,a.branchId));
  return `<option value="">Choose a dentist…</option>${on.length?`<optgroup label="On duty at ${fmtT(a.time)}">${on.map(opt).join('')}</optgroup>`:''}${off.length?`<optgroup label="Other dentists at this branch (not on duty then)">${off.map(opt).join('')}</optgroup>`:''}`;
}

/* ---------- completion: next visit + procedure ---------- */
let NX=null;
const NEXT_DAYS={general:180,ortho:30,cosmetic:14,prostho:14,surgery:7,laser:14,implants:90};
function openComplete(ref,only){const a=apptBy(ref);NX={ref,only:!!only,mode:a.next?'sched':'none',date:(a.next&&a.next.date)||addDays(TODAY,NEXT_DAYS[a.service]||14),svc:(a.next&&a.next.service)||(a.service==='other'?'general':a.service),time:(a.next&&a.next.time)||'',reserve:false,dent:a.dentistId||''};drawComplete(true)}
function ncRead(){const g=id=>{const e=$('#'+id);return e?e.value:undefined};const d=g('nc_dn');if(d!==undefined)NX.dent=d;if(g('nc_dt'))NX.date=g('nc_dt');if(g('nc_sv'))NX.svc=g('nc_sv');const t=g('nc_tm');if(t!==undefined)NX.time=t;const r=$('#nc_res');if(r)NX.reserve=r.checked&&!!NX.time}
function drawComplete(first){
  const a=apptBy(NX.ref);const needDent=!NX.only&&!a.dentistId;const p=uById(a.patientId);
  const slots=NX.mode==='sched'&&NX.date?staffSlots(NX.date,a.branchId).filter(x=>x.used<x.cap):[];if(NX.time&&!slots.some(x=>x.time===NX.time))NX.time='';
  const html=`<div class="mform">${NX.only?`<p>Set the next visit for <b>${esc(p?.name||'')}</b>.</p>`:`<div class="note" style="background:var(--ok-bg);color:#155F3E"><svg class="ic"><use href="#i-check"/></svg><span>Completing the visit of <b>${esc(p?.name||'')}</b> · ${esc(svcName(a.service))}. The next question helps the clinic follow up.</span></div>`}
  ${needDent?`<div class="field"><label for="nc_dn">Dentist who treated the patient</label><select class="inp" id="nc_dn">${dentOptions(a,NX.dent)}</select></div>`:''}
  <div><b style="font-size:.92rem">When is the next visit?</b><div class="chipset" style="margin-top:8px"><label class="chk2"><input type="radio" name="nc_m" value="none" data-act="nc-mode" ${NX.mode==='none'?'checked':''}>No follow-up needed</label><label class="chk2"><input type="radio" name="nc_m" value="sched" data-act="nc-mode" ${NX.mode==='sched'?'checked':''}>Recommend a next visit</label></div></div>
  ${NX.mode==='sched'?`<div class="form-grid"><div class="field"><label for="nc_dt">Date of the next visit</label><input class="inp" type="date" id="nc_dt" min="${addDays(TODAY,1)}" value="${NX.date}" data-act="nc-upd"></div><div class="field"><label for="nc_sv">What procedure?</label><select class="inp" id="nc_sv" data-act="nc-upd">${S.services.filter(s=>s.active!==false).map(s=>`<option value="${s.id}" ${NX.svc===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}<option value="other" ${NX.svc==='other'?'selected':''}>Consultation / not sure yet</option></select></div>
   <div class="field full"><label for="nc_tm">Preferred time <span class="hint">(optional)</span></label><select class="inp" id="nc_tm" data-act="nc-upd"><option value="">Time to be set later</option>${slots.map(x=>`<option value="${x.time}" ${NX.time===x.time?'selected':''}>${fmtT(x.time)} · ${x.used}/${x.cap} booked</option>`).join('')}</select>${NX.date&&!slots.length?'<div class="hint">No open slots that day. Pick another date, or leave the time for later.</div>':''}</div>
   <label class="chk2 full" style="justify-self:start"><input type="checkbox" id="nc_res" data-act="nc-upd" ${NX.reserve?'checked':''} ${NX.time?'':'disabled'}>Also reserve this slot now (creates an approved appointment)</label></div><p class="hint">The patient gets a "next visit" email if they have an email address.</p>`:''}
  <div class="err" id="ncErr"></div>
  <div class="foot"><button class="btn btn-o" data-act="close-modal">Back</button><button class="btn btn-p" data-act="nc-go">${NX.only?'Save next visit':'Complete visit'}</button></div></div>`;
  if(first)openModal(NX.only?'Next visit':'Visit completed',html,true);else $('#mbody').innerHTML=html;
}

/* ---------- manual appointments (walk-in, phone, Facebook) ---------- */
let MF=null;
const ptLabel=u=>`${u.name} · ${u.phone}`;
function createAppt(o){const a={ref:nextRef(o.date),patientId:o.patientId,service:o.service,dentistId:o.dentistId||'',branchId:o.branchId,date:o.date,time:o.time,dur:o.dur||svcDur(o.service),durSet:true,status:'Approved',visit:'Scheduled',source:o.source||'Walk-in',notes:o.notes||'',created:nowIso(),sample:false,reason:'',history:[]};
  if(o.followUpOf)a.followUpOf=o.followUpOf;
  logH(a,`Added by ${curStaff().name} (${a.source})`);logH(a,`Approved · ${fmtDur(a.dur)} allotted (${fmtRange(a)})`);S.appts.unshift(a);return a}
function manualForm(pre={}){
  const br=myBranches().filter(b=>b.status==='active');if(!br.length){toast('No active branch available');return}
  const u=pre.patientId?uById(pre.patientId):null;
  MF={mode:'existing',pt:u?u.id:'',ptText:u?ptLabel(u):'',name:'',phone:'',email:'',branch:pre.branch||(br.some(b=>b.id===aBranch)?aBranch:br[0].id),service:pre.service||'',dentist:'',date:pre.date&&pre.date>=TODAY?pre.date:(calState.sel>=TODAY?calState.sel:TODAY),time:pre.time||'',dur:null,source:pre.source||'Walk-in',notes:pre.notes||'',mail:true,over:false,followUpOf:pre.followUpOf||''};
  drawManual(true);
}
function mfRead(){const g=id=>{const e=$('#'+id);return e?e.value:undefined};
  const set=(k,id,fn)=>{const v=g(id);if(v!==undefined)MF[k]=fn?fn(v):v};
  set('branch','mf_br');set('service','mf_sv');set('dentist','mf_dn');set('date','mf_dt');set('time','mf_tm');set('dur','mf_du',v=>+v||null);set('source','mf_sr');set('notes','mf_nt');set('name','mf_nm');set('phone','mf_ph');set('email','mf_em');
  const pt=g('mf_pt');if(pt!==undefined){MF.ptText=pt;const u=S.users.find(x=>ptLabel(x)===pt);MF.pt=u?u.id:''}
  const m=$('#mf_mail');if(m)MF.mail=m.checked;const o=$('#mf_over');if(o)MF.over=o.checked}
function drawManual(first){
  const br=myBranches().filter(b=>b.status==='active');const svcs=svcsAt(MF.branch);
  if(MF.service&&MF.service!=='other'&&!svcs.some(s=>s.id===MF.service))MF.service='';
  if(MF.service&&MF.dur==null)MF.dur=svcDur(MF.service);
  const duty=MF.date?[...new Map(dentsOnDuty(MF.branch,MF.date).map(d=>[d.id,d])).values()]:[];if(MF.dentist&&!duty.some(d=>d.id===MF.dentist))MF.dentist='';
  const sl=MF.date?staffSlots(MF.date,MF.branch):[];if(MF.time&&!sl.some(x=>x.time===MF.time))MF.time='';
  const dur=MF.dur||svcDur(MF.service||'other');const fit=MF.time?fitsDur({branchId:MF.branch,date:MF.date,time:MF.time,ref:'__new'},dur):{ok:true};
  const b=bById(MF.branch);const day=MF.date?parse(MF.date):null;
  const html=`<div class="mform"><div><b style="font-size:.92rem">Patient</b><div class="chipset" style="margin-top:8px"><label class="chk2"><input type="radio" name="mf_m" value="existing" data-act="mf-mode" ${MF.mode==='existing'?'checked':''}>Existing patient</label><label class="chk2"><input type="radio" name="mf_m" value="new" data-act="mf-mode" ${MF.mode==='new'?'checked':''}>New patient (no account needed)</label></div></div>
  ${MF.mode==='existing'?`<div class="field"><label for="mf_pt">Find patient</label><input class="inp" id="mf_pt" list="mf_pts" autocomplete="off" placeholder="Type a name or mobile number, then pick from the list" value="${esc(MF.ptText)}"><datalist id="mf_pts">${S.users.map(u=>`<option value="${esc(ptLabel(u))}"></option>`).join('')}</datalist></div>`
  :`<div class="form-grid"><div class="field full"><label for="mf_nm">Full name <span class="req">*</span></label><input class="inp" id="mf_nm" value="${esc(MF.name)}" autocomplete="off"></div><div class="field"><label for="mf_ph">Mobile <span class="req">*</span></label><input class="inp" id="mf_ph" inputmode="tel" placeholder="09XX XXX XXXX" value="${esc(MF.phone)}"></div><div class="field"><label for="mf_em">Email <span class="hint">(optional)</span></label><input class="inp" id="mf_em" type="email" value="${esc(MF.email)}"></div></div>`}
  <div><b style="font-size:.92rem">Appointment</b></div>
  <div class="form-grid">${br.length>1?`<div class="field"><label for="mf_br">Branch</label><select class="inp" id="mf_br" data-act="mf-upd">${br.map(x=>`<option value="${x.id}" ${MF.branch===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>`:''}
   <div class="field"><label for="mf_sv">Service <span class="req">*</span></label><select class="inp" id="mf_sv" data-act="mf-upd"><option value="">Choose a service…</option>${svcs.map(s=>`<option value="${s.id}" ${MF.service===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}<option value="other" ${MF.service==='other'?'selected':''}>Not sure / consultation</option></select></div>
   <div class="field"><label for="mf_dt">Date <span class="req">*</span></label><input class="inp" type="date" id="mf_dt" min="${TODAY}" value="${MF.date}" data-act="mf-upd">${day&&!sl.length?`<div class="hint" style="color:var(--bad)">${b.hours[day.getDay()].on?'No dentist is scheduled that day.':esc(b.short)+' is closed that day.'}</div>`:''}</div>
   <div class="field"><label for="mf_tm">Start time <span class="req">*</span></label><select class="inp" id="mf_tm" data-act="mf-upd"><option value="">Choose a time…</option>${sl.map(x=>`<option value="${x.time}" ${MF.time===x.time?'selected':''}>${fmtT(x.time)} · ${x.used}/${x.cap} booked${x.used>=x.cap?' · FULL':''}</option>`).join('')}</select></div>
   <div class="field"><label for="mf_du">Time allotted</label><select class="inp" id="mf_du" data-act="mf-upd">${DUR_OPTS.map(n=>`<option value="${n}" ${n===dur?'selected':''}>${fmtDur(n)}</option>`).join('')}</select></div>
   <div class="field"><label for="mf_dn">Dentist <span class="hint">(optional)</span></label><select class="inp" id="mf_dn" data-act="mf-upd"><option value="">Assign later (when the patient arrives)</option>${duty.map(d=>`<option value="${d.id}" ${MF.dentist===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div>
   <div class="field"><label for="mf_sr">Booked via</label><select class="inp" id="mf_sr">${SOURCES.map(s=>`<option ${MF.source===s?'selected':''}>${s}</option>`).join('')}</select></div>
   <div class="field full"><label for="mf_nt">Notes <span class="hint">(optional)</span></label><textarea class="inp" id="mf_nt" placeholder="Reason for the visit, special requests…">${esc(MF.notes)}</textarea></div></div>
  ${fit.ok?'':`<div class="note" style="background:var(--warn-bg);color:#6F4500"><svg class="ic"><use href="#i-bell"/></svg><span><b>${esc(fit.why)}.</b>${fit.hard?' Choose a shorter time or an earlier start.':`<br><label class="chk2" style="margin-top:8px"><input type="checkbox" id="mf_over" ${MF.over?'checked':''}> Allow booking over the limit (staff override)</label>`}</span></div>`}
  <label class="chk2" style="justify-self:start"><input type="checkbox" id="mf_mail" ${MF.mail?'checked':''}> Email the confirmation (only if the patient has an email)</label>
  <div class="err" id="mfErr"></div>
  <div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="mf-save">${ic('check')}Add appointment</button></div></div>`;
  if(first)openModal('New appointment',html,true);else $('#mbody').innerHTML=html;
}

/* ---------- actions ---------- */
Object.assign(ACT,{
 'a-approve':guard(el=>openApprove(el.dataset.ref)),
 'a-edur':guard(el=>openApprove(el.dataset.ref,true)),
 'ap-dur':el=>{apRead();AP.dur=+el.value;drawApprove()},
 'ap-go':guard(()=>{apRead();const a=apptBy(AP.ref);const fit=fitsDur(a,AP.dur);if(!fit.ok){drawApprove();return}
   a.dur=AP.dur;a.durSet=true;if(AP.dent)a.dentistId=AP.dent;
   if(AP.edit){logH(a,`Time allotted set to ${fmtDur(a.dur)} (${fmtRange(a)})`);toast('Time allotted updated')}
   else{a.status='Approved';a.visit='Scheduled';logH(a,`Approved by clinic · ${fmtDur(a.dur)} allotted (${fmtRange(a)})`);notify('approved',a);toast('Approved. Email sent to patient.')}
   closeModal();afterChange(a.ref)}),
 'a-reject':guard(el=>openModal('Reject request',`<div style="padding:22px;display:grid;gap:14px"><div class="field"><label for="rjR">Reason (shown to the patient)</label><textarea class="inp" id="rjR" placeholder="e.g. The dentist is unavailable at this time. Please pick another slot."></textarea></div><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-o" data-act="close-modal">Back</button><button class="btn btn-p" style="background:var(--bad)" data-act="a-reject-go" data-ref="${el.dataset.ref}">Reject &amp; email patient</button></div></div>`)),
 'a-reject-go':guard(el=>{const a=apptBy(el.dataset.ref);a.status='Rejected';a.reason=($('#rjR').value||'').trim()||'The requested time is not available.';logH(a,'Rejected by clinic: '+a.reason);notify('rejected',a);closeModal();afterChange(a.ref);toast('Rejected. Email sent to patient.')}),
 'a-resched':guard(el=>openReschedModal(el.dataset.ref)),
 'rs-time':el=>{CAL.rs.time=el.dataset.time;drawResched()},
 'rs-confirm':guard(()=>{const c=CAL.rs,a=apptBy(c.ref);if(slotPast(c.sel,c.time)){toast('That time has already passed today.');return}const f=fitsDur({...a,date:c.sel,time:c.time},apptDur(a));if(!f.ok){toast(f.why);return}
   a.date=c.sel;a.time=c.time;
   if(a.dentistId&&!dentsOnDuty(a.branchId,a.date,mins(a.time)).some(d=>d.id===a.dentistId)){const nm=dentName(a);a.dentistId='';logH(a,`${nm} is not on duty at the new time. Dentist unassigned`)}
   if(a.status==='Pending'){a.durSet=true}
   a.status='Approved';a.visit='Scheduled';logH(a,`Rescheduled by clinic to ${fmtD(c.sel)} ${fmtRange(a)}`);notify('rescheduled',a);closeModal();afterChange(a.ref);toast('Rescheduled. Email sent to patient.')}),
 'a-status':guard(el=>{const a=apptBy(el.dataset.ref);a.status=el.dataset.s;logH(a,`Marked ${el.dataset.s.toLowerCase()} by staff`);afterChange(a.ref);toast('Status updated. Saved to patient history.')}),
 'a-cancel':guard(el=>{const a=apptBy(el.dataset.ref);a.status='Cancelled';logH(a,'Cancelled by clinic');notify('cancelled',a);afterChange(a.ref);toast('Cancelled. Email sent to patient.')}),
 'a-remind':guard(el=>{const a=apptBy(el.dataset.ref);logH(a,'Reminder email sent');notify('reminder',a);afterChange(a.ref);toast('Reminder sent')}),
 /* assign a dentist (before the visit) */
 'a-assign':guard(el=>{const a=apptBy(el.dataset.ref);openModal('Assign dentist',`<div class="mform"><p>Choose a dentist for <b>${esc(patName(a))}</b> on ${fmtD(a.date)}, ${fmtT(a.time)}.</p><div class="field"><label for="as_dn">Dentist</label><select class="inp" id="as_dn">${dentOptions(a,a.dentistId)}</select><div class="err" id="asErr"></div></div><div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="as-go" data-ref="${a.ref}">Assign</button></div></div>`)}),
 'as-go':guard(el=>{const a=apptBy(el.dataset.ref),v=$('#as_dn').value;if(!v){$('#asErr').textContent='Choose a dentist';return}a.dentistId=v;logH(a,`Dentist assigned: ${dentName(a)}`);closeModal();afterChange(a.ref);toast('Dentist assigned')}),
 /* visit progress */
 'v-arrive':guard(el=>{const a=apptBy(el.dataset.ref);const late=a.date===TODAY?nowMin()-mins(a.time):0;a.visit='Arrived';a.arrivedAt=nowIso();logH(a,'Patient arrived'+(late>=15?` (${late} min after the scheduled time)`:''));afterChange(a.ref);toast('Marked as arrived')}),
 'v-late':guard(el=>{const a=apptBy(el.dataset.ref);a.visit='Late';logH(a,'Marked late by staff');afterChange(a.ref);toast('Marked as late')}),
 'v-start':guard(el=>{const a=apptBy(el.dataset.ref);openModal('Start treatment',`<div class="mform"><p><b>${esc(patName(a))}</b> is in the clinic. Choose the dentist who will treat them. The status changes to <span class="pill s-Ongoing">On-going</span>.</p><div class="field"><label for="st_dn">Dentist</label><select class="inp" id="st_dn">${dentOptions(a,a.dentistId)}</select><div class="err" id="stErr"></div></div><div class="foot"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="v-start-go" data-ref="${a.ref}">Start treatment</button></div></div>`)}),
 'v-start-go':guard(el=>{const a=apptBy(el.dataset.ref),v=$('#st_dn').value;if(!v){$('#stErr').textContent='Choose the dentist who will treat the patient';return}a.dentistId=v;a.visit='On-going';a.startedAt=nowIso();logH(a,'Treatment started with '+dentName(a));closeModal();afterChange(a.ref);toast('Treatment started with '+dentName(a))}),
 'v-done':guard(el=>openComplete(el.dataset.ref,false)),
 'v-next':guard(el=>openComplete(el.dataset.ref,true)),
 'v-booknext':guard(el=>{const a=apptBy(el.dataset.ref);closeDrawer();manualForm({patientId:a.patientId,branch:a.branchId,service:a.next.service,date:a.next.date,time:a.next.time,source:'Follow-up',followUpOf:a.ref,notes:'Follow-up of '+a.ref})}),
 'nc-mode':el=>{ncRead();NX.mode=el.value;drawComplete()},
 'nc-upd':el=>{ncRead();if(el.id==='nc_dt')NX.time='';drawComplete()},
 'nc-go':guard(()=>{ncRead();const a=apptBy(NX.ref),err=$('#ncErr');
   if(!NX.only&&!a.dentistId&&!NX.dent){err.textContent='Choose the dentist who treated the patient.';return}
   if(NX.mode==='sched'&&(!NX.date||NX.date<=TODAY)){err.textContent='Choose a date after today for the next visit.';return}
   let follow=null;
   if(NX.mode==='sched'&&NX.reserve&&NX.time){const f=fitsDur({branchId:a.branchId,date:NX.date,time:NX.time,ref:'__new'},svcDur(NX.svc));if(!f.ok){err.textContent=f.why+'. Pick another time or leave the time for later.';return}}
   if(!NX.only){if(!a.dentistId)a.dentistId=NX.dent;a.status='Completed';a.visit='Completed';a.doneAt=nowIso();logH(a,'Visit completed')}
   if(NX.mode==='sched'){a.next={date:NX.date,service:NX.svc,time:NX.time||''};logH(a,`Next visit recommended: ${svcName(NX.svc)} around ${fmtD(NX.date)}`);
     if(NX.reserve&&NX.time){follow=createAppt({patientId:a.patientId,branchId:a.branchId,service:NX.svc,date:NX.date,time:NX.time,source:'Follow-up',notes:'Follow-up of '+a.ref,followUpOf:a.ref});a.next.ref=follow.ref}
     notify('nextvisit',a)}
   else if(NX.only&&a.next){delete a.next;logH(a,'Next visit recommendation removed')}
   closeModal();afterChange(a.ref);toast(NX.only?'Next visit saved':(NX.mode==='sched'?'Visit completed. Next visit recorded'+(uById(a.patientId)?.email?' and emailed.':'.'):'Visit completed. Saved to patient history.'))}),
 /* manual appointments */
 'mf-open':guard(el=>{closeDrawer();manualForm({date:el.dataset.date,patientId:el.dataset.pt})}),
 'mf-mode':el=>{mfRead();MF.mode=el.value;drawManual()},
 'mf-upd':el=>{mfRead();if(el.id==='mf_sv')MF.dur=null;if(el.id==='mf_br'){MF.time='';MF.dentist=''}if(el.id==='mf_dt'||el.id==='mf_du'){if(el.id==='mf_dt')MF.time=''}drawManual()},
 'mf-save':guard(()=>{mfRead();const err=$('#mfErr');const E=m=>{err.textContent=m;err.scrollIntoView({block:'nearest'})};let pid=MF.pt,nm='',ph='',em='';
   if(MF.mode==='existing'){if(!pid)return E('Choose an existing patient from the list, or switch to “New patient”.')}
   else{nm=(MF.name||'').trim();ph=(MF.phone||'').trim();em=(MF.email||'').trim().toLowerCase();
     if(!nm)return E('Enter the patient’s name.');if(!okPhone(ph))return E('Enter a valid PH mobile number (09XX XXX XXXX).');if(em&&!okMail(em))return E('Enter a valid email address, or leave it blank.');
     const last=ph.replace(/\D/g,'').slice(-10),dup=S.users.find(u=>u.phone.replace(/\D/g,'').slice(-10)===last);if(dup)return E(`${dup.name} already uses this mobile number. Choose them under “Existing patient”.`);}
   if(!MF.service)return E('Choose the service.');if(!MF.date)return E('Choose the date.');if(!MF.time)return E('Choose a start time.');
   const dur=MF.dur||svcDur(MF.service);const f=fitsDur({branchId:MF.branch,date:MF.date,time:MF.time,ref:'__new'},dur);
   if(!f.ok&&(f.hard||!MF.over))return E(f.hard?f.why+'.':f.why+'. Tick “Allow booking over the limit” to book anyway.');
   if(MF.mode==='new'){const u={id:'u'+Date.now(),name:nm,email:em,phone:ph,pw:null,walkin:true,sample:false,created:nowIso()};S.users.push(u);pid=u.id}
   const a=createAppt({patientId:pid,branchId:MF.branch,service:MF.service,dentistId:MF.dentist,date:MF.date,time:MF.time,dur,source:MF.source,notes:(MF.notes||'').trim(),followUpOf:MF.followUpOf});
   if(!f.ok)logH(a,'Booked over the per-slot limit (staff override)');
   const sent=MF.mail&&uById(pid)?.email;if(sent)pushMail('approved',a);
   if(MF.followUpOf){const src=apptBy(MF.followUpOf);if(src&&src.next)src.next.ref=a.ref}
   calState.sel=a.date;const pd=parse(a.date);calState.y=pd.getFullYear();calState.m=pd.getMonth();save();closeModal();drawAdmin();openAppt(a.ref);toast(`Appointment added for ${fmtD(a.date)}, ${fmtT(a.time)}${sent?'. Confirmation emailed.':'.'}`)})
});
