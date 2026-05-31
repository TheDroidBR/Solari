# Plano de Implementação - Presets e Identidades Públicas em Sub-Abas

Este plano descreve o design e implementação de uma nova **Sub-Navegação** dentro da aba de **Rich Presence** no **Solari App**. 

Em vez de apenas um dropdown simples para selecionar identidades, a aba principal de Rich Presence passará a contar com duas sub-abas:
1.  **🎮 Custom Presence (Meu Status)**: O editor manual completo atual do Solari (Formulário, Preview do Discord, Presets Locais e Perfis).
2.  **✨ Public Presets (Catálogo na Nuvem)**: Um catálogo visual premium de presets prontos de jogos e apps populares (Minecraft, VS Code, Valorant, Netflix, etc.) carregados diretamente da internet.

---

## 🛑 User Review Required

> [!IMPORTANT]
> **Sem Fallback de Dados (Conforme Solicitado)**:
> Se o Solari não conseguir buscar os presets públicos online (por falta de internet ou erro do servidor), o catálogo exibirá uma elegante mensagem de erro premium: *"Não foi possível conectar ao catálogo. Verifique sua conexão."* com um botão interativo **"🔄 Tentar Novamente"**. Não haverá base local estática de fallback.

> [!TIP]
> **Ações Rápidas de Alta Experiência (UX)**:
> Cada card no catálogo terá duas opções de clique:
> *   **`⚡ Ativar Status`**: Conecta e ativa o Rich Presence instantaneamente usando o Client ID público e as imagens/textos do preset.
> *   **`✏️ Customizar`**: Copia todos os dados do preset público (textos, imagens, botões e Client ID) para os campos da sub-aba **Custom Presence** e muda o foco para ela automaticamente, permitindo que o usuário faça edições rápidas antes de ativar.

---

## Proposed Changes

Grupo de alterações necessárias por componente.

### 🌐 Locales & Traduções
#### [MODIFY] [pt-BR.json](file:///d:/Itens/Antigravity/Solari%20APP/src/renderer/locales/pt-BR.json) / [en.json](file:///d:/Itens/Antigravity/Solari%20APP/src/renderer/locales/en.json) / [es.json](file:///d:/Itens/Antigravity/Solari%20APP/src/renderer/locales/es.json) / [de.json](file:///d:/Itens/Antigravity/Solari%20APP/src/renderer/locales/de.json)
*   Adicionar chaves para a nova sub-navegação e estados de erro:
    ```json
    "rpcSubTabs": {
        "custom": "Custom Presence",
        "public": "Presets Públicos"
    },
    "publicPresets": {
        "searchPlaceholder": "🔍 Buscar presets públicos...",
        "applyBtn": "⚡ Ativar Status",
        "customizeBtn": "✏️ Customizar",
        "errorTitle": "Não foi possível carregar o catálogo",
        "errorDesc": "Verifique sua conexão com a Internet e tente novamente.",
        "retryBtn": "🔄 Tentar Novamente",
        "loading": "Carregando catálogo premium...",
        "appliedToast": "Preset '{name}' ativado com sucesso!"
    }
    ```

---

### 🎨 Frontend & Interface do Usuário (HTML/CSS)

#### [MODIFY] [index.html](file:///d:/Itens/Antigravity/Solari%20APP/src/renderer/index.html)
*   Injetar as sub-abas no topo de `#rpc-tab` (logo abaixo do banner de onboarding):
    ```html
    <!-- Sub-Abas do RPC -->
    <div class="rpc-sub-tabs-container">
      <button class="rpc-sub-tab-btn active" data-rpc-sub-tab="rpc-custom-presence">
        <span>🎮</span> <span data-i18n="rpcSubTabs.custom">Custom Presence</span>
      </button>
      <button class="rpc-sub-tab-btn" data-rpc-sub-tab="rpc-public-presets">
        <span>✨</span> <span data-i18n="rpcSubTabs.public">Presets Públicos</span>
      </button>
    </div>
    ```
