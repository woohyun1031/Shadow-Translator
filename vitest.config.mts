import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.ts'],
        // 테스트가 하나도 없어도 실패로 보지 않는다. 첫 테스트를 추가하면 지워도 된다.
        passWithNoTests: true,
        restoreMocks: true,
    },
});
