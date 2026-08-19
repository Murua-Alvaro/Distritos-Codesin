const $ = id => document.getElementById(id);
const nf = new Intl.NumberFormat('es-MX');
const n1 = new Intl.NumberFormat('es-MX',{minimumFractionDigits:1,maximumFractionDigits:1});
const n2 = new Intl.NumberFormat('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const state={
  mode:'districts',selectedDistrict:null,selectedAgeb:null,
  stats:null,econ:null,districts:null,agebs:null,districtLayer:null,agebLayer:null
};

const map=L.map('map',{zoomControl:true,attributionControl:true,preferCanvas:false,zoomAnimation:true,fadeAnimation:false});
const lightTiles=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:20,subdomains:'abcd',attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(map);
const osmTiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'&copy; OpenStreetMap'});

function syncMapSize(refit=false){
  requestAnimationFrame(()=>{
    map.invalidateSize({pan:false,debounceMoveend:true});
    if(refit && state.districtLayer && state.districtLayer.getBounds().isValid()){
      map.fitBounds(state.districtLayer.getBounds(),{padding:[22,22],animate:false});
    }
  });
}
let mapResizeTimer=null;
window.addEventListener('resize',()=>{
  clearTimeout(mapResizeTimer);
  mapResizeTimer=setTimeout(()=>syncMapSize(false),80);
});
if('ResizeObserver' in window){
  const mapResizeObserver=new ResizeObserver(()=>syncMapSize(false));
  const stage=document.querySelector('.map-stage');
  if(stage)mapResizeObserver.observe(stage);
}

function districtGeo(name){return state.stats.districts.find(d=>d.district===name)}
function districtEcon(name){return state.econ.districts.find(d=>d.district===name)}
function agebFeature(code){return state.agebs.features.find(f=>f.properties.CVEGEO===code)}
function agebEcon(code){return state.econ.agebs[code]}
function districtFeature(name){return state.districts.features.find(f=>f.properties.district===name)}
function colorOf(name){return districtGeo(name)?.color || '#64748b'}

function hhiLabel(value){
  if(value<.17)return 'Concentración baja';
  if(value<.22)return 'Concentración media';
  return 'Concentración relativamente alta';
}
function rankSuffix(r){return r===1?'1.º':`${r}.º`}

function districtStyle(feature){
  const name=feature.properties.district;
  const selected=state.selectedDistrict===name;
  const dimmed=state.selectedDistrict && !selected;
  return {color:selected?'#0f172a':'#ffffff',weight:selected?3:1.2,fillColor:feature.properties.color,fillOpacity:dimmed ? .13 : (selected ? .78 : .53),opacity:dimmed ? .45 : 1};
}
function agebStyle(feature){
  const p=feature.properties, selected=state.selectedAgeb===p.CVEGEO;
  const inDistrict=!state.selectedDistrict||state.selectedDistrict===p.district;
  return {color:selected?'#0f172a':(inDistrict?'#ffffff':'#cbd5e1'),weight:selected?3:.8,fillColor:p.color,fillOpacity:selected ? .78 : (inDistrict ? .40 : .07),opacity:inDistrict ? 1 : .28};
}

function popupDistrict(f){
  const p=f.properties,e=districtEcon(p.district);
  return `<div class="popup-title">${escapeHTML(p.district)}</div><div class="popup-kpi">${nf.format(e.establishments)}</div><div class="popup-meta">establecimientos · ${n2.format(e.share_codesin_pct)}% del universo CODESIN<br>${e.ageb_assigned} AGEB · HHI ${e.hhi.toFixed(3)}</div><div class="popup-link">Clic para abrir ficha económica</div>`;
}
function popupAgeb(f){
  const p=f.properties,e=agebEcon(p.CVEGEO);
  return `<div class="popup-title">AGEB ${escapeHTML(p.CVEGEO)}</div><div class="popup-kpi">${nf.format(e.establishments)}</div><div class="popup-meta">establecimientos · ${escapeHTML(p.district)}<br>${n1.format(e.est_per_km2)} estab./km²</div><div class="popup-link">Clic para abrir detalle</div>`;
}

