# 🎯 REFERÊNCIA RÁPIDA - SISTEMA FREE/PRO

## 🚀 COMEÇAR AGORA

```bash
npm run dev
# Abra: http://localhost:5176
```

---

## ✅ CHECKLIST RÁPIDO

### Instalação ✅
```bash
npm install              # Dependências
cat .env.local           # Verificar chave
npm run dev              # Rodar
```

Esperado: Backend + Frontend roda sem erros

### Primeiro Teste ✅
1. Abra http://localhost:5176
2. Vê "Standard (Free)" selecionado?
3. Upload imagem → Clique Upscale
4. Resultado em ~30s?

Se tudo OK: ✅ SUCESSO!

---

## 📂 ARQUIVOS PRINCIPAIS

| Arquivo | Função |
|---------|--------|
| `App.tsx` | Frontend React |
| `server.ts` | Backend Express |
| `services/geminiService.ts` | Lógica FREE/PRO |
| `.env.local` | Chave protegida |
| `types.d.ts` | Tipos TypeScript |
| `vite.config.ts` | Config (sem expor chave) |

---

## 🔄 FLUXOS

### FREE (Padrão)
```
User → "Standard (Free)" selecionado
    ↓
Upload imagem
    ↓
Backend (chave protegida)
    ↓
Gemini API
    ↓
Resultado
```

### PRO (Opcional)
```
User → "Gemini 3 Pro (Paid)" selecionado
    ↓
"Select Paid API Key" (em aistudio)
    ↓
Upload imagem
    ↓
Gemini API direto (chave do user)
    ↓
Resultado Premium
```

---

## 🛠️ COMMANDS

```bash
npm run dev              # Frontend + Backend
npm run dev:frontend    # Só frontend
npm run dev:server      # Só backend
npm run build           # Build produção
npm start               # Rodar produção
```

---

## 📊 PORTAS

| Serviço | Porta | URL |
|---------|-------|-----|
| Backend | 3001 | http://localhost:3001 |
| Frontend | 5176 | http://localhost:5176 |
| (pode variar) | 516x | Vite escolhe livre |

---

## 🔐 SEGURANÇA

✅ Chave backend: NUNCA exposta
✅ Chave PRO: Vem do user (aistudio)
✅ CORS: Configurado
✅ .gitignore: Protege .env.local

---

## 🧪 TESTES RÁPIDOS

### FREE OK?
```
1. "Standard (Free)" ✅
2. Upload → Upscale
3. Resultado em 30s ✅
4. Sem erros ✅
5. Download funciona ✅
```

### Segurança OK?
```
1. F12 → Console
2. console.log(import.meta.env.VITE_BACKEND_URL)
3. Mostra: http://localhost:3001
4. Chave NÃO aparece ✅
```

### Logs OK?
```
Terminal mostra:
✅ Server initialized
🚀 Server running on
📤 Calling backend upscale
✅ Backend completed
```

---

## 🐛 QUICK FIX

### Porta em uso
```bash
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
npm run dev
```

### Cache issues
```
F12 → DevTools
Ctrl+Shift+Delete (Clear Storage)
Refresh
```

### Build error
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📚 DOCS

| Arquivo | Para Quem |
|---------|-----------|
| README.md | Visão geral |
| QUICK_START.md | Usuários |
| SETUP_FREE_PRO.md | Técnico |
| TEST_CHECKLIST.md | QA |
| IMPLEMENTATION_SUMMARY.md | Resumo |

---

## 💡 DICAS PRO

1. **Development**
   - Use `npm run dev` para hot reload
   - DevTools (F12) para debug

2. **Production**
   - `npm run build` → Deploy `dist/`
   - Backend em Railway/Render
   - Frontend em Vercel/Netlify

3. **Monetização**
   - FREE: você paga, usuários grátis
   - PRO: usuários pagam, você lucra

4. **Escalabilidade**
   - Adicione DB para quotas
   - Cache resultados
   - async processing para grandes imagens

---

## 🎯 MÉTRICA DE SUCESSO

**Seu app está pronto quando:**

- ✅ FREE mode testa sem erros
- ✅ Image compara lado a lado
- ✅ Download funciona
- ✅ Backend logs aparecem
- ✅ Sem chave exposta
- ✅ UI responsiva
- ✅ Zero crashes

---

## 🚀 PRÓXIMOS PASSOS

**Próxima semana:**
- Deploy frontend
- Deploy backend
- Monitorar custos (FREE)
- Adicionar analytics

**Mês que vem:**
- Autenticação de usuários
- Sistema de quotas
- Dashboard admin
- Integração Stripe

**Trimestre:**
- Mobile app
- Batch processing
- API pública
- Marketplace

---

## 📞 HELP

**Algo não funciona?**

1. Verifique logs no terminal
2. F12 Console → Erros?
3. .env.local existe?
4. Portas livres? (`lsof -i :3001`)
5. npm install recente?

**Still stuck?**

- Veja TEST_CHECKLIST.md
- Veja SETUP_FREE_PRO.md
- Restart tudo: Ctrl+C e `npm run dev`

---

## ⏱️ TIMELINE

| Tempo | Ação |
|-------|------|
| 5 min | Instalar & rodar |
| 10 min | Testar FREE |
| 5 min | Validar segurança |
| 20 min | Explorar interface |
| 10 min | Deploy setup |

**Total: ~50 min para go-live**

---

## 🎉 STATUS

```
🟢 GREEN - PRONTO PARA PRODUÇÃO

✅ Backend funciona
✅ Frontend funciona
✅ FREE/PRO separados
✅ Segurança garantida
✅ Documentado
✅ Testado
✅ Pronto para escalar
```

---

**Comande: `npm run dev` e aproveite! 🚀**
