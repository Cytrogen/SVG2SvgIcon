# SVG to MUI SvgIcon 转换器

[![MIT 许可证](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7.1.2-007FFF?logo=mui)](https://mui.com/)

一个纯客户端的在线工具，可将SVG代码或文件一键转换为可以直接在React项目中使用的Material-UI (MUI) `SvgIcon` 组件。

---

## 功能特性

* 支持直接粘贴SVG代码，也支持上传本地 `.svg` 文件。
* `viewBox` 解析:
    * 自动读取SVG中现有的 `viewBox` 属性。
    * 若 `viewBox` 不存在，则会智能地使用SVG的 `width` 和 `height` 属性来生成。
    * 若以上全无，则默认使用 `0 0 24 24`。
* 输入或修改SVG后，可以立即在预览窗口中看到转换后的 `SvgIcon` 图标效果。
* `viewBox` 实时控制器:
    * 提供输入框，可以实时调整 `viewBox` 的 `min-x`, `min-y`, `width`, `height` 值。
    * 所有调整都会立刻反映在预览图标上，方便精确裁剪图标视野。
    * 提供“重置”按钮，一键恢复到原始的 `viewBox` 值。
* SVG解析:
    * 支持解析嵌套元素（如 `<g>` 标签）。
    * 正确处理并转换行内的 `style` 属性为React的 `style` 对象。
* 自动生成可以直接在项目中使用的React组件代码，并提供“一键复制”功能。
* 错误控制台:
    * 内置一个可抽拉的错误控制台，当发生解析错误时会自动滑出提示。
    * 右下角的浮动按钮会用红点标记未读错误，方便随时查看。
* 纯客户端处理，所有数据和SVG代码都只在浏览器中处理。

## 如何使用

1.  **输入SVG**: 在左侧的输入框中粘贴SVG代码，或者点击“导入文件”按钮上传一个 `.svg` 文件。
2.  **命名组件**: 为即将生成的React组件起一个合适的名称（例如 `HomeIcon`）。
3.  **转换与预览**: 点击“转换SVG”按钮，右侧会立刻显示图标预览和生成的代码。
4.  **(可选) 调整 `viewBox`**: 使用下方的控制器微调图标的显示区域，直到满意为止。
5.  **复制与使用**: 点击“复制代码”按钮，然后将代码粘贴到React项目中即可使用。

## 技术栈

* **React**: 构建用户界面的核心库。
* **Material-UI (MUI)**: 提供UI组件和样式。
* **React Markdown**: 用于在“关于”页面展示格式化文本。
* **DOMParser**: 浏览器原生API，用于安全地解析SVG字符串。

## 本地开发与贡献

欢迎任何人为这个项目做出贡献！你可以随时提交Pull Request或报告Issues。

### 运行项目

1.  克隆仓库到本地:
    ```bash
    git clone https://github.com/cytrogen/svg2svgicon.git
    ```
2.  进入项目目录:
    ```bash
    cd svg2svgicon
    ```
3.  安装依赖:
    ```bash
    yarn install
    ```
4.  启动开发服务器:
    ```bash
    yarn dev
    ```
现在，项目应该已经在本地的开发服务器上运行起来了！

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE.md) 开源。
