/* =========================================================
   DATA TABLES  (규칙은 전부 여기 데이터로)
   ========================================================= */
const STATS=[['salty','짠맛','#5b8fc9'],['spicy','매운맛','#d9482f'],['sweet','단맛','#e58fb0'],['umami','감칠맛','#c99a3b'],['cool','시원함','#4fb3a5'],['weird','엉뚱함','#9b5bd1']];

// 손질 재료: 단면(z,y) 다각형 + 길이(x) + 색 띠
function ngon(r,n,sy,yOff){const p=[];for(let i=0;i<n;i++){const a=Math.PI*2*i/n-Math.PI/2+Math.PI/n;p.push([Math.cos(a)*r,(Math.sin(a)*r)*(sy||1)+r*(sy||1)+(yOff||0)]);}return p;}
function halfEllipse(w,h,n){const p=[];for(let i=0;i<=n;i++){const a=Math.PI*i/n;p.push([Math.cos(a)*w,Math.sin(a)*h]);}return p.reverse();}
function rect(w,h){return [[-w/2,0],[w/2,0],[w/2,h],[-w/2,h]];}
const INGS=[
 {k:'cabbage',n:'절임배추',g:'basic',L:2.5,taper:[0.8,1.05],sec:halfEllipse(0.62,0.62,8),bands:[[0.22,'#5f9a35'],[0.4,'#8fc256'],[0.6,'#cfe08e'],[1,'#f1efc4']],inner:'#f4e8a6',st:{cool:1},d:'김치의 기본'},
 {k:'radish',n:'무',g:'basic',L:2.1,taper:[1,0.6],sec:ngon(0.36,8),bands:[[0.2,'#a9cf6d'],[1,'#f3f1e6']],inner:'#fbfaf2',st:{sweet:1,cool:2},d:'시원 아삭'},
 {k:'mustard',n:'갓',g:'basic',L:2.3,sec:rect(0.8,0.09),bands:[[0.5,'#6b3f5c'],[1,'#7f9a45']],inner:'#cfe0a0',st:{spicy:1},d:'톡 쏘는 향'},
 {k:'leek',n:'대파',g:'basic',L:2.4,taper:[1.25,0.9],sec:ngon(0.12,7),bands:[[0.55,'#4f9a3a'],[0.65,'#b9d88a'],[1,'#eef3dc']],inner:'#e3efc9',st:{spicy:1},d:'알싸함'},
 {k:'chive',n:'부추',g:'basic',L:2.2,sec:rect(0.55,0.07),bands:[[1,'#3f8a2f']],inner:'#8fc06a',st:{spicy:1},d:'향긋'},
 {k:'water',n:'미나리',g:'basic',L:2.2,sec:rect(0.5,0.08),bands:[[0.6,'#4d9a3e'],[1,'#9cc97a']],inner:'#a8d48a',st:{cool:1},d:'상큼한 향'},
 {k:'onion',n:'양파',g:'basic',L:0.95,sec:ngon(0.46,8),bands:[[0.1,'#b07a4a'],[0.9,'#e8d9c2'],[1,'#b07a4a']],inner:'#f5efe2',st:{sweet:1,spicy:1},d:'달큰 매콤'},
 {k:'pear',n:'배',g:'basic',L:0.95,sec:ngon(0.46,8),bands:[[1,'#d6c062']],inner:'#fbf6dc',st:{sweet:2,cool:1},d:'단맛과 시원함'},
 {k:'cucumber',n:'오이',g:'basic',L:2.0,taper:[0.8,1],sec:ngon(0.2,7),bands:[[1,'#3e7a32']],inner:'#d8ecb0',st:{cool:2},d:'아삭 시원'},
 {k:'oyster',taste:'싱싱한 굴의 바다 향과 갓 버무린 매콤함.',n:'굴',g:'basic',L:0.7,sec:halfEllipse(0.35,0.2,6),bands:[[1,'#cfc7bd']],inner:'#e9e2d6',st:{umami:2,salty:1},d:'바다의 감칠맛'},
 {k:'watermelon',n:'수박',g:'weird',L:1.3,sec:ngon(0.62,9),bands:[[0.1,'#2f6b2a'],[0.2,'#1f4d1d'],[0.3,'#2f6b2a'],[0.4,'#1f4d1d'],[0.5,'#2f6b2a'],[0.6,'#1f4d1d'],[0.7,'#2f6b2a'],[0.8,'#1f4d1d'],[0.9,'#2f6b2a'],[1,'#1f4d1d']],inner:'#e8455a',st:{sweet:2,cool:1,weird:2},d:'여름 그 자체'},
 {k:'dujjon',n:'두쫀쿠',g:'weird',L:0.55,sec:halfEllipse(0.48,0.34,8),bands:[[1,'#6b4a2e']],inner:'#8fb25a',st:{sweet:3,weird:3},d:'두바이 쫀득 쿠키'},
 {k:'mintchoco',n:'민트초코',g:'weird',L:1.2,sec:rect(0.8,0.5),bands:[[1,'#5a3a24']],inner:'#8fe0c8',st:{sweet:2,cool:1,weird:3},d:'호불호 끝판왕'},
 {k:'cheese',n:'치즈',g:'weird',L:1.0,sec:[[-0.5,0],[0.5,0],[0,0.55]],bands:[[1,'#f2c84b']],inner:'#ffe07a',st:{umami:1,weird:2},d:'쭈욱 늘어나요'},
 {k:'pineapple',n:'파인애플',g:'weird',L:1.4,taper:[0.6,1],sec:ngon(0.42,7),bands:[[0.15,'#4f8a3a'],[1,'#c48a2e']],inner:'#ffd84d',st:{sweet:2,weird:2},d:'김치에 파인애플?'},
];
const ING=Object.fromEntries(INGS.map(i=>[i.k,i]));

