# Dental Patient Companion Demo

向牙科诊所演示患者治疗陪伴流程。患者资料和回答均为 mock 数据，不连接真实医院、电子病历、LINE 或数据库。

- 本地运行：聊天走 Hermes Agent → Magpie `group/default`，并保留 mock 知识库兜底。
- GitHub Pages：纯静态站点，聊天使用三语 mock 知识库，不需要或公开任何密钥。
- 技术栈：Next.js、TypeScript、Tailwind CSS。

## 患者页面

- 山田太郎：`/patient/yamada/`
- 佐藤花子：`/patient/sato/`

网站：<https://dental.iamcheyan.com/>

## 本地开发

```bash
cd ~/development/dental-patient-companion-demo
pnpm install
pnpm dev
```

打开 <http://127.0.0.1:3000/>。若要走 Hermes，需要本机 Magpie 与 Hermes 配置可用；密钥只从本机私有环境加载，不要写入仓库。

本地生产模式：

```bash
pnpm build
pnpm start
```

Next 服务绑定 `127.0.0.1:3010`。Hermes 后端由 `src/app/api/chat/route.ts` 提供。

## Mock 问答

公开站点从 `mock/knowledge-base.json` 按问题匹配回答，支持中文、日语和英语。未配置的问题返回对应语言的固定演示提示，不会调用 Hermes 或外部模型。

修改患者资料请编辑 `mock/patients.json`；修改问答请编辑 `mock/knowledge-base.json`。

## 二维码

二维码指向公开域名，可按需重新生成：

```bash
PUBLIC_BASE_URL=https://dental.iamcheyan.com pnpm qr
```

生成结果写入 `public/patient-a.png` 与 `public/patient-b.png`。

## GitHub Pages 部署

推送到 `master` 后，`.github/workflows/pages.yml` 构建并部署静态网站。Pages 构建会临时排除本地 Hermes API 路由，并以 `NEXT_PUBLIC_MOCK_CHAT=true` 构建；仓库中的本地 API 源码仍保留，普通本地构建不受影响。

自定义域名配置文件位于 `public/CNAME`。DNS 使用 `dental.iamcheyan.com` 指向 GitHub Pages。

## 安全与适用范围

所有姓名、治疗经过、预约和问答均为演示数据。此站点不提供医疗诊断或治疗建议，也不应写入真实患者信息。不要提交 `.env.local`、API key、Token 或其他凭据。
