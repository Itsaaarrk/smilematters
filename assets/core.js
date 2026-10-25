/* =========================================================
   Smile Matters Standard Package mock-up: shared core
   (data model, multi-branch scheduling, email, shared UI)
========================================================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=(n,c='')=>`<svg class="ic ${c}"><use href="#i-${n}"/></svg>`;
let toastT;const toast=m=>{const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2800)};
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const TODAY=iso(new Date());
const nowMin=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()};
const fmtD=(s,o)=>parse(s).toLocaleDateString('en-PH',o||{weekday:'short',month:'short',day:'numeric',year:'numeric'});
const fmtDs=s=>parse(s).toLocaleDateString('en-PH',{month:'short',day:'numeric'});
const mins=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const tstr=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const fmtT=t=>{const [h,m]=t.split(':').map(Number);return `${(h%12)||12}:${pad(m)} ${h<12?'AM':'PM'}`};
const dow=s=>parse(s).getDay();
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS3=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const ago=at=>{const m=Math.round((Date.now()-new Date(at))/6e4);if(m<1)return'just now';if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<24)return h+' hr ago';return Math.round(h/24)+' d ago'};
const okPhone=v=>/^(\+?63|0)9\d{9}$/.test(v.replace(/[\s\-()]/g,''));
const okMail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const initials=n=>n.replace(/[^A-Za-z ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'P';
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* ---------- icon sprite ---------- */
document.body.insertAdjacentHTML('afterbegin','<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="i-tooth" viewBox="0 0 24 24"><path d="M7.5 3C5 3 3.5 5 3.5 7.5c0 2 .8 3.4 1.3 5.2.5 2 .6 5 1.6 7.3.5 1.2 1.6 1.2 2.1 0 .6-1.5.8-3.6 1.4-5 .3-.7 1-1.1 1.6-1.1s1.3.4 1.6 1.1c.6 1.4.8 3.5 1.4 5 .5 1.2 1.6 1.2 2.1 0 1-2.3 1.1-5.3 1.6-7.3.5-1.8 1.3-3.2 1.3-5.2C20.5 5 19 3 16.5 3c-1.7 0-2.7.9-4.5.9S9.2 3 7.5 3z"/></symbol><symbol id="i-braces" viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M2.5 12h19M8 7v10M12 7v10M16 7v10"/><rect x="6" y="10.5" width="4" height="3" rx=".8"/><rect x="14" y="10.5" width="4" height="3" rx=".8"/></symbol><symbol id="i-jaw" viewBox="0 0 24 24"><path d="M4 6c0 6 1 11 5 13 2 1 4 .5 6-1.5 2-2 3-5 5-6.5"/><circle cx="17" cy="6" r="2.4"/><path d="M17 8.4V11M14.5 4.2 13 3M19.6 4.2 21 3"/></symbol><symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/></symbol><symbol id="i-crown" viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/><path d="M5.5 16h13"/></symbol><symbol id="i-root" viewBox="0 0 24 24"><path d="M6 3c-2 0-3 1.8-3 4 0 1.7.7 2.7 1 4.2M18 3c2 0 3 1.8 3 4 0 1.7-.7 2.7-1 4.2"/><path d="M6 3h12M4 11.2C4.5 14 5 17 6 21M20 11.2c-.5 2.8-1 5.8-2 9.8M9 6v13M15 6v13"/></symbol><symbol id="i-surg" viewBox="0 0 24 24"><path d="M14 4l6 6-9.5 9.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2L14 4z"/><path d="M11 7l6 6M5 20l-2 1 1-2"/></symbol><symbol id="i-xray" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 9c0-1.2.8-2 2-2 1.2 0 1.4.7 3 .7S13.8 7 15 7c1.2 0 2 .8 2 2 0 1.6-.6 2.6-.8 4-.2 1.4-.4 3-.9 3.4-.4.3-.8-.2-1-1-.2-.8-.3-1.9-.9-1.9-.6 0-.7 1.1-.9 1.9-.2.8-.6 1.3-1 1-.5-.4-.7-2-.9-3.4C7.6 11.6 7 10.6 7 9z"/></symbol><symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></symbol><symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></symbol><symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.5 6 8.5-6"/></symbol><symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol><symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol><symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol><symbol id="i-cal" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></symbol><symbol id="i-msg" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4V5z"/></symbol><symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8L12 3z"/></symbol><symbol id="i-img" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/></symbol><symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></symbol><symbol id="i-headache" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8 9.5l2 1M16 9.5l-2 1M9 16c1-1 2-1.4 3-1.4s2 .4 3 1.4M12 3.5v-1.5M5.5 6l-1-1M18.5 6l1-1"/></symbol><symbol id="i-ear" viewBox="0 0 24 24"><path d="M7 10a5 5 0 0 1 10 0c0 2.5-2 3.5-3 5s-.5 4-3 4-3-2-3-3"/><path d="M10 10a2 2 0 0 1 4 0"/></symbol><symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></symbol><symbol id="i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></symbol><symbol id="i-out" viewBox="0 0 24 24"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h10"/></symbol><symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></symbol><symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5L15.5 10"/></symbol><symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></symbol><symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.8.7 2.8 2.2 3 4.7"/></symbol><symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15L6 17zM10 21h4"/></symbol><symbol id="i-list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></symbol><symbol id="i-cog" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></symbol><symbol id="i-dl" viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M4 20h16"/></symbol><symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol><symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol><symbol id="i-cc" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/></symbol><symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/></symbol><symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9H4v-9zM10 20v-6h4v6"/></symbol><symbol id="i-flow" viewBox="0 0 24 24"><circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7 6h10M6 8l5 8M18 8l-5 8"/></symbol><symbol id="i-branch" viewBox="0 0 24 24"><path d="M4 21V8l8-5 8 5v13M4 21h16M9 21v-6h6v6M9 11h.01M15 11h.01"/></symbol><symbol id="i-svc" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5"/></symbol><symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/></symbol><symbol id="i-edit" viewBox="0 0 24 24"><path d="M4 20l1-4L17 4l3 3L8 19l-4 1zM14 7l3 3"/></symbol></svg>');

