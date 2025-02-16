FROM node:18

WORKDIR /usr/src/app

# Copiar los archivos de tu proyecto a la carpeta de trabajo
COPY package*.json ./

# Instalar las dependencias
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Exponer el puerto en el que tu app va a correr
EXPOSE 3000

# Definir la variable de entorno para Firebase (si fuera necesario)
# (aquí puedes agregar un volumen o establecer la clave de servicio como variable de entorno)
# ENV GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
