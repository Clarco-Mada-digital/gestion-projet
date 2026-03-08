/**
 * Service de chiffrement de bout en bout (E2EE)
 * Utilise l'API Web Crypto pour assurer que les données sont illisibles sur le serveur.
 */

export class EncryptionService {
  private static ALGORITHM = 'AES-GCM';
  private static KEY_LENGTH = 256;

  /**
   * Génère une clé aléatoire forte pour un nouveau projet
   */
  static async generateProjectKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return this.bufferToHex(exported);
  }

  /**
   * Chiffre une chaîne de caractères
   */
  static async encrypt(text: string, hexKey: string): Promise<string> {
    if (!text || !hexKey) return text;
    
    try {
      const key = await this.importKey(hexKey);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedText = new TextEncoder().encode(text);
      
      const encrypted = await window.crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        key,
        encodedText
      );

      // On combine IV + Données chiffrées pour le stockage
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return this.bufferToHex(combined.buffer);
    } catch (error) {
      console.error('[Encryption] Erreur de chiffrement:', error);
      return text;
    }
  }

  /**
   * Déchiffre une chaîne de caractères
   */
  static async decrypt(hexData: string, hexKey: string): Promise<string> {
    if (!hexData || !hexKey || hexData.length < 24) return hexData;

    try {
      const key = await this.importKey(hexKey);
      const combined = this.hexToBuffer(hexData);
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      // Si on ne peut pas déchiffrer, c'est peut-être que ce n'est pas chiffré
      // ou que la clé est mauvaise. On renvoie le texte original.
      console.warn('[Encryption] Échec du déchiffrement, renvoi des données brutes');
      return hexData;
    }
  }

  /**
   * Sauvegarde une clé de projet localement
   */
  static saveProjectKey(projectId: string, key: string): void {
    const keys = this.getAllKeys();
    keys[projectId] = key;
    localStorage.setItem('project_e2ee_keys', JSON.stringify(keys));
  }

  /**
   * Récupère une clé de projet locale
   */
  static getProjectKey(projectId: string): string | null {
    const keys = this.getAllKeys();
    return keys[projectId] || null;
  }

  /**
   * Supprime une clé de projet locale
   */
  static removeProjectKey(projectId: string): void {
    const keys = this.getAllKeys();
    delete keys[projectId];
    localStorage.setItem('project_e2ee_keys', JSON.stringify(keys));
  }

  private static getAllKeys(): Record<string, string> {
    try {
      const stored = localStorage.getItem('project_e2ee_keys');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  // --- Utilitaires Internes ---

  private static async importKey(hexKey: string): Promise<CryptoKey> {
    const rawKey = this.hexToBuffer(hexKey);
    return await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      this.ALGORITHM,
      true,
      ['encrypt', 'decrypt']
    );
  }

  private static bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}
