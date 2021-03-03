import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Box, Tile, Field, TextAreaInput, Button, InputBox, ButtonGroup, TextInput } from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { validate, createProtocolData, createItemData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';
import { Autocomplete } from '@material-ui/lab';
import { validateSectionData, createSectionData } from './lib';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

const getCouncilAndAgendaDataByCouncilId = (councilId) => {
	const councilAndAgendaData = { };

	if (councilId) {

		const query = useMemo(() => ({
			query: JSON.stringify({ _id: councilId }),
		}), [councilId]);

		const {	data: councilData } = useEndpointDataExperimental('councils.findOne', query) || { };
		const { data: invitedPersons } = useEndpointDataExperimental('councils.invitedPersons', query) || { persons: [] };
		const { data: agendaData } = useEndpointDataExperimental('agendas.findByCouncilId', useMemo(() => ({ query: JSON.stringify({ councilId }) }), [councilId])) || { };

		councilAndAgendaData.councilData = councilData;
		councilAndAgendaData.personsData = invitedPersons;
		councilAndAgendaData.agendaData = agendaData;
	}

	return councilAndAgendaData;
}

export function AddProtocol({ goToNew, close, onChange, ...props }) {

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [date, setDate] = useState('');
	const [number, setNumber] = useState('');
	const [place, setPlace] = useState('');
	const [participants, setParticipants] = useState([]);
	const [isCouncilProtocol, setIsCouncilProtocol] = useState(false);
	const [agenda, setAgenda] = useState([]);

	const councilId = useRouteParameter('id');

	const { councilData, personsData, agendaData } = getCouncilAndAgendaDataByCouncilId(councilId);

	useEffect(() => {
		if (councilData) {
			setIsCouncilProtocol(true);
		}

		if (councilData && councilData.d) {
			setDate(new Date(councilData.d));
		}

		if (personsData && personsData.persons) {
			setParticipants(personsData.persons);
		}

		if (agendaData) {
			setAgenda(agendaData);
		}

	}, [councilData, personsData, agendaData])

	const insertOrUpdateProtocol = useMethod('insertOrUpdateProtocol');
	const insertOrUpdateSection = useMethod('insertOrUpdateSection');
	const insertOrUpdateItem = useMethod('insertOrUpdateItem');

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
		}
	};

	const saveAction = useCallback(async (date, number, place, councilId, participants, agenda) => {
		const participantsIds = participants.map((participant) => participant._id)
		const protocolData = createProtocolData(date, number, place, councilId, participantsIds);
		const validation = validate(protocolData);

		if (validation.length === 0) {
			const _id = await insertOrUpdateProtocol(protocolData);

			if (agenda?.sections) {
				let sectionNumber = 1;
				for (const section of agenda.sections) {
					const itemNumber = 1;
					const sectionData = createSectionData(sectionNumber, section.item);
					const section_id = await insertOrUpdateSection(_id,sectionData);
					
					const itemData = createItemData(itemNumber, section.issueConsideration);
					const item_id = await insertOrUpdateItem(_id, section_id, itemData);

					sectionNumber++;
				}
			}

			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateProtocol, t]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				date,
				number,
				place,
				councilId,
				participants,
				agenda
			);
			dispatchToastMessage({ type: 'success', message: t('Protocol_Added_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, date, number, place, councilId, participants, agenda, onChange, saveAction, t]);

	const Participant = (person) => <Box
		pb='x6'
		color='default'
		display='flex'
	>
		<Box is='span' flexGrow={1}>
			<Box fontSize={'16px'}> {person.surname} {person.name} {person.patronymic} </Box>
		</Box>
	</Box>;

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Protocol_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Protocol_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Protocol_Date')}</Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy'
					selected={date}
					onChange={(newDate) => setDate(newDate)}
					customInput={<TextInput />}
					locale='ru'
				/>
				{/* <InputBox type='date' value={date} onChange={(e) => setDate(e.currentTarget.value)} placeholder={t('Date')} />*/}
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Protocol_Place')}</Field.Label>
			<Field.Row>
				<TextAreaInput value={place} onChange={(e) => setPlace(e.currentTarget.value)} placeholder={t('Protocol_Place')} />
			</Field.Row>
		</Field>
		{isCouncilProtocol && <Field>
			<Field.Label>{t('Participants')}</Field.Label>
			<Field.Row>
				<Box mbe='x8' flexGrow={1}>
					{participants && !participants.length
						? <Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
							{t('No_data_found')}
						</Tile>
						: <>
							{participants
								? participants.map((props, index) => <Participant key={props._id || index} { ...props}/>)
								: <></>
							}
						</>
					}
				</Box>
			</Field.Row>
		</Field>}
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={date === '' || number === '' || place === ''}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
