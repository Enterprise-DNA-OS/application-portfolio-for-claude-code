#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';

export const commands={
 help:[], applications:[], application:['app'], 'review-queue':[], 'renewals-due':[], 'lifecycle-risks':[],
 costs:[], duplicates:[], 'owner-workload':[], 'dependency-review':[], compliance:[], attention:[],
 dependencies:['app'], impact:['app'], decisions:['app'], activity:['app'], 'weekly-review':[],
 'add-application':['reference','name','owner','capability','cost','currency','actor'],
 'set-application':['app','name','owner','capability','cost','currency','support-end','renewal-on','personal-data','actor'],
 review:['app','due','evidence','actor'], 'add-dependency':['consumer','provider','kind','critical','evidence','date','actor'],
 'remove-dependency':['id','evidence','actor'], 'verify-dependency':['id','evidence','date','actor'], 'attest-control':['app','kind','evidence','due','actor'],
 'propose-decision':['app','action','rationale','evidence','due','actor'], 'approve-decision':['id','actor'],
 'record-retirement':['app','actor'], log:['app','note','actor'], 'draft-decision':['app'],
 import:['file','map','rows','dry-run','actor'], export:['out']
};
const readViews={'review-queue':'review_queue','renewals-due':'renewals','lifecycle-risks':'lifecycle_risks',costs:'costs',duplicates:'duplicates','owner-workload':'owner_workload','dependency-review':'dependency_review',compliance:'compliance'};
const mutations=new Set(['add-application','set-application','review','add-dependency','verify-dependency','remove-dependency','attest-control','propose-decision','approve-decision','record-retirement','log','import']);
const records=['applications','dependencies','decisions','controls','activity','import_batches'];
const appFields='reference,name,owner,capability,lifecycle,annual_cost,currency,support_end,renewal_on,review_due';
export function date(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s))||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Use a real ISO date YYYY-MM-DD');
 return s;
}
export function money(s){if(!/^\d{1,14}(\.\d{1,2})?$/.test(String(s)))throw Error('Cost must be a nonnegative decimal with at most two places');return String(s);}
const currency=s=>{if(!/^[A-Z]{3}$/.test(s||''))throw Error('Currency must have three uppercase letters');return s;};
const boolean=s=>{if(s===true||s==='true')return true;if(s===false||s==='false')return false;throw Error('Use true or false');};
const required=(o,k)=>{if(o[k]===undefined||typeof o[k]!=='string'||!o[k].trim())throw Error(`Missing --${k}`);return o[k].trim();};
const oneOf=(v,allowed)=>{if(!allowed.includes(v))throw Error(`Expected ${allowed.join('|')}`);return v;};
const today=async db=>(await db.query('select current_date::text as today'))[0].today;
function parse(argv){
 const [command='help',...args]=argv;const options={},positionals=[];
 if(!Object.hasOwn(commands,command))throw Error(`Unknown command ${command}. Use help.`);
 for(const a of args){
  if(!a.startsWith('--')){positionals.push(a);continue;}
  const eq=a.indexOf('=');const k=a.slice(2,eq<0?undefined:eq),v=eq<0?true:a.slice(eq+1);
  if(Object.hasOwn(options,k))throw Error(`Duplicate option --${k}`);
  if(k!=='json'&&!commands[command].includes(k))throw Error(`Unknown option --${k}`);
  if(['json','dry-run'].includes(k)&&v!==true)throw Error(`--${k} must be a bare flag`);
  if(!['json','dry-run'].includes(k)&&v===true)throw Error(`--${k}=value required`);
  options[k]=v;
 }
 if(command==='import'){if(positionals.length!==1||positionals[0]!=='ardoq')throw Error('Use import ardoq --file=export.json [--map=columns.json] [--dry-run] --actor=Name');}
 else if(positionals.length)throw Error('Unexpected positional arguments');
 return {command,options};
}
export async function resolve(db,table,ref){
 if(!records.includes(table)||!ref)throw Error('Missing record reference');
 const text=String(ref).toLowerCase();
 if(table==='applications'){
  const exact=await db.query('select * from portfolio.applications where lower(reference)=$1 or id::text=$1',[text]);
  if(exact.length===1)return exact[0];
  const rows=await db.query('select * from portfolio.applications where starts_with(id::text,$1) or position($1 in lower(name))>0 order by reference',[text]);
  if(rows.length===1)return rows[0];
  throw Error(rows.length?`Ambiguous reference. Candidates:\n${rows.map(r=>`${r.reference} | ${r.name} | ${r.id}`).join('\n')}`:`No matching application: ${ref}`);
 }
 const rows=await db.query(`select * from portfolio.${table} where starts_with(id::text,$1) order by id`,[text]);
 if(rows.length===1)return rows[0];
 throw Error(rows.length?`Ambiguous reference. Candidates:\n${rows.map(r=>r.id).join('\n')}`:`No matching ${table}: ${ref}`);
}
async function audit(db,app,actor,action,detail){
 await db.query('insert into portfolio.activity(application_id,actor,action,detail) values($1,$2,$3,$4::jsonb)',[app,actor,action,JSON.stringify(detail)]);
}
async function bump(db,ids){for(const id of new Set(ids))await db.query('update portfolio.applications set version=version+1 where id=$1',[id]);}
async function blockers(db,app){
 const dependencies=await db.query("select c.reference,c.name from portfolio.dependencies d join portfolio.applications c on c.id=d.consumer_id where d.provider_id=$1 and d.status='active' and c.lifecycle<>'retired' order by c.reference",[app.id]);
 const controls=app.personal_data!==false?await db.query('select * from portfolio.compliance where reference=$1',[app.reference]):[];
 return {dependencies,controls};
}
async function impact(db,app){
 return db.query(`with recursive affected(id,depth,visited) as (
  select $1::uuid,0,array[$1::uuid]
  union all
  select d.consumer_id,a.depth+1,a.visited||d.consumer_id from affected a
   join portfolio.dependencies d on d.provider_id=a.id and d.status='active'
   join portfolio.applications c on c.id=d.consumer_id and c.lifecycle<>'retired'
   where not d.consumer_id=any(a.visited)
 ) select p.reference,p.name,p.owner,min(a.depth) as hops from affected a
 join portfolio.applications p on p.id=a.id where a.depth>0 group by p.reference,p.name,p.owner order by hops,p.reference`,[app.id]);
}
const at=(obj,key)=>String(key).split('.').reduce((v,k)=>v?.[k],obj);
const aliases={source_id:['_id','ID','Id','Component ID'],name:['name','Name','Component Name'],owner:['owner','Owner'],capability:['capability','Capability'],annual_cost:['Annual Cost','annual_cost'],currency:['Currency','currency'],support_end:['Support End','support_end'],renewal_on:['Renewal Date','renewal_on'],personal_data:['Personal Data','personal_data']};
async function importArdoq(db,o){
 const file=required(o,'file'),actor=required(o,'actor');
 const text=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
 const doc=path.extname(file).toLowerCase()==='.csv'?parseCsv(text):JSON.parse(text);
 const rows=o.rows?at(doc,o.rows):Array.isArray(doc)?doc:(doc.components??doc.rows??doc.data);
 if(!Array.isArray(rows)||!rows.length)throw Error('Export needs a nonempty object array. Use --rows=path for a nested array.');
 const mapping=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};
 for(const [k,v] of Object.entries(mapping))if(!Object.hasOwn(aliases,k)||typeof v!=='string'||!v)throw Error(`Invalid mapping ${k}`);
 const extract=(row,k)=>{
  if(mapping[k]){const v=at(row,mapping[k]);if(v===undefined)throw Error(`Mapped field missing: ${mapping[k]}`);return v;}
  for(const a of aliases[k])if(at(row,a)!==undefined)return at(row,a);
  return undefined;
 };
 const seen=new Set();let added=0,unchanged=0;
 for(const row of rows){
  if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Each export row must be an object');
  const get=k=>extract(row,k);
  const rawId=get('source_id'),rawName=get('name');
  if(!['string','number'].includes(typeof rawId)||String(rawId).trim()===''||typeof rawName!=='string'||!rawName.trim())throw Error('Each row needs its original ID and name. Map the exported headings.');
  const sourceId=String(rawId).trim();
  if(seen.has(sourceId))throw Error(`Duplicate source ID: ${sourceId}`);seen.add(sourceId);
  const scalar=k=>{const v=get(k);if(v===undefined||v===null)return '';if(!['string','number','boolean'].includes(typeof v))throw Error(`Map ${k} to a scalar field`);return String(v).trim();};
  const rawCost=scalar('annual_cost'),cur=scalar('currency');
  if(Boolean(rawCost)!==Boolean(cur))throw Error('Imported annual cost and currency must both be supplied');
  const values={name:rawName.trim(),owner:scalar('owner'),capability:scalar('capability')||'Unclassified',annual_cost:rawCost?money(rawCost):null,currency:cur?currency(cur):null,support_end:scalar('support_end')?date(scalar('support_end')):null,renewal_on:scalar('renewal_on')?date(scalar('renewal_on')):null,personal_data:scalar('personal_data')?boolean(scalar('personal_data')):null};
  const sourceRow={original:row,mapped:values};
  const prior=await db.query('select id,source_row from portfolio.applications where source_id=$1',[sourceId]);
  if(prior.length){
   const same=await db.query('select source_row=$2::jsonb as same from portfolio.applications where source_id=$1',[sourceId,JSON.stringify(sourceRow)]);
   if(!same[0].same)throw Error(`Source record changed: ${sourceId}. Reconcile before importing again.`);
   unchanged++;continue;
  }
  const [app]=await db.query(`insert into portfolio.applications(reference,name,owner,capability,annual_cost,currency,support_end,renewal_on,personal_data,source_id,source_row)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb) returning *`,['ARDOQ-'+sourceId,...Object.values(values),sourceId,JSON.stringify(sourceRow)]);
  await audit(db,app.id,actor,'import',{source:'ardoq',source_id:sourceId});added++;
 }
 await db.query('insert into portfolio.import_batches(source,actor,added,unchanged) values($1,$2,$3,$4)',['ardoq',actor,added,unchanged]);
 return {added,unchanged,dry_run:!!o['dry-run'],scope:'Application records only. Relationships, controls and approvals require reconciliation.'};
}
export async function run(db,argv){
 const {command:c,options:o}=parse(argv);
 if(mutations.has(c)){
  required(o,'actor');await db.exec('BEGIN');
  try{await db.exec('LOCK TABLE portfolio.applications IN SHARE ROW EXCLUSIVE MODE');const result=await execute(db,c,o);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;}
  catch(e){await db.exec('ROLLBACK');throw e;}
 }
 return execute(db,c,o);
}
async function execute(db,c,o){
 if(c==='help')return Object.entries(commands).map(([command,flags])=>({command,options:flags.map(k=>`--${k}`).join(' ')}));
 if(c==='applications')return db.query(`select ${appFields} from portfolio.applications order by reference`);
 if(readViews[c])return db.query(`select * from portfolio.${readViews[c]} order by 1,2`);
 if(c==='attention')return db.query(`select reference,name,'Ownership or review' as reason from portfolio.review_queue
 union select reference,name,'Support deadline' from portfolio.lifecycle_risks
 union select reference,name,'Privacy evidence review' from portfolio.compliance order by reference,reason`);
 if(c==='application'){
  const a=await resolve(db,'applications',required(o,'app'));
  return {application:a,dependencies:await execute(db,'dependencies',{app:a.id}),decisions:await execute(db,'decisions',{app:a.id}),controls:await db.query('select * from portfolio.controls where application_id=$1 order by kind',[a.id]),activity:await execute(db,'activity',{app:a.id})};
 }
 if(c==='dependencies'){
  const a=o.app?await resolve(db,'applications',o.app):null;
  return db.query(`select d.id,c.reference as consumer,p.reference as provider,d.kind,d.critical,d.status,d.verified_on,d.evidence
  from portfolio.dependencies d join portfolio.applications c on c.id=d.consumer_id join portfolio.applications p on p.id=d.provider_id
  where ($1::uuid is null or d.consumer_id=$1 or d.provider_id=$1) order by c.reference,p.reference,d.kind`,[a?.id||null]);
 }
 if(c==='impact')return impact(db,await resolve(db,'applications',required(o,'app')));
 if(c==='decisions'||c==='activity'){
  const a=o.app?await resolve(db,'applications',o.app):null;
  if(c==='activity')return db.query('select actor,action,detail,created_at from portfolio.activity where ($1::uuid is null or application_id=$1) order by created_at,id',[a?.id||null]);
  return db.query(`select d.id,a.reference,d.action,d.status,d.due_on,d.rationale,d.evidence,
   (d.status<>'implemented' and d.application_version<>a.version) as stale,d.approved_by from portfolio.decisions d join portfolio.applications a on a.id=d.application_id
   where ($1::uuid is null or a.id=$1) order by d.due_on,d.id`,[a?.id||null]);
 }
 if(c==='weekly-review'){
  const out={};for(const name of ['review-queue','lifecycle-risks','dependency-review','renewals-due','compliance','decisions'])out[name]=await execute(db,name,{});return out;
 }
 if(c==='import')return importArdoq(db,o);
 if(c==='export'){
  const out={format:'application-portfolio-v1',created_at:new Date().toISOString(),records:{}};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{for(const t of records)out.records[t]=await db.query(`select * from portfolio.${t} order by id`);await db.exec('COMMIT');}
  catch(e){await db.exec('ROLLBACK');throw e;}
  const file=o.out?path.resolve(o.out):path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'exports',`portfolio-${randomUUID()}.json`);
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n',{flag:'wx'});return {file,record_sets:records.length};
 }
 if(c==='add-application'){
  const cost=o.cost!==undefined?money(o.cost):null,cur=cost!==null?currency(required(o,'currency')):null;
  if(cost===null&&o.currency)throw Error('Currency requires cost');
  const [a]=await db.query('insert into portfolio.applications(reference,name,owner,capability,annual_cost,currency) values($1,$2,$3,$4,$5,$6) returning *',[required(o,'reference'),required(o,'name'),o.owner?.trim()||'',o.capability?.trim()||'Unclassified',cost,cur]);
  await audit(db,a.id,o.actor,c,{reference:a.reference});return a;
 }
 if(c==='add-dependency'){
  const consumer=await resolve(db,'applications',required(o,'consumer')),provider=await resolve(db,'applications',required(o,'provider'));
  if([consumer.lifecycle,provider.lifecycle].includes('retired'))throw Error('Cannot add a dependency involving a retired application');
  const verified=o.date?date(o.date):await today(db);if(verified>await today(db))throw Error('Verification date cannot be in the future');
  const [d]=await db.query('insert into portfolio.dependencies(consumer_id,provider_id,kind,critical,verified_on,evidence) values($1,$2,$3,$4,$5,$6) returning *',[consumer.id,provider.id,required(o,'kind'),o.critical===undefined?true:boolean(o.critical),verified,required(o,'evidence')]);
  await bump(db,[consumer.id,provider.id]);await audit(db,consumer.id,o.actor,c,{dependency:d});return d;
 }
 if(c==='verify-dependency'){
  const d=await resolve(db,'dependencies',required(o,'id'));if(d.status!=='active')throw Error('Only active dependencies can be verified');
  const verified=o.date?date(o.date):await today(db);if(verified>await today(db))throw Error('Verification date cannot be in the future');
  const [out]=await db.query('update portfolio.dependencies set verified_on=$2,evidence=$3 where id=$1 returning *',[d.id,verified,required(o,'evidence')]);
  await bump(db,[d.consumer_id,d.provider_id]);await audit(db,d.consumer_id,o.actor,c,{before:d,after:out});return out;
 }
 if(c==='remove-dependency'){
  const d=await resolve(db,'dependencies',required(o,'id'));if(d.status==='removed')throw Error('Dependency already removed');
  const evidence=required(o,'evidence');await db.query("update portfolio.dependencies set status='removed',evidence=$2 where id=$1",[d.id,evidence]);
  await bump(db,[d.consumer_id,d.provider_id]);await audit(db,d.consumer_id,o.actor,c,{before:d,evidence});return {id:d.id,status:'removed'};
 }
 if(c==='approve-decision'){
  const d=await resolve(db,'decisions',required(o,'id'));const a=await resolve(db,'applications',d.application_id);
  if(d.status!=='proposed')throw Error('Only proposed decisions can be approved');
  if(d.application_version!==a.version)throw Error('Stale decision. Propose a fresh decision against the current record.');
  if(d.action==='retire'){const b=await blockers(db,a);if(b.dependencies.length||b.controls.length)throw Error(`Retirement blocked: ${b.dependencies.length} dependent applications, ${b.controls.length} privacy evidence gaps`);}
  const [out]=await db.query("update portfolio.decisions set status='approved',approved_by=$2,approved_at=now() where id=$1 returning *",[d.id,o.actor]);
  await audit(db,a.id,o.actor,c,{decision:d.id});return out;
 }
 const a=await resolve(db,'applications',required(o,'app'));
 if(c==='set-application'){
  const map={name:'name',owner:'owner',capability:'capability',cost:'annual_cost',currency:'currency','support-end':'support_end','renewal-on':'renewal_on','personal-data':'personal_data'};
  const changes={};
  for(const [k,column] of Object.entries(map))if(o[k]!==undefined){
   const v=o[k];changes[column]=k==='cost'?money(v):k==='currency'?currency(v):k==='personal-data'?boolean(v):k.endsWith('-end')||k.endsWith('-on')?(v===''?null:date(v)):v.trim();
  }
  if(!Object.keys(changes).length)throw Error('Supply a field to change');
  if(Object.hasOwn(changes,'annual_cost')&&!a.currency&&!changes.currency)throw Error('Supply currency with first cost');
  if(Object.hasOwn(changes,'currency')&&a.annual_cost===null&&!Object.hasOwn(changes,'annual_cost'))throw Error('Supply cost with currency');
  const entries=Object.entries(changes);const [out]=await db.query(`update portfolio.applications set ${entries.map(([k],i)=>`${k}=$${i+2}`).join(',')},version=version+1 where id=$1 returning *`,[a.id,...entries.map(([,v])=>v)]);
  await audit(db,a.id,o.actor,c,{before:a,changes});return out;
 }
 if(c==='review'){
  if(!a.owner||a.capability==='Unclassified'||a.personal_data===null)throw Error('Classify personal data, assign an owner and a capability before review');
  const due=date(required(o,'due'));if(due<await today(db))throw Error('Next review cannot be in the past');
  const evidence=required(o,'evidence');const [out]=await db.query("update portfolio.applications set reviewed_on=current_date,review_due=$2,lifecycle=case when lifecycle='planned' then 'active' else lifecycle end,version=version+1 where id=$1 returning *",[a.id,due]);
  await audit(db,a.id,o.actor,c,{evidence,due});return out;
 }
 if(c==='attest-control'){
  const kind=oneOf(required(o,'kind'),['security','retention']),due=date(required(o,'due'));if(due<await today(db))throw Error('Next review cannot be in the past');
  const [out]=await db.query(`insert into portfolio.controls(application_id,kind,evidence,reviewed_on,review_due,actor) values($1,$2,$3,current_date,$4,$5)
   on conflict(application_id,kind) do update set evidence=excluded.evidence,reviewed_on=excluded.reviewed_on,review_due=excluded.review_due,actor=excluded.actor returning *`,[a.id,kind,required(o,'evidence'),due,o.actor]);
  await bump(db,[a.id]);await audit(db,a.id,o.actor,c,{control:out});return out;
 }
 if(c==='propose-decision'){
  const action=oneOf(required(o,'action'),['retain','invest','migrate','retire']);if(a.lifecycle==='retired')throw Error('Application already retired');
  const [out]=await db.query('insert into portfolio.decisions(application_id,action,rationale,evidence,due_on,application_version,actor) values($1,$2,$3,$4,$5,$6,$7) returning *',[a.id,action,required(o,'rationale'),required(o,'evidence'),date(required(o,'due')),a.version,o.actor]);
  await audit(db,a.id,o.actor,c,{decision:out});return out;
 }
 if(c==='record-retirement'){
  if(a.lifecycle==='retired')throw Error('Application already retired');
  const b=await blockers(db,a);if(b.dependencies.length||b.controls.length)throw Error('Retirement blocked by dependencies or privacy evidence reviews');
  const approved=await db.query("select * from portfolio.decisions where application_id=$1 and action='retire' and status='approved' and application_version=$2 order by approved_at desc limit 1",[a.id,a.version]);
  if(!approved.length)throw Error('Retirement needs a current approved retire decision');
  await db.query("update portfolio.applications set lifecycle='retired',version=version+1 where id=$1",[a.id]);
  await db.query("update portfolio.decisions set status='implemented' where id=$1",[approved[0].id]);
  await audit(db,a.id,o.actor,c,{decision:approved[0].id,note:'Register updated only. No service stopped or data deleted.'});return {reference:a.reference,lifecycle:'retired'};
 }
 if(c==='log'){const note=required(o,'note');await audit(db,a.id,o.actor,'note',{note});return {reference:a.reference,note};}
 if(c==='draft-decision'){
  const data={application:a,impact:await impact(db,a),blockers:await blockers(db,a),decisions:await execute(db,'decisions',{app:a.id})};
  const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`decision-${a.id}-${randomUUID()}.md`);
  fs.writeFileSync(file,`# Internal application decision brief\n\nDraft for review. This does not approve retirement, cancel a contract or stop a service.\n\n${human(data)}\n`,{flag:'wx'});return {file};
 }
 throw Error(`Unhandled command ${c}`);
}
const value=v=>v==null?'':v instanceof Date?v.toISOString():typeof v==='object'?JSON.stringify(v):String(v);
export function human(data){
 if(Array.isArray(data)){
  if(!data.length)return 'No records.';
  const columns=Object.keys(data[0]);const rows=data.map(r=>columns.map(k=>value(r[k]).replace(/[\r\n\t]/g,' ')));
  const widths=columns.map((c,i)=>Math.max(c.length,...rows.map(r=>r[i].length)));
  return [columns,widths.map(w=>'-'.repeat(w)),...rows].map(r=>r.map((s,i)=>s.padEnd(widths[i])).join('  ')).join('\n');
 }
 if(data&&typeof data==='object')return Object.entries(data).map(([k,v])=>typeof v==='object'&&v!==null?`${k}\n${human(v)}\n`:`${k}: ${value(v)}`).join('\n');
 return value(data);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{parse(process.argv.slice(2));db=await getDb();const out=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(out,null,2):human(out));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
