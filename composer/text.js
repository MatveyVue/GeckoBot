const { Composer } = require('telegraf');
const axios = require('axios');

const composer = new Composer();
console.log('🦎 Gecko bot loaded');

const API_KEY = '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';

async function callAI(prompt) {
    try {
        const { data } = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Твое имя Gecko. Ты умный AI помощник в Telegram боте. Отвечай кратко. Всегда говори что тебя зовут Gecko когда спрашивают о твоем имени.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 300
        }, {
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
            timeout: 10000
        });
        return data.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response.";
    } catch {
        return "I'm having trouble connecting right now.";
    }
}

const msg = '🦎 Welcome to GeckoGram';
const keyboard = { reply_markup: { inline_keyboard: [[{ text: '🦎 Go App', url: 'https://t.me/GeckoGramRobot/GeckoGram' }]] } };

composer.start(async (ctx) => {
    try {
        await ctx.replyWithPhoto('https://github.com/MatveyVue/GeckoNumbers/blob/main/Gecko.jpg?raw=true', { caption: msg, parse_mode: 'Markdown', ...keyboard });
    } catch {
        await ctx.reply(msg, { parse_mode: 'Markdown', ...keyboard });
    }
});

const isNameQuestion = (text) => /(как тебя зовут|твое имя|your name|who are you)/i.test(text);
const isGjob = (text) => /^(gjob|джоб)$/i.test(text);
const basicCommands = { ping: '🏓 Pong!', test: '✅ Working!', hello: '👋 Hello! I\'m Gjob!', hi: '👋 Hi! I\'m Gjob!' };

composer.on('text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return;
    
    const isPrivate = ctx.chat.type === 'private';
    const botName = ctx.botInfo?.username || 'GeckoGramRobot';
    const mentioned = text.includes(`@${botName}`);
    
    if (!isPrivate && !mentioned && !ctx.message.reply_to_message?.from?.id === ctx.botInfo.id) return;
    
    const cleanText = (!isPrivate ? text.replace(`@${botName}`, '') : text).trim();
    if (!cleanText) return ctx.reply('🦎 Да, это я! Gecko ваш помощник!');
    
    const lower = cleanText.toLowerCase();
    
    if (isNameQuestion(cleanText)) return ctx.reply('🦎 Меня зовут Gecko!');
    if (isGjob(cleanText)) return ctx.reply('🦎 Да, это я! Gecko ваш помощник!');
    
    const cmd = basicCommands[lower];
    if (cmd) return ctx.reply(cmd);
    
    await ctx.sendChatAction('typing');
    ctx.reply(await callAI(cleanText));
});

// Обработка реплаев
composer.on('reply_to_message', async (ctx) => {
    if (ctx.message.reply_to_message?.from?.id !== ctx.botInfo.id || ctx.message.text.startsWith('/')) return;
    await ctx.sendChatAction('typing');
    ctx.reply(await callAI(ctx.message.text));
});

module.exports = composer;
