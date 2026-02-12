const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();

const BOT_TOKEN = '8562062268:AAFaOBBeSL17eHWQEYjRhsiCApuwdLnmKhY';
const bot = new Telegraf(BOT_TOKEN);

console.log('🤖 Bot initializing...');

// Middleware
app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Подключаем обработчики
try {
  bot.use(require('./composer/text.js'));
  console.log('✅ Composer loaded successfully');
} catch (error) {
  console.error('❌ Failed to load composer:', error.message);
  process.exit(1);
}

// Главная страница
app.get('/', (req, res) => {
  console.log('🏠 Home page accessed');
  res.send('Gecko Bot is running on Vercel');
});

// Проверка вебхука
app.get('/getwebhookinfo', async (req, res) => {
  try {
    console.log('🔍 Getting webhook info...');
    const info = await bot.telegram.getWebhookInfo();
    console.log('📊 Webhook info:', info);
    res.json(info);
  } catch (error) {
    console.error('❌ Error getting webhook info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Установка вебхука
app.get('/setup', async (req, res) => {
  try {
    const webhookUrl = `https://geckobot.vercel.app/bot${BOT_TOKEN}`;
    console.log('🔧 Setting webhook to:', webhookUrl);
    
    await bot.telegram.setWebhook(webhookUrl);
    const info = await bot.telegram.getWebhookInfo();
    
    console.log('✅ Webhook set successfully:', info);
    res.json({ 
      success: true, 
      message: 'Webhook установлен!',
      webhookUrl,
      info 
    });
  } catch (error) {
    console.error('❌ Failed to set webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удаление вебхука
app.get('/deletewebhook', async (req, res) => {
  try {
    console.log('🗑️ Deleting webhook...');
    await bot.telegram.deleteWebhook();
    console.log('✅ Webhook deleted');
    res.json({ success: true, message: 'Webhook удален!' });
  } catch (error) {
    console.error('❌ Failed to delete webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Тестовый эндпоинт
app.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing bot...');
    const me = await bot.telegram.getMe();
    console.log('✅ Bot info:', me);
    res.json({ 
      success: true, 
      bot: me,
      message: 'Бот работает!'
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Вебхук endpoint
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {
  console.log('📨 Webhook request received');
  console.log('📦 Update type:', req.body?.message ? 'message' : req.body?.callback_query ? 'callback' : 'unknown');
  
  try {
    await bot.handleUpdate(req.body);
    console.log('✅ Update processed successfully');
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error handling update:', error.message);
    console.error('Stack:', error.stack);
    res.status(200).send('OK'); // Всегда возвращаем 200 для Telegram
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'GeckoBot',
    webhook: `https://geckobot.vercel.app/bot${BOT_TOKEN}`
  });
});

// ============== ВАЖНО: Запускаем установку вебхука при старте ==============
const WEBHOOK_URL = `https://geckobot.vercel.app/bot${BOT_TOKEN}`;

// Автоматическая установка вебхука при запуске
(async () => {
  try {
    console.log('🔧 Auto-setting webhook to:', WEBHOOK_URL);
    await bot.telegram.setWebhook(WEBHOOK_URL);
    const info = await bot.telegram.getWebhookInfo();
    console.log('✅ Webhook auto-set successfully!');
    console.log('📊 Webhook info:', {
      url: info.url,
      has_custom_certificate: info.has_custom_certificate,
      pending_update_count: info.pending_update_count,
      max_connections: info.max_connections
    });
  } catch (error) {
    console.error('❌ Failed to auto-set webhook:', error.message);
  }
})();

console.log('🚀 Bot ready to receive updates');
console.log(`🌐 Webhook URL: ${WEBHOOK_URL}`);

// Экспортируем для Vercel
module.exports = app;
