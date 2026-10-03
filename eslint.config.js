const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', '.expo/**', '.kilo/worktrees/**'],
  },
  {
    files: [
      'src/components/ui/**/*.{ts,tsx}',
      'src/shared/**/*.{ts,tsx}',
      'src/theme/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/app/**', '@/features/**'],
          message: 'La capa compartida no puede depender de rutas ni de features de producto.',
        }],
      }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/app/**', '@/bootstrap/**'],
          message: 'Las features no pueden depender de rutas ni del composition root.',
        }],
      }],
    },
  },
  {
    files: [
      'src/features/*/domain/**/*.{ts,tsx}',
      'src/features/*/model/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: [
            '@/app/**',
            '@/bootstrap/**',
            '@/components/**',
            '@/theme/**',
            '@expo/**',
            'expo',
            'expo-*',
            'react',
            'react-native',
            'react-native/**',
          ],
          message: 'Los modelos de dominio deben ser independientes de React, Expo y la capa visual.',
        }],
      }],
    },
  },
]);
