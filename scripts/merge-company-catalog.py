"""Merge attributed company study lists into the catalog without duplicating progress IDs."""
import json,re,subprocess,urllib.request,datetime
from pathlib import Path
file=Path('shared/catalog-data.json');data=json.loads(file.read_text(encoding='utf8'))
companies=json.loads(Path('shared/company-data.json').read_text(encoding='utf8'))
paths=subprocess.check_output(['git','-C','.tools/doocs-solutions','-c','core.quotepath=false','ls-tree','-r','--name-only','HEAD'],encoding='utf8').splitlines()
by_number={q['number']:q for q in data['questions']}
for company in companies:
 ids=[]
 for row in company['questions']:
  number=row['number']
  if number not in by_number:
   folder=next(p for p in paths if p.startswith('solution/') and p.split('/')[-2].startswith(number.zfill(4)+'.') and p.endswith('/README.md'))
   readme=subprocess.check_output(['git','-C','.tools/doocs-solutions','show','HEAD:'+folder],encoding='utf8')
   slug=re.search(r'https://leetcode.cn/problems/([^/)]+)',readme)[1]
   query='query q($slug:String!){ question(titleSlug:$slug){ title translatedTitle difficulty topicTags{name translatedName} } }'
   req=urllib.request.Request('https://leetcode.cn/graphql/',data=json.dumps({'query':query,'variables':{'slug':slug}}).encode(),headers={'Content-Type':'application/json'})
   with urllib.request.urlopen(req,timeout=30) as r:meta=json.load(r)['data']['question']
   q={'id':'lc-'+slug,'title':meta['translatedTitle'] or meta['title'],'englishTitle':meta['title'],'number':number,'slug':slug,'topic':'算法基础','difficulty':{'Easy':'简单','Medium':'中等','Hard':'困难'}[meta['difficulty']],'tags':[t['translatedName'] or t['name'] for t in meta['topicTags']],'sourceUrl':'https://leetcode.cn/problems/'+slug+'/','paidOnly':False,'collections':[]}
   data['questions'].append(q);by_number[number]=q
  q=by_number[number];cid='company-'+company['id'];ids.append(q['id'])
  if cid not in q['collections']:q['collections'].append(cid)
  q.setdefault('companies',[])
  if company['name'] not in q['companies']:q['companies'].append(company['name'])
 data['collections']=[c for c in data['collections'] if c['id']!=cid]
 data['collections'].append({'id':cid,'name':company['name']+'面经题单','description':company['note'],'questionIds':ids,'sourceUrl':company['sourceUrl'],'sourceName':'Onefly · 公开面经与备考清单','updatedAt':company['updatedAt'],'kind':'curated'})
data['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(len(data['questions']),len(data['collections']))
