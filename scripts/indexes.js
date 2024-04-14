const generateIndexes = require('../build/generateIndexes/generateIndexes.js').default;
generateIndexes('./src', { excludeDirNames: ['__test__'] });
