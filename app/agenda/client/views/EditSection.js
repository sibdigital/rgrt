import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
	Box,
	Field,
	Button,
	InputBox,
	ButtonGroup,
	FieldGroup,
	TextAreaInput,
	Callout,
	Modal,
} from '@rocket.chat/fuselage';
import Chip from '@material-ui/core/Chip';
import TextField from '@material-ui/core/TextField';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { isIOS } from 'react-device-detect';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { checkNumber } from '../../../utils/client/methods/checkNumber';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import PersonForm from '../../../persons/client/views/PersonForm';
import { validateAgendaSection, createAgendaSection } from './lib';
import AutoCompletePersons from '../../../persons/client/views/AutoCompletePersons';

require('react-datepicker/dist/react-datepicker.css');

function RenderNewPersonCreateModal({ onCancel, onSave, ...props }) {
	const t = useTranslation();

	return <Modal {...props}>
		<Modal.Header>
			<Modal.Title>{t('Participant_Creating')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1' mb='x24'>
			<PersonForm isWeight={false} onShowCancelAndSaveButtons={true} onCancel={onCancel} onSave={onSave}/>
		</Modal.Content>
	</Modal>;
}

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	query: JSON.stringify({
		$or: [{
			surname: { $regex: text || '', $options: 'i' },
		}, {
			name: { $regex: text || '', $options: 'i' },
		}, {
			patronymic: { $regex: text || '', $options: 'i' },
		}],
	}),
	fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, column, direction, itemsPerPage, current]);

