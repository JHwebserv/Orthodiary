// src/types/global.d.ts
export {};

declare global {
  interface Window {
    // 카카오 SDK
    Kakao: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      cleanup: () => void;
      Auth: {
        login: (options: {
          success: (authObj: any) => void;
          fail: (error: any) => void;
        }) => void;
        logout: () => void;
      };
      API: {
        request: (options: {
          url: string;
          success: (response: any) => void;
          fail: (error: any) => void;
        }) => void;
      };
    };

    // 네이버 SDK
    naver: any;

    // SDK 상태 추적
    SDK_STATUS: {
      kakao: boolean;
      naver: boolean;
      loadTime: number;
    };
  }
}