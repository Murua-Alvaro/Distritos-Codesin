const state = { stats:null, districts:null, agebs:null, districtLayer:null, agebLayer:null, selectedDistrict:null, selectedAgeb:null, mode:'districts' };

const $ = (id)=>document.getElementById(id);
const escapeHTML = (s)=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const map = L.map('map',{zoomControl:false, preferCanvas:true}).setView([23.245,-106.42],12);
L.control.zoom({position:'bottomright'}).addTo(map);
const lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'}).addTo(map);
const osmTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap'});

function districtStyle(feature){
  const selected = state.selectedDistrict === feature.properties.district;
  return { color:selected?'#0f172a':'#ffffff', weight:selected?3:1.25, fillColor:feature.properties.color, fillOpacity:selected ? .72 : .50, opacity:1 };
}
function agebStyle(feature){
  const selectedA = state.selectedAgeb === feature.properties.CVEGEO;
  const inDistrict = !state.selectedDistrict || state.selectedDistrict === feature.properties.district;
  return { color:selectedA?'#0f172a':(inDistrict?'#ffffff':'#cbd5e1'), weight:selectedA?3:.8, fillColor:feature.properties.color, fillOpacity:selectedA ? .75 : (inDistrict ? .36 : .08), opacity:inDistrict?1:.35 };
}

function popupDistrict(f){const p=f.properties;return `<div class="popup-title">${escapeHTML(p.district)}</div><div class="popup-meta">${p.ageb_count} AGEBS · ${Number(p.area_km2).toLocaleString('es-MX')} km²</div><div class="popup-link">Clic para abrir detalle</div>`}
function popupAgeb(f){const p=f.properties;return `<div class="popup-title">AGEB ${escapeHTML(p.CVEGEO)}</div><div class="popup-meta">${escapeHTML(p.district)} · ${Number(p.area_km2).toFixed(2)} km²</div><div class="popup-link">Clic para abrir detalle</div>`}

function initLayers(){
  state.districtLayer=L.geoJSON(state.districts,{style:districtStyle,onEachFeature:(f,l)=>{
    l.bindTooltip(f.properties.district,{sticky:true,direction:'top',opacity:.9}); l.bindPopup(popupDistrict(f));
    l.on('click',()=>selectDistrict(f.properties.district,true));
    l.on('mouseover',()=>{ if(state.selectedDistrict!==f.properties.district) l.setStyle({weight:2,fillOpacity:.63}); });
    l.on('mouseout',()=>state.districtLayer.resetStyle(l));
  }}).addTo(map);
  state.agebLayer=L.geoJSON(state.agebs,{style:agebStyle,onEachFeature:(f,l)=>{
    l.bindTooltip(`AGEB ${f.properties.CVEGEO}`,{sticky:true,direction:'top',opacity:.9}); l.bindPopup(popupAgeb(f));
    l.on('click',()=>selectAgeb(f.properties.CVEGEO,true));
  }});
  map.fitBounds(state.districtLayer.getBounds(),{padding:[18,18]});
}

function districtStat(name){return state.stats.districts.find(d=>d.district===name)}
function agebFeature(code){return state.agebs.features.find(f=>f.properties.CVEGEO===code)}
function districtFeature(name){return state.districts.features.find(f=>f.properties.district===name)}

function selectDistrict(name, zoom=false){
  state.selectedDistrict=name||null; state.selectedAgeb=null; $('districtSelect').value=name||'';
  refreshStyles(); renderDetails(); renderRanking(); renderAgebList();
  if(name&&zoom){const target=L.geoJSON(districtFeature(name));map.fitBounds(target.getBounds(),{padding:[34,34],maxZoom:14});}
  $('mapHint').textContent=name?`${name} · clic en una AGEB para mayor detalle`:'Selecciona un distrito para ver su detalle';
}
function selectAgeb(code, zoom=false){
  const f=agebFeature(code); if(!f)return; state.selectedAgeb=code; state.selectedDistrict=f.properties.district; $('districtSelect').value=state.selectedDistrict;
  if(state.mode!=='agebs') setMode('agebs');
  refreshStyles(); renderDetails(); renderRanking();
  if(zoom){const target=L.geoJSON(f);map.fitBounds(target.getBounds(),{padding:[60,60],maxZoom:16});}
}
function refreshStyles(){ if(state.districtLayer) state.districtLayer.setStyle(districtStyle); if(state.agebLayer) state.agebLayer.setStyle(agebStyle); }

