# Professional Editor UI：待确认问题

这些问题不阻塞当前 Viewer UI 分支。当前实现按最保守、可回退的方案推进；需要进入 Playground 阶段时再统一确认。

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

需要确认：是否允许复制任意公开 annotation，还是只允许复制自己的 annotation？

## 3. 物理比例缺失时的行为

建议：两张 chip 都有 `widthMillimeter` / `heightMillimeter` 时按物理比例导入；缺失时退回像素比例，并在节点上显示 `pixel scale` 警告。

需要确认：缺失物理尺寸时是否应该禁止导入，而不是自动回退？

## 4. Playground 第一版边界

建议第一版包含：多 chip 节点、平移、90 度旋转、水平/垂直翻转、离散缩放、AABB mask、可见性、删除、独立 annotation、保存/打开。

明确推迟：任意角度旋转、polygon mask、节点分组、图层树、实时协作。

需要确认：这个边界是否可以作为第一版验收范围？

## 5. Chip 高级浏览器

当前分支实现了顶部快速搜索和可展开完整结果列表，没有加入多列排序/字段筛选 modal。原因是现有 chip 索引字段不完全统一，快速搜索已经覆盖 name/vendor/type/family。

需要确认：高级 modal 是否必须支持 die size 数值范围和 source 筛选？如果不需要，当前快速浏览器可以作为最终版本。

## 6. 浏览器视觉复验

本次实现期间 Codex 内置浏览器连接不可用。`npm run build:dev`、`npm test` 和静态 DOM/CSS 检查已经通过，但仍需在可用浏览器中复验 1280x720、1440x900 和窄屏布局。