function initLayers(){
  state.districtLayer=L.geoJSON(state.districts,{style:districtStyle,onEachFeature:(f,l)=>{
    l.bindTooltip(f.properties.district,{sticky:true,direction:'top',opacity:.94});
    l.bindPopup(popupDistrict(f));
    l.on('click',()=>selectDistrict(f.properties.district,true));
    l.on('mouseover',()=>{if(state.selectedDistrict!==f.properties.district)l.setStyle({weight:2,fillOpacity:.68})});
    l.on('mouseout',()=>state.districtLayer.resetStyle(l));
  }}).addTo(map);
  state.agebLayer=L.geoJSON(state.agebs,{style:agebStyle,onEachFeature:(f,l)=>{
    const e=agebEcon(f.properties.CVEGEO);
    l.bindTooltip(`AGEB ${f.properties.CVEGEO} · ${nf.format(e.establishments)} establecimientos`,{sticky:true,direction:'top',opacity:.94});
    l.bindPopup(popupAgeb(f));
    l.on('click',()=>selectAgeb(f.properties.CVEGEO,true));
  }});
  syncMapSize(false);
  setTimeout(()=>{syncMapSize(true)},40);
}


function refreshStyles(){
  if(state.districtLayer)state.districtLayer.setStyle(districtStyle);
  if(state.agebLayer)state.agebLayer.setStyle(agebStyle);
}

function setMode(mode){
  state.mode=mode;
  document.querySelectorAll('#viewMode button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  if(mode==='districts'){
    if(map.hasLayer(state.agebLayer))map.removeLayer(state.agebLayer);
    if(!map.hasLayer(state.districtLayer))state.districtLayer.addTo(map);
  }else{
    if(map.hasLayer(state.districtLayer))map.removeLayer(state.districtLayer);
    if(!map.hasLayer(state.agebLayer))state.agebLayer.addTo(map);
  }
  refreshStyles();
  updateMapContext();
}

function selectDistrict(name,zoom=false){
  state.selectedDistrict=name||null;state.selectedAgeb=null;$('districtSelect').value=name||'';
  if(state.mode!=='districts')setMode('districts');
  refreshStyles();renderDetails();renderRanking();updateMapContext();
  document.querySelector('.right-panel')?.scrollTo({top:0,behavior:'smooth'});
  if(name&&zoom){syncMapSize(false);const target=L.geoJSON(districtFeature(name));setTimeout(()=>map.fitBounds(target.getBounds(),{padding:[38,38],maxZoom:14,animate:false}),30)}
  $('mapHint').textContent=name?`${name} · selecciona “AGEB” para explorar el detalle interno`:'Selecciona un distrito para abrir su ficha económica';
}

function selectAgeb(code,zoom=false){
  const f=agebFeature(code);if(!f)return;
  state.selectedAgeb=code;state.selectedDistrict=f.properties.district;$('districtSelect').value=state.selectedDistrict;
  if(state.mode!=='agebs')setMode('agebs');
  refreshStyles();renderDetails();renderRanking();updateMapContext();
  document.querySelector('.right-panel')?.scrollTo({top:0,behavior:'smooth'});
  if(zoom){syncMapSize(false);const target=L.geoJSON(f);setTimeout(()=>map.fitBounds(target.getBounds(),{padding:[70,70],maxZoom:16,animate:false}),30)}
  $('mapHint').textContent=`AGEB ${code} · ${nf.format(agebEcon(code).establishments)} establecimientos`;
}

function resetView(){
  state.selectedDistrict=null;state.selectedAgeb=null;$('districtSelect').value='';$('searchInput').value='';$('searchResults').innerHTML='';
  setMode('districts');renderDetails();renderRanking();refreshStyles();updateMapContext();
  syncMapSize(false);
  setTimeout(()=>map.fitBounds(state.districtLayer.getBounds(),{padding:[22,22],animate:false}),30);
  $('mapHint').textContent='Selecciona un distrito para abrir su ficha económica';
}

