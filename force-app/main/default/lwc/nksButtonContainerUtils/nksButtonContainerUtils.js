import getCommonCode from '@salesforce/apex/NKS_ButtonContainerController.getCommonCodeName';

export function callGetCommonCode(inputId) {
    return getCommonCode({ id: inputId })
        .then((result) => {
            console.log('result: ', result);
            return result;
        })
        .catch((error) => {
            console.error('Error calling getCommonCode(): ', error);
            throw error;
        });
}

export function getOutputVariableValue(outputVaribales, variableName) {
    return outputVaribales.find((element) => element.name === variableName && element.value !== null)?.value;
}