/* =========================================================
   STATIC DATA
========================================================= */
const ICONS=['braces','jaw','tooth','sparkle','crown','root','surg','xray','msg','shield'];
const SERVICES_DEFAULT=[
 {id:'general',icon:'tooth',cat:'General',name:'General Dentistry',short:'Check-ups, cleaning, fillings and extractions, explained before every step.',img:'assets/img/marikina-chair.jpg',for:'Routine care, toothaches, cavities and first-time dental visits.',inc:['Consultation and check-up','Oral prophylaxis (cleaning)','Tooth fillings','Simple tooth extraction','After-extraction care guide'],note:'HMO accepted for selected procedures. Ask the branch for your card coverage.'},
 {id:'ortho',icon:'braces',cat:'Orthodontics',name:'Orthodontics',short:'Metal, ceramic and sapphire braces with a low down payment.',img:'assets/img/pasig-team.jpg',for:'Crowded, spaced or misaligned teeth and bite concerns.',inc:['Metal braces','Ceramic braces','Sapphire braces','Retainers','Monthly adjustments'],note:'Low down payment for orthodontic braces.'},
 {id:'cosmetic',icon:'sparkle',cat:'Cosmetic',name:'Cosmetic Dentistry',short:'Composite, Ceramage, Emax and zirconia veneers for a full smile makeover.',hl:true,img:'assets/img/result-veneers.jpg',for:'Stained, chipped, uneven or gapped teeth.',inc:['Composite veneers and bonding','Ceramage veneers','Emax veneers','Zirconia veneers','Smile design consultation'],note:'Recent offer: 20% off veneers and crowns.'},
 {id:'prostho',icon:'crown',cat:'Prosthodontics',name:'Crowns, Bridges & Dentures',short:'Zirconia and PFM crowns, fixed bridges and flexible dentures.',img:'assets/img/result-zirconia.jpg',for:'Missing, broken or heavily restored teeth.',inc:['Zirconia crowns','PFM crowns','Fixed bridge','Flexible dentures','Complete dentures'],note:'Case shared on our page: 10-unit zirconia crowns.'},
 {id:'surgery',icon:'surg',cat:'Oral Surgery',name:'Oral Surgery',short:'Odontectomy for impacted wisdom teeth and complex extractions.',img:'assets/img/marikina-surgery.jpg',for:'Impacted or painful wisdom teeth and difficult extractions.',inc:['Odontectomy (third molar surgery)','Surgical extraction','Panoramic X-ray review','Post-op care guidance'],note:'Patients describe it as quick and painless.'},
 {id:'laser',icon:'root',cat:'Laser',name:'Laser Surgery',short:'Laser gingivectomy to reshape gums for an even, healthy smile.',img:'assets/img/marikina-dentist.jpg',for:'Gummy smiles, uneven gum lines and gum overgrowth.',inc:['Laser gingivectomy','Gum contouring','Minimal bleeding','Faster healing'],note:'Often paired with veneers for a full smile design.'},
 {id:'implants',icon:'xray',cat:'Implants',name:'Dental Implants',short:'Fixed, natural-looking replacement for missing teeth.',img:'assets/img/caloocan-team.jpg',for:'One or more missing teeth.',inc:['Implant consultation','X-ray planning','Implant placement','Implant crown'],note:'Your dentist will check if implants suit your case.'}
];
const STATUSES=['Pending','Approved','Rejected','Cancelled','Completed','No-show'];
/* booking status stays Pending/Approved/...; once approved, `visit` tracks the patient inside the clinic */
const VISITS=['Scheduled','Late','Arrived','On-going','Completed'];
const FILTERS=['Pending','Approved','Late','Arrived','On-going','Completed','No-show','Rejected','Cancelled'];
const stLabel=a=>a.status==='Approved'&&a.visit&&a.visit!=='Scheduled'?a.visit:a.status;
const SVC_DUR={general:30,ortho:60,cosmetic:90,prostho:60,surgery:90,laser:60,implants:90};
const DUR_OPTS=[30,45,60,75,90,120,150,180];
const SOURCES=['Walk-in','Phone','Facebook','Follow-up','Other'];
const sc=s=>'s-'+s.replace('-','');
const MAILNAMES={received:'Booking received',approved:'Appointment approved',rejected:'Request not approved',rescheduled:'Appointment rescheduled',cancelled:'Appointment cancelled',reminder:'Appointment reminder',nextvisit:'Next visit recommendation',admin_new:'New booking (to clinic)'};
const ROLES={super:{name:'Super admin',desc:'All branches and every module'},manager:{name:'Branch manager',desc:'Runs one or more branches'},staff:{name:'Clinic staff',desc:'Front desk: appointments, calendar, patients'},dentist:{name:'Dentist',desc:'Own appointments, calendar and dashboard; requests schedule changes'}};

/* =========================================================
   STATE + SEED
========================================================= */
let S;
const save=()=>store.set('sm1',S);
let SEED=11;const rnd=()=>(SEED=(SEED*1664525+1013904223)%4294967296)/4294967296;
const pick=a=>a[Math.floor(rnd()*a.length)];
const schedFor=(days,start='09:00',end='18:00')=>{const o={};for(let i=0;i<7;i++)o[i]={on:days.includes(i),start,end};return o};
const DEF_OPEN='09:00',DEF_CLOSE='18:00';

