import React from 'react';
import { useApp } from '../../context/AppContext';
import { User, TeamMember } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, EnvelopeIcon, PhoneIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface TeamManagementProps {
  onEditMember: (member?: User) => void;
}

export function TeamManagement({ onEditMember }: TeamManagementProps) {
  const { state, dispatch } = useApp();

  // Utiliser directement les utilisateurs comme membres d'équipe
  // Ne pas afficher l'utilisateur actuel dans la liste
  const teamMembers = state.users.filter(user => user.id !== state.users[0]?.id) || [];
  const currentUser = state.users[0];

  const handleEdit = (member: User) => {
    onEditMember(member);
  };

  const handleDelete = (memberId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      // Ne pas permettre la suppression de l'utilisateur principal
      if (memberId === currentUser?.id) {
        alert('Impossible de supprimer l\'utilisateur principal');
        return;
      }

      // Supprimer l'utilisateur
      dispatch({ type: 'REMOVE_USER', payload: memberId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Membres de l'équipe</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Liste des personnes pouvant être assignées aux tâches
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEditMember()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Ajouter un membre
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {teamMembers.map((member) => (
            <li key={member.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    {member.avatar ? (
                      <img className="h-10 w-10 rounded-full" src={member.avatar} alt="" />
                    ) : (
                      <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                      </p>
                      {member.role === 'admin' && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {(member.phone || member.position) && (
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {member.phone && (
                          <>
                            <PhoneIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span className="mr-4">{member.phone}</span>
                          </>
                        )}
                        {member.position && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {member.department ? `${member.position}, ${member.department}` : member.position}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(member)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Modifier</span>
                  </button>
                  {member.id !== state.currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(member.id)}
                      className="p-1.5 rounded-full text-red-400 hover:text-red-500 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
          {teamMembers.length === 0 && (
            <li className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              Aucun membre n'a été ajouté pour le moment.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
