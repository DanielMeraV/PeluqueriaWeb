const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'No se proporcionó token de autenticación'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).json({
            message: 'Token inválido o expirado'
        });
    }
}

module.exports = authMiddleware;