# Professional Editor UI：待确认问题

这些问题不阻塞当前 Viewer UI 分支。当前优先完成主界面，Playground 已明确推迟，暂不开发。

## 1. Playground 文档存储位置

建议：由 `ChipAnnotationServer` 保存独立的 Playground 文档，不挂在任何 chip 或 annotation 下。

建议的最小 API：

- `GET /playground/list`
- `GET /playground/get/:id`
- `POST /playground/create`
- `POST /playground/update/:id`
- `POST /playground/delete/:id`

需要确认：Playground 文档默认私有，还是像 annotation 一样所有人可读？

## 2. 导入 annotation 的许可和来源记录

建议：导入时深拷贝 geometry/text，不再引用原 annotation；节点只保留可选的来源元数据（原 `aid`、作者、导入时间），后续原 annotation 更新不自动同步。

已确认：允许复制其他用户的公开 annotation。

## 3. 物理比例缺失时的行为

建议：两张 chip 都有 `widthMillimeter` / `heightMillimeter` 时按物理比例导入；缺失时退回像素比例，并在节点上显示 `pixel scale` 警告。

已确认：缺失物理尺寸时禁止导入，不回退到像素比例。

## 4. Playground 第一版边界

建议第一版包含：多 chip 节点、平移、90 度旋转、水平/垂直翻转、离散缩放、AABB mask、可见性、删除、独立 annotation、保存/打开。

明确推迟：任意角度旋转、polygon mask、节点分组、图层树、实时协作。

当前决定：Playground 暂不开发。开始该阶段前再确认第一版验收范围和独立文档的可见性。

## 5. Chip 高级浏览器

已确认：高级浏览器需要 `vendor`、`name`、`type`、`family` 四项筛选；不需要 die size 和 source 筛选。

## 6. 浏览器视觉复验

本次实现期间 Codex 内置浏览器连接不可用。`npm run build:dev`、`npm test` 和静态 DOM/CSS 检查已经通过，但仍需在可用浏览器中复验 1280x720、1440x900 和窄屏布局。
