# 题库范围与维护

0.3.0 内置 16 套题单，按 LeetCode slug 去重后为 **671 道题，全部带可运行训练包、题解和记忆提示**。加上原有独立训练与知识题，全新档案共有 677 条记录，其中 **673 道可运行训练**。Python 覆盖全部目录题目，JavaScript 参考实现覆盖 487 道，另有 2 道 SQL 训练。用户导入或同步的资料会增加个人档案数量。

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
| 华为面经题单 | 71 | [Onefly 华为](https://onefly.top/zero2Leetcode/05_interview/coding/huawei/) |
| 字节跳动面经题单 | 52 | [Onefly 字节](https://onefly.top/zero2Leetcode/05_interview/coding/bytedance-202604/index.html) |
| 腾讯面经题单 | 50 | [Onefly 腾讯](https://onefly.top/zero2Leetcode/05_interview/coding/tencent-202604/index.html) |
| 美团面经题单 | 34 | [Onefly 美团](https://onefly.top/zero2Leetcode/05_interview/coding/meituan/index.html) |

题单之间有重叠，数量不能直接相加。不同题号的变种仍视为不同题目。Hot 200 依次保留 Hot 100、经典 150 的新增题，再按 LeetCode 75 的顺序补齐。它是明确可复现的学习路线，不宣称统一的行业排名。

## 用户练习流程

选择题单 → 按难度、领域、进度筛选 → 练习 → 复述原理 → 写下易错点 → 安排间隔复习。题单共用收藏、笔记与完成状态；继续上次练习恢复题目和该语言草稿。

全部目录题目均可进入手撕训练。题解支持公式排版；参考实现、训练提示和改编许可逐题显示。每道都有 Python 模板，其他语言按实际资源提供；Java / C++ 参考代码用于阅读，需要用户自配支持题目约定的判题服务，未声称所有 Java / C++ 实现已完成编译验证。

升级将原有目录索引转为可运行题目，保留 ID、草稿、收藏、笔记与手动完成标记。原站会员题仍显示标识；应用使用公开授权的实现与自行整理的训练说明，不获取会员私有判题数据。手动完成不计入能力成绩。最新一次提交未通过时，状态回到练习中；手动标记仍单独保留。

公司归类来自来源文章中实际列出的题目，未把文章声称的更大统计总量冒充已收录题数。来源包含面经样本和备考清单，不是企业官方题库，也不是可靠出题概率。同一道题可以出现在多个公司题单；筛选公司会切换到全部题目的范围，避免默认 Hot 100 隐藏公司题目。

本地训练使用公开示例进行练习反馈，不等于原站完整测试集或复杂度认证。多解题采用专用比较规则，例如回文、拓扑排序、平衡搜索树、随机集合、无序组合。只有“通过当前测试”的含义，不保证已覆盖所有边界。

共 1617 组训练用例。随机抽样题使用取值范围和频率容差校验，结果不是固定数组，也不是均匀性证明。数据库题用隔离的内存 SQLite 执行真实 SQL，覆盖空表和 NULL；同时提供等价 Python / JavaScript 行筛选练习。所有运行资源包含在 Windows 和 Android 安装包中，手机无需连接桌面或项目服务器。

链表以数组输入，树以层序数组输入，空节点使用 `null`。环链表使用数组和入口位置；相交链表按相交值与两个跳过长度重建共享节点。随机链表用 `[value, randomIndex]`；图用邻接表。设计题输入操作名数组和对应参数数组。Python 使用 `Solution` 类方法，JavaScript 使用模板中的函数或构造器。原有 8 道训练保留 `solve` 约定，升级不破坏旧草稿。

## 更新

应用的「更新题单」下载本项目 main 分支已发布的元数据快照。网络失败、结构校验失败、旧快照均不会替换更新的数据；个人练习、笔记与收藏保留。更新仅接受标题、题号、标签、链接与题单关系，不接收可执行代码。新增加的题目如果没有随应用打包的训练资源，会显示为来源索引。

这不是全网面经实时抓取。Zero2Leetcode 同步与 Spider_XHS 导入仍是独立数据源，遵守各自的更新频率和授权。题单快照由维护者主动更新后发布：

```sh
python scripts/update-catalog.py
node scripts/update-company-index.mjs
python scripts/merge-company-catalog.py
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

扩展训练包使用固定版本 Doocs 解法与解释（CC BY-SA 4.0），不可把这些部分重新标为 MIT。重建时先按上述步骤生成 Hot 200，再运行：

```sh
git clone --filter=blob:none --no-checkout https://github.com/doocs/leetcode .tools/doocs-solutions
git -C .tools/doocs-solutions checkout --detach 90e141b377963eddd5b84f830c18c429ce2ed093
python scripts/prepare-expanded-sources.py
python scripts/fetch-exercise-metadata.py --all
python scripts/expanded-fixtures.py
node scripts/build-expanded-exercises.mjs
npm run format
npm test
npm run test:e2e
npm run test:local
```

上游题意全文仅放在忽略的构建缓存中；发布包包含训练摘要、少量结构化示例与来源链接。Hot 200 的 NeetCode 实现保留 MIT 许可；扩展包的 Doocs 实现与派生解释保留 CC BY-SA 4.0。改编包括 LCR 接口更名、TypeScript 转译、提示整理和必要的语义修正。原创替换实现在 `scripts/expanded-fixtures.py`、`scripts/exercise-solutions` 和 `scripts/original-python.json`，并逐份标记。详见 [NOTICE](../NOTICE.md)。

`tests/catalog.test.mjs` 验证 671 道题的数据、Python 模板、参考实现和迁移；`tests/expanded.test.mjs` 检查公司归属、SQL 与错误答案。浏览器测试将全部 671 份 Python 参考代码运行在应用使用的 Pyodide WASM 环境里，并在 390px 手机视口验证公司题目、SQL、离线资源和草稿持久化。
