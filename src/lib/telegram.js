const TOKEN   = import.meta.env.VITE_TELEGRAM_TOKEN
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID

export async function enviarAlertaTelegram(mensaje) {
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensaje,
        parse_mode: 'HTML'
      })
    })
  } catch (err) {
    console.error('Error Telegram:', err)
  }
}