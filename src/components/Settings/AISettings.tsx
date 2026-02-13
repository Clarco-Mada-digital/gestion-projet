import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Input,
  Select,
  Alert,
  message,
  InputNumber,
  Form
} from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import { AIService } from '../../services/aiService';
import '../../styles/ai-settings.css';

type ProviderType = 'openai' | 'openrouter';

interface ModelOption {
  value: string;
  label: string;
  context?: number;
  pricing?: any;
}

interface FormValues {
  provider: ProviderType;
  openaiApiKey: string | null;
  openrouterApiKey: string | null;
  openaiModel: string;
  openrouterModel: string;
  maxTokens: number;
  temperature: number;
  isConfigured: boolean;
  lastTested: string | null;
  lastTestStatus: 'success' | 'error' | null;
  lastTestMessage: string | null;
}

interface AISettingsProps {
  value?: Partial<FormValues>;
  onChange?: (values: FormValues) => void;
  showTitle?: boolean;
}

const MODELS: Record<ProviderType, ModelOption[]> = {
  openai: [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  openrouter: [
    { value: 'anthropic/claude-3-haiku', label: 'Anthropic: Claude 3 Haiku' },
    { value: 'openai/gpt-4-turbo', label: 'OpenAI: GPT-4 Turbo' },
    { value: 'openai/gpt-4o', label: 'OpenAI: GPT-4o' },
    { value: 'anthropic/claude-3-opus', label: 'Anthropic: Claude 3 Opus' },
    { value: 'anthropic/claude-3-sonnet', label: 'Anthropic: Claude 3 Sonnet' },
    { value: 'google/gemini-pro-1.5', label: 'Google: Gemini Pro 1.5' },
    { value: 'mistralai/mistral-large', label: 'Mistral: Large' },
    { value: 'meta-llama/llama-3-70b-instruct', label: 'Meta: Llama 3 70B' },
  ]
};


export const AISettings: React.FC<AISettingsProps> = ({
  value: externalValue,
  onChange,
}) => {
  const [form] = Form.useForm<FormValues>();
  const { state, dispatch } = useApp();
  const isDarkMode = state.theme === 'dark';

  // Styles pour les sections du formulaire
  const sectionStyle = "mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700";
  const sectionTitleStyle = "text-lg font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center";
  const labelStyle = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const inputClassName = `mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 
    shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
    bg-white text-gray-900 placeholder-gray-500
    disabled:opacity-50 disabled:cursor-not-allowed`;
  const selectClassName = `${inputClassName} [&_*]:text-gray-900 [&_*]:dark:text-white [&_.ant-select-selector]:dark:bg-gray-700 
    [&_.ant-select-selector]:dark:border-gray-600 [&_.ant-select-selection-item]:dark:text-white`;
  const inputNumberClassName = `${inputClassName} [&_.ant-input-number-input]:dark:bg-gray-700 [&_.ant-input-number-input]:dark:text-white`;
  const primaryButtonStyle = "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed";
  const secondaryButtonStyle = "inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed";
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });
  const [dynamicModels, setDynamicModels] = useState<ModelOption[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Valeurs par défaut
  const initialValues: FormValues = {
    provider: 'openai',
    openaiApiKey: '',
    openrouterApiKey: '',
    openaiModel: 'gpt-3.5-turbo',
    openrouterModel: 'openrouter/auto',
    maxTokens: 1000,
    temperature: 0.7,
    isConfigured: false,
    lastTested: null,
    lastTestStatus: null,
    lastTestMessage: null,
    ...externalValue as any
  };

  // Mettre à jour le formulaire quand les valeurs externes ou les paramètres IA changent
  useEffect(() => {
    const settings = (externalValue || state.appSettings.aiSettings) as FormValues;
    if (settings) {
      form.setFieldsValue({
        ...initialValues,
        ...settings
      });
    } else {
      form.setFieldsValue(initialValues);
    }
  }, [externalValue, state.appSettings.aiSettings, form]);

  // Observer les changements de valeurs pour le chargement des modèles
  const provider = Form.useWatch('provider', form);
  const openrouterApiKey = Form.useWatch('openrouterApiKey', form);

  // Récupérer les modèles dynamiques d'OpenRouter
  useEffect(() => {
    const fetchModels = async () => {
      // Utiliser les valeurs observées
      const currentProvider = provider;
      const currentApiKey = openrouterApiKey;

      if (currentProvider === 'openrouter' && currentApiKey && currentApiKey.startsWith('sk-or-')) {
        setIsFetchingModels(true);
        try {
          const models = await AIService.fetchOpenRouterModels(currentApiKey);
          const mappedModels = models.map(m => ({
            value: m.id,
            label: `${m.name}`,
            context: m.context_length,
            pricing: m.pricing
          }));
          setDynamicModels(mappedModels);
        } catch (error) {
          console.error('Erreur lors de la récupération des modèles:', error);
        } finally {
          setIsFetchingModels(false);
        }
      } else {
        setDynamicModels([]);
      }
    };

    fetchModels();
  }, [provider, openrouterApiKey]);


  const handleTestConnection = async (): Promise<void> => {
    try {
      const values = await form.validateFields();
      const connectionParams = {
        provider: values.provider,
        openaiApiKey: values.openaiApiKey || '',
        openrouterApiKey: values.openrouterApiKey || '',
        openaiModel: values.openaiModel,
        openrouterModel: values.openrouterModel,
        maxTokens: values.maxTokens,
        temperature: values.temperature,
        isConfigured: false,
        lastTested: null,
        lastTestStatus: null,
        lastTestMessage: null,
      };

      setIsTesting(true);
      setTestResult({ status: null, message: '' });

      const result = await AIService.testConnection(
        connectionParams,
        'Test de connexion depuis les paramètres du projet'
      );

      if (result.success) {
        setTestResult({ status: 'success', message: result.message });
        // Mettre à jour les paramètres avec le résultat du test
        const settings = {
          ...values,
          isConfigured: true,
          lastTested: new Date().toISOString(),
          lastTestStatus: 'success' as const,
          lastTestMessage: result.message,
        };

        if (onChange) {
          onChange(settings as any);
        } else {
          dispatch({
            type: 'UPDATE_APP_SETTINGS',
            payload: {
              ...state.appSettings,
              aiSettings: settings as any
            },
          });
        }
      } else {
        setTestResult({ status: 'error', message: result.message || 'Erreur inconnue lors du test de connexion' });
      }
    } catch (error: unknown) {
      console.error('Erreur lors du test de connexion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du test de connexion';
      setTestResult({
        status: 'error',
        message: errorMessage
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (values: FormValues): Promise<void> => {
    try {
      setIsSaving(true);
      const settings = {
        ...values,
        isConfigured: true,
        lastTested: new Date().toISOString(),
      };



      if (onChange) {
        onChange(settings as any);
      } else {
        dispatch({
          type: 'UPDATE_APP_SETTINGS',
          payload: {
            ...state.appSettings,
            aiSettings: settings as any
          },
        });
      }

      message.success('Paramètres IA enregistrés avec succès');
      return Promise.resolve();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des paramètres IA:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des paramètres IA';
      message.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    } finally {
      setIsSaving(false);
    }
  };


  interface ModelSelectProps {
    form: FormInstance<FormValues>;
    labelStyle: string;
    dynamicModels: any[];
    isFetching: boolean;
    searchTerm: string;
    onSearch: (val: string) => void;
  }

  const ModelSelect = React.memo<ModelSelectProps>(({ form, labelStyle, dynamicModels, isFetching, searchTerm, onSearch }) => {
    const provider = (Form.useWatch('provider', form) as ProviderType) || 'openai';
    const modelName = provider === 'openai' ? 'openaiModel' : 'openrouterModel';

    // S'assurer que le provider est valide
    const staticModels = MODELS[provider] || MODELS.openai;
    
    // Toujours mettre l'option Auto en premier pour OpenRouter
    let allModels = staticModels;
    if (provider === 'openrouter' && dynamicModels.length > 0) {
      const autoModel = staticModels.find(m => m.value === 'openrouter/auto');
      const otherModels = dynamicModels.filter(m => m.value !== 'openrouter/auto');
      allModels = autoModel ? [autoModel, ...otherModels] : dynamicModels;
    } else if (provider === 'openrouter') {
      allModels = staticModels;
    } else {
      allModels = dynamicModels.length > 0 ? dynamicModels : staticModels;
    }

    // Filtrer les modèles par recherche
    const filteredModels = allModels.filter(m =>
      m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Récupérer la valeur actuelle
    const currentModelValue = Form.useWatch(modelName, form);

    return (
      <div className="space-y-4">
        <Form.Item
          name={modelName}
          rules={[{ required: true, message: 'Veuillez sélectionner un modèle' }]}
          className="hidden"
        >
          <Input type="hidden" />
        </Form.Item>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label className={labelStyle}>Modèle IA</label>
          <Input
            placeholder="Rechercher un modèle..."
            value={searchTerm}
            onChange={e => onSearch(e.target.value)}
            className="max-w-xs rounded-lg dark:bg-gray-700 dark:border-gray-600"
            allowClear
            prefix={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
        </div>

        {isFetching ? (
          <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Chargement des modèles depuis OpenRouter...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
            {filteredModels.map((model) => {
              const isSelected = currentModelValue === model.value;
              const isFree = model.label.toLowerCase().includes('gratuit') || model.value.endsWith(':free');

              return (
                <div
                  key={model.value}
                  onClick={() => form.setFieldValue(modelName, model.value)}
                  className={`
                    group relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all duration-200
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold text-sm truncate mr-2 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                      {model.label.split(':')[0]}
                    </span>
                    {isSelected ? (
                      <div className="shrink-0 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="shrink-0 h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-blue-400 transition-colors"></div>
                    )}
                  </div>

                  <span className={`text-[10px] break-all mb-1 ${isSelected ? 'text-blue-600 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    ID: {model.value}
                  </span>

                  {model.context && (
                    <span className="text-[10px] text-gray-400">
                      Contexte: {(model.context / 1024).toFixed(0)}k
                    </span>
                  )}

                  {isFree && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Gratuit
                    </span>
                  )}
                </div>
              );
            })}

            {filteredModels.length === 0 && (
              <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500">Aucun modèle ne correspond à votre recherche</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
          <svg className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">Note sur les modèles</p>
            <p>Plus le modèle est puissant, plus il sera capable de comprendre des tâches complexes. Les modèles OpenRouter sont mis à jour dynamiquement.</p>
          </div>
        </div>
      </div>
    );
  });


  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Paramètres d'IA
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configurez les paramètres d'IA pour les fonctionnalités avancées
          </p>
        </div>

        <div className="p-6">
          <Form
            form={form}
            onFinish={handleSave}
            initialValues={initialValues}
            layout="vertical"
            className="space-y-6"
          >
            {/* Section Fournisseur */}
            <div className={sectionStyle}>
              <h3 className={sectionTitleStyle}>
                <svg className="h-5 w-5 inline-block mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Fournisseur d'IA
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <Form.Item
                  name="provider"
                  label={<span className={labelStyle}>Service d'IA</span>}
                  rules={[{ required: true, message: 'Veuillez sélectionner un fournisseur' }]}
                  className="mb-4"
                >
                  <Select
                    placeholder="Sélectionnez un fournisseur"
                    className={selectClassName}
                    popupClassName="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    dropdownStyle={isDarkMode ? { backgroundColor: '#1f2937', borderColor: '#4b5563' } : undefined}
                    optionLabelProp="label"
                  >
                    <Select.Option value="openai">OpenAI (direct)</Select.Option>
                    <Select.Option value="openrouter">OpenRouter (modèles multiples)</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item noStyle shouldUpdate={true}>
                  {({ getFieldValue }) => {
                    const provider: ProviderType = getFieldValue('provider') || 'openai';
                    const isOpenAI = provider === 'openai';
                    const apiKeyName = isOpenAI ? 'openaiApiKey' : 'openrouterApiKey';
                    const apiKeyLabel = isOpenAI ? 'Clé API OpenAI' : 'Clé API OpenRouter';

                    return (
                      <Form.Item
                        name={apiKeyName}
                        label={<span className={labelStyle}>{apiKeyLabel}</span>}
                        rules={[
                          {
                            required: true,
                            message: `Veuillez entrer votre ${apiKeyLabel}`
                          }
                        ]}
                        className="mb-4"
                      >
                        <Input.Password
                          placeholder={isOpenAI ? 'sk-...' : 'sk-or-...'}
                          className={`${inputClassName} flex dark:bg-gray-700 dark:text-white dark:border-gray-600`}
                          style={{
                            backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                            color: isDarkMode ? '#ffffff' : '#1f2937',
                            borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                          }}
                          iconRender={(visible) => (visible ? 
                            <EyeOutlined style={{ 
                              color: isDarkMode ? '#60a5fa' : '#3b82f6',
                              fontSize: '14px',
                              verticalAlign: 'middle'
                            }} className="transition-colors" /> : 
                            <EyeInvisibleOutlined style={{ 
                              color: isDarkMode ? '#9ca3af' : '#6b7280',
                              fontSize: '14px',
                              verticalAlign: 'middle'
                            }} className="transition-colors" />
                          )}
                          autoComplete="off"
                          defaultValue=""
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              </div>
            </div>

            {/* Section Modèle */}
            <div className={sectionStyle}>
              <h3 className={sectionTitleStyle}>
                <svg className="h-5 w-5 inline-block mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Modèle d'IA
              </h3>
              <ModelSelect
                form={form}
                labelStyle={labelStyle}
                dynamicModels={dynamicModels}
                isFetching={isFetchingModels}
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
              />
            </div>

            {/* Paramètres avancés */}
            <div className={sectionStyle}>
              <h3 className={sectionTitleStyle}>
                <svg className="h-5 w-5 inline-block mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Paramètres avancés
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  label={<span className={labelStyle}>Tokens maximum</span>}
                  name="maxTokens"
                  tooltip="Nombre maximum de tokens à générer (1-4000)"
                  className="mb-4"
                >
                  <InputNumber
                    min={1}
                    max={4000}
                    className={inputNumberClassName}
                    controls={false}
                    variant={isDarkMode ? 'filled' : undefined}
                    formatter={(value: number | string | undefined) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    parser={(value: string | undefined) =>
                      value ? parseInt(value.replace(/\s?|(,*)/g, ''), 10) : 0
                    }
                  />
                </Form.Item>

                <Form.Item
                  label={<span className={labelStyle}>Température</span>}
                  name="temperature"
                  tooltip="Contrôle le niveau d'aléatoire (0 = déterministe, 2 = très aléatoire)"
                  className="mb-4"
                >
                  <InputNumber
                    min={0}
                    max={2}
                    step={0.1}
                    className={inputNumberClassName}
                    variant={isDarkMode ? 'filled' : undefined}
                    formatter={(value: number | string | undefined) => `${value}`}
                    parser={(value: string | undefined) =>
                      value ? parseFloat(value.replace(/[^0-9.]/g, '')) : 0
                    }
                  />
                </Form.Item>
              </div>
            </div>

            {/* Résultat du test */}
            {testResult.status && (
              <div className="mt-4">
                <Alert
                  message={testResult.status === 'success' ? 'Connexion réussie' : 'Erreur de connexion'}
                  description={testResult.message}
                  type={testResult.status}
                  showIcon
                  className={testResult.status === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'}
                />
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className={`${secondaryButtonStyle} ${isTesting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isTesting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Test en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Tester la connexion
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className={`${primaryButtonStyle} ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Enregistrer les paramètres
                  </>
                )}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};
