# API

Instalar ngrok: https://ngrok.com/download

Extraer el zip en una carpeta y añadirla al PATH: En variables de sistema

Ejecutar en terminal:
>> ngrok --version

>> ngrok authtoken 2t8A3o6vV6u6ZAE5oeTILXPFPjT_7WU2sL3ezkL9uS9zDqBbc

Iniciar ngrok, va a dar una url temporal, cada que se inicia es distinta por lo que se debe cambiar en código para ejecutar.
>> ngrok http 3000

Abrir otra terminal y ejecutar la api
>> node server.js

ngrok debe ejecutarse primero