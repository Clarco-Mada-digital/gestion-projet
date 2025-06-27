import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Card } from '../UI/Card';
import { Plus, Trash2, Edit, X, Save } from 'lucide-react';
import type { Contact } from '../../types';

interface ContactManagementProps {
  contacts: Contact[];
  onUpdateContacts: (contacts: Contact[]) => void;
}

export function ContactManagement({ contacts, onUpdateContacts }: ContactManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddContact = () => {
    if (!formData.name || !formData.email) return;
    
    const newContact: Contact = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone || '',
      position: formData.position || '',
      department: formData.department || '',
      notes: formData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onUpdateContacts([...contacts, newContact]);
    setFormData({ name: '', email: '', phone: '', position: '', department: '', notes: '' });
    setIsAdding(false);
  };

  const handleUpdateContact = () => {
    if (!editingId || !formData.name || !formData.email) return;
    
    const updatedContacts = contacts.map(contact => 
      contact.id === editingId 
        ? { 
            ...contact, 
            ...formData,
            updatedAt: new Date().toISOString()
          } 
        : contact
    );

    onUpdateContacts(updatedContacts);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', position: '', department: '', notes: '' });
  };

  const handleEditContact = (contact: Contact) => {
    setEditingId(contact.id);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      position: contact.position || '',
      department: contact.department || '',
      notes: contact.notes || ''
    });
  };

  const handleDeleteContact = (id: string) => {
    onUpdateContacts(contacts.filter(contact => contact.id !== id));
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', email: '', phone: '', position: '', department: '', notes: '' });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestion des contacts</h2>
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un contact
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? 'Modifier le contact' : 'Nouveau contact'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom complet *"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Jean Dupont"
            />
            <Input
              label="Email *"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="jean.dupont@example.com"
            />
            <Input
              label="Téléphone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+261 34 00 000 00"
            />
            <Input
              label="Poste"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Chef de projet"
            />
            <Input
              label="Département"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Informatique"
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Informations complémentaires..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button 
              onClick={editingId ? handleUpdateContact : handleAddContact}
              disabled={!formData.name || !formData.email}
            >
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun contact enregistré pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Poste</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {contact.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {contact.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditContact(contact)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
