import json,time,urllib.request,concurrent.futures
from pathlib import Path
data=json.loads(Path('shared/catalog-data.json').read_text(encoding='utf-8'))
ids=set(next(c['questionIds'] for c in data['collections'] if c['id']=='hot200'))
questions=[q for q in data['questions'] if q['id'] in ids]
cache=Path('.tools/catalog/meta');cache.mkdir(parents=True,exist_ok=True)
query='query q($titleSlug: String!) { question(titleSlug:$titleSlug) { titleSlug questionFrontendId metaData exampleTestcases content translatedContent codeSnippets {langSlug code} } }'
def work(q):
 file=cache/(q['slug']+'.json')
 if file.exists():return
 request=urllib.request.Request('https://leetcode.cn/graphql/',data=json.dumps({'query':query,'variables':{'titleSlug':q['slug']}}).encode(),headers={'Content-Type':'application/json','Referer':'https://leetcode.cn/'})
 with urllib.request.urlopen(request,timeout=30) as r:result=json.load(r)['data']['question']
 if not result:raise RuntimeError(q['slug'])
 file.write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
 time.sleep(.2)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for i,_ in enumerate(pool.map(work,questions)):
  if i%25==0:print('Metadata cached',i+1,flush=True)
print('Cached',len(questions),flush=True)