function renderBaseUI(){
  const m=state.econ.meta;
  $('kpiMapped').textContent=nf.format(m.codesin_assigned_total);$('kpiCoverage').textContent=`${n2.format(m.coverage_pct)}%`;
  $('kpiDistricts').textContent=m.district_count;$('kpiAgebs').textContent=m.ageb_membership;
  $('municipalTotal').textContent=nf.format(m.municipal_total);$('outsideTotal').textContent=nf.format(m.outside_total);

  const sel=$('districtSelect');
  state.econ.districts.slice().sort((a,b)=>a.district.localeCompare(b.district,'es')).forEach(d=>{
    const o=document.createElement('option');o.value=d.district;o.textContent=`${d.district} · ${nf.format(d.establishments)}`;sel.appendChild(o)
  });

  $('legendItems').innerHTML=state.econ.districts.slice().sort((a,b)=>a.district.localeCompare(b.district,'es')).map(d=>`<div class="legend-row" data-district="${escapeHTML(d.district)}" title="${escapeHTML(d.district)}"><i class="legend-dot" style="background:${d.color}"></i><span>${escapeHTML(d.district)}</span></div>`).join('');
  document.querySelectorAll('.legend-row').forEach(el=>el.addEventListener('click',()=>selectDistrict(el.dataset.district,true)));
  renderRanking();
}

const rankMeta={
  establishments:{label:'establecimientos',format:v=>nf.format(v),higher:true},
  est_per_ageb:{label:'estab./AGEB',format:v=>n1.format(v),higher:true},
  est_per_km2:{label:'estab./km²',format:v=>n1.format(v),higher:true},
  hhi:{label:'HHI',format:v=>Number(v).toFixed(3),higher:true}
};
function renderRanking(){
  const key=$('rankMetric').value||'establishments',meta=rankMeta[key];
  const arr=state.econ.districts.slice().sort((a,b)=>b[key]-a[key]);const max=Math.max(...arr.map(d=>d[key]));
  $('ranking').innerHTML=arr.map(d=>`<div class="rank-row" data-district="${escapeHTML(d.district)}" title="${escapeHTML(d.district)} · ${meta.format(d[key])} ${meta.label}"><div class="rank-name">${escapeHTML(d.district)}</div><div class="rank-track"><div class="rank-bar" style="width:${Math.max(4,d[key]/max*100)}%;background:${d.color};opacity:${state.selectedDistrict && state.selectedDistrict !== d.district ? .24 : 1}"></div></div><div class="rank-value">${meta.format(d[key])}</div></div>`).join('');
  document.querySelectorAll('.rank-row').forEach(el=>el.addEventListener('click',()=>selectDistrict(el.dataset.district,true)));
}

function renderSectorBars(targetId,items,color,emptyText='Sin actividad registrada en este corte'){
  const box=$(targetId);if(!items?.length){box.innerHTML=`<div class="search-empty">${emptyText}</div>`;return}
  const max=Math.max(...items.map(x=>x.share_pct));
  box.innerHTML=items.map(x=>`<div class="sector-row"><div class="sector-main"><div class="sector-label"><span title="${escapeHTML(x.code+' · '+x.name)}">${escapeHTML(x.code)} · ${escapeHTML(x.name)}</span><strong>${n1.format(x.share_pct)}%</strong></div><div class="sector-track"><div class="sector-fill" style="width:${x.share_pct/max*100}%;background:${color}"></div></div></div><div class="sector-count">${nf.format(x.count)}</div></div>`).join('');
}

function renderLQ(items){
  $('lqList').innerHTML=items?.length?items.map(x=>`<div class="lq-row"><div><strong>${escapeHTML(x.code)} · ${escapeHTML(x.name)}</strong><small>${nf.format(x.count)} establecimientos</small></div><div class="lq-value">LQ ${x.lq.toFixed(2)}</div></div>`).join(''):'<div class="search-empty">Sin especializaciones con n≥20.</div>';
}

