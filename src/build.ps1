# Assemble le site : src/site.html + src/model.js + photo -> site/index.html (page autonome) et site/page.html (version artefact)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path (Split-Path -Parent $here) 'site'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$page = [IO.File]::ReadAllText((Join-Path $here 'site.html'), $utf8)
$js = [IO.File]::ReadAllText((Join-Path $here 'model.js'), $utf8)
$photo = 'data:image/jpeg;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $here 'photo.jpg')))
$page = $page.Replace('/*__MODEL__*/', $js).Replace('__PHOTO__', $photo)
[IO.File]::WriteAllText((Join-Path $out 'page.html'), $page, $utf8)
$full = "<!doctype html>`n<html lang=`"fr`" data-lang=`"fr`">`n<head>`n<meta charset=`"utf-8`">`n<meta name=`"viewport`" content=`"width=device-width,initial-scale=1,viewport-fit=cover`">`n<style>html,body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>`n</head>`n<body>`n" + $page + "`n</body>`n</html>`n"
[IO.File]::WriteAllText((Join-Path $out 'index.html'), $full, $utf8)
"built " + (Get-Item (Join-Path $out 'index.html')).Length
