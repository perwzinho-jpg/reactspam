// Anti-Ban System - Humanized delays and warm-up
export class AntiBanSystem {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    this.warmupPhases = {
      1: { min: 30000, max: 45000, maxMessages: 10 },
      2: { min: 20000, max: 30000, maxMessages: 20 },
      3: { min: 15000, max: 25000, maxMessages: 999999 }
    };
  }

  // Get humanized delay based on warm-up phase
  getDelay(instance, customMin = null, customMax = null) {
    const phase = instance.warmup_phase || 1;
    const phaseConfig = this.warmupPhases[phase] || this.warmupPhases[3];

    const minDelay = customMin || phaseConfig.min;
    const maxDelay = customMax || phaseConfig.max;

    // Non-uniform randomization
    const baseDelay = minDelay + Math.random() * (maxDelay - minDelay);
    const variance = baseDelay * 0.1; // 10% variance
    const finalDelay = baseDelay + (Math.random() * variance * 2 - variance);

    return Math.floor(finalDelay);
  }

  // Check if instance needs warm-up progression
  shouldProgressWarmup(instance) {
    const phase = instance.warmup_phase || 1;
    const phaseConfig = this.warmupPhases[phase];

    if (!phaseConfig || phase >= 3) return false;

    return instance.warmup_messages_sent >= phaseConfig.maxMessages;
  }

  // Check if instance can send message (rate limiting)
  canSendMessage(instance) {
    const now = new Date();
    const messagesPerHour = parseInt(process.env.MESSAGES_PER_HOUR) || 60;

    // Check hourly limit
    if (instance.messages_sent_hour >= messagesPerHour) {
      const lastMessageTime = new Date(instance.last_message_time);
      const hourDiff = (now - lastMessageTime) / (1000 * 60 * 60);

      if (hourDiff < 1) {
        return {
          canSend: false,
          reason: 'Limite de mensagens por hora atingido',
          waitTime: Math.ceil((1 - hourDiff) * 60) // minutes
        };
      }
    }

    // Check business hours (7 AM - 10 PM)
    const hour = now.getHours();
    if (hour < 7 || hour >= 22) {
      return {
        canSend: false,
        reason: 'Fora do horário comercial (7h-22h)',
        waitTime: hour < 7 ? (7 - hour) * 60 : (24 - hour + 7) * 60
      };
    }

    // Mandatory pause every 20 messages
    if (instance.messages_sent_today > 0 && instance.messages_sent_today % 20 === 0) {
      const lastMessageTime = new Date(instance.last_message_time);
      const minutesSinceLastMessage = (now - lastMessageTime) / (1000 * 60);

      if (minutesSinceLastMessage < 10) {
        return {
          canSend: false,
          reason: 'Pausa obrigatória a cada 20 mensagens',
          waitTime: Math.ceil(10 - minutesSinceLastMessage)
        };
      }
    }

    return { canSend: true };
  }

  // Get random user agent
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  // Calculate next send time
  getNextSendTime(instance, customMin = null, customMax = null) {
    const delay = this.getDelay(instance, customMin, customMax);
    return new Date(Date.now() + delay);
  }

  // Reset hourly counter if hour has passed
  shouldResetHourlyCounter(instance) {
    if (!instance.last_message_time) return false;

    const now = new Date();
    const lastMessageTime = new Date(instance.last_message_time);
    const hourDiff = (now - lastMessageTime) / (1000 * 60 * 60);

    return hourDiff >= 1;
  }

  // Reset daily counter if day has passed
  shouldResetDailyCounter(instance) {
    if (!instance.last_message_time) return false;

    const now = new Date();
    const lastMessageTime = new Date(instance.last_message_time);

    return now.getDate() !== lastMessageTime.getDate() ||
           now.getMonth() !== lastMessageTime.getMonth() ||
           now.getFullYear() !== lastMessageTime.getFullYear();
  }
}

export default new AntiBanSystem();
