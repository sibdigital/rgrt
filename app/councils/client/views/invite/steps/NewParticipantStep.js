import {
	Box,
	CheckBox,
	Field,
	Icon,
	Margins,
	RadioButton, TextInput,
} from '@rocket.chat/fuselage';
import { useAutoFocus, useMergedRefs, useUniqueId } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { useMethod } from '../../../../../../client/contexts/ServerContext';
import { useBatchSettingsDispatch } from '../../../../../../client/contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/components/setupWizard/Pager';
import { Step } from '../../../../../../client/components/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/components/setupWizard/StepHeader';

import { useEndpointAction } from '/client/hooks/useEndpointAction';
import { useRouteParameter } from '/client/contexts/RouterContext';

function NewParticipantStep({ step, title, active }) {
	const { goToPreviousStep, goToFinalStep, councilState } = useInvitePageContext();
	console.log('[NewParticipantStep]', councilState.data);
	const [newData, setNewData] = useState({
		firstName: { value: '', required: true },
		lastName: { value: '', required: true },
		patronymic: { value: '', required: false },
		organization: { value: '', required: true },
		position: { value: '', required: true },
		contactPersonFirstName: { value: '', required: false },
		contactPersonLastName: { value: '', required: false },
		contactPersonPatronymicName: { value: '', required: false },
		phone: { value: '', required: true },
		email: { value: '', required: true },
	});

	const [isContactPerson, setIsContactPerson] = useState(false);

	// const saveQuery = useMemo(() => ({ _id: errand._id, ...Object.fromEntries(Object.entries(newData).filter(([, value]) => value !== null)) }), [errand._id, newData]);

	// const saveAction = useEndpointAction('POST', 'errands.update', saveQuery, _t('Errand_updated_successfully'));

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		setNewData({ ...newData, [field]: { value: getValue(e), required: newData[field].required } });
	};

	const packNewData = () => {
		const dataToSend = {};
		Object.keys(newData).forEach((key) => {
			dataToSend[key] = newData[key].value.trim();
		});
		if (!isContactPerson) {
			delete dataToSend.contactPersonFirstName;
			delete dataToSend.contactPersonLastName;
			delete dataToSend.contactPersonPatronymicName;
		}
		dataToSend.ts = new Date();
		return dataToSend;
	};


	const handleIAmContactPerson = () => {
		setNewData({
			...newData,
			contactPersonFirstName: { value: newData.contactPersonFirstName.value, required: !isContactPerson },
			contactPersonLastName: { value: newData.contactPersonLastName.value, required: !isContactPerson },
		});
		setIsContactPerson(!isContactPerson);
	};

	const [agreeTermsAndPrivacy, setAgreeTermsAndPrivacy] = useState(false);

	const t = useTranslation();

	const [commiting, setComitting] = useState(false);

	const batchSetSettings = useBatchSettingsDispatch();

	const registerCloudWorkspace = useMethod('cloud:registerWorkspace');

	const dispatchToastMessage = useToastMessageDispatch();

	const allFieldAreFilled = useMemo(() => Object.values(newData).filter((current) => current.value === '' && current.required === true).length === 0, [JSON.stringify(newData)]);

	console.log('allFieldAreFilled', allFieldAreFilled);
	const handleBackClick = () => {
		goToPreviousStep();
	};
	const addPersonToCouncil = useMethod('addPersonToCouncil');
	const councilId = useRouteParameter('id');
	const handleSubmit = async (event) => {
		event.preventDefault();

		setComitting(true);

		try {
			setComitting(false);
			const person = packNewData(newData);
			await addPersonToCouncil(councilId, person);

			goToFinalStep();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			setComitting(false);
		}
	};

	!councilState.data && !councilState.data.desc && goToErrorStep();
	!councilState.data && !councilState.data.d && goToErrorStep();


	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Council_participant_info_description')}</Box>

				<Box display='flex' flexDirection='column'>


					<Margins all='x8'>
						<Field>
							<Field.Label>{t('Surname')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.lastName.value} flexGrow={1} onChange={handleChange('lastName')} placeholder={`${ t('Council_second_name') } (${ t('Required') })`}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Name')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.firstName.value} flexGrow={1} onChange={handleChange('firstName')} placeholder={`${ t('Council_first_name') } (${ t('Required') })`}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Patronymic')}</Field.Label>
							<Field.Row>
								<TextInput value={newData.patronymic.value} flexGrow={1} onChange={handleChange('patronymic')} placeholder={`${ t('Council_patronymic') } (${ t('optional') })`} />
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Organization_Name')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.organization.value} flexGrow={1} onChange={handleChange('organization')} placeholder={`${ t('Council_organization') } (${ t('Required') })`}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Job_Title')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.position.value} flexGrow={1} onChange={handleChange('position')} placeholder={`${ t('Council_Organization_Position') } (${ t('Required') })`}/>
							</Field.Row>
						</Field>
						<Field.Row>
							<CheckBox checked={isContactPerson} onChange={handleIAmContactPerson}/>
							<Field.Label>{t('Council_Is_Contact_person')}</Field.Label>
						</Field.Row>
						{ isContactPerson && <Field>
							<Field.Label>{t('Surname')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.contactPersonLastName.value} flexGrow={1} onChange={handleChange('contactPersonLastName')} placeholder={`${ t('Council_Contact_person_lastname') } (${ t('Required') })`}/>
							</Field.Row>
						</Field> }
						{ isContactPerson && <Field>
							<Field.Label>{t('Name')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.contactPersonFirstName.value} flexGrow={1} onChange={handleChange('contactPersonFirstName')} placeholder={`${ t('Council_Contact_person_firstname') } (${ t('Required') })`}/>
							</Field.Row>
						</Field> }
						{ isContactPerson && <Field>
							<Field.Label>{t('Patronymic')}</Field.Label>
							<Field.Row>
								<TextInput value={newData.contactPersonPatronymicName.value} flexGrow={1} onChange={handleChange('contactPersonPatronymicName')} placeholder={`${ t('Council_Contact_person_patronymic') } (${ t('optional') })`}/>
							</Field.Row>
						</Field> }
						<Field>
							<Field.Label>{t('Phone_number')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.phone.value} flexGrow={1} onChange={handleChange('phone')} placeholder={`${ t('Council_Contact_person_Phone_number') } (${ t('Required') })`}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Email')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.email.value} flexGrow={1} onChange={handleChange('email')} placeholder={`${ t('Council_Contact_person_email') } (${ t('Required') })`}/>
							</Field.Row>
						</Field>
						{/* <Field>
							<Field.Row>
								<CheckBox
									id={agreeTermsAndPrivacyId}
									name='agreeTermsAndPrivacy'
									checked={agreeTermsAndPrivacy}
									onChange={({ currentTarget: { checked } }) => {
										setAgreeTermsAndPrivacy(checked);
									}}
								/>
								<Field.Label htmlFor={agreeTermsAndPrivacyId}>
									{t('Register_Server_Registered_I_Agree')} <a href='https://rocket.chat/terms'>{t('Terms')}</a> & <a href='https://rocket.chat/privacy'>{t('Privacy_Policy')}</a>
								</Field.Label>
							</Field.Row>
						</Field>*/}
					</Margins>
				</Box>
			</Box>
		</Margins>

		<Pager disabled={!allFieldAreFilled || commiting} onBackClick={handleBackClick} />
	</Step>;
}

export default NewParticipantStep;
