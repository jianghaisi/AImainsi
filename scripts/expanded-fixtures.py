"""Reviewed examples and original adaptations for contracts requiring a custom harness."""
import json
from pathlib import Path
out={}
def add(n,cases=None,py=None,js=None,**extra):
 d=out.setdefault(n,{})
 if cases is not None:d['tests']=[{'input':a,'expected':b} for a,b in cases]
 for lang,code in [('python',py),('javascript',js)]:
  if code:d.setdefault('solutions',{})[lang]=code;d.setdefault('credits',{})[lang]='序列原创适配'
 d.update(extra)
def clone(n,base,**kw):
 if base=='110':return add(n,[([[3,9,20,None,None,15,7]],True),([[1,2,2,3,3,None,None,4,4]],False)])
 p=json.loads(Path('public/exercises/'+base+'.json').read_text(encoding='utf8'));add(n,[(t['input'],t['expected']) for t in p['tests']],**kw)
clone('LCR 022','142');clone('面试题 02.08','142');clone('面试题 01.07','48');clone('面试题 04.02','108');clone('面试题 04.04','110');clone('面试题 04.05','98');clone('面试题 04.12','437');clone('面试题 10.09','240');clone('面试题 03.02','155');clone('面试题 03.04','232');clone('面试题 16.25','146');clone('面试题 17.20','295')
add('LCR 169',[(['leetcode'],'l'),(['aabb'],' '),([''],' ')])
add('LCR 174',[([[3,1,4,None,2],1],4),([[5,3,6,2,4,None,None,1],3],4)])
add('LCR 133',[([11],3),([128],1),([4294967293],31)])
add('面试题 02.02',[([[1,2,3,4,5],2],4),([[7],1],7)])
add('面试题 02.03',[([[4,5,1,9],5],[4,1,9]),([[4,5,1,9],1],[4,5,9])])
add('面试题 02.05',[([[7,1,6],[5,9,2]],[2,1,9]),([[9,9],[1]],[0,0,1])])
add('面试题 02.06',[([[1,2,2,1]],True),([[1,2]],False),([[]],True)])
add('面试题 04.03',[([[1,2,3,4,5,None,7,8]],[[1],[2,3],[4,5,7],[8]]),([[]],[])])
add('面试题 04.06',[([[2,1,3],1],2),([[5,3,6,2,4,None,None,1],6],None)])
add('面试题 05.01',[([1024,19,2,6],1100),([0,31,0,4],31)])
add('面试题 05.03',[([1775],8),([7],4),([0],1),([-1],32)])
add('面试题 08.06',[([[2,1,0],[],[]],[2,1,0]),([[0],[],[]],[0])])
add('面试题 16.02',[([['WordsFrequency','get','get','get'],[[['i','have','an','apple','he','have','a','pen']],['have'],['apple'],['missing']]],[None,2,1,0])])
add('面试题 16.06',[([[1,3,15,11,2],[23,127,235,19,8]],3),([[-2147483648],[2147483647]],4294967295)])
add('面试题 16.13',[([[-1,-1,2],[0,-1,2]],[-1,0,2,0]),([[0,0,2],[0,3,2]],[1,0,1,5])])
add('面试题 16.09',[([['Operations','minus','multiply','divide','divide'],[[],[5,7],[-3,4],[13,-3],[-13,3]]],[None,-2,-12,-4,-4])])
add('LCR 061',[([[1,7,11],[2,4,6],3],[[1,2],[1,4],[1,6]]),([[1,1,2],[1,2,3],2],[[1,1],[1,1]])])
add('LCR 140',[([[2,4,7,8],1],[8]),([[2,4,7,8],3],[4,7,8])])
add('LCR 125',[([['CQueue','appendTail','deleteHead','deleteHead'],[[],[3],[],[]]],[None,None,3,-1])])
add('LCR 184',[([['Checkout','add','add','get_max','remove','get_max'],[[],[1],[2],[],[],[]]],[None,None,None,2,1,2]),([['Checkout','remove','get_max'],[[],[],[]]],[None,-1,-1])])
add('LCR 122',py='class Solution:\n    def pathEncryption(self, path: str) -> str:\n        return path.replace(".", " ")\n',js='function pathEncryption(path) { return path.replaceAll(".", " "); }',description='将路径字符串中的每个英文句点 . 替换成一个空格，其他字符保持原样。返回替换后的字符串。',explanation='逐字符扫描，遇到句点输出空格，否则输出原字符。时间 O(n)，返回新字符串需要 O(n) 空间。',memory='路径分隔符是句点，不是原版 Offer 的空格。用 a.b → a b 和空字符串校验方向，记住“只改分隔符”。')
add('2336',py='''class SmallestInfiniteSet:
    def __init__(self): self.next_value=1; self.heap=[]; self.added=set()
    def popSmallest(self):
        if self.heap:
            value=heappop(self.heap);self.added.remove(value);return value
        value=self.next_value;self.next_value+=1;return value
    def addBack(self,num):
        if num<self.next_value and num not in self.added:self.added.add(num);heappush(self.heap,num)
''')
add('LCR 057',py='''class Solution:
    def containsNearbyAlmostDuplicate(self, nums, k, t):
        buckets={};width=t+1
        for i,x in enumerate(nums):
            b=x//width
            if b in buckets or (b-1 in buckets and x-buckets[b-1]<=t) or (b+1 in buckets and buckets[b+1]-x<=t):return True
            buckets[b]=x
            if i>=k:del buckets[nums[i-k]//width]
        return False
''')
add('LCR 058',py='''class MyCalendar:
    def __init__(self): self.intervals=[]
    def book(self,start,end):
        i=bisect_left(self.intervals,(start,end))
        if i and self.intervals[i-1][1]>start:return False
        if i<len(self.intervals) and self.intervals[i][0]<end:return False
        self.intervals.insert(i,(start,end));return True
''',explanation='按开始时间保存互不重叠的半开区间 [start,end)。二分找到插入位置，只需比较前一区间的结束与后一区间的开始。端点相等不冲突。本实现使用有序数组，每次预约的插入成本 O(n)，查询位置 O(log n)，空间 O(n)。')
add('面试题 04.09',py='''class Solution:
    def BSTSequences(self, root):
        if not root:return [[]]
        result=[]
        def visit(frontier,path):
            if not frontier:result.append(path);return
            for i,node in enumerate(frontier):
                rest=frontier[:i]+frontier[i+1:]
                if node.left:rest.append(node.left)
                if node.right:rest.append(node.right)
                visit(rest,path+[node.val])
        visit([root],[]);return result
''',explanation='插入序列中，父节点必须先于子节点出现。维护当前可选节点集合：选一个节点后，把它的孩子加入候选，回溯枚举下一位；候选为空时保存一条序列。空树对应一个空序列。',memory='先父后子，左右子树可以交错。画出根为 2、孩子为 1 和 3 的树：合法顺序只有 2,1,3 与 2,3,1。候选集合代表“父节点已经写过”。')
add('面试题 16.03',[([[0,0],[1,0],[1,1],[0,-1]],[0.5,0]),([[0,0],[3,0],[1,0],[2,0]],[1,0]),([[0,0],[1,0],[2,0],[3,0]],[])],py='''class Solution:
    def intersection(self, start1, end1, start2, end2):
        def cross(a,b):return a[0]*b[1]-a[1]*b[0]
        def sub(a,b):return [a[0]-b[0],a[1]-b[1]]
        a,b,c,d=start1,end1,start2,end2;r,s=sub(b,a),sub(d,c);den=cross(r,s);ca=sub(c,a)
        if den:
            t,u=cross(ca,s)/den,cross(ca,r)/den
            return [a[0]+t*r[0],a[1]+t*r[1]] if 0<=t<=1 and 0<=u<=1 else []
        def on(p,x,y):return cross(sub(p,x),sub(y,x))==0 and all(min(x[i],y[i])<=p[i]<=max(x[i],y[i]) for i in (0,1))
        points=[p for p in (a,b,c,d) if on(p,a,b) and on(p,c,d)]
        return min(points) if points else []
''',explanation='将两线段写为 a+t·r 与 c+u·s。叉积求出参数 t、u，只有两者均在 [0,1] 才在线段内。平行时检查端点是否同时位于两线段；重合区间返回横坐标最小、再纵坐标最小的端点。',memory='先分非平行与平行。直线相交不等于线段相交，必须检查 t 和 u 的范围；平行还要区分共线、重叠与分离。')
add('面试题 16.08',py='''class Solution:
    def numberToWords(self,num):
        small="Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen".split()
        tens="Zero Ten Twenty Thirty Forty Fifty Sixty Seventy Eighty Ninety".split()
        def part(n):
            if n==0:return []
            if n<20:return [small[n]]
            if n<100:return [tens[n//10]]+part(n%10)
            return [small[n//100],"Hundred"]+part(n%100)
        if num==0:return "Zero"
        result=[]
        for unit,label in [(10**9,"Billion"),(10**6,"Million"),(1000,"Thousand"),(1,"")]:
            n,num=divmod(num,unit)
            if n:result.extend(part(n));result.extend([label] if label else [])
        return " ".join(result)
''',explanation='按十亿、百万、千、个位依次拆成三个数字一组。组内处理百位、二十以下特殊词、整十词和个位；数值为零的组跳过，最后用单个空格连接。整体零单独返回 Zero。',memory='三位一组，组内百十个，组外 Billion/Million/Thousand。用 1001 检查中间空组，用 20 检查末尾空格，用 0 检查特殊返回。')
add('面试题 16.09',py='''class Operations:
    def minus(self,a,b): return a + (~b + 1)
    def multiply(self,a,b):
        negative=(a<0)!=(b<0);a=abs(a);b=abs(b);result=0
        while b:
            if b&1:result+=a
            a+=a;b>>=1
        return ~result+1 if negative else result
    def divide(self,a,b):
        if not b:raise ValueError("division by zero")
        negative=(a<0)!=(b<0);a=abs(a);b=abs(b);result=0
        for bit in range(31,-1,-1):
            step=b<<bit
            if step<=a:a=self.minus(a,step);result+=1<<bit
        return ~result+1 if negative else result
''',description='实现减法、乘法与向零取整的整数除法，不直接使用 -、*、/、% 算术运算符。本训练允许位运算；若按原题“仅允许加法”的加强约束练习，应进一步用倍增加法和取反数替换位运算。',explanation='减法使用补码取负后相加。乘法按二进制位累加翻倍的被乘数；除法从高位到低位试减倍增的除数。先处理绝对值，最后恢复符号以保证向零取整。此实现展示允许位运算的训练版本。',memory='符号最后还原：-13 除以 3 应为 -4。乘法是选倍数，除法是减倍数；实现限制要先与面试官确认，本页位运算版本不能冒充仅加法版本。')
add('面试题 17.01',py='''class Solution:
    def add(self,a,b):
        mask=(1<<32)-1
        while b:a,b=(a^b)&mask,((a&b)<<1)&mask
        return a if a<1<<31 else ~(a^mask)
''',explanation='异或得到不含进位的和，与运算后左移得到进位；重复直到进位为零。Python 整数无固定位宽，每轮需要截断到 32 位，最后按符号位恢复有符号值。',memory='异或算本位，与后左移算进位。负数用 32 位掩码避免无限进位，测试 -1+1、负数相加和零。')
for n in ['528','LCR 071']:
 add(n,[([['Solution']+['pickIndex']*1200,[[[1,3]]]+[[]]*1200],[None]+[0]*1200)])