function setMode(mode){
  state.mode=mode; document.querySelectorAll('#viewMode button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  if(mode==='districts'){ if(map.hasLayer(state.agebLayer))map.removeLayer(state.agebLayer); if(!map.hasLayer(state.districtLayer))state.districtLayer.addTo(map); }
  else { if(map.hasLayer(state.districtLayer))map.removeLayer(state.districtLayer); if(!map.hasLayer(state.agebLayer))state.agebLayer.addTo(map); }
  refreshStyles();
}

function renderBaseUI(){
  $('kpiDistricts').textContent=state.stats.district_count; $('kpiAgebs').textContent=state.stats.ageb_count; $('kpiDup').textContent=state.stats.duplicate_memberships; $('kpiCoverage').textContent=`${state.stats.district_membership_coverage_pct}%`;
  const sel=$('districtSelect'); state.stats.districts.slice().sort((a,b)=>a.district.localeCompare(b.district,'es')).forEach(d=>{const o=document.createElement('option');o.value=d.district;o.textContent=`${d.district} · ${d.ageb_count}`;sel.appendChild(o)});
  $('legendItems').innerHTML=state.stats.districts.slice().sort((a,b)=>a.district.localeCompare(b.district,'es')).map(d=>`<div class="legend-row" data-district="${escapeHTML(d.district)}"><i class="legend-dot" style="background:${d.color}"></i><span>${escapeHTML(d.district)}</span></div>`).join('');
  document.querySelectorAll('.legend-row').forEach(el=>el.addEventListener('click',()=>selectDistrict(el.dataset.district,true)));
  renderRanking();
}
function renderRanking(){
  const arr=state.stats.districts.slice().sort((a,b)=>b.ageb_count-a.ageb_count), max=Math.max(...arr.map(d=>d.ageb_count));
  $('ranking').innerHTML=arr.map(d=>`<div class="rank-row" data-district="${escapeHTML(d.district)}" title="${escapeHTML(d.district)}"><div class="rank-name">${escapeHTML(d.district)}</div><div class="rank-track"><div class="rank-bar" style="width:${d.ageb_count/max*100}%;background:${d.color};opacity:${state.selectedDistrict && state.selectedDistrict !== d.district ? .25 : 1}"></div></div><div class="rank-value">${d.ageb_count}</div></div>`).join('');
  document.querySelectorAll('.rank-row').forEach(el=>el.addEventListener('click',()=>selectDistrict(el.dataset.district,true)));
}
function renderDetails(){
  $('emptyDetail').classList.toggle('hidden',!!(state.selectedDistrict||state.selectedAgeb)); $('districtDetail').classList.add('hidden'); $('agebDetail').classList.add('hidden');
  if(state.selectedAgeb){
    const p=agebFeature(state.selectedAgeb).properties; $('agebDetail').classList.remove('hidden'); $('agebDetailColor').style.background=p.color; $('agebCode').textContent=p.CVEGEO; $('agebDistrictName').textContent=p.district; $('agebArea').textContent=Number(p.area_km2).toFixed(3); $('agebCoords').textContent=`${Number(p.centroid_lat).toFixed(4)}, ${Number(p.centroid_lon).toFixed(4)}`; return;
  }
  if(state.selectedDistrict){
    const d=districtStat(state.selectedDistrict); $('districtDetail').classList.remove('hidden'); $('detailColor').style.background=d.color; $('detailName').textContent=d.district; $('detailAgebs').textContent=d.ageb_count; $('detailArea').textContent=Number(d.area_km2).toFixed(2); $('detailShare').textContent=`${Number(d.share_ageb_pct).toFixed(1)}%`; $('detailAvg').textContent=Number(d.avg_ageb_km2).toFixed(2); renderAgebList();
  }
}
function renderAgebList(){
  if(!state.selectedDistrict)return; const items=state.agebs.features.filter(f=>f.properties.district===state.selectedDistrict).sort((a,b)=>a.properties.CVEGEO.localeCompare(b.properties.CVEGEO)); $('agebListCount').textContent=`${items.length} registros`; $('agebList').innerHTML=items.map(f=>`<div class="ageb-row"><button data-code="${f.properties.CVEGEO}">${f.properties.CVEGEO}</button><span>${Number(f.properties.area_km2).toFixed(2)} km²</span></div>`).join(''); document.querySelectorAll('.ageb-row button').forEach(b=>b.addEventListener('click',()=>selectAgeb(b.dataset.code,true)));
}

function handleSearch(q){
  const box=$('searchResults'); q=q.trim().toLowerCase(); if(!q){box.innerHTML='';return}
  const ds=state.stats.districts.filter(d=>d.district.toLowerCase().includes(q)).slice(0,4).map(d=>({type:'district',label:d.district,sub:`${d.ageb_count} AGEBS`,value:d.district}));
  const ag=state.agebs.features.filter(f=>f.properties.CVEGEO.includes(q)).slice(0,7).map(f=>({type:'ageb',label:f.properties.CVEGEO,sub:f.properties.district,value:f.properties.CVEGEO}));
  const items=[...ds,...ag].slice(0,9); box.innerHTML=items.length?items.map((x,i)=>`<div class="search-item" data-i="${i}"><strong>${escapeHTML(x.label)}</strong><small>${escapeHTML(x.sub)}</small></div>`).join(''):'<div class="search-empty">Sin coincidencias</div>';
  box.querySelectorAll('.search-item').forEach(el=>el.addEventListener('click',()=>{const x=items[Number(el.dataset.i)]; x.type==='district'?selectDistrict(x.value,true):selectAgeb(x.value,true); box.innerHTML=''; $('searchInput').value=x.label;}));
}

$('districtSelect').addEventListener('change',e=>selectDistrict(e.target.value,true));
document.querySelectorAll('#viewMode button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('searchInput').addEventListener('input',e=>handleSearch(e.target.value));
$('fitBtn').addEventListener('click',()=>{state.selectedDistrict=null;state.selectedAgeb=null;$('districtSelect').value='';renderDetails();refreshStyles();renderRanking();map.fitBounds(state.districtLayer.getBounds(),{padding:[18,18]});});
$('goDistrictBtn').addEventListener('click',()=>{const d=state.selectedDistrict;state.selectedAgeb=null;setMode('districts');selectDistrict(d,true)});
$('lightBase').addEventListener('click',()=>{map.removeLayer(osmTiles);lightTiles.addTo(map);$('lightBase').classList.add('active');$('osmBase').classList.remove('active')});
$('osmBase').addEventListener('click',()=>{map.removeLayer(lightTiles);osmTiles.addTo(map);$('osmBase').classList.add('active');$('lightBase').classList.remove('active')});
$('aboutBtn').addEventListener('click',()=>$('modal').classList.remove('hidden'));document.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>$('modal').classList.add('hidden')));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('modal').classList.add('hidden');$('searchResults').innerHTML='';}});

Promise.all([fetch('data/stats.json').then(r=>r.json()),fetch('data/distritos.geojson').then(r=>r.json()),fetch('data/agebs.geojson').then(r=>r.json())]).then(([stats,districts,agebs])=>{
  state.stats=stats;state.districts=districts;state.agebs=agebs;renderBaseUI();initLayers();setTimeout(()=>$('loading').classList.add('done'),250);
}).catch(err=>{console.error(err);$('loading').innerHTML='<div class="loading-card"><strong>No se pudo cargar la cartografía</strong><small>Abre el sitio mediante GitHub Pages o un servidor HTTP local.</small></div>'});
