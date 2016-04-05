---
draft:      true
title:      Título
# subtitle:   Subtítulo
keywords:   [a, b, c]
# tags:       [other]
# authors:    [Un autor, otro autor, opcional]
# note:       Una nota que saldra arriba del articulo
# files:
#     - ['PDF en català',      'some_file.pdf']
#     - ['PDF en castellano',  'some_file.pdf']
---

Las opciones de arriba están en formato YAML (lo que esta entre el par de `---`). El texto (lo que viene despues del segundo `---`) esta escrito en Markdown. Mirar https://markdown-it.github.io como referencia.

Mientras `draft` sea `true` no se publicara al hacer el deploy. Para publicarlo poner `draft: false`.

Si quieres que el texto salga en el apartado de "Otros autores", descomenta (quitar `#` del principio) la linea de `tags`. Mirar `content/articles/20160219-cup-fins-coll_ca.md` ante la duda.

Todas las variables YAML que estan comentadas son opcionales.
