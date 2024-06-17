import getCommonCode from '@salesforce/apex/NKS_ButtonContainerController.getCommonCodeName';

function callGetCommonCode(inputId) {
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

export function getOutputVariableValue(outputVariables, variableName) {
    return outputVariables.find((element) => element.name === variableName && element.value !== null)?.value;
}

export async function handleShowNotifications(
    flowName,
    outputVariables,
    notificationBoxTemplate,
    journalConversationNote = false
) {
    try {
        if (flowName.toLowerCase().includes('journal')) {
            const selectedThemeId = getOutputVariableValue(outputVariables, 'Selected_Theme_SF_Id');
            let journalTheme = '';
            if (selectedThemeId) {
                journalTheme = await callGetCommonCode(selectedThemeId);
            }
            let successMessage = journalConversationNote
                ? 'Samtalereferat er delt med bruker og henvendelsen er journalført'
                : 'Henvendelsen er journalført';
            notificationBoxTemplate.addNotification(successMessage, journalTheme);
        } else if (flowName.toLowerCase().includes('task')) {
            const selectedThemeId = getOutputVariableValue(outputVariables, 'Selected_Theme_SF_Id');
            const unitName = getOutputVariableValue(outputVariables, 'Selected_Unit_Name');
            const unitNumber = getOutputVariableValue(outputVariables, 'Selected_Unit_Number');
            let navTaskTheme = '';

            if (selectedThemeId) {
                navTaskTheme = await callGetCommonCode(selectedThemeId);
            }
            notificationBoxTemplate.addNotification(
                'Oppgave opprettet',
                `${navTaskTheme} Sendt til: ${unitNumber} ${unitName}`
            );
        } else if (flowName.toLowerCase().includes('redact')) {
            notificationBoxTemplate.addNotification('Henvendelsen er sendt til sladding');
        } else if (flowName.toLowerCase().includes('reserve')) {
            notificationBoxTemplate.addNotification('Henvendelsen er reservert');
        }
    } catch (error) {
        console.error('Error handling show notifications: ', error);
        if (Array.isArray(error.body)) {
            console.error('Error details: ', error.body.map((e) => e.message).join(', '));
        } else if (error.body && typeof error.body.message === 'string') {
            console.error(error.body.message);
        } else {
            console.error(error.message);
        }
    }
}
