import React, { useCallback, useMemo } from 'react';
import { Box, Button, Field } from '@rocket.chat/fuselage';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useForm } from '../../../../../client/hooks/useForm';
import { useEndpointAction } from '../../../../../client/hooks/useEndpointAction';
import ParticipantForm from './ParticipantForm';

export function CreateParticipant({ goTo, close, workingGroupOptions, ...props }) {
	const t = useTranslation();

	const roleData = useEndpointData('roles.list', '') || {};

	const {
		values,
		handlers,
		reset,
		hasUnsavedChanges,
	} = useForm({
		surname: '',
		name: '',
		patronymic: '',
		organization: '',
		position: '',
		phone: '',
		email: '',
		workingGroup: '',
	});

	// TODO: remove JSON.stringify. Is used to keep useEndpointAction from rerendering the page indefinitely.
	const saveQuery = useMemo(() => values, [JSON.stringify(values)]);

	const saveAction = useEndpointAction('POST', 'users.createParticipant', saveQuery, t('Participant_Created_Successfully'));

	const handleSave = useCallback(async () => {
		const result = await saveAction();
		if (result.success) {
			goTo('add-participant')();
		}
	}, [goTo, saveAction]);

	const availableRoles = useMemo(() => (roleData && roleData.roles ? roleData.roles.map(({ _id, description }) => [_id, description || _id]) : []), [roleData]);

	const append = useMemo(() => <Field>
		<Field.Row>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Button flexGrow={1} onClick={close('participants')} mie='x4'>{t('Cancel')}</Button>
				<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave} primary>{t('Save')}</Button>
			</Box>
		</Field.Row>
	</Field>, [hasUnsavedChanges, close, t, handleSave]);

	return <ParticipantForm formValues={values} formHandlers={handlers} workingGroupOptions={workingGroupOptions} availableRoles={availableRoles} append={append} {...props}/>;
}
