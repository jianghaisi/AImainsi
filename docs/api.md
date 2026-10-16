# 自定义接口

## 模型

基础地址后拼接 `/chat/completions`；也接受已经带此路径的地址。请求为 JSON `POST`：

```json
{"model":"your-model","messages":[{"role":"system","content":"..."},{"role":"user","content":"..."}],"temperature":0.7}
```

如果设置密钥则带 `Authorization: Bearer <key>`。响应读取 `choices[0].message.content`。回答评分与画像分析会在提示词中要求 JSON，应用校验字段；此版本不直接支持所有厂商的原生协议，也不使用流式输出。

面试请求会包含用户填写的简历、目标岗位、公司画像、相关题库资料和该轮对话。只会发给用户设置的接口。原生 Android 通过 Capacitor HTTP 发送请求，因此不会因 WebView 的跨域策略要求额外配置浏览器 CORS。

## Java / C++ 判题

将设置中的「判题接口」指向你拥有的评测服务完整 URL。不要将模型 API 填到这里。应用不附带服务器，也不直接适配 Judge0 / Piston 协议；需要适配器返回以下格式。

请求（可选 Bearer 密钥）：

```json
{
  "questionId":"problem-id",
  "language":"java",
  "code":"用户源代码",
  "args":["nums","target"],
  "tests":[{"input":[[1,3,5],3],"expected":1}]
}
```

`language` 为 `java` 或 `cpp`。服务端按顺序运行每个测试，约定将参数传给 `solve(...)`，类型参考题目模板。Java 模板为 `Solution` 类中的实例方法，通过 `new Solution().solve(...)` 调用；C++ 模板为独立函数，服务端负责编译时包裹入口。

以上 `solve` 约定用于原有训练题。0.2.0 新增 Hot 200 题会在请求中附带 `adapter` 元数据，例如 `{"number":"1","name":"twoSum","params":[{"name":"nums","type":"integer[]"},{"name":"target","type":"integer"}],"return":{"type":"integer[]"}}`。服务端应根据模板调用对应方法；`systemdesign:true` 的题目包含 `classname`，需要按操作序列构造对象并调用方法。不能把这些题目直接当作 `solve` 运行。

链表、树、图与设计题的 JSON 转换规则可参考 `public/exercise-runtime.py` / `.mjs`；多解与无序结果比较见 `public/judge.mjs`。它们是本地训练协议的实现参考，适配器仍需自行在编译型语言环境实现相同语义。没有 `adapter` 时继续使用原有协议。

响应：

```json
{"results":[{"passed":true,"actual":1}]}
```

失败用例可返回 `{"passed":false,"error":"编译错误或执行异常"}`。结果数量必须等于测试数量。服务端必须自行负责隔离执行、时间/内存限制、编译器版本、结果比对及请求鉴权；客户端不会把代码交给宿主机 shell。应用会保存返回的逐例结果，但无法替第三方服务证明其判题准确性。

## 导入面经

在题库导入 JSON 数组，接受条目里的 `title`、`desc`/`content`、`url`/`sourceUrl`。例如：

```json
[{"title":"某场算法面试","desc":"讨论了注意力缩放和模型部署。","url":"https://example.org/interview"}]
```

导入后进入待审核状态。保留真实出处，不要把猜测当成企业官方规则。
