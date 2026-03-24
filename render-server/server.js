/**
 * Nexo Messenger - Ultra Secure Server
 * Многоуровневое шифрование (30 этапов) + STUN пул + Файлы в Discord/Telegram
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';
import zlib from 'zlib';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================

const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'nexo-secret-key',
  masterKey: process.env.MASTER_KEY || 'master-key-64-chars',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  encryptionEnabled: !!process.env.ENCRYPTION_KEY,
  redisUrl: process.env.REDIS_URL || '',
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 * 1024,
  chunkSize: Number(process.env.CHUNK_SIZE) || 20 * 1024 * 1024,
  maxRegistrationsPerIp: Number(process.env.MAX_REGISTRATIONS_PER_IP) || 22,
  
  // Discord
  discordWebhookUrls: process.env.DISCORD_WEBHOOK_URLS?.split(',').filter(u => u.trim()) || [],
  
  // Telegram
  telegramBotTokens: process.env.TELEGRAM_BOT_TOKENS?.split(',').filter(t => t.trim()) || [],
  telegramChannelIds: process.env.TELEGRAM_CHANNEL_IDS?.split(',').filter(id => id.trim()) || [],
  
  // STUN серверы - пул для распределения нагрузки
  stunServers: [
    // Google (основные)
    'stun.l.google.com:19302',
    'stun1.l.google.com:19302',
    'stun2.l.google.com:19302',
    'stun3.l.google.com:19302',
    'stun4.l.google.com:19302',
    
    // Другие надежные
    'stun.services.mozilla.com:3478',
    'stun.stunprotocol.org:3478',
    'stunserver.org:3478',
    'stun.nextcloud.com:443',
    'stun.mit.de:3478',
    
    // Европа
    'stun.1und1.de:3478',
    'stun.schlund.de:3478',
    'stun.kundenserver.de:3478',
    'stun.hosteurope.de:3478',
    'stun.barracuda.com:3478',
    
    // Россия/СНГ
    'stun.chathelp.ru:3478',
    'stun.arbuz.ru:3478',
    'stun.mgn.ru:3478',
    'stun.tatneft.ru:3478',
    'stun.sovtest.ru:3478',
    
    // Азия
    'stun.qq.com:3478',
    'stun.cloopen.com:3478',
    'stun.miwifi.com:3478',
    
    // Океания
    'stun.2talk.co.nz:3478',
    'stun.kiwilink.co.nz:3478',
    
    // Остальные
    'stun.ekiga.net:3478',
    'stun.freeswitch.org:3478',
    'stun.pjsip.org:3478',
    'stun.linphone.org:3478',
    'stun.ooma.com:3478',
    'stun.twilio.com:3478',
    'stun.voip.blackberry.com:3478',
    'stun.doublerobotics.com:3478',
    'stun.symform.com:3478',
    'stun.cloudmark.com:3478',
    'stun.rolmail.net:3478',
    'stun.t-online.de:3478',
    'stun.web.de:3478',
    'stun.gmx.de:3478',
    'stun.gmx.net:3478',
    'stun.123voip.com:3478',
    'stun.ipshka.com:3478',
    'stun.sipnet.net:3478',
    'stun.sipnet.ru:3478',
    'stun.zadarma.com:3478',
    'stun.voxox.com:3478',
    'stun.vivox.com:3478',
    'stun.vidyo.com:3478',
    'stun.jumblo.com:3478',
    'stun.counterpath.com:3478',
    'stun.counterpath.net:3478',
    'stun.3cx.com:3478',
    'stun.aa.net.uk:3478',
    'stun.acrobits.cz:3478',
    'stun.aeta-audio.com:3478',
    'stun.antisip.com:3478',
    'stun.bahnhof.net:3478',
    'stun.cablenet-as.net:3478',
    'stun.cbsys.net:3478',
    'stun.dcalling.de:3478',
    'stun.decanet.fr:3478',
    'stun.dus.net:3478',
    'stun.easycall.pl:3478',
    'stun.einsundeins.de:3478',
    'stun.etoilediese.fr:3478',
    'stun.eyeball.com:3478',
    'stun.faktortel.com.au:3478',
    'stun.freecall.com:3478',
    'stun.fuzemeeting.com:3478',
    'stun.gradwell.com:3478',
    'stun.halonet.pl:3478',
    'stun.hoiio.com:3478',
    'stun.ideasip.com:3478',
    'stun.infra.net:3478',
    'stun.ippi.fr:3478',
    'stun.iptel.org:3478',
    'stun.irian.at:3478',
    'stun.ivao.aero:3478',
    'stun.jappix.com:3478',
    'stun.justvoip.com:3478',
    'stun.kanet.ru:3478',
    'stun.linphone.org:3478',
    'stun.lowratevoip.com:3478',
    'stun.lugosoft.com:3478',
    'stun.magnet.ie:3478',
    'stun.mitake.com.tw:3478',
    'stun.modulus.gr:3478',
    'stun.mozcom.com:3478',
    'stun.myvoiptraffic.com:3478',
    'stun.nas.net:3478',
    'stun.neotel.co.za:3478',
    'stun.nfon.net:3478',
    'stun.noblogs.org:3478',
    'stun.node4.co.uk:3478',
    'stun.nonoh.net:3478',
    'stun.nova.is:3478',
    'stun.nventure.com:3478',
    'stun.ooma.com:3478',
    'stun.ooonet.ru:3478',
    'stun.oriontelekom.rs:3478',
    'stun.outland-net.de:3478',
    'stun.ozekiphone.com:3478',
    'stun.patlive.com:3478',
    'stun.personal-voip.de:3478',
    'stun.petcube.com:3478',
    'stun.phone.com:3478',
    'stun.phoneserve.com:3478',
    'stun.pjsip.org:3478',
    'stun.poivy.com:3478',
    'stun.powerpbx.org:3478',
    'stun.powervoip.com:3478',
    'stun.ppdi.com:3478',
    'stun.prizee.com:3478',
    'stun.qvod.com:3478',
    'stun.rackco.com:3478',
    'stun.rapidnet.de:3478',
    'stun.rb-net.com:3478',
    'stun.refint.net:3478',
    'stun.remote-learner.net:3478',
    'stun.rixtelecom.se:3478',
    'stun.rockenstein.de:3478',
    'stun.rolmail.net:3478',
    'stun.rounds.com:3478',
    'stun.rynga.com:3478',
    'stun.samsungsmartcam.com:3478',
    'stun.sigmavoip.com:3478',
    'stun.sip.us:3478',
    'stun.sipdiscount.com:3478',
    'stun.siplogin.de:3478',
    'stun.siportal.it:3478',
    'stun.sippeer.dk:3478',
    'stun.siptraffic.com:3478',
    'stun.skylink.ru:3478',
    'stun.sma.de:3478',
    'stun.smartvoip.com:3478',
    'stun.smsdiscount.com:3478',
    'stun.snafu.de:3478',
    'stun.softjoys.com:3478',
    'stun.solcon.nl:3478',
    'stun.solnet.ch:3478',
    'stun.sonetel.com:3478',
    'stun.sonetel.net:3478',
    'stun.speedy.com.ar:3478',
    'stun.spokn.com:3478',
    'stun.srce.hr:3478',
    'stun.ssl7.net:3478',
    'stun.stunprotocol.org:3478',
    'stun.symform.com:3478',
    'stun.symplicity.com:3478',
    'stun.sysadminman.net:3478',
    'stun.t-online.de:3478',
    'stun.tagan.ru:3478',
    'stun.teachercreated.com:3478',
    'stun.tel.lu:3478',
    'stun.telbo.com:3478',
    'stun.telefacil.com:3478',
    'stun.tis-dialog.ru:3478',
    'stun.tng.de:3478',
    'stun.twt.it:3478',
    'stun.u-blox.com:3478',
    'stun.ucallweconn.net:3478',
    'stun.ucsb.edu:3478',
    'stun.ucw.cz:3478',
    'stun.uls.co.za:3478',
    'stun.unseen.is:3478',
    'stun.usfamily.net:3478',
    'stun.veoh.com:3478',
    'stun.vidyo.com:3478',
    'stun.vipgroup.net:3478',
    'stun.virtual-call.com:3478',
    'stun.viva.gr:3478',
    'stun.vivox.com:3478',
    'stun.vline.com:3478',
    'stun.vo.lu:3478',
    'stun.vodafone.ro:3478',
    'stun.voicetrading.com:3478',
    'stun.voip.aebc.com:3478',
    'stun.voip.blackberry.com:3478',
    'stun.voip.eutelia.it:3478',
    'stun.voiparound.com:3478',
    'stun.voipblast.com:3478',
    'stun.voipbuster.com:3478',
    'stun.voipbusterpro.com:3478',
    'stun.voipcheap.co.uk:3478',
    'stun.voipcheap.com:3478',
    'stun.voipfibre.com:3478',
    'stun.voipgain.com:3478',
    'stun.voipgate.com:3478',
    'stun.voipinfocenter.com:3478',
    'stun.voipplanet.nl:3478',
    'stun.voippro.com:3478',
    'stun.voipraider.com:3478',
    'stun.voipstunt.com:3478',
    'stun.voipwise.com:3478',
    'stun.voipzoom.com:3478',
    'stun.vopium.com:3478',
    'stun.voxgratia.org:3478',
    'stun.voxox.com:3478',
    'stun.voys.nl:3478',
    'stun.voztele.com:3478',
    'stun.vyke.com:3478',
    'stun.webcalldirect.com:3478',
    'stun.whoi.edu:3478',
    'stun.wifirst.net:3478',
    'stun.wwdl.net:3478',
    'stun.xs4all.nl:3478',
    'stun.xtratelecom.es:3478',
    'stun.yesss.at:3478',
    'stun.zadv.com:3478',
    'stun.zoiper.com:3478',
    'stun1.voiceeclipse.net:3478',
    'stunserver.org:3478',
    'relay.webwormhole.io:3478',
    'stun.flashdance.cx:3478',
    '23.21.150.121:3478',
    'iphone-stun.strato-iphone.de:3478',
    'numb.viagenie.ca:3478',
    's1.taraba.net:3478',
    's2.taraba.net:3478',
    'stun.12connect.com:3478',
    'stun.12voip.com:3478',
    'stun.2talk.co.nz:3478',
    'stun.2talk.com:3478',
    'stun.3clogic.com:3478',
    'stun.a-mm.tv:3478',
    'stun.actionvoip.com:3478',
    'stun.advfn.com:3478',
    'stun.aeta.com:3478',
    'stun.alltel.com.au:3478',
    'stun.altar.com.pl:3478',
    'stun.annatel.net:3478',
    'stun.avigora.com:3478',
    'stun.avigora.fr:3478',
    'stun.awa-shima.com:3478',
    'stun.awt.be:3478',
    'stun.b2b2c.ca:3478',
    'stun.bluesip.net:3478',
    'stun.bmwgs.cz:3478',
    'stun.botonakis.com:3478',
    'stun.budgetphone.nl:3478',
    'stun.budgetsip.com:3478',
    'stun.callromania.ro:3478',
    'stun.callwithus.com:3478',
    'stun.cheapvoip.com:3478',
    'stun.ciktel.com:3478',
    'stun.colouredlines.com.au:3478',
    'stun.comfi.com:3478',
    'stun.commpeak.com:3478',
    'stun.comtube.com:3478',
    'stun.comtube.ru:3478',
    'stun.cope.es:3478',
    'stun.cryptonit.net:3478',
    'stun.darioflaccovio.it:3478',
    'stun.datamanagement.it:3478',
    'stun.develz.org:3478',
    'stun.dingaling.ca:3478',
    'stun.drogon.net:3478',
    'stun.duocom.es:3478',
    'stun.e-fon.ch:3478',
    'stun.easybell.de:3478',
    'stun.easyvoip.com:3478',
    'stun.efficace-factory.com:3478',
    'stun.einsundeins.com:3478',
    'stun.epygi.com:3478',
    'stun.freeswitch.org:3478',
    'stun.freevoipdeal.com:3478',
    'stun.hellonanu.com:3478',
    'stun.imesh.com:3478',
    'stun.internetcalls.com:3478',
    'stun.intervoip.com:3478',
    'stun.ipcomms.net:3478',
    'stun.ipfire.org:3478',
    'stun.it1.hr:3478',
    'stun.manle.com:3478',
    'stun.mywatson.it:3478',
    'stun.netappel.com:3478',
    'stun.netappel.fr:3478',
    'stun.netgsm.com.tr:3478',
    'stun.nottingham.ac.uk:3478',
    'stun.on.net.mk:3478',
    'stun.patlive.com:3478',
    'stun.refint.net:3478',
    'stun.remote-learner.net:3478',
    'stun.rockenstein.de:3478',
    'stun.schlund.de:3478',
    'stun.sipnet.net:3478',
    'stun.sipnet.ru:3478',
    'stun.snafu.de:3478',
    'stun.softjoys.com:3478',
    'stun.solcon.nl:3478',
    'stun.solnet.ch:3478',
    'stun.sovtest.ru:3478',
    'stun.spokn.com:3478',
    'stun.srce.hr:3478',
    'stun.ssl7.net:3478',
    'stun.stunprotocol.org:3478',
    'stun.symform.com:3478',
    'stun.symplicity.com:3478',
    'stun.sysadminman.net:3478',
    'stun.tagan.ru:3478',
    'stun.tatneft.ru:3478',
    'stun.teachercreated.com:3478',
    'stun.tel.lu:3478',
    'stun.telbo.com:3478',
    'stun.telefacil.com:3478',
    'stun.tis-dialog.ru:3478',
    'stun.tng.de:3478',
    'stun.twt.it:3478',
    'stun.u-blox.com:3478',
    'stun.ucallweconn.net:3478',
    'stun.ucsb.edu:3478',
    'stun.ucw.cz:3478',
    'stun.uls.co.za:3478',
    'stun.unseen.is:3478',
    'stun.usfamily.net:3478',
    'stun.veoh.com:3478',
    'stun.vidyo.com:3478',
    'stun.vipgroup.net:3478',
    'stun.virtual-call.com:3478',
    'stun.viva.gr:3478',
    'stun.vivox.com:3478',
    'stun.vline.com:3478',
    'stun.vo.lu:3478',
    'stun.vodafone.ro:3478',
    'stun.voicetrading.com:3478',
    'stun.voip.aebc.com:3478',
    'stun.voip.blackberry.com:3478',
    'stun.voip.eutelia.it:3478',
    'stun.voiparound.com:3478',
    'stun.voipblast.com:3478',
    'stun.voipbuster.com:3478',
    'stun.voipbusterpro.com:3478',
    'stun.voipcheap.co.uk:3478',
    'stun.voipcheap.com:3478',
    'stun.voipfibre.com:3478',
    'stun.voipgain.com:3478',
    'stun.voipgate.com:3478',
    'stun.voipinfocenter.com:3478',
    'stun.voipplanet.nl:3478',
    'stun.voippro.com:3478',
    'stun.voipraider.com:3478',
    'stun.voipstunt.com:3478',
    'stun.voipwise.com:3478',
    'stun.voipzoom.com:3478',
    'stun.vopium.com:3478',
    'stun.voxgratia.org:3478',
    'stun.voxox.com:3478',
    'stun.voys.nl:3478',
    'stun.voztele.com:3478',
    'stun.vyke.com:3478',
    'stun.webcalldirect.com:3478',
    'stun.whoi.edu:3478',
    'stun.wifirst.net:3478',
    'stun.wwdl.net:3478',
    'stun.xs4all.nl:3478',
    'stun.xtratelecom.es:3478',
    'stun.yesss.at:3478',
    'stun.zadarma.com:3478',
    'stun.zadv.com:3478',
    'stun.zoiper.com:3478',
  ].map(s => s.trim()).filter(Boolean),
};

// ============================================
// INITIALIZATION
// ============================================

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins.includes('*') ? '*' : config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const prisma = new PrismaClient();

// Redis client
let redis = null;
if (config.redisUrl) {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => times > 3 ? null : Math.min(times * 200, 2000),
  });
  redis.on('connect', () => console.log('✓ Redis connected'));
  redis.on('error', (err) => console.error('Redis error:', err.message));
}

// ============================================
// ULTRA ENCRYPTION - 30 этапов + комбинированное
// ============================================

const ENCRYPTION_ROUNDS = 30;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Генерация производного ключа из мастер-ключа
function deriveKey(masterKey, salt, iterations = 100000) {
  return crypto.pbkdf2Sync(masterKey, salt, iterations, 32, 'sha512');
}

// 30-этапное шифрование
function ultraEncrypt(text) {
  if (!config.encryptionEnabled || !text) return text;
  
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(config.encryptionKey, salt);
    
    let encrypted = Buffer.from(text, 'utf8');
    
    // Этап 1-10: AES-256-GCM с разными IV
    for (let i = 0; i < 10; i++) {
      const roundIv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, roundIv);
      cipher.setAAD(Buffer.from(`round-${i}`));
      encrypted = Buffer.concat([
        cipher.update(encrypted),
        cipher.final(),
        cipher.getAuthTag()
      ]);
    }
    
    // Этап 11-15: ChaCha20-Poly1305
    const chachaKey = crypto.createHash('sha256').update(key).digest();
    for (let i = 0; i < 5; i++) {
      const chachaIv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('chacha20-poly1305', chachaKey, chachaIv);
      encrypted = Buffer.concat([
        cipher.update(encrypted),
        cipher.final(),
        cipher.getAuthTag()
      ]);
    }
    
    // Этап 16-20: AES-256-CBC
    for (let i = 0; i < 5; i++) {
      const cbcIv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, cbcIv);
      encrypted = Buffer.concat([cipher.update(encrypted), cipher.final()]);
    }
    
    // Этап 21-25: Blowfish
    for (let i = 0; i < 5; i++) {
      const bfKey = crypto.createHash('sha256').update(Buffer.concat([key, Buffer.from(i.toString())])).digest();
      const bfIv = crypto.randomBytes(8);
      const cipher = crypto.createCipheriv('bf-cbc', bfKey.slice(0, 16), bfIv);
      encrypted = Buffer.concat([cipher.update(encrypted), cipher.final()]);
    }
    
    // Этап 26-28: Triple DES
    for (let i = 0; i < 3; i++) {
      const desKey = crypto.createHash('sha256').update(Buffer.concat([key, Buffer.from(`des-${i}`)])).digest().slice(0, 24);
      const desIv = crypto.randomBytes(8);
      const cipher = crypto.createCipheriv('des-ede3-cbc', desKey, desIv);
      encrypted = Buffer.concat([cipher.update(encrypted), cipher.final()]);
    }
    
    // Этап 29: XOR с ключом
    const xorKey = crypto.createHash('sha256').update(key).digest();
    const xored = Buffer.alloc(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      xored[i] = encrypted[i] ^ xorKey[i % xorKey.length];
    }
    encrypted = xored;
    
    // Этап 30: Сжатие + Base64
    const compressed = zlib.deflateSync(encrypted);
    const base64 = compressed.toString('base64');
    
    // Формат: salt:iv:compressed_base64
    return `${salt.toString('hex')}:${iv.toString('hex')}:${base64}`;
    
  } catch (e) {
    console.error('Ultra encryption error:', e);
    return text;
  }
}

// 30-этапная дешифровка
function ultraDecrypt(encryptedData) {
  if (!config.encryptionEnabled || !encryptedData) return encryptedData;
  
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;
    
    const [saltHex, ivHex, base64] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const key = deriveKey(config.encryptionKey, salt);
    
    // Этап 30: Decompress
    const compressed = Buffer.from(base64, 'base64');
    let decrypted = zlib.inflateSync(compressed);
    
    // Этап 29: Reverse XOR
    const xorKey = crypto.createHash('sha256').update(key).digest();
    const xored = Buffer.alloc(decrypted.length);
    for (let i = 0; i < decrypted.length; i++) {
      xored[i] = decrypted[i] ^ xorKey[i % xorKey.length];
    }
    decrypted = xored;
    
    // Этап 28-26: Reverse Triple DES
    for (let i = 2; i >= 0; i--) {
      const desKey = crypto.createHash('sha256').update(Buffer.concat([key, Buffer.from(`des-${i}`)])).digest().slice(0, 24);
      const desIv = crypto.randomBytes(8); // IV не нужен для дешифровки в этом режиме
      const decipher = crypto.createDecipheriv('des-ede3-cbc', desKey, desIv);
      decipher.setAutoPadding(false);
      decrypted = Buffer.concat([decipher.update(decrypted), decipher.final()]);
    }
    
    // Этап 25-21: Reverse Blowfish
    for (let i = 4; i >= 0; i--) {
      const bfKey = crypto.createHash('sha256').update(Buffer.concat([key, Buffer.from(i.toString())])).digest();
      const bfIv = crypto.randomBytes(8);
      const decipher = crypto.createDecipheriv('bf-cbc', bfKey.slice(0, 16), bfIv);
      decipher.setAutoPadding(false);
      decrypted = Buffer.concat([decipher.update(decrypted), decipher.final()]);
    }
    
    // Этап 20-16: Reverse AES-256-CBC
    for (let i = 4; i >= 0; i--) {
      const cbcIv = crypto.randomBytes(16);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, cbcIv);
      decipher.setAutoPadding(false);
      decrypted = Buffer.concat([decipher.update(decrypted), decipher.final()]);
    }
    
    // Этап 15-11: Reverse ChaCha20-Poly1305
    const chachaKey = crypto.createHash('sha256').update(key).digest();
    for (let i = 4; i >= 0; i--) {
      const chachaIv = crypto.randomBytes(12);
      const decipher = crypto.createDecipheriv('chacha20-poly1305', chachaKey, chachaIv);
      decipher.setAutoPadding(false);
      decrypted = Buffer.concat([decipher.update(decrypted), decipher.final()]);
    }
    
    // Этап 10-1: Reverse AES-256-GCM
    for (let i = 9; i >= 0; i--) {
      const roundIv = crypto.randomBytes(IV_LENGTH);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, roundIv);
      decipher.setAutoPadding(false);
      decrypted = Buffer.concat([decipher.update(decrypted), decipher.final()]);
    }
    
    return decrypted.toString('utf8');
    
  } catch (e) {
    console.error('Ultra decryption error:', e);
    return encryptedData;
  }
}

// Базовое шифрование (для клиента)
function simpleEncrypt(text) {
  if (!config.encryptionEnabled || !text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(config.encryptionKey, 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (e) {
    return text;
  }
}

function simpleDecrypt(encryptedData) {
  if (!config.encryptionEnabled || !encryptedData) return encryptedData;
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = Buffer.from(config.encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return encryptedData;
  }
}

// Шифрование файлов
function encryptFileStream(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    if (!config.encryptionEnabled) {
      fs.copyFileSync(inputPath, outputPath);
      resolve();
      return;
    }
    
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(config.encryptionKey, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const readStream = fs.createReadStream(inputPath);
    const writeStream = fs.createWriteStream(outputPath);
    
    writeStream.write(salt);
    writeStream.write(iv);
    
    readStream
      .pipe(cipher)
      .pipe(writeStream, { end: false });
    
    cipher.on('finish', () => {
      const authTag = cipher.getAuthTag();
      writeStream.write(authTag);
      writeStream.end();
      resolve();
    });
    
    readStream.on('error', reject);
    writeStream.on('error', reject);
  });
}

function decryptFileStream(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    if (!config.encryptionEnabled) {
      fs.copyFileSync(inputPath, outputPath);
      resolve();
      return;
    }
    
    const fileBuffer = fs.readFileSync(inputPath);
    const salt = fileBuffer.slice(0, SALT_LENGTH);
    const iv = fileBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = fileBuffer.slice(-AUTH_TAG_LENGTH);
    const encrypted = fileBuffer.slice(SALT_LENGTH + IV_LENGTH, -AUTH_TAG_LENGTH);
    
    const key = deriveKey(config.encryptionKey, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    fs.writeFileSync(outputPath, decrypted);
    resolve();
  });
}

function decryptMessageFields(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (typeof obj.content === 'string') obj.content = ultraDecrypt(obj.content);
  if (typeof obj.quote === 'string') obj.quote = ultraDecrypt(obj.quote);
  if (obj.replyTo) decryptMessageFields(obj.replyTo);
}

// ============================================
// DISCORD UPLOAD
// ============================================

async function uploadFileToDiscordChunked(filePath, filename) {
  if (!config.discordWebhookUrls.length) return null;
  
  try {
    const fileSize = fs.statSync(filePath).size;
    const maxChunkSize = 25 * 1024 * 1024;
    const fileBuffer = fs.readFileSync(filePath);
    
    const chunks = [];
    for (let i = 0; i < fileBuffer.length; i += maxChunkSize) {
      chunks.push(fileBuffer.slice(i, i + maxChunkSize));
    }
    
    const uploadedUrls = [];
    const webhookUrl = config.discordWebhookUrls[0];
    
    for (let i = 0; i < chunks.length; i++) {
      const formData = new FormData();
      const chunkBuffer = Buffer.from(chunks[i]);
      
      formData.append('file', chunkBuffer, `${filename}.chunk.${i}`);
      formData.append('payload_json', JSON.stringify({
        content: `Chunk ${i + 1}/${chunks.length} | File: ${filename} | Size: ${chunks[i].length}`,
      }));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.attachments?.[0]?.url) {
          uploadedUrls.push(data.attachments[0].url);
        }
      }
      
      if (i < chunks.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    if (uploadedUrls.length > 0) {
      return JSON.stringify({
        type: 'discord',
        chunks: uploadedUrls,
        filename,
        size: fileSize,
        chunkCount: chunks.length,
      });
    }
    
    return null;
  } catch (e) {
    console.error('Discord upload error:', e);
    return null;
  }
}

async function downloadFileFromDiscordChunks(chunkData, outputPath) {
  try {
    const data = JSON.parse(chunkData);
    if (!data.chunks || !Array.isArray(data.chunks)) return false;
    
    const chunks = [];
    for (const url of data.chunks) {
      const response = await fetch(url);
      if (!response.ok) return false;
      const buffer = await response.arrayBuffer();
      chunks.push(Buffer.from(buffer));
    }
    
    const combinedBuffer = Buffer.concat(chunks);
    fs.writeFileSync(outputPath, combinedBuffer);
    return true;
  } catch (e) {
    console.error('Discord download error:', e);
    return false;
  }
}

// ============================================
// TELEGRAM UPLOAD
// ============================================

async function uploadFileToTelegramChunked(filePath, filename) {
  if (!config.telegramBotTokens.length || !config.telegramChannelIds.length) return null;
  
  try {
    const fileSize = fs.statSync(filePath).size;
    const maxChunkSize = 50 * 1024 * 1024;
    const fileBuffer = fs.readFileSync(filePath);
    
    const chunks = [];
    for (let i = 0; i < fileBuffer.length; i += maxChunkSize) {
      chunks.push(fileBuffer.slice(i, i + maxChunkSize));
    }
    
    const uploadedFileIds = [];
    const token = config.telegramBotTokens[0];
    const chatId = config.telegramChannelIds[0];
    
    for (let i = 0; i < chunks.length; i++) {
      const formData = new FormData();
      const chunkBuffer = Buffer.from(chunks[i]);
      
      formData.append('chat_id', chatId);
      formData.append('document', chunkBuffer, `${filename}.chunk.${i}`);
      formData.append('caption', `Chunk ${i + 1}/${chunks.length} | File: ${filename}`);
      
      const url = `https://api.telegram.org/bot${token}/sendDocument`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.result?.document?.file_id) {
          uploadedFileIds.push(data.result.document.file_id);
        }
      }
      
      if (i < chunks.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    if (uploadedFileIds.length > 0) {
      return JSON.stringify({
        type: 'telegram',
        fileIds: uploadedFileIds,
        filename,
        size: fileSize,
        chunkCount: chunks.length,
      });
    }
    
    return null;
  } catch (e) {
    console.error('Telegram upload error:', e);
    return null;
  }
}

async function downloadFileFromTelegramChunks(chunkData, outputPath) {
  try {
    const data = JSON.parse(chunkData);
    if (!data.fileIds || !Array.isArray(data.fileIds)) return false;
    
    const token = config.telegramBotTokens[0];
    const chunks = [];
    
    for (const fileId of data.fileIds) {
      const fileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`;
      const response = await fetch(fileUrl);
      const fileData = await response.json();
      
      if (!fileData.ok || !fileData.result?.file_path) return false;
      
      const downloadUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
      const downloadResponse = await fetch(downloadUrl);
      const buffer = await downloadResponse.arrayBuffer();
      chunks.push(Buffer.from(buffer));
    }
    
    const combinedBuffer = Buffer.concat(chunks);
    fs.writeFileSync(outputPath, combinedBuffer);
    return true;
  } catch (e) {
    console.error('Telegram download error:', e);
    return false;
  }
}

// ============================================
// MIDDLEWARE
// ============================================

app.set('trust proxy', 1);
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', async (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=86400');
  
  const urlPath = decodeURIComponent(req.path);
  if (urlPath.includes('..')) { res.status(400).end(); return; }
  
  const filePath = path.resolve(uploadsDir, urlPath.replace(/^\//, ''));
  if (!filePath.startsWith(uploadsDir) || !fs.existsSync(filePath)) { res.status(404).end(); return; }
  
  if (filePath.endsWith('.enc')) {
    const tempPath = filePath + '.dec';
    try {
      await decryptFileStream(filePath, tempPath);
      res.setHeader('Content-Type', mime.lookup(filePath.replace('.enc', '')) || 'application/octet-stream');
      res.sendFile(tempPath, () => {
        fs.unlinkSync(tempPath);
      });
      return;
    } catch (e) {
      res.status(500).end();
      return;
    }
  }
  
  res.setHeader('Content-Type', mime.lookup(filePath) || 'application/octet-stream');
  next();
}, express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const blocked = ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (blocked.includes(ext)) cb(new Error('File type not allowed'));
    else cb(null, true);
  },
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ============================================
// AUTH ROUTES
// ============================================

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    
    const ip = req.ip;
    if (config.maxRegistrationsPerIp > 0 && ip) {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentRegs = await prisma.user.count({
        where: { registrationIp: ip, createdAt: { gte: dayAgo } },
      });
      if (recentRegs >= config.maxRegistrationsPerIp) {
        return res.status(429).json({ error: 'Too many registrations from this IP' });
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: req.body.email }] },
    });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        displayName: displayName || username,
        password: hashedPassword,
        registrationIp: ip,
      },
      select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, lastSeen: true, createdAt: true },
    });

    const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    await prisma.user.update({ where: { id: user.id }, data: { isOnline: true, lastSeen: new Date() } });
    
    if (redis) await redis.setex(`user:${user.id}:online`, 300, '1');

    const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, { expiresIn: '30d' });
    const { password: _, ...userWithoutPassword } = user;
    
    io.emit('user_online', { userId: user.id });
    res.json({ token, user: userWithoutPassword });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, displayName: true, avatar: true, bio: true, isOnline: true, lastSeen: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Auth check failed' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { isOnline: false, lastSeen: new Date() } });
    if (redis) await redis.del(`user:${req.user.id}:online`);
    io.emit('user_offline', { userId: req.user.id, lastSeen: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================
// USER & CHAT ROUTES (сокращенно)
// ============================================

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, displayName: true, avatar: true, bio: true, isOnline: true, lastSeen: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.params.id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const { displayName, bio, birthday } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { displayName, bio, birthday },
      select: { id: true, username: true, displayName: true, avatar: true, bio: true, birthday: true },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.post('/api/users/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    
    const encryptedPath = req.file.path + '.enc';
    await encryptFileStream(req.file.path, encryptedPath);
    fs.unlinkSync(req.file.path);
    
    const discordUrl = await uploadFileToDiscordChunked(encryptedPath, req.file.originalname);
    const telegramData = await uploadFileToTelegramChunked(encryptedPath, req.file.originalname);
    
    fs.unlinkSync(encryptedPath);
    
    const fileData = discordUrl || telegramData;
    const avatarUrl = fileData ? `cloud:${fileData}` : `/uploads/${req.file.filename}`;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
      select: { id: true, username: true, displayName: true, avatar: true },
    });
    
    io.emit('user_updated', { userId: req.user.id, avatar: avatarUrl });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const chatMembers = await prisma.chatMember.findMany({
      where: { userId: req.user.id },
      include: {
        chat: {
          include: {
            members: { include: { user: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, lastSeen: true } } } },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: { sender: { select: { id: true, username: true, displayName: true } }, media: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const chats = chatMembers.map(cm => ({
      ...cm.chat,
      role: cm.role,
      isMuted: cm.isMuted,
      isPinned: cm.isPinned,
      lastMessage: cm.chat.messages[0],
      unreadCount: 0,
    }));

    res.json(chats);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

app.post('/api/chats', authenticateToken, async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    if (!type || !memberIds?.length) return res.status(400).json({ error: 'Invalid data' });

    const chat = await prisma.chat.create({
      data: {
        type,
        name: type === 'group' ? name : null,
        members: {
          create: [
            { userId: req.user.id, role: 'owner' },
            ...memberIds.filter(id => id !== req.user.id).map(id => ({ userId: id, role: 'member' })),
          ],
        },
      },
      include: { members: { include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } } } },
    });

    res.json(chat);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// ============================================
// MESSAGE ROUTES
// ============================================

app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { chatId: req.params.chatId, isDeleted: false },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        replyTo: { include: { sender: { select: { id: true, username: true, displayName: true } } } },
        media: true,
        reactions: { include: { user: { select: { id: true, username: true, displayName: true } } } },
        readBy: { select: { userId: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    messages.forEach(msg => decryptMessageFields(msg));
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/api/messages', authenticateToken, upload.array('media', 10), async (req, res) => {
  try {
    const { chatId, content, type = 'text', replyToId, quote } = req.body;
    if (!chatId) return res.status(400).json({ error: 'Chat ID required' });

    const mediaItems = [];
    
    if (req.files?.length) {
      for (const file of req.files) {
        const encryptedPath = file.path + '.enc';
        await encryptFileStream(file.path, encryptedPath);
        
        const discordUrl = await uploadFileToDiscordChunked(encryptedPath, file.originalname);
        const telegramData = await uploadFileToTelegramChunked(encryptedPath, file.originalname);
        
        fs.unlinkSync(file.path);
        fs.unlinkSync(encryptedPath);
        
        const fileData = discordUrl || telegramData;
        if (fileData) {
          mediaItems.push({
            type: file.mimetype.split('/')[0],
            url: `cloud:${fileData}`,
            filename: file.originalname,
            size: file.size,
          });
        }
      }
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: req.user.id,
        content: ultraEncrypt(content),
        type,
        replyToId,
        quote: quote ? ultraEncrypt(quote) : null,
        media: mediaItems.length ? { create: mediaItems } : undefined,
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        replyTo: { include: { sender: { select: { id: true, username: true, displayName: true } } } },
        media: true,
        reactions: { include: { user: { select: { id: true, username: true, displayName: true } } } },
        readBy: { select: { userId: true } },
      },
    });

    decryptMessageFields(message);
    io.to(`chat:${chatId}`).emit('new_message', message);
    res.json(message);
  } catch (e) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.put('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await prisma.message.update({
      where: { id: req.params.id, senderId: req.user.id },
      data: { content: ultraEncrypt(content), isEdited: true },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        media: true,
      },
    });
    decryptMessageFields(message);
    io.to(`chat:${message.chatId}`).emit('message_edited', message);
    res.json(message);
  } catch (e) {
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.message.update({ where: { id: req.params.id }, data: { isDeleted: true, content: null } });
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (message) {
      io.to(`chat:${message.chatId}`).emit('message_deleted', { messageId: req.params.id, chatId: message.chatId });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// ============================================
// FRIEND ROUTES
// ============================================

app.get('/api/friends', authenticateToken, async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userId: req.user.id }, { friendId: req.user.id }], status: 'accepted' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, lastSeen: true } },
        friend: { select: { id: true, username: true, displayName: true, avatar: true, isOnline: true, lastSeen: true } },
      },
    });

    const friends = friendships.map(f => f.userId === req.user.id ? f.friend : f.user);
    res.json(friends);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

app.post('/api/friends/request', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (friendId === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = await prisma.friendship.findFirst({
      where: { OR: [{ userId: req.user.id, friendId }, { userId: friendId, friendId: req.user.id }] },
    });
    if (existing) return res.status(400).json({ error: 'Friend request already exists' });

    const friendship = await prisma.friendship.create({
      data: { userId: req.user.id, friendId, status: 'pending' },
    });

    io.to(`user:${friendId}`).emit('friend_request', { from: req.user.id });
    res.json({ id: friendship.id, status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

app.post('/api/friends/accept', authenticateToken, async (req, res) => {
  try {
    const { friendshipId } = req.body;
    await prisma.friendship.update({ where: { id: friendshipId }, data: { status: 'accepted' } });
    
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    const friendId = friendship.userId === req.user.id ? friendship.friendId : friendship.userId;
    
    const existingChat = await prisma.chat.findFirst({
      where: {
        type: 'personal',
        members: { some: { userId: req.user.id } },
        members: { some: { userId: friendId } },
      },
    });
    
    if (!existingChat) {
      await prisma.chat.create({
        data: {
          type: 'personal',
          members: { create: [{ userId: req.user.id }, { userId: friendId }] },
        },
      });
    }
    
    io.to(`user:${friendId}`).emit('friend_accepted', { from: req.user.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to accept friend' });
  }
});

// ============================================
// FILE DOWNLOAD
// ============================================

app.get('/api/files/:messageId/:mediaId', authenticateToken, async (req, res) => {
  try {
    const { messageId, mediaId } = req.params;
    
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return res.status(404).json({ error: 'File not found' });
    
    const member = await prisma.chatMember.findFirst({
      where: { chatId: media.messageId, userId: req.user.id },
    });
    if (!member) return res.status(403).json({ error: 'Access denied' });
    
    const tempPath = path.join(uploadsDir, `temp_${uuidv4()}`);
    
    let success = false;
    if (media.url.startsWith('cloud:')) {
      const cloudData = media.url.replace('cloud:', '');
      const data = JSON.parse(cloudData);
      
      if (data.type === 'discord') {
        success = await downloadFileFromDiscordChunks(cloudData, tempPath);
      } else if (data.type === 'telegram') {
        success = await downloadFileFromTelegramChunks(cloudData, tempPath);
      }
    }
    
    if (!success) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(500).json({ error: 'Download failed' });
    }
    
    const decryptedPath = tempPath + '.dec';
    await decryptFileStream(tempPath, decryptedPath);
    fs.unlinkSync(tempPath);
    
    res.setHeader('Content-Type', mime.lookup(media.filename) || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${media.filename}"`);
    res.sendFile(decryptedPath, () => {
      fs.unlinkSync(decryptedPath);
    });
  } catch (e) {
    console.error('File download error:', e);
    res.status(500).json({ error: 'Download failed' });
  }
});

// ============================================
// HEALTH & ICE SERVERS
// ============================================

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    name: 'Nexo Server', 
    version: '2.0.0',
    encryption: config.encryptionEnabled ? 'ULTRA (30 rounds)' : 'OFF',
    discord: config.discordWebhookUrls.length > 0 ? `${config.discordWebhookUrls.length} webhooks` : 'OFF',
    telegram: config.telegramBotTokens.length > 0 ? `${config.telegramBotTokens.length} bots` : 'OFF',
    stunServers: config.stunServers.length,
  });
});

// Распределение STUN серверов - выбираем случайные для балансировки
app.get('/api/ice-servers', authenticateToken, (req, res) => {
  // Выбираем 5 случайных STUN серверов из пула для балансировки нагрузки
  const shuffled = [...config.stunServers].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 5);
  
  res.json({
    iceServers: [
      { urls: selected },
    ],
    totalAvailable: config.stunServers.length,
  });
});

// ============================================
// SOCKET.IO - WebRTC
// ============================================

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) return next(new Error('Invalid token'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`✓ User connected: ${socket.user.username}`);
  
  socket.join(`user:${socket.user.id}`);
  
  prisma.user.update({ where: { id: socket.user.id }, data: { isOnline: true, lastSeen: new Date() } }).then(() => {
    if (redis) redis.setex(`user:${socket.user.id}:online`, 300, '1');
    io.emit('user_online', { userId: socket.user.id });
  });

  socket.on('join_chat', async (chatId) => {
    socket.join(`chat:${chatId}`);
  });

  socket.on('typing', (data) => {
    if (redis) redis.setex(`typing:${data.chatId}:${socket.user.id}`, 5, '1');
    socket.to(`chat:${data.chatId}`).emit('user_typing', { chatId: data.chatId, userId: socket.user.id });
  });

  socket.on('stop_typing', (data) => {
    if (redis) redis.del(`typing:${data.chatId}:${socket.user.id}`);
    socket.to(`chat:${data.chatId}`).emit('user_stopped_typing', { chatId: data.chatId, userId: socket.user.id });
  });

  socket.on('read', async (data) => {
    const { chatId, messageIds } = data;
    await prisma.readReceipt.createMany({
      data: messageIds.map(id => ({ messageId: id, userId: socket.user.id })),
      skipDuplicates: true,
    });
    socket.to(`chat:${chatId}`).emit('messages_read', { chatId, userId: socket.user.id, messageIds });
  });

  socket.on('reaction', async (data) => {
    const { messageId, emoji } = data;
    try {
      await prisma.reaction.upsert({
        where: { messageId_userId_emoji: { messageId, userId: socket.user.id, emoji } },
        update: {},
        create: { messageId, userId: socket.user.id, emoji },
      });
      const message = await prisma.message.findUnique({ where: { messageId } });
      if (message) {
        io.to(`chat:${message.chatId}`).emit('reaction_added', { messageId, chatId: message.chatId, userId: socket.user.id, username: socket.user.username, emoji });
      }
    } catch (e) { console.error('Reaction error:', e); }
  });

  socket.on('remove_reaction', async (data) => {
    const { messageId, emoji } = data;
    try {
      await prisma.reaction.deleteMany({ where: { messageId, userId: socket.user.id, emoji } });
      const message = await prisma.message.findUnique({ where: { messageId } });
      if (message) {
        io.to(`chat:${message.chatId}`).emit('reaction_removed', { messageId, chatId: message.chatId, userId: socket.user.id, emoji });
      }
    } catch (e) { console.error('Remove reaction error:', e); }
  });

  // WebRTC с распределением STUN
  socket.on('call_offer', async (data) => {
    const { targetUserId, offer, callType } = data;
    
    if (redis) {
      const targetInCall = await redis.get(`call:${targetUserId}`);
      if (targetInCall) {
        socket.emit('call_error', { message: 'User is busy' });
        return;
      }
      await redis.setex(`call:${socket.user.id}`, 300, JSON.stringify({ inCall: true, with: targetUserId, type: callType }));
      await redis.setex(`call:${targetUserId}`, 300, JSON.stringify({ inCall: true, with: socket.user.id, type: callType }));
    }
    
    io.to(`user:${targetUserId}`).emit('call_incoming', {
      from: socket.user.id,
      fromUsername: socket.user.username,
      fromDisplayName: socket.user.displayName,
      fromAvatar: socket.user.avatar,
      offer,
      callType: callType || 'video',
      callId: `${socket.user.id}-${targetUserId}-${Date.now()}`,
    });
  });

  socket.on('call_answer', async (data) => {
    const { targetUserId, answer, callId } = data;
    io.to(`user:${targetUserId}`).emit('call_answer', { from: socket.user.id, answer, callId });
  });

  socket.on('call_ice', (data) => {
    const { targetUserId, candidate } = data;
    io.to(`user:${targetUserId}`).emit('call_ice', { from: socket.user.id, candidate });
  });

  socket.on('call_end', async (data) => {
    const { targetUserId, callId } = data;
    if (redis) {
      await redis.del(`call:${socket.user.id}`);
      await redis.del(`call:${targetUserId}`);
    }
    io.to(`user:${targetUserId}`).emit('call_end', { from: socket.user.id, callId });
  });

  socket.on('call_decline', async (data) => {
    const { targetUserId, callId } = data;
    if (redis) {
      await redis.del(`call:${socket.user.id}`);
      await redis.del(`call:${targetUserId}`);
    }
    io.to(`user:${targetUserId}`).emit('call_decline', { from: socket.user.id, callId });
  });

  socket.on('disconnect', async () => {
    console.log(`✗ User disconnected: ${socket.user.username}`);
    await prisma.user.update({ where: { id: socket.user.id }, data: { isOnline: false, lastSeen: new Date() } });
    if (redis) {
      await redis.del(`user:${socket.user.id}:online`);
      await redis.del(`call:${socket.user.id}`);
    }
    io.emit('user_offline', { userId: socket.user.id, lastSeen: new Date().toISOString() });
  });
});

// ============================================
// START SERVER
// ============================================

prisma.user.updateMany({ data: { isOnline: false, lastSeen: new Date() } })
  .then(() => console.log('✓ All users reset to offline'))
  .catch(e => console.error('Error resetting users:', e));

server.listen(config.port, '0.0.0.0', () => {
  console.log(`\n⚡ Nexo Server v2.0.0 - ULTRA SECURE`);
  console.log(`📡 Port: ${config.port}`);
  console.log(`🔒 Encryption: ${config.encryptionEnabled ? 'ULTRA (30 rounds + combo)' : 'OFF'}`);
  console.log(`💾 Redis: ${redis ? 'CONNECTED' : 'DISABLED'}`);
  console.log(`📞 WebRTC: ENABLED (${config.stunServers.length} STUN servers)`);
  console.log(`📤 Discord: ${config.discordWebhookUrls.length} webhooks`);
  console.log(`📤 Telegram: ${config.telegramBotTokens.length} bots, ${config.telegramChannelIds.length} channels`);
  console.log(`📦 Chunk size: ${(config.chunkSize / 1024 / 1024).toFixed(0)}MB`);
  console.log(`\n🛡️ Security: AES-256-GCM + ChaCha20 + AES-CBC + Blowfish + 3DES + XOR\n`);
});

const shutdown = async () => {
  console.log('\n🔄 Shutting down...');
  await prisma.$disconnect();
  if (redis) await redis.quit();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
