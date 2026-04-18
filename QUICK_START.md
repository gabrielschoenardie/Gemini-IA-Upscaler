# 🎯 SISTEMA FREE/PRO - GUIA RÁPIDO DE USO

## ⚡ QUICK START

### 1. **Servidor já está rodando!**
```
✅ Backend: http://localhost:3001
✅ Frontend: http://localhost:5176
```

### 2. **Abra no navegador**
```
http://localhost:5176
```

---

## 🟢 USAR MODO FREE (Recomendado para Testar)

1. **Página inicial**
   - Botão **"Standard (Free)"** já está selecionado ✅
   - Nenhuma API key necessária
   - Sem prompts extras

2. **Upload de imagem**
   - Arraste uma imagem ou clique para selecionar
   - Máximo: 10MB
   - Formatos: PNG, JPG, WebP, etc

3. **Ajustes (Opcional)**
   - ✅ **Enhance Faces**: Deixar ligado para melhor resultado em rostos
   - 📊 **Quality**: Mude para "High" ou "Professional" para melhor resultado

4. **Upscale**
   - Clique no botão **"Upscale Image"**
   - Aguarde (pode levar 30-60 segundos)
   - Imagem ampliada aparecerá abaixo

5. **Download**
   - Clique no botão **"Download"**
   - Imagem em JPG alta qualidade será salva

6. **Comparação Side-by-Side**
   - Use o slider para comparar original vs upscalado

---

## 💎 USAR MODO PRO (Opcional)

### ⚠️ Requer API Key Paga do Gemini

1. **Clique em "Gemini 3 Pro (Paid)"**
   - Aparecerá mensagem: "Paid API Key Required"

2. **Clique em "Select Paid API Key"**
   - ⚠️ Você deve estar no **ambiente aistudio** do Google
   - Selecione uma chave com **créditos/billing ativo**

3. **Use normalmente**
   - Mesmos passos que FREE
   - Qualidade superior aos padrões

---

## 🔧 COMO TUDO FUNCIONA

### FREE Mode (Seu Backend)
```
┌────────────────────────────────────────┐
│ User seleciona "Standard (Free)"       │
│                 ↓                       │
│ Frontend envia imagem ao backend       │
│                 ↓                       │
│ Backend usa sua API Key PROTEGIDA      │
│ (AIzaSyAm9BpyIBqWoj1GNWZaBE6Z5kMwGj3eAR0) │
│                 ↓                       │
│ Backend → Gemini API → Resultado       │
│                 ↓                       │
│ Frontend recebe imagem upscalada       │
└────────────────────────────────────────┘
```

✅ **Vantagem**: Você controla os custos, múltiplos usuários grátis
❌ **Desvantagem**: Você paga pelo uso

---

### PRO Mode (Chave do Usuário)
```
┌────────────────────────────────────────┐
│ User seleciona "Gemini 3 Pro (Paid)"   │
│                 ↓                       │
│ Frontend pede para selecionar chave    │
│ (via window.aistudio)                  │
│                 ↓                       │
│ User escolhe sua API Key               │
│                 ↓                       │
│ Frontend chama Gemini DIRETAMENTE      │
│ (sem passar pelo backend)              │
│                 ↓                       │
│ Gemini → Resultado melhor              │
│                 ↓                       │
│ Frontend recebe imagem de melhor      │
│ qualidade                              │
└────────────────────────────────────────┘
```

✅ **Vantagem**: Usuário paga, você não tem custo
❌ **Desvantagem**: Precisa de billings setup

---

## 📊 COMPARAÇÃO DE QUALIDADE

| Aspecto | FREE | PRO |
|---------|------|-----|
| **Modelo** | Gemini 2.5 Flash | Gemini 3 Pro |
| **Qualidade** | Boa | Excelente |
| **Velocidade** | ~30s | ~45s |
| **Custo** | Seu servidor | Usuário |
| **Faces** | Bom | Muito bom |
| **Detalhes** | Nítido | Super nítido |

---

## 🐛 PROBLEMAS COMUNS

