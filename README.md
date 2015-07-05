GRA Website
===========

Init
----

Make sure you have Bower and Gulp installed:

    $ npm install -g bower
    $ npm install -g gulp

Install dependencies:

    $ npm install
    $ bower install

Fill Amazon S3 configuration:

    $ cp config.json.txt config.json && subl config.json

Requisitos de publicación
-------------------------

1. Texto en castellano y catalan en formato .odt (LibreOffice)
2. Resumen del articulo entre X e Y caracteres. Para mirarlo en LibreOffice: `Tools > Word Count`, mirar "Document: Characters including spaces".
3. Lista de conceptos ("palabras clave") (entre 3 y 10) en castellano y catalan. El concepto puede tener varias palabras, ej.: "Democracia Inclusiva".
4. Una imagen de mínimo 1200x1200 pixeles.

Imagenes derivadas para redes sociales
--------------------------------------

Partiendo de una imagen de 1200x1200 (`sfull`) se recorta:

- `slarge`: 1200x630. Para Open Graph (Facebook) y Schema.org (Google).
- `smedium`: 560x300. Para Twitter Card "Summary with large image".
- `ssmall`: 240x240. Para Twitte Card "Summary". Twitter puede que lo reescale a 120x90.

Amazon S3
---------

1. Crear un _bucket_ en Iralanda con el dominio (+subdominio): `www.grupreflexioautonomia.org`
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
