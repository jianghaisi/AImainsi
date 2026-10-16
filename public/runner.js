// Runs in a disposable worker. No application state or credentials are sent here.
let runtime;
function closeEnough(a,b){if(typeof a==='number'&&typeof b==='number')return Number.isFinite(a)&&Math.abs(a-b)<=1e-5*Math.max(1,Math.abs(b));if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((x,i)=>closeEnough(x,b[i]));return JSON.stringify(a)===JSON.stringify(b);}
self.onmessage=async({data})=>{
 try{
  const {language,code,tests}=data;const results=[];
  if(language==='python'){
   self.postMessage({status:'正在加载本地 Python 运行时…'});
   const {loadPyodide}=await import('/pyodide/pyodide.mjs');runtime=await loadPyodide({indexURL:'/pyodide/'});
   // Python is isolated in a browser worker, not executed on the host OS.
   runtime.setStdout({batched:()=>{}});runtime.setStderr({batched:()=>{}});
   runtime.globals.set('_user_code',code);runtime.globals.set('_test_json',JSON.stringify(tests));
   const output=await runtime.runPythonAsync(`import json, traceback\n_test_cases = json.loads(_test_json)\n_namespace = {}\nexec(_user_code, _namespace)\n_results = []\nfor _case in _test_cases:\n    try:\n        _actual = _namespace['solve'](*_case['input'])\n        _results.append({'actual': _actual})\n    except Exception as e:\n        _results.append({'error': str(e)})\njson.dumps(_results, allow_nan=False)`);
   const values=JSON.parse(output);values.forEach((r,i)=>results.push({...r,passed:!r.error&&closeEnough(r.actual,tests[i].expected)}));
  }else{
   const solve=new Function(code+'\n;return solve;')();
   for(const test of tests){try{const actual=await solve(...structuredClone(test.input));results.push({actual,passed:closeEnough(actual,test.expected)});}catch(e){results.push({passed:false,error:String(e.message)});}}
  }
  self.postMessage({results});
 }catch(e){self.postMessage({error:String(e.message||e)});}
};
