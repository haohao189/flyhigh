import {EInlineOperation} from './constants'

export const generateCodePrompt = (language: string) => {
    return `生成项目结构，具体如下：\n
   - 主文件：\`main.${language}\` 或其他主要模块文件。\n
   - 配置文件：\`requirements.txt\`，用于定义依赖\n
   - \`README.md\` 文件：包含项目描述和运行说明。\n`
};

export const explainPrompt = (language: string, code: string) => {
    return `你将获得一段代码, 你的任务是以简洁的方式解释它，用中文回答。代码内容是: \n\`\`\`${language}\n${code}\n\`\`\``;
};

export const testPrompt = (code: string) => {
    return `为以下代码写单测：\n\`\`\`\n ${code}\n\`\`\``;
};

export const optimizePrompt = (code: string) => {
    return `优化以下代码：\n\`\`\`\n ${code}\`\`\``;
};

export const commentsPrompt = (code: string) => {
    return `帮我将下面这段代码加入中文注释，原来的代码的代码请按照原样返回，不要添加任何额外字符包括空格:\n\`\`\`\n${code}\`\`\``;
};
export const normalizeCodePrompt = (code: string) => {
    return `请对以下代码进行规范化处理，符合代码风格最佳实践，不改变功能，仅进行格式调整和优化：\n\`\`\`\n${code}\n\`\`\``;
};

export const convertPrompt = (code: string, targetLanguage: string) => {
    return `请将以下代码转换为 ${targetLanguage} 代码，仅返回转换后的代码，不需要任何注释或解释。\n\`\`\`\n${code}\n\`\`\``;
};

export const detectIntentPrompt = (input: string) => {
    return `
  在我的编辑器中，存在一些指令，这些指令可以被分成几组，下面给出全部的分组及分组简介，请针对用户给出的提问，找到对应的分组，并直接返回分组名称

  指令分组：
  * [${EInlineOperation.Explain}]: 解释代码，代码解释，用于对代码的解释，能够用自然语言解释代码的意思，它能够理解并分析各种编程语言的代码，并提供清晰、准确、易于理解的解释。
  * [${EInlineOperation.Comments}]: 添加注释，用于给代码添加注释
  * [${EInlineOperation.Test}]: 生成单测，用于生成单元测试用例，能够对代码进行单元测试的生成，生成测试代码，生成代码的测试
  * [${EInlineOperation.Optimize}]: 优化代码，用于对代码进行优化，能够优化代码，使其代码更加合理
  * [${EInlineOperation.Convert}]: 转换代码语言，用于将代码从一种编程语言转换为另一种编程语言（如从 Java 转换为 Python 等），并提供相应的转换结果
  * [None]: 表示用户的提问并不适合以上任意一个分组，则返回 None
  
  提问: ${input}
  回答: [分组名称]，请返回上述的指令分组名称，不要包含其它内容
  `;
};
// export const convertPrompt = (code: string, targetLanguage: string) => {
//   return `你将获得一段代码，并需要将其转换为 ${targetLanguage} 语言。请只输出转换后的代码，不要包含额外的注释或解释。代码内容是:\n\`\`\`\n${code}\n\`\`\``;
// };
export const generateDocsPrompt = (code: string) => {
    return `
  请为以下代码生成详细的文档说明。文档应包括以下内容：
  1. 功能概述：描述代码的主要功能和用途。
  2. 参数说明：详细解释代码中的输入参数及其类型。
  3. 返回值说明：描述代码的输出和返回值。
  4. 代码示例：如果有必要，提供一个简单的使用示例。
  5. 注意事项：指出使用该代码时需要注意的事项或潜在问题。

  代码内容如下：\n\`\`\`\n${code}\n\`\`\`
  `;
};


export const terminalCommandSuggestionPrompt = (message: string) => {
    return `
  你是一个 Shell 脚本专家，现在我需要使用 Shell 来完成一些操作，但是我不熟悉 Shell 命令，因此我需要通过自然语言描述生成终端命令，只需生成 1 到 5 个命令。
  提示：使用 . 来表示当前文件夹
  下面是自然语言描述和其对应的终端命令：
  提问: 查看机器内存
  回答:
  #Command#: free -m
  #Description#: 查看机器内存
  提问: 查看当前进程的 pid
  回答:
  #Command#: echo$$
  #Description#: 查看当前进程的 pid
  提问: ${message}`;
};

export class RenamePromptManager {
    static requestPrompt(language: string, varName: string, above: string, below: string) {
        const prompt = `
    我需要你的帮助，请帮我推荐 5 个指定变量的重命名候选项。
我希望这些新的变量名能更符合代码上下文、整段代码的风格，更有意义。

我会将代码分成三段发给你，每段代码用 --- 进行包裹。这些代码是一段 ${language} 代码片段。
第一段代码是该变量之前的上文，第二段是变量名，第三段是该变量的下文。

---
${above.slice(-500)}
---

---
${varName}
---

---
${below.slice(0, 500)}
---


你的任务是：
请根据上下文以及代码的作用帮我推荐一下 ${varName} 能替换成哪些变量名，仅需要把所有可能的变量名输出，不用输出所有的代码。将结果放在代码块中（用 \`\`\` 包裹），每行一个，不用带序号。`;
        return prompt;
    }

    static extractResponse(data: string) {
        const codeBlock = /```([\s\S]*?)```/g;
        const result = data.match(codeBlock);

        if (!result) {
            return [];
        }

        const lines = result[0].replace(/```/g, '').trim().split('\n');
        return lines;
    }
}

