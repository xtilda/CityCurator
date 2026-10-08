import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { postgresSql } from '../db/postgres';
import { localDate, type CultureEvent } from '../lib/events/model';
import { validateSelection } from '../lib/events/planner';
import { deduplicateEvents } from '../lib/events/merge';
const event=(id:string,startsAt='2099-10-12T19:00:00+03:00'):CultureEvent=>({id,title:'Bir İstanbul filmi',director:'',startsAt,venueId:'atlas',sourceUrl:'https://filmekimi.iksv.org/tr',ticketUrl:null,category:'Film',festival:'Festival'});
test('Istanbul date remains correct across UTC midnight',()=>assert.equal(localDate(new Date('2099-10-11T22:00:00Z')),'2099-10-12'));
test('duplicate source listings merge while separate sessions remain',()=>assert.equal(deduplicateEvents([event('a'),event('b'),event('c','2099-10-12T21:00:00+03:00')]).length,2));
test('overlapping screenings cannot form a day plan',()=>{
 const items=[{event:event('a'),start:'2099-10-12T19:00:00+03:00',duration:120},{event:event('b','2099-10-12T20:00:00+03:00'),start:'2099-10-12T20:00:00+03:00',duration:120}];
 assert.ok(validateSelection(items,3).some(s=>s.includes('sığmıyor')));
});
test('an event cannot be moved away from its official session time',()=>assert.ok(validateSelection([{event:event('a'),start:'2099-10-12T18:00:00+03:00',duration:120}],3).some(s=>s.includes('resmî başlangıç'))));
test('SQL migration, idempotent saves, feed locks and cascade work in PostgreSQL',async()=>{
 const db=new PGlite();
 try{
  const migration=await readFile(new URL('../migrations/001_initial.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
  await db.query(postgresSql('INSERT INTO routes (id,owner_id,author,title,description,neighborhood,duration,mood,created_at) VALUES (?,?,?,?,?,?,?,?,?)'),['r','visitor','Gezgin','Test','Test rota','Beyoğlu',120,'Slow day','2099-10-12']);
  await db.query(postgresSql('INSERT INTO stops (id,route_id,position,name,note,lat,lng) VALUES (?,?,?,?,?,?,?)'),['s','r',0,'Atlas','',41,29]);
  for(let i=0;i<2;i++)await db.query(postgresSql('INSERT OR IGNORE INTO saves (user_id,route_id,created_at) VALUES (?,?,?)'),['v','r','2099-10-12']);
  assert.equal((await db.query('SELECT * FROM saves')).rows.length,1);
  await db.query(postgresSql('INSERT OR IGNORE INTO event_feeds(id) VALUES (?)'),['film']);
  const now=Date.now();const lock=()=>db.query(postgresSql('UPDATE event_feeds SET retry_after=? WHERE id=? AND retry_after<?'),[now+180000,'film',now]);
  assert.equal((await lock()).affectedRows,1);assert.equal((await lock()).affectedRows,0);
  await db.query('DELETE FROM routes WHERE id=$1',['r']);assert.equal((await db.query('SELECT * FROM stops')).rows.length,0);
 }finally{await db.close();}
});