// 써는 방식: x(가로) 자르기 위치, z(세로) 자르기 위치 (0~1)
const METHODS=[
 {k:'whole',n:'통째로',d:'그대로 넣기',x:[],z:[]},
 {k:'pogi',n:'포기 썰기',d:'길게 반으로',x:[],z:[0.5]},
 {k:'mak',n:'막썰기',d:'큼직하게',x:[0.25,0.5,0.75],z:[0.5]},
 {k:'kkak',n:'깍둑썰기',d:'주사위 모양',x:[0.2,0.4,0.6,0.8],z:[1/3,2/3]},
 {k:'chae',n:'채썰기',d:'가늘게 송송',x:[1,2,3,4,5,6,7,8].map(i=>i/9),z:[]},
];
const METHOD=Object.fromEntries(METHODS.map(m=>[m.k,m]));
const KIMCHI_TYPE={whole:'통김치',pogi:'포기김치',mak:'막김치',kkak:'깍두기',chae:'생채'};

// 양념 (한 숟갈당)
const SEAS=[
 {k:'gochu',n:'고춧가루',c:'#c8281e',shape:'jar',st:{spicy:1}},
 {k:'garlic',n:'다진 마늘',c:'#f1ead2',shape:'jar',st:{spicy:0.5,umami:0.5}},
 {k:'ginger',n:'생강',c:'#d9b77a',shape:'jar',st:{spicy:0.5}},
 {k:'shrimp',n:'새우젓',c:'#f2b9a8',shape:'jar',st:{salty:1,umami:1}},
 {k:'fishsauce',n:'멸치액젓',c:'#7a4a22',shape:'bottle',st:{salty:1,umami:1.5}},
 {k:'salt',n:'천일염',c:'#ffffff',shape:'bag',st:{salty:1.5}},
 {k:'sugar',n:'설탕',c:'#fbfbf6',shape:'bag',st:{sweet:1}},
 {k:'maesil',n:'매실청',c:'#a8761f',shape:'bottle',st:{sweet:1}},
 {k:'rice',n:'찹쌀풀',c:'#f4f1e8',shape:'jar',st:{umami:0.3}},
 {k:'mayo',n:'마요네즈',c:'#f6eec2',shape:'bottle',st:{umami:0.5,weird:1.5},weird:1},
 {k:'choco',n:'초코시럽',c:'#4a2a17',shape:'bottle',st:{sweet:1.5,weird:1.5},weird:1},
 {k:'cola',n:'콜라',c:'#3b1d10',shape:'can',st:{sweet:1,weird:1},weird:1},
];
const SEA=Object.fromEntries(SEAS.map(s=>[s.k,s]));

const STORES=[
 {k:'now',n:'바로 먹기',d:'갓 버무린 겉절이로!',pre:'갓 버무린'},
 {k:'box',n:'김치통',d:'며칠 두면 새콤하게',pre:'잘 익은'},
 {k:'onggi',n:'항아리',d:'푹~ 묵혀서 깊은 맛',pre:'묵은'},
];
const STORE=Object.fromEntries(STORES.map(s=>[s.k,s]));

