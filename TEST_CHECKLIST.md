# ✅ CHECKLIST DE TESTES - SISTEMA LIVRE/PRO

## 📋 PRÉ-TESTES

- [ ] Backend rodando em `http://localhost:3001`
  - Terminal deve mostrar: ✅ Server initialized with Gemini API Key
- [ ] Frontend rodando em `http://localhost:5176`
  - Browser deve carregar a página

---

## 🟢 TESTE 1: MODO FREE (Padrão)

### Setup
- [ ] Abra `http://localhost:5176`
- [ ] Verifique: Botão **"Standard (Free)"** está selecionado (em azul)
- [ ] Verifique: Não há prompt de "API Key Required"

### Upload
- [ ] Selecione uma imagem low-res ou screenshot
- [ ] Mensagem: "Drop your image here or browse"
- [ ] Imagem carrega com preview

### Configurações
- [ ] Checkbox "Enhance Faces" está marcado
- [ ] Dropdown "Quality" mostra: "Standard", "High", "Professional"
- [ ] Deixe com padrões por enquanto

### Upscale
- [ ] Clique em **"Upscale Image"** (botão com ícone de sparkles)
- [ ] Botão fica cinzento com loading spinner
- [ ] Terminal mostra: `📤 Calling backend upscale (FREE tier)...`
- [ ] Aguarde 30-60 segundos (varia pelo tamanho)
- [ ] Terminal mostra: `✅ Backend upscale completed`

### Resultado
- [ ] Image upscalada aparece abaixo com bom tamanho
- [ ] Qualidade visual melhorou (menos pixelado)
- [ ] Botão "Download" aparece e funciona
- [ ] Imagem baixa em JPG alta qualidade

### Comparação
- [ ] Slider aparece para comparar original vs upscalado
- [ ] Deslize o slider funcionando
- [ ] Diferença visual é clara

### Reset
- [ ] Clique em **"Reset"**
- [ ] Interface volta ao estado inicial
- [ ] Imagems desaparecem

---

## 🟣 TESTE 2: MUDANDO QUALIDADE (FREE)

### Setup
- [ ] Selecione nova imagem
- [ ] Clique para expandir "Quality" dropdown

### Test Standard (padrão)
- [ ] Selecione "Standard"
- [ ] Clique "Upscale Image"
- [ ] Anote o tempo (~30s)
- [ ] Anote a qualidade do resultado

### Test High
- [ ] Click Reset
- [ ] Upload mesma imagem
- [ ] Selecione "High" em Quality
- [ ] Clique "Upscale Image"
- [ ] Compare com Standard (deve ser melhor)

### Test Professional
- [ ] Click Reset
- [ ] Upload mesma imagem
- [ ] Selecione "Professional" em Quality
- [ ] Marque "Enhance Faces"
- [ ] Clique "Upscale Image"
- [ ] Tempo pode ser ~45s
- [ ] Resultado deve ser o melhor

---

## 💎 TESTE 3: MODO PRO (Requer Setup Especial)

### ⚠️ PRÉ-REQUISITOS
- [ ] Você está no ambiente **Google AI Studio**
- [ ] Você tem uma **API key paga**
- [ ] Sua chave tem **créditos/billing ativo**

### Mudança de Modo
- [ ] Clique em botão **"Gemini 3 Pro (Paid)"**
- [ ] Vê uma mensagem: "Paid API Key Required for Pro Tier"
- [ ] Botão é visível: "Select Paid API Key"
- [ ] Estilo muda para roxo/índigo

### Seleção de Key
- [ ] Clique **"Select Paid API Key"**
- [ ] Se estiver em aistudio, popup aparece para selecionar
- [ ] Se não aparecer, você pode não estar em aistudio (skip este teste)

### Upscale PRO
- [ ] Selecione uma imagem
- [ ] Clique "Upscale Image"
- [ ] Terminal mostra: `📤 Calling Gemini API directly (PRO tier)...`
- [ ] Tempo pode ser ~45s (um pouco mais lento que FREE)
- [ ] Terminal mostra: `✅ PRO upscale completed`
- [ ] Resultado PRO deve ser visualmente melhor que FREE

### Comparação FREE vs PRO
- [ ] Upload mesma imagem
- [ ] Teste em Standard (FREE)
- [ ] Anotação mental da qualidade
- [ ] Reset + troca para "Gemini 3 Pro (Paid)"
- [ ] Mesma imagem em "Professional" quality PRO
- [ ] Compare: PRO deve ser notavelmente melhor

---

## 🔍 TESTE 4: VALIDAÇÃO DE SEGURANÇA

### Backend Key Protegida
- [ ] Abra DevTools (F12 → Console)
- [ ] Digite: `console.log(import.meta.env.VITE_BACKEND_URL)`
- [ ] Mostra apenas: `http://localhost:3001`
- [ ] ✅ API key NÃO está exposta

- [ ] Digite: `console.log(window.GEMINI_API_KEY)` ou similar
- [ ] Retorna: `undefined` ou undefined
- [ ] ✅ API key do backend NÃO está no frontend

