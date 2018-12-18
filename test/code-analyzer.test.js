import assert from 'assert';
import * as escodegen from 'escodegen';
import {Eval,SymbolicSub,CopyArr,isAssignment,isDeclaration,ast,isContainName,isNotFiltered} from '../src/js/code-analyzer';

describe('The javascript substitution basic functions', () => {
    it('Deep copy of one array to the another.', () => {
        assert.deepEqual(CopyArr([3,4,5,6,7],[1,2]),[1,2,3,4,5,6,7]);
    });
    it('is expression of type assignment expression and need to be removed from the code.', () => {
        assert.equal(isAssignment(ast('a = 1;').body[0]),true);
    });
    it('is expression of type deceleration statement and need to be removed from the code.', () => {
        assert.equal(isDeclaration(ast('let b = x+y+z;').body[0]),true);
    });
    it('is the maps array contains a certain name.', () => {
        assert.deepEqual(isContainName([{name:'simona',value:2},{name:'The Josh',value:0},{name:'The Rotem',
            value:3}],'The Rotem'),3);
    });
    it('is need to be removed by filter from the ast; if it is an assignment which not shown in parameter or a let statement', () => {
        assert.equal(isNotFiltered(ast('let a=b-z;').body[0]),true);
    });
});
describe('basic substitute of let statement', () => {
    it('is substitution of let statement works.', () => {
        assert.equal(SymbolicSub(ast('let a;')),'let a;');
    });
});
describe('The javascript substitution', () => {
    it('is substitution of ifs and elses works', () => {
        assert.equal(SymbolicSub(ast('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' + '        return x + y + z + c;\n' + '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '        return x + y + z + c;\n' + '    } else {\n' + '        c = c + z + 5;\n' + '        return x + y + z + c;\n' + '    }\n' +
            '}\n')),'function foo(x, y, z) {\n' +
            '    if (x + 1 + y < z) {\n' +
            '        return x + y + z + (0 + 5);\n' +
            '    } else if (x + 1 + y < z * 2) {\n' +
            '        return x + y + z + (0 + x + 5);\n' +
            '    } else {\n' +
            '        return x + y + z + (0 + z + 5);\n' +
            '    }\n' +
            '}');
    });
});

describe('The javascript substitution', () => {
    it('is substitution of for loops works', () => {
        assert.equal(SymbolicSub(ast('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    for(let i=0 ; i<a; i++) {\n' +
            '        c = c + 5;\n' +
            '}\n' +
            '        return x + y + z + c;\n' +
            '}\n')),'function foo(x, y, z) {\n' +
            '    for (let i = 0; 0 < x + 1; 0++) {\n' +
            '    }\n' +
            '    return x + y + z + 0;\n' +
            '}');
    });
});

describe('The javascript evaluation with while loop', () => {
    it('is evaluation of function with a while works.', () => {
        assert.equal(escodegen.generate(Eval(ast(SymbolicSub(ast('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    while (a < z) {\n' +
            '        c = a + b;\n' +
            '        z = c * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}'))),JSON.parse('{"x":1,"y":2,"z":2}'))),'function foo(x, y, z) {\n' +
            '    while (x + 1 < z) {\n' +
            '        z = (x + 1 + (x + 1 + y)) * 2;\n' +
            '    }\n' +
            '    return z;\n' +
            '}');
    });
});

describe('The javascript evaluation with ifs', () => {
    it('is evaluation of function with a ifs and elses works.', () => {
        assert.equal(escodegen.generate(Eval(ast(SymbolicSub(ast('function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' + '    \n' + '    if (b < z) {\n' + '        c = c + 5;\n' + '        return x + y + z + c;\n' + '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }\n' +
            '}\n'))),JSON.parse('{"x":1,"y":2,"z":2}'))),'function foo(x, y, z) {\n' +
            '    if (x + 1 + y < z) {\n' +
            '        return x + y + z + (0 + 5);\n' +
            '    } else if (x + 1 + y < z * 2) {\n' +
            '        return x + y + z + (0 + x + 5);\n' +
            '    } else {\n' +
            '        return x + y + z + (0 + z + 5);\n' +
            '    }\n' +
            '}');
    });
});

describe('The javascript evaluation with ifs', () => {
    it('is evaluation of function with a ifs and elses works.', () => {
        assert.equal(escodegen.generate(Eval(ast(SymbolicSub(ast('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;   \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '}\n' +
            'return a;\n' +
            '}'))),JSON.parse('{"x":1,"y":8,"z":16}'))),'function foo(x, y, z) {\n' +
            '    if (x + 1 + y < z) {\n' +
            '        return x + y + z + (0 + 5);\n' +
            '    }\n' +
            '    return x + 1;\n' +
            '}');
    });
});