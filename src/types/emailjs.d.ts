// Déclaration de types pour EmailJS

declare module '@emailjs/browser' {
  interface EmailJSResponse {
    status: number;
    text: string;
  }

  interface EmailJSOptions {
    publicKey?: string;
    privateKey?: string;
    blockHeadless?: boolean;
    blockList?: {
      list: string[];
      watchTimeout?: number;
      timeout?: number;
    };
  }

  interface EmailJSSendOptions extends EmailJSOptions {
    publicKey: string;
  }

  const emailjs: {
    init: (options?: EmailJSOptions) => void;
    send: (
      serviceId: string,
      templateId: string,
      templateParams: Record<string, unknown>,
      options?: EmailJSSendOptions
    ) => Promise<EmailJSResponse>;
    sendForm: (
      serviceId: string,
      templateId: string,
      form: HTMLFormElement | string,
      options?: EmailJSSendOptions
    ) => Promise<EmailJSResponse>;
  };

  export default emailjs;
}

// Déclaration pour l'objet global window
declare global {
  interface Window {
    emailjs: typeof import('@emailjs/browser').default;
  }
}
