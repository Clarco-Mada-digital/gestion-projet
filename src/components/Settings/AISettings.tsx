import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Card, 
  Input, 
  Button, 
  Select, 
  Alert, 
  message, 
  InputNumber, 
  theme, 
  Form
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
const { useToken } = theme;
const { Password } = Input;
import { AIService } from '../../services/aiService';
import '../../styles/ai-settings.css';

type ProviderType = 'openai' | 'openrouter';

interface ModelOption {
  value: string;
  label: string;
}

interface FormValues {
  provider: ProviderType;
  openaiApiKey?: string;
  openrouterApiKey?: string;
  openaiModel?: string;
  openrouterModel?: string;
  maxTokens: number;
  temperature: number;
  isConfigured?: boolean;
  lastTested?: string;
  lastTestStatus?: string;
  lastTestMessage?: string;
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
    { value: 'openrouter/auto', label: 'Auto (sélection automatique gratuite)' },
    { value: 'google/gemma-7b-it:free', label: 'Google: Gemma 7B (gratuit)' },
    { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (gratuit)' },
    { value: 'huggingfaceh4/zephyr-7b-beta:free', label: 'Zephyr 7B (gratuit)' },    
    { value: 'openai/gpt-3.5-turbo', label: 'OpenAI: GPT-3.5 Turbo' },
    { value: 'openai/gpt-4', label: 'OpenAI: GPT-4' },
    { value: 'anthropic/claude-2', label: 'Anthropic: Claude 2' },
    { value: 'google/gemini-pro', label: 'Google: Gemini Pro' },
  ]
};

interface TestResult {
  status: 'success' | 'error' | null;
  message: string;
}

export const AISettings: React.FC<AISettingsProps> = ({ 
  value: externalValue, 
  onChange,
  showTitle = true 
}) => {
  const [form] = Form.useForm<FormValues>();
  const { token } = theme.useToken();
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

  // Valeurs par défaut
  const initialValues: FormValues = {
    provider: 'openai',
    openaiApiKey: '',
    openrouterApiKey: '',
    openaiModel: 'gpt-3.5-turbo',
    openrouterModel: 'openai/gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    ...externalValue
  };

  // Mettre à jour le formulaire quand les valeurs externes ou les paramètres IA changent
  useEffect(() => {
    const settings = externalValue || state.appSettings.aiSettings;
    if (settings) {
      form.setFieldsValue({
        ...initialValues,
        ...settings
      });
    } else {
      form.setFieldsValue(initialValues);
    }
  }, [externalValue, state.appSettings.aiSettings, form]);

  const aiSettings = externalValue || state.appSettings.aiSettings || initialValues;

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
          onChange(settings);
        } else {
          dispatch({
            type: 'UPDATE_APP_SETTINGS',
            payload: { 
              ...state.appSettings,
              aiSettings: settings 
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

      console.log('Sauvegarde des paramètres IA:', settings);

      if (onChange) {
        onChange(settings);
      } else {
        dispatch({
          type: 'UPDATE_APP_SETTINGS',
          payload: { 
            ...state.appSettings,
            aiSettings: settings 
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

  const renderTestResult = () => {
    if (!testResult.status) return null;

    const isSuccess = testResult.status === 'success';

    return (
      <div style={{ marginBottom: 16 }}>
        <Alert
          message={testResult.message}
          type={isSuccess ? 'success' : 'error'}
          showIcon
          style={{ 
            borderRadius: 8,
            border: 'none',
            backgroundColor: isSuccess ? '#f6ffed' : '#fff2f0',
          }}
        />
      </div>
    );
  };

  interface ModelSelectProps {
    form: FormInstance<FormValues>;
    labelStyle: string;
  }

  const ModelSelect = React.memo<ModelSelectProps>(({ form, labelStyle }) => {
    const provider = (Form.useWatch('provider', form) as ProviderType) || 'openai';
    const modelName = provider === 'openai' ? 'openaiModel' : 'openrouterModel';
    const { token } = theme.useToken();
    
    // S'assurer que le provider est valide
    const models = MODELS[provider] || MODELS.openai;
    
    return (
      <div className="grid grid-cols-1 gap-6">
        <Form.Item
          label={<span className={labelStyle}>Modèle IA</span>}
          name={modelName}
          rules={[{ required: true, message: 'Veuillez sélectionner un modèle' }]}
          className="mb-4"
        >
          <Select
            showSearch
            placeholder="Sélectionnez un modèle"
            optionFilterProp="label"
            className={selectClassName}
            popupClassName={`dark:bg-gray-800 dark:border-gray-700 ${isDarkMode ? 'dark' : ''}`}
            dropdownStyle={{
              backgroundColor: isDarkMode ? '#1f2937' : token.colorBgElevated,
              borderColor: isDarkMode ? '#374151' : token.colorBorder,
              color: isDarkMode ? token.colorText : undefined,
            }}
            variant={isDarkMode ? 'filled' : undefined}
            filterOption={(input, option) => {
              if (!option || !option.label) return false;
              const label = typeof option.label === 'string' ? option.label : 
                         typeof option.label === 'object' && 'props' in option.label ? 
                         String(option.label.props.children) : '';
              return label.toLowerCase().includes(input.toLowerCase());
            }}
            options={models.map(model => ({
              value: model.value,
              label: (
                <div className="flex items-center">
                  <span className="truncate dark:text-white">{model.label}</span>
                </div>
              )
            }))}
            optionRender={(option) => {
              const label = option.label as React.ReactNode;
              return (
                <div className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2">
                  <span className="truncate dark:text-white">{label}</span>
                </div>
              );
            }}
            menuItemSelectedIcon={null}
            dropdownRender={(menu) => (
              <div className="dark:bg-gray-800 dark:border-gray-700 rounded-md shadow-lg">
                {menu}
              </div>
            )}
            style={{
              color: isDarkMode ? token.colorText : undefined,
            }}
          />
        </Form.Item>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 -mt-3">
          <p>Le choix du modèle affecte la qualité et la vitesse des réponses de l'IA.</p>
          <p>Les modèles plus avancés offrent de meilleurs résultats mais peuvent être plus lents et plus coûteux.</p>
        </div>
      </div>
    );
  });

  // Styles pour la carte principale
  const cardStyle: React.CSSProperties = {
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    color: isDarkMode ? '#f9fafb' : '#111827',
  };

  // Styles pour les boutons
  const buttonStyle = (primary = false): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      borderRadius: '0.375rem',
      fontWeight: 500,
      padding: '0.5rem 1rem',
      transition: 'all 0.2s',
    };

    if (primary) {
      return {
        ...baseStyle,
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        border: '1px solid #2563eb',
      };
    }
  }

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
                        rules={[{ required: true, message: `Veuillez entrer votre ${apiKeyLabel}` }]}
                        className="mb-4"
                      >
                        <Input.Password 
                    placeholder={isOpenAI ? 'sk-...' : 'sk-or-...'}
                    className={inputClassName}
                    visibilityToggle={true}
                    variant={isDarkMode ? 'filled' : undefined}
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
              <ModelSelect form={form} labelStyle={labelStyle} />
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
