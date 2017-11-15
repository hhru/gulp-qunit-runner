# gulp-qunit-runner

Инструмент для запуска qunit тестов на phantomjs

## Использование

```
const qunit = require('@hhru/gulp-qunit-runner');
...
qunit(files, [options]) 
```

## Принимаемые параметры:

suitTimeoutSeconds — ограничение времени на сьют
bufferSizeInKB — ограничение на размер буфера вывода и ошибок в килобайтах
