import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Field, Button, InputBox, ButtonGroup, TextInput, Box } from '@rocket.chat/fuselage';
import DatePicker, { registerLocale } from 'react-datepicker';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import ru from 'date-fns/locale/ru';
import { isIOS } from 'react-device-detect';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';

import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { validateItemData, createItemData } from './lib';
import { constructPersonFIO } from '../../../utils/client/methods/constructPersonFIO';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { checkNumber } from '../../../utils/client/methods/checkNumber';

registerLocale('ru', ru);

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction], prevResponsibleIds) => useMemo(() => ({
	query: JSON.stringify({
		$and: [{
			$or: [{
				surname: { $regex: text || '', $options: 'i' },
			}, {
				name: { $regex: text || '', $options: 'i' },
			}, {
				patronymic: { $regex: text || '', $options: 'i' },
			}],
		}, {
			_id: { $not: { $in: prevResponsibleIds ?? [] } },
		}],
	}),
	fields: JSON.stringify({ surname: 1, name: 1, patronymic: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, column, direction, prevResponsibleIds, itemsPerPage, current]);

export function AddItem({ goToNew, close, onChange, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const protocolId = useRouteParameter('id');
	const sectionId = useRouteParameter('sectionId');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 10 });
	const [sort, setSort] = useState(['surname']);
	const [number, setNumber] = useState('');
	const [name, setName] = useState('');
	const [responsible, setResponsible] = useState([]);
	const [expireAt, setExpireAt] = useState('');

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const responsibleId = useMemo(() => responsible?.map((_responsible) => _responsible._id), [responsible]);

	const personsQuery = useQuery(debouncedParams, debouncedSort, responsibleId);

	const personsData = useEndpointData('persons.listToAutoComplete', personsQuery) || { persons: [] };

	const maxItemNumber = useEndpointData('protocols.getProtocolItemMaxNumber', useMemo(() => ({
		query: JSON.stringify({ _id: protocolId, sectionId }),
	}), [protocolId, sectionId]));

	useEffect(() => {
		if (maxItemNumber && maxItemNumber.number) {
			setNumber(maxItemNumber.number);
		}
	}, [maxItemNumber]);

	const insertOrUpdateItem = useMethod('insertOrUpdateItem');

	const filterNumber = (value) => {
		if (checkNumber(value) !== null) {
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
				expireAt,
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
						toolbar: ['bold', 'italic', 'link'],
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
			<Field.Label>{t('Item_Responsible')}</Field.Label>
			<Autocomplete
				multiple
				id='tags-standard'
				options={personsData?.persons ?? []}
				forcePopupIcon={false}
				getOptionLabel={(option) => constructPersonFIO(option)}
				renderOption={(option, state) =>
					<Box
						style={{ cursor: 'pointer' }}
						zIndex='100'
						width='100%'
						height='100%'
						onTouchStart={() => isIOS && setResponsible([...responsible, option]) }
					>
						{constructPersonFIO(option)}
					</Box>
				}
				filterSelectedOptions
				filterOptions={createFilterOptions({ limit: 10 })}
				onChange={(event, value) => !isIOS && setResponsible(value)}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<Chip style={{ backgroundColor: '#e0e0e0', margin: '3px', borderRadius: '16px', color: '#000000DE' }}
							label={constructPersonFIO(option)} {...getTagProps({ index })} />
					))
				}
				renderInput={(params) => (
					<TextField
						{...params}
						style={{ touchAction: 'none' }}
						variant='outlined'
						placeholder={t('Item_Responsible')}
						onChange={(e) => setParams({ current: 0, itemsPerPage: 10, text: e.currentTarget.value }) }
					/>
				)}
				noOptionsText={
					<Button
						style={{ touchAction: 'none' }}
						// onMouseDown={() => !isIOS && onCreateNewPerson()}
						// onTouchStart={() => isIOS && onCreateNewPerson()}
						backgroundColor='inherit'
						borderColor='lightgrey'
						borderWidth='0.5px'
						textAlign='center'
						width='100%'
					>
						{ t('Participant_Create') }
					</Button>
				}
				onClose={(event, reason) => setParams({ current: 0, itemsPerPage: 10, text: '' }) }
			/>
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
