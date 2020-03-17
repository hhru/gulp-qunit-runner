const fs = require('fs');

module.exports = function(result) {
    if (!result || !result.includes('{')) {
        return;
    }
    try {
        // Делаем JSON.parse, JSON.stringify чтобы убедиться, что пришел валидный JSON и его можно
        // писать в файл для дальнейшей обработки
        const out = JSON.parse(result);
        if (!out.data) {
            return;
        }
        fs.writeFileSync(`qunit-report-${out.file}.json`, JSON.stringify(out.data, null, 4), 'utf8');
    } catch (ignore) {}
};
