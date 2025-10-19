/**
 * Multi-Language Support System
 * Provides automatic language detection and translation capabilities
 * for Spanish, French, and Mandarin speaking customers
 */

class MultiLanguageSupport {
    constructor() {
        this.currentLanguage = 'en';
        this.supportedLanguages = ['en', 'es', 'fr', 'zh'];
        this.translations = new Map();
        this.detectionEnabled = true;
        this.init();
    }

    async init() {
        console.log('🌍 Initializing Multi-Language Support...');
        await this.loadTranslations();
        this.setupLanguageDetection();
        this.setupUILanguageSwitcher();
        console.log('✅ Multi-Language Support ready');
    }

    async loadTranslations() {
        // Load translation dictionaries for each supported language
        const translations = {
            en: {
                // English (default)
                welcome: "Welcome to our restaurant!",
                booking: "I'd like to make a reservation",
                menu: "Could you tell me about your menu?",
                hours: "What are your hours?",
                location: "Where are you located?",
                phone: "What's your phone number?",
                thank_you: "Thank you for calling!",
                goodbye: "Have a great day!",
                reservation_confirmation: "Your reservation has been confirmed",
                party_size: "How many people?",
                date_time: "What date and time?",
                name: "What name should I put the reservation under?",
                contact: "What's the best number to reach you?",
                special_requests: "Any special requests or dietary restrictions?",
                reservation_success: "Perfect! Your reservation is confirmed for {date} at {time} for {party} people under {name}.",
                ai_greeting: "Hello! I'm your AI assistant. How can I help you today?",
                menu_specials: "Today's specials include fresh seafood and our signature pasta dishes.",
                hours_response: "We're open Monday through Sunday, 11 AM to 10 PM.",
                location_response: "We're located at 123 Main Street, downtown. Free parking available.",
                processing: "Let me help you with that...",
                error: "I apologize, could you please repeat that?",
                language_detected: "I detected you're speaking {language}. Switching to {language} now.",
                language_switch: "Switching to {language}"
            },
            es: {
                // Spanish
                welcome: "¡Bienvenido a nuestro restaurante!",
                booking: "Me gustaría hacer una reserva",
                menu: "¿Podrías hablarme sobre su menú?",
                hours: "¿Cuáles son sus horarios?",
                location: "¿Dónde están ubicados?",
                phone: "¿Cuál es su número de teléfono?",
                thank_you: "¡Gracias por llamar!",
                goodbye: "¡Que tenga un buen día!",
                reservation_confirmation: "Su reserva ha sido confirmada",
                party_size: "¿Para cuántas personas?",
                date_time: "¿Qué fecha y hora?",
                name: "¿A nombre de quién hago la reserva?",
                contact: "¿Cuál es el mejor número para contactarle?",
                special_requests: "¿Alguna solicitud especial o restricciones dietéticas?",
                reservation_success: "¡Perfecto! Su reserva está confirmada para el {date} a las {time} para {party} personas a nombre de {name}.",
                ai_greeting: "¡Hola! Soy su asistente de IA. ¿Cómo puedo ayudarle hoy?",
                menu_specials: "Los especiales de hoy incluyen mariscos frescos y nuestros platos de pasta exclusivos.",
                hours_response: "Estamos abiertos de lunes a domingo, de 11 AM a 10 PM.",
                location_response: "Estamos ubicados en 123 Main Street, en el centro. Estacionamiento gratuito disponible.",
                processing: "Permíteme ayudarte con eso...",
                error: "Disculpe, ¿podría repetir eso por favor?",
                language_detected: "Detecté que habla {language}. Cambiando a {language} ahora.",
                language_switch: "Cambiando a {language}"
            },
            fr: {
                // French
                welcome: "Bienvenue dans notre restaurant !",
                booking: "J'aimerais faire une réservation",
                menu: "Pourriez-vous me parler de votre menu ?",
                hours: "Quels sont vos horaires ?",
                location: "Où êtes-vous situés ?",
                phone: "Quel est votre numéro de téléphone ?",
                thank_you: "Merci d'avoir appelé !",
                goodbye: "Passez une excellente journée !",
                reservation_confirmation: "Votre réservation a été confirmée",
                party_size: "Pour combien de personnes ?",
                date_time: "Quelle date et heure ?",
                name: "Sous quel nom dois-je faire la réservation ?",
                contact: "Quel est le meilleur numéro pour vous joindre ?",
                special_requests: "Des demandes spéciales ou restrictions alimentaires ?",
                reservation_success: "Parfait ! Votre réservation est confirmée pour le {date} à {time} pour {party} personnes sous le nom de {name}.",
                ai_greeting: "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?",
                menu_specials: "Les spéciaux d'aujourd'hui incluent des fruits de mer frais et nos plats de pâtes signature.",
                hours_response: "Nous sommes ouverts du lundi au dimanche, de 11h à 22h.",
                location_response: "Nous sommes situés au 123 Main Street, centre-ville. Parking gratuit disponible.",
                processing: "Laissez-moi vous aider avec cela...",
                error: "Je m'excuse, pourriez-vous répéter cela s'il vous plaît ?",
                language_detected: "J'ai détecté que vous parlez {language}. Basculement vers {language} maintenant.",
                language_switch: "Basculement vers {language}"
            },
            zh: {
                // Mandarin Chinese (Simplified)
                welcome: "欢迎来到我们的餐厅！",
                booking: "我想预订一张桌子",
                menu: "能告诉我你们的菜单吗？",
                hours: "你们的营业时间是什么？",
                location: "你们在哪里？",
                phone: "你们的电话号码是多少？",
                thank_you: "感谢您的来电！",
                goodbye: "祝您有美好的一天！",
                reservation_confirmation: "您的预订已确认",
                party_size: "几个人？",
                date_time: "什么日期和时间？",
                name: "预订在谁的名下？",
                contact: "联系您最好的电话号码是什么？",
                special_requests: "有什么特殊要求或饮食限制吗？",
                reservation_success: "完美！您的预订已确认，{date} {time}，{party}人，预订人：{name}。",
                ai_greeting: "您好！我是您的AI助手。今天我能为您做些什么？",
                menu_specials: "今天的特色菜包括新鲜海鲜和我们的招牌意面。",
                hours_response: "我们周一到周日营业，上午11点到晚上10点。",
                location_response: "我们位于市中心主街123号。提供免费停车。",
                processing: "让我来帮您处理...",
                error: "抱歉，您能再说一遍吗？",
                language_detected: "我检测到您在说{language}。现在切换到{language}。",
                language_switch: "切换到{language}"
            }
        };

        // Store translations
        for (const [lang, translations_obj] of Object.entries(translations)) {
            this.translations.set(lang, translations_obj);
        }

        console.log('📚 Loaded translations for', this.supportedLanguages.length, 'languages');
    }

