# 星舰 Starship 展示站

发射倒计时、飞行时序、飞行器名录、封路海滩与 Starbase 发射场地图。

## 推荐运行方式

**不要**直接双击 `index.html`（`file://` 下部分 `fetch` 会失败）。请使用本地 HTTP 服务：

```bash
npm run dev
```

浏览器打开终端提示的地址（默认 http://localhost:3000），例如：

- 主页：`/#home`
- 任务时序：`/#missions`
- 飞行器：`/#vehicles`
- 封路：`/#closures`
- 深链到事件 12：`/#missions&e=12`

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 静态站点预览（端口 3000） |
| `npm run start` | NXSF 监测服务 `http://localhost:3847` |
| `npm run build:data` | 从 `3` / `vehicles-source-3.txt` 生成飞行器 JSON/JS；同步封路 |
| `npm run sync:closures` | 仅从 starbase.texas.gov 更新封路数据 |

## 配置下一发任务

编辑 `data/config.js`：

1. 将 `activeFlight` 改为 `13`（或新编号）
2. 在 `flights` 中增加对应条目（`liftoffAt`、`mission`、`nxsfLaunchId`）
3. 更新 `data/config.js` 中的时序事件（或后续拆到 `data/missions/flight-13.json`）

## 数据来源

- 时序：项目内 `app.js` + 需求文档
- 飞行器：`3` → `npm run build:data`
- 封路：starbase.texas.gov + NXSF
- 监测（可选）：`monitor-server.js` 轮询 Next Spaceflight

非 SpaceX / NXSF 官方站点。

## 部署到 GitHub Pages

本仓库为纯静态站点（无 Node 运行时），适合 GitHub Pages。资源路径均为**相对路径**，可部署在 `https://<用户>.github.io/<仓库名>/` 子路径下。

### 首次发布步骤

1. 在 GitHub 新建仓库（例如 `starship`），将本项目推送到 **`main`** 分支：

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Starship site"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/starship.git
   git push -u origin main
   ```

2. 打开仓库 **Settings → Pages**：
   - **Build and deployment → Source** 选择 **GitHub Actions**（不要选 “Deploy from a branch” 的旧方式，除非你想手动上传）。

3. 推送 `main` 后会自动运行 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)：
   - `npm run build:pages`：生成飞行器/封路数据并输出到 `_site/`
   - 发布 `_site` 到 Pages

4. 几分钟后访问：`https://<你的用户名>.github.io/<仓库名>/`  
   示例：`https://<你的用户名>.github.io/starship/#missions`

### 本地预检 Pages 构建

```bash
npm run build:pages
npx --yes serve _site -l 3000
```

### 更新线上数据

修改 `data/config.js` 或运行 `npm run build:data` 后提交并推送 `main`，Actions 会重新部署。

### 说明

| 环境 | 监测服务 `monitor-server` |
|------|---------------------------|
| GitHub Pages | 不可用；页面使用内嵌 `closures.js`、`nxsf-vehicles.js` 与 `config.js` |
| 本地 `npm run start` | 可连接 `localhost:3847` 实时监测 |

可选：在仓库根目录添加 `CNAME` 文件（仅一行你的自定义域名），并在 DNS 配置指向 GitHub Pages。
