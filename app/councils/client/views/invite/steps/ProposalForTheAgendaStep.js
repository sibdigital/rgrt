import {
	Field,
	Label,
	Margins,
	TextInput,
	Box,
	FieldGroup,
	TextAreaInput,
} from '@rocket.chat/fuselage';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import 'react-phone-input-2/lib/style.css';
import DatePicker from 'react-datepicker';

import { useMethod } from '../../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { createProposalsForTheAgenda, validateProposalsForTheAgenda } from '../../../../../agenda/client/views/lib';
import { constructPersonFullFIO } from '../../../../../utils/client/methods/constructPersonFIO';
import { useInvitePageContext } from '../InvitePageState';

function ProposalForTheAgendaStep({ stepStyle = {}, step, title, active, council, agendaId, userData }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { goToFinalStep, goToPreviousStep } = useInvitePageContext();

	const [commiting, setComitting] = useState(false);
	const [editData, setEditData] = useState({
		item: '',
		initiatedBy: { _id: '', surname: '', name: '', patronymic: '', organization: '', value: '' },
		issueConsideration: '',
		date: new Date(),
		status: '',
	});

	useEffect(() => {
		console.log(userData);
		if (userData) {
			setEditData({
				...editData,
				status: t('Agenda_status_proposed'),
				initiatedBy: {
					_id: userData._id ?? '',
					surname: userData.surname ?? '',
					name: userData.name ?? '',
					patronymic: userData.patronymic ?? '',
					organization: userData.organization ?? '',
					value: constructPersonFullFIO(userData),
					type: userData.type ?? '',
				},
			});
		} else {
			setEditData({ ...editData, status: t('Agenda_status_proposed') });
		}
	}, [userData, t]);

	const insertOrUpdateProposalsForTheAgenda = useMethod('insertOrUpdateProposalsForTheAgenda');

	const handleEditDataChange = (field, value) => {
		setEditData({ ...editData, [field]: value });
	};

	const handleBackClick = () => {
		goToFinalStep();
	};

	const saveAction = useCallback(async (item, initiatedBy, issueConsideration, date, status, previousData) => {
		const proposalsData = createProposalsForTheAgenda(item, initiatedBy, issueConsideration, date, status, previousData);
		const validation = validateProposalsForTheAgenda(proposalsData);
		console.log(proposalsData);
		if (validation.length === 0) {
			const result = await insertOrUpdateProposalsForTheAgenda(agendaId, proposalsData);
			console.log(result);

			if (result && result.id) {
				proposalsData._id = result.id;
			}
			goToFinalStep();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateProposalsForTheAgenda, t]);

	const handleSave = async (event) => {
		event.preventDefault();
		setComitting(true);
		try {
			setComitting(false);
			console.log(editData);
			await saveAction(
				editData.item,
				editData.initiatedBy,
				editData.issueConsideration,
				editData.date,
				editData.status,
				null,
			);
		} catch (error) {
			setComitting(false);
		}
	};

	const allFieldAreFilled = useMemo(() => editData.issueConsideration !== '', [editData.issueConsideration]);

	return <Step active={active} working={commiting} onSubmit={handleSave} style={stepStyle}>
		<StepHeader number={step} title={title} />
		<Box is='p' fontScale='s1' color='hint' mbe='x16'>
			{agendaId ? t('Proposal_for_the_agenda_invite_description') : t('Agenda_not_found')}
		</Box>
		<Margins blockEnd='x32'>
			{ agendaId && <FieldGroup>
				<Field>
					<Field.Label>{t('Agenda_issue_consideration')} <span style={ { color: 'red' } }>*</span></Field.Label>
					<Field.Row>
						<TextAreaInput rows={6} style={{ whiteSpace: 'normal' }} value={editData.issueConsideration} onChange={(e) => handleEditDataChange('issueConsideration', e.currentTarget.value)} placeholder={t('Agenda_issue_consideration')} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Date')} <span style={ { color: 'red' } }>*</span></Field.Label>
					<Field.Row>
						<DatePicker
							dateFormat='dd.MM.yyyy HH:mm'
							selected={editData.date}
							onChange={(newDate) => handleEditDataChange('date', newDate)}
							showTimeSelect
							timeFormat='HH:mm'
							timeIntervals={5}
							timeCaption='Время'
							customInput={<TextInput />}
							locale='ru'
							popperClassName='date-picker'/>
					</Field.Row>
				</Field>
			</FieldGroup>}
		</Margins>

		<Pager disabled={commiting} isContinueEnabled={allFieldAreFilled && agendaId} onBackClick={handleBackClick} onBackClickText={t('Skip')}/>
	</Step>;
}

export default ProposalForTheAgendaStep;
