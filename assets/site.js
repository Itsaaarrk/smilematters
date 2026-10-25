/* =========================================================
   PUBLIC SITE + PATIENT PORTAL
========================================================= */
let bk=null,ptTab='overview',authMode='login',apptFilter='upcoming',afterAuth=null,mapBranch=null,pendingScroll=null;
const me=()=>S.sess?uById(S.sess):null;

/* =========================================================
   DYNAMIC (branch / service driven) RENDERING
========================================================= */
function branchCardHTML(b,opts={}){
  return `<div class="card branch"><h3><svg class="ic" style="color:var(--p600)"><use href="#i-pin"/></svg>${esc(b.name)} ${b.main?'<span class="tag">Main branch</span>':''}${b.status==='soon'?'<span class="tag soon">Coming soon</span>':''}</h3>
  <div class="row">${ic('pin')}<span>${esc(b.address)}${b.landmark?`<br><small>Landmark: ${esc(b.landmark)}</small>`:''}</span></div>
  <div class="row">${ic('phone')}<span><a href="tel:${esc(b.phone.replace(/[^+\d]/g,''))}"><b>${esc(b.phone)}</b></a>${b.phone2?'<br>'+esc(b.phone2):''}</span></div>
  ${opts.mail&&b.email?`<div class="row">${ic('mail')}<a href="mailto:${esc(b.email)}">${esc(b.email)}</a></div>`:''}
  <div class="row">${ic('clock')}<span>${esc(hoursText(b))}</span></div>
  ${b.status==='active'?`<a class="btn btn-p btn-sm" href="#/book" data-branch-book="${b.id}" style="justify-self:start">${ic('cal')}Book at ${esc(b.short)}</a>`:''}</div>`;
}
const O=sel=>$(sel)||{};
function renderDynamic(){
  const act=activeBranches(),mb=mainBranch();
  // top bar
  $('#topLeft').innerHTML=`${ic('pin')}${act.length>1?act.map(b=>esc(b.short)).join(' · ')+' <b style="color:#fff">· Book online at any branch</b>':esc(mb.address.split(',').slice(0,2).join(','))+' · <b style="color:#fff">'+esc(mb.landmark||'')+'</b>'}`;
  $('#topMid').innerHTML=`${ic('clock')}<span>${esc(hoursText(mb))}</span>`;
  $('#topPhone').innerHTML=`${ic('phone')}${esc(mb.phone)}${mb.phone2?' · '+esc(mb.phone2):''}`;$('#topPhone').href='tel:'+mb.phone.replace(/[^+\d]/g,'');$('#mbCall').href=$('#topPhone').href;
  // hero
  const nm=act.map(b=>b.short);const lst=nm.length>2?nm.slice(0,-1).join(', ')+' & '+nm[nm.length-1]:nm.join(' & ');O('#heroEyebrow').textContent='Dental clinics in '+(nm.length?lst:'Metro Manila');
  O('#heroHours').innerHTML=`${esc(hoursText(mb).split(' · ')[1]||'')}<small>${esc(hoursText(mb).split(' · ')[0]||'')}</small>`;
  // stats
  O('#statsRow').innerHTML=`<div><b>${act.length}</b><span>Branches in Metro Manila</span></div><div><b>100%</b><span>recommend us (13 Facebook reviews)</span></div><div><b>11K+</b><span>Facebook followers across our pages</span></div><div><b>HMO</b><span>accepted for selected procedures</span></div>`;
  // services
  const sv=S.services.filter(s=>s.active!==false);
  O('#homeServices').innerHTML=sv.map(s=>`<a class="lx-svc ${s.hl?'hl':''}" href="#/services" data-svc="${s.id}"><div class="lx-svc-img${s.img&&s.img.includes('result-')?' contain':''}">${s.img?`<img src="${s.img}" alt="">`:''}${s.hl?'<span class="lx-tag">Popular</span>':''}</div><div class="lx-svc-body"><span class="lx-svc-ic">${ic(s.icon)}</span><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><span class="more">Learn more ${ic('arrow')}</span></div></a>`).join('');
  $('#footSvc').innerHTML=sv.slice(0,6).map(s=>`<li><a href="#/services" data-svc="${s.id}">${esc(s.name)}</a></li>`).join('');
  $('#svcFilters').innerHTML='<button class="chip on" data-f="all">All</button>'+sv.map(s=>`<button class="chip" data-f="${s.id}">${esc(s.name)}</button>`).join('');
  $('#svcList').innerHTML=sv.map(s=>`<article class="sv" id="svc-${s.id}" data-id="${s.id}"><div class="sv-l">${s.img?`<img class="simg${s.img.includes('result-')?' contain':''}" src="${s.img}" alt="${esc(s.name)} at Smile Matters Dental" loading="lazy">`:`<div class="ph"><div>${ic(s.icon)}Service photo<small>${esc(s.name)}</small></div></div>`}</div><div><span class="eyebrow">Service</span><h3>${esc(s.name)}</h3><p style="color:var(--muted)">${esc(s.short)}</p>${s.for?`<div class="for"><b>Great for:</b> ${esc(s.for)}</div>`:''}<ul class="inc">${(s.inc||[]).map(i=>`<li>${ic('check')}<span>${esc(i)}</span></li>`).join('')}</ul>${s.branches!=='all'&&multi()?`<p class="hint" style="margin-top:12px">Available at: ${(s.branches||[]).map(id=>bChip(id)).join(' ')}</p>`:''}${s.note?`<p style="margin:16px 0;font-size:.9rem;color:var(--p800);font-weight:600">${esc(s.note)}</p>`:''}<a class="btn btn-p" href="#/book" data-svc-book="${s.id}">${ic('cal')}Book ${esc(s.name)}</a></div></article>`).join('');
  O('#testi').innerHTML=[
 {n:'Ela R.',t:'“Smile Matters is CONSISTENT and EXPERT in both simple and complex procedures. I commend Doc Cy\u2019s setting of expectations and the mini lecture he gives to educate his patients. Professional, knowledgeable, hygienic, and I appreciate their payment options.”',s:'Facebook review · Pasig'},
 {n:'Nei-Nei D.',t:'“Odontectomy for my impacted wisdom tooth done. Thank you Doc Jen, no pain akong naramdaman, super gaan ng kamay. Super bait ng staff. Highly recommend this clinic.”',s:'Facebook review · Pasig'},
 {n:'Arvie A.',t:'“Doc Xy gave me the most reasonable solution for my wisdom tooth. He explained everything before, during and after the procedure. It was quick and easy, and I did not feel any pain.”',s:'Facebook review · Marikina'},
 {n:'Jazel Z.',t:'“My first tooth extraction, and they always set my expectations and educated me before any procedure. I expected it to be traumatizing, but it turned out to be a stress-free first time.”',s:'Facebook review · Pasig'},
 {n:'Justinne B.',t:'“Superb service by Dr. Xyruz Reyes. The new clinic looks great, everything is new and clean, the staff are welcoming and PPE is provided.”',s:'Facebook review · Pasig'},
 {n:'Jay C.',t:'“I came from the United States and was worried about choosing the right dentist. The staff treat you well, and the dentist is very patient to make sure the work is exactly what you want.”',s:'Facebook review · Pasig'}].map(t=>`<div class="card quote"><div class="stars">${ic('star').repeat(5)}</div><p>${t.t}</p><div class="who"><span class="av">P</span><div><b>${t.n}</b><br><span style="color:var(--muted)">${t.s}</span></div></div>${t.sample?'<span class="sample">SAMPLE. Replace with a real review (with consent)</span>':'<span class="sample" style="background:var(--ok-bg);color:var(--ok)">FROM THE FACEBOOK PAGE</span>'}</div>`).join('');
  // quick form
  const qs=$('#qs'),qb=$('#qb');const qv=qs.value,qbv=qb.value;
  qs.innerHTML=sv.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')+'<option value="other">Not sure / other</option>';if(qv)qs.value=qv;
  qb.innerHTML=act.map(b=>`<option value="${b.id}">${esc(b.short)}${act.length>1?' · '+esc(b.name):''}</option>`).join('');if(qbv)qb.value=qbv;
  $('#qbWrap').hidden=act.length<2;$('#qd').min=TODAY;
  // branches on home
  O('#branchesH').textContent=act.length>1?`${act.length} branches, one standard of care`:'Visit our clinic';
  O('#branchesP').textContent=act.length>1?'Book at the branch that is closest to you. Your patient account works at every branch.':'';
  O('#homeBranches').innerHTML=S.branches.filter(b=>b.status!=='inactive').map(b=>branchCardHTML(b)).join('');
  // footer visit
  $('#footVisit').innerHTML=S.branches.filter(b=>b.status!=='inactive').map(b=>`<li><b style="color:#fff">${esc(b.short)}</b><br>${esc(b.address)}<br>${esc(b.phone)}<br><span style="color:#A9BDCC">${esc(hoursText(b))}</span></li>`).join('')+`<li>${esc(mb.email||'')}</li>`;
  // team
  O('#teamGrid').innerHTML=S.dents.filter(d=>d.active!==false).map(d=>`<div class="person"><div class="ph"><div>${ic('user')}Portrait photo</div></div><div class="info"><h3><span class="tbc">${esc(d.name)}</span></h3><div class="role">${esc(d.role)}</div>${multi()?`<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${S.branches.filter(b=>dentAt(d,b.id)).map(b=>bChip(b.id)).join('')}</div>`:''}<p style="color:var(--muted);font-size:.9rem;margin-top:8px"><span class="tbc">Short bio and credentials</span></p></div></div>`).join('');
  // contact
  const vis=S.branches.filter(b=>b.status!=='inactive');
  $('#contactBranches').innerHTML=vis.map(b=>branchCardHTML(b,{mail:true})).join('');
  $('#contactLead').textContent=act.length>1?'Have a question before you book? Send us a message, or find us at any of our branches.':'Have a question before you book? Send us a message, or visit us at the clinic.';
  if(!mapBranch||!bById(mapBranch)||bById(mapBranch).status==='inactive')mapBranch=vis[0]?.id;
  $('#mapChips').innerHTML=vis.map(b=>`<button class="chip ${b.id===mapBranch?'on':''}" data-act="map-branch" data-id="${b.id}" type="button">${esc(b.short)}</button>`).join('');$('#mapChips').hidden=vis.length<2;
  setMap();
  $('#m_brWrap').hidden=vis.length<2;$('#m_br').innerHTML='<option value="">Any / not sure</option>'+vis.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('');
  updatePortalBtn();
  window.renderLanding&&renderLanding();
}
function setMap(){const b=bById(mapBranch);if(!b)return;$('#mapFrame').src='https://www.google.com/maps?q='+encodeURIComponent(b.map||b.address)+'&output=embed';$('#mapAddr').textContent=b.name+': '+b.address;$('#mapDir').href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(b.map||b.address)}