add('470',[([2000],[0]*2000)])
# SQL also has equivalent row-processing exercises in Python/JavaScript.
add('584',[([[[1,'Will',None],[2,'Jane',None],[3,'Alex',2],[4,'Bill',None],[5,'Zack',1],[6,'Mark',2]]],['Will','Jane','Bill','Zack']),([[[1,'A',2],[2,'B',1],[3,'C',None]]],['B','C'])],py='class Solution:\n    def find_customers(self, rows):\n        return [name for _,name,referee in rows if referee != 2]\n',js='function find_customers(rows) { return rows.filter(r=>r[2]!==2).map(r=>r[1]); }',adapter={'database':True,'name':'find_customers','params':[{'name':'rows','type':'list'}],'return':{'type':'list'},'sqlSchema':'CREATE TABLE Customer (id INTEGER, name TEXT, referee_id INTEGER);','sqlTable':'Customer'},description='表 Customer(id, name, referee_id) 中，找出推荐人不是 2 的客户姓名；没有推荐人的客户也必须保留。SQL 返回 name 一列；Python/JavaScript 输入为行数组并返回姓名数组。',explanation='SQL 的 NULL 不参与普通不等比较，因此条件要写为 referee_id <> 2 OR referee_id IS NULL。不要只写 <> 2，否则会漏掉未填写推荐人的客户。',memory='NULL 不是“别的数字”，它表示未知。把 referee_id=2、1、NULL 三种情况逐个代入 WHERE 条件。')
add('1757',[([[[0,'Y','N'],[1,'Y','Y'],[2,'N','Y'],[3,'Y','Y'],[4,'N','N']]],[1,3]),([[[5,'N','N'],[6,'Y','Y']]],[6])],py='class Solution:\n    def find_products(self, rows):\n        return [id for id,low,recyclable in rows if low == "Y" and recyclable == "Y"]\n',js='function find_products(rows) { return rows.filter(r=>r[1]==="Y"&&r[2]==="Y").map(r=>r[0]); }',adapter={'database':True,'name':'find_products','params':[{'name':'rows','type':'list'}],'return':{'type':'list'},'sqlSchema':'CREATE TABLE Products (product_id INTEGER, low_fats TEXT, recyclable TEXT);','sqlTable':'Products'},description='表 Products(product_id, low_fats, recyclable) 中，返回同时满足低脂与可回收（两列均为 Y）的产品编号。SQL 返回 product_id 一列；Python/JavaScript 使用行数组。',explanation='两个要求必须同时成立，用 AND 连接条件，再只选择 product_id 列。空表或没有匹配行时返回空结果。',memory='“同时”对应 AND，“任一”才对应 OR。用 Y/N、N/Y、Y/Y 三行检查筛选是否过宽。')
for n,query in [('584','SELECT name FROM Customer WHERE referee_id <> 2 OR referee_id IS NULL;'),('1757',"SELECT product_id FROM Products WHERE low_fats = 'Y' AND recyclable = 'Y';")]:
 out[n]['solutions']['sql']=query;out[n]['credits']['sql']='序列原创适配';out[n]['starters']={'sql':'-- 在这里编写 SELECT 查询\n','python':'class Solution:\n    def '+out[n]['adapter']['name']+'(self, rows):\n        raise NotImplementedError("请完成此方法")\n','javascript':'function '+out[n]['adapter']['name']+'(rows) { throw Error("请完成此方法"); }'}
