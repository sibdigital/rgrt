import React, { useCallback, useState, useMemo, useEffect } from 'react';
import Chip from '@material-ui/core/Chip';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import TextField from '@material-ui/core/TextField';
import {
	Box,
	Button,
	ButtonGroup,
	Field,
	Skeleton,
	Throbber,
	InputBox,
	TextInput,
	Select,
} from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import '@ckeditor/ckeditor5-build-classic/build/translations/ru';

import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../client/hooks/useEndpointDataExperimental';
import { validateItemData, createItemData } from './lib';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import { checkRomanNumber } from '../../../utils/client/methods/checkNumber';
import { useUserId } from '../../../../client/contexts/UserContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function EditItem({ protocolId, sectionId, _id, cache, onChange, ...props }) {
	const userId = useUserId();

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: protocolId }),
	}), [protocolId, _id, cache]);

	const { data, state, error } = useEndpointDataExperimental('protocols.findOne', query);
	const { data: currentUser, state: currentUserState, error: currentUserError } = useEndpointDataExperimental('users.getRoles',
		useMemo(() => ({ query: JSON.stringify({ _id: userId }) }), [userId]));
	const { data: currentUserPerson, state: currentUserPersonState } = useEndpointDataExperimental('users.getPerson',
		useMemo(() => ({ query: JSON.stringify({ userId }) }), [userId]));

	const isSecretary = useMemo(() => (currentUser?.roles?.includes('secretary') || currentUser?.roles?.includes('admin')) || false, [currentUser]);

	if ([state, currentUserState, currentUserPersonState].includes(ENDPOINT_STATES.LOADING)) {
		return <Box pb='x20'>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<Skeleton mbs='x8'/>
			<InputBox.Skeleton w='full'/>
			<ButtonGroup stretch w='full' mbs='x8'>
				<Button disabled><Throbber inheritColor/></Button>
				<Button primary disabled><Throbber inheritColor/></Button>
			</ButtonGroup>
		</Box>;
	}

	if (error || currentUserError || !data || !currentUser) {
		return <Box fontScale='h1' pb='x20'>{error}</Box>;
	}

	return <EditItemWithData protocol={data} isSecretary={isSecretary} sectionId={sectionId} itemId={_id} onChange={onChange} currentUserPersonId={currentUserPerson?._id ?? ''} {...props}/>;
}

function EditItemWithData({ close, onChange, protocol, isSecretary, sectionId, itemId, currentUserPersonId, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();


	const personsData = useEndpointData('persons.listToAutoComplete', useMemo(() => ({ }), [])) || { persons: [] };

	const item = protocol.sections.find(s => s._id === sectionId).items.find(i => i._id === itemId);

	const { _id, num: previousNumber, name: previousName, responsible: previousResponsible, expireAt: previousExpireAt, status: previousStatus } = item || {};
	const previousItem = item || {};

	const [number, setNumber] = useState('');
	const [name, setName] = useState('');
	const [responsible, setResponsible] = useState([]);
	const [expireAt, setExpireAt] = useState('');
	const [status, setStatus] = useState(0);

	useEffect(() => {
		// console.log(item);
		setNumber(previousNumber || '');
		setName(item.name ?? '');
		setResponsible(previousResponsible || '');
		setExpireAt(previousExpireAt && new Date(previousExpireAt));
		setStatus(previousStatus?.state ?? 0);
	}, [previousNumber, previousName, previousResponsible, previousExpireAt, previousStatus, _id]);

	const insertOrUpdateItem = useMethod('insertOrUpdateItem');

	const hasUnsavedChanges = useMemo(() =>
		previousNumber !== number || previousName !== name || previousResponsible !== responsible
		|| new Date(previousExpireAt).getTime() !== new Date(expireAt).getTime() || previousStatus?.state !== status,
	[number, name, responsible, expireAt, status, previousNumber, previousName, previousResponsible, previousExpireAt, previousStatus]);

	const statusOptions = useMemo(() => [[1, t('opened')], [2, t('inProgress')], [3, t('solved')]], []);

	const isStatusCanChange = useMemo(() => {
		const res = previousResponsible?.find((res) => res._id === currentUserPersonId);
		return !!res;
	}, [previousResponsible, currentUserPersonId]);

	const filterNumber = (value) => {
		if (checkRomanNumber(value.toUpperCase()) !== null) {
			setNumber(value.toUpperCase());
		}
	};

	const saveAction = useCallback(async (number, name, responsible, expireAt, status) => {
		const itemData = createItemData(number, name, responsible, expireAt, status, { previousNumber, previousName, _id });
		const validation = validateItemData(itemData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateItem(protocol._id, sectionId, itemData);
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [_id, dispatchToastMessage, insertOrUpdateItem, previousNumber, previousName, previousResponsible, previousExpireAt, previousItem, t]);

	const handleSave = useCallback(async () => {
		console.log(statusOptions);
		const findState = statusOptions.find((state) => state[0] === status);
		console.log(findState);
		await saveAction(number, name, responsible, expireAt, { state: findState[0] ?? 1, title: findState[1] ?? t('opened') });
		close();
		onChange();
	}, [saveAction, close, onChange, number, name, responsible, expireAt, status]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Item_Number')}</Field.Label>
			<Field.Row>
				<InputBox disabled={!isSecretary} value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Item_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Item_Name')}</Field.Label>
			<Field.Row style={!isSecretary ? { cursor: 'not-allowed' } : {}}>
				<CKEditor
					disabled={!isSecretary}
					editor={ ClassicEditor }
					config={ {
						language: 'ru',
						toolbar: ['bold', 'italic', 'link'],
					} }
					data={previousName}
					onChange={ (event, editor) => {
						const data = editor.getData();
						setName(data);
					} }
				/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Item_Responsible')}</Field.Label>
			<Autocomplete
				disabled={!isSecretary}
				multiple
				id='tags-standard'
				value={responsible}
				forcePopupIcon={false}
				options={personsData.persons}
				getOptionLabel={(option) => constructPersonFIO(option)}
				getOptionSelected={(option, value) => option.name === value.name && option.surname === value.surname }
				filterOptions={createFilterOptions({ limit: 10 })}
				filterSelectedOptions
				onChange={(event, value) => setResponsible(value)}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<Chip style={{ backgroundColor: '#e0e0e0', margin: '3px', borderRadius: '16px', color: '#000000DE' }}
							label={constructPersonFIO(option)} {...getTagProps({ index })} />
					))
				}
				renderInput={(params) => (
					<TextField
						{...params}
						variant='outlined'
						placeholder={t('Item_Responsible')}
						style={!isSecretary ? { cursor: 'not-allowed !important' } : {}}
					/>
				)}
			/>
		</Field>
		<Field>
			<Field.Label>{t('Item_ExpireAt')}</Field.Label>
			<Field.Row>
				<DatePicker
					disabled={!isSecretary}
					dateFormat='dd.MM.yyyy'
					selected={expireAt}
					onChange={(newDate) => setExpireAt(newDate)}
					customInput={<TextInput />}
					locale='ru'
				/>
			</Field.Row>
		</Field>
		{ (isSecretary || isStatusCanChange) && previousResponsible?.length > 0 && <Field>
			<Field.Label>{t('Status')}</Field.Label>
			<Field.Row>
				<Select
					style={ { whiteSpace: 'normal' } }
					// border='1px solid #4fb0fc'
					options={statusOptions}
					onChange={(val) => setStatus(val)}
					value={status}
					placeholder={t('Status')}/>
			</Field.Row>
		</Field>}
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
