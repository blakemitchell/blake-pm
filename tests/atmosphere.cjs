const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const source = fs.readFileSync('public/js/atmosphere.js','utf8');
function setup({stored={},reduced=false,hidden=false,time='2026-09-15T11:11:11',blocked=false}={}) {
 const nodes=new Map(), intervals=[], timers=new Map(); const storage=new Map(Object.entries(stored));
 function element(id){if(nodes.has(id))return nodes.get(id);const handlers={};const n={id,hidden:true,dataset:{},style:{},classList:{toggle(){},add(){},remove(){}},handlers,addEventListener(t,f){(handlers[t]??=[]).push(f)},setAttribute(k,v){this[k]=v},focus(){},contains(){return false},matches(){return false},getBoundingClientRect(){return {left:900,right:943,top:7,height:43,bottom:50}},animate(){return {finished:Promise.resolve(),cancel(){}}},querySelector(){return options[0]},querySelectorAll(){return options}};nodes.set(id,n);return n;}
 const options=['sol','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','space'].map(id=>{const n=element(id);n.dataset.themeChoice=id;return n});
 const document={documentElement:element('root'),hidden,addEventListener(){},getElementById:element};
 const context={window:{addEventListener(){}},document,localStorage:{getItem(k){if(blocked)throw Error();return storage.get(k)??null},setItem(k,v){if(blocked)throw Error();storage.set(k,v)}},matchMedia:q=>({matches:q.includes('reduce')?reduced:true,addEventListener(){}}),innerWidth:1200,Math,Date:class extends Date{constructor(){super(time)}},setInterval:f=>intervals.push(f),setTimeout:(f,ms)=>{if(ms<=1600){f();return 0}const id=timers.size+1;timers.set(id,{f,ms});return id},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(source,context);
 return {nodes,storage,document,timers,tick:()=>intervals[0](),async click(id,type='click',checked){const n=element(id);if(checked!==undefined)n.checked=checked;for(const f of n.handlers[type]||[])await f({target:n});for(let i=0;i<20;i++)await Promise.resolve();}};
}
(async()=>{
 let t=setup(); assert.equal(t.nodes.get('surprise-setting').hidden,true);assert.equal(t.document.documentElement.dataset.atmosphere,'earth');assert.equal(t.nodes.get('earth')['aria-pressed'],'true');
 for(const theme of ['sol','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','space']){await t.click(theme);assert.equal(t.storage.get('blake-atmosphere'),theme)}
 await t.click('summon-saucer');assert.equal(t.storage.get('blake-surprise-seen'),'true');assert.equal(t.nodes.get('surprise-setting').hidden,false);assert.equal(t.nodes.get('pluto-theme-choice').hidden,false);assert.notEqual(t.storage.get('blake-atmosphere'),'pluto');
 await t.click('undo-theme');assert.equal(t.storage.get('blake-atmosphere'),'space');
 await t.click('allow-surprises','change',false);assert.equal(t.storage.get('blake-surprises'),'false');
 t=setup({stored:Object.fromEntries(t.storage)});assert.equal(t.nodes.get('allow-surprises').checked,false);t.tick();assert.equal(t.storage.has('blake-surprise-day'),false);await t.click('summon-saucer');assert.equal(t.nodes.get('surprise-notice').hidden,false);
 t=setup();t.tick();await t.click('unused');assert.equal(t.storage.get('blake-surprise-day'),'2026-9-15');assert.equal(t.storage.get('blake-surprise-seen'),'true');let palette=t.storage.get('blake-atmosphere');t.tick();await t.click('unused');assert.equal(t.storage.get('blake-atmosphere'),palette);
 t=setup({reduced:true});t.tick();assert.equal(t.storage.has('blake-surprise-day'),false);await t.click('summon-saucer');assert.equal(t.nodes.get('surprise-notice').hidden,false);
 t=setup({hidden:true});t.tick();assert.equal(t.storage.has('blake-surprise-day'),false);
 t=setup({blocked:true});await t.click('summon-saucer');assert.equal(t.nodes.get('surprise-notice').hidden,false);
 t=setup({stored:{'blake-atmosphere':'space'}});assert.equal(t.document.documentElement.dataset.atmosphere,'space');await t.click('summon-saucer');await t.click('undo-theme');assert.equal(t.storage.get('blake-atmosphere'),'space');
 t=setup({stored:{'blake-atmosphere':'invalid'}});assert.equal(t.document.documentElement.dataset.atmosphere,'earth');
 t=setup({stored:{'blake-atmosphere':'pluto'}});assert.equal(t.document.documentElement.dataset.atmosphere,'pluto');assert.equal(t.nodes.get('pluto-theme-choice').hidden,true);
 t=setup({stored:{'blake-surprise-seen':'true'}});assert.equal(t.nodes.get('pluto-theme-choice').hidden,false);
 t=setup();await t.click('summon-saucer');await t.click('surprise-options');assert.equal(t.nodes.get('options-panel').hidden,false);assert.equal(t.nodes.get('themes-panel').hidden,true);assert.equal(t.nodes.get('surprise-notice').hidden,true);
 await t.click('reset-atmosphere');assert.equal(t.storage.get('blake-atmosphere'),'earth');assert.equal(t.nodes.get('allow-surprises').checked,true);assert.equal(t.storage.get('blake-surprise-seen'),'false');assert.equal(t.nodes.get('pluto-theme-choice').hidden,true);assert.equal(t.nodes.get('surprise-setting').hidden,true);assert.equal(t.storage.get('blake-debris-frequency'),'3');assert.equal(t.storage.get('blake-star-frequency'),'3');assert.equal(t.storage.get('blake-aurora-frequency'),'3');
 t=setup({stored:Object.fromEntries(t.storage)});assert.equal(t.nodes.get('pluto-theme-choice').hidden,true);
 await t.click('debris-frequency','input',undefined);t.nodes.get('debris-frequency').value='5';await t.click('debris-frequency','input');assert.equal(t.storage.get('blake-debris-frequency'),'5');
 t=setup();await t.click('summon-saucer');assert.ok([...t.timers.values()].some(x=>x.ms===12000));await t.click('surprise-notice','pointerenter');assert.equal([...t.timers.values()].some(x=>x.ms===12000),false);await t.click('surprise-notice','pointerleave');[...t.timers.values()].find(x=>x.ms===12000).f();assert.equal(t.nodes.get('surprise-notice').hidden,true);
 console.log('Passed: Earth default and invalid fallback; ordered themes; hidden-then-revealed Pluto; persistence, sliders, reset, tabs, notification, exact Undo, surprises, reduced motion, hidden tab, and blocked storage.');
})();