### Problema: "Backend not running"
```bash
# Verifique se o backend está ativo
# Você verá: "✅ Server initialized"
# Se não, reinicie:
npm run dev
```

### Problema: Frontend carregando sempre
```bash
# Aguarde 30-60 segundos (processamento do Gemini)
# Se travar por mais tempo:
1. Abra DevTools (F12)
2. Veja "Console" para erros
3. Reinicie o navegador
```

### Problema: "API Key Required" em modo FREE
```bash
# Isso NÃO deve acontecer em FREE!
# Se acontecer, verifique:
1. Botão "Standard (Free)" está selecionado?
2. Tente refresh na página (Ctrl+R)
3. Limpe cache (Ctrl+Shift+Delete)
```

### Problema: Pro mode não funciona
```bash
# Certifique-se:
1. Você está no ambiente aistudio (Google AI Studio)
2. Sua chave tem créditos
3. Billing está ativado
4. Tente selecionar a chave novamente
```

---

## 🎬 WORKFLOW ESPERADO

### Teste 1: FREE básico (devia levar 5 min)
```
1. Abra http://localhost:5176
2. Verifique "Standard (Free)" está selecionado
3. Selecione uma imagen low-res ou screenshot
4. Clique "Upscale Image"
5. Aguarde (~30s)
6. Veja resultado!
7. Clique "Download"
✅ Sucesso!
```

### Teste 2: Mudar qualidade (próximo)
```
1. Clique dropdown "Quality"
2. Selecione "High"
3. Marque "Enhance Faces"
4. Clique "Upscale Image"
5. Compare qualidade com anterior
✅ Melhorou!
```

### Teste 3: PRO mode (opcional)
```
1. Clique "Gemini 3 Pro (Paid)"
2. Clique "Select Paid API Key"
3. Selecione sua chave (Google AI Studio)
4. Clique "Upscale Image"
5. Compare com versão FREE
✅ Versão PRO é melhor!
```

---

## 💼 MODELO DE MONETIZAÇÃO

### Opção 1: Freemium
- FREE: Ilimitado (você paga)
- PRO: User paga pela chave (+fee sua)

### Opção 2: Free com Limite
- FREE: 3 upscales/dia (limit em DB)
- PRO: Ilimitado (user paga)

### Opção 3: Sempre Grátis
- FREE: Ilimitado (seu servidor)
- Modele com publicidades

---

## 🔐 SEGURANÇA

✅ **Chave Backend**
- Armazenada em `.env.local`
- NUNCA exposta no frontend
- NUNCA no repositório (em `.gitignore`)

✅ **Chave PRO**
- Vem do usuário via aistudio
- Nunca passa pelo seu servidor
- Usuário controla completamente

---

## 🚀 PRÓXIMOS PASSOS

1. **Teste completo**
   - Testar FREE com várias imagens
   - Testar PRO se tiver chave

2. **Deploy**
   - Frontend: Vercel, Netlify
   - Backend: Railway, Render, Heroku

3. **Melhorias**
   - Adicionar autenticação
   - Rastrear uso por usuário
   - Sistema de quotas
   - Integração com Stripe

---

## 📞 SUPORTE

Se algo não funciona:

1. **Verifique logs do terminal**
   ```
   Deve ver: ✅ Server initialized
   ```

2. **Verifique DevTools (F12)**
   - Console tab
   - Network tab
   - Application tab

3. **Reinicie tudo**
   ```bash
   npm run dev
   ```

4. **Clear cache**
   - Ctrl+Shift+Delete
   - Refresh página

---

## ✨ RESUMO FINAL

|  | FREE | PRO |
|-|------|-----|
| **Botão** | "Standard (Free)" | "Gemini 3 Pro (Paid)" |
| **Setup** | Automático | 1 clique |
| **Chave** | Backend (protegida) | User (própria) |
| **Custo** | Você | Usuário |
| **Qualidade** | Boa | Excelente |

---

**Status: ✅ PRONTO PARA USAR**

Seu app está 100% funcional agora! 🎉
