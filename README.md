GRA website
===========

Init
----

Make sure you have Bower and Gulp installed:

    $ npm install -g bower
    $ npm install -g gulp

Install dependencies on the `lamia` folder:

    $ npm install && bower install

Fill Amazon S3 configuration on the `lamia` folder:

    $ cp deploy.json.txt deploy.json && atom deploy.json

Desarrollo
----------

En la carpeta de `lamia`.

Poner en marcha el servidor de desarrollo:

    $ gulp

Hacer un deploy:

    $ gulp deploy

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
