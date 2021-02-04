import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Box, Tile, Field, TextAreaInput, Button, InputBox, ButtonGroup, TextInput } from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { validate, createProtocolData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';

require('react-datepicker/dist/react-datepicker.css');

export function AddProtocol({ goToNew, close, onChange, ...props }) {

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [date, setDate] = useState('');
	const [number, setNumber] = useState('');
	const [place, setPlace] = useState('');
	const [participants, setParticipants] = useState([]);
	const [isCouncilProtocol, setIsCouncilProtocol] = useState(false);

	const councilId = FlowRouter.getParam('id');

	if (councilId) {
		const query = useMemo(() => ({
			query: JSON.stringify({ _id: councilId }),
		}), [councilId]);
	
		const {	data: council } = useEndpointDataExperimental('councils.findOne', query) || {};
		const { data: invitedPersonsData } = useEndpointDataExperimental('councils.invitedPersons', query) || { persons: [] };
		useEffect(() => {
		 	if (council && council.d) {
				setDate(new Date(council.d));
			}
			 
			if (invitedPersonsData && invitedPersonsData.persons) {
				setParticipants(invitedPersonsData.persons);
			}

			if(!isCouncilProtocol){
				setIsCouncilProtocol(true);
			}
		}, [council, invitedPersonsData]);
	}

	const insertOrUpdateProtocol = useMethod('insertOrUpdateProtocol');

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
		}
	};

	const saveAction = useCallback(async (date, number, place, councilId, participants) => {
		const participantsIds = participants.map((participant) => participant._id)
		const protocolData = createProtocolData(date, number, place, councilId, participantsIds);
		const validation = validate(protocolData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateProtocol(protocolData);
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
				participants
			);
			dispatchToastMessage({ type: 'success', message: t('Protocol_Added_Successfully') });
			goToNew(result)();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, goToNew, date, number, place, councilId, participants, onChange, saveAction, t]);

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