    detectLanguage(text) {
        // Simple language detection based on common patterns and keywords
        const detectionPatterns = {
            es: [
                'hola', 'gracias', 'por favor', 'disculpe', 'quiero', 'necesito',
                'reserva', 'mesa', 'comida', 'cena', 'almuerzo', 'personas',
                'horario', 'ubicación', 'teléfono', 'menú', 'especiales',
                'sí', 'no', 'bueno', 'perfecto'
            ],
            fr: [
                'bonjour', 'merci', 's\'il vous plaît', 'excusez-moi', 'je veux', 'j\'ai besoin',
                'réservation', 'table', 'nourriture', 'dîner', 'déjeuner', 'personnes',
                'horaires', 'lieu', 'téléphone', 'menu', 'spéciaux',
                'oui', 'non', 'bien', 'parfait'
            ],
            zh: [
                '你好', '谢谢', '请', '对不起', '我想', '我需要',
                '预订', '桌子', '食物', '晚餐', '午餐', '人',
                '时间', '地点', '电话', '菜单', '特色',
                '是', '不是', '好', '完美'
            ]
        };

        const textLower = text.toLowerCase();
        const scores = {};

        // Initialize scores
        for (const lang of this.supportedLanguages) {
            if (lang !== 'en') {
                scores[lang] = 0;
            }
        }

        // Check for patterns
        for (const [lang, patterns] of Object.entries(detectionPatterns)) {
            for (const pattern of patterns) {
                if (textLower.includes(pattern)) {
                    scores[lang] = (scores[lang] || 0) + 1;
                }
            }
        }

        // Find language with highest score
        let detectedLanguage = 'en'; // Default to English
        let maxScore = 0;

        for (const [lang, score] of Object.entries(scores)) {
            if (score > maxScore && score >= 2) { // Require at least 2 matches
                detectedLanguage = lang;
                maxScore = score;
            }
        }

        console.log('🔍 Language detection results:', scores, '→', detectedLanguage);
        return detectedLanguage;
    }