function renderDistrictDetail(name){
  const d=districtEcon(name),g=districtGeo(name);
  $('detailColor').style.background=d.color;$('detailName').textContent=d.district;
  $('detailBadges').innerHTML=`<span class="detail-badge blue">${rankSuffix(d.stock_rank)} por stock</span><span class="detail-badge">${rankSuffix(d.intensity_rank)} por estab./AGEB</span>`;
  $('detailEstablishments').textContent=nf.format(d.establishments);$('detailStockRank').textContent=`${rankSuffix(d.stock_rank)} de 13 por stock`;
  $('detailShareCodesin').textContent=`${n2.format(d.share_codesin_pct)}%`;$('detailShareMunicipal').textContent=`${n2.format(d.share_municipal_pct)}%`;
  $('detailActiveAgebs').textContent=d.ageb_active;$('detailAssignedAgebs').textContent=`de ${d.ageb_assigned} asignadas`;
  $('detailPerAgeb').textContent=n1.format(d.est_per_ageb);$('detailIntensityRank').textContent=`${rankSuffix(d.intensity_rank)} de 13`;
  $('detailPerKm2').textContent=n1.format(d.est_per_km2);
  renderSectorBars('sectorBars',d.top_sectors,d.color);renderLQ(d.specializations);
  $('detailHHI').textContent=d.hhi.toFixed(3);$('detailHHIText').textContent=hhiLabel(d.hhi);$('detailClasses').textContent=nf.format(d.scian_classes);
  $('detailMicro').textContent=`${n1.format(d.micro_0_10_pct)}%`;$('detailLarge').textContent=`${n1.format(d.large_31_plus_pct)}%`;
  $('detailArea').textContent=`${n2.format(d.area_km2)} km²`;$('territoryAgebAssigned').textContent=d.ageb_assigned;$('territoryAgebActive').textContent=d.ageb_active;$('territoryArea').textContent=`${n2.format(d.area_km2)} km²`;
  renderAgebList(name);
}

function renderAgebList(name){
  const items=state.agebs.features.filter(f=>f.properties.district===name);
  const enriched=items.map(f=>({f,e:agebEcon(f.properties.CVEGEO)})).sort((a,b)=>b.e.establishments-a.e.establishments);
  $('agebListCount').textContent=`${enriched.length} AGEB`;
  $('agebList').innerHTML=enriched.map(({f,e})=>`<div class="ageb-row"><button data-code="${f.properties.CVEGEO}">${f.properties.CVEGEO}</button><span><em>${nf.format(e.establishments)} estab.</em>${n2.format(e.area_km2)} km²</span></div>`).join('');
  document.querySelectorAll('.ageb-row button').forEach(b=>b.addEventListener('click',()=>selectAgeb(b.dataset.code,true)));
}

function renderAgebDetail(code){
  const f=agebFeature(code),p=f.properties,e=agebEcon(code);
  $('agebDetailColor').style.background=p.color;$('agebCode').textContent=p.CVEGEO;$('agebDistrictName').textContent=p.district;
  $('agebEstablishments').textContent=nf.format(e.establishments);$('agebArea').textContent=n2.format(e.area_km2);$('agebDensity').textContent=n1.format(e.est_per_km2||0);
  $('agebClasses').textContent=nf.format(e.scian_classes);$('agebMicro').textContent=e.micro_0_10_pct==null?'—':`${n1.format(e.micro_0_10_pct)}%`;
  renderSectorBars('agebSectorBars',e.top_sectors,p.color);
  $('agebCoords').textContent=`${Number(p.centroid_lat).toFixed(4)}, ${Number(p.centroid_lon).toFixed(4)}`;$('agebShortCode').textContent=e.ageb;
}

function renderDetails(){
  $('emptyDetail').classList.toggle('hidden',!!(state.selectedDistrict||state.selectedAgeb));$('districtDetail').classList.add('hidden');$('agebDetail').classList.add('hidden');
  if(state.selectedAgeb){$('agebDetail').classList.remove('hidden');renderAgebDetail(state.selectedAgeb);return}
  if(state.selectedDistrict){$('districtDetail').classList.remove('hidden');renderDistrictDetail(state.selectedDistrict)}
}

function updateMapContext(){
  if(state.selectedAgeb){const e=agebEcon(state.selectedAgeb);$('mapContextTitle').textContent=`AGEB ${e.ageb}`;$('mapContextMeta').textContent=`${nf.format(e.establishments)} establecimientos · ${e.district}`;return}
  if(state.selectedDistrict){const e=districtEcon(state.selectedDistrict);$('mapContextTitle').textContent=e.district;$('mapContextMeta').textContent=`${nf.format(e.establishments)} establecimientos · ${n2.format(e.share_codesin_pct)}% CODESIN`;return}
  $('mapContextTitle').textContent=state.mode==='districts'?'13 distritos CODESIN':'295 AGEB corregidas';$('mapContextMeta').textContent=state.mode==='districts'?'25,422 establecimientos · 295 AGEB':'262 AGEB activas en DENUE 05/2025';
}

