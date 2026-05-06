/**
 * Configuración y utilidades para la integración con Telegram.
 * Permite enviar notificaciones automáticas sobre canales caídos y anuncios de nuevo contenido.
 */

export const escapeHTML = (str) => {
    if (!str) return '';
    const text = String(str);
    return text.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
};

const TELEGRAM_CONFIG = {
    // El usuario debe obtener estos datos de @BotFather y @userinfobot (o similares)
    botToken: localStorage.getItem('animux_tg_token') || '8608823641:AAHyTI_O3ffmzSoIdPS8XZPCc8245eP67p4',
    chatId: localStorage.getItem('animux_tg_chatid') || '-1003830198834',
};

/**
 * Envía un mensaje (opcionalmente con foto y botón) a través del bot de Telegram.
 * @param {string} text - El contenido del mensaje (soporta HTML).
 * @param {string} imageUrl - URL de la imagen a enviar (póster/logo).
 * @param {Object} button - Objeto con { text, url } para añadir un botón de acción.
 */
export const sendTelegramMessage = async (text, imageUrl = null, button = null) => {
    const { botToken, chatId } = TELEGRAM_CONFIG;
    
    if (!botToken || !chatId) {
        console.warn('⚠️ Telegram no configurado. Falta Token o ChatID.');
        return false;
    }

    try {
        const endpoint = imageUrl ? 'sendPhoto' : 'sendMessage';
        const body = {
            chat_id: chatId,
            parse_mode: 'HTML',
        };

        if (imageUrl) {
            body.photo = imageUrl;
            // Telegram limita los captions de fotos a 1024 caracteres
            body.caption = text.length > 1024 ? text.substring(0, 1021) + '...' : text;
        } else {
            body.text = text;
            body.disable_web_page_preview = false;
        }

        if (button) {
            body.reply_markup = {
                inline_keyboard: [[
                    { text: button.text, url: button.url }
                ]]
            };
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (!data.ok) {
            console.error('❌ Error de Telegram:', data.description);
            // Mostrar el error exacto para diagnóstico
            alert(`❌ Error de Telegram: ${data.description}`);
            
            // Si falló por la foto, intentar enviar solo el texto como respaldo
            if (imageUrl && (data.description.includes('wrong file identifier') || data.description.includes('failed to get HTTP'))) {
                console.log('⚠️ Reintentando sin imagen...');
                return sendTelegramMessage(text, null, button);
            }
            throw new Error(data.description);
        }
        
        console.log('✅ Notificación de Telegram enviada con éxito');
        return true;
    } catch (error) {
        console.error('❌ Error al enviar notificación de Telegram:', error);
        return false;
    }
};

/**
 * Guarda la configuración de Telegram en localStorage para persistencia.
 */
export const saveTelegramConfig = (token, id) => {
    localStorage.setItem('animux_tg_token', token);
    localStorage.setItem('animux_tg_chatid', id);
    TELEGRAM_CONFIG.botToken = token;
    TELEGRAM_CONFIG.chatId = id;
};

/**
 * Obtiene la configuración actual.
 */
export const getTelegramConfig = () => ({
    botToken: localStorage.getItem('animux_tg_token') || '8608823641:AAHyTI_O3ffmzSoIdPS8XZPCc8245eP67p4',
    chatId: localStorage.getItem('animux_tg_chatid') || '1987813368',
});
