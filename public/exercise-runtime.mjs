// Original Sequence JSON adapters. Code inside the editor uses standard LeetCode signatures.
export class ListNode { constructor(val=0,next=null){this.val=val;this.next=next;} }
export class TreeNode { constructor(val=0,left=null,right=null){Object.assign(this,{val,left,right,next:null});} }
class RandomNode {constructor(val=0,next=null,random=null){Object.assign(this,{val,next,random});}}
class GraphNode {constructor(val=0,neighbors=[]){Object.assign(this,{val,neighbors});}}
class QuadNode {constructor(val=false,isLeaf=false,topLeft=null,topRight=null,bottomLeft=null,bottomRight=null){Object.assign(this,{val,isLeaf,topLeft,topRight,bottomLeft,bottomRight});}}
export function list(values){const nodes=(values||[]).map(v=>new ListNode(v));nodes.forEach((n,i)=>n.next=nodes[i+1]||null);return [nodes[0]||null,nodes];}
export function tree(values){if(!values?.length||values[0]===null)return null;const root=new TreeNode(values[0]),queue=[root];let i=1;for(let j=0;j<queue.length&&i<values.length;j++)for(const side of ['left','right']){const v=values[i++];if(v!==null&&v!==undefined){queue[j][side]=new TreeNode(v);queue.push(queue[j][side]);}}return root;}
function listValues(head){const out=[],seen=new Set();while(head){if(seen.has(head))throw Error('输出链表仍有环');seen.add(head);out.push(head.val);head=head.next;}return out;}
function treeValues(root){if(!root)return [];const queue=[root],out=[],seen=new Set();for(let i=0;i<queue.length;i++){const n=queue[i];if(!n){out.push(null);continue;}if(seen.has(n))throw Error('树结构有环或重复节点');seen.add(n);out.push(n.val);queue.push(n.left,n.right);}while(out.at(-1)===null)out.pop();return out;}
// Compatibility with commonly used priority-queue helpers; O(log n) insert/remove.
class Heap {
 constructor(compare=(a,b)=>a-b){this.items=[];this.compare=compare;}
 push(value){const a=this.items;a.push(value);let i=a.length-1;while(i){const p=(i-1)>>1;if(this.compare(a[p],a[i])<=0)break;[a[p],a[i]]=[a[i],a[p]];i=p;}}
 pop(){const a=this.items;if(!a.length)return undefined;const first=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;while(2*i+1<a.length){let j=2*i+1;if(j+1<a.length&&this.compare(a[j+1],a[j])<0)j++;if(this.compare(a[i],a[j])<=0)break;[a[i],a[j]]=[a[j],a[i]];i=j;}}return first;}
}
function queues(legacy){
 const make=(direction)=>class {
  constructor(options={}){this.priority=typeof options==='function'?options:options.priority||((x)=>x);this.heap=new Heap(options.compare?(a,b)=>options.compare(a.element,b.element):(a,b)=>direction*(a.priority-b.priority));}
  enqueue(element,priority){this.heap.push({element,priority:priority??this.priority(element)});return this;}
  dequeue(){const n=this.heap.pop();return legacy?n:n?.element;}
  front(){const n=this.heap.items[0];return legacy?n:n?.element;}
  size(){return this.heap.items.length;}
  isEmpty(){return !this.size();}
  toArray(){return [...this.heap.items].sort(this.heap.compare).map(n=>legacy?n:n.element);}
 };
 return [make(1),make(-1)];
}
export function createExercise(code,meta){
 const original=String(meta.number),number=({'detectCycle':'142','hasCycle':'141','getIntersectionNode':'160','copyRandomList':'138','cloneGraph':'133','lowestCommonAncestor':'236'})[meta.name]||(original==='LCR 171'?'160':original), Node=number==='138'?RandomNode:number==='133'?GraphNode:number==='427'?QuadNode:number==='LCR 029'?ListNode:TreeNode;
 const legacy=/\.(?:dequeue|front)\(\)\.element|\{\s*element\s*\}\s*=/.test(code);
 const [MinPriorityQueue,MaxPriorityQueue]=queues(legacy);
 const name=meta.systemdesign?meta.classname:meta.name;
 class Queue {constructor(values=[]){this.values=[...values];this.head=0;}enqueue(v){this.values.push(v);return this;}dequeue(){return this.values[this.head++];}front(){return this.values[this.head];}size(){return this.values.length-this.head;}isEmpty(){return !this.size();}}
 class PriorityQueue {constructor(compare){this.heap=new Heap(compare);}enqueue(x){this.heap.push(x);}dequeue(){return this.heap.pop();}front(){return this.heap.items[0];}size(){return this.heap.items.length;}isEmpty(){return !this.size();}}
 const lower=(a,x,fn=v=>v)=>{let l=0,r=a.length;while(l<r){const m=(l+r)>>1;if(fn(a[m])<fn(x))l=m+1;else r=m;}return l;};
 const _={sortedIndex:(a,x)=>lower(a,x),sortedIndexBy:lower};let hidden;
 const guess=x=>Math.sign(hidden-x),rand7=()=>1+Math.floor(Math.random()*7);
 let fn=new Function('ListNode','TreeNode','Node','_Node','MinPriorityQueue','MaxPriorityQueue','Queue','PriorityQueue','_','guess','rand7',`return (()=>{${code}\nreturn ${name};})();`)(ListNode,TreeNode,Node,Node,MinPriorityQueue,MaxPriorityQueue,Queue,PriorityQueue,_,guess,rand7);
 const convert=(v,type)=>type==='TreeNode'?tree(v):type==='ListNode'?list(v)[0]:v;
 const encode=v=>v instanceof TreeNode?treeValues(v):v instanceof ListNode?listValues(v):Array.isArray(v)?v.map(encode):v;
 return (inputs)=>{
  const args=structuredClone(inputs);
  if(meta.systemdesign){const [ops,params]=args;const specs=(meta.constructor?.params||[]).filter(p=>!p.lang);params[0]=params[0].map((v,i)=>convert(v,specs[i]?.type));if(number==='173')params[0]=[tree(inputs[1][0][0])];const obj=new fn(...params[0]);return [null,...ops.slice(1).map((op,i)=>encode(obj[op](...params[i+1])??null))];}
  if(number==='278')return fn(x=>x>=args[1])(args[0]);
  if(number==='374'){hidden=args[1];return fn(args[0]);}
  if(number==='470')return Array.from({length:args[0]},()=>fn());
  if(number==='702')return fn({get:i=>i>=0&&i<args[0].length?args[0][i]:2147483647},args[1]);
  if(number==='LCR 029'){const [head,nodes]=list(args[0]);if(nodes.length)nodes.at(-1).next=head;let r=fn(head,args[1]);const first=r,out=[],seen=new Set();while(r&&!seen.has(r)){seen.add(r);out.push(r.val);r=r.next;}if(r!==first||out.length!==nodes.length+1)throw Error('输出必须是插入一个节点后的完整循环链表');return out;}
  if(number==='141'||number==='142'){const [head,nodes]=list(args[0]);if(nodes.length&&args[1]>=0)nodes.at(-1).next=nodes[args[1]];const r=fn(head);return number==='141'?r:r===null?-1:nodes.indexOf(r);}
  if(number==='160'){const [value,a,b,sa,sb]=args;const [ha,na]=list(a);let [hb,nb]=list(b);let joint=null;if(value){joint=na[sa];if(sb)nb[sb-1].next=joint;else hb=joint;}const r=fn(ha,hb);return r===joint?(r?.val??null):'__wrong_identity__';}
  if(number==='138'){const nodes=args[0].map(([v])=>new RandomNode(v));nodes.forEach((n,i)=>{n.next=nodes[i+1]||null;n.random=nodes[args[0][i][1]]||null;});let r=fn(nodes[0]||null);const out=[],seen=new Set();while(r){if(nodes.includes(r))throw Error('需要复制节点');if(seen.has(r))throw Error('输出链表存在环');seen.add(r);out.push(r);r=r.next;}return out.map(n=>[n.val,n.random?out.indexOf(n.random):null]);}
  if(number==='133'){const nodes=args[0].map((_,i)=>new GraphNode(i+1));nodes.forEach((n,i)=>n.neighbors=args[0][i].map(j=>nodes[j-1]));const r=fn(nodes[0]||null);if(!r)return [];const found=new Map(),stack=[r];while(stack.length){const n=stack.pop();if(found.has(n.val))continue;if(nodes.includes(n))throw Error('需要克隆图');found.set(n.val,n.neighbors.map(n=>n.val).sort((a,b)=>a-b));stack.push(...n.neighbors);}return [...found.keys()].sort((a,b)=>a-b).map(k=>found.get(k));}
  if(number==='427'){const queue=[fn(args[0])],out=[];for(let i=0;i<queue.length;i++){const n=queue[i];if(!n){out.push(null);continue;}out.push([+!!n.isLeaf,n.isLeaf?+!!n.val:0]);if(!n.isLeaf)queue.push(n.topLeft,n.topRight,n.bottomLeft,n.bottomRight);}while(out.at(-1)===null)out.pop();return out;}
  (meta.params||[]).forEach((p,i)=>{if(p.type==='TreeNode'&&!((['236','863'].includes(number)||meta.name==='inorderSuccessor')&&i>0))args[i]=tree(args[i]);if(p.type==='ListNode')args[i]=list(args[i])[0];if(p.type==='ListNode[]')args[i]=args[i].map(a=>list(a)[0]);});
  if(number==='117')args[0]=tree(inputs[0]);
  if(['236','863'].includes(number)||meta.name==='inorderSuccessor'){const nodes=new Map(),stack=[args[0]];while(stack.length){const n=stack.pop();if(n){nodes.set(n.val,n);stack.push(n.left,n.right);}}args[1]=nodes.get(inputs[1]);if(number==='236')args[2]=nodes.get(inputs[2]);}
  const result=fn(...args);
  if(number==='236'||meta.name==='inorderSuccessor')return result?.val??null;
  if(number==='114'){let n=args[0];const out=[],seen=new Set();while(n){if(n.left||seen.has(n))throw Error('展开结果的 left 指针或环不合法');seen.add(n);out.push(n.val);n=n.right;}return out;}
  if(number==='117'){let level=args[0]?[args[0]]:[];const out=[];while(level.length){level.forEach((n,i)=>{if((n.next??null)!==(level[i+1]??null))throw Error('next 指针不正确');out.push(n.val);});out.push('#');level=level.flatMap(n=>[n.left,n.right].filter(Boolean));}return out;}
  if(['26','27','80','443'].includes(number))return args[0].slice(0,result);
  if(meta.return?.type==='void')return encode(args[meta.output?.paramindex||0]);
  if(meta.return?.type==='TreeNode')return treeValues(result);
  if(meta.return?.type==='ListNode')return listValues(result);
  return encode(result);
 };
}
