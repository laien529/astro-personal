# 运营配置说明

这份文档给不懂技术的内容维护者使用。日常推荐使用可视化配置台；也可以直接改一个 JSON 文件，并把图片放进约定文件夹。

## 你只需要维护两个地方

推荐方式是打开可视化配置台：

```text
http://127.0.0.1:8787
```

配置台里的“访问页面”链接会指向站点预览地址，默认是：

```text
http://localhost:4321/path名
```

如果你的站点预览不是 `localhost:4321`，启动配置台时可以指定：

```bash
SITE_PREVIEW_ORIGIN=https://你的域名 npm run config:studio
```

配置台支持上传背景图、上传子项图片、预览已配置图片，也可以直接下载当前图片到本地。

配置台也支持维护“社交媒体 / 联系方式”。这些链接会出现在页面右下角。

联系方式里如果是邮箱，只填邮箱地址即可，配置台会自动生成邮件链接，不需要填写 `mailto:`。常见媒体会自动匹配图标：抖音、小红书、Instagram、X、大众点评、领英、GitHub、邮箱。

中英文切换使用英文文案字段，例如 `titleEn`、`introEn`。配置台提供“生成英文草稿”按钮；如果要启用自动生成，需要启动配置台前配置兼容翻译服务：

```bash
TRANSLATE_API_URL=https://你的翻译服务地址 TRANSLATE_API_KEY=你的密钥 TRANSLATE_MODEL=模型名 npm run config:studio
```

未配置翻译服务时，英文文案仍可手动填写。

1. 文案配置文件：

```text
content/site-projects.json
```

2. 图片资源文件夹：

```text
public/user-content/
```

旧版单 project 文件 `content/site-content.json` 会保留作兼容，但新增和多 project 配置都以 `content/site-projects.json` 为准。

不要改 `src/`、`dist/`、`package.json` 这些工程文件。

## Project 是什么

这里的一个 project，代表一个独立可访问页面主体。

每个 project 都有自己的：

- path 访问路径
- 主标题
- 副标题
- 介绍文案
- 模块数组
- 模块子项数组
- 图片资源文件夹

访问地址规则：

```text
http://localhost:4321/path名
```

部署到 Nginx 后通常没有端口：

```text
https://你的域名/path名
```

例如当前默认 project：

```text
http://localhost:4321/chengkeying
```

根路径 `/` 会展示默认 project。

## 文案怎么改

打开 `content/site-projects.json`。

只改冒号右边的 value，不改左边的 key。

示例：

```json
{
  "defaultProjectPath": "chengkeying",
  "projects": [
    {
      "projectName": "Cheng Keying",
      "path": "chengkeying",
      "mainTitle": "Cheng Keying",
      "subtitle": "iOS / Android / Frontend Engineer",
      "intro": "I build user-focused apps and polished interfaces.",
      "modules": []
    }
  ]
}
```

## 配置项说明

### Project 顶层

| key | 填什么 |
| --- | --- |
| `defaultProjectPath` | 默认 project 的 path，访问 `/` 时展示它 |
| `contactLinks` | 页面右下角联系方式数组 |
| `projects` | project 数组，每一项都是一个可访问页面 |

### 每个 Project

| key | 填什么 |
| --- | --- |
| `projectName` | 配置台里看的项目名称 |
| `path` | 访问路径，只用英文、数字、短横线，例如 `chengkeying` |
| `backgroundColor` | Project 整体背景色，例如 `#f5f5f7`；留空则使用浏览器默认背景 |
| `mainTitle` | 主标题，例如姓名、品牌名、产品名 |
| `mainTitleEn` | 英文主标题，可为空 |
| `subtitle` | 副标题，例如职业定位、一句话口号 |
| `subtitleEn` | 英文副标题，可为空 |
| `intro` | 副标题下面的介绍文案 |
| `introEn` | 英文介绍文案，可为空 |
| `modules` | 这个 project 下的模块数组 |

不要把 `path` 设置成这些已有页面：

```text
about, contact, projects
```

### 模块数组

`modules` 是模块列表。一个 `{ ... }` 就是当前 project 页面上的一个模块。

每个模块包含：

| key | 填什么 |
| --- | --- |
| `title` | 模块标题 |
| `titleEn` | 英文模块标题，可为空 |
| `intro` | 模块介绍 |
| `introEn` | 英文模块介绍，可为空 |
| `backgroundImage` | 模块背景图片路径 |
| `items` | 模块里的子项列表 |

### 模块子项数组

`items` 是模块里的内容列表。一个 `{ ... }` 就是一张卡片/一个子项。

每个子项包含：

| key | 填什么 |
| --- | --- |
| `title` | 子项标题 |
| `titleEn` | 英文子项标题，可为空 |
| `intro` | 子项介绍 |
| `introEn` | 英文子项介绍，可为空 |

