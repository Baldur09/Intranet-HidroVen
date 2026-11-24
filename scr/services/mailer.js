require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

function mascararCorreo(correo) {
    if (!correo || !correo.includes('@')) return '***';
    const [usuario, dominio] = correo.trim().split('@');
    const visible = usuario.slice(0, 2);
    const ocultos = '*'.repeat(Math.max(usuario.length - 2, 2));
    return `${visible}${ocultos}@${dominio}`;
}

async function enviarCodigoRecuperacion(destinatario, codigo) {
    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: destinatario,
        subject: 'Código de recuperación de contraseña - Intranet Hidroven',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 440px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="margin-top: 0; color: #0f172a;">Recuperación de Contraseña</h2>
                <p style="color: #334155; font-size: 14px;">
                    Utiliza el siguiente código de 6 dígitos para continuar con la recuperación de tu contraseña:
                </p>
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 14px; background: #f1f5f9; color: #005691; text-align: center; border-radius: 8px; margin: 16px 0;">
                    ${codigo}
                </div>
                <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                    Este código vence en 10 minutos. Si no solicitaste este cambio, ignora este correo.
                </p>
            </div>
        `
    });
}

module.exports = {
    transporter,
    mascararCorreo,
    enviarCodigoRecuperacion
};