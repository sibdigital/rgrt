import React, { useState, useMemo, useCallback } from 'react';
import { Field, Button, InputBox, ButtonGroup, TextInput } from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
registerLocale('ru', ru);

import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { validateItemData, createItemData } from './lib';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import CKEditor from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { checkNumberWithDot } from '../../../utils/client/methods/checkNumber';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';

function constructPersonFIO(person) {
	return person.surname + " " + person.name.substr(0,1) + "." + person.patronymic.substr(0,1) + "."
}

export function AddItem({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const personsData = useEndpointData('persons.list', useMemo(() => ({ }), [])) || { persons: [] };

	const [number, setNumber] = useState('');
	const [name, setName] = useState('');
	const [responsible, setResponsible] = useState({});
	const [expireAt, setExpireAt] = useState('');

	const protocolId = useRouteParameter('id');
	const sectionId = useRouteParameter('sectionId');

	const insertOrUpdateItem = useMethod('insertOrUpdateItem');

	const filterNumber = (value) => {
		if (checkNumberWithDot(value, number) !== null || value === '') {
			setNumber(value);
		}
	};

	const saveAction = useCallback(async (number, name, responsible, expireAt) => {
		const itemData = createItemData(number, name, responsible, expireAt);
		const validation = validateItemData(itemData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateItem(protocolId, sectionId, itemData);
			return _id;
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [dispatchToastMessage, insertOrUpdateItem, t]);

	const handleSave = useCallback(async () => {
		try {
			const result = await saveAction(
				number,
				name,
				responsible,
				expireAt
			);
			dispatchToastMessage({ type: 'success', message: t('Item_Added_Successfully') });
			close();
			onChange();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, close, number, name, responsible, expireAt, onChange, saveAction, t]);

	return <VerticalBar.ScrollableContent {...props}>
		<Field>
			<Field.Label>{t('Item_Number')}</Field.Label>
			<Field.Row>
				<InputBox value={number} onChange={(e) => filterNumber(e.currentTarget.value)} placeholder={t('Item_Number')} />
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Item_Name')}</Field.Label>
			<Field.Row>
				<CKEditor
					editor={ ClassicEditor }
					config={ {
						language: 'ru',
						toolbar: [ 'bold', 'italic', 'link' ]
					} }
					data={name}
					onChange={ (event, editor) => {
						const data = editor.getData();
						setName(data);
					} }
				/>
			</Field.Row>
		</Field>
		<Field>
		<Field>
			<Field.Label>{t('Item_Responsible')}</Field.Label>
			<Autocomplete
				multiple
				id="tags-standard"
				options={personsData.persons}
				forcePopupIcon={false}
				getOptionLabel={(option) => constructPersonFIO(option)}
				filterSelectedOptions
				filterOptions={createFilterOptions({ limit: 10 })}
				onChange={(event, value) => setResponsible(value)}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						  <Chip style={{backgroundColor:"#e0e0e0", margin:"3px", borderRadius:"16px", color:"#000000DE"}} 
						  		label={constructPersonFIO(option)} {...getTagProps({ index })} />
					))
				}
				renderInput={(params) => (
					<TextField
						{...params}
						variant="outlined"
						placeholder={t('Item_Responsible')}
					/>
				)}
			/>
		</Field>
		</Field>
		<Field>
			<Field.Label>{t('Item_ExpireAt')}</Field.Label>
			<Field.Row>
				<DatePicker
					dateFormat='dd.MM.yyyy'
					selected={expireAt}
					onChange={(newDate) => setExpireAt(newDate)}
					customInput={<TextInput />}
					locale='ru'
				/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Row>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave} disabled={number === '' || name === ''}>{t('Save')}</Button>
				</ButtonGroup>
			</Field.Row>
		</Field>
	</VerticalBar.ScrollableContent>;
}
