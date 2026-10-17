"""Generate syntax-checked method stubs without copying reference implementation bodies."""
import ast,json
from pathlib import Path
mapping=json.loads(Path('.tools/catalog/doocs-map.json').read_text(encoding='utf8'))
catalog=json.loads(Path('shared/catalog-data.json').read_text(encoding='utf8'))
for q in catalog['questions']:
 if q['id'] not in mapping:continue
 file=Path('public/exercises')/(q['number']+'.json');p=json.loads(file.read_text(encoding='utf8'))
 tree=ast.parse(p['solutions']['python']);name=p['adapter'].get('classname') or ('Codec' if p['adapter'].get('name')=='Codec' else 'Solution')
 cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name==name)
 methods=[]
 for method in cls.body:
  api_names=([m['name'] for m in p['adapter'].get('methods',[])]+['__init__']) if p['adapter'].get('systemdesign') else ['serialize','deserialize'] if name=='Codec' else [p['adapter']['name']]
  if isinstance(method,ast.FunctionDef) and method.name in api_names:
   method.body=ast.parse('raise NotImplementedError("请完成此方法")').body
   methods.append(method)
 cls.body=methods;cls.bases=[];cls.decorator_list=[]
 module=ast.Module(body=[cls],type_ignores=[])
 p['starters']['python']=ast.unparse(ast.fix_missing_locations(module))+'\n'
 compile(p['starters']['python'],str(file),'exec')
 file.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
