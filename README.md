GRA website
===========

El website funciona sobre un _"generador de websites estáticos"_ escrito en [Node.js](https://nodejs.org) (JavaScript). Esto quiere decir que **todas** las páginas se generan de forma local y después se suben a un servidor. Entre las ventajas: es rápido, seguro y barato de alojar. El principal inconveniente es que no hay ninguna página online para administrarlo y se necesitan más conocimientos técnicos para mantenerlo.

## Instalar Node.js

1. [Instalar `nvm`](https://github.com/creationix/nvm#install-script)
2. Instalar la version `4.2.x` de node: `nvm install 4.2`
3. Instalar [Gulp](http://gulpjs.com) y [Bower](http://bower.io): `npm install -g bower gulp-cli`

## Preparar entorno de trabajo

1. Descargar el proyecto desde GitHub: `git clone https://github.com/grautonomia/web gra-web`
2. Instalar dependencias. Dentro de la carpeta `lamia`: `npm install && bower install`
3. Rellenar datos de _Amazon S3_: `cp deploy.json.txt deploy.json`. Abrir `deploy.json` y rellenar.

## Poner en marcha el servidor de desarrollo

En la carpeta `lamia` ejecuta `gulp`. Al cabo de un rato deberia de abrir la ventana del navegador. Segun vas haciendo cambios el navegador se actualizara automaticamente.

## Añadir un nuevo artículo o evento

1. Copiar el par de plantillas de `templates` a la respectiva carpeta `content/articles` o `content/events`.
2. Renombrar.
    - Cambiar la fecha según formato: `YYYYMMDD`. En el caso del articulo representa la fecha de publicación, para los eventos representa el día del evento.
    - Elige un nombre único para el archivo, mejor si no contiene espacios, la separación entre palabras sera con un guión (`-`). Es el mismo nombre para la versión catalana y castellana lo único que cambia es la parte final (`_ca` o `_es`). **Este nombre no se deberia de cambiar una vez públicado, se utiliza como ID para los comentarios. Si se le cambia el nombre al archivo se perderan los comentarios.**
3. Rellenar los archivos.
4. Ante la duda de como nombrar un fichero o como rellenarlo, fijate en el patrón que siguen los demas artículos.
5. Una vez este OK el contenido, subirlo a Git.

## Compilar y publicar los contenidos en el servidor

1. En la carpeta `lamia`: `gulp deploy`
2. Subir `lamia/.awspublish-www.grupreflexioautonomia.org` a Git.

## Subir los cambios al repositorio Git

1. Crear cuenta en GitHub pedir permiso para publicar.
2. Subir cambios. Ver: https://www.atlassian.com/git/tutorials/saving-changes/git-commit

---

## Amazon S3

**No hace falta hacer esto si la web ya esta online.**

1. Crear un _bucket_ en Irlanda con el dominio (+subdominio): `www.grupreflexioautonomia.org`
2. Cambiar _bucket policy_ (`Permissions > Edit bucket policy`) para permitir acceso público:
```json
{
  "Version":"2012-10-17",
  "Statement":[{
      "Sid":"PublicReadGetObject",
      "Effect":"Allow",
      "Principal": "*",
      "Action":["s3:GetObject"],
      "Resource":["arn:aws:s3:::www.grupreflexioautonomia.org/*"]
    }
  ]
}
```
3. Activar hosting estático (`Static Website Hosting > Enable website hosting`). Rellenar formulario con `index.html` y `error.html`.
4. Crear un usuario y darle permisos (`IAM Service > Users > "X-User" > Permissions > Inline Policies > Create User Policy`) solo para el _bucket_ en cuestión:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Stmt1413656969000",
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": [
        "arn:aws:s3:::www.grupreflexioautonomia.org",
        "arn:aws:s3:::www.grupreflexioautonomia.org/*"
      ]
    }
  ]
}
```
5. Cambiar DNS para que apunte al _bucket_: `www 600 IN CNAME www.grupreflexioautonomia.org.s3-website-eu-west-1.amazonaws.com.`