*   Envolver a `.main-grid` atual em uma div `#rpc-custom-presence-content` (conteúdo da sub-aba Custom).
*   Adicionar a nova div de presets públicos `#rpc-public-presets-content` (inicialmente oculta), com barra de pesquisa e o container onde os cards serão renderizados:
    ```html
    <div id="rpc-public-presets-content" class="rpc-sub-tab-content" style="display: none;">
      <div class="public-presets-header">
        <input type="text" id="public-presets-search" class="form-control-premium" placeholder="🔍 Buscar presets públicos..." data-i18n-placeholder="publicPresets.searchPlaceholder">
      </div>
      <div id="public-presets-loading" class="public-presets-loading-state">
        <span class="spinner">⏳</span> <span data-i18n="publicPresets.loading">Carregando catálogo premium...</span>
      </div>
      <div id="public-presets-error" class="public-presets-error-state" style="display: none;">
        <span class="error-icon">📡</span>
        <h3 data-i18n="publicPresets.errorTitle">Não foi possível carregar o catálogo</h3>
        <p data-i18n="publicPresets.errorDesc">Verifique sua conexão com a Internet.</p>
        <button id="retryPublicPresetsBtn" class="btn btn-secondary" data-i18n="publicPresets.retryBtn">🔄 Tentar Novamente</button>
      </div>
      <div id="public-presets-grid" class="public-presets-grid" style="display: none;">
        <!-- Cards renderizados dinamicamente -->
      </div>
    </div>
    ```

#### [MODIFY] [styles.css](file:///d:/Itens/Antigravity/Solari%20APP/src/renderer/styles.css)
*   **RPC Sub-Tabs Styling**: Criar um estilo premium de abas com efeito glassmorphism, bordas arredondadas, fundo levemente translúcido, transição magnética e uma linha neon sob a aba ativa.
*   **Public Presets Grid**: Grid auto-responsivo (`repeat(auto-fill, minmax(280px, 1fr))`) com espaçamento de `15px`.
*   **Cards Premium**: Efeito glassmorphic completo (`backdrop-filter: blur(12px)`), cantos arredondados, leve sombra neon proporcional, cabeçalho dinâmico com a foto do preset, e grupo de botões interativos na base do card com micro-animações de hover.

---

### ⚙️ Lógica do Sistema (JS)

#### [MODIFY] [renderer.js](file:///d:/Itens/Antigravity/Solari%20APP/src/renderer/renderer.js)
*   **Navegação**: Implementar listeners de clique nas sub-abas para alternar a exibição entre `#rpc-custom-presence-content` e `#rpc-public-presets-content` de forma suave.
*   **Carregamento do Catálogo**:
    - Fazer um fetch para a URL dinâmica: `https://raw.githubusercontent.com/TheDroidBR/Solari/main/public-presets.json` (com fallback para GitLab).
    - Se falhar (erro 404, sem rede, timeout): Ocultar o grid/loading, mostrar `#public-presets-error` e logar o erro de forma silenciosa.
*   **Renderização**:
    - Mapear os dados carregados in cards. Cada card exibe a imagem grande, o nome do jogo/app, o subtítulo, o badge do tipo de atividade (Jogando, Ouvindo, etc.) e os dois botões (`Ativar Status` e `Customizar`).
*   **Implementação das Ações**:
    - **Customizar**:
      1.  Localizar a identidade correspondente ao preset. Se não estiver cadastrada localmente, adiciona ela na hora via `add-identity` IPC handler.
      2.  Preencher todos os campos do formulário Custom (`details`, `state`, `largeImageKey`, `largeImageText`, etc.) com os dados do preset público.
      3.  Definir a identidade importada no dropdown `#presetClientId`.
      4.  Chamar `updatePreview()` para atualizar o Preview interativo na hora.
      5.  Mudar a sub-aba ativa para **Custom Presence** automaticamente.
    - **Ativar Status**:
      1.  Localizar a identidade correspondente ao preset. Se não existir localmente, adiciona ela via `add-identity` IPC.
      2.  Construir o payload do activity e enviar para a main process usando `ipcRenderer.send('update-activity', activity)`.
      3.  Exibir um Toast de sucesso e mudar para manual mode.

---

## Verification Plan

### Manual Verification
1.  **Sub-Tab Switcher**: Validar se alternar entre as abas esconde e exibe o conteúdo esperado de forma suave e instantânea.
2.  **Comportamento sem Rede (Sem Fallback)**:
    - Desconectar a rede ou alterar a URL do fetch para um link inexistente.
    - Confirmar que o loading desaparece e a mensagem de erro com o botão "Tentar Novamente" aparece.
    - Clicar em "Tentar Novamente" com a rede ativa e validar se ele recupera o estado e carrega o catálogo com sucesso.
3.  **Fluxo Completo de Customização**:
    - Clicar em "✏️ Customizar" em um card (ex: "Minecraft").
    - Validar se a aba muda de forma automática para "Custom Presence".
    - Verificar se todos os campos (Client ID, Imagens, Botões) foram preenchidos corretamente e o preview do Discord foi atualizado na hora.
4.  **Ativação Instantânea**:
    - Clicar em "⚡ Ativar Status".
    - Verificar se o status no Discord é atualizado com sucesso e o toast aparece na tela.
