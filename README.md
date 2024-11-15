# chatbot-codefuse-redevelop

## 项目介绍

我们团队在经历了前期对于 PyTorch 和 LangChain 的学习和设计模式分析后，结合当今的热点话题和需求，基于 Chatbot 和 Codefuse-IDE 进行了二次开发，打造了一个完整的项目级代码生成助手。该项目旨在通过 AI 大模型，并设置各种功能接口接入大模型，帮助用户更加便捷地进行代码开发工作。项目包含了生成项目级代码、代码转换、互联网搜索、知识库问答、Chat 对话等功能。

### 功能亮点：
- 生成项目级代码、代码转换、互联网搜索、知识库问答、Chat 对话等功能。
- 支持开源 LLM 与 Embedding 模型的离线私有部署。
- 支持统一的 API 调用，具备 32K 上下文支持。
- 支持工具库、代码库及知识库集成。
- 支持代码补全、代码建议、注释生成、代码转换及智能问答交互等功能。

## 本地部署

### 1. 部署 Codefuse-IDE

#### 环境要求：
- **Node.js** 版本：>= 202
- **依赖管理工具**：Yarn 3
- **模型接口及 API Key**：需要提供兼容 ChatGPT 规范的模型接口和 API Key（如 DeepSeek 或 Ollama 等本地模型）

#### 环境配置：
1. **安装 Node.js**：
    - 访问 [Node.js 官网](https://nodejs.org/)，选择适合您操作系统的版本并安装。
  
2. **安装 Yarn 3**：
    - 使用以下命令全局安装 Yarn 3：
    ```bash
    npm install -g yarn
    ```

#### 项目运行：
1. 在项目文件夹中找到并解压 Codefuse-IDE 项目的压缩包。
2. 使用 VSCode 打开解压后的项目文件夹。
3. 在 VSCode 中打开 `codefuse-ide` 文件夹，并启动 Git Bash 终端。
4. 进入 `codefuse-ide` 文件夹并运行以下命令启动项目：
    ```bash
    cd codefuse-ide/
    yarn start
    ```
5. **安装 open**：
    - 使用以下命令全局安装 open：
    ```bash
    npm install -g open
    ```

---

### 2. 部署 Codefuse-Chatbot

#### 配置步骤：

1. **解压 Codefuse-Chatbot 项目**：
   - 在项目文件中找到并解压 `chatbot` 项目的压缩包。
   - 使用 VSCode 打开该项目。

2. **环境配置**：
   - 按照 `chatbot` 项目中的 README 文件的步骤配置环境。

3. **启动配置**：
   - 在 VSCode 中打开 `codefuse-chatbot-main` 项目文件，并打开终端 Git Bash。
   - 输入以下命令启动项目：
    ```bash
    conda activate chatbot
    cd examples
    bash start.sh
    ```

   此时，浏览器会自动弹出网页，即 Codefuse-Chatbot 的配置界面。

4. **选择本地部署的 LLM 与 Embedding 模型**：
   - 在本地部署 LLM 模型（如 `chatglm2-6b`）和 Embedding 模型（如 `text2vec-base-chinese`）。
   - 下载并放置相关的大模型文件到 `chatbot` 对应目录下，并修改配置文件。

5. **配置 API 调用**：
   - 如果选择调用大模型的 API，则需在 `You’re your LLM API Key` 中填写该模型的 API Key。
![alt text](image.png)
6. **启动对话服务**：
   - 配置完成后，点击启动对话服务的按钮，开始使用。

---
