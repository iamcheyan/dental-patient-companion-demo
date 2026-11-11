# Dental Patient Companion Demo

向牙科诊所院长演示：**AI 如何持续陪伴患者理解自己的治疗过程**。

- 全部 Mock 数据（`/mock`），不接入真实医院 / EMR / LINE / 数据库
- 聊天路由：`magpie/default`（本机 Magpie OpenAI-compatible → Hermes Agent）
- 技术栈：Next.js · TypeScript · Tailwind

## 患者入口

| 二维码 | 患者 | 路径 | 图片 |
| --- | --- | --- | --- |
| A | 山田太郎 | `/patient/yamada` | `public/patient-a.png` |
| B | 佐藤花子 | `/patient/sato` | `public/patient-b.png` |

首页同时展示两枚二维码与直接链接。

## 1. 启动方法

```bash
cd ~/development/dental-patient-companion-demo
pnpm install

# Magpie 网关密钥（本机已有时从环境加载即可）
# export MAGPIE_GATEWAY_KEY=...   # 勿提交
# 可选覆盖：
# export MAGPIE_BASE_URL=http://127.0.0.1:3425/v1
# export MAGPIE_MODEL=group/default

pnpm qr          # 生成本地 URL 二维码
pnpm dev         # http://127.0.0.1:3000
```

生产模式：

```bash
pnpm build && pnpm start
```

确认 Magpie 在 loopback 监听（默认 `127.0.0.1:3425`），且模型列表包含 `group/default`。

## 2. 二维码生成方法

```bash
# 本地
PUBLIC_BASE_URL=http://127.0.0.1:3000 pnpm qr

# Tailscale 暴露后（把主机名换成你的）
PUBLIC_BASE_URL=https://debian.tailb4776a.ts.net:3010 pnpm qr
```

输出：

- `public/patient-a.png` → `/patient/yamada`
- `public/patient-b.png` → `/patient/sato`

更换公网/ tailnet URL 后务必重新生成并刷新浏览器缓存。

## 3. Tailscale Serve 配置方法（最小权限）

只暴露 **当前 Next.js 端口**，禁止 SSH / Exit Node / Subnet Router / 整机 / 文件系统。

```bash
# 1) 本机只绑 loopback
pnpm build
PORT=3010 HOSTNAME=127.0.0.1 pnpm start

# 2) 仅 tailnet 暴露该端口（优先 serve，不要 funnel 除非明确需要公网）
sudo tailscale serve --bg --https=3010 http://127.0.0.1:3010

# 查看
tailscale serve status
```

手机需与本机同一 Tailscale tailnet，然后打开：

```text
https://<你的-magicdns主机名>:3010/
```

并用同一 `PUBLIC_BASE_URL` 重新 `pnpm qr`。

可选 funnel（公网，权限更大，默认不要开）：

```bash
# 仅在明确需要公网扫码时
# sudo tailscale funnel --bg --https=3010 http://127.0.0.1:3010
```

## 4. 如何关闭外部访问

```bash
sudo tailscale serve reset
# 若开过 funnel：
# sudo tailscale funnel reset

tailscale serve status   # 应不再指向 3010
# 并停掉 Next 进程
```

注意：`serve reset` 会清掉本机所有 serve 规则。若机器上还有其它 serve 路径，请改用精确删除当前 3010 映射的方式，而不是整表 reset。

## Agent 行为（Hermes + Magpie）

聊天**不再直连 Magpie 裸 completion**。服务端调用：

1. （若已启用）Hermes API Server `http://127.0.0.1:8642/v1` → 全量 Hermes Agent  
2. 否则 `hermes chat --oneshot`（`--provider custom` + Magpie `group/default`）  
3. 再否则本地 mock KB 兜底  

产品名 `magpie/default` = 线缆模型 id `group/default`。

环境变量（`.env.local`，不入库）：

- `MAGPIE_GATEWAY_KEY` / `MAGPIE_BASE_URL` / `MAGPIE_MODEL=group/default`
- `HERMES_API_BASE_URL` / `HERMES_API_KEY` / `HERMES_MODEL=hermes-agent`（API Server 启用后）

启用 API Server（需在 **gateway 外** 的 shell 执行一次重启）：

```bash
# ~/.hermes/.env 已含 API_SERVER_ENABLED=true 与 key
systemctl --user restart hermes-gateway.service
```

## Agent 行为

- 不得编造患者信息；只使用 `mock/patients.json` + `mock/knowledge-base.json`
- 自动识别中文 / 日语 / 英语，**用提问语言回答**
- 知识库未覆盖时返回统一「演示环境未配置」提示（三语）

## Mock 目录

```text
mock/
  patients.json
  knowledge-base.json
```

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `MAGPIE_GATEWAY_KEY` | （必填走模型） | Magpie API key |
| `MAGPIE_BASE_URL` | `http://127.0.0.1:3425/v1` | OpenAI-compatible 根 |
| `MAGPIE_MODEL` | `group/default` | 即 magpie/default |
| `PUBLIC_BASE_URL` | `http://127.0.0.1:3000` | 二维码目标根 URL |

密钥只放在本机环境或 `~/.env`，**不要写入仓库**。
