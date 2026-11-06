interface ImportMetaEnv {
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  readonly VITE_COGNITO_APP_CLIENT_ID?: string;
  readonly VITE_COGNITO_DOMAIN?: string;
  readonly VITE_APPSYNC_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace chrome {
  namespace storage {
    const local: {
      get: (key: string) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
      remove: (key: string) => Promise<void>;
      clear: () => Promise<void>;
    };
  }
  namespace identity {
    function getRedirectURL(path?: string): string;
    function launchWebAuthFlow(details: {
      url: string;
      interactive?: boolean;
    }): Promise<string | undefined>;
  }
  namespace tabs {
    function query(queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
    }): Promise<Array<{ id?: number; url?: string }>>;
  }
  namespace scripting {
    function executeScript<T>(injection: {
      target: { tabId: number };
      func: () => T;
    }): Promise<Array<{ result?: T }>>;
  }
}
