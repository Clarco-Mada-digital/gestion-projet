import React from 'react';
import { Form, Select, Typography, Space, Tooltip } from 'antd';
import { InfoCircleOutlined, ThunderboltOutlined, BulbOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const MODELS = [
  {
    value: 'meta-llama/llama-3.1-8b-instruct:free',
    label: 'Llama 3.1 8B (Free)',
    description: 'Rapide, efficace et gratuit. Idéal pour les rapports simples.'
  },
  {
    value: 'meta-llama/llama-3.3-70b-instruct:free',
    label: 'Llama 3.3 70B (Free)',
    description: 'Très puissant, niveau GPT-4. Parfois sujet à des limitations de débit.'
  },
  {
    value: 'mistralai/mistral-nemo-12b-instruct:free',
    label: 'Mistral Nemo 12B (Free)',
    description: 'Excellent rapport performance/vitesse.'
  },
  {
    value: 'google/gemini-2.0-flash-exp:free',
    label: 'Gemini 2.0 Flash Exp (Free)',
    description: 'Très rapide, grande fenêtre de contexte.'
  },
  {
    value: 'cognitivecomputations/dolphin-mixtral-8x7b:free',
    label: 'Dolphin Mixtral (Free)',
    description: 'Non censuré, très créatif.'
  },
  {
    value: 'anthropic/claude-3.5-haiku',
    label: 'Claude 3.5 Haiku',
    description: 'Très intelligent, concis et professionnel (Payant).'
  },
  {
    value: 'openai/gpt-4o',
    label: 'GPT-4o',
    description: 'Le modèle le plus performant d\'OpenAI (Payant).'
  }
];

export const ReportModelSection: React.FC = () => {
  return (
    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: '16px' }}>
        <Space>
          <ThunderboltOutlined style={{ color: '#faad14' }} />
          <Text strong style={{ fontSize: '16px' }}>Modèle pour les Rapports</Text>
          <Tooltip title="Choisissez le modèle spécifique utilisé pour la génération des rapports d'activité. Certains modèles gratuits peuvent être plus lents ou limités.">
            <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.45)', cursor: 'help' }} />
          </Tooltip>
        </Space>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          Ce réglage remplace le modèle global lors de la génération des rapports pour optimiser la qualité.
        </Text>
      </Space>

      <Form.Item
        name="reportModel"
        noStyle
      >
        <Select
          placeholder="Sélectionnez un modèle pour les rapports"
          style={{ width: '100%' }}
          dropdownStyle={{ borderRadius: '8px' }}
          className="custom-select"
        >
          {MODELS.map(model => (
            <Option key={model.value} value={model.value}>
              <div style={{ padding: '4px 0' }}>
                <div style={{ fontWeight: 500, marginBottom: '2px' }}>{model.label}</div>
                <div style={{ fontSize: '11px', opacity: 0.6, whiteSpace: 'normal', lineHeight: '1.4' }}>
                  {model.description}
                </div>
              </div>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(250, 173, 20, 0.1)', borderLeft: '3px solid #faad14' }}>
        <Space align="start">
          <BulbOutlined style={{ color: '#faad14', marginTop: '3px' }} />
          <Text style={{ fontSize: '12px' }}>
            <strong>Conseil :</strong> Si vous rencontrez des erreurs "429 Too Many Requests", essayez de passer à <strong>Llama 3.1 8B</strong> ou un modèle payant si vous avez des crédits.
          </Text>
        </Space>
      </div>
    </div>
  );
};
