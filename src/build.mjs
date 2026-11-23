// 사용법: node src/build.mjs  →  src/ 조각을 합쳐 index.html(난독화 배포본) 생성
// 읽을 수 있는 원본: src/source.html
import fs from 'fs'; import path from 'path'; import {createRequire} from 'module';
const require=createRequire(import.meta.url);
const dir=path.dirname(new URL(import.meta.url).pathname);
const parts=['A_head.html','B_data.js','C_core.js','D_geom.js','M_models.js','E_stages.js','G_flow.js'].map(f=>fs.readFileSync(path.join(dir,f),'utf8'));
const head=parts[0], js=parts.slice(1).join('\n');
fs.writeFileSync(path.join(dir,'source.html'),head+'\n'+js+'\n</script>\n</body>\n</html>\n');
const prod=js.replace(/\nwindow\.__K=\{[\s\S]*?\};\s*$/m,'\n');           // 테스트용 전역 훅 제거
const JO=require(process.env.OBF_PATH||'javascript-obfuscator');
const out=JO.obfuscate(prod,{compact:true,identifierNamesGenerator:'hexadecimal',// 문자열 배열 암호화는 속성 접근마다 해독 함수를 거쳐 칼질 계산을 크게 느리게 해서 끔 (이름 바꾸기·압축만 유지)
  stringArray:false,splitStrings:false,controlFlowFlattening:false,deadCodeInjection:false,
  selfDefending:false,renameGlobals:true,transformObjectKeys:false,unicodeEscapeSequence:false,target:'browser'}).getObfuscatedCode();
const html=head.replace(/<!--[\s\S]*?-->/g,'')+'\n'+out+'\n</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(dir,'..','index.html'),html);
console.log('index.html',html.length,'bytes');
