"""Execute bundled Python references with the same adapter as the WASM worker."""
import json, pathlib, contextlib, io, traceback

runtime = pathlib.Path('public/exercise-runtime.py').read_text(encoding='utf8')
pathlib.Path('.tools/catalog').mkdir(parents=True, exist_ok=True)
results = []
for path in pathlib.Path('public/exercises').glob('*.json'):
    pack = json.loads(path.read_text(encoding='utf8'))
    namespace = {}
    output = []
    try:
        compile(pack['starters']['python'], str(path)+' template', 'exec')
        exec(runtime, namespace)
        namespace['_seq_setup'](namespace,pack['adapter'])
        with contextlib.redirect_stdout(io.StringIO()):
            exec(pack['solutions']['python'], namespace)
            for case in pack['tests']:
                try:
                    output.append({'actual': namespace['_seq_run'](namespace, pack['adapter'], case['input'])})
                except Exception:
                    output.append({'error': traceback.format_exc()})
    except Exception:
        output = [{'error': traceback.format_exc()}]
    results.append({'number':pack['number'], 'output':output})
pathlib.Path('.tools/catalog/python-results.json').write_text(json.dumps(results, ensure_ascii=False, default=str), encoding='utf8')
