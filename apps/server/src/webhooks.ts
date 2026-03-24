import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { config } from './config';

/**
 * Upload file to Discord webhook and return the attachment URL
 */
export async function uploadFileToDiscord(filePath: string): Promise<string | null> {
  if (!config.discordWebhookUrls || config.discordWebhookUrls.length === 0) {
    return null;
  }

  try {
    const webhookUrl = config.discordWebhookUrls[0];
    const formData = new FormData();
    
    const fileStream = fs.createReadStream(filePath);
    const filename = path.basename(filePath);
    
    formData.append('file', fileStream, filename);
    formData.append('payload_json', JSON.stringify({
      content: `File uploaded: ${filename}`,
    }));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (response.ok) {
      const data = await response.json() as any;
      // Return the attachment URL from the first file
      if (data.attachments && data.attachments.length > 0) {
        return data.attachments[0].url;
      }
    } else {
      console.error('Discord upload error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Failed to upload to Discord:', error);
  }

  return null;
}

/**
 * Send message to all Telegram channels
 */
export async function sendToTelegramChannels(message: string): Promise<void> {
  if (!config.telegramBotTokens.length || !config.telegramChannelIds.length) {
    return;
  }

  const promises = config.telegramBotTokens.flatMap(token =>
    config.telegramChannelIds.map(chatId =>
      sendTelegramMessage(token, chatId, message)
    )
  );

  await Promise.allSettled(promises);
}

/**
 * Send message to a specific Telegram channel
 */
async function sendTelegramMessage(token: string, chatId: string, message: string): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram send error:', response.status, error);
    }
  } catch (error) {
    console.error('Failed to send to Telegram:', error);
  }
}

/**
 * Upload file to Telegram and return file_id
 */
export async function uploadFileToTelegram(filePath: string, caption?: string): Promise<string | null> {
  if (!config.telegramBotTokens.length || !config.telegramChannelIds.length) {
    return null;
  }

  try {
    const token = config.telegramBotTokens[0];
    const chatId = config.telegramChannelIds[0];
    const formData = new FormData();
    
    const fileStream = fs.createReadStream(filePath);
    const filename = path.basename(filePath);
    
    formData.append('chat_id', chatId);
    formData.append('document', fileStream, filename);
    if (caption) {
      formData.append('caption', caption);
    }

    const url = `https://api.telegram.org/bot${token}/sendDocument`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data.result?.document?.file_id) {
        return data.result.document.file_id;
      }
    } else {
      const error = await response.text();
      console.error('Telegram upload error:', response.status, error);
    }
  } catch (error) {
    console.error('Failed to upload to Telegram:', error);
  }

  return null;
}

/**
 * Get file from Telegram by file_id
 */
export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  if (!config.telegramBotTokens.length) {
    return null;
  }

  try {
    const token = config.telegramBotTokens[0];
    const url = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
    
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json() as any;
      if (data.ok && data.result?.file_path) {
        // Return direct download URL
        return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
      }
    }
  } catch (error) {
    console.error('Failed to get file from Telegram:', error);
  }

  return null;
}
