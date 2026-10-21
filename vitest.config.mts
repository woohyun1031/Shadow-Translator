import { defineConfig } from 'vitest/config';

export default defineConfig({
    // webpack DefinePlugin과 같은 상수. 테스트는 배포 빌드 기준으로 본다.
    define: { __DEV__: 'false' },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
        restoreMocks: true,
    },
});