function handleSearch(q){
  const box=$('searchResults');q=q.trim().toLowerCase();if(!q){box.innerHTML='';return}
  const ds=state.econ.districts.filter(d=>d.district.toLowerCase().includes(q)).slice(0,4).map(d=>({type:'district',label:d.district,sub:`${nf.format(d.establishments)} estab.`,value:d.district}));
  const ag=state.agebs.features.filter(f=>f.properties.CVEGEO.toLowerCase().includes(q)||f.properties.CVEGEO.slice(-4).toLowerCase().includes(q)).slice(0,7).map(f=>({type:'ageb',label:f.properties.CVEGEO,sub:`${nf.format(agebEcon(f.properties.CVEGEO).establishments)} · ${f.properties.district}`,value:f.properties.CVEGEO}));
  const items=[...ds,...ag].slice(0,9);
  box.innerHTML=items.length?items.map((x,i)=>`<div class="search-item" data-i="${i}"><strong>${escapeHTML(x.label)}</strong><small>${escapeHTML(x.sub)}</small></div>`).join(''):'<div class="search-empty">Sin coincidencias</div>';
  box.querySelectorAll('.search-item').forEach(el=>el.addEventListener('click',()=>{const x=items[Number(el.dataset.i)];x.type==='district'?selectDistrict(x.value,true):selectAgeb(x.value,true);box.innerHTML='';$('searchInput').value=x.label}));
}

$('districtSelect').addEventListener('change',e=>e.target.value?selectDistrict(e.target.value,true):resetView());
document.querySelectorAll('#viewMode button').forEach(b=>b.addEventListener('click',()=>{const mode=b.dataset.mode;if(mode==='districts'&&state.selectedAgeb){state.selectedAgeb=null;renderDetails()}setMode(mode);updateMapContext();$('mapHint').textContent=mode==='districts'?'Selecciona un distrito para abrir su ficha económica':'Selecciona una AGEB para revisar su actividad económica'}));
$('searchInput').addEventListener('input',e=>handleSearch(e.target.value));$('rankMetric').addEventListener('change',renderRanking);$('fitBtn').addEventListener('click',resetView);
$('goDistrictBtn').addEventListener('click',()=>{const d=state.selectedDistrict;state.selectedAgeb=null;setMode('districts');selectDistrict(d,true)});
$('lightBase').addEventListener('click',()=>{if(map.hasLayer(osmTiles))map.removeLayer(osmTiles);if(!map.hasLayer(lightTiles))lightTiles.addTo(map);$('lightBase').classList.add('active');$('osmBase').classList.remove('active')});
$('osmBase').addEventListener('click',()=>{if(map.hasLayer(lightTiles))map.removeLayer(lightTiles);if(!map.hasLayer(osmTiles))osmTiles.addTo(map);$('osmBase').classList.add('active');$('lightBase').classList.remove('active')});
$('aboutBtn').addEventListener('click',()=>$('modal').classList.remove('hidden'));document.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>$('modal').classList.add('hidden')));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').classList.add('hidden');$('searchResults').innerHTML=''}});

Promise.all([
  fetch('data/stats.json').then(r=>{if(!r.ok)throw new Error('stats');return r.json()}),
  fetch('data/economic_stats.json').then(r=>{if(!r.ok)throw new Error('economic_stats');return r.json()}),
  fetch('data/distritos.geojson').then(r=>{if(!r.ok)throw new Error('distritos');return r.json()}),
  fetch('data/agebs.geojson').then(r=>{if(!r.ok)throw new Error('agebs');return r.json()})
]).then(([stats,econ,districts,agebs])=>{
  state.stats=stats;state.econ=econ;state.districts=districts;state.agebs=agebs;
  renderBaseUI();initLayers();renderDetails();updateMapContext();
  setTimeout(()=>{ $('loading').classList.add('done'); syncMapSize(true); },180);
  setTimeout(()=>syncMapSize(false),500);
}).catch(err=>{console.error(err);$('loading').innerHTML='<div class="loading-card"><strong>No se pudo cargar la cartografía o los indicadores</strong><small>Abre el sitio mediante GitHub Pages o un servidor HTTP local.</small></div>'});
