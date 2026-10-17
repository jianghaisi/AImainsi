"""Sequence's JSON adapters for standard interview data structures (MIT)."""
from typing import *
from collections import *
from functools import *
from itertools import *
from heapq import *
from bisect import *
from math import *
from random import randint, randrange, choice, shuffle
from operator import xor, or_, and_
from string import ascii_lowercase
from builtins import pow
import collections, functools, itertools, heapq, bisect, math, random, copy
inf = float('inf')

class ListNode:
    def __init__(self, val=0, next=None): self.val, self.next = val, next

class TreeNode:
    def __init__(self, val=0, left=None, right=None): self.val, self.left, self.right, self.next = val, left, right, None

class RandomNode:
    def __init__(self, x=0, next=None, random=None): self.val, self.next, self.random = x, next, random

class GraphNode:
    def __init__(self, val=0, neighbors=None): self.val, self.neighbors = val, neighbors or []

class QuadNode:
    def __init__(self, val=False, isLeaf=False, topLeft=None, topRight=None, bottomLeft=None, bottomRight=None):
        self.val, self.isLeaf = val, isLeaf
        self.topLeft, self.topRight, self.bottomLeft, self.bottomRight = topLeft, topRight, bottomLeft, bottomRight

class MultiNode:
    def __init__(self,val=0,prev=None,next=None,child=None):self.val,self.prev,self.next,self.child=val,prev,next,child

def _seq_setup(ns,meta):
    name=meta.get('name');number=str(meta['number'])
    node='RandomNode' if name=='copyRandomList' or number=='138' else 'GraphNode' if name=='cloneGraph' or number=='133' else 'QuadNode' if number=='427' else 'MultiNode' if number=='LCR 028' else 'ListNode' if number=='LCR 029' else 'TreeNode'
    ns['Node']=ns[node];ns['_Node']=ns[node]

def _seq_convert(value,kind):
    if kind=='TreeNode':return _seq_tree(value)
    if kind=='ListNode':return _seq_list(value)[0]
    if kind=='ListNode[]':return [_seq_list(v)[0] for v in value]
    return value

def _seq_encode(value):
    if isinstance(value,TreeNode):return _seq_tree_values(value)
    if isinstance(value,ListNode):return _seq_list_values(value)
    if isinstance(value,(list,tuple,set,type({}.values()))):return [_seq_encode(v) for v in value]
    return value

def _seq_list(values):
    nodes = [ListNode(v) for v in values or []]
    for a,b in zip(nodes,nodes[1:]): a.next=b
    return (nodes[0] if nodes else None), nodes

def _seq_tree(values):
    if not values or values[0] is None: return None
    root=TreeNode(values[0]); queue=deque([root]); i=1
    while queue and i<len(values):
        node=queue.popleft()
        for side in ('left','right'):
            if i<len(values) and values[i] is not None:
                child=TreeNode(values[i]);setattr(node,side,child);queue.append(child)
            i+=1
    return root

def _seq_tree_values(root):
    if not root:return []
    out=[];queue=deque([root]);seen=set()
    while queue:
        n=queue.popleft()
        if n is None:out.append(None);continue
        if id(n) in seen:raise ValueError('树结构有环或重复节点')
        seen.add(id(n));out.append(n.val);queue.extend([n.left,n.right])
    while out and out[-1] is None:out.pop()
    return out

def _seq_list_values(head):
    values=[];seen=set()
    while head:
        if id(head) in seen:raise ValueError('输出链表仍然有环')
        seen.add(id(head));values.append(head.val);head=head.next
    return values

