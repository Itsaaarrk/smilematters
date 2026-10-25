/* =========================================================
   CALENDAR: month · week · day (Meta-style) with a day-details panel
   Several patients can share a time slot: week/day views place
   overlapping appointments side by side, and the panel shows how full
   every slot is against the branch's "patients per slot" limit.
========================================================= */
const calAppts=()=>scAppts().filter(a=>!['Rejected','Cancelled'].includes(a.status)&&(!calState.dent||a.dentistId===calState.dent));
const weekStart=s=>{let d=s;while(dow(d)!==0)d=addDays(d,-1);return d};
const syncYM=()=>{const p=parse(calState.sel);calState.y=p.getFullYear();calState.m=p.getMonth()};
function calTitle(){const c=calState;
  if(c.view==='month')return new Date(c.y,c.m,1).toLocaleDateString('en-PH',{month:'long',year:'numeric'});
  if(c.view==='week'){const s=weekStart(c.sel),e=addDays(s,6);return `${fmtDs(s)} – ${fmtDs(e)}, ${parse(e).getFullYear()}`}
  return fmtD(c.sel,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
const branchOpen=(bid,date)=>{const h=bById(bid).hours[dow(date)];return !!(h&&h.on)};
const dayClosed=date=>scopeIds().every(bid=>!branchOpen(bid,date));
function dayFull(date){return scopeIds().some(bid=>{const cap=capOf(bid);return daySlots(bid,date).some(m=>occupancy(bid,date,m)>=cap)})}
const shortT=t=>fmtT(t).replace(':00','').replace(' ','').toLowerCase();

/* ---------- lane layout so overlapping appointments sit side by side ---------- */
function layoutLanes(items){
  const sorted=items.slice().sort((x,y)=>x.s-y.s||y.e-x.e);const out=[];let cluster=[],laneEnds=[],clusterEnd=-1;
  const flush=()=>{const n=cluster.reduce((m,x)=>Math.max(m,x.lane+1),1);cluster.forEach(x=>x.n=n);out.push(...cluster);cluster=[];laneEnds=[];clusterEnd=-1};
  sorted.forEach(it=>{if(cluster.length&&it.s>=clusterEnd)flush();let l=laneEnds.findIndex(e=>e<=it.s);if(l<0){l=laneEnds.length;laneEnds.push(it.e)}else laneEnds[l]=it.e;it.lane=l;cluster.push(it);clusterEnd=Math.max(clusterEnd,it.e)});
  if(cluster.length)flush();return out;
}
function gridRange(dates){let lo=1440,hi=0;scopeIds().forEach(bid=>dates.forEach(d=>{const h=bById(bid).hours[dow(d)];if(h&&h.on){lo=Math.min(lo,mins(h.start));hi=Math.max(hi,mins(h.end))}}));
  if(lo>=hi){lo=660;hi=1080}
  calAppts().filter(a=>dates.includes(a.date)).forEach(a=>{lo=Math.min(lo,mins(a.time));hi=Math.max(hi,endOf(a))});
  return [Math.floor(lo/60)*60,Math.ceil(hi/60)*60]}
function timeGrid(dates){
  const [gs,ge]=gridRange(dates),RH=60,H=(ge-gs)/60*RH;const list=calAppts();
  const heads=dates.map(d=>`<button class="tg-dh ${d===TODAY?'today':''} ${d===calState.sel?'sel':''}" data-act="cal-day" data-date="${d}" aria-label="Open ${fmtD(d)}"><small>${DAYS3[dow(d)]}</small><b>${parse(d).getDate()}</b></button>`).join('');
  const cols=dates.map(d=>{
    const items=layoutLanes(sortAppts(list.filter(a=>a.date===d)).map(a=>({a,s:mins(a.time),e:endOf(a)})));
    const closed=dayClosed(d);const nm=nowMin();
    return `<div class="tg-col ${closed?'closed':''} ${d===TODAY?'today':''}" style="height:${H}px">${closed?'<span class="tg-closed">Closed</span>':''}${items.map(it=>{const a=it.a,top=(it.s-gs)/60*RH,h=Math.max(24,(it.e-it.s)/60*RH-2);
      return `<button class="tev ${sc(stLabel(a))}" style="top:${top}px;height:${h}px;left:calc(${it.lane/it.n*100}% + 1px);width:calc(${100/it.n}% - 3px)" data-act="a-open" data-ref="${a.ref}" title="${esc(patName(a))} · ${esc(svcName(a.service))} · ${fmtRange(a)} · ${stLabel(a)}"><b>${showBr()?esc(bShort(a.branchId)[0])+' · ':''}${esc(patName(a).split(' ')[0])}</b><span>${shortT(a.time)} · ${esc(svcName(a.service))}</span></button>`}).join('')}${d===TODAY&&nm>=gs&&nm<=ge?`<i class="tg-now" style="top:${(nm-gs)/60*RH}px"></i>`:''}</div>`}).join('');
  const hrs=[];for(let m=gs;m<ge;m+=60)hrs.push(m);
  return `<div class="tgw"><div class="tg" style="--cols:${dates.length}"><div class="tg-head"><span></span>${heads}</div><div class="tg-body"><div class="tg-times" style="height:${H}px">${hrs.map(m=>`<span style="top:${(m-gs)/60*RH}px">${fmtTs(tstr(m))}</span>`).join('')}</div>${cols}</div></div></div>`;
}

/* ---------- day details (shown when a day is clicked) ---------- */
function dayPanel(date){
  const ids=scopeIds();const L=sortAppts(calAppts().filter(a=>a.date===date));const cnt=f=>L.filter(f).length;
  const waiting=cnt(a=>a.status==='Pending'||(a.status==='Approved'&&['Scheduled','Late'].includes(a.visit||'Scheduled')));
  const inc=cnt(a=>a.status==='Approved'&&['Arrived','On-going'].includes(a.visit)),done=cnt(a=>a.status==='Completed'),abs=cnt(a=>a.status==='No-show');
  const duty=dutyOn(date,ids);const canAdd=canProcess()&&date>=TODAY;
  const dutyHTML=duty.length?`<div class="dp-sec"><div class="kicker">Dentists on duty</div>${duty.map(x=>`<div class="dp-duty"><span class="av sm">${initials(x.d.name.replace('Dr. ',''))}</span><span><b>${esc(x.d.name)}</b> ${showBr()?bChip(x.bid):''}<br><small>${fmtTs(tstr(x.st))} – ${fmtTs(tstr(x.en))} · ${L.filter(a=>a.dentistId===x.d.id).length} patient${L.filter(a=>a.dentistId===x.d.id).length===1?'':'s'}</small></span></div>`).join('')}</div>`
    :`<div class="dp-sec"><div class="note"><svg class="ic"><use href="#i-clock"/></svg><span>${dayClosed(date)?'The clinic is closed this day.':'No dentist is scheduled this day.'}</span></div></div>`;
  const heat=ids.map(bid=>{const sl=daySlots(bid,date);if(!sl.length)return '';const cap=capOf(bid);
    return `<div class="dp-sec"><div class="kicker">Slot capacity${showBr()?' · '+esc(bShort(bid)):''} <small>limit ${cap} per slot</small></div><div class="heat">${sl.map(m=>{const u=occupancy(bid,date,m);const lv=u>cap?'x':u>=cap?'4':u/cap>=.67?'3':u>0?'2':'1';return `<span class="h h${lv}" title="${fmtT(tstr(m))}: ${u} of ${cap} patients"><i>${fmtTs(tstr(m))}</i><b>${u}</b></span>`}).join('')}</div></div>`}).join('');
  const groups=[];L.forEach(a=>{const k=a.branchId+'|'+a.time;let g=groups.find(x=>x.k===k);if(!g){g={k,bid:a.branchId,t:a.time,list:[]};groups.push(g)}g.list.push(a)});
  const listHTML=groups.length?groups.map(g=>{const u=occupancy(g.bid,date,mins(g.t)),cap=capOf(g.bid);return `<div class="dp-grp"><div class="dp-gh"><b>${fmtT(g.t)}</b>${showBr()?bChip(g.bid):''}<span class="capb ${u>cap?'over':u>=cap?'full':''}">${u}/${cap} patients${u>cap?' · over limit':u>=cap?' · full':''}</span></div>${g.list.map(qRow).join('')}</div>`}).join(''):'<div class="empty">Nothing scheduled.</div>';
  return `<div class="panel dpanel" data-note="Calendar details: click any day"><div class="dp-h"><div><b>${fmtD(date,{weekday:'long',month:'long',day:'numeric'})}</b><br><small>${L.length} appointment${L.length===1?'':'s'}${date===TODAY?' · today':''}</small></div>${canAdd?`<button class="btn btn-p btn-sm" data-act="mf-open" data-date="${date}">${ic('plus')}Add</button>`:''}</div>
  <div class="dp-stats"><div><b>${waiting}</b>Waiting</div><div><b>${inc}</b>In clinic</div><div><b>${done}</b>Done</div><div><b>${abs}</b>No-show</div></div>${dutyHTML}${heat}<div class="dp-sec"><div class="kicker">Patients</div></div>${listHTML}</div>`;
}

/* ---------- the calendar view ---------- */
function vCal(){
  const c=calState;
  const tools=`<div class="tools calbar"><button class="btn btn-o btn-sm" data-act="mc-today">Today</button><button class="btn btn-o btn-sm" data-act="mc-nav" data-d="-1" aria-label="Previous">‹</button><button class="btn btn-o btn-sm" data-act="mc-nav" data-d="1" aria-label="Next">›</button><b class="caltitle">${calTitle()}</b><div class="seg2" role="group" aria-label="Calendar view">${['month','week','day'].map(v=>`<button class="${c.view===v?'on':''}" data-act="cal-view" data-v="${v}">${v[0].toUpperCase()+v.slice(1)}</button>`).join('')}</div>${isDentist()?'':`<select class="inp" data-act="cal-dent" aria-label="Dentist"><option value="">All dentists</option>${S.dents.map(d=>`<option value="${d.id}" ${c.dent===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}</select>`}${canProcess()?`<button class="btn btn-p btn-sm" data-act="mf-open" data-date="${c.sel}">${ic('plus')}New appointment</button>`:''}</div>`;
  const legend=`<div class="legend" style="padding:12px 16px">${['Pending','Approved','Late','Arrived','On-going','Completed','No-show'].map(s=>`<span class="pill ${sc(s)}">${s==='Approved'?'Scheduled':s}</span>`).join(' ')}${showBr()?` <span style="color:var(--muted)">· Letter = branch (${myBranches().map(b=>b.short[0]+'='+b.short).join(', ')})</span>`:''}</div>`;
  if(c.view==='week'){const s=weekStart(c.sel),dates=[0,1,2,3,4,5,6].map(i=>addDays(s,i));
    return `<div class="panel" data-note="Module: Appointment Calendar (week view)">${tools}${timeGrid(dates)}${legend}<p class="hint" style="padding:0 16px 14px">Overlapping blocks are patients sharing a time slot. Click a day name for its details, or a block to open the appointment.</p></div>`}
  if(c.view==='day')return `<div class="cal-cols day"><div class="panel" data-note="Module: Appointment Calendar (day view)">${tools}${timeGrid([c.sel])}${legend}</div>${dayPanel(c.sel)}</div>`;
  const first=new Date(c.y,c.m,1);const start=new Date(c.y,c.m,1-first.getDay());const cells=[];
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);cells.push(iso(d))}
  const by={};calAppts().forEach(a=>(by[a.date]=by[a.date]||[]).push(a));
  return `<div class="cal-cols"><div class="panel" data-note="Module: Appointment Calendar">${tools}<div class="mcal">${DAYS3.map(x=>`<div class="mch">${x}</div>`).join('')}${cells.map(s=>{const l=sortAppts(by[s]||[]);const d=parse(s);const closed=dayClosed(s),full=!closed&&l.length&&dayFull(s);
    return `<button class="mc ${d.getMonth()!==c.m?'out':''} ${s===TODAY?'today':''} ${s===c.sel?'sel':''} ${closed?'closed':''}" data-act="mc-pick" data-date="${s}" aria-label="${fmtD(s)}, ${l.length} appointments${closed?', clinic closed':''}"><span class="mc-top"><span class="n">${d.getDate()}</span>${l.length?`<span class="cnt2">${l.length}</span>`:''}</span>${l.slice(0,3).map(a=>`<span class="ev ${sc(stLabel(a))}">${shortT(a.time)} ${showBr()?esc(bShort(a.branchId)[0])+' · ':''}${esc(patName(a).split(' ')[0])}</span>`).join('')}${l.length>3?`<div class="more">+${l.length-3} more</div>`:''}${full?'<span class="fullflag">Slot full</span>':''}</button>`}).join('')}</div>${legend}</div>${dayPanel(c.sel)}</div>`;
}

Object.assign(ACT,{
 'mc-nav':el=>{const c=calState,d=+el.dataset.d;
   if(c.view==='month'){c.m+=d;if(c.m<0){c.m=11;c.y--}if(c.m>11){c.m=0;c.y++}const t=parse(TODAY);c.sel=(c.y===t.getFullYear()&&c.m===t.getMonth())?TODAY:iso(new Date(c.y,c.m,1))}
   else{c.sel=addDays(c.sel,c.view==='week'?7*d:d);syncYM()}
   drawAdmin()},
 'mc-today':()=>{calState.sel=TODAY;syncYM();drawAdmin()},
 'mc-pick':el=>{calState.sel=el.dataset.date;syncYM();drawAdmin()},
 'cal-day':el=>{calState.sel=el.dataset.date;calState.view='day';syncYM();drawAdmin()},
 'cal-view':el=>{calState.view=el.dataset.v;syncYM();drawAdmin()},
 'cal-dent':el=>{calState.dent=el.value;drawAdmin()}
});
