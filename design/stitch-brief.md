# Stitch 디자인 의뢰서 — 펫과함께 (M1)

이 파일을 보면서 Google Stitch(화면)와 이미지 생성 AI(캐릭터)에 아래 문구를 그대로 붙여넣으면 된다.
결과물은 `design/` 폴더에 넣고 Claude Code에 "design/의 시안과 DESIGN.md를 따라 만들어"라고 요청한다.

## 0. 게임 한 줄 소개

알에서 부화한 귀여운 몬스터를 돌보고 키우는 모바일 웹 게임. 지인들끼리만 쓴다.
한국어 UI. 폰 세로 화면(너비 390px) 기준. 하루 몇 번 짧게 들어와서 즐기는 편안한 분위기.

## 1. 분위기 (모든 화면 공통)

- 키워드: 파스텔톤, 따뜻함, 포근함, 손그림 느낌, 둥근 모서리, 큼직한 버튼
- 현재 앱의 색(바꿔도 됨): 배경 크림 `#FFF4D6`, 강조 코랄 `#FF8A65`, 글자 짙은 갈색 `#3B2F2F`, 카드 흰색, 테두리 연한 베이지 `#F0DFB8`
- 글꼴: 둥글고 읽기 쉬운 한글 글꼴
- 피할 것: 어둡고 무서운 분위기, 날카로운 모서리, 복잡한 장식, 기존 게임(포켓몬 등)을 연상시키는 모양

### Stitch 첫 프롬프트 (분위기 잡기)

```
Mobile game home screen for a cozy monster-raising game called "펫과함께" (Pet Together).
Korean UI. Pastel cream background, coral accent buttons, rounded corners, soft hand-drawn feel,
big friendly buttons, warm and calm mood. Portrait 390px wide.
In the center there is a large egg waiting to hatch, with a countdown timer below it and two buttons:
"쓰다듬기" (pet) and "따뜻하게 하기" (warm up). A small top bar shows the game name and the player nickname.
Give me 3 different style options.
```

마음에 드는 하나를 고른 뒤, 그 스타일로 아래 화면들을 이어서 만든다.

## 2. M1에서 필요한 화면

| # | 화면 | 들어갈 것 |
|---|---|---|
| 1 | 로그인 | 게임 이름, 한 줄 문구, 이메일 입력, 초대 코드 입력(처음 한 번만), "인증 코드 받기" 버튼 |
| 2 | 인증 코드 입력 | 이메일 안내 문구, 6자리 코드 입력칸, "들어가기" 버튼, "이메일 다시 입력" 링크 |
| 3 | 닉네임 정하기 | 안내 문구, 닉네임 입력(2~10자), "시작하기" 버튼 |
| 4 | 홈 — 알 상태 | 큰 알, 남은 시간, "쓰다듬기"·"따뜻하게 하기" 버튼, 상단 바(게임 이름, 닉네임) |
| 5 | 홈 — 부화 가능 | 알이 흔들리며 빛남, "부화시키기!" 큰 버튼 |
| 6 | 부화 연출 | 알이 깨지며 몬스터가 나타나는 순간, 종족 이름·속성·"빛나는 몬스터!" 같은 표시 |
| 7 | 이름 짓기 | 갓 태어난 몬스터, 이름 입력칸, "이 이름으로 정하기" 버튼 |
| 8 | 홈 — 몬스터 | 몬스터가 숨쉬고 통통 튐, 이름, 종족, 속성 아이콘, 레벨, 능력치 6개(체력·공격·방어·속도·지능·매력)를 막대 그래프로 |
| 9 | 몬스터 상세 | 종족, 속성, 특성, 성격, 능력치, "함께한 날" (아직 동작 안 하는 칸은 비워 두는 자리로 디자인) |

### 화면별 프롬프트 예시

```
Same style as before. Screen: the egg is ready to hatch. The egg wobbles and glows softly.
A big coral button "부화시키기!" at the bottom. Text: "알이 곧 깨어날 것 같아요".
```

```
Same style. Screen: name your new monster. A cute baby monster stands in the center on a soft cloud-shaped platform.
Text field with placeholder "이름을 지어 주세요", button "이 이름으로 정하기".
Small badge above the monster showing species name and an element icon.
```

```
Same style. Screen: monster status. Large monster illustration at top, name and species below,
six horizontal stat bars labeled 체력, 공격, 방어, 속도, 지능, 매력 with pastel colors,
a small row with level and personality tags. Bottom area is empty space for future feeding and training buttons.
```

## 3. 공통 UI 부품 (한 번 정하면 계속 씀)

