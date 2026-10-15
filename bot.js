const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys')
const P = require('pino')
const qrcode = require('qrcode-terminal')

async function startRaytwo() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const peuga = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['Raytwo Bot', 'Chrome', '1.0.0']
    })

    // SE TIVER NÚMERO, USA CÓDIGO DE PAREAMENTO
    if (!peuga.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER || process.env.NUMBER || '244953979926'
        if (phoneNumber) {
            setTimeout(async () => {
                let code = await peuga.requestPairingCode(phoneNumber)
                console.log('================================')
                console.log(`SEU CÓDIGO DE PAREAMENTO: ${code}`)
                console.log(`NÚMERO: ${phoneNumber}`)
                console.log('Vai no WhatsApp > Aparelhos conectados > Conectar com número')
                console.log('================================')
            }, 3000)
        }
    }

    peuga.ev.on('creds.update', saveCreds)

    peuga.ev.on('connection.update', async (a) => {
        const { connection, lastDisconnect, qr } = a

        if (qr) {
            console.log('======== CÓDIGO QR RAYTWO ========')
            qrcode.generate(qr, { small: true })
            console.log('Escaneie o QR Code acima OU use o código de pareamento')
            console.log('==================================')
        }

        if (connection === 'close') {
            const deveReconectar = lastDisconnect?.error?.output?.statusCode!== 401
            console.log('Conexão fechada, reconectando...')
            if (deveReconectar) {
                startRaytwo()
            }
        } else if (connection === 'open') {
            console.log('✅ RAYTWO CONECTADO COM SUCESSO!')
        }
    })

    peuga.ev.on('messages.upsert', async (m) => {
        const mensagem = m.messages[0]
        if (!mensagem.message || mensagem.key.fromMe) return

        const texto = mensagem.message.conversation || mensagem.message.extendedTextMessage?.text || ''
        const comando = texto.toLowerCase().trim()
        const de = mensagem.key.remoteJid

        console.log(`Mensagem de ${de}: ${texto}`)

        if (comando === '!menu' || comando === 'menu' || comando === '!help') {
            await peuga.sendMessage(de, {
                text: `*🤖 RAYTWO - MENU*

Olá! Eu sou o Raytwo!

*COMANDOS:*
!menu - Ver este menu
!ping - Ver se estou online
!dono - Informações do dono
!info - Sobre mim

Criado por raulcarlitosluis22-hash
Digite um comando!`
            })
        }

        if (comando === '!ping' || comando === 'ping') {
            await peuga.sendMessage(de, { text: '🏓 Pong! Raytwo online! ✅' })
        }

        if (comando === '!dono') {
            await peuga.sendMessage(de, { text: '*👑 Dono: raulcarlitosluis22-hash*\nNúmero: 244953979926' })
        }

        if (comando === '!info') {
            await peuga.sendMessage(de, { text: '*🤖 Raytwo Bot*\nVersão 1.0\nCriado em Angola 🇦🇴' })
        }
    })
}

startRaytwo()