function seed(){
  SEED=11;
  S={v:4,seq:100,sess:null,adm:null,admBranch:'all',branches:[],services:[],dents:[],staff:[],users:[],appts:[],mails:[],msgs:[],reqs:[],
     settings:{confirm:true,status:true,reminder:true,reminderHrs:24,advanceDays:60,minNoticeHrs:2,cancelHrs:24,allowResched:true,slotMin:30,defCap:3,defOpen:DEF_OPEN,defClose:DEF_CLOSE,clinic:'Smile Matters Dental Care Center',tagline:'Your Smile Matters'}};
  const WEEK=[1,2,3,4,5,6,0];
  const calHrs={0:{on:true,start:'10:00',end:'16:00'},1:{on:true,start:'10:00',end:'19:00'},2:{on:true,start:'10:00',end:'19:00'},3:{on:false,start:'10:00',end:'19:00'},4:{on:true,start:'10:00',end:'19:00'},5:{on:true,start:'10:00',end:'19:00'},6:{on:true,start:'10:00',end:'19:00'}};
  S.branches=[
   {id:'b1',name:'Smile Matters Dental Care Center',short:'Pasig',address:'180 Dr. Sixto Antonio Ave., Brgy. Caniogan, Pasig City 1600',landmark:'Near Caniogan Police Station, Pasig Bethel Temple and Rizal High School',phone:'0995 580 0145',phone2:'(02) 7746-2787',email:'smilemattersdentalcarecenter@yahoo.com',map:'180 Dr. Sixto Antonio Avenue, Caniogan, Pasig City',status:'active',main:true,capacity:3,hours:schedFor(WEEK)},
   {id:'b2',name:'SMILE 2.0 by Smile Matters',short:'Marikina',address:'83 Lilac St., SSS Village, Concepcion 2, Marikina City 1811',landmark:'SSS Village, Concepcion Dos',phone:'0908 944 9605',phone2:'',email:'smile20bysmilematters@yahoo.com',map:'83 Lilac Street, SSS Village, Concepcion Dos, Marikina City',status:'active',main:false,capacity:2,hours:schedFor(WEEK)},
   {id:'b3',name:'Smile Matters Dental Studio',short:'Caloocan',address:'Northwest Plaza, 3rd Floor, 749 Rizal Ave. Ext., Monumento, Caloocan City 1400',landmark:'Northwest Plaza, Monumento',phone:'0975 384 5274',phone2:'0910 228 3153 · (02) 8652-0334',email:'smilemattersdental@yahoo.com',map:'Northwest Plaza, 749 Rizal Avenue Extension, Monumento, Caloocan City',status:'active',main:false,capacity:2,hours:calHrs}
  ];
  S.services=SERVICES_DEFAULT.map(s=>({...s,dur:SVC_DUR[s.id]||30,active:true,branches:'all'}));
  
  S.dents=[
   {id:'d1',name:'Dra. Jen [Surname]',role:'Cosmetic Dentistry & Oral Surgery',active:true,sched:{b1:schedFor([1,2,3,4,5]),b2:schedFor([6,0]),b3:{}},blocked:[],extra:[]},
   {id:'d2',name:'Dr. Xyruz Reyes',role:'Oral Surgery & Prosthodontics',active:true,sched:{b1:schedFor([6,0]),b2:schedFor([1,2,3,4,5]),b3:{}},blocked:[],extra:[]},
   {id:'d3',name:'Dr. [Name C]',role:'Orthodontics & General Dentistry',active:true,sched:{b1:schedFor([]),b2:schedFor([]),b3:schedFor([1,2,4,5,6],'10:00','19:00')},blocked:[],extra:[]},
   {id:'d4',name:'Dr. [Name D]',role:'General & Esthetic Dentistry',active:true,sched:{b1:schedFor([3]),b2:schedFor([]),b3:schedFor([0],'10:00','16:00')},blocked:[],extra:[]}
  ];
  S.dents.forEach(d=>Object.keys(d.sched).forEach(k=>{if(!Object.keys(d.sched[k]).length)d.sched[k]=schedFor([])}));
  S.dents[2].blocked.push({date:addDays(TODAY,12),reason:'Seminar'});
  S.staff=[
   {id:'s1',name:'Clinic Owner',email:'owner@demo.local',role:'super',branchIds:'all',active:true},
   {id:'s2',name:'Pasig Branch Manager',email:'manager.pasig@demo.local',role:'manager',branchIds:['b1'],active:true},
   {id:'s3',name:'Pasig Front Desk',email:'frontdesk.pasig@demo.local',role:'staff',branchIds:['b1'],active:true},
   {id:'s4',name:'Marikina Front Desk',email:'frontdesk.marikina@demo.local',role:'staff',branchIds:['b2'],active:true},
   {id:'s7',name:'Caloocan Front Desk',email:'frontdesk.caloocan@demo.local',role:'staff',branchIds:['b3'],active:true},
   {id:'s5',name:'Dra. Jen [Surname]',email:'dra.jen@demo.local',role:'dentist',dentistId:'d1',branchIds:[],active:true},
   {id:'s6',name:'Dr. Xyruz Reyes',email:'dr.xyruz@demo.local',role:'dentist',dentistId:'d2',branchIds:[],active:true}
  ];
  const names=['Ana Reyes','Mark Santos','Liza Fernandez','Paolo Garcia','Jenny Lim','Ramon Cruz','Carla Mendoza','Joel Bautista','Nina Aquino','Rico Dizon'];
  S.users.push({id:'u0',name:'Demo Patient',email:'demo.patient@example.com',phone:'0917 000 0000',pw:'demo1234',sample:true,created:new Date(Date.now()-60*864e5).toISOString()});
  names.forEach((n,i)=>S.users.push({id:'u'+(i+1),name:n,email:n.split(' ')[0].toLowerCase()+'.sample@example.com',phone:'09'+(17+i)+' 555 01'+pad(i),pw:'x',sample:true,created:new Date(Date.now()-(80-i*4)*864e5).toISOString()}));
  [['Rosa Delos Santos','0917 555 0188'],['Eduardo Navarro','0918 555 0147']].forEach(([n,p],i)=>S.users.push({id:'u'+(11+i),name:n,email:'',phone:p,pw:null,walkin:true,sample:true,created:new Date(Date.now()-(30-i*9)*864e5).toISOString()}));
  const acc=S.users.filter(u=>!u.walkin&&u.id!=='u0');
  const atT=(date,m)=>new Date(date+'T'+tstr(Math.max(0,Math.min(m,1439)))+':00').toISOString();
  const mk=(u,svc,dentId,bid,date,time,status,extra={})=>{
    const cr=Math.min(new Date(date+'T09:00:00').getTime()-3*864e5,Date.now()-36e5*(3+Math.floor(rnd()*30)));
    const pu=uById(u),src=extra.source||(pu&&pu.walkin?'Walk-in':'Online');
    const done=['Approved','Completed','No-show'].includes(status);
    const a={ref:'SM-'+date.slice(2).replace(/-/g,'')+'-'+(++S.seq),patientId:u,service:svc,dentistId:dentId||'',branchId:bid,date,time,dur:extra.dur||svcDur(svc),durSet:done,status,visit:extra.visit||(status==='Completed'?'Completed':'Scheduled'),source:src,notes:extra.notes||'',created:new Date(cr).toISOString(),sample:true,reason:extra.reason||'',history:[{at:new Date(cr).toISOString(),text:src==='Online'?'Booking requested by patient':`Added by clinic staff (${src})`}]};
    if(extra.next)a.next=extra.next;
    const dn=dentId?dById(dentId).name:'the dentist',v=a.visit,m0=mins(time);
    if(done)a.history.push({at:new Date(cr+36e5).toISOString(),text:`Approved by clinic · ${fmtDur(a.dur)} allotted`});
    if(status==='Rejected')a.history.push({at:a.created,text:'Rejected by clinic: '+(a.reason||'Slot unavailable')});
    if(['Arrived','On-going','Completed'].includes(v))a.history.push({at:atT(date,m0-5),text:'Patient arrived'});
    if(v==='Late')a.history.push({at:atT(date,m0+10),text:'Marked late by staff'});
    if(['On-going','Completed'].includes(v))a.history.push({at:atT(date,m0),text:'Treatment started with '+dn});
    if(status==='Completed')a.history.push({at:atT(date,m0+a.dur),text:'Visit completed'+(a.next?' · next visit recommended':'')});
    if(status==='No-show')a.history.push({at:atT(date,m0+a.dur),text:'Marked no-show by staff'});
    if(status==='Cancelled')a.history.push({at:a.created,text:'Cancelled'});
    S.appts.push(a);return a};
  /* capacity-aware placement for the sample data */
  const cnt=(bid,date,m)=>S.appts.filter(a=>a.branchId===bid&&a.date===date&&!['Cancelled','Rejected'].includes(a.status)&&mins(a.time)<=m&&m<mins(a.time)+a.dur).length;
  const fits=(bid,date,t,dur)=>{const bh=bById(bid).hours[dow(date)];if(mins(t)+dur>mins(bh.end))return false;for(let m=mins(t);m<mins(t)+dur;m+=15)if(cnt(bid,date,m)+1>capOf(bid))return false;return true};
  const slotAt=(bid,date,dur,dentId)=>{const l=daySlots(bid,date,dentId).filter(m=>fits(bid,date,tstr(m),dur));return l.length?tstr(pick(l)):null};
  const dentFor=(bid,date,t)=>{const l=dentsOnDuty(bid,date,mins(t));return l.length?pick(l).id:''};
  const BR=['b1','b2','b3'];
  for(let off2=-56;off2<=-1;off2++){const date=addDays(TODAY,off2);
    BR.forEach(bid=>{const n=Math.floor(rnd()*(bid==='b1'?5:4));
      for(let k=0;k<n;k++){const svc=pick(S.services).id;const t=slotAt(bid,date,svcDur(svc));if(!t)continue;
        const r=rnd();const st=r<.72?'Completed':r<.83?'No-show':r<.92?'Cancelled':'Rejected';
        const ex=st==='Rejected'?{reason:'Requested time not available'}:{};
        if(st==='Completed'&&rnd()<.25)ex.next={date:addDays(date,pick([14,30,45])),service:pick(S.services).id,time:''};
        mk(pick(S.users.slice(1)).id,svc,['Rejected','Cancelled'].includes(st)&&rnd()<.5?'':dentFor(bid,date,t),bid,date,t,st,ex)}})}
  [[-40,'surgery','d2','b2'],[-21,'general','d1','b1'],[-9,'cosmetic','d1','b1']].forEach(([o,s,di,bid])=>{let date=addDays(TODAY,o);for(let j=0;j<10;j++){const t=slotAt(bid,date,svcDur(s),di);if(t){const a=mk('u0',s,di,bid,date,t,'Completed');if(s==='cosmetic')a.next={date:addDays(TODAY,21),service:'cosmetic',time:'',note:'Veneer try-in'};break}date=addDays(date,1)}});
  /* today's board: patients at every stage of the visit */
  const board={
   b1:[['09:00','general','Completed','Completed',30],['09:00','cosmetic','On-going','Approved',90],['09:30','ortho','Arrived','Approved',60],['10:00','general','Late','Approved',30],['12:30','prostho','Scheduled','Approved',60],['14:00','laser','Scheduled','Approved',60],['15:30','general','Scheduled','Pending',30]],
   b2:[['09:00','general','Completed','Completed',30],['10:00','surgery','On-going','Approved',90],['11:00','general','Arrived','Approved',30],['14:00','cosmetic','Scheduled','Pending',90]],
   b3:[['10:00','ortho','Completed','Completed',60],['11:00','general','Arrived','Approved',30],['13:00','implants','Scheduled','Approved',90],['15:00','cosmetic','Scheduled','Pending',90]]};
  Object.entries(board).forEach(([bid,rows])=>{if(!daySlots(bid,TODAY).length)return;
    rows.forEach(([t,svc,vis,st,dur],i)=>{const u=st==='Pending'?pick(acc):pick(S.users.slice(1));
      const assigned=['Completed','On-going'].includes(vis)||(vis==='Scheduled'&&st==='Approved');
      mk(u.id,svc,assigned?dentFor(bid,TODAY,t):'',bid,TODAY,t,st,{visit:vis,dur})})});
  for(let off2=1;off2<=14;off2++){const date=addDays(TODAY,off2);
    BR.forEach(bid=>{const n=1+Math.floor(rnd()*(bid==='b1'?4:3));
      for(let k=0;k<n;k++){const svc=pick(S.services).id;const t=slotAt(bid,date,svcDur(svc));if(!t)continue;
        const ap=off2<=4||rnd()<.5;const x=ap?pick(S.users.slice(1)):pick(acc);
        mk(x.id,svc,(ap&&rnd()<.75)||(!ap&&rnd()<.25)?dentFor(bid,date,t):'',bid,date,t,ap?'Approved':'Pending')}})}
  const mkDemo=(o,s,di,bid,st)=>{let date=addDays(TODAY,o);for(let j=0;j<21;j++){const t=slotAt(bid,date,svcDur(s),di);if(t)return mk('u0',s,di,bid,date,t,st);date=addDays(date,1)}};
  const up=mkDemo(4,'cosmetic','d1','b1','Approved'),pe=mkDemo(9,'surgery','d2','b2','Pending');
  if(pe)pe.notes='Impacted lower wisdom tooth, with panoramic X-ray.';
  if(up){pushMail('received',up,up.created);pushMail('approved',up,new Date(new Date(up.created).getTime()+36e5).toISOString())}
  if(pe)pushMail('received',pe,pe.created);
  S.mails.sort((a,b)=>b.at.localeCompare(a.at));
  S.msgs=[{ref:'MSG-DEMO-1',name:'Grace Villanueva',email:'grace.sample@example.com',subject:'Do you accept HMO for cleaning?',message:'Hello! Do you accept my HMO card for cleaning and simple extraction at the Caloocan branch? Thank you.',created:new Date(Date.now()-5e7).toISOString(),read:false,sample:true,branchId:'b3'}];
  /* dentist schedule-change requests (reviewed by admin) */
  const nextDow=(from,days)=>{let d=from;for(let i=0;i<30;i++){if(days.includes(dow(d)))return d;d=addDays(d,1)}return from};
  const ago2=h=>new Date(Date.now()-36e5*h).toISOString();
  S.reqs=[
   {id:'r1',dentistId:'d1',kind:'off',date:nextDow(addDays(TODAY,6),[1,2,3]),reason:'Attending a dental conference',status:'Pending',created:ago2(20)},
   {id:'r2',dentistId:'d2',kind:'weekly',branchId:'b2',day:4,on:true,start:'13:00',end:'18:00',reason:'Hospital duty on Thursday mornings',status:'Pending',created:ago2(6)},
   {id:'r3',dentistId:'d3',kind:'off',date:addDays(TODAY,12),reason:'Seminar',status:'Approved',created:ago2(120),decidedAt:ago2(96),decidedBy:'Clinic Owner',note:'Approved. Please share the seminar details.'}
  ];
  save();return S;
}
function init(){S=store.get('sm1',null);if(!S||S.v!==4)seed();syncSvcImages()}
/* service photos always come from the current defaults, so saved demo data never points at a removed file */
function syncSvcImages(){const d={};SERVICES_DEFAULT.forEach(x=>d[x.id]=x.img);(S.services||[]).forEach(x=>{if(d[x.id])x.img=d[x.id];else delete x.img});save()}
window.addEventListener('storage',e=>{if(e.key==='sm1'){S=store.get('sm1',S);window.onDataChanged&&window.onDataChanged()}});

