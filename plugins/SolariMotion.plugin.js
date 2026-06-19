/**
 * @name SolariMotion
 * @author TheDroid
 * @authorLink https://solarirpc.com
 * @description The most advanced animation system for Discord — 22 UI categories, 28 animation types, Stagger system, Global Intensity, visual Cubic-Bézier editor, Live DOM Preview. Powered by Solari.
 * @version 1.0.2
 * @source https://github.com/TheDroidBR/Solari
 * @website https://solarirpc.com
 * @updateUrl https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/SolariMotion.plugin.js
 */

module.exports = class SolariMotion {

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════

    static VERSION = '1.0.2';
    static CONFIG_VERSION = 2;
    static ID = 'SolariMotion';

    // Categories that support item-level stagger (observer-driven lists)
    static STAGGER_CATS = new Set(['messages', 'reactions', 'dmList', 'searchResults', 'memberList']);

    static EASING_MAP = {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        snappy: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out': 'ease-out',
        'ease-in-out': 'ease-in-out',
        'ease-in': 'ease-in',
        ease: 'ease',
        linear: 'linear',
        custom: null, // resolved via cat.customEasing
    };

    static EASING_LABELS = {
        smooth: 'Smooth (Material)',
        snappy: 'Snappy',
        bounce: 'Bouncy',
        elastic: 'Elastic',
        'ease-out': 'Ease Out',
        'ease-in-out': 'Ease In-Out',
        'ease-in': 'Ease In',
        ease: 'Ease',
        linear: 'Linear',
        custom: 'Custom Curve ✏️',
    };

    static ANIMATION_LABELS = {
        none: 'None',
        fade: 'Fade',
        glide: 'Glide ✨',
        rise: 'Rise',
        float: 'Float',
        'slide-up': 'Slide Up',
        'slide-down': 'Slide Down',
        'slide-left': 'Slide Left',
        'slide-right': 'Slide Right',
        scale: 'Scale In',
        'scale-up': 'Scale Down',
        pop: 'Pop',
        spring: 'Spring 🌱',
        bounce: 'Bounce 🎾',
        elastic: 'Elastic',
        'zoom-bounce': 'Zoom Bounce',
        snap: 'Snap',
        'blur-in': 'Blur In',
        'flip-x': 'Flip X',
        'flip-y': 'Flip Y',
        'rotate-in': 'Rotate In',
        swing: 'Swing',
        'wipe-right': 'Wipe →',
        'wipe-up': 'Wipe ↑',
        'clip-circle': 'Circle Reveal',
        morph: 'Morph',
        gravity: 'Gravity',
        pendulum: 'Pendulum',
    };

    static CATEGORY_GROUPS = {
        all: null,
        navigation: ['channelSwitch', 'serverSwitch', 'settings'],
        overlays: ['contextMenu', 'tooltips', 'modals', 'userPopout', 'emojiPicker', 'autoComplete', 'imageViewer', 'callOverlay'],
        content: ['messages', 'reactions', 'uploadPreview'],
        server: ['memberList', 'voiceIndicator', 'dmList', 'serverFolders', 'threadPanel', 'searchResults', 'inbox', 'appDirectory'],
    };

    static CATEGORY_META = {
        channelSwitch: { label: 'Channel Switch', icon: '#️⃣', desc: 'Navigating between channels and DMs.', group: 'navigation' },
        serverSwitch: { label: 'Server Switch', icon: '🌐', desc: 'Switching between servers.', group: 'navigation' },
        settings: { label: 'Settings Panels', icon: '⚙️', desc: 'Opening or switching settings pages.', group: 'navigation' },
        contextMenu: { label: 'Context Menus', icon: '📋', desc: 'Right-click context menus.', group: 'overlays' },
        tooltips: { label: 'Tooltips', icon: '💡', desc: 'Hover tooltips across the UI.', group: 'overlays' },
        modals: { label: 'Modals & Pop-ups', icon: '🔲', desc: 'Dialog boxes and pop-up windows.', group: 'overlays' },
        userPopout: { label: 'User Popout', icon: '👤', desc: 'Profile cards when clicking an avatar.', group: 'overlays' },
        emojiPicker: { label: 'Emoji Picker', icon: '😄', desc: 'Emoji, sticker, and GIF picker.', group: 'overlays' },
        autoComplete: { label: 'Autocomplete', icon: '⌨️', desc: '@mention, #channel, :emoji: suggestions.', group: 'overlays' },
        imageViewer: { label: 'Image Viewer', icon: '🖼️', desc: 'Lightbox when opening images.', group: 'overlays' },
        callOverlay: { label: 'Call Overlay', icon: '📞', desc: 'Controls and UI during voice/video calls.', group: 'overlays' },
        messages: { label: 'New Messages', icon: '✉️', desc: 'Each new message appearing in chat.', group: 'content' },
        reactions: { label: 'Reactions', icon: '❤️', desc: 'Emoji reactions appearing on messages.', group: 'content' },
        uploadPreview: { label: 'Upload Preview', icon: '📎', desc: 'File/image preview before sending.', group: 'content' },
        memberList: { label: 'Member List', icon: '👥', desc: 'The server member list panel.', group: 'server' },
        voiceIndicator: { label: 'Voice Indicators', icon: '🎙️', desc: 'Speaking indicators in voice channels.', group: 'server' },
        dmList: { label: 'DM List', icon: '📩', desc: 'Direct message conversations in sidebar.', group: 'server' },
        serverFolders: { label: 'Server Folders', icon: '📁', desc: 'Expand/collapse server folder groups.', group: 'server' },
        threadPanel: { label: 'Thread Panel', icon: '🧵', desc: 'Thread sidebar opening and closing.', group: 'server' },
        searchResults: { label: 'Search Results', icon: '🔍', desc: 'Search result items appearing.', group: 'server' },
        inbox: { label: 'Inbox', icon: '📬', desc: 'Mentions and notification panel.', group: 'server' },
        appDirectory: { label: 'App Directory', icon: '🔧', desc: 'App directory and browse channels panel.', group: 'server' },
    };

    static STRINGS = {
        en: {
            header_subtitle: "The most advanced animation system for Discord",
            stat_animated: "Animated this session",
            stat_active: "Categories active",
            stat_intensity: "Intensity",
            stat_preset: "Active preset",
            sec_intensity: "Global Intensity",
            label_subtle: "Subtle",
            label_normal: "Normal",
            label_dramatic: "Dramatic",
            sec_presets: "Quick Presets",
            preset_sub_fluid: "Apple-style",
            preset_sub_snappy: "Fast & crisp",
            preset_sub_bounce: "Elastic fun",
            preset_sub_minimal: "Fade only",
            preset_sub_off: "No animations",
            preset_sub_cinematic: "Film reveals",
            preset_sub_jelly: "Wobbly & fun",
            preset_sub_gravity: "Physics drop",
            preset_sub_glass: "Blur & morph",
            preset_sub_retro: "Flip & rotate",
            preset_sub_zen: "Ultra slow",
            preset_sub_sharp: "Instant crisp",
            preset_sub_cascade: "Stagger all",
            preset_sub_pendulum: "Organic swing",
            toggle_perf_label: "Performance Mode",
            toggle_perf_sub: "Caps all durations to 100ms",
            toggle_fps_label: "FPS Protection",
            toggle_fps_sub: "Pauses animations below 30fps",
            toggle_motion_label: "Respect Reduced Motion",
            toggle_motion_sub: "OS accessibility preference",
            btn_export: "📋 Export Config",
            btn_copied: "✅ Copied!",
            btn_import: "📥 Import Config",
            btn_reset: "🔄 Reset All",
            placeholder_import: "Paste your config JSON here...",
            btn_apply: "Apply",
            confirm_reset: "Reset all SolariMotion settings to defaults?",
            toast_copy_error: "Could not copy to clipboard.",
            toast_invalid_json: "Invalid config JSON.",
            sec_categories: "Animation Categories",
            placeholder_search: "🔍 Search categories...",
            chip_all: "All",
            chip_nav: "🧭 Nav",
            chip_overlays: "🔲 Overlays",
            chip_content: "💬 Content",
            chip_server: "🌐 Server",

            // Category meta translations (Labels & descriptions)
            cat_channelSwitch_label: "Channel Switch",
            cat_channelSwitch_desc: "Navigating between channels and DMs.",
            cat_serverSwitch_label: "Server Switch",
            cat_serverSwitch_desc: "Switching between servers.",
            cat_settings_label: "Settings Panels",
            cat_settings_desc: "Opening or switching settings pages.",
            cat_contextMenu_label: "Context Menus",
            cat_contextMenu_desc: "Right-click context menus.",
            cat_tooltips_label: "Tooltips",
            cat_tooltips_desc: "Hover tooltips across the UI.",
            cat_modals_label: "Modals & Pop-ups",
            cat_modals_desc: "Dialog boxes and pop-up windows.",
            cat_userPopout_label: "User Popout",
            cat_userPopout_desc: "Profile cards when clicking an avatar.",
            cat_emojiPicker_label: "Emoji Picker",
            cat_emojiPicker_desc: "Emoji, sticker, and GIF picker.",
            cat_autoComplete_label: "Autocomplete",
            cat_autoComplete_desc: "@mention, #channel, :emoji: suggestions.",
            cat_imageViewer_label: "Image Viewer",
            cat_imageViewer_desc: "Lightbox when opening images.",
            cat_callOverlay_label: "Call Overlay",
            cat_callOverlay_desc: "Controls and UI during voice/video calls.",
            cat_messages_label: "New Messages",
            cat_messages_desc: "Each new message appearing in chat.",
            cat_reactions_label: "Reactions",
            cat_reactions_desc: "Emoji reactions appearing on messages.",
            cat_uploadPreview_label: "Upload Preview",
            cat_uploadPreview_desc: "File/image preview before sending.",
            cat_memberList_label: "Member List",
            cat_memberList_desc: "The server member list panel.",
            cat_voiceIndicator_label: "Voice Indicators",
            cat_voiceIndicator_desc: "Speaking indicators in voice channels.",
            cat_dmList_label: "DM List",
            cat_dmList_desc: "Direct message conversations in sidebar.",
            cat_serverFolders_label: "Server Folders",
            cat_serverFolders_desc: "Expand/collapse server folder groups.",
            cat_threadPanel_label: "Thread Panel",
            cat_threadPanel_desc: "Thread sidebar opening and closing.",
            cat_searchResults_label: "Search Results",
            cat_searchResults_desc: "Search result items appearing.",
            cat_inbox_label: "Inbox",
            cat_inbox_desc: "Mentions and notification panel.",
            cat_appDirectory_label: "App Directory",
            cat_appDirectory_desc: "App directory and browse channels panel.",

            // Category detail controls
            field_animation: "Animation",
            field_easing: "Easing",
            field_duration: "Duration",
            field_delay: "Delay per item",
            field_max_items: "Max items",
            field_stagger_title: "✦ Stagger Effect",
            field_stagger_sub: "Items animate in cascading sequence",
            btn_preview: "▶  Live Preview",
            preview_title: "Preview",
            preview_dismiss: "Click anywhere to dismiss",
            preview_mock_text: "This is how your animation looks! ✨",
            updateTitle: 'Update Available',
            updateDesc: 'A new version of {name} is available!',
            currentVersion: 'Current Version',
            newVersion: 'New Version',
            updateAction: 'Update Now',
            updateLater: 'Later',
            updateNotice: 'The plugin will be updated automatically and reloaded instantly in the background.',
            updateSuccess: 'Updated to v{version}!',
            changelogTitle: "What's New"
        },
        pt: {
            header_subtitle: "O sistema de animações mais avançado para o Discord",
            stat_animated: "Animado nesta sessão",
            stat_active: "Categorias ativas",
            stat_intensity: "Intensidade",
            stat_preset: "Preset ativo",
            sec_intensity: "Intensidade Global",
            label_subtle: "Sutil",
            label_normal: "Normal",
            label_dramatic: "Dramático",
            sec_presets: "Presets Rápidos",
            preset_sub_fluid: "Apple-style",
            preset_sub_snappy: "Fast & crisp",
            preset_sub_bounce: "Elastic fun",
            preset_sub_minimal: "Fade only",
            preset_sub_off: "No animations",
            preset_sub_cinematic: "Film reveals",
            preset_sub_jelly: "Wobbly & fun",
            preset_sub_gravity: "Physics drop",
            preset_sub_glass: "Blur & morph",
            preset_sub_retro: "Flip & rotate",
            preset_sub_zen: "Ultra slow",
            preset_sub_sharp: "Instant crisp",
            preset_sub_cascade: "Stagger all",
            preset_sub_pendulum: "Organic swing",
            toggle_perf_label: "Modo Performance",
            toggle_perf_sub: "Limita todas as durações a 100ms",
            toggle_fps_label: "Proteção de FPS",
            toggle_fps_sub: "Pausa animações abaixo de 30fps",
            toggle_motion_label: "Respeitar Movimento Reduzido",
            toggle_motion_sub: "Preferência de acessibilidade do SO",
            btn_export: "📋 Exportar Config",
            btn_copied: "✅ Copiado!",
            btn_import: "📥 Importar Config",
            btn_reset: "🔄 Redefinir Tudo",
            placeholder_import: "Cole o seu JSON de configuração aqui...",
            btn_apply: "Aplicar",
            confirm_reset: "Redefinir todas as configurações do SolariMotion para os padrões?",
            toast_copy_error: "Não foi possível copiar para a área de transferência.",
            toast_invalid_json: "JSON de configuração inválido.",
            sec_categories: "Categorias de Animação",
            placeholder_search: "🔍 Buscar categorias...",
            chip_all: "Tudo",
            chip_nav: "🧭 Nav",
            chip_overlays: "🔲 Overlays",
            chip_content: "💬 Conteúdo",
            chip_server: "🌐 Servidor",

            // Category meta translations (Labels & descriptions)
            cat_channelSwitch_label: "Channel Switch",
            cat_channelSwitch_desc: "Navegação entre canais e DMs.",
            cat_serverSwitch_label: "Server Switch",
            cat_serverSwitch_desc: "Troca entre servidores.",
            cat_settings_label: "Settings Panels",
            cat_settings_desc: "Abrir ou alternar páginas de configuração.",
            cat_contextMenu_label: "Context Menus",
            cat_contextMenu_desc: "Menus de contexto do clique direito.",
            cat_tooltips_label: "Tooltips",
            cat_tooltips_desc: "Dicas flutuantes ao passar o mouse.",
            cat_modals_label: "Modals & Pop-ups",
            cat_modals_desc: "Caixas de diálogo e janelas pop-up.",
            cat_userPopout_label: "User Popout",
            cat_userPopout_desc: "Cartões de perfil ao clicar em um avatar.",
            cat_emojiPicker_label: "Emoji Picker",
            cat_emojiPicker_desc: "Seletor de emojis, figurinhas e GIFs.",
            cat_autoComplete_label: "Autocomplete",
            cat_autoComplete_desc: "Sugestões de @menção, #canal, :emoji:.",
            cat_imageViewer_label: "Image Viewer",
            cat_imageViewer_desc: "Visualizador ao abrir imagens.",
            cat_callOverlay_label: "Call Overlay",
            cat_callOverlay_desc: "Controles e UI durante chamadas de voz/vídeo.",
            cat_messages_label: "New Messages",
            cat_messages_desc: "Cada nova mensagem aparecendo no chat.",
            cat_reactions_label: "Reactions",
            cat_reactions_desc: "Reações de emojis aparecendo nas mensagens.",
            cat_uploadPreview_label: "Upload Preview",
            cat_uploadPreview_desc: "Visualização de arquivos/imagens antes de enviar.",
            cat_memberList_label: "Member List",
            cat_memberList_desc: "O painel da lista de membros do servidor.",
            cat_voiceIndicator_label: "Voice Indicators",
            cat_voiceIndicator_desc: "Indicadores de fala nos canais de voz.",
            cat_dmList_label: "DM List",
            cat_dmList_desc: "Conversas de mensagens diretas na barra lateral.",
            cat_serverFolders_label: "Server Folders",
            cat_serverFolders_desc: "Expandir/recolher grupos de pastas de servidores.",
            cat_threadPanel_label: "Thread Panel",
            cat_threadPanel_desc: "Abertura e fechamento da barra lateral de threads.",
            cat_searchResults_label: "Search Results",
            cat_searchResults_desc: "Itens dos resultados de busca aparecendo.",
            cat_inbox_label: "Inbox",
            cat_inbox_desc: "Painel de menções e notificações.",
            cat_appDirectory_label: "App Directory",
            cat_appDirectory_desc: "Diretório de aplicativos e painel de navegar canais.",

            // Category detail controls (Keep Animation/Easing/etc. in English as requested)
            field_animation: "Animation",
            field_easing: "Easing",
            field_duration: "Duration",
            field_delay: "Delay per item",
            field_max_items: "Max items",
            field_stagger_title: "✦ Stagger Effect",
            field_stagger_sub: "Items animate in cascading sequence",
            btn_preview: "▶  Live Preview",
            preview_title: "Preview",
            preview_dismiss: "Clique em qualquer lugar para fechar",
            preview_mock_text: "É assim que sua animação se parece! ✨",
            updateTitle: 'Atualização Disponível',
            updateDesc: 'Uma nova versão do {name} está disponível!',
            currentVersion: 'Versão Atual',
            newVersion: 'Nova Versão',
            updateAction: 'Atualizar Agora',
            updateLater: 'Depois',
            updateNotice: 'O plugin será atualizado automaticamente e recarregado em segundo plano de forma instantânea.',
            updateSuccess: 'Atualizado para v{version}!',
            changelogTitle: 'O que há de novo'
        },
        es: {
            header_subtitle: "El sistema de animaciones más avanzado para Discord",
            stat_animated: "Animado en esta sesión",
            stat_active: "Categorías activas",
            stat_intensity: "Intensidad",
            stat_preset: "Preset activo",
            sec_intensity: "Intensidad Global",
            label_subtle: "Sutil",
            label_normal: "Normal",
            label_dramatic: "Dramático",
            sec_presets: "Presets Rápidos",
            preset_sub_fluid: "Apple-style",
            preset_sub_snappy: "Rápido y nítido",
            preset_sub_bounce: "Diversión elástica",
            preset_sub_minimal: "Solo fundido",
            preset_sub_off: "Sin animaciones",
            preset_sub_cinematic: "Revelados de cine",
            preset_sub_jelly: "Gelatina wobbly",
            preset_sub_gravity: "Caída física",
            preset_sub_glass: "Desenfoque y morph",
            preset_sub_retro: "Giro y rotación",
            preset_sub_zen: "Ultra lento",
            preset_sub_sharp: "Nítido instantáneo",
            preset_sub_cascade: "Stagger en todo",
            preset_sub_pendulum: "Balanceo orgánico",
            toggle_perf_label: "Modo Rendimiento",
            toggle_perf_sub: "Limita todas las duraciones a 100ms",
            toggle_fps_label: "Protección FPS",
            toggle_fps_sub: "Pausa las animaciones por debajo de 30fps",
            toggle_motion_label: "Respetar Movimiento Reducido",
            toggle_motion_sub: "Preferencia de accesibilidad del SO",
            btn_export: "📋 Exportar Config",
            btn_copied: "✅ ¡Copiado!",
            btn_import: "📥 Importar Config",
            btn_reset: "🔄 Restablecer Todo",
            placeholder_import: "Pega tu JSON de configuración aquí...",
            btn_apply: "Aplicar",
            confirm_reset: "¿Restablecer todos los ajustes de SolariMotion a los valores predeterminados?",
            toast_copy_error: "No se pudo copiar al portapapeles.",
            toast_invalid_json: "JSON de configuración no válido.",
            sec_categories: "Categorías de Animación",
            placeholder_search: "🔍 Buscar categorías...",
            chip_all: "Todo",
            chip_nav: "🧭 Nav",
            chip_overlays: "🔲 Overlays",
            chip_content: "💬 Contenido",
            chip_server: "🌐 Servidor",
            cat_channelSwitch_label: "Cambio de Canal",
            cat_channelSwitch_desc: "Navegación entre canales y DMs.",
            cat_serverSwitch_label: "Cambio de Servidor",
            cat_serverSwitch_desc: "Cambiar entre servidores.",
            cat_settings_label: "Paneles de Ajustes",
            cat_settings_desc: "Abrir o cambiar páginas de ajustes.",
            cat_contextMenu_label: "Menús de Contexto",
            cat_contextMenu_desc: "Menús de clic derecho.",
            cat_tooltips_label: "Tooltips",
            cat_tooltips_desc: "Dicas flotantes al pasar el ratón.",
            cat_modals_label: "Modales y Pop-ups",
            cat_modals_desc: "Cajas de diálogo y ventanas pop-up.",
            cat_userPopout_label: "Popout de Usuario",
            cat_userPopout_desc: "Tarjetas de perfil al hacer clic en un avatar.",
            cat_emojiPicker_label: "Seletor de Emojis",
            cat_emojiPicker_desc: "Seletor de emojis, stickers y GIFs.",
            cat_autoComplete_label: "Autocompletar",
            cat_autoComplete_desc: "Sugerencias de @mención, #canal, :emoji:.",
            cat_imageViewer_label: "Visualizador de Imagen",
            cat_imageViewer_desc: "Lightbox al abrir imágenes.",
            cat_callOverlay_label: "Call Overlay",
            cat_callOverlay_desc: "Controles y UI durante llamadas de voz/vídeo.",
            cat_messages_label: "Mensajes Nuevos",
            cat_messages_desc: "Cada mensaje nuevo que aparece en el chat.",
            cat_reactions_label: "Reacciones",
            cat_reactions_desc: "Reacciones de emojis que aparecen en mensajes.",
            cat_uploadPreview_label: "Vista Previa de Carga",
            cat_uploadPreview_desc: "Vista previa de archivos antes de enviar.",
            cat_memberList_label: "Lista de Miembros",
            cat_memberList_desc: "El panel de la lista de miembros del servidor.",
            cat_voiceIndicator_label: "Indicadores de Voz",
            cat_voiceIndicator_desc: "Indicadores de habla en canales de voz.",
            cat_dmList_label: "Lista de DMs",
            cat_dmList_desc: "Conversaciones directas en la barra lateral.",
            cat_serverFolders_label: "Carpetas de Servidores",
            cat_serverFolders_desc: "Expandir/contraer grupos de carpetas.",
            cat_threadPanel_label: "Panel de Hilos",
            cat_threadPanel_desc: "Apertura y cierre de la barra de hilos.",
            cat_searchResults_label: "Resultados de Búsqueda",
            cat_searchResults_desc: "Itens de los resultados de búsqueda.",
            cat_inbox_label: "Inbox",
            cat_inbox_desc: "Panel de menciones y notificaciones.",
            cat_appDirectory_label: "Directorio de Apps",
            cat_appDirectory_desc: "Directorio de aplicaciones y panel de navegar canales.",
            field_animation: "Animation",
            field_easing: "Easing",
            field_duration: "Duration",
            field_delay: "Delay per item",
            field_max_items: "Max items",
            field_stagger_title: "✦ Stagger Effect",
            field_stagger_sub: "Items animate in cascading sequence",
            btn_preview: "▶  Live Preview",
            preview_title: "Preview",
            preview_dismiss: "Haz clic en cualquier lugar para cerrar",
            preview_mock_text: "¡Así es como se ve tu animación! ✨",
            updateTitle: 'Actualización Disponible',
            updateDesc: '¡Una nueva versión de {name} está disponible!',
            currentVersion: 'Versión Actual',
            newVersion: 'Nueva Versión',
            updateAction: 'Actualizar Ahora',
            updateLater: 'Más tarde',
            updateNotice: 'El plugin se actualizará automáticamente y se recargará al instante en segundo plano.',
            updateSuccess: '¡Actualizado a v{version}!',
            changelogTitle: 'Novedades'
        }
    };

    _t(key) {
        return SolariMotion.STRINGS[this.config.language]?.[key] ?? SolariMotion.STRINGS.en[key] ?? key;
    }

    // Category config factory
    static _c(animation, duration, easing, staggerOn = false, staggerDelay = 35) {
        return {
            enabled: true, animation, duration, easing,
            customEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            stagger: { enabled: staggerOn, delay: staggerDelay, maxItems: 8 },
        };
    }

    static PRESETS = {
        fluid: {
            channelSwitch: SolariMotion._c('glide', 250, 'smooth'),
            serverSwitch: SolariMotion._c('scale', 230, 'smooth'),
            settings: SolariMotion._c('fade', 200, 'smooth'),
            contextMenu: SolariMotion._c('scale', 160, 'smooth'),
            tooltips: SolariMotion._c('fade', 130, 'ease-out'),
            modals: SolariMotion._c('spring', 260, 'smooth'),
            userPopout: SolariMotion._c('spring', 220, 'bounce'),
            emojiPicker: SolariMotion._c('spring', 220, 'bounce'),
            autoComplete: SolariMotion._c('glide', 140, 'smooth'),
            imageViewer: SolariMotion._c('zoom-bounce', 280, 'bounce'),
            callOverlay: SolariMotion._c('glide', 200, 'smooth'),
            messages: SolariMotion._c('glide', 200, 'smooth', true, 40),
            reactions: SolariMotion._c('bounce', 260, 'bounce', true, 50),
            uploadPreview: SolariMotion._c('glide', 200, 'smooth'),
            memberList: SolariMotion._c('slide-right', 220, 'smooth'),
            voiceIndicator: SolariMotion._c('scale', 160, 'smooth'),
            dmList: SolariMotion._c('slide-right', 180, 'smooth', true, 30),
            serverFolders: SolariMotion._c('spring', 220, 'bounce'),
            threadPanel: SolariMotion._c('slide-left', 220, 'smooth'),
            searchResults: SolariMotion._c('glide', 160, 'smooth', true, 35),
            inbox: SolariMotion._c('spring', 230, 'bounce'),
            appDirectory: SolariMotion._c('scale', 200, 'smooth'),
        },
        snappy: {
            channelSwitch: SolariMotion._c('slide-up', 120, 'snappy'),
            serverSwitch: SolariMotion._c('fade', 100, 'snappy'),
            settings: SolariMotion._c('fade', 100, 'ease-out'),
            contextMenu: SolariMotion._c('scale', 100, 'snappy'),
            tooltips: SolariMotion._c('fade', 80, 'ease-out'),
            modals: SolariMotion._c('scale', 130, 'snappy'),
            userPopout: SolariMotion._c('scale', 120, 'snappy'),
            emojiPicker: SolariMotion._c('scale', 120, 'snappy'),
            autoComplete: SolariMotion._c('scale', 90, 'snappy'),
            imageViewer: SolariMotion._c('scale', 140, 'snappy'),
            callOverlay: SolariMotion._c('fade', 110, 'snappy'),
            messages: SolariMotion._c('slide-up', 100, 'snappy'),
            reactions: SolariMotion._c('snap', 140, 'snappy', true, 20),
            uploadPreview: SolariMotion._c('slide-up', 110, 'snappy'),
            memberList: SolariMotion._c('fade', 110, 'snappy'),
            voiceIndicator: SolariMotion._c('scale', 100, 'snappy'),
            dmList: SolariMotion._c('fade', 100, 'snappy'),
            serverFolders: SolariMotion._c('scale', 120, 'snappy'),
            threadPanel: SolariMotion._c('slide-left', 120, 'snappy'),
            searchResults: SolariMotion._c('fade', 100, 'snappy', true, 15),
            inbox: SolariMotion._c('scale', 120, 'snappy'),
            appDirectory: SolariMotion._c('fade', 100, 'snappy'),
        },
        bounce: {
            channelSwitch: SolariMotion._c('bounce', 360, 'bounce'),
            serverSwitch: SolariMotion._c('zoom-bounce', 360, 'bounce'),
            settings: SolariMotion._c('spring', 280, 'bounce'),
            contextMenu: SolariMotion._c('zoom-bounce', 260, 'bounce'),
            tooltips: SolariMotion._c('bounce', 200, 'bounce'),
            modals: SolariMotion._c('elastic', 390, 'bounce'),
            userPopout: SolariMotion._c('elastic', 320, 'elastic'),
            emojiPicker: SolariMotion._c('elastic', 320, 'elastic'),
            autoComplete: SolariMotion._c('zoom-bounce', 200, 'bounce'),
            imageViewer: SolariMotion._c('elastic', 380, 'elastic'),
            callOverlay: SolariMotion._c('spring', 280, 'bounce'),
            messages: SolariMotion._c('bounce', 300, 'bounce', true, 50),
            reactions: SolariMotion._c('elastic', 360, 'elastic', true, 60),
            uploadPreview: SolariMotion._c('bounce', 300, 'bounce'),
            memberList: SolariMotion._c('spring', 290, 'bounce'),
            voiceIndicator: SolariMotion._c('bounce', 250, 'bounce'),
            dmList: SolariMotion._c('spring', 280, 'bounce', true, 40),
            serverFolders: SolariMotion._c('elastic', 300, 'elastic'),
            threadPanel: SolariMotion._c('spring', 280, 'bounce'),
            searchResults: SolariMotion._c('bounce', 260, 'bounce', true, 45),
            inbox: SolariMotion._c('elastic', 320, 'elastic'),
            appDirectory: SolariMotion._c('zoom-bounce', 280, 'bounce'),
        },
        minimal: {
            channelSwitch: SolariMotion._c('fade', 100, 'ease-out'),
            serverSwitch: SolariMotion._c('fade', 100, 'ease-out'),
            settings: SolariMotion._c('fade', 80, 'ease-out'),
            contextMenu: SolariMotion._c('fade', 80, 'ease-out'),
            tooltips: SolariMotion._c('fade', 60, 'ease-out'),
            modals: SolariMotion._c('fade', 100, 'ease-out'),
            userPopout: SolariMotion._c('fade', 90, 'ease-out'),
            emojiPicker: SolariMotion._c('fade', 90, 'ease-out'),
            autoComplete: SolariMotion._c('fade', 60, 'ease-out'),
            imageViewer: SolariMotion._c('fade', 100, 'ease-out'),
            callOverlay: SolariMotion._c('fade', 80, 'ease-out'),
            messages: SolariMotion._c('fade', 80, 'ease-out'),
            reactions: SolariMotion._c('fade', 80, 'ease-out'),
            uploadPreview: SolariMotion._c('fade', 80, 'ease-out'),
            memberList: SolariMotion._c('fade', 80, 'ease-out'),
            voiceIndicator: SolariMotion._c('fade', 80, 'ease-out'),
            dmList: SolariMotion._c('fade', 80, 'ease-out'),
            serverFolders: SolariMotion._c('fade', 80, 'ease-out'),
            threadPanel: SolariMotion._c('fade', 80, 'ease-out'),
            searchResults: SolariMotion._c('fade', 80, 'ease-out'),
            inbox: SolariMotion._c('fade', 90, 'ease-out'),
            appDirectory: SolariMotion._c('fade', 80, 'ease-out'),
        },

        // ── Cinematic — slow wipe reveals, film-like transitions ──
        cinematic: {
            channelSwitch: SolariMotion._c('wipe-right', 480, 'smooth'),
            serverSwitch: SolariMotion._c('wipe-up', 440, 'smooth'),
            settings: SolariMotion._c('wipe-right', 380, 'smooth'),
            contextMenu: SolariMotion._c('wipe-up', 260, 'smooth'),
            tooltips: SolariMotion._c('fade', 160, 'smooth'),
            modals: SolariMotion._c('wipe-up', 400, 'smooth'),
            userPopout: SolariMotion._c('wipe-right', 320, 'smooth'),
            emojiPicker: SolariMotion._c('wipe-up', 300, 'smooth'),
            autoComplete: SolariMotion._c('wipe-up', 200, 'smooth'),
            imageViewer: SolariMotion._c('clip-circle', 500, 'smooth'),
            callOverlay: SolariMotion._c('wipe-up', 380, 'smooth'),
            messages: SolariMotion._c('wipe-right', 350, 'smooth', true, 60),
            reactions: SolariMotion._c('fade', 220, 'smooth', true, 40),
            uploadPreview: SolariMotion._c('wipe-up', 340, 'smooth'),
            memberList: SolariMotion._c('wipe-right', 380, 'smooth'),
            voiceIndicator: SolariMotion._c('fade', 200, 'smooth'),
            dmList: SolariMotion._c('wipe-right', 320, 'smooth', true, 50),
            serverFolders: SolariMotion._c('wipe-up', 300, 'smooth'),
            threadPanel: SolariMotion._c('wipe-right', 360, 'smooth'),
            searchResults: SolariMotion._c('wipe-up', 280, 'smooth', true, 55),
            inbox: SolariMotion._c('wipe-right', 360, 'smooth'),
            appDirectory: SolariMotion._c('clip-circle', 400, 'smooth'),
        },

        // ── Jelly — exaggerated elastic wobble, playful and fun ──
        jelly: {
            channelSwitch: SolariMotion._c('elastic', 500, 'elastic'),
            serverSwitch: SolariMotion._c('zoom-bounce', 480, 'elastic'),
            settings: SolariMotion._c('elastic', 420, 'elastic'),
            contextMenu: SolariMotion._c('pop', 340, 'elastic'),
            tooltips: SolariMotion._c('pop', 260, 'elastic'),
            modals: SolariMotion._c('elastic', 540, 'elastic'),
            userPopout: SolariMotion._c('elastic', 460, 'elastic'),
            emojiPicker: SolariMotion._c('pop', 400, 'elastic'),
            autoComplete: SolariMotion._c('pop', 300, 'elastic'),
            imageViewer: SolariMotion._c('zoom-bounce', 540, 'elastic'),
            callOverlay: SolariMotion._c('elastic', 440, 'elastic'),
            messages: SolariMotion._c('pop', 380, 'elastic', true, 70),
            reactions: SolariMotion._c('elastic', 420, 'elastic', true, 80),
            uploadPreview: SolariMotion._c('pop', 380, 'elastic'),
            memberList: SolariMotion._c('elastic', 440, 'elastic', true, 45),
            voiceIndicator: SolariMotion._c('pop', 300, 'elastic'),
            dmList: SolariMotion._c('pop', 380, 'elastic', true, 55),
            serverFolders: SolariMotion._c('elastic', 400, 'elastic'),
            threadPanel: SolariMotion._c('elastic', 420, 'elastic'),
            searchResults: SolariMotion._c('pop', 340, 'elastic', true, 60),
            inbox: SolariMotion._c('elastic', 460, 'elastic'),
            appDirectory: SolariMotion._c('zoom-bounce', 440, 'elastic'),
        },

        // ── Gravity — elements fall/drop into place, weighted feel ──
        gravity: {
            channelSwitch: SolariMotion._c('gravity', 320, 'ease-in-out'),
            serverSwitch: SolariMotion._c('gravity', 300, 'ease-in-out'),
            settings: SolariMotion._c('gravity', 260, 'ease-in-out'),
            contextMenu: SolariMotion._c('gravity', 200, 'ease-in-out'),
            tooltips: SolariMotion._c('gravity', 160, 'ease-in-out'),
            modals: SolariMotion._c('gravity', 340, 'ease-in-out'),
            userPopout: SolariMotion._c('gravity', 280, 'ease-in-out'),
            emojiPicker: SolariMotion._c('gravity', 260, 'ease-in-out'),
            autoComplete: SolariMotion._c('gravity', 180, 'ease-in-out'),
            imageViewer: SolariMotion._c('gravity', 360, 'ease-in-out'),
            callOverlay: SolariMotion._c('gravity', 280, 'ease-in-out'),
            messages: SolariMotion._c('gravity', 260, 'ease-in-out', true, 45),
            reactions: SolariMotion._c('pop', 240, 'ease-in-out', true, 35),
            uploadPreview: SolariMotion._c('gravity', 260, 'ease-in-out'),
            memberList: SolariMotion._c('gravity', 280, 'ease-in-out', true, 30),
            voiceIndicator: SolariMotion._c('gravity', 200, 'ease-in-out'),
            dmList: SolariMotion._c('gravity', 240, 'ease-in-out', true, 25),
            serverFolders: SolariMotion._c('gravity', 240, 'ease-in-out'),
            threadPanel: SolariMotion._c('gravity', 260, 'ease-in-out'),
            searchResults: SolariMotion._c('gravity', 220, 'ease-in-out', true, 30),
            inbox: SolariMotion._c('gravity', 280, 'ease-in-out'),
            appDirectory: SolariMotion._c('gravity', 260, 'ease-in-out'),
        },

        // ── Glass — morph + blur, sophisticated and soft ──
        glass: {
            channelSwitch: SolariMotion._c('morph', 340, 'smooth'),
            serverSwitch: SolariMotion._c('morph', 320, 'smooth'),
            settings: SolariMotion._c('blur-in', 280, 'smooth'),
            contextMenu: SolariMotion._c('morph', 220, 'smooth'),
            tooltips: SolariMotion._c('blur-in', 160, 'smooth'),
            modals: SolariMotion._c('morph', 360, 'smooth'),
            userPopout: SolariMotion._c('morph', 300, 'smooth'),
            emojiPicker: SolariMotion._c('blur-in', 280, 'smooth'),
            autoComplete: SolariMotion._c('blur-in', 180, 'smooth'),
            imageViewer: SolariMotion._c('morph', 400, 'smooth'),
            callOverlay: SolariMotion._c('blur-in', 280, 'smooth'),
            messages: SolariMotion._c('morph', 280, 'smooth', true, 40),
            reactions: SolariMotion._c('blur-in', 220, 'smooth', true, 30),
            uploadPreview: SolariMotion._c('morph', 280, 'smooth'),
            memberList: SolariMotion._c('blur-in', 300, 'smooth', true, 25),
            voiceIndicator: SolariMotion._c('blur-in', 200, 'smooth'),
            dmList: SolariMotion._c('morph', 260, 'smooth', true, 30),
            serverFolders: SolariMotion._c('morph', 280, 'smooth'),
            threadPanel: SolariMotion._c('blur-in', 280, 'smooth'),
            searchResults: SolariMotion._c('morph', 240, 'smooth', true, 35),
            inbox: SolariMotion._c('morph', 300, 'smooth'),
            appDirectory: SolariMotion._c('morph', 280, 'smooth'),
        },

        // ── Retro — flip and rotate, vintage computer UI vibe ──
        retro: {
            channelSwitch: SolariMotion._c('flip-x', 300, 'snappy'),
            serverSwitch: SolariMotion._c('flip-y', 280, 'snappy'),
            settings: SolariMotion._c('rotate-in', 260, 'snappy'),
            contextMenu: SolariMotion._c('flip-x', 200, 'snappy'),
            tooltips: SolariMotion._c('rotate-in', 150, 'snappy'),
            modals: SolariMotion._c('flip-y', 320, 'snappy'),
            userPopout: SolariMotion._c('flip-x', 260, 'snappy'),
            emojiPicker: SolariMotion._c('rotate-in', 240, 'snappy'),
            autoComplete: SolariMotion._c('flip-y', 180, 'snappy'),
            imageViewer: SolariMotion._c('flip-x', 340, 'snappy'),
            callOverlay: SolariMotion._c('rotate-in', 260, 'snappy'),
            messages: SolariMotion._c('slide-up', 220, 'snappy', true, 30),
            reactions: SolariMotion._c('rotate-in', 200, 'snappy', true, 25),
            uploadPreview: SolariMotion._c('flip-y', 260, 'snappy'),
            memberList: SolariMotion._c('slide-right', 240, 'snappy', true, 20),
            voiceIndicator: SolariMotion._c('rotate-in', 180, 'snappy'),
            dmList: SolariMotion._c('slide-right', 200, 'snappy', true, 20),
            serverFolders: SolariMotion._c('flip-y', 240, 'snappy'),
            threadPanel: SolariMotion._c('flip-x', 260, 'snappy'),
            searchResults: SolariMotion._c('slide-up', 200, 'snappy', true, 20),
            inbox: SolariMotion._c('rotate-in', 260, 'snappy'),
            appDirectory: SolariMotion._c('flip-y', 260, 'snappy'),
        },

        // ── Zen — ultra-slow floats, meditative and breathable ──
        zen: {
            channelSwitch: SolariMotion._c('float', 600, 'smooth'),
            serverSwitch: SolariMotion._c('float', 560, 'smooth'),
            settings: SolariMotion._c('float', 480, 'smooth'),
            contextMenu: SolariMotion._c('float', 360, 'smooth'),
            tooltips: SolariMotion._c('fade', 280, 'smooth'),
            modals: SolariMotion._c('float', 640, 'smooth'),
            userPopout: SolariMotion._c('float', 520, 'smooth'),
            emojiPicker: SolariMotion._c('float', 480, 'smooth'),
            autoComplete: SolariMotion._c('float', 320, 'smooth'),
            imageViewer: SolariMotion._c('float', 680, 'smooth'),
            callOverlay: SolariMotion._c('float', 540, 'smooth'),
            messages: SolariMotion._c('float', 480, 'smooth', true, 80),
            reactions: SolariMotion._c('float', 420, 'smooth', true, 70),
            uploadPreview: SolariMotion._c('float', 480, 'smooth'),
            memberList: SolariMotion._c('float', 520, 'smooth', true, 60),
            voiceIndicator: SolariMotion._c('fade', 360, 'smooth'),
            dmList: SolariMotion._c('float', 480, 'smooth', true, 70),
            serverFolders: SolariMotion._c('float', 500, 'smooth'),
            threadPanel: SolariMotion._c('float', 520, 'smooth'),
            searchResults: SolariMotion._c('float', 440, 'smooth', true, 75),
            inbox: SolariMotion._c('float', 540, 'smooth'),
            appDirectory: SolariMotion._c('float', 520, 'smooth'),
        },

        // ── Sharp — instant crisp slides, zero wobble, no nonsense ──
        sharp: {
            channelSwitch: SolariMotion._c('slide-up', 90, 'snappy'),
            serverSwitch: SolariMotion._c('slide-right', 80, 'snappy'),
            settings: SolariMotion._c('slide-up', 70, 'snappy'),
            contextMenu: SolariMotion._c('scale', 70, 'snappy'),
            tooltips: SolariMotion._c('scale', 50, 'snappy'),
            modals: SolariMotion._c('slide-up', 100, 'snappy'),
            userPopout: SolariMotion._c('scale', 80, 'snappy'),
            emojiPicker: SolariMotion._c('slide-up', 80, 'snappy'),
            autoComplete: SolariMotion._c('slide-up', 60, 'snappy'),
            imageViewer: SolariMotion._c('scale', 110, 'snappy'),
            callOverlay: SolariMotion._c('slide-up', 80, 'snappy'),
            messages: SolariMotion._c('slide-up', 70, 'snappy'),
            reactions: SolariMotion._c('scale', 70, 'snappy'),
            uploadPreview: SolariMotion._c('slide-up', 70, 'snappy'),
            memberList: SolariMotion._c('slide-right', 80, 'snappy'),
            voiceIndicator: SolariMotion._c('scale', 60, 'snappy'),
            dmList: SolariMotion._c('slide-right', 70, 'snappy'),
            serverFolders: SolariMotion._c('scale', 80, 'snappy'),
            threadPanel: SolariMotion._c('slide-left', 80, 'snappy'),
            searchResults: SolariMotion._c('slide-up', 70, 'snappy'),
            inbox: SolariMotion._c('slide-up', 80, 'snappy'),
            appDirectory: SolariMotion._c('scale', 80, 'snappy'),
        },

        // ── Cascade — stagger-heavy, everything enters in sequence ──
        cascade: {
            channelSwitch: SolariMotion._c('glide', 280, 'smooth', true, 50),
            serverSwitch: SolariMotion._c('glide', 260, 'smooth', true, 45),
            settings: SolariMotion._c('glide', 220, 'smooth', true, 40),
            contextMenu: SolariMotion._c('glide', 180, 'smooth', true, 30),
            tooltips: SolariMotion._c('fade', 140, 'smooth'),
            modals: SolariMotion._c('spring', 300, 'smooth', true, 55),
            userPopout: SolariMotion._c('glide', 240, 'smooth', true, 40),
            emojiPicker: SolariMotion._c('glide', 220, 'smooth', true, 35),
            autoComplete: SolariMotion._c('glide', 160, 'smooth', true, 25),
            imageViewer: SolariMotion._c('spring', 300, 'smooth'),
            callOverlay: SolariMotion._c('glide', 240, 'smooth', true, 40),
            messages: SolariMotion._c('glide', 240, 'smooth', true, 55),
            reactions: SolariMotion._c('spring', 280, 'bounce', true, 65),
            uploadPreview: SolariMotion._c('glide', 220, 'smooth'),
            memberList: SolariMotion._c('glide', 260, 'smooth', true, 40),
            voiceIndicator: SolariMotion._c('glide', 180, 'smooth', true, 30),
            dmList: SolariMotion._c('glide', 240, 'smooth', true, 45),
            serverFolders: SolariMotion._c('spring', 260, 'bounce', true, 35),
            threadPanel: SolariMotion._c('glide', 240, 'smooth', true, 40),
            searchResults: SolariMotion._c('glide', 200, 'smooth', true, 50),
            inbox: SolariMotion._c('spring', 260, 'smooth', true, 45),
            appDirectory: SolariMotion._c('glide', 240, 'smooth'),
        },

        // ── Pendulum — swinging, organic movement ──
        pendulum: {
            channelSwitch: SolariMotion._c('pendulum', 600, 'smooth'),
            serverSwitch: SolariMotion._c('swing', 520, 'smooth'),
            settings: SolariMotion._c('swing', 460, 'smooth'),
            contextMenu: SolariMotion._c('pendulum', 360, 'smooth'),
            tooltips: SolariMotion._c('swing', 260, 'smooth'),
            modals: SolariMotion._c('pendulum', 640, 'smooth'),
            userPopout: SolariMotion._c('swing', 500, 'smooth'),
            emojiPicker: SolariMotion._c('pendulum', 480, 'smooth'),
            autoComplete: SolariMotion._c('swing', 300, 'smooth'),
            imageViewer: SolariMotion._c('swing', 560, 'smooth'),
            callOverlay: SolariMotion._c('pendulum', 500, 'smooth'),
            messages: SolariMotion._c('glide', 220, 'smooth', true, 40),
            reactions: SolariMotion._c('bounce', 280, 'bounce', true, 50),
            uploadPreview: SolariMotion._c('swing', 420, 'smooth'),
            memberList: SolariMotion._c('glide', 240, 'smooth', true, 25),
            voiceIndicator: SolariMotion._c('pendulum', 400, 'smooth'),
            dmList: SolariMotion._c('swing', 360, 'smooth', true, 30),
            serverFolders: SolariMotion._c('pendulum', 440, 'smooth'),
            threadPanel: SolariMotion._c('swing', 460, 'smooth'),
            searchResults: SolariMotion._c('glide', 200, 'smooth', true, 30),
            inbox: SolariMotion._c('pendulum', 500, 'smooth'),
            appDirectory: SolariMotion._c('swing', 460, 'smooth'),
        },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    constructor(meta) {
        this.meta = meta;
        this._rootObs = null;
        this._staggerMap = new Map();
        this._fps = 60;
        this._fpsRAF = null;
        this._stats = { totalAnimated: 0 };
        this._statsEl = null;
        this.staticStyleId = `${SolariMotion.ID}-S`;
        this.dynamicStyleId = `${SolariMotion.ID}-D`;
        this._debouncedCSS = this._debounce(() => this._injectDynamicCSS(), 60);

        this.config = {
            configVersion: SolariMotion.CONFIG_VERSION,
            globalPreset: 'fluid',
            intensity: 100,
            performanceMode: false,
            fpsProtection: true,
            respectReducedMotion: true,
            language: 'en',
            categories: JSON.parse(JSON.stringify(SolariMotion.PRESETS.fluid)),
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════════════════

    loadConfig() {
        try {
            let saved = BdApi.Data.load(SolariMotion.ID, 'config');
            if (!saved) return;
            saved = this._migrateConfig(saved);
            this.config = { ...this.config, ...saved };
            // Forward-compat: inject missing new categories
            for (const key of Object.keys(SolariMotion.CATEGORY_META)) {
                if (!this.config.categories[key]) {
                    this.config.categories[key] = JSON.parse(JSON.stringify(SolariMotion.PRESETS.fluid[key]));
                }
            }
        } catch (e) { console.error('[SolariMotion] Load error:', e); }
    }

    saveConfig() {
        try {
            BdApi.Data.save(SolariMotion.ID, 'config', this.config);

            // Save configuration file for Solari App (schema + settings)
            const fs = require('fs');
            const path = require('path');
            const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
            const cfgPath = path.join(appData, 'BetterDiscord', 'plugins', 'SolariMotion.config.json');

            const payload = {
                settings: this.config,
                schema: this.getSettingsSchema()
            };
            fs.writeFileSync(cfgPath, JSON.stringify(payload, null, 4), 'utf8');
        }
        catch (e) { console.error('[SolariMotion] Save error:', e); }
    }

    getSettingsSchema() {
        return [
            { type: 'custom_header', title: 'Solari Motion', icon: '✨', version: 'v1.0.2' },
            {
                type: 'select',
                key: 'globalPreset',
                label: 'Preset Global',
                options: [
                    { value: 'fluid', label: 'Fluid', hint: 'Transições suaves baseadas em curvas cubic-bezier' },
                    { value: 'snappy', label: 'Snappy', hint: 'Transições rápidas e responsivas' },
                    { value: 'bounce', label: 'Bouncy', hint: 'Animações divertidas com efeito elástico/bounce' },
                    { value: 'minimal', label: 'Minimal', hint: 'Transições simples de fade (baixo consumo de hardware)' },
                    { value: 'off', label: 'Desativado', hint: 'Desativa completamente todas as animações' }
                ]
            },
            {
                type: 'slider',
                key: 'intensity',
                label: 'Intensidade Global das Animações (%)',
                min: 0,
                max: 200,
                step: 10,
                suffix: '%',
                defaultValue: 100
            },
            {
                type: 'toggle',
                key: 'performanceMode',
                label: 'Modo de Performance',
                description: 'Aplica otimizações agressivas e simplifica a renderização para computadores mais lentos.'
            },
            {
                type: 'toggle',
                key: 'fpsProtection',
                label: 'Proteção de FPS',
                description: 'Pausa as animações se a taxa de quadros (FPS) do Discord cair abaixo de 30 FPS.'
            },
            {
                type: 'toggle',
                key: 'respectReducedMotion',
                label: 'Respeitar Reduced Motion',
                description: 'Desativa as animações se a configuração do sistema operacional solicitar redução de movimento.'
            }
        ];
    }

    _setupFileWatcher() {
        try {
            const fs = require('fs');
            const path = require('path');
            const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
            const cfgPath = path.join(appData, 'BetterDiscord', 'plugins', 'SolariMotion.config.json');

            this._stopFileWatcher();

            if (fs.existsSync(cfgPath)) {
                this._fileWatcher = fs.watch(cfgPath, (eventType) => {
                    if (eventType === 'change') {
                        if (this._isWritingConfig) return;
                        setTimeout(() => {
                            try {
                                if (this._isWritingConfig) return;
                                if (!fs.existsSync(cfgPath)) return;
                                const raw = fs.readFileSync(cfgPath, 'utf8');
                                if (!raw) return;
                                const data = JSON.parse(raw);
                                if (data && data.settings) {
                                    const oldPreset = this.config.globalPreset;
                                    const presetChanged = data.settings.globalPreset && data.settings.globalPreset !== oldPreset;

                                    // Merge settings and apply
                                    this.config = { ...this.config, ...data.settings };

                                    if (presetChanged) {
                                        this.config.categories = this._clonePreset(data.settings.globalPreset);
                                    }

                                    document.documentElement.style.setProperty('--sm-int', this.config.intensity / 100);
                                    this._debouncedCSS(); // Re-inject dynamic CSS
                                    if (this.config.fpsProtection) {
                                        this._startFPSMonitor();
                                    } else {
                                        this._stopFPSMonitor();
                                    }

                                    // Persist changes to BetterDiscord internal storage
                                    BdApi.Data.save(SolariMotion.ID, 'config', this.config);

                                    // Update the configuration file with the full settings & schema
                                    this._isWritingConfig = true;
                                    try {
                                        const payload = {
                                            settings: this.config,
                                            schema: this.getSettingsSchema()
                                        };
                                        fs.writeFileSync(cfgPath, JSON.stringify(payload, null, 4), 'utf8');
                                    } catch (e) {
                                        console.error('[SolariMotion] Error saving config from watcher:', e);
                                    }
                                    setTimeout(() => {
                                        this._isWritingConfig = false;
                                    }, 100);
                                }
                            } catch (err) {
                                // Ignore transient read errors during write lock
                            }
                        }, 50);
                    }
                });
            }
        } catch (e) {
            console.error('[SolariMotion] Failed to setup config file watcher:', e);
        }
    }

    _stopFileWatcher() {
        if (this._fileWatcher) {
            try {
                this._fileWatcher.close();
            } catch (e) { }
            this._fileWatcher = null;
        }
    }

    _migrateConfig(saved) {
        const v = saved.configVersion ?? 1;
        if (v < 2) {
            saved.intensity ??= 100;
            saved.fpsProtection ??= true;
            saved.configVersion = 2;
            for (const cat of Object.values(saved.categories ?? {})) {
                cat.stagger ??= { enabled: false, delay: 35, maxItems: 8 };
                cat.customEasing ??= 'cubic-bezier(0.4, 0, 0.2, 1)';
            }
        }
        saved.language ??= 'en';
        return saved;
    }

    checkForUpdates() {
        const updateUrl = this.meta?.updateUrl;
        if (!updateUrl) return;

        fetch(`${updateUrl}?t=${Date.now()}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.text();
            })
            .then(code => {
                const versionMatch = code.match(/@version\s+([0-9.]+)/);
                if (!versionMatch) return;
                const remoteVersion = versionMatch[1];

                if (this.isNewerVersion(this.meta.version, remoteVersion)) {
                    this.showUpdateModal(remoteVersion, code);
                }
            })
            .catch(err => {
                console.error(`[${this.meta.name}] Update check failed:`, err);
            });
    }

    showUpdateModal(remoteVersion, code) {
        const React = BdApi.React;
        const content = React.createElement("div", {
            style: {
                color: "#f3f4f6",
                fontFamily: "'Inter', sans-serif",
                lineHeight: "1.6",
                fontSize: "14px"
            }
        },
            React.createElement("p", { style: { marginBottom: "12px" } },
                this._t('updateDesc').replace('{name}', this.meta.name)
            ),
            React.createElement("div", {
                style: {
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "16px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    textAlign: "center"
                }
            },
                React.createElement("div", {},
                    React.createElement("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" } }, this._t('currentVersion')),
                    React.createElement("div", { style: { fontSize: "16px", fontWeight: "bold", color: "#ef4444" } }, `v${this.meta.version}`)
                ),
                React.createElement("div", {},
                    React.createElement("div", { style: { fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" } }, this._t('newVersion')),
                    React.createElement("div", { style: { fontSize: "16px", fontWeight: "bold", color: "#1DB954" } }, `v${remoteVersion}`)
                )
            ),
            React.createElement("p", { style: { fontSize: "12px", color: "rgba(255,255,255,0.5)" } },
                this._t('updateNotice')
            )
        );

        BdApi.UI.showConfirmationModal(
            this._t('updateTitle'),
            content,
            {
                confirmText: this._t('updateAction'),
                cancelText: this._t('updateLater'),
                onConfirm: () => {
                    const fs = require("fs");
                    const path = require("path");
                    const filename = `${this.meta.name}.plugin.js`;
                    const pluginPath = path.join(BdApi.Plugins.folder, filename);

                    fs.writeFile(pluginPath, code, "utf8", (err) => {
                        if (err) {
                            console.error(`[${this.meta.name}] Failed to write update:`, err);
                            BdApi.UI.showToast(`❌ Error: ${err.message}`, { type: "error" });
                            return;
                        }
                        BdApi.UI.showToast(`✨ ${this._t('updateSuccess').replace('{version}', remoteVersion)}`, { type: "success" });
                    });
                }
            }
        );
    }

    isNewerVersion(current, remote) {
        const c = current.split('.').map(Number);
        const r = remote.split('.').map(Number);
        for (let i = 0; i < Math.max(c.length, r.length); i++) {
            const cVal = c[i] || 0;
            const rVal = r[i] || 0;
            if (rVal > cVal) return true;
            if (cVal > rVal) return false;
        }
        return false;
    }

    checkChangelog() {
        try {
            const lastVersion = BdApi.Data.load(SolariMotion.ID, 'lastVersion');
            if (lastVersion && this.isNewerVersion(lastVersion, this.meta.version)) {
                const metaUrl = "https://raw.githubusercontent.com/TheDroidBR/Solari/main/plugins/plugins-meta.json";
                fetch(`${metaUrl}?t=${Date.now()}`)
                    .then(res => {
                        if (!res.ok) throw new Error("HTTP error " + res.status);
                        return res.json();
                    })
                    .then(data => {
                        const pluginKey = this.meta.name.toLowerCase();
                        const pMeta = data[pluginKey];
                        if (pMeta && pMeta.changelog) {
                            const changelog = pMeta.changelog;
                            const versionHeader = `### v${this.meta.version}`;
                            const idx = changelog.indexOf(versionHeader);
                            if (idx !== -1) {
                                const nextIdx = changelog.indexOf("###", idx + versionHeader.length);
                                const versionText = nextIdx !== -1 ? changelog.substring(idx, nextIdx) : changelog.substring(idx);
                                const lines = versionText.split("\n")
                                    .map(line => line.trim())
                                    .filter(line => line.startsWith("-"))
                                    .map(line => line.substring(1).trim());

                                if (lines.length > 0) {
                                    BdApi.UI.showChangelogModal({
                                        title: this.meta.name,
                                        subtitle: `v${this.meta.version}`,
                                        blurb: this._t('updateSuccess').replace('{version}', this.meta.version),
                                        changes: [
                                            {
                                                title: this._t('changelogTitle'),
                                                type: "improved",
                                                items: lines
                                            }
                                        ]
                                    });
                                }
                            }
                        }
                    })
                    .catch(err => console.error(`[${this.meta.name}] Failed to show changelog:`, err));
            }
            BdApi.Data.save(SolariMotion.ID, 'lastVersion', this.meta.version);
        } catch (e) {
            console.error(`[${this.meta.name}] Error in checkChangelog:`, e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════

    start() {
        console.log(`[SolariMotion] v${SolariMotion.VERSION} starting...`);
        this.loadConfig();

        // Check if we just updated to show the changelog
        this.checkChangelog();

        this.saveConfig(); // Generate/Update config schema file for Solari App
        this._setupFileWatcher();

        // Check for updates with premium confirmation modal
        this.checkForUpdates();

        document.documentElement.style.setProperty('--sm-int', this.config.intensity / 100);
        this._injectStaticCSS();
        this._injectDynamicCSS();
        this._setupObserver();
        this._startFPSMonitor();
        console.log('[SolariMotion] Ready!');
    }

    stop() {
        console.log('[SolariMotion] Stopping...');
        this._stopFileWatcher();
        this._rootObs?.disconnect();
        this._rootObs = null;
        this._stopFPSMonitor();
        BdApi.DOM.removeStyle(this.staticStyleId);
        BdApi.DOM.removeStyle(this.dynamicStyleId);
        document.documentElement.style.removeProperty('--sm-int');
        document.querySelectorAll('[data-sm-a]').forEach(el => {
            el.removeAttribute('data-sm-a');
            el.style.animation = '';
            el.style.animationDelay = '';
        });
        document.querySelector('.sm-preview-overlay')?.remove();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CSS ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    _injectStaticCSS() {
        const i = 'var(--sm-int,1)';
        const kf = `
            @keyframes sm-fade        { from{opacity:0} to{opacity:1} }
            @keyframes sm-glide       { from{opacity:0;transform:translateY(calc(10px*${i})) scale(calc(1 - 0.02*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-rise        { from{opacity:0;transform:translateY(calc(28px*${i})) scale(calc(1 - 0.05*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-float       { from{opacity:0;transform:translateY(calc(15px*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-slide-up    { from{opacity:0;transform:translateY(calc(18px*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-slide-down  { from{opacity:0;transform:translateY(calc(-18px*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-slide-left  { from{opacity:0;transform:translateX(calc(18px*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-slide-right { from{opacity:0;transform:translateX(calc(-18px*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-scale       { from{opacity:0;transform:scale(calc(1 - 0.15*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-scale-up    { from{opacity:0;transform:scale(calc(1 + 0.12*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-pop         { 0%{opacity:0;transform:scale(0)} 70%{opacity:1;transform:scale(calc(1 + 0.08*${i}))} 85%{transform:scale(calc(1 - 0.04*${i}))} 100%{transform:scale(1)} }
            @keyframes sm-spring      { 0%{opacity:0;transform:scale(calc(1 - 0.18*${i}))} 55%{opacity:1;transform:scale(calc(1 + 0.04*${i}))} 75%{transform:scale(calc(1 - 0.02*${i}))} 100%{transform:scale(1)} }
            @keyframes sm-bounce      { 0%{opacity:0;transform:scale(calc(1 - 0.25*${i}))} 60%{opacity:1;transform:scale(calc(1 + 0.06*${i}))} 80%{transform:scale(calc(1 - 0.03*${i}))} 100%{transform:scale(1)} }
            @keyframes sm-elastic     { 0%{opacity:0;transform:scale(calc(1 - 0.5*${i}))} 60%{opacity:1;transform:scale(calc(1 + 0.09*${i}))} 80%{transform:scale(calc(1 - 0.04*${i}))} 100%{transform:scale(1)} }
            @keyframes sm-zoom-bounce { 0%{opacity:0;transform:scale(calc(1 - 0.4*${i}))} 65%{transform:scale(calc(1 + 0.07*${i}))} 82%{transform:scale(calc(1 - 0.03*${i}))} 100%{opacity:1;transform:scale(1)} }
            @keyframes sm-snap        { 0%{opacity:0;transform:scale(calc(1 - 0.12*${i}))} 55%{transform:scale(calc(1 + 0.03*${i}))} 100%{opacity:1;transform:scale(1)} }
            @keyframes sm-blur-in     { from{opacity:0;filter:blur(calc(12px*${i}))} to{opacity:1;filter:blur(0)} }
            @keyframes sm-flip-x      { from{opacity:0;transform:perspective(600px) rotateY(calc(-20deg*${i}))} to{opacity:1;transform:perspective(600px) rotateY(0)} }
            @keyframes sm-flip-y      { from{opacity:0;transform:perspective(600px) rotateX(calc(-20deg*${i}))} to{opacity:1;transform:perspective(600px) rotateX(0)} }
            @keyframes sm-rotate-in   { from{opacity:0;transform:rotate(calc(-5deg*${i})) scale(calc(1 - 0.07*${i}))} to{opacity:1;transform:none} }
            @keyframes sm-swing       { 0%{opacity:0;transform:perspective(600px) rotateY(calc(-22deg*${i}))} 60%{transform:perspective(600px) rotateY(calc(6deg*${i}))} 80%{transform:perspective(600px) rotateY(calc(-3deg*${i}))} 100%{opacity:1;transform:perspective(600px) rotateY(0)} }
            @keyframes sm-wipe-right  { from{clip-path:inset(0 100% 0 0);opacity:1} to{clip-path:inset(0 0% 0 0);opacity:1} }
            @keyframes sm-wipe-up     { from{clip-path:inset(100% 0 0 0);opacity:1} to{clip-path:inset(0);opacity:1} }
            @keyframes sm-clip-circle { from{clip-path:circle(0% at 50% 50%);opacity:1} to{clip-path:circle(150% at 50% 50%);opacity:1} }
            @keyframes sm-morph       { 0%{opacity:0;filter:blur(calc(8px*${i}));transform:scale(calc(1 - 0.1*${i}))} 60%{opacity:1;filter:blur(calc(1px*${i}));transform:scale(calc(1 + 0.02*${i}))} 100%{filter:blur(0);transform:scale(1)} }
            @keyframes sm-gravity     { 0%{opacity:0;transform:translateY(calc(-24px*${i}))} 60%{opacity:1;transform:translateY(calc(4px*${i}))} 80%{transform:translateY(calc(-2px*${i}))} 100%{transform:none} }
            @keyframes sm-pendulum    { 0%{opacity:0;transform:rotate(calc(-8deg*${i}));transform-origin:top center} 40%{opacity:1;transform:rotate(calc(4deg*${i}));transform-origin:top center} 65%{transform:rotate(calc(-2deg*${i}));transform-origin:top center} 82%{transform:rotate(calc(1deg*${i}));transform-origin:top center} 100%{transform:rotate(0);transform-origin:top center} }
        `;

        const css = `
            .sm-panel { padding:24px 20px; font-family:'gg sans','Helvetica Neue',Arial,sans-serif; max-width:700px; color:#fff; }

            /* ─ Header ─ */
            .sm-header { display:flex; align-items:center; gap:14px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,.07); }
            .sm-logo { width:44px; height:44px; background:linear-gradient(135deg,#ff6b35,#f7931e); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 4px 20px rgba(255,107,53,.45); flex-shrink:0; }
            .sm-header-info h2 { margin:0 0 2px; font-size:18px; font-weight:700; color:#fff; letter-spacing:.3px; }
            .sm-header-info p  { margin:0; font-size:12px; color:rgba(255,255,255,.4); }
            .sm-lang-selector { display:flex; gap:6px; margin-left:auto; }
            .sm-lang-btn { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:6px; padding:4px 10px; cursor:pointer; font-family:'gg sans','Helvetica Neue',Arial,sans-serif; font-size:10px; font-weight:700; color:rgba(255,255,255,.6); transition:all .15s; }
            .sm-lang-btn:hover { background:rgba(255,255,255,.09); color:#fff; border-color:rgba(255,255,255,.16); }
            .sm-lang-btn.active { background:rgba(255,107,53,.12); border-color:rgba(255,107,53,.45); color:#ff6b35; box-shadow:0 0 10px rgba(255,107,53,0.1); }
            .sm-badge { font-size:11px; font-weight:600; background:rgba(255,107,53,.12); color:#ff6b35; border:1px solid rgba(255,107,53,.3); padding:4px 10px; border-radius:20px; letter-spacing:.5px; margin-left:8px; }

            /* ─ Stats Bar ─ */
            .sm-stats-bar { display:flex; align-items:center; background:rgba(255,107,53,.07); border:1px solid rgba(255,107,53,.15); border-radius:12px; padding:14px 18px; margin-bottom:20px; gap:8px; }
            .sm-stat { flex:1; text-align:center; }
            .sm-stat-count { display:block; font-size:18px; font-weight:800; color:#ff6b35; letter-spacing:-.5px; line-height:1; margin-bottom:4px; }
            .sm-stat-label { font-size:10px; font-weight:600; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.8px; }
            .sm-stat-divider { width:1px; height:36px; background:rgba(255,255,255,.08); flex-shrink:0; }

            /* ─ Section Label ─ */
            .sm-section-label { font-size:11px; font-weight:700; color:rgba(255,255,255,.38); text-transform:uppercase; letter-spacing:1.1px; margin-bottom:10px; }

            /* ─ Intensity ─ */
            .sm-intensity-row { display:flex; align-items:center; gap:12px; margin-bottom:0; }
            .sm-slider-wrap { flex:1; display:flex; flex-direction:column; }
            .sm-slider { width:100%; margin-bottom:0; }
            .sm-intensity-track { position:relative; height:20px; padding:2px 8px 0; box-sizing:border-box; margin-bottom:14px; }
            .sm-int-label { position:absolute; font-size:10px; color:rgba(255,255,255,.3); transform:translateX(-50%); }
            .sm-int-label:first-child { left:8px !important; transform:translateX(-50%); }
            .sm-int-label:last-child  { right:8px !important; left:auto !important; transform:translateX(50%); }

            /* ─ Presets ─ */
            .sm-presets { display:grid; grid-template-columns:repeat(5,1fr); gap:7px; margin-bottom:20px; }
            @media (max-width:520px) { .sm-presets { grid-template-columns:repeat(3,1fr); } }
            .sm-preset-btn { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09); border-radius:10px; padding:11px 6px; cursor:pointer; text-align:center; color:rgba(255,255,255,.65); font-family:'gg sans','Helvetica Neue',Arial,sans-serif; font-size:12px; font-weight:600; line-height:1.4; transition:background .15s,border-color .15s,color .15s,transform .1s; }
            .sm-preset-btn:hover { background:rgba(255,255,255,.1); color:#fff; border-color:rgba(255,255,255,.18); transform:translateY(-1px); }
            .sm-preset-btn.active { background:rgba(255,107,53,.15); border-color:rgba(255,107,53,.45); color:#ff6b35; }
            .sm-preset-icon { font-size:20px; display:block; margin-bottom:4px; }
            .sm-preset-sub  { font-size:10px; opacity:.5; }

            /* ─ Toggles ─ */
            .sm-toggles { display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
            .sm-toggle-card { flex:1; min-width:140px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
            .sm-toggle-text { font-size:12px; font-weight:500; color:rgba(255,255,255,.75); }
            .sm-toggle-sub  { font-size:10px; color:rgba(255,255,255,.33); margin-top:2px; }

            /* ─ Switch ─ */
            .sm-switch { position:relative; width:40px; height:22px; flex-shrink:0; }
            .sm-switch input { opacity:0; width:0; height:0; position:absolute; }
            .sm-switch-track { position:absolute; inset:0; background:rgba(255,255,255,.15); border-radius:11px; cursor:pointer; transition:background .2s; }
            .sm-switch-track::after { content:''; position:absolute; width:16px; height:16px; background:#fff; border-radius:50%; top:3px; left:3px; transition:transform .2s; box-shadow:0 1px 4px rgba(0,0,0,.35); }
            .sm-switch input:checked + .sm-switch-track { background:#ff6b35; }
            .sm-switch input:checked + .sm-switch-track::after { transform:translateX(18px); }

            /* ─ Import / Export / Reset ─ */
            .sm-ie-row { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
            .sm-ie-btn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; color:rgba(255,255,255,.7); font-family:'gg sans','Helvetica Neue',Arial,sans-serif; font-size:12px; font-weight:600; padding:8px 14px; cursor:pointer; transition:all .15s; white-space:nowrap; }
            .sm-ie-btn:hover { background:rgba(255,255,255,.12); color:#fff; border-color:rgba(255,255,255,.2); }
            .sm-reset-btn:hover { background:rgba(255,59,48,.15); border-color:rgba(255,59,48,.3); color:#ff3b30; }
            .sm-import-area { width:100%; display:flex; gap:8px; margin-top:8px; align-items:flex-start; }
            .sm-import-textarea { flex:1; min-height:80px; background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.1); border-radius:8px; color:#fff; font-family:monospace; font-size:11px; padding:8px 10px; outline:none; resize:vertical; }
            .sm-apply-btn { background:rgba(255,107,53,.15); border-color:rgba(255,107,53,.3); color:#ff6b35; }
            .sm-apply-btn:hover { background:rgba(255,107,53,.25); border-color:rgba(255,107,53,.5); }

            /* ─ Filter Chips ─ */
            .sm-chips { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
            .sm-chip { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09); border-radius:20px; padding:5px 12px; font-family:'gg sans','Helvetica Neue',Arial,sans-serif; font-size:12px; font-weight:600; color:rgba(255,255,255,.55); cursor:pointer; transition:all .15s; }
            .sm-chip:hover  { background:rgba(255,255,255,.1); color:#fff; }
            .sm-chip.active { background:rgba(255,107,53,.15); border-color:rgba(255,107,53,.4); color:#ff6b35; }

            /* ─ Search ─ */
            .sm-cat-search { width:100%; background:rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.1); border-radius:10px; color:#fff; font-family:'gg sans','Helvetica Neue',Arial,sans-serif; font-size:13px; padding:10px 14px; outline:none; margin-bottom:10px; box-sizing:border-box; transition:border-color .15s; }
            .sm-cat-search:focus { border-color:rgba(255,107,53,.5); }
            .sm-cat-search::placeholder { color:rgba(255,255,255,.3); }

            /* ─ Category Cards ─ */
            .sm-categories { display:flex; flex-direction:column; gap:7px; }
            .sm-cat-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:12px; overflow:hidden; transition:border-color .2s; }
            .sm-cat-card.enabled  { border-color:rgba(255,107,53,.22); }
            .sm-cat-card.expanded { border-color:rgba(255,107,53,.38); }
            .sm-cat-header { display:flex; align-items:center; gap:10px; padding:12px 14px; cursor:pointer; user-select:none; }
            .sm-cat-icon  { font-size:16px; width:22px; text-align:center; flex-shrink:0; }
            .sm-cat-title { font-size:13px; font-weight:600; color:#fff; }
            .sm-cat-desc  { font-size:11px; color:rgba(255,255,255,.38); margin-top:1px; }
            .sm-cat-anim-chip { font-size:10px; font-weight:600; background:rgba(255,255,255,.07); color:rgba(255,255,255,.5); border:1px solid rgba(255,255,255,.1); border-radius:10px; padding:2px 7px; white-space:nowrap; flex-shrink:0; }
            .sm-cat-card.enabled .sm-cat-anim-chip { background:rgba(255,107,53,.12); color:#ff6b35; border-color:rgba(255,107,53,.25); }
            .sm-cat-arrow { color:rgba(255,255,255,.35); font-size:10px; transition:transform .2s; flex-shrink:0; }
            .sm-cat-card.expanded .sm-cat-arrow { transform:rotate(180deg); }
            .sm-cat-body { display:none; flex-direction:column; padding:0 14px 14px; border-top:1px solid rgba(255,255,255,.06); }
            .sm-cat-card.expanded .sm-cat-body { display:flex; }
            .sm-cat-body-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }

            /* ─ Fields ─ */
            .sm-field { display:flex; flex-direction:column; gap:5px; }
            .sm-field-label { font-size:10px; font-weight:700; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.9px; }
            .sm-select { background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.11); border-radius:8px; color:#fff; font-family:'gg sans','Helvetica Neue',Arial,sans-serif; font-size:13px; padding:8px 10px; outline:none; cursor:pointer; width:100%; transition:border-color .15s; }
            .sm-select:focus { border-color:#ff6b35; }
            .sm-slider-row { display:flex; align-items:center; gap:10px; }
            .sm-slider { flex:1; -webkit-appearance:none; height:4px; background:rgba(255,255,255,.1); border-radius:2px; outline:none; cursor:pointer; }
            .sm-slider::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; background:#ff6b35; border-radius:50%; cursor:pointer; box-shadow:0 0 8px rgba(255,107,53,.5); }
            .sm-slider-val { font-size:12px; font-weight:700; color:#ff6b35; min-width:48px; text-align:right; }

            /* ─ Preview Button ─ */
            .sm-preview-btn { margin-top:4px; background:rgba(255,107,53,.09); border:1px solid rgba(255,107,53,.22); border-radius:8px; color:#ff6b35; font-family:'gg sans','Helvetica Neue',Arial,sans-serif; font-size:12px; font-weight:600; padding:9px 14px; cursor:pointer; width:100%; transition:background .15s,border-color .15s,transform .1s; letter-spacing:.3px; }
            .sm-preview-btn:hover { background:rgba(255,107,53,.18); border-color:rgba(255,107,53,.45); }
            .sm-preview-btn:active { transform:scale(.97); }

            /* ─ Stagger ─ */
            .sm-stagger-section { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:8px; padding:10px 12px; }
            .sm-stagger-header { display:flex; align-items:center; justify-content:space-between; gap:8px; }
            .sm-stagger-title { font-size:12px; font-weight:700; color:rgba(255,255,255,.7); }
            .sm-stagger-sub { font-size:10px; color:rgba(255,255,255,.35); margin-left:8px; }
            .sm-stagger-controls { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,.06); }

            /* ─ Bezier Editor ─ */
            .sm-bezier-container { display:flex; gap:12px; align-items:flex-start; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:8px; padding:12px; }
            .sm-bezier-canvas { border-radius:8px; background:rgba(0,0,0,.3); cursor:crosshair; flex-shrink:0; touch-action:none; }
            .sm-bezier-controls { flex:1; display:flex; flex-direction:column; gap:8px; min-width:0; }
            .sm-bezier-inputs { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
            .sm-bezier-input-wrap { display:flex; flex-direction:column; gap:3px; }
            .sm-bezier-num { background:rgba(0,0,0,.4); border:1px solid rgba(255,255,255,.1); border-radius:6px; color:#fff; font-family:monospace; font-size:11px; padding:4px 6px; outline:none; width:100%; box-sizing:border-box; }
            .sm-bezier-num:focus { border-color:#ff6b35; }
            .sm-bezier-presets { display:flex; flex-wrap:wrap; gap:4px; }
            .sm-bezier-chip { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:10px; color:rgba(255,255,255,.6); font-family:'gg sans','Helvetica Neue',Arial,sans-serif; font-size:10px; font-weight:600; padding:3px 8px; cursor:pointer; transition:all .12s; }
            .sm-bezier-chip:hover { background:rgba(255,107,53,.15); color:#ff6b35; border-color:rgba(255,107,53,.3); }

            /* ─ Live Preview Overlay ─ */
            .sm-preview-overlay { position:fixed; inset:0; z-index:100000; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; pointer-events:all; cursor:pointer; }
            .sm-preview-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(10px); }
            .sm-preview-label { position:relative; z-index:1; font-size:13px; font-weight:700; color:rgba(255,255,255,.55); letter-spacing:.5px; }
            .sm-preview-mock { position:relative; z-index:1; background:rgba(30,31,34,.97); border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:20px 24px; display:flex; align-items:flex-start; gap:14px; width:380px; box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.05); }
            .sm-mock-avatar { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#ff6b35,#f7931e); flex-shrink:0; }
            .sm-mock-content { flex:1; min-width:0; }
            .sm-mock-name { font-size:14px; font-weight:600; color:#fff; margin-bottom:5px; }
            .sm-mock-time { font-size:11px; font-weight:400; color:rgba(255,255,255,.35); margin-left:8px; }
            .sm-mock-text { font-size:14px; color:rgba(255,255,255,.85); line-height:1.45; }
            .sm-mock-text-2 { margin-top:2px; color:rgba(255,255,255,.6); }
            .sm-preview-hint { position:relative; z-index:1; font-size:11px; color:rgba(255,255,255,.28); }
        `;

        BdApi.DOM.addStyle(this.staticStyleId, kf + css);
    }

    _resolveEasing(cat) {
        if (cat.easing === 'custom') return cat.customEasing || 'ease';
        return SolariMotion.EASING_MAP[cat.easing] ?? 'cubic-bezier(0.4,0,0.2,1)';
    }

    _buildRule(catKey, selectors) {
        const cfg = this.config.categories[catKey];
        if (!cfg?.enabled || cfg.animation === 'none') return '';
        const dur = Math.round(cfg.duration * (this.config.intensity / 100));
        return `${selectors.join(',')} { animation:sm-${cfg.animation} ${dur}ms ${this._resolveEasing(cfg)} both !important; }`;
    }

    _injectDynamicCSS() {
        BdApi.DOM.removeStyle(this.dynamicStyleId);
        const rules = [];

        rules.push(this._buildRule('channelSwitch', ['[class*="chatContent_"]', '[class*="chat_"]>[class*="content_"]']));
        rules.push(this._buildRule('serverSwitch', ['[class*="sidebar_"]>[class*="listScroller_"]']));
        rules.push(this._buildRule('settings', ['[class*="contentRegionScroller_"]', '[class*="standardSidebarView_"] [class*="contentRegion_"]']));
        rules.push(this._buildRule('contextMenu', ['[class*="menu_"][class*="styleFlexible_"]', 'nav[class*="menu_"]']));
        rules.push(this._buildRule('modals', ['[class*="modal_"] [class*="root_"]', '[class*="layerContainer_"]>[class*="layer_"] [class*="focusLock_"]']));
        rules.push(this._buildRule('userPopout', ['[class*="userPopout_"]', '[class*="layer_"] [class*="userCard_"]']));
        rules.push(this._buildRule('emojiPicker', ['[class*="emojiPicker_"]', '[class*="expressionPickerSidebar_"]', '[class*="contentWrapper_"][class*="picker_"]']));
        rules.push(this._buildRule('autoComplete', ['[class*="autocomplete_"]']));
        rules.push(this._buildRule('imageViewer', ['[class*="mediaViewer_"]', '[class*="carouselModal_"]']));
        rules.push(this._buildRule('callOverlay', ['[class*="callContainer_"]']));
        rules.push(this._buildRule('uploadPreview', ['[class*="uploadModal_"]', '[class*="attachment_"][class*="uploading_"]']));
        rules.push(this._buildRule('memberList', ['[class*="members_"]']));
        rules.push(this._buildRule('serverFolders', ['[class*="expandedFolderIconWrapper_"]']));
        rules.push(this._buildRule('threadPanel', ['[class*="container_"][class*="thread_"]', '[class*="threadSidebar_"]']));
        rules.push(this._buildRule('inbox', ['[class*="inboxPanel_"]', '[class*="noticesPopoutWrap_"]']));
        rules.push(this._buildRule('appDirectory', ['[class*="applicationDirectory_"]', '[class*="directoryItems_"]']));

        // Tooltips — needs special selector pattern
        const tt = this.config.categories.tooltips;
        if (tt?.enabled && tt.animation !== 'none') {
            const dur = Math.round(tt.duration * (this.config.intensity / 100));
            rules.push(`[class*="tooltip_"][class*="tooltipTop_"],[class*="tooltip_"][class*="tooltipBottom_"],[class*="tooltip_"][class*="tooltipLeft_"],[class*="tooltip_"][class*="tooltipRight_"] { animation:sm-${tt.animation} ${dur}ms ${this._resolveEasing(tt)} both !important; }`);
        }

        // Voice indicators
        const vc = this.config.categories.voiceIndicator;
        if (vc?.enabled && vc.animation !== 'none') {
            const dur = Math.round(vc.duration * (this.config.intensity / 100));
            rules.push(`[class*="speaking_"] { animation:sm-${vc.animation} ${dur}ms ${this._resolveEasing(vc)} both !important; }`);
        }

        if (this.config.performanceMode)
            rules.push('* { animation-duration:100ms !important; }');

        if (this.config.respectReducedMotion)
            rules.push('@media (prefers-reduced-motion:reduce) { * { animation:none !important; transition:none !important; } }');

        BdApi.DOM.addStyle(this.dynamicStyleId, rules.join('\n'));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SMART OBSERVER POOL
    // ═══════════════════════════════════════════════════════════════════════

    _setupObserver() {
        this._rootObs = new MutationObserver((mutations) => {
            if (this.config.fpsProtection && !this._isPerformanceOK()) return;
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType !== 1 || node.dataset.smA) continue;
                    this._dispatch(node);
                }
            }
        });
        this._rootObs.observe(document.body, { childList: true, subtree: true });
    }

    _dispatch(node) {
        const cls = typeof node.className === 'string' ? node.className : '';
        if (!cls) return;

        if ((cls.includes('message_') || cls.includes('messageListItem_')) && this.config.categories.messages?.enabled) {
            if (this._isNearBottom(node)) this._animateNode(node, 'messages');
        } else if (cls.includes('reaction_') && this.config.categories.reactions?.enabled) {
            this._animateNode(node, 'reactions');
        } else if (cls.includes('privateChannels_') && this.config.categories.dmList?.enabled) {
            this._animateNode(node, 'dmList');
        } else if ((cls.includes('searchResult_') || (cls.includes('hit_') && cls.includes('search'))) && this.config.categories.searchResults?.enabled) {
            this._animateNode(node, 'searchResults');
        }
    }

    _animateNode(node, catKey) {
        const cfg = this.config.categories[catKey];
        if (!cfg?.enabled || cfg.animation === 'none') return;
        node.dataset.smA = '1';
        const dur = Math.round(cfg.duration * (this.config.intensity / 100));
        const delay = this._getStaggerDelay(catKey);
        node.style.animation = `sm-${cfg.animation} ${dur}ms ${this._resolveEasing(cfg)} both`;
        node.style.animationDelay = `${delay}ms`;
        this._stats.totalAnimated++;
        this._updateStatsDisplay();
        node.addEventListener('animationend', () => {
            node.style.animation = '';
            node.style.animationDelay = '';
        }, { once: true });
    }

    _getStaggerDelay(catKey) {
        const cfg = this.config.categories[catKey];
        if (!cfg?.stagger?.enabled || !SolariMotion.STAGGER_CATS.has(catKey)) return 0;
        let entry = this._staggerMap.get(catKey);
        if (!entry) { entry = { count: 0, timer: null }; this._staggerMap.set(catKey, entry); }
        clearTimeout(entry.timer);
        entry.timer = setTimeout(() => { entry.count = 0; }, 300);
        const max = cfg.stagger.maxItems ?? 8;
        if (entry.count >= max) return 0;
        return (entry.count++) * (cfg.stagger.delay ?? 35);
    }

    _isNearBottom(node) {
        const s = node.closest('[class*="scroller_"]') ?? document.querySelector('[class*="messagesWrapper_"]');
        if (!s) return true;
        return (s.scrollHeight - s.scrollTop - s.clientHeight) < 300;
    }

    _updateStatsDisplay() {
        // Use stable element IDs so updates work even after panel re-renders
        const el = document.getElementById('sm-stat-animated');
        if (el) el.textContent = this._stats.totalAnimated.toLocaleString();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FPS MONITOR
    // ═══════════════════════════════════════════════════════════════════════

    _startFPSMonitor() {
        if (!this.config.fpsProtection) return;
        let last = performance.now(), frames = 0;
        const tick = (now) => {
            frames++;
            if (now - last >= 1000) {
                this._fps = Math.round(frames * 1000 / (now - last));
                frames = 0; last = now;
            }
            this._fpsRAF = requestAnimationFrame(tick);
        };
        this._fpsRAF = requestAnimationFrame(tick);
    }

    _stopFPSMonitor() {
        if (this._fpsRAF) cancelAnimationFrame(this._fpsRAF);
        this._fpsRAF = null;
    }

    _isPerformanceOK() { return this._fps >= 30; }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    _debounce(fn, ms) {
        let t;
        return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    }

    _clonePreset(name) {
        if (name === 'off') {
            return Object.fromEntries(Object.keys(SolariMotion.CATEGORY_META).map(k => [k, {
                enabled: false, animation: 'fade', duration: 160, easing: 'smooth',
                customEasing: 'cubic-bezier(0.4,0,0.2,1)',
                stagger: { enabled: false, delay: 35, maxItems: 8 },
            }]));
        }
        return JSON.parse(JSON.stringify(SolariMotion.PRESETS[name]));
    }

    _applyPreset(name) {
        this.config.globalPreset = name;
        this.config.categories = this._clonePreset(name);
        document.documentElement.style.setProperty('--sm-int', this.config.intensity / 100);
        this.saveConfig();
        this._injectDynamicCSS();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SETTINGS PANEL 2.0
    // ═══════════════════════════════════════════════════════════════════════

    getSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'sm-panel';
        panel.appendChild(this._buildHeader());
        panel.appendChild(this._buildStatsBar());
        panel.appendChild(this._buildIntensitySection());
        panel.appendChild(this._buildPresetsSection());
        panel.appendChild(this._buildGlobalToggles());
        panel.appendChild(this._buildImportExportRow());
        panel.appendChild(this._buildCategorySection());
        return panel;
    }

    _buildHeader() {
        const el = document.createElement('div');
        el.className = 'sm-header';

        const logo = document.createElement('div');
        logo.className = 'sm-logo';
        logo.textContent = '✨';

        const info = document.createElement('div');
        info.className = 'sm-header-info';
        info.innerHTML = `
            <h2>Solari Motion</h2>
            <p>${this._t('header_subtitle')}</p>
        `;

        const langSelector = document.createElement('div');
        langSelector.className = 'sm-lang-selector';

        const btnEn = document.createElement('button');
        btnEn.className = `sm-lang-btn ${this.config.language === 'en' ? 'active' : ''}`;
        btnEn.textContent = 'EN';
        btnEn.title = 'English';
        btnEn.addEventListener('click', () => {
            if (this.config.language === 'en') return;
            this.config.language = 'en';
            this.saveConfig();
            el.closest('.sm-panel').replaceWith(this.getSettingsPanel());
        });

        const btnPt = document.createElement('button');
        btnPt.className = `sm-lang-btn ${this.config.language === 'pt' ? 'active' : ''}`;
        btnPt.textContent = 'PT';
        btnPt.title = 'Português';
        btnPt.addEventListener('click', () => {
            if (this.config.language === 'pt') return;
            this.config.language = 'pt';
            this.saveConfig();
            el.closest('.sm-panel').replaceWith(this.getSettingsPanel());
        });

        langSelector.appendChild(btnEn);
        langSelector.appendChild(btnPt);

        const badge = document.createElement('div');
        badge.className = 'sm-badge';
        badge.textContent = `v${SolariMotion.VERSION}`;

        el.appendChild(logo);
        el.appendChild(info);
        el.appendChild(langSelector);
        el.appendChild(badge);

        return el;
    }

    _buildStatsBar() {
        const bar = document.createElement('div');
        bar.className = 'sm-stats-bar';
        bar.id = 'sm-stats-bar';
        this._statsEl = bar;
        const active = Object.values(this.config.categories).filter(c => c.enabled).length;
        const total = Object.keys(SolariMotion.CATEGORY_META).length;
        const preset = this.config.globalPreset;
        const presetLabel = preset.charAt(0).toUpperCase() + preset.slice(1);
        bar.innerHTML = `
            <div class="sm-stat">
                <span class="sm-stat-count" id="sm-stat-animated">${this._stats.totalAnimated.toLocaleString()}</span>
                <span class="sm-stat-label">${this._t('stat_animated')}</span>
            </div>
            <div class="sm-stat-divider"></div>
            <div class="sm-stat">
                <span class="sm-stat-count" id="sm-stat-active">${active}/${total}</span>
                <span class="sm-stat-label">${this._t('stat_active')}</span>
            </div>
            <div class="sm-stat-divider"></div>
            <div class="sm-stat">
                <span class="sm-stat-count" id="sm-stat-intensity">${this.config.intensity}%</span>
                <span class="sm-stat-label">${this._t('stat_intensity')}</span>
            </div>
            <div class="sm-stat-divider"></div>
            <div class="sm-stat">
                <span class="sm-stat-count" id="sm-stat-preset">${presetLabel}</span>
                <span class="sm-stat-label">${this._t('stat_preset')}</span>
            </div>
        `;
        return bar;
    }

    _buildIntensitySection() {
        const sec = document.createElement('div');
        sec.style.marginBottom = '20px';
        sec.innerHTML = `<div class="sm-section-label">${this._t('sec_intensity')}</div>`;

        const row = document.createElement('div');
        row.className = 'sm-intensity-row';

        // Wrapper gives slider + track the SAME flex:1 width, so labels align exactly
        const sliderWrap = document.createElement('div');
        sliderWrap.className = 'sm-slider-wrap';

        const slider = document.createElement('input');
        slider.type = 'range'; slider.className = 'sm-slider';
        slider.min = 0; slider.max = 200; slider.step = 5;
        slider.value = this.config.intensity;

        const track = document.createElement('div');
        track.className = 'sm-intensity-track';
        track.innerHTML = `
            <span class="sm-int-label">${this._t('label_subtle')}</span>
            <span class="sm-int-label" style="left:50%;transform:translateX(-50%)">${this._t('label_normal')}</span>
            <span class="sm-int-label">${this._t('label_dramatic')}</span>
        `;

        sliderWrap.appendChild(slider);
        sliderWrap.appendChild(track);

        const val = document.createElement('span');
        val.className = 'sm-slider-val';
        val.textContent = `${this.config.intensity}%`;

        slider.addEventListener('input', () => { val.textContent = `${slider.value}%`; });
        slider.addEventListener('change', () => {
            this.config.intensity = parseInt(slider.value);
            document.documentElement.style.setProperty('--sm-int', this.config.intensity / 100);
            this.saveConfig();
            this._debouncedCSS();
            const statEl = document.getElementById('sm-stat-intensity');
            if (statEl) statEl.textContent = `${this.config.intensity}%`;
        });

        row.appendChild(sliderWrap);
        row.appendChild(val);
        sec.appendChild(row);
        return sec;
    }

    _buildPresetsSection() {
        const sec = document.createElement('div');
        sec.innerHTML = `<div class="sm-section-label">${this._t('sec_presets')}</div>`;
        const grid = document.createElement('div');
        grid.className = 'sm-presets';

        [
            { key: 'fluid', icon: '🌊', label: 'Fluid', subKey: 'preset_sub_fluid' },
            { key: 'snappy', icon: '⚡', label: 'Snappy', subKey: 'preset_sub_snappy' },
            { key: 'bounce', icon: '🎾', label: 'Bounce', subKey: 'preset_sub_bounce' },
            { key: 'minimal', icon: '🌫️', label: 'Minimal', subKey: 'preset_sub_minimal' },
            { key: 'off', icon: '🚫', label: 'Off', subKey: 'preset_sub_off' },
            { key: 'cinematic', icon: '🎬', label: 'Cinematic', subKey: 'preset_sub_cinematic' },
            { key: 'jelly', icon: '🫧', label: 'Jelly', subKey: 'preset_sub_jelly' },
            { key: 'gravity', icon: '🪐', label: 'Gravity', subKey: 'preset_sub_gravity' },
            { key: 'glass', icon: '🔮', label: 'Glass', subKey: 'preset_sub_glass' },
            { key: 'retro', icon: '📟', label: 'Retro', subKey: 'preset_sub_retro' },
            { key: 'zen', icon: '🧘', label: 'Zen', subKey: 'preset_sub_zen' },
            { key: 'sharp', icon: '🗡️', label: 'Sharp', subKey: 'preset_sub_sharp' },
            { key: 'cascade', icon: '🌊', label: 'Cascade', subKey: 'preset_sub_cascade' },
            { key: 'pendulum', icon: '🕰️', label: 'Pendulum', subKey: 'preset_sub_pendulum' },
        ].forEach(({ key, icon, label, subKey }) => {
            const btn = document.createElement('button');
            btn.className = `sm-preset-btn ${this.config.globalPreset === key ? 'active' : ''}`;
            btn.innerHTML = `<span class="sm-preset-icon">${icon}</span>${label}<br><span class="sm-preset-sub">${this._t(subKey)}</span>`;
            btn.addEventListener('click', () => {
                this._applyPreset(key);
                sec.closest('.sm-panel').replaceWith(this.getSettingsPanel());
            });
            grid.appendChild(btn);
        });

        sec.appendChild(grid);
        return sec;
    }

    _buildGlobalToggles() {
        const div = document.createElement('div');
        div.className = 'sm-toggles';
        [
            { key: 'performanceMode', labelKey: 'toggle_perf_label', subKey: 'toggle_perf_sub' },
            { key: 'fpsProtection', labelKey: 'toggle_fps_label', subKey: 'toggle_fps_sub' },
            { key: 'respectReducedMotion', labelKey: 'toggle_motion_label', subKey: 'toggle_motion_sub' },
        ].forEach(({ key, labelKey, subKey }) => {
            const card = document.createElement('div');
            card.className = 'sm-toggle-card';
            card.innerHTML = `
                <div>
                    <div class="sm-toggle-text">${this._t(labelKey)}</div>
                    <div class="sm-toggle-sub">${this._t(subKey)}</div>
                </div>
                <label class="sm-switch">
                    <input type="checkbox" ${this.config[key] ? 'checked' : ''}>
                    <span class="sm-switch-track"></span>
                </label>
            `;
            card.querySelector('input').addEventListener('change', (e) => {
                this.config[key] = e.target.checked;
                this.saveConfig();
                this._injectDynamicCSS();
                if (key === 'fpsProtection') {
                    e.target.checked ? this._startFPSMonitor() : this._stopFPSMonitor();
                }
            });
            div.appendChild(card);
        });
        return div;
    }

    _buildImportExportRow() {
        const row = document.createElement('div');
        row.className = 'sm-ie-row';

        const exportBtn = document.createElement('button');
        exportBtn.className = 'sm-ie-btn';
        exportBtn.innerHTML = this._t('btn_export');
        exportBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify(this.config, null, 2))
                .then(() => {
                    exportBtn.textContent = this._t('btn_copied');
                    setTimeout(() => { exportBtn.innerHTML = this._t('btn_export'); }, 2000);
                })
                .catch(() => BdApi.UI?.showToast(this._t('toast_copy_error'), { type: 'error' }));
        });

        const importBtn = document.createElement('button');
        importBtn.className = 'sm-ie-btn';
        importBtn.innerHTML = this._t('btn_import');
        importBtn.addEventListener('click', () => {
            const existing = row.querySelector('.sm-import-area');
            if (existing) { existing.remove(); return; }
            const area = document.createElement('div');
            area.className = 'sm-import-area';
            area.innerHTML = `
                <textarea class="sm-import-textarea" placeholder="${this._t('placeholder_import')}"></textarea>
                <button class="sm-ie-btn sm-apply-btn">${this._t('btn_apply')}</button>
            `;
            area.querySelector('.sm-apply-btn').addEventListener('click', () => {
                try {
                    const parsed = JSON.parse(area.querySelector('textarea').value);
                    const migrated = this._migrateConfig(parsed);
                    this.config = { ...this.config, ...migrated };
                    this.saveConfig();
                    this._injectDynamicCSS();
                    row.closest('.sm-panel').replaceWith(this.getSettingsPanel());
                } catch { BdApi.UI?.showToast(this._t('toast_invalid_json'), { type: 'error' }); }
            });
            row.appendChild(area);
        });

        const resetBtn = document.createElement('button');
        resetBtn.className = 'sm-ie-btn sm-reset-btn';
        resetBtn.innerHTML = this._t('btn_reset');
        resetBtn.addEventListener('click', () => {
            if (!confirm(this._t('confirm_reset'))) return;
            const currentLang = this.config.language;
            this.config = {
                configVersion: SolariMotion.CONFIG_VERSION,
                globalPreset: 'fluid', intensity: 100,
                performanceMode: false, fpsProtection: true, respectReducedMotion: true,
                language: currentLang,
                categories: this._clonePreset('fluid'),
            };
            document.documentElement.style.setProperty('--sm-int', 1);
            this.saveConfig();
            this._injectDynamicCSS();
            row.closest('.sm-panel').replaceWith(this.getSettingsPanel());
        });

        row.appendChild(exportBtn);
        row.appendChild(importBtn);
        row.appendChild(resetBtn);
        return row;
    }

    _buildCategorySection() {
        const sec = document.createElement('div');
        let activeGroup = 'all';

        const headerEl = document.createElement('div');
        headerEl.className = 'sm-section-label';
        headerEl.textContent = this._t('sec_categories');

        const chips = document.createElement('div');
        chips.className = 'sm-chips';

        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.className = 'sm-cat-search';
        searchBar.placeholder = this._t('placeholder_search');

        const catList = document.createElement('div');
        catList.className = 'sm-categories';

        const render = () => {
            catList.innerHTML = '';
            const q = searchBar.value.toLowerCase();
            for (const [key, meta] of Object.entries(SolariMotion.CATEGORY_META)) {
                const translatedLabel = this._t('cat_' + key + '_label');
                const translatedDesc = this._t('cat_' + key + '_desc');
                const inGroup = activeGroup === 'all' || meta.group === activeGroup;
                const inSearch = !q || translatedLabel.toLowerCase().includes(q) || translatedDesc.toLowerCase().includes(q);
                if (inGroup && inSearch) {
                    catList.appendChild(this._buildCategoryCard(key, meta, this.config.categories[key]));
                }
            }
        };

        [
            { key: 'all', labelKey: 'chip_all' },
            { key: 'navigation', labelKey: 'chip_nav' },
            { key: 'overlays', labelKey: 'chip_overlays' },
            { key: 'content', labelKey: 'chip_content' },
            { key: 'server', labelKey: 'chip_server' },
        ].forEach(({ key, labelKey }) => {
            const chip = document.createElement('button');
            chip.className = `sm-chip ${activeGroup === key ? 'active' : ''}`;
            chip.textContent = this._t(labelKey);
            chip.addEventListener('click', () => {
                activeGroup = key;
                chips.querySelectorAll('.sm-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                render();
            });
            chips.appendChild(chip);
        });

        searchBar.addEventListener('input', render);

        sec.appendChild(headerEl);
        sec.appendChild(chips);
        sec.appendChild(searchBar);
        sec.appendChild(catList);
        render();
        return sec;
    }

    _buildCategoryCard(key, meta, cat) {
        const card = document.createElement('div');
        card.className = `sm-cat-card ${cat.enabled ? 'enabled' : ''}`;

        const translatedLabel = this._t('cat_' + key + '_label');
        const translatedDesc = this._t('cat_' + key + '_desc');

        const header = document.createElement('div');
        header.className = 'sm-cat-header';
        header.innerHTML = `
            <span class="sm-cat-icon">${meta.icon}</span>
            <div style="flex:1;min-width:0">
                <div class="sm-cat-title">${translatedLabel}</div>
                <div class="sm-cat-desc">${translatedDesc}</div>
            </div>
            <span class="sm-cat-anim-chip">${cat.animation}</span>
            <label class="sm-switch" style="margin-right:8px">
                <input type="checkbox" ${cat.enabled ? 'checked' : ''}>
                <span class="sm-switch-track"></span>
            </label>
            <span class="sm-cat-arrow">▼</span>
        `;

        const checkbox = header.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            cat.enabled = checkbox.checked;
            this.config.categories[key] = cat;
            card.classList.toggle('enabled', cat.enabled);
            this.saveConfig();
            this._debouncedCSS();
            // Update 'Categories active' stat counter live
            const activeEl = document.getElementById('sm-stat-active');
            if (activeEl) {
                const activeCount = Object.values(this.config.categories).filter(c => c.enabled).length;
                const total = Object.keys(SolariMotion.CATEGORY_META).length;
                activeEl.textContent = `${activeCount}/${total}`;
            }
        });

        header.addEventListener('click', (e) => {
            if (e.target.closest('.sm-switch')) return;
            card.classList.toggle('expanded');
        });

        card.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'sm-cat-body';
        const grid = document.createElement('div');
        grid.className = 'sm-cat-body-grid';

        // Animation select
        grid.appendChild(this._buildSelect(this._t('field_animation'), 'animation', key, cat,
            Object.entries(SolariMotion.ANIMATION_LABELS).map(([v, l]) => ({ value: v, label: l })),
            (val) => {
                const chip = card.querySelector('.sm-cat-anim-chip');
                if (chip) chip.textContent = val;
            }
        ));

        // Easing select
        grid.appendChild(this._buildSelect(this._t('field_easing'), 'easing', key, cat,
            Object.entries(SolariMotion.EASING_LABELS).map(([v, l]) => ({ value: v, label: l })),
            (val) => {
                const wrap = card.querySelector('.sm-bezier-wrap');
                if (wrap) {
                    wrap.innerHTML = '';
                    if (val === 'custom') wrap.appendChild(this._buildBezierEditor(key, cat));
                }
            }
        ));

        // Duration (full width)
        const durWrap = document.createElement('div');
        durWrap.style.gridColumn = '1 / -1';
        durWrap.appendChild(this._buildSlider(this._t('field_duration'), 'duration', key, cat, 40, 800, 10, 'ms'));
        grid.appendChild(durWrap);

        // Bezier editor (full width, visible only when easing = custom)
        const bezierWrap = document.createElement('div');
        bezierWrap.className = 'sm-bezier-wrap';
        bezierWrap.style.gridColumn = '1 / -1';
        if (cat.easing === 'custom') bezierWrap.appendChild(this._buildBezierEditor(key, cat));
        grid.appendChild(bezierWrap);

        // Stagger (full width, only for supported categories)
        if (SolariMotion.STAGGER_CATS.has(key)) {
            const sw = document.createElement('div');
            sw.style.gridColumn = '1 / -1';
            sw.appendChild(this._buildStaggerControls(key, cat));
            grid.appendChild(sw);
        }

        // Preview button (full width)
        const pw = document.createElement('div');
        pw.style.gridColumn = '1 / -1';
        const previewBtn = document.createElement('button');
        previewBtn.className = 'sm-preview-btn';
        previewBtn.textContent = this._t('btn_preview');
        previewBtn.addEventListener('click', () => this._triggerLivePreview(cat, meta));
        pw.appendChild(previewBtn);
        grid.appendChild(pw);

        body.appendChild(grid);
        card.appendChild(body);
        return card;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CUBIC-BÉZIER EDITOR
    // ═══════════════════════════════════════════════════════════════════════

    _buildBezierEditor(catKey, cat) {
        const raw = cat.customEasing || 'cubic-bezier(0.4,0,0.2,1)';
        const m = raw.match(/cubic-bezier\(([^)]+)\)/);
        const v = m ? m[1].split(',').map(parseFloat) : [0.4, 0, 0.2, 1];
        const p1 = { x: v[0] ?? 0.4, y: v[1] ?? 0 };
        const p2 = { x: v[2] ?? 0.2, y: v[3] ?? 1 };

        const container = document.createElement('div');
        container.className = 'sm-bezier-container';

        const canvas = document.createElement('canvas');
        canvas.className = 'sm-bezier-canvas';
        canvas.width = 130; canvas.height = 130;

        const inputs = {};

        const commit = () => {
            const str = `cubic-bezier(${p1.x.toFixed(3)},${p1.y.toFixed(3)},${p2.x.toFixed(3)},${p2.y.toFixed(3)})`;
            cat.customEasing = str;
            this.config.categories[catKey] = cat;
            this.saveConfig();
            this._debouncedCSS();
            if (inputs.x1) inputs.x1.value = p1.x.toFixed(3);
            if (inputs.y1) inputs.y1.value = p1.y.toFixed(3);
            if (inputs.x2) inputs.x2.value = p2.x.toFixed(3);
            if (inputs.y2) inputs.y2.value = p2.y.toFixed(3);
            this._drawBezier(canvas, p1, p2);
        };

        // Pointer drag
        const pad = 15;
        let drag = null;
        const toVal = (e) => {
            const r = canvas.getBoundingClientRect();
            const sz = canvas.width - pad * 2;
            return { x: Math.max(0, Math.min(1, (e.clientX - r.left - pad) / sz)), y: Math.max(0, Math.min(1, 1 - (e.clientY - r.top - pad) / sz)) };
        };
        const dist = (e, pt) => {
            const r = canvas.getBoundingClientRect();
            const sz = canvas.width - pad * 2;
            return Math.hypot(e.clientX - r.left - pad - pt.x * sz, e.clientY - r.top - pad - (1 - pt.y) * sz);
        };
        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            drag = dist(e, p1) < 14 ? 'p1' : dist(e, p2) < 14 ? 'p2' : null;
            if (drag) canvas.setPointerCapture(e.pointerId);
        });
        canvas.addEventListener('pointermove', (e) => {
            if (!drag) return;
            const v = toVal(e);
            if (drag === 'p1') { p1.x = v.x; p1.y = v.y; }
            else { p2.x = v.x; p2.y = v.y; }
            commit();
        });
        canvas.addEventListener('pointerup', () => { drag = null; });
        this._drawBezier(canvas, p1, p2);

        // Controls panel
        const controls = document.createElement('div');
        controls.className = 'sm-bezier-controls';

        // Numeric inputs
        const inputGrid = document.createElement('div');
        inputGrid.className = 'sm-bezier-inputs';
        [
            { id: 'x1', label: 'P1 X', obj: p1, f: 'x' },
            { id: 'y1', label: 'P1 Y', obj: p1, f: 'y' },
            { id: 'x2', label: 'P2 X', obj: p2, f: 'x' },
            { id: 'y2', label: 'P2 Y', obj: p2, f: 'y' },
        ].forEach(({ id, label, obj, f }) => {
            const wrap = document.createElement('div');
            wrap.className = 'sm-bezier-input-wrap';
            wrap.innerHTML = `<span class="sm-field-label">${label}</span>`;
            const inp = document.createElement('input');
            inp.type = 'number'; inp.className = 'sm-bezier-num';
            inp.min = -2; inp.max = 2; inp.step = 0.01;
            inp.value = obj[f].toFixed(3);
            inputs[id] = inp;
            inp.addEventListener('change', () => {
                obj[f] = parseFloat(inp.value) || 0;
                commit();
            });
            wrap.appendChild(inp);
            inputGrid.appendChild(wrap);
        });
        controls.appendChild(inputGrid);

        // Preset chips
        const presetWrap = document.createElement('div');
        presetWrap.className = 'sm-bezier-presets';
        [
            ['Material', [0.4, 0, 0.2, 1]],
            ['Snappy', [0.25, 0.46, 0.45, 0.94]],
            ['Bounce', [0.34, 1.56, 0.64, 1]],
            ['Elastic', [0.68, -0.55, 0.265, 1.55]],
            ['EaseOut', [0, 0, 0.2, 1]],
            ['EaseIn', [0.4, 0, 1, 1]],
            ['EaseInOut', [0.4, 0, 0.6, 1]],
            ['Linear', [0, 0, 1, 1]],
        ].forEach(([label, vals]) => {
            const chip = document.createElement('button');
            chip.className = 'sm-bezier-chip';
            chip.textContent = label;
            chip.addEventListener('click', () => {
                p1.x = vals[0]; p1.y = vals[1];
                p2.x = vals[2]; p2.y = vals[3];
                commit();
            });
            presetWrap.appendChild(chip);
        });
        controls.appendChild(presetWrap);

        container.appendChild(canvas);
        container.appendChild(controls);
        return container;
    }

    _drawBezier(canvas, p1, p2) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height, pad = 15;
        const sz = w - pad * 2;
        const cx = (v) => pad + v * sz;
        const cy = (v) => h - pad - v * sz;
        ctx.clearRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const x = pad + (i / 4) * sz, y = pad + (i / 4) * sz;
            ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
        }

        // Diagonal ref
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(cx(0), cy(0)); ctx.lineTo(cx(1), cy(1)); ctx.stroke();
        ctx.setLineDash([]);

        // Control lines
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(cx(0), cy(0)); ctx.lineTo(cx(p1.x), cy(p1.y)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx(1), cy(1)); ctx.lineTo(cx(p2.x), cy(p2.y)); ctx.stroke();
        ctx.setLineDash([]);

        // Curve
        const grad = ctx.createLinearGradient(cx(0), cy(0), cx(1), cy(1));
        grad.addColorStop(0, '#ff6b35');
        grad.addColorStop(1, '#f7931e');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx(0), cy(0));
        ctx.bezierCurveTo(cx(p1.x), cy(p1.y), cx(p2.x), cy(p2.y), cx(1), cy(1));
        ctx.stroke();

        // Control points
        [[p1, '#3b82f6'], [p2, '#10b981']].forEach(([pt, color]) => {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(cx(pt.x), cy(pt.y), 6, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
        });

        // Anchor dots
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        [[0, 0], [1, 1]].forEach(([x, y]) => {
            ctx.beginPath(); ctx.arc(cx(x), cy(y), 3.5, 0, Math.PI * 2); ctx.fill();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGGER CONTROLS
    // ═══════════════════════════════════════════════════════════════════════

    _buildStaggerControls(catKey, cat) {
        const stagger = cat.stagger ?? { enabled: false, delay: 35, maxItems: 8 };
        cat.stagger = stagger;

        const sec = document.createElement('div');
        sec.className = 'sm-stagger-section';

        const headerRow = document.createElement('div');
        headerRow.className = 'sm-stagger-header';
        headerRow.innerHTML = `
            <div>
                <span class="sm-stagger-title">${this._t('field_stagger_title')}</span>
                <span class="sm-stagger-sub">${this._t('field_stagger_sub')}</span>
            </div>
            <label class="sm-switch">
                <input type="checkbox" ${stagger.enabled ? 'checked' : ''}>
                <span class="sm-switch-track"></span>
            </label>
        `;

        const controls = document.createElement('div');
        controls.className = 'sm-stagger-controls';
        controls.style.display = stagger.enabled ? 'grid' : 'none';

        const itemSuffix = this.config.language === 'pt' ? ' itens' : ' items';
        const delaySlider = this._buildSlider(this._t('field_delay'), 'delay', catKey, stagger, 10, 150, 5, 'ms');
        const maxSlider = this._buildSlider(this._t('field_max_items'), 'maxItems', catKey, stagger, 2, 20, 1, itemSuffix);

        const onStaggerChange = () => {
            this.config.categories[catKey].stagger = stagger;
            this.saveConfig();
        };

        delaySlider.querySelector('.sm-slider').addEventListener('change', onStaggerChange);
        maxSlider.querySelector('.sm-slider').addEventListener('change', onStaggerChange);

        const checkbox = headerRow.querySelector('input');
        checkbox.addEventListener('change', () => {
            stagger.enabled = checkbox.checked;
            controls.style.display = stagger.enabled ? 'grid' : 'none';
            onStaggerChange();
        });

        controls.appendChild(delaySlider);
        controls.appendChild(maxSlider);
        sec.appendChild(headerRow);
        sec.appendChild(controls);
        return sec;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIVE PREVIEW OVERLAY
    // ═══════════════════════════════════════════════════════════════════════

    _triggerLivePreview(cat, meta) {
        document.querySelector('.sm-preview-overlay')?.remove();

        const dur = Math.round(cat.duration * (this.config.intensity / 100));
        const easing = this._resolveEasing(cat);

        const key = Object.keys(SolariMotion.CATEGORY_META).find(k => SolariMotion.CATEGORY_META[k] === meta) || '';
        const translatedLabel = key ? this._t('cat_' + key + '_label') : meta.label;
        const previewWord = this.config.language === 'pt' ? 'Visualização' : 'Preview';
        const poweredText = this.config.language === 'pt' ? 'Desenvolvido por Solari Motion' : 'Powered by Solari Motion';

        const overlay = document.createElement('div');
        overlay.className = 'sm-preview-overlay';
        overlay.innerHTML = `
            <div class="sm-preview-backdrop"></div>
            <div class="sm-preview-label">${meta.icon} ${translatedLabel} ${previewWord} — ${cat.animation} · ${dur}ms</div>
            <div class="sm-preview-mock">
                <div class="sm-mock-avatar"></div>
                <div class="sm-mock-content">
                    <div class="sm-mock-name">TheDroid <span class="sm-mock-time">Today at 23:00</span></div>
                    <div class="sm-mock-text">${this._t('preview_mock_text')}</div>
                    <div class="sm-mock-text sm-mock-text-2">${poweredText} v${SolariMotion.VERSION}</div>
                </div>
            </div>
            <div class="sm-preview-hint">${this._t('preview_dismiss')}</div>
        `;

        const mock = overlay.querySelector('.sm-preview-mock');
        mock.style.animation = `sm-${cat.animation} ${dur}ms ${easing} both`;

        overlay.addEventListener('click', () => overlay.remove());
        mock.addEventListener('animationend', () => {
            setTimeout(() => {
                mock.style.animation = 'sm-fade 280ms ease-out reverse both';
                setTimeout(() => overlay.remove(), 300);
            }, 900);
        }, { once: true });

        document.body.appendChild(overlay);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FIELD BUILDERS
    // ═══════════════════════════════════════════════════════════════════════

    _buildSelect(label, prop, catKey, cat, options, onChangeCb) {
        const field = document.createElement('div');
        field.className = 'sm-field';
        field.innerHTML = `<div class="sm-field-label">${label}</div>`;

        const select = document.createElement('select');
        select.className = 'sm-select';
        options.forEach(({ value, label: lbl }) => {
            const opt = document.createElement('option');
            opt.value = value; opt.textContent = lbl;
            if (cat[prop] === value) opt.selected = true;
            select.appendChild(opt);
        });

        select.addEventListener('change', () => {
            cat[prop] = select.value;
            this.config.categories[catKey] = cat;
            this.saveConfig();
            this._debouncedCSS();
            if (onChangeCb) onChangeCb(select.value);
        });

        field.appendChild(select);
        return field;
    }

    _buildSlider(label, prop, catKey, obj, min, max, step, suffix = '') {
        const field = document.createElement('div');
        field.className = 'sm-field';
        field.innerHTML = `<div class="sm-field-label">${label}</div>`;

        const row = document.createElement('div');
        row.className = 'sm-slider-row';

        const slider = document.createElement('input');
        slider.type = 'range'; slider.className = 'sm-slider';
        slider.min = min; slider.max = max; slider.step = step;
        slider.value = obj[prop] ?? 200;

        const val = document.createElement('span');
        val.className = 'sm-slider-val';
        val.textContent = `${slider.value}${suffix}`;

        slider.addEventListener('input', () => { val.textContent = `${slider.value}${suffix}`; });
        slider.addEventListener('change', () => {
            obj[prop] = parseFloat(slider.value);
            if (catKey) { this.config.categories[catKey] = obj; }
            this.saveConfig();
            this._debouncedCSS();
        });

        row.appendChild(slider);
        row.appendChild(val);
        field.appendChild(row);
        return field;
    }
};
