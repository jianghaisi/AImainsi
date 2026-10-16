export function closeEnough(a,b){
 if(typeof a==='number'&&typeof b==='number')return Number.isFinite(a)&&Math.abs(a-b)<=1e-5*Math.max(1,Math.abs(b));
 if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((v,i)=>closeEnough(v,b[i]));
 return JSON.stringify(a)===JSON.stringify(b);
}
const sorted=a=>a.map(x=>JSON.stringify(x)).sort();
export function judge(actual,expected,input,number){
 const n=String(number);
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
 if(['49','15','39','78','77'].includes(n))return Array.isArray(actual)&&closeEnough(sorted(actual.map(v=>sorted(v))),sorted(expected.map(v=>sorted(v))));
 if(n==='2215')return Array.isArray(actual)&&actual.length===2&&actual.every((v,i)=>closeEnough(sorted(v),sorted(expected[i])));
 if(['46','17','22','131','51','347','212','27','30'].includes(n))return Array.isArray(actual)&&closeEnough(sorted(actual),sorted(expected));
 return closeEnough(actual,expected);
}
