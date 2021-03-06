import React, { useCallback, useMemo } from 'react';
import { Button, Field, Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useForm } from '../../../../../client/hooks/useForm';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { isEmail } from '../../../../utils/lib/isEmail.js';
import { getAnimation } from '../../../../utils/client/index';
import ParticipantForm from './ParticipantForm';

const SlideAnimation = getAnimation({ type: 'slideInRight' });

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
		group: '',
		organization: '',
		position: '',
	});

	const dispatchToastMessage = useToastMessageDispatch();

	const allFieldAreFilled = useMemo(() =>
		// (Object.values(values).filter((item) => item === '').length !== 1 && values.patronymic === '')
		Object.values(values).filter((item) => item === '').length !== 0
		|| !isEmail(values.email)
	, [values]);

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
			organization: person.organization,
			position: person.position,
		};
	};

	const handleSave = useCallback(async () => {
		console.dir({ toSave: constructPerson(values) });
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

	return <>
		{append}
		<SlideAnimation style={{ overflowY: 'auto' }}><Box>
			<ParticipantForm formValues={values} formHandlers={handlers} workingGroupOptions={workingGroupOptions} {...props}/>
		</Box></SlideAnimation>
	</>;
}