export function EditSection({ agendaId = null, councilId, onEditDataClick, close, onChange, personsOptions, data = null, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const [editData, setEditData] = useState({
		item: '',
		initiatedBy: {},
		issueConsideration: '',
		// date: new Date(),
		speakers: [],
	});
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 10 });
	const [sort, setSort] = useState(['surname']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const personsQuery = useQuery(debouncedParams, debouncedSort);

	const { data: numberCountData, state: numberCountState } = useEndpointDataExperimental('agendas.itemNumberCount', useMemo(() => ({
		query: JSON.stringify({ _id: agendaId }),
	}), [agendaId]));


	const { data: personsData } = useEndpointDataExperimental('persons.list', personsQuery);

	useEffect(() => {
		if (data) {
			// console.log(data);
			setEditData({
				item: data.item ?? '',
				initiatedBy: data.initiatedBy,
				issueConsideration: data.issueConsideration,
				// date: new Date(data.date),
				speakers: data.speakers,
			});
		} else if (numberCountData) {
			setEditData({ ...editData, item: numberCountData.count });
		}
	}, [data, numberCountData]);

	const insertOrUpdateAgendaSection = useMethod('insertOrUpdateAgendaSection');
	const insertOrUpdatePerson = useMethod('insertOrUpdatePerson');

	const handleChange = (field, getValue = (e) => e.currentTarget.value) => (e) => {
		let value = getValue(e);
		if (field === 'item' && !checkNumber(value)) {
			value = editData.item;
		}

		setEditData({ ...editData, [field]: value });
		onChange();
	};

	const handleSpeakers = useCallback((value, onIos = false) => {
		if (onIos) {
			setEditData({ ...editData, speakers: [...editData.speakers, value] });
		} else {
			setEditData({ ...editData, speakers: value });
		}
	}, [editData]);

	const cancelModal = useCallback(() => setModal(undefined), [setModal]);

	const handleCreateNewPerson = useCallback(async (person) => {
		try {
			const personId = await insertOrUpdatePerson(person);
			console.dir({ person, personId });
			setEditData({ ...editData, speakers: [...editData.speakers, { _id: personId, surname: person.surname, name: person.name, patronymic: person.patronymic }] });
			cancelModal();
		} catch (error) {
			console.error(error);
		}
	}, [cancelModal, editData, insertOrUpdatePerson]);

	const onCreateNewPerson = () => {
		// eslint-disable-next-line new-cap
		setModal(() => RenderNewPersonCreateModal({ onCancel: cancelModal, onSave: handleCreateNewPerson }));
	};

	const saveAction = useCallback(async (item, initiatedBy, issueConsideration, speakers, previousData) => {
		const agendaData = createAgendaSection({ item, initiatedBy, issueConsideration, speakers, previousData });
		const validation = validateAgendaSection(agendaData);
		// console.log(agendaData);
		if (validation.length === 0) {
			const result = await insertOrUpdateAgendaSection(agendaId, agendaData);
			// console.log(result);
			if (result && result._id) {
				agendaData._id = result._id;
			}
			onEditDataClick(agendaData, data?._id && 'edit');
			onChange();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateAgendaSection, t, councilId]);

	const handleSave = useCallback(async () => {
		try {
			// console.log(editData);
			editData.speakers.forEach((speaker) => speaker.value && delete speaker.value);
			await saveAction(
				editData.item,
				editData.initiatedBy,
				editData.issueConsideration,
				// editData.date,
				editData.speakers,
				data,
			);
			dispatchToastMessage({ type: 'success', message: !data ? t('Agenda_item_added_successfully') : t('Agenda_item_edited_successfully') });
			onChange();
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, close, onChange, t, editData, data]);

	if ([numberCountState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('Loading');
		return <Callout m='x16'>{ t('Loading') }</Callout>;
	}

	return <FieldGroup {...props}>
		<Field>
			<Field.Label>{t('Proposal_for_the_agenda_item')}</Field.Label>
			<Field.Row>
				<InputBox value={editData.item} onChange={handleChange('item')} placeholder={t('Proposal_for_the_agenda_item')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Agenda_issue_consideration')}</Field.Label>
			<Field.Row>
				<TextAreaInput style={{ whiteSpace: 'normal', wordBreak: 'break-word' }} rows='8' value={editData.issueConsideration} onChange={handleChange('issueConsideration')} placeholder={t('Agenda_issue_consideration')}/>
			</Field.Row>
		</Field>
		<AutoCompletePersons onSetPersonsArray={handleSpeakers} prevPersonsIdArray={editData.speakers ?? []} onAutoCompleteLabel={t('Agenda_speakers')}/>
		{/*/!*<Field>*!/*/}
		{/*// 	<Field.Label>{t('Agenda_speakers')}</Field.Label>*/}
		{/*// 	<Autocomplete*/}
		{/*/!*		style={{ touchAction: 'none' }}*!/*/}
		{/*// 		multiple*/}
		{/*// 		id='tags-standard'*/}
		{/*// 		options={personsData?.persons ?? []}*/}
		{/*// 		value={editData.speakers ?? []}*/}
		{/*// 		forcePopupIcon={false}*/}
		{/*// 		getOptionLabel={(userData) => [constructPersonFIO(userData), `, ${ userData.organization ?? '' }`].join('')}*/}
		{/*// 		// getOptionSelected={(option, value) => console.dir({ option, value })}*/}
		{/*// 		// onHighlightChange={(event, option, reason) => console.log('onHighlightChange')}*/}
		{/*// 		renderOption={(option, state) =>*/}
		{/*// 			<Box*/}
		{/*/!*				style={{ cursor: 'pointer' }}*!/*/}
		{/*// 				zIndex='100'*/}
		{/*// 				width='100%'*/}
		{/*// 				height='100%'*/}
		{/*// 				onTouchStart={() => { console.log('on touch start in render option ', state); isIOS && handleSpeakers(option, true); }}*/}
		{/*// 			>*/}
		{/*// 				{[constructPersonFIO(option), `, ${ option.organization ?? '' }`].join('')}*/}
		{/*// 			</Box>*/}
		{/*// 		}*/}
		{/*// 		filterSelectedOptions*/}
		{/*// 		filterOptions={createFilterOptions({ limit: 10 })}*/}
		{/*// 		onChange={(event, value) => { console.log('onChange event ', event); !isIOS && handleSpeakers(value); }}*/}
		{/*// 		renderTags={(value, getTagProps) =>*/}
		{/*/!*			value.map((option, index) => (*!/*/}
		{/*/!*				<Chip style={{ backgroundColor: '#e0e0e0', margin: '3px', borderRadius: '16px', color: '#000000DE' }}*!/*/}
		{/*/!*					label={constructPersonFIO(option)} {...getTagProps({ index })} />*!/*/}
		{/*/!*			))*!/*/}
		{/*// 		}*/}
		{/*// 		renderInput={(params) => (*/}
		{/*// 			<TextField*/}
		{/*/!*				{...params}*!/*/}
		{/*// 				style={{ touchAction: 'none' }}*/}
		{/*// 				variant='outlined'*/}
		{/*// 				placeholder={t('Agenda_speakers')}*/}
		{/*// 				onChange={(e) => setParams({ current: 0, itemsPerPage: 10, text: e.currentTarget.value }) }*/}
		{/*/!*			/>*!/*/}
		{/*// 		)}*/}
		{/*/!*		noOptionsText={*!/*/}
		{/*/!*			<Button*!/*/}
		{/*/!*				style={{ touchAction: 'none' }}*!/*/}
		{/*/!*				onMouseDown={() => !isIOS && onCreateNewPerson()}*!/*/}
		{/*// 				onTouchStart={() => isIOS && onCreateNewPerson()}*/}
		{/*// 				backgroundColor='inherit'*/}
		{/*// 				borderColor='lightgrey'*/}
		{/*/!*				borderWidth='0.5px'*!/*/}
		{/*/!*				textAlign='center'*!/*/}
		{/*/!*				width='100%'*!/*/}
		{/*/!*			>*!/*/}
		{/*/!*				{ t('Participant_Create') }*!/*/}
		{/*/!*			</Button>*!/*/}
		{/*/!*		}*!/*/}
		{/*/!*		onClose={(event, reason) => setParams({ current: 0, itemsPerPage: 10, text: '' }) }*!/*/}
		{/*/!*	/>*!/*/}
		{/*/!*</Field>*!/*/}
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={editData.issueConsideration === ''}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</FieldGroup>;
}
