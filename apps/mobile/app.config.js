export default ({ config }) => ({
  ...config,
  name: 'Quiz Rush',
  slug: 'quiz-rush',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'quizrush',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.quizrush.app',
  },
  android: {
    package: 'com.quizrush.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api',
    wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000/duel',
  },
});
