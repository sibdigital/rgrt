import React, { useCallback, useMemo } from 'react';
import { Button, Field } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../../client/hooks/useForm';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { isEmail } from '../../../../utils/lib/isEmail.js';
import ParticipantForm from './ParticipantForm';

export function CreateParticipant({ goTo, close, onChange, councilId, invitedPersons, setInvitedPersons, ...props }) {
	const t = useTranslation();

	const {
		values,
		handlers,
		reset,
	} = useForm({
		surname: '',
		name: '',
		patronymic: '',
		phone: '',
		email: '',
	});
	console.log('createPartic');
	const dispatchToastMessage = useToastMessageDispatch();

	const allFieldAreFilled = useMemo(() => Object.values(values).map((item) => item && item !== '') && !isEmail(values.email), [values]);

	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');
	const insertOrUpdateCouncilPerson = useMethod('insertOrUpdateCouncilPerson');

	const handleSave = useCallback(async () => {
		const personId = await insertOrUpdatePerson(values);
		if (personId) {
			const person = values;
			person._id = personId;

			const personToAdd = {
				_id: personId,
				ts: new Date(),
			};
			console.log(person);
			if (councilId) {
				await insertOrUpdateCouncilPerson({ _id: councilId }, personToAdd);
			}
			dispatchToastMessage({ type: 'success', message: t('Participant_Created_Successfully') });

			const res = invitedPersons ? invitedPersons.concat(personToAdd) : [personToAdd];
			setInvitedPersons(res);
			// close();
			goTo(person)();
			// onChange();
		}
	}, [values, insertOrUpdatePerson, insertOrUpdateCouncilPerson, invitedPersons, onChange]);

	const append = useMemo(() => <Field mbe='x8'>
		<Field.Row marginInlineStart='auto'>
			<Button marginInlineEnd='10px' small primary onClick={handleSave} disabled={allFieldAreFilled}>{t('Save')}</Button>
			<Button small primary onClick={close} mie='x4' danger>{t('Cancel')}</Button>
		</Field.Row>
	</Field>, [close, t, handleSave]);

	return <>
		{append}
		<ParticipantForm formValues={values} formHandlers={handlers} {...props}/>
	</>;
}
