// 마이룸·방명록·꾸민 모습 서버 규칙 검증:  npm run test:room
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseDefaultOwned } from './gen-shop-migration.mjs'

const sql = readFileSync('supabase/migrations/20261030400000_m5_rooms_looks.sql', 'utf8').replace(/\r\n/g, '\n')
const api = readFileSync('src/lib/roomApi.ts', 'utf8')
const boutique = readFileSync('src/config/boutique.ts', 'utf8')
const room = readFileSync('src/screens/MyRoomScreen.tsx', 'utf8')

let passed = 0
const test = (name, fn) => {
  fn()
  passed++
  console.log('  ✓', name)
}

console.log('마이룸·방명록·꾸민 모습')
test('기본 지급 아이템 목록이 화면(boutique.ts)과 DB 함수에서 같다', () => {
  const defaults = parseDefaultOwned(boutique)
  assert.ok(defaults.length >= 3)
  const m = /_item_ok[\s\S]*?array\[([^\]]*)\]/.exec(sql)
  assert.ok(m, '_item_ok 함수를 찾지 못했다')
  const inSql = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  assert.deepEqual(inSql.sort(), [...defaults].sort())
})
test('화면이 부르는 DB 함수가 모두 마이그레이션에 있고 로그인한 사용자만 부를 수 있다', () => {
  for (const fn of ['room_get', 'room_save', 'room_like', 'guestbook_add', 'guestbook_delete', 'look_save']) {
    assert.ok(api.includes(`'${fn}'`), `${fn} 호출이 roomApi 에 없다`)
    assert.ok(sql.includes(`function public.${fn}(`), `${fn} 함수가 DB에 없다`)
  }
  assert.match(sql, /grant execute on function public\.room_get\(uuid\)[\s\S]*to authenticated/)
  assert.match(sql, /revoke all on function public\.room_get\(uuid\)[\s\S]*from public, anon/)
})
test('표는 읽기만 열려 있고 쓰기는 DB 함수로만 한다', () => {
  assert.match(sql, /revoke all on public\.room_settings, public\.room_visits, public\.room_likes, public\.guestbook_entries from anon, authenticated/)
  assert.match(sql, /grant select on public\.room_settings, public\.guestbook_entries to authenticated/)
  assert.doesNotMatch(sql, /grant (insert|update|delete)[^;]*(guestbook_entries|room_settings)/)
})
test('방명록: 1~120자, 답글은 한 단계, 하루 40개 제한, 방 주인·작성자만 삭제', () => {
  assert.match(sql, /char_length\(message\) between 1 and 120/)
  assert.match(sql, /par\.parent_id is not null/)
  assert.match(sql, />= 40/)
  assert.match(sql, /g\.author <> uid and g\.room_owner <> uid/)
})
test('방 꾸미기·꾸민 모습은 산 아이템만 저장된다', () => {
  assert.match(sql, /not public\._item_ok\(p\.owned_items, p_theme\)/)
  assert.match(sql, /not public\._item_ok\(p\.owned_items, f\)/)
  assert.match(sql, /public\._item_ok\(p\.owned_items, v #>> '\{\}'\)/)
  assert.match(sql, /length\(p_custom::text\) > 24000/)
})
test('실제 서비스 화면은 서버 값으로 방을 채우고, 방문자는 방을 꾸밀 수 없다', () => {
  assert.ok(room.includes('roomGet(ownerId)'))
  assert.ok(room.includes('if (isVisitor) return'))
  assert.ok(room.includes('{!isVisitor && ('))
})

console.log(`\n${passed}개 통과`)
