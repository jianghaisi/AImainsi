"""Select licensed solution files only; upstream checkout stays in ignored build cache."""
import json,re,subprocess
from pathlib import Path
root='.tools/doocs-solutions'
paths=subprocess.check_output(['git','-C',root,'-c','core.quotepath=false','ls-tree','-r','--name-only','HEAD'],text=True,encoding='utf8').splitlines()
catalog=json.loads(Path('shared/catalog-data.json').read_text(encoding='utf8'))
existing=set(next(c['questionIds'] for c in catalog['collections'] if c['id']=='hot200'))
offer=['03','04','05','06','07','09','10- I','10- II','11','12','13','14- I','14- II','15','16','17','18','19','20','21','22','24','25','26','27','28','29','30','31','32 - I','32 - II','32 - III','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53 - I','53 - II','54','55 - I','55 - II','56 - I','56 - II','57','57 - II','58 - I','58 - II','59 - I','59 - II','60','61','62','63','64','65','66','67','68 - I','68 - II']
def normalized(s):return re.sub(r'\s','',s)
dirs=list(dict.fromkeys(p.rsplit('/',1)[0] for p in paths if p.endswith('/README.md')))
result={};selected=['/LICENSE'];missing=[]
for q in catalog['questions']:
 if q['id'] in existing:continue
 n=q['number'];folder=None
 if n.isdigit():folder=next((d for d in dirs if d.startswith('solution/') and d.rsplit('/',1)[1].startswith(n.zfill(4)+'.')),None)
 elif n.startswith('面试题 '):folder=next((d for d in dirs if d.startswith('lcci/'+n.split()[1]+'.')),None)
 elif n.startswith('LCR '):
  num=int(n.split()[1])
  if num<120:folder=next((d for d in dirs if d.startswith('lcof2/剑指 Offer II '+str(num).zfill(3)+'.')),None)
  else:
   prefix='lcof/面试题'+normalized(offer[num-120])+'.'
   folder=next((d for d in dirs if normalized(d).startswith(prefix)),None)
 if not folder:missing.append(n);continue
 files=[p for p in paths if p.rsplit('/',1)[0]==folder and p.rsplit('/',1)[1] in ['README.md','Solution.py','Solution.ts','Solution.js','Solution.java','Solution.cpp']]
 result[q['id']]={'folder':folder,'files':files}
 selected.extend('/'+p for p in files)
Path('.tools/catalog/doocs-map.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
Path('.tools/catalog/sparse-paths.txt').write_text('\n'.join(selected)+'\n',encoding='utf8')
print(json.dumps({'mapped':len(result),'files':len(selected),'missing':missing},ensure_ascii=False))