/* ---------- lookups ---------- */
const uById=id=>S.users.find(u=>u.id===id);
const dById=id=>S.dents.find(d=>d.id===id);
const bById=id=>S.branches.find(b=>b.id===id);
const svById=id=>S.services.find(s=>s.id===id);
const stById=id=>S.staff.find(s=>s.id===id);
const apptBy=ref=>S.appts.find(a=>a.ref===ref);
const svcName=id=>svById(id)?.name||'Not sure / other';
const fmtDur=m=>m<60?m+' min':(m%60?`${Math.floor(m/60)} hr ${m%60} min`:`${m/60} hr`);
const svcDur=id=>svById(id)?.dur||30;
const apptDur=a=>a.dur||svcDur(a.service);
const endOf=a=>Math.min(mins(a.time)+apptDur(a),1439);
const fmtRange=a=>`${fmtT(a.time)} – ${fmtT(tstr(endOf(a)))}`;
const dentName=a=>a.dentistId?(dById(a.dentistId)?.name||'Dentist'):'To be assigned';
const fmtTs=t=>fmtT(t).replace(':00','');
const bName=id=>bById(id)?.name||'Clinic';
const bShort=id=>bById(id)?.short||'Clinic';
const bIdx=id=>Math.max(0,S.branches.findIndex(b=>b.id===id));
const bChip=id=>`<span class="bchip b${(bIdx(id)%4)+1}">${esc(bShort(id))}</span>`;
const activeBranches=()=>S.branches.filter(b=>b.status==='active');
const mainBranch=()=>S.branches.find(b=>b.main&&b.status==='active')||activeBranches()[0]||S.branches[0];
const multi=()=>activeBranches().length>1;
const nextRef=date=>'SM-'+date.slice(2).replace(/-/g,'')+'-'+(++S.seq);
const logH=(a,text)=>a.history.push({at:new Date().toISOString(),text});
const dentAt=(d,bid)=>d.active!==false&&((!!d.sched[bid]&&Object.values(d.sched[bid]).some(x=>x.on))||(d.extra||[]).some(x=>x.branchId===bid&&x.date>=TODAY));
const dentsAt=bid=>S.dents.filter(d=>dentAt(d,bid));
const svcOffered=(s,bid)=>s.active!==false&&(s.branches==='all'||!bid||(s.branches||[]).includes(bid));
const svcsAt=bid=>S.services.filter(s=>svcOffered(s,bid));
const nextId=(prefix,list)=>{let n=list.length+1;while(list.some(x=>x.id===prefix+n))n++;return prefix+n};

