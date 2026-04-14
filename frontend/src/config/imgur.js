// Imgur API Configuration
// Para obter seu próprio Client ID, acesse: https://api.imgur.com/oauth2/addclient
// 1. Crie uma conta no Imgur (se não tiver)
// 2. Registre sua aplicação em https://api.imgur.com/oauth2/addclient
// 3. Escolha "OAuth 2 authorization without a callback URL"
// 4. Copie o Client ID e cole abaixo

export const IMGUR_CONFIG = {
  CLIENT_ID: '534f3f0b3be2b2a', // Client ID público para testes
  UPLOAD_URL: 'https://api.imgur.com/3/image',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
};