    async switchLanguage(languageCode) {
        if (!this.supportedLanguages.includes(languageCode)) {
            console.warn('⚠️ Unsupported language:', languageCode);
            return false;
        }

        const oldLanguage = this.currentLanguage;
        this.currentLanguage = languageCode;

        // Update UI elements
        this.updateUILanguage();

        // Emit language change event
        const event = new CustomEvent('languageChanged', {
            detail: { 
                from: oldLanguage, 
                to: languageCode,
                translations: this.translations.get(languageCode)
            }
        });
        document.dispatchEvent(event);

        console.log(`🌍 Language switched from ${oldLanguage} to ${languageCode}`);
        
        // Show notification
        if (window.safeNotify) {
            const message = this.translate('language_switch').replace('{language}', this.getLanguageName(languageCode));
            window.safeNotify(message, 'info');
        }

        return true;
    }

    translate(key, replacements = {}) {
        const currentTranslations = this.translations.get(this.currentLanguage) || this.translations.get('en');
        let translation = currentTranslations[key] || key;

        // Apply replacements
        for (const [placeholder, value] of Object.entries(replacements)) {
            translation = translation.replace(`{${placeholder}}`, value);
        }

        return translation;
    }

    getLanguageName(code) {
        const names = {
            en: 'English',
            es: 'Español',
            fr: 'Français',
            zh: '中文'
        };
        return names[code] || code;
    }

    setupLanguageDetection() {
        // Listen for conversation events to auto-detect language
        document.addEventListener('conversationStarted', (event) => {
            const { transcript } = event.detail;
            if (this.detectionEnabled && transcript && transcript.length > 10) {
                const detectedLang = this.detectLanguage(transcript);
                if (detectedLang !== this.currentLanguage) {
                    this.switchLanguage(detectedLang);
                }
            }
        });

        // Listen for text input to detect language changes
        document.addEventListener('textInput', (event) => {
            const { text } = event.detail;
            if (this.detectionEnabled && text && text.length > 20) {
                const detectedLang = this.detectLanguage(text);
                if (detectedLang !== this.currentLanguage && this.currentLanguage === 'en') {
                    // Only auto-switch from English to avoid ping-ponging
                    this.switchLanguage(detectedLang);
                }
            }
        });
    }

