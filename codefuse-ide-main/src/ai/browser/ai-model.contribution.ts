import {Autowired} from '@opensumi/di'
import {AI_NATIVE_SETTING_GROUP_ID, localize, MaybePromise, Delayer, CommandService} from '@opensumi/ide-core-common';
import {
    Domain,
    PreferenceContribution,
    PreferenceSchema,
    ClientAppContribution,
    IClientApp,
    PreferenceService,
    COMMON_COMMANDS,
    IPreferenceSettingsService
} from '@opensumi/ide-core-browser'
import {ISettingRegistry, SettingContribution} from '@opensumi/ide-preferences';
import {AIModelServicePath, IAIModelServiceProxy, ModelSettingId} from '../common'
import {OutputChannel} from '@opensumi/ide-output/lib/browser/output.channel';
import {OutputService} from '@opensumi/ide-output/lib/browser/output.service';
import {MessageService} from '@opensumi/ide-overlay/lib/browser/message.service';

const ModelSettingIdKeys = Object.keys(ModelSettingId);

const aiNativePreferenceSchema: PreferenceSchema = {
    properties: {
        [ModelSettingId.baseUrl]: {
            type: 'string',
            defaultValue: 'https://api.deepseek.com/v1',
        },
        [ModelSettingId.apiKey]: {
            type: 'string',
            defaultValue: 'sk-7e341a9cb58e44f48979dd9420fc9a1b',
        },
        [ModelSettingId.chatModelName]: {
            type: 'string',
            defaultValue: 'deepseek-chat', // 兼容 ChatGPT 模型
        },
        [ModelSettingId.chatSystemPrompt]: {
            type: 'string',
            defaultValue: '',  // 如果需要特定系统提示词，可以在此设置
        },
        [ModelSettingId.chatMaxTokens]: {
            type: 'number',
            minimum: 0,
            defaultValue: 1024,
            description: localize('preference.ai.model.maxTokens.description'),
        },
        [ModelSettingId.chatTemperature]: {
            type: 'string',
            defaultValue: '0.20',
            description: localize('preference.ai.model.temperature.description'),
        },
        [ModelSettingId.chatPresencePenalty]: {
            type: 'string',
            defaultValue: '1.0',
            description: localize('preference.ai.model.presencePenalty.description'),
        },
        [ModelSettingId.chatFrequencyPenalty]: {
            type: 'string',
            defaultValue: '1.0',
            description: localize('preference.ai.model.frequencyPenalty.description'),
        },
        [ModelSettingId.chatTopP]: {
            type: 'string',
            defaultValue: '1',
            description: localize('preference.ai.model.topP.description'),
        },
        [ModelSettingId.codeModelName]: {
            type: 'string',
            defaultValue: 'deepseek-ai/DeepSeek-V2.5',  // 代码补全使用相同的模型
            description: localize('preference.ai.model.code.modelName.tooltip'),
        },
        [ModelSettingId.codeSystemPrompt]: {
            type: 'string',
            defaultValue: '特别注意只返回要补全的代码，不要用```来包裹！',  // 代码补全的系统提示词
        },
        [ModelSettingId.codeMaxTokens]: {
            type: 'number',
            minimum: 0,
            defaultValue: 64,  // 可根据需求调整最大 token 数量
            description: localize('preference.ai.model.maxTokens.description'),
        },
        [ModelSettingId.codeTemperature]: {
            type: 'string',
            defaultValue: '0.20',
            description: localize('preference.ai.model.temperature.description'),
        },
        [ModelSettingId.codePresencePenalty]: {
            type: 'string',
            defaultValue: '1',
            description: localize('preference.ai.model.presencePenalty.description'),
        },
        [ModelSettingId.codeFrequencyPenalty]: {
            type: 'string',
            defaultValue: '1',
            description: localize('preference.ai.model.frequencyPenalty.description'),
        },
        [ModelSettingId.codeTopP]: {
            type: 'string',
            defaultValue: '1',
            description: localize('preference.ai.model.topP.description'),
        },
        [ModelSettingId.codeFimTemplate]: {
            type: 'string',
            defaultValue: '<|fim▁begin|>{prefix}<|fim▁hole|>{suffix}<|fim▁end|>',  // 使用 FIM 模板进行代码补全
            description: localize('preference.ai.model.code.fimTemplate.tooltip'),
        },
    },
};

@Domain(ClientAppContribution, PreferenceContribution, SettingContribution)
export class AIModelContribution implements PreferenceContribution, SettingContribution, ClientAppContribution {
    schema = aiNativePreferenceSchema;