/* human-readable hours, e.g. "Mon–Sat · 11:00 AM – 6:00 PM" */
function hoursText(b){
  const groups=[];[1,2,3,4,5,6,0].forEach(i=>{const h=b.hours[i];if(!h.on)return;const key=h.start+'-'+h.end;const g=groups.find(x=>x.key===key);if(g)g.days.push(i);else groups.push({key,days:[i],h})});
  if(!groups.length)return 'Closed';
  const rng=days=>{const s=days.slice().sort((a,b)=>((a+6)%7)-((b+6)%7));const runs=[];let cur=[s[0]];for(let k=1;k<s.length;k++){if(((s[k]+6)%7)===((s[k-1]+6)%7)+1)cur.push(s[k]);else{runs.push(cur);cur=[s[k]]}}runs.push(cur);return runs.map(r=>r.length>1?`${DAYS3[r[0]]}–${DAYS3[r[r.length-1]]}`:DAYS3[r[0]]).join(', ')};
  return groups.map(g=>`${rng(g.days)} · ${fmtT(g.h.start)} – ${fmtT(g.h.end)}`).join(' | ');
}

/* =========================================================
   SCHEDULING (branch-aware, capacity-based)
   - a time slot can hold several patients: each branch sets "patients per slot"
   - there is no per-dentist appointment length: the slot grid is one clinic-wide
     interval and staff set the time allotted when they approve a booking
   - an appointment occupies [start, start + time allotted)
========================================================= */
const slotMin=()=>S.settings.slotMin||30;
const capOf=bid=>Math.max(1,+(bById(bid)||{}).capacity||1);
/* minute windows in which dentists work at a branch on a date (weekly pattern, minus days off, plus moved days) */
function windows(bid,date,dentId){
  const b=bById(bid);if(!b||b.status==='inactive')return [];
  const bh=b.hours[dow(date)];if(!bh||!bh.on)return [];
  const out=[];
  S.dents.filter(d=>d.active!==false&&(!dentId||d.id===dentId)).forEach(d=>{
    if(d.blocked.some(x=>x.date===date))return;
    const ex=(d.extra||[]).find(x=>x.date===date);let s,e;
    if(ex){if(ex.branchId!==bid)return;s=ex.start;e=ex.end}
    else{const ds=(d.sched[bid]||{})[dow(date)];if(!ds||!ds.on)return;s=ds.start;e=ds.end}
    const st=Math.max(mins(s),mins(bh.start)),en=Math.min(mins(e),mins(bh.end));
    if(en>st)out.push({d:d.id,st,en});
  });
  return out;
}
/* slot start times (minutes) with at least one dentist on duty for the whole slot */
function daySlots(bid,date,dentId){
  const w=windows(bid,date,dentId),step=slotMin(),out=[];if(!w.length)return out;
  const lo=Math.min(...w.map(x=>x.st)),hi=Math.max(...w.map(x=>x.en));
  for(let m=lo;m+step<=hi;m+=step)if(w.some(x=>x.st<=m&&m+step<=x.en))out.push(m);
  return out;
}
const holds=a=>['Pending','Approved'].includes(a.status);
function occupancy(bid,date,m,ignoreRef){return S.appts.filter(a=>a.branchId===bid&&a.date===date&&holds(a)&&a.ref!==ignoreRef&&mins(a.time)<=m&&m<mins(a.time)+apptDur(a)).length}
function dentsOnDuty(bid,date,m){return windows(bid,date).filter(w=>m==null||(w.st<=m&&m<w.en)).map(w=>dById(w.d))}
function dutyOn(date,ids){const out=[];ids.forEach(bid=>windows(bid,date).forEach(w=>out.push({d:dById(w.d),bid,st:w.st,en:w.en})));return out}
/* patient-facing: open start times (respecting minimum notice and remaining capacity) */
function availability(date,bid,dentId,ignoreRef){
  const b=bById(bid);if(!b||b.status!=='active'||date<TODAY||date>addDays(TODAY,S.settings.advanceDays))return [];
  const cap=capOf(bid),out=[];
  daySlots(bid,date,dentId==='any'?'':dentId).forEach(m=>{
    if(date===TODAY&&m<nowMin()+S.settings.minNoticeHrs*60)return;
    const left=cap-occupancy(bid,date,m,ignoreRef);if(left>0)out.push({time:tstr(m),left});
  });
  return out;
}
const hasAvail=(date,bid,dentId,ignoreRef)=>availability(date,bid,dentId,ignoreRef).length>0;
/* staff-facing: every slot of the day with how many are booked */
function staffSlots(date,bid,ignoreRef){const cap=capOf(bid);return daySlots(bid,date).map(m=>({time:tstr(m),used:occupancy(bid,date,m,ignoreRef),cap}))}
const slotPast=(date,t)=>date===TODAY&&mins(t)<nowMin();
const hasStaffSlot=(date,bid,ignoreRef)=>date>=TODAY&&staffSlots(date,bid,ignoreRef).some(s=>s.used<s.cap&&!slotPast(date,s.time));
/* can this appointment take `dur` minutes from its start without breaking capacity or closing time? */
function fitsDur(a,dur){
  const bid=a.branchId,cap=capOf(bid),bh=(bById(bid)||{hours:{}}).hours[dow(a.date)];
  const st=mins(a.time),en=st+dur;
  if(bh&&bh.on&&en>mins(bh.end))return {ok:false,hard:true,why:`Ends after closing time (${fmtT(bh.end)})`};
  for(let m=st;m<en;m+=15){if(occupancy(bid,a.date,m,a.ref)+1>cap)return {ok:false,why:`${fmtT(tstr(m))} would go over ${cap} patient${cap>1?'s':''} per time slot`}}
  return {ok:true};
}

