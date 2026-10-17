// Disposable worker: no application state or credentials are sent here.
import {createExercise} from './exercise-runtime.mjs';
import {judge,closeEnough} from './judge.mjs';
import {runSQL} from './sql-runtime.mjs';
self.onmessage=async({data})=>{
 try{
  const {language,code,tests,adapter}=data,results=[];
  const check=(actual,test)=>adapter?judge(actual,test.expected,test.input,adapter.number):closeEnough(actual,test.expected);
  if(language==='sql'){
   if(!adapter?.database)throw Error('当前题目不支持 SQL');
   self.postMessage({status:'正在加载本地 SQLite…'});
   const {default:initSqlJs}=await import('/sqlite/sql-wasm.mjs');
   const SQL=await initSqlJs({locateFile:file=>'/sqlite/'+file});
   for(const test of tests){try{const actual=runSQL(SQL,code,adapter,test.input);results.push({actual,passed:check(actual,test)});}catch(e){results.push({passed:false,error:e.message});}}
  }else if(language==='python'){
   self.postMessage({status:'正在加载本地 Python 运行时…'});
   const {loadPyodide}=await import('/pyodide/pyodide.mjs');
   const runtime=await loadPyodide({indexURL:'/pyodide/'});
   runtime.setStdout({batched:()=>{}});runtime.setStderr({batched:()=>{}});
   runtime.globals.set('_user_code',code);
   runtime.globals.set('_test_json',JSON.stringify(tests));
   runtime.globals.set('_adapter_json',JSON.stringify(adapter||null));
   runtime.globals.set('_adapter_source',adapter?await (await fetch('/exercise-runtime.py')).text():'');
   const output=await runtime.runPythonAsync(`
import json
_test_cases = json.loads(_test_json)
_meta = json.loads(_adapter_json)
_namespace = {}
if _meta:
    exec(_adapter_source, _namespace)
    _namespace['_seq_setup'](_namespace, _meta)
exec(_user_code, _namespace)
_results = []
for _case in _test_cases:
    try:
        _actual = _namespace['_seq_run'](_namespace, _meta, _case['input']) if _meta else _namespace['solve'](*_case['input'])
        json.dumps(_actual, allow_nan=False)
        _results.append({'actual': _actual})
    except Exception as e:
        _results.append({'error': str(e)})
json.dumps(_results, allow_nan=False)`);
   JSON.parse(output).forEach((r,i)=>{
     try{results.push({...r,passed:!r.error&&check(r.actual,tests[i])});}
     catch(e){results.push({passed:false,error:'返回值格式不符合题目要求：'+e.message});}
   });
  }else{
   const run=adapter?createExercise(code,adapter):(input)=>new Function(code+'\n;return solve;')()(...input);
   for(const test of tests){try{const actual=await run(structuredClone(test.input));results.push({actual,passed:check(actual,test)});}catch(e){results.push({passed:false,error:String(e.message)});}}
  }
  self.postMessage({results});
 }catch(e){self.postMessage({error:String(e.message||e)});}
};