    @Autowired(PreferenceService)
    private readonly preferenceService: PreferenceService;

    @Autowired(AIModelServicePath)
    modelService: IAIModelServiceProxy

    @Autowired(MessageService)
    messageService: MessageService;

    @Autowired(OutputService)
    outputService: OutputService;

    @Autowired(CommandService)
    commandService: CommandService

    @Autowired(IPreferenceSettingsService)
    preferenceSettingsService: IPreferenceSettingsService

    #output: OutputChannel

    get output() {
        if (!this.#output) {
            this.#output = this.outputService.getChannel('AI Native')
        }
        return this.#output
    }

    onDidStart(app: IClientApp): MaybePromise<void> {
        const delayer = new Delayer(100);
        const values: Record<string, any> = {}
        ModelSettingIdKeys.forEach((idKey) => {
            values[idKey] = this.preferenceService.getValid(ModelSettingId[idKey])
            this.preferenceService.onSpecificPreferenceChange(ModelSettingId[idKey], (change) => {
                values[idKey] = change.newValue
                delayer.trigger(() => this.setModeConfig(values))
            })
        })
        this.checkModelConfig(values).then((valid) => {
            if (valid) {
                delayer.trigger(() => this.setModeConfig(values))
            }
        })
    }

    registerSetting(registry: ISettingRegistry): void {
        registry.registerSettingSection(AI_NATIVE_SETTING_GROUP_ID, {
            title: localize('preference.ai.model.title'),
            preferences: [
                {
                    id: ModelSettingId.baseUrl,
                    localized: 'preference.ai.model.baseUrl',
                },
                {
                    id: ModelSettingId.apiKey,
                    localized: 'preference.ai.model.apiKey',
                },
                {
                    id: ModelSettingId.chatModelName,
                    localized: 'preference.ai.model.chat.modelName',
                },
                {
                    id: ModelSettingId.chatSystemPrompt,
                    localized: 'preference.ai.model.chat.systemPrompt',
                },
                {
                    id: ModelSettingId.chatMaxTokens,
                    localized: 'preference.ai.model.chat.maxTokens',
                },
                {
                    id: ModelSettingId.chatTemperature,
                    localized: 'preference.ai.model.chat.temperature',
                },
                {
                    id: ModelSettingId.chatPresencePenalty,
                    localized: 'preference.ai.model.chat.presencePenalty',
                },
                {
                    id: ModelSettingId.chatFrequencyPenalty,
                    localized: 'preference.ai.model.chat.frequencyPenalty',
                },
                {
                    id: ModelSettingId.chatTopP,
                    localized: 'preference.ai.model.chat.topP',
                },
                {
                    id: ModelSettingId.codeModelName,
                    localized: 'preference.ai.model.code.modelName',
                },
                {
                    id: ModelSettingId.codeSystemPrompt,
                    localized: 'preference.ai.model.code.systemPrompt',
                },
                {
                    id: ModelSettingId.codeMaxTokens,
                    localized: 'preference.ai.model.code.maxTokens',
                },
                {
                    id: ModelSettingId.codeTemperature,
                    localized: 'preference.ai.model.code.temperature',
                },
                {
                    id: ModelSettingId.codePresencePenalty,
                    localized: 'preference.ai.model.code.presencePenalty',
                },
                {
                    id: ModelSettingId.codeFrequencyPenalty,
                    localized: 'preference.ai.model.code.frequencyPenalty',
                },
                {
                    id: ModelSettingId.codeTopP,
                    localized: 'preference.ai.model.code.topP',
                },
                {
                    id: ModelSettingId.codeFimTemplate,
                    localized: 'preference.ai.model.code.fimTemplate',
                },
            ],
        });
    }

    private async checkModelConfig(values: Record<string, any>) {
        if (values.baseUrl && values.chatModelName) {
            return true
        }
        const res = await this.messageService.info(localize('ai.model.noConfig'), [
            localize('ai.model.go')
        ])
        if (res === localize('ai.model.go')) {
            await this.commandService.executeCommand(COMMON_COMMANDS.OPEN_PREFERENCES.id)
            this.preferenceSettingsService.scrollToPreference(ModelSettingId.baseUrl)
        }
        return false
    }

    private setModeConfig(values: Record<string, any>) {
        this.modelService.setConfig(values)
        this.output.appendLine(`model config: ${JSON.stringify(values, null, 2)}`)
    }
}