/* =========================================================
   EMAIL
========================================================= */
function mailContent(type,a){
  const p=uById(a.patientId)||{name:'Patient',email:''};const d=dById(a.dentistId);const b=bById(a.branchId)||mainBranch();
  const when=`${fmtD(a.date)} at ${fmtT(a.time)}${a.durSet?' – '+fmtT(tstr(endOf(a))):''}`;
  const first=p.name.split(' ')[0];let subject,intro,cta='View in patient portal',to=p.email,rows=null;
  switch(type){
   case 'received':subject=`Booking received: ${a.ref}`;intro=`Hi ${esc(first)}, we received your appointment request at our <b>${esc(b.short)}</b> clinic. It is <b>pending approval</b>. We'll email you once our staff has reviewed it.`;break;
   case 'approved':subject=`Appointment confirmed: ${fmtDs(a.date)}, ${fmtT(a.time)} (${b.short})`;intro=`Hi ${esc(first)}, good news! Your appointment is <b>approved</b>${a.durSet?` and we have set aside <b>${fmtDur(apptDur(a))}</b> for your visit`:''}. We look forward to seeing you.`;break;
   case 'rejected':subject=`Update on your appointment request (${a.ref})`;intro=`Hi ${esc(first)}, unfortunately we couldn't approve this request${a.reason?': <i>'+esc(a.reason)+'</i>':''}. Please choose another schedule.`;cta='Book another time';break;
   case 'rescheduled':subject=`Your appointment has been rescheduled (${a.ref})`;intro=`Hi ${esc(first)}, your appointment has been moved to the schedule below. Please reply or use the portal if this doesn't work for you.`;break;
   case 'cancelled':subject=`Appointment cancelled (${a.ref})`;intro=`Hi ${esc(first)}, your appointment has been <b>cancelled</b>. You're welcome to book a new schedule anytime.`;cta='Book again';break;
   case 'reminder':subject=`Reminder: your dental appointment on ${fmtDs(a.date)}`;intro=`Hi ${esc(first)}, this is a friendly reminder of your upcoming visit.`;break;
   case 'nextvisit':{const n=a.next||{};subject=`Your next visit: ${svcName(n.service)}${n.date?' around '+fmtDs(n.date):''}`;
     intro=`Hi ${esc(first)}, thank you for visiting us! Your dentist recommends a follow-up visit for <b>${esc(svcName(n.service))}</b>${n.date?' around <b>'+fmtD(n.date)+'</b>':''}${n.time?' at <b>'+fmtT(n.time)+'</b>':''}. ${n.ref?'We have already reserved this schedule for you.':'Tap below to book a time that suits you.'}`;
     cta=n.ref?'View in patient portal':'Book your next visit';
     rows=[['Last visit',fmtD(a.date)],['Recommended procedure',esc(svcName(n.service))],['Recommended date',n.date?fmtD(n.date):'To be agreed'],['Branch',esc(b.name)]];if(n.note)rows.push(['Note',esc(n.note)]);break}
   case 'admin_new':to=b.email||'smilemattersdentalcarecenter@yahoo.com';subject=`[${b.short}] New booking request: ${p.name} (${a.ref})`;intro=`A patient submitted a new appointment request for the <b>${esc(b.short)}</b> branch. Please review and approve or reject it in the dashboard.`;cta='Open dashboard';break;
  }
  if(!rows){rows=[['Reference',`<b>${esc(a.ref)}</b>`],['Patient',esc(p.name)],['Service',esc(svcName(a.service))],['Dentist',esc(d?.name||'To be assigned on arrival')],['Branch',esc(b.name)],['Schedule',`<b>${when}</b>`]];if(a.durSet)rows.push(['Time allotted',fmtDur(apptDur(a))]);if(a.notes)rows.push(['Notes',esc(a.notes)])}
  const body=`<p>${intro}</p><table>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table><p><span class="btn btn-p btn-sm" style="pointer-events:none">${cta}</span></p><p class="hint" style="margin-top:14px">${esc(b.address)}${b.landmark?' ('+esc(b.landmark)+')':''} · ${esc(b.phone)}</p>`;
  return {subject,to,body};
}
function pushMail(type,a,at){const c=mailContent(type,a);S.mails.unshift({id:'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),type,ref:a.ref,branchId:a.branchId,patientId:a.patientId,to:c.to,subject:c.subject,at:at||new Date().toISOString()})}
function notify(type,a){
  const hasMail=!!uById(a.patientId)?.email;
  if(type==='received'&&S.settings.confirm){if(hasMail)pushMail('received',a);pushMail('admin_new',a)}
  else if(['approved','rejected','rescheduled','cancelled'].includes(type)&&S.settings.status){if(hasMail)pushMail(type,a)}
  else if(type==='reminder'&&hasMail)pushMail('reminder',a);
  else if(type==='nextvisit'&&hasMail)pushMail('nextvisit',a);
}
function openMail(id){
  const m=S.mails.find(x=>x.id===id);if(!m)return;const a=apptBy(m.ref);if(!a)return;const c=mailContent(m.type,a);
  openModal('Email preview',`<div class="mail"><div class="meta"><div><b>From</b> ${esc(S.settings.clinic)} &lt;no-reply@yourdomain.com&gt;</div><div><b>To</b> ${esc(c.to)}</div><div><b>Subject</b> ${esc(c.subject)}</div><div><b>Sent</b> ${ago(m.at)}</div></div>${c.body}</div>`);
}
const mailRows=l=>l.map(m=>`<button class="mailrow" data-act="view-mail" data-id="${m.id}"><span class="mi">${ic('mail')}</span><span style="flex:1;min-width:0"><b style="display:block;font-size:.92rem">${esc(MAILNAMES[m.type]||m.type)}</b><small style="color:var(--muted);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.subject)}</small></span><small style="color:var(--muted);flex:none">${ago(m.at)}</small></button>`).join('');

/* =========================================================
   SHARED UI: modal, drawer, calendar widget, delegation
========================================================= */
function openModal(title,html,wide){$('#mtitle').textContent=title;$('#mbody').innerHTML=html;$('#mbox').classList.toggle('wide',!!wide);$('#modal').classList.add('open')}
function closeModal(){$('#modal').classList.remove('open')}
function openDrawer(html){$('#drawer').innerHTML=html;$('#drawer').classList.add('open');$('#scrim').classList.add('open')}
function closeDrawer(){$('#drawer').classList.remove('open');$('#scrim').classList.remove('open')}
$('#scrim').onclick=closeDrawer;
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeDrawer()}
  if(e.key==='Enter'&&e.target.matches&&e.target.matches('[role="button"][data-act]')){e.preventDefault();e.target.click()}});