- 버튼: 기본(코랄), 보조(흰색 테두리), 비활성(흐림), 링크형
- 입력칸, 카드, 안내 문구, 오류 문구(빨강 계열이지만 부드럽게)
- 속성 아이콘 6개: 불, 물, 풀, 전기, 바람, 땅 (작고 둥근 아이콘)
- 알 등급 표시 3개: 일반, 희귀, 전설
- 능력치 막대, 상태 배지(빛나는 몬스터 등)

## 4. 캐릭터 시안 (이미지 생성 AI용)

몬스터는 코드가 **색·체형·무늬·부품을 바꿔 입힌다**. 그래서 시안은 아래 규칙을 지켜야 부품으로 나누기 쉽다.

### 공통 규칙 (모든 종족에 붙일 문장)

```
Cute baby monster character, full body, front view, standing, 2-heads-tall chibi proportions,
thick clean outline, flat pastel colors with simple soft shading, big expressive eyes,
plain white background, no shadow on the ground, no text, centered.
Original creature design, not resembling any existing game franchise.
Parts clearly separated: body, ears or horn, tail, face.
```

- 색은 종족마다 팔레트 6개를 코드가 바꿀 수 있으므로, **단색 면 위주**로 그려 달라고 한다 (복잡한 그라데이션은 피함).
- 첫 이미지를 기준으로 삼아 나머지 종족도 같은 화풍으로 요청한다 ("Same art style as the previous image").
- 종족마다 귀·뿔·꼬리 변형이 3~4가지 필요하다. 시안을 받은 뒤 "ears 4 variations, same style"처럼 추가로 요청한다.

### 첫 종족 6종 (가칭)

| 종족 | 속성 | 분위기 | 프롬프트 (공통 규칙 뒤에 붙임) |
|---|---|---|---|
| 몽실 | 바람 | 귀여움 | `a baby sheep made of round fluffy cloud-like wool, tiny hooves, tiny wind-swirl marking on forehead` |
| 콩콩 | 풀 | 귀여움 | `a baby squirrel wearing a seed-shaped cap, fluffy big tail with leaf tips, acorn-like cheeks` |
| 번개꼬리 | 전기 | 멋짐 | `a baby weasel with a long slim body and a lightning-bolt shaped tail, sharp but cute eyes, small spark whiskers` |
| 강철등 | 땅 | 멋짐 | `a baby wolf pup with small armor plates on its back like a shell, sturdy legs, stern but cute face` |
| 흑염 | 불 | 카리스마 | `a baby lion cub with a mane of black flames, small glowing ember eyes, confident pose` |
| 별비늘 | 물 | 카리스마 | `a baby dragon with scales that look like a night sky with tiny stars, small wings, calm mysterious eyes` |

종족 이름은 가칭이라 바꿔도 된다. 바꾸면 알려 주면 코드와 문서를 같이 고친다.

### 알 시안

```
Cute egg for a monster-raising game, 3 rarity variants: common (plain pastel shell with a small spot pattern),
rare (shell with soft sparkles), legendary (shell with golden cracks and a gentle glow).
Same art style, plain white background, front view, centered.
```

알 껍질 무늬는 나중에 "알 고르기"에서 힌트가 된다 (하트 무늬=귀여움, 날카로운 금=멋짐, 검게 빛나는 알=카리스마).

## 5. 내보낼 것과 저장 위치

```
design/
  stitch/
    01-login.png            화면 시안 이미지 (번호-이름)
    ...
    code/                   Stitch가 내보낸 HTML·CSS (참고용)
  DESIGN.md                 Stitch가 만든 색·글꼴·버튼 규칙
  characters/
    species-몽실.png        종족별 기본 모습 PNG
    ...
    egg-common.png          알 3종
```

- Stitch 코드는 **화면 뼈대 참고용**이다. 실제 기능은 Claude Code가 기획서대로 새로 만든다.
- 캐릭터를 한 장짜리 이미지로만 쓰면 랜덤 조합·진화·장식이 어렵다. 시안은 "기준 그림"이고, 게임에서는 Claude가 레이어 SVG로 옮긴다.
- 기존 게임 캐릭터를 참고 이미지로 넣지 않는다.

## 6. 디자인을 끝낸 뒤 Claude Code에 할 말

```
design/ 폴더의 Stitch 시안과 DESIGN.md를 따라 M1 화면을 만들어줘.
캐릭터는 design/characters/ 시안을 참고해서 레이어 SVG로 만들고,
색·글꼴 같은 규칙은 한 파일(테마 설정)로 모아줘.
```
