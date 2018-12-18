import $ from 'jquery';
import {ast,SymbolicSub,Eval} from './code-analyzer';
import * as escodegen from 'escodegen';


$(document).ready(function () {
    let substitutedCode;
    $('#sub').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = ast(codeToParse);
        substitutedCode= SymbolicSub(parsedCode);
        $('#parsedCode').val(substitutedCode);
    });
    $('#eval').click(() => {
        let vector = JSON.parse(($('#inputVector').val()));
        let astSub=ast(substitutedCode);
        let evaluatedCode = Eval(astSub,vector);
        document.getElementById('coloredCode').innerHTML = escodegen.generate(evaluatedCode,{verbatim: 'isToColorGreen'});
    });

});
