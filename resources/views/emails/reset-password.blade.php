<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restablecer tu contraseña - Ohana</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
        
        body {
            font-family: 'Poppins', sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        
        .email-header {
            background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 600;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 5px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        .email-header h1 {
            margin: 8px 0 0 0;
            font-size: 20px;
            color: #fff;
            font-weight: 400;
        }
        
        .email-content {
            padding: 35px 30px;
            color: #555;
        }
        
        .email-content p {
            margin-bottom: 20px;
            font-size: 15px;
        }
        
        .btn-reset {
            display: inline-block;
            background-color: #ff7d7d;
            color: white !important;
            text-decoration: none;
            padding: 15px 35px;
            border-radius: 50px;
            margin: 25px 0;
            font-weight: 500;
            letter-spacing: 0.5px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(255, 125, 125, 0.3);
        }
        
        .btn-reset:hover {
            background-color: #ff6565;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(255, 125, 125, 0.4);
        }
        
        .url-box {
            background-color: #f9f9f9;
            border: 1px dashed #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            word-break: break-all;
            margin: 20px 0;
            font-size: 14px;
            color: #666;
        }
        
        .note {
            font-size: 13px;
            color: #888;
            font-style: italic;
            border-left: 3px solid #ff7d7d;
            padding-left: 15px;
        }
        
        .email-footer {
            background-color: #f5f5f5;
            padding: 20px 15px;
            text-align: center;
            font-size: 13px;
            color: #888;
            border-top: 1px solid #eeeeee;
        }
        
        .social-links {
            margin: 15px 0 10px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #888;
            text-decoration: none;
        }
        
        .divider {
            height: 3px;
            width: 50px;
            background: linear-gradient(90deg, #ff9a9e 0%, #fad0c4 100%);
            margin: 0 auto 25px;
            border-radius: 3px;
        }
        
        .signature {
            margin-top: 25px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="logo">OHANA</div>
            <h1>Restablecer tu contraseña</h1>
        </div>
        
        <div class="email-content">
            <p>Hola,</p>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Ohana</strong>. Si no solicitaste este cambio, puedes ignorar este correo y tu cuenta seguirá segura.</p>
            
            <div class="divider"></div>
            
            <p>Para crear una nueva contraseña y acceder nuevamente a nuestra tienda online, haz clic en el botón a continuación:</p>
            
            <div style="text-align: center;">
                <a href="http://ohanatienda.ddns.net:3000/new-password/{{ $token }}?email={{ $email }}" class="btn-reset">
                    Restablecer mi contraseña
                </a>
            </div>
            
            <p class="note"><strong>Importante:</strong> Este enlace es válido solo por 60 minutos por motivos de seguridad.</p>
            
            <p>Si tienes problemas con el botón, puedes copiar y pegar esta dirección en tu navegador:</p>
            
            <div class="url-box">
            http://ohanatienda.ddns.net:3000/new-password/{{ $token }}?email={{ $email }}
            </div>
            
            <div class="signature">
                <p>¡Gracias por ser parte de nuestra familia Ohana!</p>
                <p>El equipo de Ohana<br>
                <small>Moda que conecta</small></p>
            </div>
        </div>
        
        <div class="email-footer">
            <div class="social-links">
                <a href="#">Instagram</a> • 
                <a href="#">Facebook</a> • 
                <a href="#">Twitter</a>
            </div>
            <p>&copy; {{ date('Y') }} Ohana. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>