// 숨은 레시피 (위에서부터 먼저 맞는 것 하나)
const has=(c,k)=>c.sel.includes(k), sp=(c,k)=>c.season[k]||0, weirdCnt=c=>c.sel.filter(k=>ING[k].g==='weird').length+SEAS.filter(s=>s.weird&&sp(c,s.k)>0).length;
const RECIPES=[
 {k:'nothing',taste:'풋풋한 생야채 맛. 아삭하지만 그게 전부예요.',n:'아무 맛도 안 나는 김치',hint:'양념을 깜빡하면…?',test:c=>Object.values(c.season).every(v=>!v),line:'굴 겉절이? 오메, 이건 수육 삶아야 쓰겄다. 제대로네!'},
 {k:'pizza',taste:'고소한 치즈와 마요의 크리미함, 끝에 살짝 김치 향.',n:'피자 김치',hint:'치즈와 하얀 소스',test:c=>has(c,'cheese')&&sp(c,'mayo')>0,line:'이게 김치여 피자여! 이탈리아 할매가 들으면 울겄다'},
 {k:'colamelon',taste:'달콤한 수박에 탄산이 톡톡 터지는 여름 맛.',n:'콜라 수박 화채 김치',hint:'여름 과일 + 톡 쏘는 음료',test:c=>has(c,'watermelon')&&sp(c,'cola')>0,line:'김치에서 탄산이 터지네? 할미 틀니 날아갈 뻔했다!'},
 {k:'dessert',taste:'과즙 가득 수박과 쫀득한 피스타치오가 만난 디저트 맛.',n:'여름밤 디저트 김치',hint:'여름 과일과 쿠키가 만나면…?',test:c=>has(c,'watermelon')&&has(c,'dujjon'),line:'수박에 과자를 버무려? 니 할아버지가 보면 뒷목 잡고 쓰러지겄다'},
 {k:'cvs',taste:'시원한 민트와 달콤한 초코, 치약 같은 상쾌함.',n:'편의점 신상 김치',hint:'초록 쿠키와 민트의 만남',test:c=>has(c,'mintchoco')&&(has(c,'dujjon')||sp(c,'choco')>0),line:'김치에 치약을 넣었냐? 양치하고 밥 먹는 기분이다잉'},
 {k:'hawaii',taste:'새콤달콤한 파인애플이 매콤함을 감싸는 열대의 맛.',n:'하와이안 김치',hint:'노란 열대 과일',test:c=>has(c,'pineapple')&&weirdCnt(c)===1,line:'파인애플을 김치에? 할미랑 장난하냐? …근디 고기랑은 먹겄네'},
 {k:'hell',taste:'첫입부터 혀가 얼얼, 눈물 나게 매운 맛.',n:'지옥불 김치',hint:'매운맛을 끝까지 올리면',test:c=>c.stat.spicy>=9,line:'아이고 할미 죽는다! 119 불러라! 혀가 다 타버렸다!'},
 {k:'sea',taste:'바닷물을 그대로 마신 듯 짜디짠 맛.',n:'바다보다 짠 김치',hint:'짠맛을 끝까지 올리면',test:c=>c.stat.salty>=8,line:'이건 김치가 아니라 소금 덩어리여! 바다를 통째로 담갔냐!'},
 {k:'baek',taste:'맑고 시원한 국물에 배의 은은한 단맛.',n:'뽀얀 백김치',hint:'배를 넣고 빨간 가루는 빼고',test:c=>has(c,'cabbage')&&has(c,'pear')&&sp(c,'gochu')===0&&weirdCnt(c)===0,line:'흠, 백김치는 제법이네. 이건 할미가 인정한다잉'},
 {k:'kkakdugi',taste:'아삭한 무에 새우젓 감칠맛이 밴 시원 매콤한 맛.',n:'아삭 깍두기',hint:'무를 주사위처럼',test:c=>has(c,'radish')&&c.cut.radish==='kkak'&&sp(c,'gochu')>=2&&sp(c,'shrimp')>=1&&weirdCnt(c)===0,line:'깍두기는 새우젓이 생명인 거 알긴 아는구나. 잘했다잉'},
 {k:'saengchae',taste:'새콤 매콤한 양념에 아삭한 무채, 밥도둑 맛.',n:'새콤 무생채',hint:'무를 가늘게',test:c=>has(c,'radish')&&c.cut.radish==='chae'&&sp(c,'gochu')>=1&&weirdCnt(c)===0,line:'무생채는 그럭저럭 봐줄 만하네. 밥 한 공기는 먹겄다'},
 {k:'oyster',n:'굴 듬뿍 겉절이',hint:'바다 재료 + 바로 먹기',test:c=>has(c,'oyster')&&c.store==='now'&&sp(c,'gochu')>=1,line:'굴 겉절이에 수육 한 점이면 끝나는 거여!'},
 {k:'mukeunji',taste:'푹 익어 깊어진 신맛과 감칠맛, 시간이 만든 맛.',n:'장인의 묵은지',hint:'항아리에 오래오래',test:c=>has(c,'cabbage')&&c.cut.cabbage==='pogi'&&c.store==='onggi'&&sp(c,'gochu')>=2&&(sp(c,'shrimp')+sp(c,'fishsauce'))>=1&&weirdCnt(c)===0,line:'묵은지까지 할 줄 알어? 이건 할미도 할 말이 없다잉'},
 {k:'classic',taste:'매콤 짭짤한 양념에 시원한 배추, 할머니 손맛 그대로.',n:'할머니 인정 정통 배추김치',hint:'배추, 무, 파, 고춧가루, 젓갈, 마늘…',test:c=>has(c,'cabbage')&&has(c,'radish')&&(has(c,'leek')||has(c,'mustard')||has(c,'chive'))&&sp(c,'gochu')>=2&&sp(c,'gochu')<=5&&(sp(c,'shrimp')+sp(c,'fishsauce'))>=1&&sp(c,'garlic')>=1&&c.stat.salty<=5&&weirdCnt(c)===0,line:'오메! 할미 김치를 몰래 훔쳐 갔냐? 똑같다 똑같어!'},
];

