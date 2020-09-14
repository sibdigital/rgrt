import { Box, CheckBox, Field, Margins, TextInput } from '@rocket.chat/fuselage';
import React, { useMemo, useState } from 'react';

import { useMethod } from '../../../../../../client/contexts/ServerContext';
import { useBatchSettingsDispatch } from '../../../../../../client/contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/components/setupWizard/Pager';
import { Step } from '../../../../../../client/components/setupWizard/Step';
import { useInvitePageContext } from '../InvitePageState';
import { StepHeader } from '../../../../../../client/components/setupWizard/StepHeader';
import { useRouteParameter } from '../../../../../../client/contexts/RouterContext';

function NewParticipantStep({ step, title, active }) {
	const { goToPreviousStep, goToFinalStep } = useInvitePageContext();
	const [newData, setNewData] = useState({
		firstName: { value: '', required: true },
		lastName: { value: '', required: true },
		patronymic: { value: '', required: false },
		/* organization: { value: '', required: true },*/
		position: { value: '', required: true },
		contactPersonFirstName: { value: '', required: false },
		contactPersonLastName: { value: '', required: false },
		contactPersonPatronymicName: { value: '', required: false },
		phone: { value: '', required: true },
		email: { value: '', required: true },
	});

	const [isContactPerson, setIsContactPerson] = useState(false);

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

	const t = useTranslation();

	const [commiting, setComitting] = useState(false);

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

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='s1' color='hint' marginBlockEnd='x16'>{t('Council_participant_info_description')}</Box>

				<Box display='flex' flexDirection='column'>


					<Margins all='x8'>
						<Field>
							<Field.Label>{t('Council_second_name')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.lastName.value} flexGrow={1} onChange={handleChange('lastName')} placeholder={`${ t('Council_second_name_placeholder') }`}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Council_first_name')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.firstName.value} flexGrow={1} onChange={handleChange('firstName')} placeholder={`${ t('Council_first_name_placeholder') }`}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Council_patronymic')}</Field.Label>
							<Field.Row>
								<TextInput value={newData.patronymic.value} flexGrow={1} onChange={handleChange('patronymic')} placeholder={`${ t('Council_patronymic_placeholder') }`} />
							</Field.Row>
						</Field>
						{/* <Field>
							<Field.Label>{t('Organization_Name')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.organization.value} flexGrow={1} onChange={handleChange('organization')} placeholder={`${ t('Council_organization') } (${ t('Required') })`}/>
							</Field.Row>
						</Field>*/}
						<Field>
							<Field.Label>{t('Council_Organization_Position')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.position.value} flexGrow={1} onChange={handleChange('position')} placeholder={`${ t('Council_Organization_Position_placeholder') }`}/>
							</Field.Row>
						</Field>
						<Field.Row>
							<CheckBox checked={isContactPerson} onChange={handleIAmContactPerson}/>
							<Field.Label>{t('Council_Is_Contact_person')}</Field.Label>
						</Field.Row>
						{ isContactPerson && <Field>
							<Field.Label>{t('Council_Contact_person_lastname')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.contactPersonLastName.value} flexGrow={1} onChange={handleChange('contactPersonLastName')} placeholder={`${ t('Council_Contact_person_lastname_placeholder') } (${ t('Required') })`}/>
							</Field.Row>
						</Field> }
						{ isContactPerson && <Field>
							<Field.Label>{t('Council_Contact_person_firstname')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.contactPersonFirstName.value} flexGrow={1} onChange={handleChange('contactPersonFirstName')} placeholder={`${ t('Council_Contact_person_firstname_placeholder') } (${ t('Required') })`}/>
							</Field.Row>
						</Field> }
						{ isContactPerson && <Field>
							<Field.Label>{t('Council_Contact_person_patronymic')}</Field.Label>
							<Field.Row>
								<TextInput value={newData.contactPersonPatronymicName.value} flexGrow={1} onChange={handleChange('contactPersonPatronymicName')} placeholder={`${ t('Council_Contact_person_patronymic_placeholder') } (${ t('optional') })`}/>
							</Field.Row>
						</Field> }
						<Field>
							<Field.Label>{t('Council_Contact_person_Phone_number')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.phone.value} flexGrow={1} onChange={handleChange('phone')} placeholder={`${ t('Council_Contact_person_Phone_number_placeholder') }`}/>
							</Field.Row>
						</Field>
						<Field>
							<Field.Label>{t('Council_Contact_person_email')} <span style={ { color: 'red' } }>*</span></Field.Label>
							<Field.Row>
								<TextInput value={newData.email.value} flexGrow={1} onChange={handleChange('email')} placeholder={`${ t('Council_Contact_person_email_placeholder') }`}/>
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

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled} onBackClick={handleBackClick} />
	</Step>;
}

export default NewParticipantStep;
