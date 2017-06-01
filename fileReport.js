var fs = require('fs');

module.exports = function(result) {
    'use strict';

    if (result) {
        try {
            if (line.indexOf('{') !== -1) {
                // Делаем JSON.parse, JSON.stringify чтобы убедиться, что пришел валидный JSON и его можно
                // писать в файл для дальнейшей обработки
                var out = JSON.parse(result);
                fs.writeFileSync(`qunit-report-${out.file}.json`, JSON.stringify(out.data), 'utf8');
            }
        } catch (ignore) {}
    }
};