图片数组不用写在 JSON 里，直接放进对应文件夹。

## 图片怎么维护

图片数组通过文件夹自动读取。你只负责把图片放进去。

多 project 后的推荐文件夹结构：

```text
public/user-content/
└─ projects/
   └─ chengkeying/
      └─ modules/
         ├─ module-01/
         │  ├─ background.svg
         │  ├─ item-01/
         │  │  └─ 01.svg
         │  └─ item-02/
         │     └─ 01.svg
         └─ module-02/
            ├─ background.svg
            └─ item-01/
               └─ 01.svg
```

对应关系：

| JSON 位置 | 图片文件夹 |
| --- | --- |
| `chengkeying` 的第 1 个模块 | `public/user-content/projects/chengkeying/modules/module-01/` |
| `chengkeying` 的第 1 个模块第 1 个子项 | `public/user-content/projects/chengkeying/modules/module-01/item-01/` |
| `chengkeying` 的第 1 个模块第 2 个子项 | `public/user-content/projects/chengkeying/modules/module-01/item-02/` |
| `demo` 的第 2 个模块 | `public/user-content/projects/demo/modules/module-02/` |
| `demo` 的第 2 个模块第 1 个子项 | `public/user-content/projects/demo/modules/module-02/item-01/` |

### 换模块背景图

替换这个文件即可：

```text
public/user-content/projects/chengkeying/modules/module-01/background.svg
```

如果你换成 JPG 或 PNG，也可以把 JSON 里的 `backgroundImage` 改成对应路径：

```json
"backgroundImage": "/user-content/projects/chengkeying/modules/module-01/background.jpg"
```

### 给子项添加多张图片

把图片放进对应子项文件夹：

```text
public/user-content/projects/chengkeying/modules/module-01/item-01/01.jpg
public/user-content/projects/chengkeying/modules/module-01/item-01/02.jpg
public/user-content/projects/chengkeying/modules/module-01/item-01/03.jpg
```

系统会自动按文件名顺序读取并展示。

支持这些图片格式：

```text
avif, gif, jpg, jpeg, png, svg, webp
```

## 列表和滚动视图

你不用配置列表样式。

只要 JSON 里出现数组：

- `projects`
- `modules`
- `items`
- 某个子项文件夹里的多张图片

页面就会自动用列表或滚动视图展示。

当前 `apple` 风格下，模块子项和图片更偏横向滚动产品卡片。

切回 `portfolio` 风格后，同一份数据会更偏网格/卡片展示。

## 增加 Project

推荐在可视化配置台里点“新增 Project”。

手动方式：

1. 在 `content/site-projects.json` 的 `projects` 数组里复制一个 project 对象。
2. 修改 `projectName`、`path`、`mainTitle`、`subtitle`、`intro`。
3. 新建对应资源文件夹，例如 `demo`：

```text
public/user-content/projects/demo/
public/user-content/projects/demo/modules/
```

4. 构建后访问：

```text
http://localhost:4321/demo
```

## 增加模块

1. 在 `content/site-projects.json` 中找到对应 project。
2. 在这个 project 的 `modules` 数组里复制一个模块对象。
3. 修改新模块的 `title`、`intro`、`backgroundImage`。
4. 新建对应资源文件夹，例如 `chengkeying` 的第 3 个模块：

```text
public/user-content/projects/chengkeying/modules/module-03/
public/user-content/projects/chengkeying/modules/module-03/item-01/
public/user-content/projects/chengkeying/modules/module-03/item-02/
```

5. 把背景图和子项图片放进去。

## 增加子项

1. 在某个模块的 `items` 数组里复制一个子项对象。
2. 修改新子项的 `title`、`intro`。
3. 新建对应文件夹，例如 `chengkeying` 的第 1 个模块第 4 个子项：

```text
public/user-content/projects/chengkeying/modules/module-01/item-04/
```

4. 把图片放进这个文件夹。

## 改完之后怎么生效

### 可视化配置台

启动可视化配置台：

```bash
npm run config:studio
```

打开终端提示的地址，默认是：

```text
http://127.0.0.1:8787
```

在配置台里可以：

- 创建、切换、删除 project。
- 设置每个 project 的 path。
- 修改主标题、副标题、介绍文案。
- 新增、删除、上移、下移模块。
- 新增、删除、上移、下移模块子项。
- 上传模块背景图。
- 上传或删除子项图片数组。
- 点击“保存配置”写入 `content/site-projects.json`。
- 点击“构建站点”执行 `npm run build`。

配置台只修改这些运营内容：

```text
content/site-projects.json
public/user-content/
```

### 命令行方式

本地预览：

```bash
npm run oneclick
```

只构建：

```bash
npm run build
```

部署到服务器时，使用项目的一键部署命令。
