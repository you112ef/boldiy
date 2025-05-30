import { OpenAIStream } from 'ai'; // Correct import for OpenAI-compatible SSE streams
import type { ChatStreamCallbacks } from '@ai-sdk/provider'; // Adjust if this type is different
import { BaseProvider } from '../base-provider'; // Import BaseProvider
import {
  type LLMProvider,
  type LLMChatParams,
  type LLMChatResult,
  type ModelDefinition, // Assuming ModelDefinition is the correct type
  type ProviderConfig,  // Assuming ProviderConfig is the correct type
  // ModelConfig might also be needed from types if params.modelConfig uses it explicitly beyond id/parameters
} from '../types'; // Adjust path as needed
// import { modelos } from '../types'; // Replaced 'modelos' with ModelDefinition

// Placeholder for actual model configuration if needed, or could be simpler
const localLlamaModels: ModelDefinition[] = [ // Changed 'modelos' to 'ModelDefinition'
  {
    id: 'local-llama-model', // Example model ID
    name: 'Local LLaMA Model',
    provider: 'local-llama', // This should match the provider's id
    context_window: 4096, // Example context window
    input_types: ['text'],
    output_types: ['text'],
    supports_functions: false, // llama.cpp server typically doesn't support OpenAI functions directly
    is_default: true,
    // Ensure all fields required by ModelDefinition are present
    tokens: 0, // Example: add if missing
    cost: { input: 0, output: 0 }, // Example: add if missing
    status: 'stable', // Example: add if missing
  },
];

// Ensure ProviderConfig type matches what BaseProvider expects
const localLlamaProviderConfig: ProviderConfig = {
  id: 'local-llama',
  name: 'Local LLaMA',
  logoUrl: '/icons/Default.svg', // Or a more specific icon if available
  baseUrl: 'http://localhost:8080/v1', // Default llama.cpp server endpoint
  apiKey: '', // Typically no API key for local llama.cpp, or a fixed one if user configures it
  models: localLlamaModels, // This should be compatible with ModelDefinition[]
  isLocal: true, // Important flag
  isCustom: false, // Not a user-defined custom provider in this context
  modelType: 'chat' as const,
  // Ensure all fields required by ProviderConfig are present
  group: 'local', // Example
  official: false, // Example
  description: 'Locally running LLaMA model via llama.cpp server.', // Example
  authMethod: 'none', // Example
};

export class LocalLlamaProvider extends BaseProvider implements LLMProvider { // Extend BaseProvider
  constructor() {
    super(localLlamaProviderConfig); // Pass config to super
  }

  // _fetch method can be kept if it's specific, or removed if BaseProvider's is sufficient.
  // If BaseProvider has a compatible _fetch, this can be removed.
  // For now, keeping it to ensure it uses this.config.baseUrl from BaseProvider.
  private async _fetch(path: string, options: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`; // config is now from BaseProvider
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        // No Authorization header if API key is not used or empty
      },
    });
  }

  async chat(params: LLMChatParams, callbacks?: ChatStreamCallbacks): Promise<LLMChatResult> {
    // Ensure params.modelConfig.id is used, or a default from this.config.models
    const modelId = params.modelConfig.id || this.config.models[0].id; // Use this.config.models
    const body = {
      model: modelId,
      messages: params.messages,
      stream: params.stream,
      // llama.cpp server supports temperature, top_p, max_tokens etc.
      // Add them here if params.modelConfig contains them
      ...(params.modelConfig.parameters?.temperature && { temperature: params.modelConfig.parameters.temperature }),
      ...(params.modelConfig.parameters?.max_tokens && { max_tokens: params.modelConfig.parameters.max_tokens }),
      // Add other compatible parameters
    };

    const response = await this._fetch('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Local LLaMA API request failed: ${errorBody.message || response.statusText}`);
    }

    if (params.stream) {
      if (!response.body) {
        throw new Error('ReadableStream not available for Local LLaMA response.');
      }
      const stream = OpenAIStream(response, callbacks); // Use OpenAIStream
      return {
        stream,
        content: async () => {
          let fullContent = '';
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              fullContent += decoder.decode(value, { stream: true });
          }
          return fullContent;
        },
      };
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || '',
    };
  }

  // listModels might not be applicable or could return the fixed list
  async listModels() {
    // llama.cpp server doesn't have a standard /v1/models endpoint like OpenAI by default.
    // For simplicity, return the statically defined models.
    // In a more advanced setup, this could try to query a custom endpoint if available.
    return this.config.models;
  }
}

export default new LocalLlamaProvider();
