# Usamos una imagen base de Node.js
FROM node:16-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de tu proyecto React al contenedor
COPY . .

# Instalamos las dependencias de React
RUN npm install

# Exponemos el puerto 3000 para la app React
EXPOSE 3000

# Comando para iniciar la aplicación React
CMD ["npm", "start"]
