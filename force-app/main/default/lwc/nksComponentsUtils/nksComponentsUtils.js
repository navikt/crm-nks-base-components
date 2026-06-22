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

export function getOutputVariableValue(outputVariables, variableName) {
    return outputVariables.find((element) => element.name === variableName && element.value !== null)?.value;
}

function addNotification(notificationBoxTemplate, message, optionalText = null, variant = 'success') {
    notificationBoxTemplate.addNotification(message, optionalText, variant);
}

// Used with flows to show notifications based on flow outcome
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
        const existingJournal = getOutputVariableValue(outputVariables, 'Existing_Journal');
        const theme = selectedThemeId ? await callGetCommonCode(selectedThemeId) : '';

        if (flowNameLower.includes('journal')) {
            const message = existingJournal
                ? 'Henvendelsen er allerede journalført'
                : journalConversationNote
                  ? 'Samtalereferat er delt med bruker og henvendelsen er journalført'
                  : 'Henvendelsen er journalført';
            addNotification(notificationBoxTemplate, message, theme, 'success');
        } else if (flowNameLower.includes('task')) {
            addNotification(
                notificationBoxTemplate,
                'Oppgaven er lagret, og blir sendt når samtalereferat er opprettet.',
                null,
                'warning'
            );
        } else if (flowNameLower.includes('redact')) {
            addNotification(notificationBoxTemplate, 'Henvendelsen er sendt til sladding', null, 'success');
        } else if (flowNameLower.includes('reserve')) {
            addNotification(notificationBoxTemplate, 'Henvendelsen er reservert', null, 'success');
        }
    } catch (error) {
        console.error('Error handling show notifications:', error);
        const errorMessage = Array.isArray(error?.body)
            ? error.body.map((e) => e.message).join(', ')
            : error?.body?.message || error.message;
        console.error('Error message:', errorMessage);
    }
}

/*
How to use these methods:
1. Add <c-nks-notification-box></c-nks-notification-box> or any other custom notification component which implements the addNotification method
2. Get a reference to the component in JS
3. Call the helpers from nksComponentsUtils, passing the reference as the first arg
*/

export function addSuccessNotification(notificationBoxTemplate, message, optionalText = null) {
    addNotification(notificationBoxTemplate, message, optionalText, 'success');
}

export function addWarningNotification(notificationBoxTemplate, message, optionalText = null) {
    addNotification(notificationBoxTemplate, message, optionalText, 'warning');
}

export function addErrorNotification(notificationBoxTemplate, message, optionalText = null) {
    addNotification(notificationBoxTemplate, message, optionalText, 'error');
}

export function resolve(path, obj) {
    if (typeof path !== 'string') {
        throw new Error('Path must be a string');
    }

    return path.split('.').reduce(function (prev, curr) {
        return prev ? prev[curr] : null;
    }, obj || {});
}

export function handleAddressCopy(event) {
    const hiddenInput = document.createElement('textarea');
    const eventValue = event.currentTarget.value;
    hiddenInput.value = eventValue.replace(/,\s*/g, '\n');
    document.body.appendChild(hiddenInput);
    hiddenInput.focus();
    hiddenInput.select();
    // eslint-disable-next-line @locker/locker/distorted-document-exec-command
    document.execCommand('copy');
    document.body.removeChild(hiddenInput);
    event.currentTarget.focus();
}
