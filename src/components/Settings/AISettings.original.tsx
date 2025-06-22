import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AISettings as AISettingsType } from '../../types';
import { Button, Input, Select, message, Switch, Form, Typography, Divider } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, RocketOutlined, SaveOutlined } from '@ant-design/icons';
import { AIService } from '../../services/aiService';

const { Option } = Select;
const { Title, Text } = Typography;

interface ModelOption {
  value: string;
  label: string;
}

type ProviderType = 'openai' | 'openrouter';

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

interface AISettingsProps {
  value?: any;
  onChange?: (value: any) => void;
  showTitle?: boolean;
}

export const AISettings: React.FC<AISettingsProps> = ({ 
  value: externalValue, 
  onChange,
  showTitle = true 
}) => {
  const { state, dispatch } = useApp();
  const [form] = Form.useForm();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });

  // Valeurs par défaut
  const initialValues = {
    provider: 'openai',
    openaiApiKey: '',
    openrouterApiKey: '',
    openaiModel: 'gpt-3.5-turbo',
    openrouterModel: 'openai/gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    isConfigured: false,
    ...externalValue
  };

  // Mettre à jour le formulaire quand les valeurs externes changent
  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [externalValue]);

  const aiSettings = state.appSettings.aiSettings || {};

  useEffect(() => {
    form.setFieldsValue({
      provider: aiSettings.provider,
      openaiApiKey: aiSettings.openaiApiKey || '',
      openrouterApiKey: aiSettings.openrouterApiKey || '',
      openaiModel: aiSettings.openaiModel,
      openrouterModel: aiSettings.openrouterModel,
      maxTokens: aiSettings.maxTokens,
      temperature: aiSettings.temperature,
    });
  }, [aiSettings, form]);

  const testConnection = async () => {
    const values = await form.validateFields();
    setIsTesting(true);
    setTestResult({ status: null, message: '' });

    try {
      const result = await AIService.testConnection(
        {
          provider: values.provider,
          openaiApiKey: values.openaiApiKey || '',
          openrouterApiKey: values.openrouterApiKey || '',
          openaiModel: values.openaiModel,
          openrouterModel: values.openrouterModel,
          maxTokens: values.maxTokens,
          temperature: values.temperature,
        },
        'Test de connexion depuis les paramètres du projet'
      );

      if (result.success) {
        setTestResult({
          status: 'success',
          message: result.message,
        });

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

      // Mettre à jour les paramètres avec l'erreur
      const settings = {
        ...values,
        lastTested: new Date().toISOString(),
        lastTestStatus: 'error',
        lastTestMessage: error.message || 'Erreur lors du test de connexion',
      };

      if (onChange) {
        onChange(settings);
      } else {
        dispatch({
          type: 'UPDATE_APP_SETTINGS',
          payload: { aiSettings: settings },
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      const settings = {
        ...values,
        isConfigured: true,
        lastTested: new Date().toISOString(),
      };

      // Si c'est une utilisation dans un projet, appeler onChange
      if (onChange) {
        onChange(settings);
      } else {
        // Sinon, mettre à jour les paramètres globaux
        dispatch({
          type: 'UPDATE_APP_SETTINGS',
          payload: { aiSettings: settings },
        });
      }

      message.success('Paramètres IA enregistrés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres IA:', error);
      message.error('Erreur lors de la sauvegarde des paramètres IA');
    }
  };

  const handleTestConnection = async () => {
    const values = await form.validateFields();
    const provider = values.provider;
    
    setIsTesting(true);
    setTestResult({ status: null, message: '' });

    try {
      const result = await AIService.testConnection(
        {
          ...aiSettings,
          ...values
        },
        'Test de connexion au service IA'
      );

      if (result.success) {
        setTestResult({
          status: 'success',
          message: result.message,
        });
        message.success(result.message);

        // Mettre à jour les paramètres avec le statut de test
        dispatch({
          type: 'UPDATE_APP_SETTINGS',
          payload: {
            aiSettings: {
              ...aiSettings,
              ...form.getFieldsValue(),
              isConfigured: true,
              lastTested: new Date().toISOString(),
              lastTestStatus: 'success',
              lastTestMessage: result.message,
            },
          },
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      const errorMessage = `Échec de la connexion: ${error.message || 'Erreur inconnue'}`;
      setTestResult({
        status: 'error',
        message: errorMessage,
      });
      message.error(errorMessage);

      // Mettre à jour les paramètres avec l'erreur de test
      dispatch({
        type: 'UPDATE_APP_SETTINGS',
        payload: {
          aiSettings: {
            ...aiSettings,
            ...form.getFieldsValue(),
            isConfigured: false,
            lastTested: new Date().toISOString(),
            lastTestStatus: 'error',
            lastTestMessage: errorMessage,
          },
        },
      });
    } finally {
      setIsTesting(false);
    }
  };

  const renderTestResult = () => {
    if (!testResult.status) return null;

    return (
      <Alert
        style={{ marginBottom: 16 }}
        message={
          <>
            {testResult.status === 'success' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}{' '}
            {testResult.message}
          </>
        }
        type={testResult.status === 'success' ? 'success' : 'error'}
        showIcon
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {showTitle && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <RocketOutlined className="text-xl text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-800">Paramètres d'IA</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">Configurez vos paramètres d'intelligence artificielle pour une expérience personnalisée</p>
        </div>
      )}
      
      <div className="p-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="space-y-6"
          initialValues={{
            provider: aiSettings.provider || 'openai',
            maxTokens: aiSettings.maxTokens || 1000,
            temperature: aiSettings.temperature || 0.7,
          }}
        >
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Configuration du fournisseur</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                label="Fournisseur d'IA"
                name="provider"
                className="mb-0"
                rules={[{ required: true, message: 'Veuillez sélectionner un fournisseur' }]}
              >
                <Select 
                  placeholder="Sélectionnez un fournisseur d'IA" 
                  onChange={() => setTestResult({ status: null, message: '' })}
                  className="w-full"
                >
                  <Option value="openai">OpenAI</Option>
                  <Option value="openrouter">OpenRouter</Option>
                </Select>
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.provider !== currentValues.provider}>
                {({ getFieldValue }) => (
                  <div className="mt-4">
                    {getFieldValue('provider') === 'openai' ? (
                      <Form.Item
                        label={
                          <div className="flex items-center">
                            <span>Clé API OpenAI</span>
                            <a 
                              href="https://platform.openai.com/api-keys" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              (obtenir une clé)
                            </a>
                          </div>
                        name="openaiApiKey"
                        rules={[
                          {
                            required: true,
                            message: 'Veuillez entrer votre clé API OpenAI',
                          },
                        ]}
                        className="mb-0"
                      >
                        <Input.Password 
                          placeholder="sk-..." 
                          className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </Form.Item>
                      <Text type="secondary">
                        Vous pouvez obtenir une clé API sur le{' '}
                        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                          tableau de bord OpenAI
                        </a>
                      </Text>
                    </Form.Item>
                    <Form.Item
                      label="Modèle OpenAI"
                      name="openaiModel"
                      className="mb-0"
                      rules={[
                        {
                          required: true,
                          message: 'Veuillez sélectionner un modèle',
                        },
                      ]}
                    >
                      <Select
                        placeholder="Sélectionnez un modèle"
                        options={MODELS.openai}
                        className="w-full"
                      />
                    </Form.Item>
                    // ...
                  </div>
                </Form.Item>

                <Form.Item
                  label="Nombre maximum de tokens"
                  <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Paramètres avancés</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item
                      label={
                        <div className="flex items-center">
                          <span>Nombre maximum de tokens</span>
                          <span className="ml-2 text-xs text-gray-500 font-normal">(1-4000)</span>
                        </div>
                      }
                      name="maxTokens"
                      tooltip={
                        <div className="max-w-xs">
                          Le nombre maximum de tokens à générer. Des valeurs plus élevées donnent des réponses plus longues mais coûtent plus cher.
                        </div>
                      }
                      className="mb-0"
                    >
                      <Input 
                        type="number" 
                        min={1} 
                        max={4000} 
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <div className="flex items-center">
                          <span>Température</span>
                          <span className="ml-2 text-xs text-gray-500 font-normal">(0-1)</span>
                        </div>
                      }
                      name="temperature"
                      tooltip={
                        <div className="max-w-xs">
                          Contrôle le caractère aléatoire des réponses. Une valeur plus proche de 0 donne des réponses plus prévisibles, une valeur plus proche de 1 donne des réponses plus créatives.
                        </div>
                      }
                      className="mb-0"
                    >
                      <div className="flex items-center space-x-4">
                        <Input 
                          type="number" 
                          min={0} 
                          max={1} 
                          step={0.1} 
                          className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <div className="text-xs text-gray-500 w-16">
                          {form.getFieldValue('temperature') < 0.3 ? 'Précis' : 
                           form.getFieldValue('temperature') < 0.7 ? 'Équilibré' : 'Créatif'}
                        </div>
                      </div>
                    </Form.Item>
                  </div>
                </div>
                // ...
              </Form.Item>

              <Form.Item
                label="Température"
                name="temperature"
                rules={[
                  { required: true, message: 'Veuillez entrer une valeur de température' },
                  {
                    validator: (_, value) => {
                      const num = parseFloat(value);
                      if (isNaN(num) || num < 0 || num > 2) {
                        return Promise.reject(new Error('La température doit être entre 0 et 2'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input type="number" min={0} max={2} step={0.1} />
              </Form.Item>

              {testResult.status && (
                <div className={`mt-6 p-4 rounded-lg ${
                  testResult.status === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    {testResult.status === 'success' ? (
                      <CheckCircleOutlined className="text-green-500 text-lg mr-2 mt-0.5" />
                    ) : (
                      <CloseCircleOutlined className="text-red-500 text-lg mr-2 mt-0.5" />
                    )}
                    <p className={`text-sm ${
                      testResult.status === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  onClick={handleTestConnection}
                  loading={isTesting}
                  disabled={isTesting}
                  className="flex items-center justify-center px-6 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <>
                      <LoadingOutlined className="mr-2" />
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tester la connexion
                    </>
                  )}
                </Button>
                
                <Button 
                  type="primary" 
                  htmlType="submit"
                  className="flex items-center justify-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <SaveOutlined className="mr-2" />
                  Enregistrer les paramètres
                </Button>
              </div>
            </Form>
          </div>
        </div>
        // ...
        <Title level={5}>Statut du service</Title>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Dernier test: </Text>
          <Text>{aiSettings.lastTested ? new Date(aiSettings.lastTested).toLocaleString() : 'Jamais'}</Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          // ...
          {aiSettings.lastTestStatus === 'success' ? (
            <Text type="success">
              <CheckCircleOutlined /> Connecté
            </Text>
          ) : aiSettings.lastTestStatus === 'error' ? (
            <Text type="danger">
              <CloseCircleOutlined /> Erreur de connexion
            </Text>
          ) : (
            <Text type="secondary">Non testé</Text>
          )}
        </div>
        {aiSettings.lastTestMessage && (
          <div style={{ marginBottom: 16 }}>
            <Text strong>Détails: </Text>
            <Text type={aiSettings.lastTestStatus === 'success' ? 'success' : 'danger'}>{aiSettings.lastTestMessage}</Text>
          </div>
        )}
      </div>
    </Card>
  );
};
