"""Refresh public study-plan metadata. No account, cookies or problem text is distributed."""
import argparse
import json
from pathlib import Path
import re
import urllib.request
from datetime import datetime, timezone

PLANS = [
    ('hot100', 'top-100-liked', 'Hot 100', '高频算法主线，适合系统准备面试'),
    ('interview150', 'top-interview-150', '面试经典 150', '覆盖数组、链表、树、图与动态规划'),
    ('leetcode75', 'leetcode-75', 'LeetCode 75', '用较短题单建立核心解题模式'),
    ('offer75', 'coding-interviews', 'Interview 75 · 原剑指 Offer', '经典数据结构与面试基础'),
    ('offer119', 'coding-interviews-special', '119 经典题变种挑战', '按主题训练经典问题的迁移能力'),
    ('interview-gold', 'cracking-the-coding-interview', '程序员面试金典', '经典面试专题，包含设计与边界思考'),
    ('dp', 'dynamic-programming', '动态规划基础', '从状态定义到转移与空间优化'),
    ('binary-search', 'binary-search', '二分查找专题', '训练区间不变量与边界判断'),
    ('graph', 'graph-theory', '图论专题', '遍历、拓扑排序、连通性与最短路'),
    ('basics', 'programming-skills', '编程基础', '从语法走向可验证的函数实现'),
    ('beginners', 'primers-list', '编程入门', '初学者的短题练习'),
]
ALIASES = {'3': 'substring', '20': 'brackets', '56': 'merge', '200': 'islands', '322': 'coins', '704': 'binary'}

def parse_plan(html):
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not match: raise ValueError('Study-plan page format changed')
    data = json.loads(match.group(1))
    for query in data['props']['pageProps']['dehydratedState']['queries']:
        plan = query['state'].get('data', {}).get('studyPlanV2Detail')
        if plan: return plan
    raise ValueError('Study plan missing')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache', type=Path, default=Path('.tools/catalog'))
    parser.add_argument('--offline', action='store_true')
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    questions, collections = {}, []
    now = datetime.now(timezone.utc).isoformat()
    for collection_id, slug, name, description in PLANS:
        cached = args.cache / (slug + '.html')
        if args.offline and cached.exists():
            plan = parse_plan(cached.read_text(encoding='utf-8'))
        elif args.offline and (args.cache / (slug + '.json')).exists():
            obj = json.loads((args.cache / (slug + '.json')).read_text(encoding='utf-8'))
            plan = next(q['state']['data']['studyPlanV2Detail'] for q in obj['props']['pageProps']['dehydratedState']['queries'] if q['state'].get('data', {}).get('studyPlanV2Detail'))
        else:
            with urllib.request.urlopen('https://leetcode.cn/studyplan/' + slug + '/', timeout=30) as response:
                html = response.read().decode()
            plan = parse_plan(html)
            cached.write_text(html, encoding='utf-8')
        members = []
        for group in plan['planSubGroups']:
            for item in group['questions']:
                number = item['questionFrontendId']
                qid = ALIASES.get(number, 'lc-' + item['titleSlug'])
                if qid in members: continue
                members.append(qid)
                if qid not in questions:
                    questions[qid] = dict(id=qid, title=item['translatedTitle'] or item['title'], englishTitle=item['title'],
                        number=number, slug=item['titleSlug'], topic=group['name'],
                        difficulty={'EASY':'简单','MEDIUM':'中等','HARD':'困难'}[item['difficulty']],
                        tags=[t.get('nameTranslated') or t['name'] for t in item['topicTags']],
                        sourceUrl='https://leetcode.cn/problems/'+item['titleSlug']+'/', paidOnly=item['paidOnly'],
                        collections=[])
                questions[qid]['collections'].append(collection_id)
        if not members: raise ValueError('Empty plan: ' + slug)
        collections.append(dict(id=collection_id,name=name,description=description,questionIds=members,
            sourceUrl='https://leetcode.cn/studyplan/'+slug+'/',sourceName=plan['name'],updatedAt=now,kind='official'))
    # A transparent, deterministic project selection, not a claimed official Hot 200.
    expanded = list(dict.fromkeys(collections[0]['questionIds'] + collections[1]['questionIds'] + collections[2]['questionIds']))[:200]
    if len(expanded) != 200: raise ValueError('Hot 200 selection is incomplete')
    collections.insert(1, dict(id='hot200',name='Hot 200 · 扩展版',description='Hot 100 + 经典 150 的新增题，再按 LeetCode 75 顺序补齐 200 道。项目编排，非官方 Hot 200。',questionIds=expanded,sourceUrl='',sourceName='序列项目编排',updatedAt=now,kind='curated'))
    for qid in expanded: questions[qid]['collections'].append('hot200')
    output = dict(version=1,updatedAt=now,collections=collections,questions=list(questions.values()))
    out = Path('shared/catalog-data.json')
    out.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'questions':len(questions),'collections':[(c['id'],len(c['questionIds'])) for c in collections]}))

if __name__ == '__main__': main()