add('LCR 122',[(['a.aef.qerf.bb'],'a aef qerf bb'),([''],''),(['plain'],'plain')])
add('面试题 16.09',py='''class Operations:
    def negate(self,a):
        step=-1 if a>0 else 1;result=0
        while a!=0:
            delta=step
            while (a>0 and a+delta+delta>=0) or (a<0 and a+delta+delta<=0):delta+=delta
            a+=delta;result+=delta
        return result
    def minus(self,a,b):return a+self.negate(b)
    def multiply(self,a,b):
        negative=b<0
        if negative:b=self.negate(b)
        chunks=[];count=1;value=a
        while count<=b:chunks.append((count,value));count+=count;value+=value
        result=0
        for count,value in reversed(chunks):
            if count<=b:b=self.minus(b,count);result+=value
        return self.negate(result) if negative else result
    def divide(self,a,b):
        if b==0:raise ValueError("division by zero")
        negative=(a<0)!=(b<0)
        if a<0:a=self.negate(a)
        if b<0:b=self.negate(b)
        chunks=[];count=1;value=b
        while value<=a:chunks.append((value,count));value+=value;count+=count
        result=0
        for value,count in reversed(chunks):
            if value<=a:a=self.minus(a,value);result+=count
        return self.negate(result) if negative else result
''',description='设计 Operations 类，实现 minus(a,b)、multiply(a,b)、divide(a,b)。只能用加法完成数值运算，不使用减、乘、除、取模或位运算；允许比较、分支、循环和整数常量。除法向零截断，除数非零。',explanation='先实现取相反数：以 ±1 为步长，通过倍增加速把数值移到零，累计的步长就是相反数。减法转为加相反数。乘法保存倍增的次数与数值，再从大到小选取；除法保存倍增的除数，从大到小试减并累加商。符号独立处理，最后恢复。',memory='先解决取负，再复用减法；乘法选倍数，除法减倍数。倍增也用 x+x。检查 -13/3=-4、13/-3=-4，避免语言的向下取整规则混入题意。')
for n in ['584','1757']:out[n]['tests'].append({'input':[[]],'expected':[]})
for n in ['528','LCR 071']:out[n]['tests'][0]['expected']='首项 null；随后 1200 次抽样只返回 0 或 1，频率与权重 1:3 相符（统计容差内）。'
out['470']['tests'][0]['expected']='2000 个 1 至 10 的整数，各值频率接近均匀分布（统计容差内）。'
add('面试题 04.03',py='''class Solution:
    def listOfDepth(self,tree):
        result=[];level=[tree] if tree else []
        while level:
            dummy=ListNode();tail=dummy;next_level=[]
            for node in level:
                tail.next=ListNode(node.val);tail=tail.next
                if node.left:next_level.append(node.left)
                if node.right:next_level.append(node.right)
            result.append(dummy.next);level=next_level
        return result
''',js='''function listOfDepth(tree) {
 let level=tree?[tree]:[],result=[];
 while(level.length){const dummy=new ListNode();let tail=dummy,next=[];for(const node of level){tail.next=new ListNode(node.val);tail=tail.next;if(node.left)next.push(node.left);if(node.right)next.push(node.right);}result.push(dummy.next);level=next;}return result;
}''')
Path('scripts/expanded-overrides.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