/* =========================================================
   ROUTER
========================================================= */
const PAGES={home:'Smile Matters Dental | Book Online in Pasig, Marikina & Caloocan',about:'About Us | Smile Matters Dental',services:'Dental Services | Veneers, Braces, Oral Surgery & More | Smile Matters',book:'Book an Appointment Online | Smile Matters Dental',portal:'Patient Portal | Smile Matters Dental',contact:'Contact & Location | Smile Matters Dental'};
function route(){
  let r=(location.hash.replace('#/','')||'home').split('?')[0];if(!PAGES[r])r='home';
  $$('[data-page]').forEach(p=>p.hidden=p.dataset.page!==r);
  $$('nav.links a.l').forEach(a=>a.classList.toggle('on',a.dataset.r===r));
  $('#portalBtn').classList.toggle('on',r==='portal');
  document.title=PAGES[r];$('#links').classList.remove('open');$('#burger').setAttribute('aria-expanded','false');
  closeDrawer();closeModal();renderDynamic();
  if(r==='book'){if(bk&&bk.done)bk=null;renderBook()}
  if(r==='portal')renderPortal();
  if(pendingScroll){const id=pendingScroll;pendingScroll=null;setTimeout(()=>{const el=$('#svc-'+id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},60)}else window.scrollTo(0,0);
}
function updatePortalBtn(){const u=me();$('#portalBtnT').textContent=u?u.name.split(' ')[0]+"'s portal":'Patient Portal'}
addEventListener('hashchange',route);
$('#burger').onclick=()=>{const o=$('#links').classList.toggle('open');$('#burger').setAttribute('aria-expanded',o)};
$('#notesToggle').onchange=e=>document.body.classList.toggle('notes',e.target.checked);
const go=h=>{if(location.hash==='#/'+h)route();else location.hash='#/'+h};
window.onReset=()=>{bk=null;mapBranch=null;route()};
window.onDataChanged=()=>{const r=(location.hash.replace('#/','')||'home').split('?')[0];renderDynamic();if(r==='book')renderBook();if(r==='portal')renderPortal()};

$('#quickForm').onsubmit=e=>{e.preventDefault();bk=newBk();bk.service=$('#qs').value;if(!$('#qbWrap').hidden)bk.branch=$('#qb').value;bk.step=bk.branch?2:1;
  if(bk.step===2&&$('#qd').value&&hasAvail($('#qd').value,bk.branch,'any')){bk.date=$('#qd').value;calInit('bk',bk.date)}go('book')};

/* =========================================================
   BOOKING WIZARD
========================================================= */
const newBk=()=>{delete CAL.bk;const a=activeBranches();return {step:1,branch:a.length===1?a[0].id:'',service:'',dentist:'any',date:'',time:'',notes:'',rs:null,done:null}};
const gateHTML=()=>`<div class="card gate" style="padding:38px"><div class="ok">${ic('lock')}</div><h2 style="font-size:1.7rem;margin-bottom:8px">Sign in to book</h2><p class="lead" style="margin:0 auto 22px">Create a free patient account (or sign in) so you can track your appointments and get email updates.</p><div class="cta-row" style="justify-content:center"><button class="btn btn-p" data-act="to-portal" data-mode="register">Create account</button><button class="btn btn-o" data-act="to-portal" data-mode="login">I already have an account</button></div></div>`;
const stepsBar=n=>`<div class="wz-steps">${['Branch & service','Pick date & time','Review & submit'].map((t,i)=>`<div class="wz-step ${i+1===n?'on':''} ${i+1<n?'done':''}"><b>${i+1<n?'✓':i+1}</b>${t}</div>`).join('')}</div>`;
function renderBook(){
  const root=$('#bookRoot');const u=me();if(!u){root.innerHTML=gateHTML();return}
  if(!activeBranches().length){root.innerHTML=`<div class="card gate" style="padding:38px"><h2 style="font-size:1.5rem">Online booking is unavailable</h2><p class="lead" style="margin:10px auto 0">Please call the clinic to book.</p></div>`;return}
  if(!bk)bk=newBk();
  if(bk.branch&&(!bById(bk.branch)||bById(bk.branch).status!=='active'))bk.branch='';
  $('#bookTitle').textContent=bk.rs?'Reschedule appointment':'Book an appointment';
  if(bk.done){root.innerHTML=doneHTML();return}
  let h=stepsBar(bk.step);
  if(bk.step===1){
    if(multi()){
      h+=`<h2 style="font-size:1.5rem;margin-bottom:16px">Which branch?</h2><div class="pick ${activeBranches().length>2?'three':'two'}" role="radiogroup" aria-label="Branch">`+activeBranches().map(b=>`<label><input type="radio" name="br" value="${b.id}" ${bk.branch===b.id?'checked':''} data-act="bk-branch"><span class="bhead"><b>${esc(b.name)}</b>${b.main?'<span class="tag">Main</span>':''}</span><span class="bmeta"><span>${esc(b.address)}</span><span><b>${esc(hoursText(b))}</b></span></span></label>`).join('')+`</div><div style="height:24px"></div>`;
    }
    const list=svcsAt(bk.branch||null);
    h+=`<h2 style="font-size:1.5rem;margin-bottom:16px">What do you need?</h2>`+(list.length?`<div class="pick" role="radiogroup" aria-label="Service">`+list.concat([{id:'other',icon:'msg',name:'Not sure yet',short:'Book a consultation and let the dentist advise.'}]).map(s=>`<label><input type="radio" name="svc" value="${s.id}" ${bk.service===s.id?'checked':''} data-act="bk-svc"><span class="ico">${ic(s.icon)}</span><b>${esc(s.name)}</b><small>${esc(s.short)}</small></label>`).join('')+`</div>`:`<div class="note"><svg class="ic"><use href="#i-msg"/></svg><span>No services are offered at this branch yet.</span></div>`)+`<div class="err" id="bkErr" style="margin-top:12px"></div><div class="wz-nav"><span></span><button class="btn btn-p" data-act="bk-next">Continue${ic('arrow')}</button></div>`;
  }else if(bk.step===2){
    if(!CAL.bk)calInit('bk',bk.date);autoMonth();
    const b=bById(bk.branch);
    h+=`<div class="wz-two"><div><h2 style="font-size:1.5rem;margin-bottom:16px">Pick a date</h2><div class="hours-box" style="margin-bottom:14px">${ic('pin')}<span><b>${esc(b.name)}</b><br>${esc(hoursText(b))}</span></div><div class="field" style="margin-bottom:14px"><label for="bkD">Dentist</label><select class="inp" id="bkD" data-act="bk-dent"><option value="any">Any available dentist</option>${dentsAt(b.id).map(d=>`<option value="${d.id}" ${bk.dentist===d.id?'selected':''}>${esc(d.name)} · ${esc(d.role)}</option>`).join('')}</select></div><div id="calBox">${calHTML('bk',s=>hasAvail(s,bk.branch,bk.dentist,bk.rs))}</div></div>
    <div><h2 style="font-size:1.5rem;margin-bottom:16px">Pick a time</h2><div id="slotBox">${slotsHTML()}</div></div></div><div class="err" id="bkErr" style="margin-top:12px"></div>
    <div class="wz-nav">${bk.rs?'<span></span>':'<button class="btn btn-o" data-act="bk-back">Back</button>'}<button class="btn btn-p" data-act="bk-next">Continue${ic('arrow')}</button></div>`;
  }else{
    const dn=bk.dentist==='any'?'Assigned by the clinic':(dById(bk.dentist)?.name||''),b=bById(bk.branch),sv=svcName(bk.service||'other');
    h+=`<div class="wz-two"><div><h2 style="font-size:1.5rem;margin-bottom:16px">Review your request</h2><div class="summary"><dl><dt>Patient</dt><dd>${esc(u.name)}</dd><dt>Mobile</dt><dd>${esc(u.phone)}</dd><dt>Email</dt><dd>${esc(u.email)}</dd><dt>Service</dt><dd>${esc(sv)}</dd><dt>Dentist</dt><dd>${esc(dn)}</dd><dt>Schedule</dt><dd>${fmtD(bk.date)} · starts ${fmtT(bk.time)}</dd><dt>Branch</dt><dd>${esc(b.name)}<br><small style="font-weight:500;color:var(--muted)">${esc(b.address)}</small></dd></dl></div></div>
    <div><div class="field"><label for="bkN">Anything the dentist should know? <span style="font-weight:500;color:var(--muted)">(optional)</span></label><textarea class="inp" id="bkN" placeholder="Symptoms, concerns, or questions">${esc(bk.notes)}</textarea></div>
    <div class="note" style="margin-top:16px"><svg class="ic"><use href="#i-shield"/></svg><span>Your request isn't confirmed until our staff approves it. You'll get an email either way.</span></div>
    <label class="consent" style="margin-top:16px"><input type="checkbox" id="bkC"><span>I agree to be contacted about this appointment and to the clinic storing my details. <span class="tbc">Privacy notice TBC</span></span></label><div class="err" id="bkErr"></div></div></div>
    <div class="wz-nav"><button class="btn btn-o" data-act="bk-back">Back</button><button class="btn btn-p" data-act="bk-submit">${ic('cal')}${bk.rs?'Send reschedule request':'Submit appointment request'}</button></div>`;
  }
  root.innerHTML=h;
}
function autoMonth(){const c=CAL.bk;if(!c||c.sel||c.navd)return;let d=TODAY;for(let i=0;i<=S.settings.advanceDays;i++){if(hasAvail(d,bk.branch,bk.dentist,bk.rs)){const p=parse(d);c.y=p.getFullYear();c.m=p.getMonth();return}d=addDays(d,1)}}
function slotsHTML(){
  if(!bk.date)return `<div class="note"><svg class="ic"><use href="#i-cal"/></svg><span>Select an available date to see open times.</span></div>`;
  const av=availability(bk.date,bk.branch,bk.dentist,bk.rs);
  if(!av.length)return `<div class="note"><svg class="ic"><use href="#i-clock"/></svg><span>No open times on this date. Try another day.</span></div>`;
  return `<p style="color:var(--muted);margin-bottom:12px;font-size:.92rem"><b style="color:var(--p900)">${fmtD(bk.date)}</b> · ${av.length} open time${av.length>1?'s':''}</p><div class="slots" role="radiogroup" aria-label="Time">${av.map(x=>`<button type="button" class="slot ${bk.time===x.time?'on':''}" data-act="bk-time" data-time="${x.time}" role="radio" aria-checked="${bk.time===x.time}">${fmtT(x.time)}${x.left===1?'<small>Last spot</small>':''}</button>`).join('')}</div><p class="hint" style="margin-top:12px">${bk.dentist==='any'?'Our staff will assign a dentist when you arrive. ':''}Several patients can share a time. The clinic confirms how long your visit will take when it approves your request.</p>`;
}
function doneHTML(){const a=apptBy(bk.done);const b=bById(a.branchId);
  return `<div class="card success" style="padding:36px"><div class="ok">${ic('check')}</div><h2 style="font-size:1.8rem">${bk.rs?'Reschedule request sent!':'Request submitted!'}</h2><p class="lead" style="margin:10px auto 0">Status: <span class="pill s-Pending lg">Pending approval</span></p><div class="refbox">Reference: ${esc(a.ref)}</div>
  <div class="summary" style="max-width:440px;margin:0 auto;text-align:left"><dl><dt>Service</dt><dd>${esc(svcName(a.service))}</dd><dt>Dentist</dt><dd>${a.dentistId?esc(dentName(a)):'Assigned by the clinic'}</dd><dt>Schedule</dt><dd>${fmtD(a.date)} · starts ${fmtT(a.time)}</dd><dt>Branch</dt><dd>${esc(b.name)}</dd></dl></div>
  <div class="next"><div><b>1</b><span>A confirmation email is on its way to you.</span></div><div><b>2</b><span>Our staff reviews and approves or rejects your request.</span></div><div><b>3</b><span>You get a status email. Track it in your portal anytime.</span></div></div>
  <div class="cta-row" style="justify-content:center"><button class="btn btn-o" data-act="view-mail" data-id="${S.mails.find(m=>m.ref===a.ref&&m.type==='received')?.id||''}">${ic('mail')}Preview confirmation email</button><button class="btn btn-p" data-act="to-appts">${ic('list')}My appointments</button></div></div>`}
function bkNext(){
  const err=$('#bkErr');err.textContent='';
  if(bk.step===1){if(multi()&&!bk.branch){err.textContent='Please choose a branch.';return}if(!bk.service){err.textContent='Please choose a service to continue.';return}bk.step=2;if(!CAL.bk)calInit('bk','')}
  else if(bk.step===2){if(!bk.date||!bk.time){err.textContent=!bk.date?'Please choose an available date.':'Please choose a time.';return}bk.step=3}
  renderBook();window.scrollTo({top:0,behavior:'smooth'})
}
function bkSubmit(){
  const err=$('#bkErr');bk.notes=$('#bkN').value.trim();
  if(!$('#bkC').checked){err.textContent='Please tick to allow us to contact you.';return}
  if(!availability(bk.date,bk.branch,bk.dentist,bk.rs).some(x=>x.time===bk.time)){toast('Sorry, that time was just taken. Please pick another.');bk.time='';bk.step=2;renderBook();return}
  let a;
  const dId=bk.dentist==='any'?'':bk.dentist;
  if(bk.rs){a=apptBy(bk.rs);a.date=bk.date;a.time=bk.time;a.dentistId=dId;a.status='Pending';a.visit='Scheduled';a.durSet=false;a.dur=svcDur(a.service);a.notes=bk.notes||a.notes;logH(a,`Patient requested reschedule to ${fmtD(bk.date)} ${fmtT(bk.time)}`)}
  else{a={ref:nextRef(bk.date),patientId:S.sess,service:bk.service,dentistId:dId,branchId:bk.branch,date:bk.date,time:bk.time,dur:svcDur(bk.service||'other'),durSet:false,status:'Pending',visit:'Scheduled',source:'Online',notes:bk.notes,created:new Date().toISOString(),sample:false,reason:'',history:[]};logH(a,'Booking requested by patient');S.appts.unshift(a)}
  notify('received',a);save();bk.done=a.ref;renderBook();window.scrollTo({top:0,behavior:'smooth'});
}
window.onCalChange=id=>{if(id==='bk')renderBook()};
window.onCalPick=id=>{if(id==='bk'){bk.date=CAL.bk.sel;bk.time='';renderBook()}};

/* =========================================================
   PATIENT PORTAL
========================================================= */
function renderPortal(){
  const root=$('#portalRoot'),u=me();
  if(!u){$('#portalTitle').textContent=authMode==='register'?'Create your account':'Sign in to your account';
    root.innerHTML=`<div class="card auth" style="padding:clamp(22px,3vw,36px)" data-note="Module: Patient Registration &amp; Login"><div class="tabs" style="display:flex"><button style="flex:1" class="${authMode==='login'?'on':''}" data-act="auth-mode" data-mode="login">Sign in</button><button style="flex:1" class="${authMode==='register'?'on':''}" data-act="auth-mode" data-mode="register">Create account</button></div>${authMode==='login'?loginForm():regForm()}</div>`;return}
  $('#portalTitle').textContent='Hello, '+u.name.split(' ')[0];
  const mine=S.appts.filter(a=>a.patientId===u.id);const upN=mine.filter(a=>['Pending','Approved'].includes(a.status)&&a.date>=TODAY).length;
  const nav=[['overview','home','Overview'],['appts','cal','My appointments',upN],['mail','bell','Notifications'],['profile','user','Profile']];
  root.innerHTML=`<div class="pt"><aside class="pt-nav"><div class="pt-me"><span class="av">${initials(u.name)}</span><div><b style="font-size:.92rem">${esc(u.name)}</b><small style="color:var(--muted)">${esc(u.email)}</small></div></div>${nav.map(n=>`<button class="${ptTab===n[0]?'on':''}" data-act="pt-tab" data-tab="${n[0]}">${ic(n[1])}${n[2]}${n[3]?`<span class="cnt">${n[3]}</span>`:''}</button>`).join('')}<button data-act="pt-logout">${ic('out')}Sign out</button></aside><div id="ptView" data-note="Module: Patient Appointment History"></div></div>`;
  renderPtView();
}
const loginForm=()=>`<form id="loginPt" novalidate style="margin-top:22px" class="form-grid"><div class="field full"><label for="lp_e">Email</label><input class="inp" id="lp_e" type="email" autocomplete="email" placeholder="you@email.com"><div class="err" data-e="e"></div></div><div class="field full"><label for="lp_p">Password</label><input class="inp" id="lp_p" type="password" autocomplete="current-password"><div class="err" data-e="p"></div></div><div class="full"><button class="btn btn-p" style="width:100%" type="submit">${ic('lock')}Sign in</button></div><div class="full" style="text-align:center"><button type="button" class="btn btn-o btn-sm" data-act="demo-login">Use demo account</button><p class="hint" style="margin-top:8px">Mock-up: the demo account has sample appointment history.</p></div></form>`;
const regForm=()=>`<form id="regPt" novalidate style="margin-top:22px" class="form-grid"><div class="field full"><label for="rg_n">Full name <span class="req">*</span></label><input class="inp" id="rg_n" autocomplete="name" placeholder="Juan Dela Cruz"><div class="err" data-e="n"></div></div><div class="field"><label for="rg_e">Email <span class="req">*</span></label><input class="inp" id="rg_e" type="email" autocomplete="email"><div class="err" data-e="e"></div></div><div class="field"><label for="rg_ph">Mobile <span class="req">*</span></label><input class="inp" id="rg_ph" inputmode="tel" placeholder="09XX XXX XXXX"><div class="err" data-e="ph"></div></div><div class="field"><label for="rg_p">Password <span class="req">*</span></label><input class="inp" id="rg_p" type="password" autocomplete="new-password"><div class="hint">At least 8 characters</div><div class="err" data-e="p"></div></div><div class="field"><label for="rg_p2">Confirm password <span class="req">*</span></label><input class="inp" id="rg_p2" type="password" autocomplete="new-password"><div class="err" data-e="p2"></div></div><div class="field full"><label class="consent"><input type="checkbox" id="rg_c"><span>I agree to the clinic storing my details to manage my appointments. <span class="tbc">Privacy notice TBC</span></span></label><div class="err" data-e="c"></div></div><div class="full"><button class="btn btn-p" style="width:100%" type="submit">${ic('user')}Create account</button></div></form>`;
function afterLogin(){const t=afterAuth;afterAuth=null;updatePortalBtn();if(t)go(t);else renderPortal()}
function renderPtView(){
  const u=me(),v=$('#ptView');if(!u||!v)return;const mine=S.appts.filter(a=>a.patientId===u.id).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  if(ptTab==='overview'){
    const up=mine.filter(a=>['Approved','Pending'].includes(a.status)&&a.date>=TODAY);const next=up.find(a=>a.status==='Approved')||up[0];
    const done=mine.filter(a=>a.status==='Completed').length;
    v.innerHTML=(next?`<div class="next-card"><span class="pill ${sc(stLabel(next))} lg" style="background:#fff">${stLabel(next)}</span><h3>${esc(svcName(next.service))}</h3><small>${next.dentistId?'with '+esc(dentName(next))+' · ':''}${esc(bName(next.branchId))}</small><div class="when"><div><small>Date</small>${fmtD(next.date)}</div><div><small>Time</small>${next.durSet?fmtRange(next):fmtT(next.time)}</div><div><small>Reference</small>${esc(next.ref)}</div></div><div class="ac-act"><button class="btn btn-y btn-sm" data-act="pt-resched" data-ref="${next.ref}">${ic('refresh')}Reschedule</button><button class="btn btn-sm" style="background:rgba(255,255,255,.14);color:#fff" data-act="pt-cancel" data-ref="${next.ref}">Cancel</button></div></div>`:`<div class="card" style="text-align:center;padding:36px"><h3 style="margin-bottom:8px">No upcoming appointments</h3><p class="lead" style="margin:0 auto 18px">Ready for your next visit?</p><a class="btn btn-p" href="#/book">${ic('cal')}Book an appointment</a></div>`)
    +recoCard(mine)
    +`<div class="tiles"><div class="tile"><span>Upcoming</span><b>${up.length}</b></div><div class="tile"><span>Completed visits</span><b>${done}</b></div><div class="tile"><span>Total booked</span><b>${mine.length}</b></div></div>
    <div class="card"><h3 style="margin-bottom:12px">Latest updates</h3>${mailRows(S.mails.filter(m=>m.patientId===u.id).slice(0,3))||'<p class="hint">No notifications yet.</p>'}</div>
    <div class="card" style="margin-top:14px"><h3 style="margin-bottom:12px">What the statuses mean</h3><div style="display:grid;gap:8px;font-size:.9rem"><div><span class="pill s-Pending">Pending</span> &nbsp;Waiting for clinic review</div><div><span class="pill s-Approved">Approved</span> &nbsp;Confirmed. See you there!</div><div><span class="pill s-Rejected">Rejected</span> &nbsp;Please pick another time</div><div><span class="pill s-Arrived">Arrived</span> &nbsp;You are checked in at the clinic</div><div><span class="pill s-Ongoing">On-going</span> &nbsp;Your treatment is under way</div><div><span class="pill s-Completed">Completed</span> &nbsp;Visit done. Saved in your history</div></div></div>`;
  }else if(ptTab==='appts'){
    const up=mine.filter(a=>['Pending','Approved'].includes(a.status)&&a.date>=TODAY);const past=mine.filter(a=>!up.includes(a)).reverse();
    const list=apptFilter==='upcoming'?up:apptFilter==='history'?past:mine.slice().reverse();
    v.innerHTML=`<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><div class="tabsx" style="margin:0">${[['upcoming','Upcoming'],['history','History'],['all','All']].map(t=>`<button class="chip ${apptFilter===t[0]?'on':''}" data-act="appt-filter" data-f="${t[0]}">${t[1]}</button>`).join('')}</div><a class="btn btn-p btn-sm" href="#/book">${ic('plus')}New booking</a></div>`+(list.length?list.map(apptCard).join(''):'<div class="card empty">Nothing here yet.</div>');
  }else if(ptTab==='mail'){
    v.innerHTML=`<h2 style="font-size:1.5rem;margin-bottom:14px">Notifications</h2><p class="hint" style="margin-bottom:14px">Copies of every email we send you about your bookings.</p>`+(mailRows(S.mails.filter(m=>m.patientId===u.id))||'<div class="card empty">No emails yet.</div>');
  }else{
    v.innerHTML=`<div class="card" style="padding:26px;max-width:560px"><h2 style="font-size:1.5rem;margin-bottom:16px">My profile</h2><form id="profForm" novalidate class="form-grid"><div class="field full"><label for="pf_n">Full name</label><input class="inp" id="pf_n" value="${esc(u.name)}"><div class="err" data-e="n"></div></div><div class="field full"><label for="pf_e">Email</label><input class="inp" id="pf_e" value="${esc(u.email)}" disabled></div><div class="field full"><label for="pf_p">Mobile</label><input class="inp" id="pf_p" value="${esc(u.phone)}"><div class="err" data-e="p"></div></div><div class="full" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-p" type="submit">Save changes</button><button class="btn btn-o" type="button" data-act="pt-logout">Sign out</button></div></form></div>`;
  }
}
const recoCard=mine=>{const r=mine.filter(a=>a.status==='Completed'&&a.next&&!a.next.ref&&(!a.next.date||a.next.date>=addDays(TODAY,-30))).pop();if(!r)return '';const n=r.next;
  return `<div class="note" style="margin-bottom:14px"><svg class="ic"><use href="#i-cal"/></svg><span><b>Your next visit:</b> your dentist recommends <b>${esc(svcName(n.service))}</b>${n.date?' around '+fmtD(n.date):''}. <button class="btn btn-p btn-sm" style="margin-left:6px" data-act="pt-booknext" data-ref="${r.ref}">Book it</button></span></div>`};
function apptCard(a){
  const st=stLabel(a);const s0=a.status;
  let cls=['on',(['Approved','Completed','No-show'].includes(s0)?'on':''),(['Completed','Arrived','On-going'].includes(st)?'on':'')];let labels=['Requested','Approved',st==='Arrived'?'Arrived':st==='On-going'?'In treatment':'Visit'];
  if(st==='Rejected'){cls=['on','bad',''];labels=['Requested','Rejected','']}
  if(st==='Cancelled'){cls=['on','bad',''];labels=['Requested','Cancelled','']}
  if(st==='No-show'){cls=['on','on','bad'];labels=['Requested','Approved','No-show']}
  const can=['Pending','Approved'].includes(s0)&&a.date>=TODAY&&['Scheduled','Late'].includes(a.visit||'Scheduled');
  return `<article class="ac"><div class="ac-h"><div><h3>${esc(svcName(a.service))}</h3><small style="color:var(--muted)">${esc(a.ref)}</small></div><span class="pill ${sc(st)} lg">${st}</span></div><div class="meta"><span>${ic('cal')}${fmtD(a.date)}</span><span>${ic('clock')}${a.durSet?fmtRange(a):'Starts '+fmtT(a.time)}</span><span>${ic('user')}${a.dentistId?esc(dentName(a)):'Dentist assigned on arrival'}</span><span>${ic('pin')}${esc(bName(a.branchId))}</span></div><div class="prog">${labels.map((l,i)=>l?`<div class="${cls[i]}">${l}</div>`:'').join('')}</div>${a.next&&s0==='Completed'?`<div class="note"><svg class="ic"><use href="#i-cal"/></svg><span><b>Next visit:</b> ${esc(svcName(a.next.service))}${a.next.date?' around '+fmtD(a.next.date):''}${a.next.ref?' · reserved ('+esc(a.next.ref)+')':''}${a.next.ref?'':` <button class="btn btn-p btn-sm" style="margin-left:6px" data-act="pt-booknext" data-ref="${a.ref}">Book it</button>`}</span></div>`:''}${a.reason&&st==='Rejected'?`<div class="note" style="background:var(--bad-bg);color:var(--bad)"><svg class="ic"><use href="#i-x"/></svg><span>${esc(a.reason)}</span></div>`:''}${can&&S.settings.allowResched?`<div class="ac-act"><button class="btn btn-o btn-sm" data-act="pt-resched" data-ref="${a.ref}">${ic('refresh')}Reschedule</button><button class="btn btn-o btn-sm" data-act="pt-cancel" data-ref="${a.ref}" style="color:var(--bad)">Cancel</button></div>`:''}${can&&!S.settings.allowResched?`<div class="ac-act"><button class="btn btn-o btn-sm" data-act="pt-cancel" data-ref="${a.ref}" style="color:var(--bad)">Cancel</button></div>`:''}${st==='Rejected'?`<div class="ac-act"><a class="btn btn-p btn-sm" href="#/book">Book another time</a></div>`:''}</article>`}

/* =========================================================
   ACTIONS + EVENTS
========================================================= */
Object.assign(ACT,{
 'bk-branch':el=>{bk.branch=el.value;const s=svById(bk.service);if(s&&!svcOffered(s,bk.branch))bk.service='';bk.dentist='any';bk.date='';bk.time='';delete CAL.bk;renderBook()},
 'bk-svc':el=>{bk.service=el.value;const e=$('#bkErr');if(e)e.textContent=''},
 'bk-dent':el=>{bk.dentist=el.value;bk.time='';if(bk.date&&!hasAvail(bk.date,bk.branch,bk.dentist,bk.rs)){bk.date='';CAL.bk.sel=''}renderBook()},
 'bk-time':el=>{bk.time=el.dataset.time;$('#slotBox').innerHTML=slotsHTML()},
 'bk-next':()=>bkNext(),'bk-back':()=>{bk.step=Math.max(1,bk.step-1);renderBook()},'bk-submit':()=>bkSubmit(),
 'to-portal':el=>{authMode=el.dataset.mode;afterAuth='book';go('portal')},
 'to-appts':()=>{ptTab='appts';apptFilter='upcoming';bk=null;go('portal')},
 'auth-mode':el=>{authMode=el.dataset.mode;renderPortal()},
 'demo-login':()=>{S.sess='u0';save();afterLogin();toast('Signed in as the demo patient')},
 'pt-tab':el=>{ptTab=el.dataset.tab;renderPortal()},
 'pt-logout':()=>{S.sess=null;save();bk=null;updatePortalBtn();renderPortal();toast('Signed out')},
 'appt-filter':el=>{apptFilter=el.dataset.f;renderPtView();$$('.tabsx .chip').forEach(c=>c.classList.toggle('on',c.dataset.f===apptFilter))},
 'pt-resched':el=>{const a=apptBy(el.dataset.ref);bk=newBk();bk.rs=a.ref;bk.branch=a.branchId;bk.service=a.service;bk.step=2;bk.dentist=a.dentistId||'any';bk.notes=a.notes;go('book')},
 'pt-booknext':el=>{const a=apptBy(el.dataset.ref);bk=newBk();bk.branch=bById(a.branchId)&&bById(a.branchId).status==='active'?a.branchId:(activeBranches().length===1?activeBranches()[0].id:'');bk.service=a.next.service==='other'?'':a.next.service;bk.step=bk.branch&&bk.service?2:1;calInit('bk','');if(bk.step===2&&a.next.date&&hasAvail(a.next.date,bk.branch,'any')){bk.date=a.next.date;calInit('bk',bk.date)}go('book')},
 'pt-cancel':el=>{const a=apptBy(el.dataset.ref);openModal('Cancel appointment',`<div style="padding:22px"><p>Cancel <b>${esc(svcName(a.service))}</b> on ${fmtD(a.date)} at ${fmtT(a.time)} (${esc(bShort(a.branchId))})?</p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px"><button class="btn btn-o" data-act="close-modal">Keep it</button><button class="btn btn-p" style="background:var(--bad)" data-act="pt-cancel-go" data-ref="${a.ref}">Yes, cancel</button></div></div>`)},
 'pt-cancel-go':el=>{const a=apptBy(el.dataset.ref);a.status='Cancelled';logH(a,'Cancelled by patient');notify('cancelled',a);save();closeModal();renderPortal();toast('Appointment cancelled')},
 'map-branch':el=>{mapBranch=el.dataset.id;$$('#mapChips .chip').forEach(c=>c.classList.toggle('on',c.dataset.id===mapBranch));setMap()},
 'msg-again':()=>{$('#msgOk').hidden=true;$('#inqBox').hidden=false}
});
document.addEventListener('click',e=>{
  const bl=e.target.closest('a[href="#/book"]');
  if(bl&&!bl.hasAttribute('data-svc-book')&&!bl.hasAttribute('data-branch-book'))bk=newBk();
  const sb=e.target.closest('[data-svc-book]');if(sb){bk=newBk();bk.service=sb.dataset.svcBook;bk.step=bk.branch?2:1;calInit('bk','')}
  const bb=e.target.closest('[data-branch-book]');if(bb){bk=newBk();bk.branch=bb.dataset.branchBook}
  const s=e.target.closest('[data-svc]');if(s){pendingScroll=s.dataset.svc;if(location.hash==='#/services')route()}
  const f=e.target.closest('[data-f]');if(f&&f.closest('#svcFilters')){$$('#svcFilters .chip').forEach(c=>c.classList.toggle('on',c===f));const v=f.dataset.f;$$('.sv').forEach(x=>x.hidden=v!=='all'&&x.dataset.id!==v)}
});
document.addEventListener('submit',e=>{
  const f=e.target;
  if(f.id==='loginPt'){e.preventDefault();const em=$('#lp_e').value.trim().toLowerCase(),pw=$('#lp_p').value;let bad=false;setE(f,'e','');setE(f,'p','');
    if(!okMail(em)){setE(f,'e','Enter a valid email address');bad=true}if(!pw){setE(f,'p','Enter your password');bad=true}if(bad)return;
    const u=S.users.find(x=>x.email.toLowerCase()===em&&x.pw===pw);if(!u){setE(f,'p','Email or password is incorrect. Try the demo account.');return}
    S.sess=u.id;save();afterLogin();toast('Welcome back, '+u.name.split(' ')[0])}
  else if(f.id==='regPt'){e.preventDefault();let bad=false;['n','e','ph','p','p2','c'].forEach(k=>setE(f,k,''));
    const n=$('#rg_n').value.trim(),em=$('#rg_e').value.trim().toLowerCase(),ph=$('#rg_ph').value.trim(),p=$('#rg_p').value,p2=$('#rg_p2').value;
    if(!n){setE(f,'n','Please enter your full name');bad=true}
    if(!okMail(em)){setE(f,'e','Enter a valid email address');bad=true}else if(S.users.some(u=>u.email.toLowerCase()===em)){setE(f,'e','An account with this email already exists');bad=true}
    if(!okPhone(ph)){setE(f,'ph','Enter a valid PH mobile (09XX XXX XXXX)');bad=true}
    if(p.length<8){setE(f,'p','Use at least 8 characters');bad=true}
    if(p2!==p){setE(f,'p2','Passwords do not match');bad=true}
    if(!$('#rg_c').checked){setE(f,'c','Please tick to continue');bad=true}
    if(bad)return;const u={id:'u'+Date.now(),name:n,email:em,phone:ph,pw:p,sample:false,created:new Date().toISOString()};S.users.push(u);S.sess=u.id;save();afterLogin();toast('Account created. Welcome, '+n.split(' ')[0]+'!')}
  else if(f.id==='profForm'){e.preventDefault();const u=me();const n=$('#pf_n').value.trim(),p=$('#pf_p').value.trim();setE(f,'n','');setE(f,'p','');let bad=false;
    if(!n){setE(f,'n','Name is required');bad=true}if(!okPhone(p)){setE(f,'p','Enter a valid PH mobile');bad=true}if(bad)return;u.name=n;u.phone=p;save();updatePortalBtn();renderPortal();toast('Profile saved')}
  else if(f.id==='msgForm'){e.preventDefault();const d=Object.fromEntries(new FormData(f));let bad=false;
    if(!d.name?.trim()){setE(f,'name','Please enter your name');bad=true}else setE(f,'name','');
    if(!d.email||!okMail(d.email)){setE(f,'email','Enter a valid email address');bad=true}else setE(f,'email','');
    if(!d.message?.trim()){setE(f,'message','Please write a message');bad=true}else setE(f,'message','');if(bad)return;
    const r='MSG-'+(++S.seq);S.msgs.unshift({ref:r,name:d.name.trim(),email:d.email.trim(),subject:(d.subject||'').trim(),message:d.message.trim(),branchId:d.branch||'',created:new Date().toISOString(),read:false,sample:false});save();f.reset();$('#inqBox').hidden=true;$('#msgOk').hidden=false;$('#msgRef').textContent='Reference: '+r}
});

/* =========================================================
   BOOT
========================================================= */
init();
route();
