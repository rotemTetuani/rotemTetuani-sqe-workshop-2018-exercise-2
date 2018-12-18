import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';
import * as evaluate from 'static-eval';

export {ast, SymbolicSub, Eval, isAssignment, isDeclaration, CopyArr, isContainName, isNotFiltered};

let envs = [[]];
let params = [[]];
const ast = (codeToParse) => {
    return esprima.parseScript(codeToParse, {loc: true, range: true}, function (node) {
        node['expr'] = codeToParse.substring(node.range[0], node.range[1]);
    });
};
/*----------------------------------------------------------------------------------- SUBSTITUTION ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------- Function Declaration ---------------------------------------------------------------------------------------------------------------------------------------------------*/
const SS_FunctionDeclaration = (node) => {
    let exprs = node.params.map(x => x.expr);
    envs[envs.length - 1] = envs[envs.length - 1].filter((x) => !(params.includes(x.name))); // delete the parameter from the current environment
    params.push(CopyArr(params[params.length - 1], exprs));
};
/*------------------------------------------------------------------------------- Variable Declarator ---------------------------------------------------------------------------------------------------------------------------------------------------*/
const SS_VariableDeclarator = (node) => {
    if (node.init) {
        (envs[envs.length - 1]).push({name: node.id.name, value: node.init});
    }
};
/*------------------------------------------------------------------------------- Lexical Binding Expression Statement ---------------------------------------------------------------------------------------------------------------------------------------------------*/
const SS_Expression = () => {
    envs.push(CopyArr(envs[envs.length - 1], []));
};
/*------------------------------------------------------------------------------- Lexical Binding Block Statement ---------------------------------------------------------------------------------------------------------------------------------------------------*/
const SS_Block = () => {
    envs.push(CopyArr(envs[envs.length - 1], []));
};
/*------------------------------------------------------------------------------- Lexical Binding Assignment Statement ---------------------------------------------------------------------------------------------------------------------------------------------------*/
const SS_Assignment = (node) => {
    (envs[envs.length - 1]).push({name: node.left.name, value: node.right});
};
/*------------------------------------------------------------------------------- Lexical Binding Identifier  ---------------------------------------------------------------------------------------------------------------------------------------------------*/
const SS_Identifier = (node, parent) => {
    let res = isContainName(envs[envs.length - 1], node.name);
    if (res != null) {
        if (DeclerationNotSub(parent, node))
            return node;
        else if (assignmentNotSub(parent, node))
            return node;
        else {
            return res;
        }
    }
};

const SymbolicSubstitution = (type) => {
    let funcs = {
        'VariableDeclarator': SS_VariableDeclarator,
        'ExpressionStatement': SS_Expression,
        'AssignmentExpression': SS_Assignment,
        'BlockStatement': SS_Block,
        'Identifier': SS_Identifier,
        'FunctionDeclaration': SS_FunctionDeclaration
    };
    return funcs[type] ? funcs[type] : () => {
    };
};


const SymbolicSub = (ast) => {
    estraverse.replace(ast, {
        enter: function (node, parent) {
            if (!(node.type === 'AssignmentExpression' || node.type === 'VariableDeclarator'))
                return SymbolicSubstitution(node.type)(node, parent);
        }
        , leave: function (node, parent) {
            if (node.type === 'FunctionDeclaration')
                params.pop();
            if (node.type === 'BlockStatement') {
                envs.pop();
                node.body = (node.body).filter((x) => !(isNotFiltered(x)));
            }
            if (node.type === 'AssignmentExpression' || node.type === 'VariableDeclarator')
                SymbolicSubstitution(node.type)(node, parent);
        }
    });
    return escodegen.generate(ast);
};


//In case of expression statement or variable declaration we will not want to keep this nodes in the ast.
const isNotFiltered = (x) => {
    return isDeclaration(x) || isAssignment(x);
};

//Copies one array to the other deeply.
const CopyArr = (toCopy, copy) => {
    for (let i = 0; i < toCopy.length; i++)
        copy.push(toCopy[i]);
    return copy;
};

//Is the array contains the key name.
const isContainName = (arr, name) => {
    let res = arr.filter((x) => x.name === name);
    return res.length != 0 ? res[res.length - 1].value : null;
};

/*-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
const isDeclaration = (x) => {
    return (x.type === 'ExpressionStatement' && (x.expression.type === 'VariableDeclaration')) || x.type === 'VariableDeclaration';
};

const isAssignment = (x) => {
    return ((x.type === 'ExpressionStatement' && (x.expression.type === 'AssignmentExpression') &&
        !params[params.length - 1].includes(x.expression.left.expr)));
    //|| (x.type === 'AssignmentExpression' &&
    //!params[params.length-1].includes(x.expr)));
};

function DeclerationNotSub(parent, node) {
    return (parent.type === 'VariableDeclarator' && (parent.id.name === node.name));
}

function assignmentNotSub(parent, node) {
    return (parent.type === 'AssignmentExpression' && (parent.left.name === node.name));
}

/*----------------------------------------------------------------------------------------------- EVALUATION ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------- If Statement Evaluation ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
const EV_If = (node, vector) => {
    node.test['isToColorGreen'] = evaluate(node.test, vector) === true ? '<mark style="background-color: palegreen">' +
        node.test.expr + '</mark>' : '<mark style="background-color: salmon">' + node.test.expr + '</mark>';
};

const Evaluation = (type) => {
    let funcs = {
        'IfStatement': EV_If,
    };
    return funcs[type] ? funcs[type] : () => {
    };
};

const Eval = (astSub, vector) => {
    estraverse.replace(astSub, {
        enter: function (node) {
            return Evaluation(node.type)(node, vector);
        }
    });
    return astSub;
};