### Backend Recebendo Requests
- [ ] Terminal do backend deve mostrar:
  ```
  POST /api/upscale
  ```
- [ ] Quando upscale FREE for executado

---

## 🐛 TESTE 5: TRATAMENTO DE ERROS

### Imagem Grande
- [ ] Tente enviar arquivo > 10MB
- [ ] Deve ver erro: "File size exceeds the limit"
- [ ] Arquivo não é processado
- [ ] ✅ Validação funciona

### Reset Após Erro
- [ ] Clique na imagem grande again
- [ ] Verifique se campo fica limpo
- [ ] Clique Reset
- [ ] Interface volta ao normal

### Timeout (Opcional)
- [ ] Se backend estiver slow/offline:
- [ ] Aguarde > 60 segundos
- [ ] Deve ver erro: "request timed out"
- [ ] ✅ Timeout handling funciona

---

## 🎬 TESTE 6: WORKFLOW COMPLETO

### Cenário Realista
```
1. [ ] Abra app → "Standard (Free)" padrão
2. [ ] Upload imagem screenshot low-res
3. [ ] Clique "Upscale Image"
4. [ ] Aguarde resultado
5. [ ] Veja melhoria visual ✅
6. [ ] Clique "Download"
7. [ ] Arquivo salva como test-upscaled.jpg ✅
8. [ ] Deslize slider comparação
9. [ ] Reset
10. [ ] Mude para "Professional" quality
11. [ ] Upload mesma imagem
12. [ ] Compare qualidade (melhor)
13. [ ] Download
14. [ ] 2 arquivos salvos com melhorias progressivas ✅
```

---

## 📊 TESTE 7: INTERFACE & UX

### Layout Responsivo
- [ ] Página em desktop (full width)
- [ ] Botões bem espaçados
- [ ] Imagens centralizado
- [ ] Sem overflow/scroll horizontal

### Botões & Interações
- [ ] "Standard (Free)" → selecionável
- [ ] "Gemini 3 Pro (Paid)" → selecionável
- [ ] Cores mudam apropriadamente
- [ ] Hover effects funcionam
- [ ] Cliques responsivos

### Loading State
- [ ] Durante upscale:
  - [ ] Botão fica disabled (cinzento)
  - [ ] Spinner aparece
  - [ ] Mensagem de status clara
- [ ] Após conclusão:
  - [ ] Botão volta a normal
  - [ ] Spinner desaparece

### Mensagens
- [ ] "Drop your image here or browse" visível
- [ ] "Maximum file size: 10MB" mostra
- [ ] Erros em vermelho
- [ ] Sucessos em verde

---

## 📱 TESTE 8: TERMINAL LOGS

### Backend deve mostrar:
```
✅ Server initialized with Gemini API Key
🚀 Server running on http://localhost:3001
```

### Cada upscale FREE mostra:
```
📤 Calling backend upscale (FREE tier)...
✅ Backend upscale completed
```

### Cada upscale PRO mostra:
```
📤 Calling Gemini API directly (PRO tier)...
✅ PRO upscale completed
```

### Sem erros de TypeScript
- [ ] Terminal não mostra erros de compilação
- [ ] Se mostrar erros tipo safety: ignore (são warnings)

---

## 🎯 TESTE FINAL: RESUMO

### ✅ Todos os testes passaram?

| Feature | FREE | PRO |
|---------|------|-----|
| [ ] Upload | ✅ | ✅ |
| [ ] Upscale | ✅ | ✅ |
| [ ] Download | ✅ | ✅ |
| [ ] Quality Levels | ✅ | ✅ |
| [ ] Comparação | ✅ | ✅ |
| [ ] Reset | ✅ | ✅ |
| [ ] UI | ✅ | ✅ |
| [ ] Segurança | ✅ | ✅ |

---

## 🚀 SE TUDO PASSOU

✅ **SISTEMA 100% FUNCIONAL**

Você pode agora:
- ✅ Usar com confiança
- ✅ Testar com mais usuarilos
- ✅ Fazer deploy para produção
- ✅ Iniciar monetização

---

## ⚠️ SE ALGO FALHOU

1. **Restart tudo**
   ```bash
   Ctrl+C (matar npm run dev)
   npm run dev (reiniciar)
   ```

2. **Clear browser cache**
   ```
   F12 → Storage → Clear All
   ```

3. **Check `.env.local`**
   ```bash
   cat .env.local
   ```
   Deve ter: `GEMINI_API_KEY=AIzaSyAm9BpyIBqWoj1GNWZaBE6Z5kMwGj3eAR0`

4. **Check backend porta**
   ```bash
   lsof -i :3001
   ```

---

## 📞 DOCUMENTAÇÃO ASSOCIADA

- 📖 `QUICK_START.md` - Guia rápido
- 🏗️ `SETUP_FREE_PRO.md` - Setup técnico
- 📝 `IMPLEMENTATION_SUMMARY.md` - Resumo
- 📋 `Este arquivo` - Checklist de testes

---

**Status: ✅ PRONTO PARA VALIDAÇÃO**

Siga o checklist acima para validar seu sistema!
