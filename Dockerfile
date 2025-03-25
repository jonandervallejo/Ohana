# Usar la imagen base de PHP 8.1 con Apache
FROM php:8.1-apache

# Instalar dependencias y extensiones necesarias
RUN apt-get install -y gnupg2 && \
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 4E5E8A3B8D9F7E6D && \
    apt-get update && \
    apt-get install -y libpng-dev libjpeg-dev libfreetype6-dev zip git && \
    docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install gd && \
    docker-php-ext-install pdo pdo_mysql

# Habilitar el módulo mod_rewrite de Apache
RUN a2enmod rewrite

# Copiar el código del proyecto dentro del contenedor
COPY . /var/www/html/

# Establecer permisos en los directorios necesarios
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Configurar el entorno de trabajo (si es necesario)
WORKDIR /var/www/html

# Exponer el puerto 80 para que sea accesible
EXPOSE 80

# Iniciar Apache en primer plano
CMD ["apache2-foreground"]

