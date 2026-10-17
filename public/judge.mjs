export function closeEnough(a,b){
 if(typeof a==='number'&&typeof b==='number')return Number.isFinite(a)&&Math.abs(a-b)<=1e-5*Math.max(1,Math.abs(b));
 if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>closeEnough(v,b[i]));
 return JSON.stringify(a)===JSON.stringify(b);
}
const sorted=a=>a.map(x=>JSON.stringify(x)).sort();
export function judge(actual,expected,input,number){
 const alias={'LCR 022':'142','LCR 030':'380','LCR 033':'49','LCR 040':'85','LCR 060':'347','LCR 061':'373','LCR 071':'528','LCR 079':'78','LCR 080':'77','LCR 081':'39','LCR 082':'40','LCR 083':'46','LCR 084':'47','LCR 085':'22','LCR 086':'131','LCR 087':'93','LCR 110':'797','LCR 113':'210','LCR 114':'269','LCR 119':'128','面试题 04.02':'108','面试题 08.04':'78','面试题 10.02':'49'};
 const n=alias[String(number)]||String(number);
 if(n==='1203'){
  if(!expected.length)return closeEnough(actual,expected);
  const [size,,groups,before]=input;if(!Array.isArray(actual)||actual.length!==size||new Set(actual).size!==size||actual.some(x=>!Number.isInteger(x)||x<0||x>=size))return false;
  const pos=new Map(actual.map((v,i)=>[v,i]));if(before.some((deps,i)=>deps.some(d=>pos.get(d)>=pos.get(i))))return false;
  const last=new Map(),closed=new Set();let previous=-1;for(const v of actual){const g=groups[v];if(g!==previous){if(previous>=0)closed.add(previous);if(g>=0&&closed.has(g))return false;}previous=g;}return true;
 }
 if(n==='451'){if(typeof actual!=='string'||!closeEnough([...actual].sort(),[...input[0]].sort()))return false;const groups=actual.match(/(.)\1*/gs)||[];return new Set(groups.map(g=>g[0])).size===groups.length&&groups.every((g,i)=>i===0||groups[i-1].length>=g.length);}
 if(n==='470'||n==='528'){
  if(!Array.isArray(actual))return false;
  const weights=n==='470'?Array(10).fill(1):input[1][0][0],values=n==='470'?actual:actual.slice(1),total=weights.reduce((a,b)=>a+b,0);
  if(actual.length!==(n==='470'?input[0]:input[0].length)||(n==='528'&&actual[0]!==null))return false;
  const counts=Array(weights.length).fill(0);for(const value of values){const i=value-(n==='470'?1:0);if(!Number.isInteger(i)||i<0||i>=counts.length||weights[i]<=0)return false;counts[i]++;}
  return values.length<200||counts.every((c,i)=>Math.abs(c-values.length*weights[i]/total)<=5*Math.sqrt(values.length*weights[i]/total*(1-weights[i]/total))+1);
 }
 if(n==='LCR 139')return Array.isArray(actual)&&closeEnough(sorted(actual),sorted(input[0]))&&actual.every((x,i)=>x%2!==0||actual.slice(i).every(v=>v%2===0));
 if(n==='LCR 029')return Array.isArray(actual)&&closeEnough(sorted(actual),sorted([...input[0],input[1]]))&&actual.filter((v,i)=>v>actual[(i+1)%actual.length]).length<=1;
 if(n==='面试题 08.02'){
  if(!Array.isArray(actual))return false;if(!expected.length)return !actual.length;
  const grid=input[0],h=grid.length,w=grid[0].length;if(!closeEnough(actual[0],[0,0])||!closeEnough(actual.at(-1),[h-1,w-1]))return false;
  return actual.every(([r,c],i)=>Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&c>=0&&r<h&&c<w&&grid[r][c]===0&&(!i||((r-actual[i-1][0]===1&&c===actual[i-1][1])||(c-actual[i-1][1]===1&&r===actual[i-1][0]))));
 }
 if(n==='面试题 10.11')return Array.isArray(actual)&&closeEnough(sorted(actual),sorted(input[0]))&&actual.every((v,i)=>i%2===0?((i===0||v>=actual[i-1])&&(i===actual.length-1||v>=actual[i+1])):true);
 if(n==='面试题 16.21'){if(!expected.length)return closeEnough(actual,[]);const [a,b]=actual||[];return Array.isArray(actual)&&actual.length===2&&input[0].includes(a)&&input[1].includes(b)&&input[0].reduce((x,y)=>x+y,0)-a+b===input[1].reduce((x,y)=>x+y,0)-b+a;}
 if(n==='面试题 17.22'){if(!expected.length)return closeEnough(actual,[]);return Array.isArray(actual)&&actual[0]===input[0]&&actual.at(-1)===input[1]&&new Set(actual).size===actual.length&&actual.every((s,i)=>i===0||(input[2].includes(s)&&s.length===actual[i-1].length&&[...s].filter((c,j)=>c!==actual[i-1][j]).length===1));}
 if(n==='269'){
  if(!expected)return actual==='';if(typeof actual!=='string'||!closeEnough([...actual].sort(),[...new Set(input[0].join(''))].sort()))return false;
  for(let i=1;i<input[0].length;i++){const a=input[0][i-1],b=input[0][i];let j=0;while(j<Math.min(a.length,b.length)&&a[j]===b[j])j++;if(j===b.length&&a.length>b.length)return false;if(j<a.length&&j<b.length&&actual.indexOf(a[j])>=actual.indexOf(b[j]))return false;}return true;
 }
 if(n==='1'){const [a,b]=actual||[];return Array.isArray(actual)&&actual.length===2&&Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<input[0].length&&b<input[0].length&&a!==b&&input[0][a]+input[0][b]===input[1];}
 if(n==='5')return typeof actual==='string'&&actual.length===expected.length&&input[0].includes(actual)&&[...actual].reverse().join('')===actual;
 if(n==='162')return Number.isInteger(actual)&&actual>=0&&actual<input[0].length&&(actual===0||input[0][actual]>input[0][actual-1])&&(actual===input[0].length-1||input[0][actual]>input[0][actual+1]);
 if(n==='210'){if(!expected.length)return closeEnough(actual,expected);if(!Array.isArray(actual)||actual.length!==input[0]||new Set(actual).size!==input[0]||actual.some(x=>!Number.isInteger(x)||x<0||x>=input[0]))return false;const pos=new Map(actual.map((v,i)=>[v,i]));return input[1].every(([a,b])=>pos.get(b)<pos.get(a));}
 if(n==='108'){
  if(!Array.isArray(actual))return false;
  if(!actual.length)return input[0].length===0;
  const root={v:actual[0]},queue=[root];let i=1;
  for(let j=0;j<queue.length&&i<actual.length;j++)for(const side of ['l','r']){const v=actual[i++];if(v!==null&&v!==undefined){queue[j][side]={v};queue.push(queue[j][side]);}}
  const values=[];let valid=true;const visit=node=>{if(!node)return 0;const l=visit(node.l);values.push(node.v);const r=visit(node.r);if(Math.abs(l-r)>1)valid=false;return 1+Math.max(l,r);};visit(root);
  return valid&&closeEnough(values,input[0])&&i>=actual.length;
 }
 if(n==='380'){
  if(!Array.isArray(actual)||actual.length!==input[0].length||actual[0]!==null)return false;
  const set=new Set();for(let i=1;i<input[0].length;i++){const op=input[0][i],v=input[1][i][0];if(op==='getRandom'){if(!set.has(actual[i]))return false;}else if(op==='insert'){if(actual[i]!==!set.has(v))return false;set.add(v);}else{if(actual[i]!==set.delete(v))return false;}}return true;
 }
 if(n==='373'){
  if(!Array.isArray(actual))return false;
  const all=input[0].flatMap(a=>input[1].map(b=>[a,b])).sort((a,b)=>a[0]+a[1]-b[0]-b[1]),count=Math.min(input[2],all.length);
  if(actual.length!==count)return false;
  const available=new Map();for(const p of all){const key=JSON.stringify(p);available.set(key,(available.get(key)||0)+1);}
  for(const p of actual){const key=JSON.stringify(p);if(!available.get(key))return false;available.set(key,available.get(key)-1);}
  return closeEnough(actual.map(p=>p[0]+p[1]).sort((a,b)=>a-b),all.slice(0,count).map(p=>p[0]+p[1]));
 }
 if(['49','15','39','78','77','40','面试题 16.24'].includes(n))return Array.isArray(actual)&&closeEnough(sorted(actual.map(v=>sorted(v))),sorted(expected.map(v=>sorted(v))));
 if(n==='2215')return Array.isArray(actual)&&actual.length===2&&actual.every((v,i)=>closeEnough(sorted(v),sorted(expected[i])));
 if(['46','17','22','131','51','347','212','27','30','47','93','95','442','721','797','863','584','1757','LCR 157','LCR 177','面试题 04.09','面试题 08.07','面试题 08.08','面试题 17.07','面试题 17.14','面试题 17.19','面试题 17.26'].includes(n))return Array.isArray(actual)&&closeEnough(sorted(actual),sorted(expected));
 return closeEnough(actual,expected);
}