    setupUILanguageSwitcher() {
        // Create language switcher UI
        const languageSwitcher = document.createElement('div');
        languageSwitcher.className = 'language-switcher';
        languageSwitcher.innerHTML = `
            <div class="language-selector">
                <button class="current-language" id="current-language-btn">
                    <span class="language-icon">🌍</span>
                    <span class="language-name">${this.getLanguageName(this.currentLanguage)}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="language-dropdown" id="language-dropdown" style="display: none;">
                    ${this.supportedLanguages.map(lang => `
                        <button class="language-option ${lang === this.currentLanguage ? 'active' : ''}" 
                                data-language="${lang}">
                            <span class="language-flag">${this.getLanguageFlag(lang)}</span>
                            <span class="language-text">${this.getLanguageName(lang)}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add to page
        const container = document.querySelector('.main-container') || document.body;
        container.appendChild(languageSwitcher);

        // Setup event listeners
        const currentLangBtn = document.getElementById('current-language-btn');
        const dropdown = document.getElementById('language-dropdown');

        currentLangBtn.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Language option clicks
        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.language-option');
            if (option) {
                const selectedLang = option.dataset.language;
                this.switchLanguage(selectedLang);
                dropdown.style.display = 'none';
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!languageSwitcher.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Add styles
        this.addLanguageSwitcherStyles();
    }

    getLanguageFlag(code) {
        const flags = {
            en: '🇺🇸',
            es: '🇪🇸',
            fr: '🇫🇷',
            zh: '🇨🇳'
        };
        return flags[code] || '🌍';
    }

    updateUILanguage() {
        // Update language switcher
        const currentLangBtn = document.getElementById('current-language-btn');
        if (currentLangBtn) {
            const nameSpan = currentLangBtn.querySelector('.language-name');
            if (nameSpan) {
                nameSpan.textContent = this.getLanguageName(this.currentLanguage);
            }
        }

        // Update language options active state
        const options = document.querySelectorAll('.language-option');
        options.forEach(option => {
            option.classList.toggle('active', option.dataset.language === this.currentLanguage);
        });

        // Update translatable elements
        const translatableElements = document.querySelectorAll('[data-translate]');
        translatableElements.forEach(element => {
            const key = element.dataset.translate;
            const translation = this.translate(key);
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'email')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
    }

    addLanguageSwitcherStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .language-switcher {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                font-family: system-ui, -apple-system, sans-serif;
            }

            .language-selector {
                position: relative;
            }

            .current-language {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .current-language:hover {
                background: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .language-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 4px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                min-width: 150px;
            }

            .language-option {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 10px 12px;
                background: white;
                border: none;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s ease;
                text-align: left;
            }

            .language-option:hover {
                background: #f3f4f6;
            }

            .language-option.active {
                background: #eff6ff;
                color: #2563eb;
                font-weight: 500;
            }

            .language-icon, .language-flag {
                font-size: 16px;
            }

            .dropdown-arrow {
                font-size: 12px;
                transition: transform 0.2s ease;
            }

            @media (max-width: 768px) {
                .language-switcher {
                    top: 10px;
                    right: 10px;
                }
                
                .current-language {
                    padding: 6px 10px;
                    font-size: 13px;
                }
                
                .language-option {
                    padding: 8px 10px;
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Integration with conversation system
    processConversationInLanguage(text, language = null) {
        const targetLang = language || this.currentLanguage;
        
        // Create a context object with language-specific responses
        const context = {
            language: targetLang,
            translations: this.translations.get(targetLang),
            greeting: this.translate('ai_greeting'),
            processingMessage: this.translate('processing'),
            errorMessage: this.translate('error')
        };

        return context;
    }

    generateMultilingualResponse(intent, data = {}) {
        // Generate responses based on current language
        const responses = {
            greeting: this.translate('ai_greeting'),
            booking_request: this.translate('reservation_confirmation'),
            menu_inquiry: this.translate('menu_specials'),
            hours_inquiry: this.translate('hours_response'),
            location_inquiry: this.translate('location_response'),
            booking_success: this.translate('reservation_success', data)
        };

        return responses[intent] || this.translate('error');
    }

    // Get current language status
    getStatus() {
        return {
            currentLanguage: this.currentLanguage,
            supportedLanguages: this.supportedLanguages,
            detectionEnabled: this.detectionEnabled,
            availableTranslations: Array.from(this.translations.keys())
        };
    }

    // Enable/disable automatic language detection
    toggleAutoDetection(enabled) {
        this.detectionEnabled = enabled;
        console.log(`🌍 Auto language detection ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Initialize multi-language support
window.multiLanguageSupport = new MultiLanguageSupport();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiLanguageSupport;
}

console.log('🌍 Multi-Language Support system loaded');