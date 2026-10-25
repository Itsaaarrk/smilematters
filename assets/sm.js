/* =========================================================
   Smile Matters landing page
   Branch switcher (hero), services bento, branch cards with
   weekly hours, and a before/after compare slider.
========================================================= */
const SM_PHOTOS={b1:['assets/img/pasig-team.jpg','The Smile Matters team at the Pasig clinic'],b2:['assets/img/marikina-chair.jpg','A treatment room at SMILE 2.0 Marikina'],b3:['assets/img/caloocan-team.jpg','The Smile Matters Dental Studio team in Caloocan']};
const SM_BRAND={b1:'Main clinic',b2:'SMILE 2.0',b3:'Dental Studio'};
let smBranch=null;
const smOrder=[1,2,3,4,5,6,0];
function smPhoto(b){return SM_PHOTOS[b.id]||['assets/img/pasig-team.jpg',b.name]}
function smHours(b){
  return `<table class="sm-hrs"><tbody>${smOrder.map(i=>{const h=b.hours[i];const today=dow(TODAY)===i;return `<tr class="${today?'today':''}"><th>${DAYS3[i]}</th><td>${h&&h.on?`${fmtT(h.start)} – ${fmtT(h.end)}`:'<span class="closed">Closed</span>'}</td></tr>`}).join('')}</tbody></table>`;
}
function smOpenNow(b){const h=b.hours[dow(TODAY)];if(!h||!h.on)return 'Closed today';const m=nowMin();if(m<mins(h.start))return `Opens ${fmtT(h.start)} today`;if(m<mins(h.end))return `Open now · until ${fmtT(h.end)}`;return 'Closed for today'}
function smDir(b){return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(b.map||b.address)}
function renderLanding(){
  if(typeof S==='undefined')return;
  const act=S.branches.filter(b=>b.status==='active');
  const sw=document.getElementById('smSwitch');
  if(sw&&act.length){
    if(!smBranch||!act.some(b=>b.id===smBranch))smBranch=(act.find(b=>b.main)||act[0]).id;
    const b=act.find(x=>x.id===smBranch);const ph=smPhoto(b);
    sw.innerHTML=`<div class="sm-tabs" role="tablist" aria-label="Choose a branch">${act.map(x=>`<button type="button" role="tab" aria-selected="${x.id===smBranch}" class="sm-tab ${x.id===smBranch?'on':''}" data-smbranch="${x.id}">${esc(x.short)}</button>`).join('')}</div>
    <div class="sm-switch-card">
      <div class="sm-switch-photo"><img src="${ph[0]}" alt="${esc(ph[1])}"><span class="sm-live ${/Open now/.test(smOpenNow(b))?'on':''}"><i></i>${esc(smOpenNow(b))}</span></div>
      <div class="sm-switch-body">
        <small>${esc(SM_BRAND[b.id]||'Branch')}</small>
        <h3>${esc(b.name)}</h3>
        <p class="addr">${ic('pin')}<span>${esc(b.address)}</span></p>
        <p class="addr">${ic('phone')}<span>${esc(b.phone)}${b.phone2?' · '+esc(b.phone2):''}</span></p>
        <div class="sm-switch-cta"><a class="btn btn-p btn-sm" href="#/book" data-branch-book="${b.id}">${ic('cal')}Book at ${esc(b.short)}</a><a class="sm-textlink" href="${smDir(b)}" target="_blank" rel="noopener">Directions${ic('arrow')}</a></div>
      </div>
    </div>`;
  }
  const sv=document.getElementById('smServices');
  if(sv){
    const list=S.services.filter(s=>s.active!==false);
    const feat=list.find(s=>s.hl)||list[0];const rest=list.filter(s=>s!==feat);
    sv.innerHTML=(feat?`<a class="sm-svc feat" href="#/services" data-svc="${feat.id}">${feat.img?`<img src="${feat.img}" alt="">`:''}<div class="sm-svc-in"><span class="sm-chip">${esc(feat.cat||'Featured')}</span><h3>${esc(feat.name)}</h3><p>${esc(feat.short)}</p><span class="more">Explore ${ic('arrow')}</span></div></a>`:'')+
      rest.map((s,i)=>`<a class="sm-svc ${i%3===1?'alt':''} ${i>=rest.length-((4-((4+rest.length)%4))%4)?'wide':''}" href="#/services" data-svc="${s.id}"><span class="sm-svc-ic">${ic(s.icon)}</span><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p><span class="more">Learn more ${ic('arrow')}</span></a>`).join('');
  }
  const bg=document.getElementById('smBranches');
  if(bg){
    const vis=S.branches.filter(b=>b.status!=='inactive');
    bg.innerHTML=vis.map(b=>{const ph=smPhoto(b);return `<article class="sm-branch">
      <div class="sm-branch-photo"><img src="${ph[0]}" alt="${esc(ph[1])}"><span>${esc(b.short)}</span></div>
      <div class="sm-branch-body">
        <small>${esc(SM_BRAND[b.id]||'Branch')}${b.main?' · Main branch':''}</small>
        <h3>${esc(b.name)}</h3>
        <p class="addr">${ic('pin')}<span>${esc(b.address)}${b.landmark?`<br><em>${esc(b.landmark)}</em>`:''}</span></p>
        <p class="addr">${ic('phone')}<span>${esc(b.phone)}${b.phone2?'<br>'+esc(b.phone2):''}</span></p>
        ${smHours(b)}
        ${b.status==='active'?`<div class="sm-branch-cta"><a class="btn btn-p btn-sm" href="#/book" data-branch-book="${b.id}">${ic('cal')}Book here</a><a class="sm-textlink" href="${smDir(b)}" target="_blank" rel="noopener">Directions${ic('arrow')}</a></div>`:'<span class="tag soon">Coming soon</span>'}
      </div></article>`}).join('');
  }
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-smbranch]');if(t){smBranch=t.dataset.smbranch;renderLanding();return}
  const sc=e.target.closest('[data-scroll]');if(sc){e.preventDefault();const go=()=>{const el=document.getElementById(sc.dataset.scroll);el&&el.scrollIntoView({behavior:'smooth'})};if(location.hash&&location.hash!=='#/home'){location.hash='#/home';setTimeout(go,80)}else go()}
});
document.addEventListener('keydown',e=>{const t=e.target.closest&&e.target.closest('.sm-tab');if(!t||!['ArrowRight','ArrowLeft'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('.sm-tab')];let i=(tabs.indexOf(t)+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;smBranch=tabs[i].dataset.smbranch;renderLanding();document.querySelectorAll('.sm-tab')[i].focus()});
(function(){const r=document.getElementById('smRange'),c=document.getElementById('smCompare');if(r&&c)r.addEventListener('input',()=>c.style.setProperty('--pos',r.value+'%'))})();
renderLanding();