// 할머니 반응 (조건 맞는 것 최대 3개)
// 할머니 반응: [조건, 첫 문장, '~도' 중간 연결, '~도' 마지막 마무리]
const REACTIONS=[
 [c=>c.stat.salty>=5,'켁! 소금 한 포대를 다 부었냐? 물부터 가져와!','짜기는 바닷물 저리 가라고…','짜기도 바닷물보다 짜다잉! 신장 다 상하겄네!'],
 [c=>c.stat.spicy>=6,'아이고 매워! 할미 잡을라고 작정했냐잉!','맵기는 또 오지게 맵고…','맵기도 오지게 매워서 혀가 다 녹는다잉!'],
 [c=>c.stat.sweet>=5,'이게 김치여 사탕이여? 이빨 다 썩겄다!','달기는 사탕 저리 가라고…','달기도 사탕처럼 달아서 이빨 다 썩겄다!'],
 [c=>c.stat.weird>=3,'오메, 이걸 김치라고 담갔냐? 할미 눈을 의심했다','재료도 요상망측하고…','재료도 요상망측한디… 근디 왜 자꾸 손이 가냐잉'],
 [c=>c.stat.umami>=3,'흥, 감칠맛 하나는 봐줄 만하네','감칠맛은 그나마 살았고…','그래도 감칠맛 하나는 살렸네. 봐준다잉'],
 [c=>c.stat.cool>=3,'시원하긴 하네. 이건 칭찬해 주마','시원하기는 하고…','시원하기도 하니 그건 봐준다잉'],
 [c=>sp(c,'gochu')===0&&Object.values(c.season).some(v=>v),'고춧가루는 어따 팔아먹었냐? 허여멀건하네','빛깔도 허여멀건하고…','빛깔도 허여멀건한 게 이게 김치 맞냐잉?'],
 [c=>c.stat.salty<1&&Object.values(c.season).some(v=>v),'맹탕이여 맹탕! 맹물에 배추 담갔냐?','간은 또 맹탕이고…','간도 맹탕이니 소금 쬐끔 더 쳐라잉!'],
];
// 첫 문장은 그대로, 두 번째부터는 '~도'로 이어 붙이고 마지막은 마무리형으로
function composeReactions(c,recipe){const hits=REACTIONS.filter(r=>{try{return r[0](c);}catch(e){return false;}});
  const lines=[];if(recipe)lines.push(recipe.line);
  const room=3-lines.length, use=hits.slice(0,room);
  use.forEach((r,i)=>{if(!lines.length){lines.push(r[1]);return;}lines.push(i===use.length-1?r[3]:r[2]);});
  if(!lines.length)lines.push('음… 이게 니 김치 맛이구나. 할미는 말을 아끼겄다');
  return lines;}
const CLOSERS=['그래도 굶진 않겄다. 다 먹어라잉, 남기면 혼난다','다음엔 할미 하는 거 똑바로 보고 따라 해라잉','혼자 김장한다고 고생은 했다. 맛 얘기는… 다음에 하자','멀리서 이거 담근다고 애썼다. 근디 연습은 더 해라잉'];

