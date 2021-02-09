import React, { useCallback, useMemo } from 'react';
import { Button, Field, Box } from '@rocket.chat/fuselage';
import styled, { keyframes } from 'styled-components';
import { slideInRight } from 'react-animations';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../../client/hooks/useForm';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { isEmail } from '../../../../utils/lib/isEmail.js';
import ParticipantForm from './ParticipantForm';

const SlideAnimation = styled.div`animation: 0.25s ${ keyframes`${ slideInRight }` } linear`;

export function CreateParticipant({ goTo, close, onChange, councilId, invitedPersons, setInvitedPersons, workingGroupOptions, ...props }) {
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
		group: {},
	});
	console.log('createPartic');
	const dispatchToastMessage = useToastMessageDispatch();

	const allFieldAreFilled = useMemo(() => Object.values(values).map((item) => item && item !== '') && !isEmail(values.email), [values]);

	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');
	const insertOrUpdateCouncilPerson = useMethod('insertOrUpdateCouncilPerson');

	const constructPerson = (person) => {
		const group = workingGroupOptions?.find((group) => group[0] === person.group) || ['', ''];
		return {
			surname: person.surname,
			name: person.name,
			patronymic: person.patronymic,
			phone: person.phone,
			email: person.email,
			group: { _id: group[0], title: group[1] },
		};
	};

	const handleSave = useCallback(async () => {
		// const personId = '123';
		console.log(constructPerson(values));
		const personId = await insertOrUpdatePerson(constructPerson(values));
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
			goTo(person)();
		}
	}, [values, insertOrUpdatePerson, insertOrUpdateCouncilPerson, invitedPersons, onChange]);

	const append = useMemo(() => <Field mbe='x8'>
		<Field.Row marginInlineStart='auto'>
			<Button marginInlineEnd='10px' small primary onClick={handleSave} disabled={allFieldAreFilled}>{t('Save')}</Button>
			<Button small primary onClick={close} mie='x4' danger>{t('Cancel')}</Button>
		</Field.Row>
	</Field>, [close, t, handleSave]);

	return <SlideAnimation><Box>
		{append}
		<ParticipantForm formValues={values} formHandlers={handlers} workingGroupOptions={workingGroupOptions} {...props}/>
	</Box></SlideAnimation>;
}
