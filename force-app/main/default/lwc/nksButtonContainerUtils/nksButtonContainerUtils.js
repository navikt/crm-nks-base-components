import getCommonCode from '@salesforce/apex/NKS_ButtonContainerController.getCommonCodeName';

async function callGetCommonCode(inputId) {
    try {
        const result = await getCommonCode({ id: inputId });
        console.log('Result: ', result);
        return result;
    } catch (error) {
        console.error('Error calling getCommonCode():', error);
        throw error;
    }
}

function getOutputVariableValue(outputVariables, variableName) {
    return outputVariables.find((element) => element.name === variableName && element.value !== null)?.value;
}

function addNotification(notificationBoxTemplate, message, optionalText = '') {
    notificationBoxTemplate.addNotification(message, optionalText);
}

export async function handleShowNotifications(
    flowName,
    outputVariables,
    notificationBoxTemplate,
    journalConversationNote = false
) {
    const publishNotification = getOutputVariableValue(outputVariables, 'Publish_Notification');

    if (!publishNotification) return;
    try {
        const flowNameLower = flowName.toLowerCase();
        const selectedThemeId = getOutputVariableValue(outputVariables, 'Selected_Theme_SF_Id');
        const theme = selectedThemeId ? await callGetCommonCode(selectedThemeId) : '';

        if (flowNameLower.includes('journal')) {
            const message = journalConversationNote
                ? 'Samtalereferat er delt med bruker og henvendelsen er journalført'
                : 'Henvendelsen er journalført';
            addNotification(notificationBoxTemplate, message, theme);
        } else if (flowNameLower.includes('task')) {
            const unitName = getOutputVariableValue(outputVariables, 'Selected_Unit_Name');
            const unitNumber = getOutputVariableValue(outputVariables, 'Selected_Unit_Number');
            const optionalText = `${theme}\xa0\xa0\xa0\xa0\xa0Sendt til: ${unitNumber} ${unitName}`;
            addNotification(notificationBoxTemplate, 'Oppgave opprettet', optionalText);
        } else if (flowNameLower.includes('redact')) {
            addNotification(notificationBoxTemplate, 'Henvendelsen er sendt til sladding');
        } else if (flowNameLower.includes('reserve')) {
            addNotification(notificationBoxTemplate, 'Henvendelsen er reservert');
        }
    } catch (error) {
        console.error('Error handling show notifications:', error);
        const errorMessage = Array.isArray(error?.body)
            ? error.body.map((e) => e.message).join(', ')
            : error?.body?.message || error.message;
        console.error('Error message:', errorMessage);
    }
}
