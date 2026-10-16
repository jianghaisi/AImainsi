# 题库范围与维护

0.2.0 内置 12 套题单，按 LeetCode slug 去重后为 **647 道题**。加上原有独立训练与知识题，全新档案共有 653 条记录，其中 **203 道支持本地 Python / JavaScript 训练**。用户导入或同步的资料会增加个人档案数量。

| 题单 | 题数 | 编排来源 |
| --- | ---: | --- |
| Hot 100 | 100 | LeetCode 热题 100 |
| Hot 200 · 扩展版 | 200 | 本项目编排，非官方 Hot 200 |
| 面试经典 150 | 150 | LeetCode |
| LeetCode 75 | 75 | LeetCode |
| Interview 75 · 原剑指 Offer | 75 | LeetCode 当前公开题单 |
| 119 经典题变种挑战 | 119 | LeetCode |
| 程序员面试金典 | 109 | LeetCode |
| 动态规划基础 | 46 | LeetCode |
| 二分查找专题 | 32 | LeetCode |
| 图论专题 | 36 | LeetCode |
| 编程基础 | 33 | LeetCode |
| 编程入门 | 20 | LeetCode |

题单之间有重叠，数量不能直接相加。不同题号的变种仍视为不同题目。Hot 200 依次保留 Hot 100、经典 150 的新增题，再按 LeetCode 75 的顺序补齐。它是明确可复现的学习路线，不宣称统一的行业排名。

## 用户练习流程

选择题单 → 按难度、领域、进度筛选 → 练习 → 复述原理 → 写下易错点 → 安排间隔复习。题单共用收藏、笔记与完成状态；继续上次练习恢复题目和该语言草稿。

Hot 200 每道都有原创简短题意、思路、记忆提示和 Python 参考代码；146 道额外包含经本地验证的 JavaScript 参考代码，其余使用 Python 题解辅助学习。全部提供 Python / JavaScript / Java / C++ 模板。Java / C++ 参考代码覆盖随题目变化，需用户自配支持题目约定的判题服务。

其他题目提供原题链接、题单归属、难度、收藏、手动完成与笔记；**索引不等于已支持本地判题**。原站会员题会显示标识，应用不提供绕过会员的内容。手动完成不计入能力成绩。最新一次提交未通过时，状态回到练习中；手动标记仍单独保留。

本地训练使用公开示例进行练习反馈，不等于原站完整测试集或复杂度认证。多解题采用专用比较规则，例如回文、拓扑排序、平衡搜索树、随机集合、无序组合。只有“通过当前测试”的含义，不保证已覆盖所有边界。

链表以数组输入，树以层序数组输入，空节点使用 `null`。环链表使用数组和入口位置；相交链表按相交值与两个跳过长度重建共享节点。随机链表用 `[value, randomIndex]`；图用邻接表。设计题输入操作名数组和对应参数数组。Python 使用 `Solution` 类方法，JavaScript 使用模板中的函数或构造器。原有 8 道训练保留 `solve` 约定，升级不破坏旧草稿。

## 更新

应用的「更新题单」下载本项目 main 分支已发布的元数据快照。网络失败、结构校验失败、旧快照均不会替换更新的数据；个人练习、笔记与收藏保留。更新仅接受标题、题号、标签、链接与题单关系，不接收可执行代码。新增加的题目如果没有随应用打包的训练资源，会显示为来源索引。

这不是全网面经实时抓取。Zero2Leetcode 同步与 Spider_XHS 导入仍是独立数据源，遵守各自的更新频率和授权。题单快照由维护者主动更新后发布：

```sh
python scripts/update-catalog.py
npm run format
npm test
```

更新脚本从 11 个公开题单页面读取元数据，全部成功后才写文件。`--offline` 可重放 `.tools/catalog` 缓存。上游页面结构变化会报错，需维护者检查后再发布。

重建 Hot 200 训练包需要额外步骤；日常安装和测试不需要联网抓题：

```sh
python scripts/fetch-exercise-metadata.py
git clone https://github.com/neetcode-gh/leetcode .tools/neetcode-solutions
git -C .tools/neetcode-solutions checkout d5ebb3ea8bd4b52d605bc7aa179e22af684d31bb
node scripts/build-exercises.mjs
npm test
npm run test:e2e
```

上游题意全文仅放在忽略的构建缓存中；发布包包含本项目摘要、少量结构化示例与来源链接。参考代码逐文件保留来源、固定提交及 MIT 许可；修正或补充实现位于 `scripts/exercise-solutions` 和 `scripts/original-python.json`。构建报告列出缺失的语言参考实现，不把它们伪装成已验证代码。

`tests/catalog.test.mjs` 验证 200 道题的数据、模板、参考实现、迁移与判题规则；浏览器测试还将全部 200 份 Python 参考代码运行在应用使用的 Pyodide WASM 环境里。