const CAL={};
function calHTML(id,av){const c=CAL[id];const first=new Date(c.y,c.m,1);const days=new Date(c.y,c.m+1,0).getDate();
  let h=`<div class="cal"><div class="cal-h"><button type="button" class="btn btn-o btn-sm" data-act="cal-nav" data-cal="${id}" data-d="-1" aria-label="Previous month">‹</button><b>${first.toLocaleDateString('en-PH',{month:'long',year:'numeric'})}</b><button type="button" class="btn btn-o btn-sm" data-act="cal-nav" data-cal="${id}" data-d="1" aria-label="Next month">›</button></div><div class="cal-g">`+['S','M','T','W','T','F','S'].map(x=>`<span class="cal-dw">${x}</span>`).join('');
  for(let i=0;i<first.getDay();i++)h+='<span></span>';
  for(let d=1;d<=days;d++){const s=iso(new Date(c.y,c.m,d));const ok=av(s);h+=`<button type="button" class="cal-d ${ok?'av':''} ${s===c.sel?'sel':''} ${s===TODAY?'today':''}" data-act="cal-pick" data-cal="${id}" data-date="${s}" ${ok?'':'disabled'} aria-label="${fmtD(s)}${ok?'':' unavailable'}">${d}</button>`}
  return h+`</div><div class="legend"><span><i style="background:var(--p100)"></i>Available</span><span><i style="background:var(--p700)"></i>Selected</span><span><i style="background:#EAF1F6"></i>Unavailable</span></div></div>`}
function calInit(id,sel){const d=sel?parse(sel):new Date();CAL[id]={y:d.getFullYear(),m:d.getMonth(),sel:sel||''}}

