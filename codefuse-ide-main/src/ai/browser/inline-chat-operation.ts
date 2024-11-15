import {Autowired, Injectable} from "@opensumi/di";
import {ChatService} from "@opensumi/ide-ai-native/lib/browser/chat/chat.api.service";
import {InlineChatController} from "@opensumi/ide-ai-native/lib/browser/widget/inline-chat/inline-chat-controller";
import {AIBackSerivcePath, CancellationToken, ChatServiceToken, IAIBackService} from "@opensumi/ide-core-common";
import {ICodeEditor} from "@opensumi/ide-monaco";
import {commentsPrompt, convertPrompt, explainPrompt, optimizePrompt, testPrompt} from "./prompt";
import {EInlineOperation} from './constants';
import {generateDocsPrompt} from './prompt';
import {normalizeCodePrompt} from './prompt';
import {IFileServiceClient} from '@opensumi/ide-file-service';
import {IWorkspaceService} from '@opensumi/ide-workspace';
import {MessageService} from '@opensumi/ide-overlay/lib/browser/message.service';
import open from 'open';

@Injectable()
export class InlineChatOperationModel {
    @Autowired(AIBackSerivcePath)
    private readonly aiBackService: IAIBackService;

    @Autowired(ChatServiceToken)
    private readonly aiChatService: ChatService;

    @Autowired(IFileServiceClient)
    private readonly fileServiceClient: IFileServiceClient;

    @Autowired(IWorkspaceService)
    private readonly workspaceService: IWorkspaceService;

    @Autowired(MessageService)
    private readonly messageService: MessageService;

    public async  [EInlineOperation.TurnWeb](): Promise<void> {
        const url = 'http://localhost:8510';
        await open(url);
        await this.messageService.info(`Web page opened at: ${url}`);
    }

    public async [EInlineOperation.GenerateCode](editor: ICodeEditor, language: string): Promise<void> {
        const model = editor.getModel();
        if (!model) return;

        // 获取工作区路径
        const workspaceFolderUri = this.workspaceService.getWorkspaceRootUri(undefined);
        if (workspaceFolderUri) {
            const folderUri = workspaceFolderUri.resolve('project');

            const folderStat = await this.fileServiceClient.getFileStat(folderUri.toString());
            if (!folderStat) {
                await this.fileServiceClient.createFolder(folderUri.toString());
                await this.messageService.info(`文件夹 'project' 创建成功！`);
            }

            const mainFileName = 'main';
            const mainFileUri = folderUri.resolve(`${mainFileName}.${language}`);
            // 创建空文件
            await this.fileServiceClient.createFile(mainFileUri.toString());
            await this.messageService.info(`空文件 '${mainFileName}.${language}' 已生成！`);

            const requirementsName = 'requirements';
            const requirementsUri = folderUri.resolve(`${requirementsName}.txt`);
            // 创建空文件
            await this.fileServiceClient.createFile(requirementsUri.toString());
            await this.messageService.info(`空文件 '${requirementsName}.txt' 已生成！`);

            const READMEName = 'README';
            const READMEUri = folderUri.resolve(`${READMEName}.md`);
            // 创建空文件
            await this.fileServiceClient.createFile(READMEUri.toString());
            await this.messageService.info(`空文件 '${READMEName}.md' 已生成！`);
        }
    }

