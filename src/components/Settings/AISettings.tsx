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

  const testConnection = async () => {
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
          lastTestStatus: 'success',
          lastTestMessage: result.message,
        };

        if (onChange) {
          onChange(settings);
        } else {
          dispatch({
            type: 'UPDATE_APP_SETTINGS',
            payload: { aiSettings: settings },
          });
        }
      } else {
        throw new Error(result.message || 'Échec de la connexion');
      }
    } catch (error: any) {
      console.error('Erreur lors du test de connexion:', error);
      setTestResult({
        status: 'error',
        message: error.message || 'Erreur lors du test de connexion',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (values: FormValues) => {
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
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des paramètres IA:', error);
      message.error(error.message || 'Erreur lors de la sauvegarde des paramètres IA');
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

  const ModelSelect = React.memo<{ form: FormInstance<FormValues> }>(({ form }) => {
    const provider = (Form.useWatch('provider', form) as ProviderType) || 'openai';
    const modelName = provider === 'openai' ? 'openaiModel' : 'openrouterModel';
    
    // S'assurer que le provider est valide
    const models = MODELS[provider] || MODELS.openai;
    
    return (
      <div style={{ marginBottom: '20px' }}>
        <Form.Item
          label="Modèle"
          name={modelName}
          rules={[{ required: true, message: 'Veuillez sélectionner un modèle' }]}
          style={{ marginBottom: '16px' }}
        >
          <Select
            showSearch
            placeholder="Sélectionnez un modèle"
            optionFilterProp="label"
            style={{ width: '100%' }}
            dropdownStyle={{
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
            }}
            options={models.map(model => ({
              value: model.value,
              label: model.label
            }))}
          />
        </Form.Item>
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

  // Styles pour les entrées de formulaire
  const inputStyle: React.CSSProperties & { ':focus': any; '::placeholder': any } = {
    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    color: isDarkMode ? '#f9fafb' : '#111827',
    borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
    borderRadius: '0.375rem',
    borderWidth: '1px',
    padding: '0.5rem 0.75rem',
    width: '100%',
    ':focus': {
      borderColor: isDarkMode ? '#3b82f6' : '#3b82f6',
      ring: '1px solid #3b82f6',
      outline: 'none',
    },
    '::placeholder': {
      color: isDarkMode ? '#9ca3af' : '#9ca3af',
    },
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

    return {
      ...baseStyle,
      backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
      color: isDarkMode ? '#f9fafb' : '#111827',
      border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
    };
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
      <Card
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
          }}>
            <span style={{ 
              marginRight: '0.75rem',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: '1.25rem',
              lineHeight: '1.75rem',
            }}>⚙️</span>
            <h2 style={{
              margin: 0,
              fontSize: '1.125rem',
              lineHeight: '1.75rem',
              fontWeight: 600,
              color: isDarkMode ? '#f9fafb' : '#111827',
            }}>
              Paramètres IA
            </h2>
          </div>
        }
        style={cardStyle}
        bodyStyle={{
          padding: '1.5rem',
          color: isDarkMode ? '#f9fafb' : '#111827',
        }}
      >
        <Form
          form={form}
          onFinish={handleSave}
          initialValues={initialValues}
          layout="vertical"
        >
          {/* Provider Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              color: isDarkMode ? '#fff' : 'rgba(0, 0, 0, 0.85)',
              marginBottom: '16px'
            }}>
              AI Provider
            </h3>
            
            <Form.Item
              name="provider"
              label="AI Service"
              rules={[{ required: true, message: 'Please select a provider' }]}
              style={{ marginBottom: '16px' }}
            >
              <Select 
                placeholder="Select a provider"
                style={{ width: '100%' }}
              >
                <Select.Option value="openai">OpenAI (direct)</Select.Option>
                <Select.Option value="openrouter">OpenRouter (multiple models)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }: { getFieldValue: (name: string) => any }) => {
                const provider: ProviderType = getFieldValue('provider') || 'openai';
                const isOpenAI = provider === 'openai';
                const apiKeyName = isOpenAI ? 'openaiApiKey' : 'openrouterApiKey';
                const apiKeyLabel = isOpenAI ? 'OpenAI API Key' : 'OpenRouter API Key';
                
                return (
                  <Form.Item
                    name={apiKeyName}
                    label={apiKeyLabel}
                    rules={[{ required: true, message: `Please enter your ${apiKeyLabel}` }]}
                    style={{ marginBottom: '16px' }}
                  >
                    <Password 
                      placeholder={isOpenAI ? 'sk-...' : 'sk-or-...'}
                      style={inputStyle}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </div>

          {/* Model Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              color: isDarkMode ? '#fff' : 'rgba(0, 0, 0, 0.85)',
              marginBottom: '16px'
            }}>
              AI Model
            </h3>
            <ModelSelect form={form} />
          </div>

          {/* Advanced Settings */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              color: isDarkMode ? '#fff' : 'rgba(0, 0, 0, 0.85)',
              marginBottom: '16px'
            }}>
              Advanced Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Form.Item
                label="Max Tokens"
                name="maxTokens"
                tooltip="Maximum number of tokens to generate (1-4000)"
                style={{ marginBottom: '16px' }}
                labelCol={{ style: { color: isDarkMode ? '#f9fafb' : '#111827' } }}
              >
                <InputNumber 
                  min={1} 
                  max={4000}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Temperature"
                name="temperature"
                tooltip="Controls randomness (0 = deterministic, 2 = very random)"
                style={{ marginBottom: '16px' }}
                labelCol={{ style: { color: isDarkMode ? '#f9fafb' : '#111827' } }}
              >
                <InputNumber 
                  min={0} 
                  max={2} 
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          </div>

          {/* Test Result */}
          {testResult.status && (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message={testResult.status === 'success' ? 'Succès' : 'Erreur'}
                description={testResult.message}
                type={testResult.status}
                showIcon
              />
            </div>
          )}
          
          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button 
              onClick={testConnection}
              loading={isTesting}
              style={buttonStyle()}
            >
              Tester la connexion
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={isSaving}
              style={buttonStyle(true)}
            >
              Enregistrer les paramètres
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
  
};