/* shared info modals */
function workflowHTML(){const W=[['1','Patient','Creates an account','Patient portal → Create account','index.html#/portal'],['2','Patient','Selects branch, preferred date and time (several patients can share a slot until it is full)','Book appointment → steps 1–2','index.html#/book'],['3','Patient','Submits appointment request','Book appointment → step 3','index.html#/book'],['4','System','Sends booking confirmation email','Portal → Notifications · Admin → Email notifications','admin.html'],['5','Admin / staff','Reviews the request. Staff can also add walk-in, phone and Facebook bookings themselves','Admin → Appointments → New appointment','admin.html'],['6','Admin / staff','Approves or rejects, and sets the time allotted for the service','Admin → Appointment details → Approve','admin.html'],['7','System','Sends status notification with the time allotted','Admin → Email notifications','admin.html'],['8','Staff','Marks the patient Arrived (or Late), then On-going and assigns the dentist','Admin → Calendar or Dashboard → Today','admin.html'],['9','Dentist','Sees their own appointments, calendar and dashboard. Requests schedule changes for admin approval','Admin → sign in as a dentist','admin.html'],['10','Staff','Marks the visit Completed. The system asks for the next visit date and procedure','Admin → Complete visit','admin.html'],['11','System','Emails the next-visit recommendation and stores the appointment history','Portal → My appointments · Admin → Patients','index.html#/portal']];
  return `<div style="padding:8px 20px 20px"><p class="hint" style="margin:10px 0 14px">The proposal's 10-step flow, extended with the in-clinic stages and dentist role requested by the clinic, mapped to screens you can click through.</p><div style="overflow-x:auto"><table class="wf"><thead><tr><th>#</th><th>Who</th><th>Action</th><th>Where to see it</th></tr></thead><tbody>${W.map(w=>`<tr><td class="n">${w[0]}</td><td>${w[1]}</td><td>${w[2]}</td><td>${w[4]?`<a href="${w[4]}" style="color:var(--p600);font-weight:700">${w[3]}</a>`:w[3]}</td></tr>`).join('')}</tbody></table></div></div>`}
function scopeHTML(){const inc=[['Patient Registration & Login','Portal → Create account / Sign in'],['Appointment Booking','Book appointment (3-step wizard, branch-aware)'],['Appointment Calendar','Admin → Calendar (month, week and day views with day details)'],['Appointment Approval','Admin → Appointments (approve with time allotted, reject, reschedule)'],['Dentist Schedule Management','Admin → Dentist schedules (roster and per-branch editing)'],['Email Notifications','Confirmations, status updates, reminders, next-visit emails'],['Patient Appointment History','Portal → My appointments · Admin → Patients'],['Admin Dashboard','admin.html → Dashboard'],['Reports & Analytics','Admin → Reports (by branch, service, dentist, source)']];
  const extra=[['Multi-branch support','Admin → Branches: add or edit branches, hours, patients per slot and status.'],['Several patients per time slot','Each branch sets how many patients one slot can hold. The calendar shows how full each slot is.'],['Manual appointments','Staff add walk-in, phone and Facebook bookings, with or without a patient account.'],['Time allotted per service','Set when approving a booking, editable later. Shown as a block on the calendar.'],['Visit progress','Arrived → Late (optional) → On-going (assign dentist) → Completed, then next visit and procedure.'],['Dentist role','Dentists sign in to see their own appointments, calendar and dashboard, and request schedule changes that an admin approves.'],['Services management','Admin → Services (including default time allotted)'],['Staff & roles','Super admin, branch manager, clinic staff and dentist'],['Settings','Booking rules, time-slot interval, default hours and patients per slot']];
  return `<div style="padding:8px 22px 22px"><h4 style="margin:14px 0 8px;font-family:var(--font)">Modules in the proposal</h4><ul class="checks" style="margin:0 0 16px;gap:8px">${inc.map(i=>`<li><svg class="ic"><use href="#i-check"/></svg><span><b>${i[0]}</b><br><small style="color:var(--muted)">${i[1]}</small></span></li>`).join('')}</ul>
  <h4 style="margin:14px 0 8px;font-family:var(--font)">Added in this mock-up</h4><ul class="checks" style="margin:0 0 16px;gap:8px">${extra.map(i=>`<li><svg class="ic"><use href="#i-check"/></svg><span><b>${i[0]}</b><br><small style="color:var(--muted)">${i[1]}</small></span></li>`).join('')}</ul>
  <div class="note" style="background:var(--warn-bg);color:#6F4500"><svg class="ic"><use href="#i-shield"/></svg><span><b>Scope note:</b> multi-branch support, the dentist role, manual appointments, slot capacity and the visit-progress workflow go beyond the original Standard proposal. Review the quotation and timeline before approval. Still excluded: online payments, SMS gateway, electronic dental records, third-party subscriptions.</span></div></div>`}

/* shared actions + delegated events */
const ACT={
 'close-modal':()=>closeModal(),'close-drawer':()=>closeDrawer(),
 'workflow':()=>openModal('Patient appointment workflow',workflowHTML(),true),
 'scope':()=>openModal('Standard Package scope',scopeHTML(),true),
 'reset':()=>openModal('Reset demo data',`<div style="padding:22px"><p>This restores the sample branches, dentists, patients, appointments and emails, and removes anything you created in this mock-up.</p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px"><button class="btn btn-o" data-act="close-modal">Cancel</button><button class="btn btn-p" data-act="reset-go">Reset</button></div></div>`),
 'reset-go':()=>{seed();closeModal();closeDrawer();window.onReset&&window.onReset();toast('Demo data reset')},
 'view-mail':el=>openMail(el.dataset.id),
 'cal-nav':el=>{const c=CAL[el.dataset.cal];c.navd=true;c.m+=+el.dataset.d;if(c.m<0){c.m=11;c.y--}if(c.m>11){c.m=0;c.y++}window.onCalChange&&window.onCalChange(el.dataset.cal)},
 'cal-pick':el=>{const id=el.dataset.cal;CAL[id].sel=el.dataset.date;window.onCalPick&&window.onCalPick(id)}
};
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const fn=ACT[a.dataset.act];if(!fn)return;if(['INPUT','SELECT','TEXTAREA','LABEL'].includes(a.tagName))return;fn(a,e)});
document.addEventListener('change',e=>{const a=e.target.closest('[data-act]');if(!a||!['INPUT','SELECT','TEXTAREA'].includes(a.tagName))return;const fn=ACT[a.dataset.act];if(fn)fn(a,e)});
const setE=(f,k,m)=>{const e=$(`[data-e="${k}"]`,f);if(e)e.textContent=m||''};
document.addEventListener('input',e=>{if(e.target.classList?.contains('inp'))e.target.classList.remove('bad')});