def _seq_run(ns, meta, inputs):
    number=str(meta['number']); args=copy.deepcopy(inputs)
    name=meta.get('name')
    number={'detectCycle':'142','hasCycle':'141','getIntersectionNode':'160','copyRandomList':'138','cloneGraph':'133','lowestCommonAncestor':'236'}.get(name,number)
    if str(meta['number'])=='LCR 171':number='160'
    if meta.get('systemdesign'):
        operations,params=args
        specs=[p for p in meta.get('constructor',{}).get('params',[]) if not p.get('lang')]
        params[0]=[_seq_convert(v,specs[i]['type']) if i<len(specs) else v for i,v in enumerate(params[0])]
        if number=='173':params[0]=[_seq_tree(inputs[1][0][0])]
        obj=ns[meta['classname']](*params[0]);result=[None]
        for op,params in zip(operations[1:],params[1:]):result.append(_seq_encode(getattr(obj,op)(*params)))
        return result
    if name=='Codec':
        codec=ns['Codec']();root=_seq_tree(args[0]);serialized=codec.serialize(root)
        if not isinstance(serialized,str):raise ValueError('serialize 必须返回字符串')
        return _seq_tree_values(codec.deserialize(serialized))
    target=ns['Solution']();fn=getattr(target,meta['name'])
    if number in ('278','374'):
        hidden=args[1];ns['isBadVersion']=lambda n:n>=hidden;ns['guess']=lambda n:(hidden>n)-(hidden<n)
        return fn(args[0])
    if number=='470':
        ns['rand7']=lambda:randint(1,7)
        return [fn() for _ in range(args[0])]
    if number in ('702','1533'):
        class ArrayReader:
            def get(self,i):return args[0][i] if 0<=i<len(args[0]) else 2147483647
            def length(self):return len(args[0])
            def compareSub(self,l,r,x,y):
                a,b=sum(args[0][l:r+1]),sum(args[0][x:y+1]);return (a>b)-(a<b)
        return fn(ArrayReader(),*args[1:])
    if number=='LCR 029':
        head,nodes=_seq_list(args[0])
        if nodes:nodes[-1].next=head
        result=fn(head,args[1]);out=[];seen=set()
        while result and id(result) not in seen:seen.add(id(result));out.append(result.val);result=result.next
        if not result or len(out)!=len(args[0])+1:raise ValueError('输出应为增加一个节点后的完整循环链表')
        return out
    if number=='LCR 028':
        values=args[0];head=None;previous=None;level=[];parent_level=[];index=0
        for v in values:
            if v is None:
                if level:parent_level=level;level=[];index=0;previous=None
                else:index+=1
                continue
            node=MultiNode(v);level.append(node)
            if previous:previous.next=node;node.prev=previous
            elif head is None:head=node
            elif parent_level:parent_level[index].child=node
            previous=node
        result=fn(head);out=[];previous=None;seen=set()
        while result:
            if result.child or result.prev is not previous or id(result) in seen:raise ValueError('扁平链表的 child、prev 或环不正确')
            seen.add(id(result));out.append(result.val);previous=result;result=result.next
        return out
    if number=='LCR 155':
        root=_seq_tree(args[0]);result=fn(root);out=[];seen=set();head=result
        while result and id(result) not in seen:
            if result.right.left is not result or result.left.right is not result:raise ValueError('双向指针不对称')
            seen.add(id(result));out.append(result.val);result=result.right
        if result is not head:raise ValueError('结果不是完整循环链表')
        return out
    if number=='面试题 02.03':
        head,nodes=_seq_list(args[0]);fn(next(n for n in nodes if n.val==args[1]));return _seq_list_values(head)
    if number in ('141','142'):
        head,nodes=_seq_list(args[0]);pos=args[1]
        if nodes and pos>=0:nodes[-1].next=nodes[pos]
        result=fn(head)
        if number=='141':return result
        if result is None:return -1
        return next((i for i,node in enumerate(nodes) if node is result),-2)
    if number=='160':
        value,a,b,skip_a,skip_b=args
        ha,na=_seq_list(a);hb,nb=_seq_list(b);joint=None
        if value:
            joint=na[skip_a]
            if skip_b:nb[skip_b-1].next=joint
            else:hb=joint
        result=fn(ha,hb)
        return (result.val if result else None) if result is joint else '__wrong_identity__'
    if number=='138':
        nodes=[RandomNode(v[0]) for v in args[0]]
        for i,(value,rand) in enumerate(args[0]):
            nodes[i].next=nodes[i+1] if i+1<len(nodes) else None
            nodes[i].random=nodes[rand] if rand is not None else None
        result=fn(nodes[0] if nodes else None);out=[];seen=set()
        while result:
            if result in nodes:raise ValueError('需要复制节点，不能返回原链表')
            if id(result) in seen:raise ValueError('输出链表存在环')
            seen.add(id(result));out.append(result);result=result.next
        return [[n.val,next((i for i,v in enumerate(out) if v is n.random),None)] for n in out]
    if number=='133':
        nodes=[GraphNode(i+1) for i in range(len(args[0]))]
        for node,neighbors in zip(nodes,args[0]):node.neighbors=[nodes[i-1] for i in neighbors]
        result=fn(nodes[0] if nodes else None)
        if not result:return []
        found={};queue=[result]
        while queue:
            node=queue.pop()
            if node.val in found:continue
            if node in nodes:raise ValueError('需要克隆图，不能返回原节点')
            found[node.val]=sorted(n.val for n in node.neighbors);queue.extend(node.neighbors)
        return [found[k] for k in sorted(found)]
    if number=='427':
        result=fn(args[0]);queue=deque([result]);out=[]
        while queue:
            n=queue.popleft()
            if n is None:out.append(None);continue
            out.append([int(bool(n.isLeaf)),int(bool(n.val)) if n.isLeaf else 0])
            if not n.isLeaf:queue.extend([n.topLeft,n.topRight,n.bottomLeft,n.bottomRight])
        while out and out[-1] is None:out.pop()
        return out
    for i,p in enumerate(meta.get('params',[])):
        if p['type']=='TreeNode' and not ((number in ('236','863') or name=='inorderSuccessor') and i>0):args[i]=_seq_tree(args[i])
        elif p['type']=='ListNode':args[i]=_seq_list(args[i])[0]
        elif p['type']=='ListNode[]':args[i]=[_seq_list(a)[0] for a in args[i]]
    if number=='117':args[0]=_seq_tree(inputs[0])
    if number in ('236','863') or name=='inorderSuccessor':
        root=args[0];lookup={};stack=[root]
        while stack:
            n=stack.pop()
            if n:lookup[n.val]=n;stack.extend([n.left,n.right])
        args[1]=lookup[inputs[1]]
        if number=='236':args[2]=lookup[inputs[2]]
    result=fn(*args)
    if number=='236' or name=='inorderSuccessor':return result.val if result else None
    if number=='114':
        out=[];node=args[0];seen=set()
        while node:
            if node.left:raise ValueError('展开后 left 应为空')
            if id(node) in seen:raise ValueError('展开结果有环')
            seen.add(id(node));out.append(node.val);node=node.right
        return out
    if number=='117':
        out=[];level=[args[0]] if args[0] else []
        while level:
            for i,n in enumerate(level):
                if getattr(n,'next',None) is not (level[i+1] if i+1<len(level) else None):raise ValueError('next 指针不正确')
                out.append(n.val)
            out.append('#');level=[c for n in level for c in [n.left,n.right] if c]
        return out
    if number in ('26','27','80','443'):return args[0][:result]
    if meta.get('return',{}).get('type')=='void':return _seq_encode(args[meta.get('output',{}).get('paramindex',0)])
    if meta.get('return',{}).get('type')=='TreeNode':return _seq_tree_values(result)
    if meta.get('return',{}).get('type')=='ListNode':return _seq_list_values(result)
    if isinstance(result,(set,tuple,type({}.values()))):return list(result)
    return _seq_encode(result)
