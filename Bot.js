const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const qrcode = require('qrcode-terminal')

async function startRaytwo() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_raytwo')

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Raytwo Bot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('========== RAYTWO QR CODE ==========')
            qrcode.generate(qr, { small: true })
            console.log('Escaneie o QR Code acima no WhatsApp')
            console.log('====================================')
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Conexão fechada, reconectando...', shouldReconnect)
            if (shouldReconnect) {
                startRaytwo()
            }
        } else if (connection === 'open') {
            console.log('✅ RAYTWO CONECTADO COM SUCESSO!')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const comando = texto.toLowerCase().trim()
        const from = msg.key.remoteJid

        console.log(`Mensagem de ${from}: ${texto}`)

        if (comando === '!menu' || comando === 'menu' || comando === '.menu') {
            await sock.sendMessage(from, {
                text: `*🤖 RAYTWO - MENU*

Olá! Eu sou o Raytwo!

*COMANDOS:*
!menu - Ver este menu
!ping - Ver se estou online
!dono - Info do dono
!info - Sobre mim

Criado por raulcarlitosluis22-hash
Digite um comando!`
            })
        }

        if (comando === '!ping' || comando === 'ping') {
            await sock.sendMessage(from, { text: '🏓 Pong! Raytwo online e 100% ativo!' })
        }

        if (comando === '!dono') {
            await sock.sendMessage(from, { text: '👑 Dono: raulcarlitosluis22-hash\n🤖 Bot: Raytwo' })
        }

        if (comando === '!info') {
            await sock.sendMessage(from, { text: '🚀 Raytwo v1.0\nFeito com Baileys\nHospedado 24/7 no Render' })
        }

        // Resposta automática
        if (comando.includes('oi') || comando.includes('ola') || comando.includes('olá')) {
            if (comando.length < 10) {
                await sock.sendMessage(from, { text: 'Olá! 👋 Eu sou o Raytwo! Digite!menu para ver meus comandos' })
            }
        }
    })
}

startRaytwo()
console.log('Iniciando Raytwo...')