    public async [EInlineOperation.GenerateDocs](editor: ICodeEditor): Promise<void> {
        const model = editor.getModel();
        if (!model) return;

        const crossCode = this.getCrossCode(editor);
        const prompt = generateDocsPrompt(crossCode);
        // 调用 AI 服务生成文档说明
        this.aiChatService.sendMessage({
            message: `请为以下代码生成详细的文档说明。文档应包括以下内容：\n
                            1. 功能概述：描述代码的主要功能和用途。\n
                            2. 参数说明：详细解释代码中的输入参数及其类型。\n
                            3. 返回值说明：描述代码的输出和返回值。\n
                            4. 代码示例：如果有必要，提供一个简单的使用示例。\n
                            5. 注意事项：指出使用该代码时需要注意的事项或潜在问题。\n
                            \`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
            prompt,
        });

        const aiGeneratedContent = 'AI 生成内容为空';

        // 显示 AI 生成的内容到窗口
        if (aiGeneratedContent.trim() === 'AI 生成内容为空') {
            // this.messageService.warning('AI 没有生成有效的内容');
        } else {
            this.messageService.info('AI 已生成文档说明');
            console.log('AI 文档说明:', aiGeneratedContent);
        }

        // 获取工作区路径
        const workspaceFolderUri = this.workspaceService.getWorkspaceRootUri(undefined);
        if (workspaceFolderUri) {
            const folderUri = workspaceFolderUri.resolve('generated-docs');

            // 获取当前编辑器文件的名称，添加 ".md" 后缀
            const fileName = model.uri.path.split('/').pop()?.replace(/\..+$/, '') || 'untitled';
            const fileUri = folderUri.resolve(`${fileName}.md`);

            // 创建文件夹 'generated-docs'，如不存在
            const folderStat = await this.fileServiceClient.getFileStat(folderUri.toString());
            if (!folderStat) {
                await this.fileServiceClient.createFolder(folderUri.toString());
                this.messageService.info(`文件夹 'generated-docs' 创建成功！`);
            }

            // 创建空文件
            let fileStat = await this.fileServiceClient.getFileStat(fileUri.toString());
            if (!fileStat) {
                fileStat = await this.fileServiceClient.createFile(fileUri.toString());
                this.messageService.info(`空文件 '${fileName}.md' 已生成！`);
            } else {
                this.messageService.info(`文件 '${fileName}.md' 已存在！`);
            }
        }
    }


    public async [EInlineOperation.Convert](editor: ICodeEditor, targetLanguage: string, token: CancellationToken): Promise<InlineChatController> {
        const crossCode = this.getCrossCode(editor);
        const prompt = convertPrompt(crossCode, targetLanguage);

        const controller = new InlineChatController({enableCodeblockRender: true});
        const stream = await this.aiBackService.requestStream(prompt, {}, token);
        controller.mountReadable(stream);

        return controller;
    }


    // Helper 函数: 获取编辑器中选中的代码块
    private getCrossCode(editor: ICodeEditor): string {
        const model = editor.getModel();
        if (!model) return '';

        const selection = editor.getSelection();
        if (!selection) return '';

        const crossSelection = selection
            .setStartPosition(selection.startLineNumber, 1)
            .setEndPosition(selection.endLineNumber, Number.MAX_SAFE_INTEGER);

        return model.getValueInRange(crossSelection);
    }

    // 插入生成内容到编辑器
    private handleInsert(editor: ICodeEditor, content: string): void {
        const model = editor.getModel();
        if (!model) return;

        const selection = editor.getSelection();
        if (selection) {
            model.pushEditOperations(
                [],
                [{range: selection, text: content, forceMoveMarkers: true}],
                () => null
            );
            this.messageService.info('AI 生成的内容已自动插入编辑器中');
        }
    }

    public [EInlineOperation.Explain](monacoEditor: ICodeEditor): void {
        const model = monacoEditor.getModel();
        if (!model) return;

        const crossCode = this.getCrossCode(monacoEditor);

        this.aiChatService.sendMessage({
            message: `解释以下代码: \n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
            prompt: explainPrompt(model.getLanguageId(), crossCode),
        });
    }

    public async [EInlineOperation.Normalize](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
        const crossCode = this.getCrossCode(editor);
        const prompt = normalizeCodePrompt(crossCode);

        const controller = new InlineChatController({enableCodeblockRender: true});
        const stream = await this.aiBackService.requestStream(prompt, {}, token);
        controller.mountReadable(stream);

        return controller;
    }

    public async [EInlineOperation.Comments](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
        const crossCode = this.getCrossCode(editor);
        const prompt = commentsPrompt(crossCode);

        const controller = new InlineChatController({enableCodeblockRender: true});
        const stream = await this.aiBackService.requestStream(prompt, {}, token);
        controller.mountReadable(stream);

        return controller;
    }

    public [EInlineOperation.Test](editor: ICodeEditor): void {
        const model = editor.getModel();
        if (!model) return;

        const crossCode = this.getCrossCode(editor);
        const prompt = testPrompt(crossCode);

        this.aiChatService.sendMessage({
            message: `为以下代码写单测：\n\`\`\`${model.getLanguageId()}\n${crossCode}\n\`\`\``,
            prompt,
        });
    }

    public async [EInlineOperation.Optimize](editor: ICodeEditor, token: CancellationToken): Promise<InlineChatController> {
        const crossCode = this.getCrossCode(editor);
        const prompt = optimizePrompt(crossCode);

        const controller = new InlineChatController({enableCodeblockRender: true});
        const stream = await this.aiBackService.requestStream(prompt, {}, token);
        controller.mountReadable(stream);

        return controller;
    }
}
