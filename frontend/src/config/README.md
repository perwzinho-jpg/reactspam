# Configuração do Imgur API

Este diretório contém as configurações para integração com a API do Imgur para upload de imagens de perfil.

## Como obter seu próprio Client ID do Imgur

O Client ID atual (`534f3f0b3be2b2a`) é público e compartilhado, podendo ter limitações de rate limit. Para produção, é recomendado criar o seu próprio.

### Passo a Passo:

1. **Crie uma conta no Imgur** (se ainda não tiver)
   - Acesse: https://imgur.com/
   - Clique em "Sign up" e crie sua conta

2. **Registre sua aplicação**
   - Acesse: https://api.imgur.com/oauth2/addclient
   - Faça login com sua conta do Imgur

3. **Preencha o formulário de registro:**
   - **Application name**: Nome da sua aplicação (ex: "ReactZapi Profile Upload")
   - **Authorization type**: Selecione "OAuth 2 authorization without a callback URL"
   - **Email**: Seu email
   - **Description**: Breve descrição (ex: "Profile picture upload for ReactZapi")

4. **Copie o Client ID**
   - Após registrar, você receberá um **Client ID** e um **Client Secret**
   - Copie apenas o **Client ID**

5. **Atualize a configuração**
   - Abra o arquivo `imgur.js` neste diretório
   - Substitua o valor de `CLIENT_ID` pelo seu próprio Client ID:
   ```javascript
   export const IMGUR_CONFIG = {
     CLIENT_ID: 'SEU_CLIENT_ID_AQUI',
     // ... resto da configuração
   };
   ```

## Limites da API do Imgur

### Rate Limits (com Client ID):
- **12,500 uploads** por dia
- **1,250 uploads** por hora
- **50 uploads** por minuto

### Limites sem autenticação:
- **1,250 uploads** por dia

### Limites de arquivo:
- Tamanho máximo: **10 MB**
- Formatos suportados: JPEG, PNG, GIF, WebP
- Dimensões máximas: **20,000 x 20,000 pixels**

## Segurança

⚠️ **IMPORTANTE**: O Client ID pode ser exposto no frontend sem problemas de segurança, pois ele apenas identifica sua aplicação. O Client Secret **NUNCA** deve ser exposto no frontend.

## Troubleshooting

### Erro 429 (Too Many Requests)
- Você excedeu o rate limit
- Aguarde alguns minutos ou horas dependendo do limite
- Considere implementar um sistema de cache

### Erro 403 (Forbidden)
- Client ID inválido ou expirado
- Verifique se copiou o Client ID correto

### Erro 400 (Bad Request)
- Arquivo muito grande (> 10MB)
- Formato de arquivo não suportado
- Imagem corrompida

## Recursos Adicionais

- Documentação oficial: https://apidocs.imgur.com/
- Dashboard de aplicações: https://imgur.com/account/settings/apps
- Suporte: https://help.imgur.com/

## Alternativas ao Imgur

Se preferir outras soluções de hospedagem de imagens:

1. **Cloudinary**: https://cloudinary.com/
2. **ImageKit**: https://imagekit.io/
3. **AWS S3**: https://aws.amazon.com/s3/
4. **Uploadcare**: https://uploadcare.com/

Cada alternativa requer sua própria implementação e configuração.
